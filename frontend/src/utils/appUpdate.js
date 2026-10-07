/**
 * App Update Utility
 *
 * Cross-platform update checker and executor.
 * - Web/Desktop: Fetches version.json from the server, compares with cached version,
 *   clears caches + service workers + hard reloads if a newer version is found.
 * - Android (Capacitor): Uses the same web approach since web content is server-served,
 *   with fallback to @capacitor/app native info.
 */

import { Capacitor } from '@capacitor/core';

const VERSION_STORAGE_KEY = 'smartcity_app_version';
const VERSION_JSON_PATH = '/version.json?v=' + Date.now();

/**
 * Returns true if running inside a Capacitor native shell (Android/iOS).
 */
export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}


/**
 * Fetches the deployed version metadata from the server.
 * Returns null on failure (network error, parse error, etc.).
 */
export async function fetchRemoteVersion() {
  try {
    const baseUrl = isNativePlatform() ? 'https://smartcity-sand.vercel.app' : '';
    const res = await fetch(`${baseUrl}/version.json?v=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Returns the last known version stored in localStorage.
 */
export function getCachedVersion() {
  try {
    const raw = localStorage.getItem(VERSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persists the given version object to localStorage.
 */
export function cacheVersion(versionObj) {
  try {
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versionObj));
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Compares two version strings semantically (e.g. "1.2.3" > "1.0.0").
 * Returns true if versionA is newer than versionB.
 */
function isNewerVersion(versionA, versionB) {
  const partsA = versionA.split('.').map(Number);
  const partsB = versionB.split('.').map(Number);
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const a = partsA[i] || 0;
    const b = partsB[i] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

/**
 * Gets the current running version of the app.
 * - On native: Fetches from the local packaged version.json. If that fails, falls back to @capacitor/app native version.
 * - On web: Uses the cached version in localStorage (representing what is loaded in the browser), falling back to local version.json.
 */
export async function getLocalVersion() {
  let bundled = null;
  try {
    const res = await fetch(window.location.origin + '/version.json?v=' + Date.now(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      bundled = await res.json();
    }
  } catch (e) {
    // Fail silently
  }

  if (isNativePlatform()) {
    if (bundled && bundled.version) {
      return bundled;
    }
    // Fallback to Capacitor App info if fetch fails
    try {
      const { App } = await import('@capacitor/app');
      const info = await App.getInfo();
      if (info && info.version) {
        return {
          version: info.version,
          buildNumber: parseInt(info.build) || 1,
          buildDate: new Date().toISOString()
        };
      }
    } catch (e) {
      // Fail silently
    }
  }

  const cached = getCachedVersion();
  if (cached && cached.version) {
    return cached;
  }

  if (bundled && bundled.version) {
    return bundled;
  }

  return { version: '1.0.0', buildNumber: 1 };
}

/**
 * Checks if a newer version is available on the server.
 *
 * Returns an object:
 *   { available: boolean, remoteVersion: object|null, localVersion: object|null }
 */
export async function checkForUpdates() {
  const remote = await fetchRemoteVersion();
  const local = (await getLocalVersion()) || { version: '1.0.0', buildNumber: 1 };

  if (!remote || !remote.version) {
    return { available: false, remoteVersion: null, localVersion: local };
  }

  // Compare versions
  const available = isNewerVersion(remote.version, local.version) || 
                    (remote.version === local.version && remote.buildNumber !== local.buildNumber);

  // For Web only, sync version to localStorage so subsequent page loads are aware
  if (!isNativePlatform()) {
    const cached = getCachedVersion();
    if (!cached || cached.version !== local.version) {
      cacheVersion(local);
    }
  }

  return { available, remoteVersion: remote, localVersion: local };
}

/**
 * Performs a full app update:
 * 1. Updates the cached version
 * 2. Clears all browser caches
 * 3. Unregisters service workers
 * 4. Forces a hard reload
 *
 * On Capacitor Android, opens the APK download link in the native system browser.
 */
export async function performUpdate() {
  if (isNativePlatform()) {
    // Open system browser to download APK
    window.open('https://smartcity-sand.vercel.app/app-release.apk', '_system');
    return;
  }

  // First, update the cached version with the latest from server
  const remote = await fetchRemoteVersion();
  if (remote) {
    cacheVersion(remote);
  }

  // Clear all browser caches
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((name) => caches.delete(name)));
    } catch {
      // Some caches may be protected
    }
  }

  // Unregister service workers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    } catch {
      // May fail in some browsers
    }
  }

  // Hard reload with cache bypass after a short delay
  setTimeout(() => {
    window.location.reload(true);
  }, 500);
}


