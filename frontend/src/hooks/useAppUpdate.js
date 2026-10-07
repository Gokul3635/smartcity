import { useState, useEffect, useCallback, useRef } from 'react';
import { checkForUpdates, performUpdate, getLocalVersion, isNativePlatform } from '../utils/appUpdate';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * useAppUpdate - React hook for app version management.
 *
 * Returns:
 *   - checking: boolean (currently checking for updates)
 *   - updateAvailable: boolean (a newer version was detected)
 *   - currentVersion: string|null (the currently running version)
 *   - remoteVersion: string|null (the latest deployed version)
 *   - isNative: boolean (running inside Capacitor native shell)
 *   - checkNow: () => void (manually trigger a check)
 *   - applyUpdate: () => Promise<void> (perform the update + reload)
 */
export function useAppUpdate() {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [remoteVersion, setRemoteVersion] = useState(null);
  const [isNative, setIsNative] = useState(false);
  const intervalRef = useRef(null);

  const doCheck = useCallback(async () => {
    setChecking(true);
    try {
      const result = await checkForUpdates();
      const local = await getLocalVersion();
      setCurrentVersion(local?.version || '1.0.0');
      setRemoteVersion(result.remoteVersion?.version || null);
      setUpdateAvailable(result.available);
      return result;
    } catch {
      // Silently fail — updates are non-critical
      return { available: false, remoteVersion: null, localVersion: null };
    } finally {
      setChecking(false);
    }
  }, []);

  // Initial check and periodic polling
  useEffect(() => {
    setIsNative(isNativePlatform());

    // Check immediately on mount
    doCheck();

    // Then check periodically
    intervalRef.current = setInterval(doCheck, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [doCheck]);

  const applyUpdate = useCallback(async () => {
    setChecking(true);
    try {
      await performUpdate();
    } catch {
      // Update will reload anyway
    }
  }, []);

  return {
    checking,
    updateAvailable,
    currentVersion,
    remoteVersion,
    isNative,
    checkNow: doCheck,
    applyUpdate
  };
}
