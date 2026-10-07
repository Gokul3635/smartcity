import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { supabase } from '../api/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const u = await api.auth.me();
          if (isMounted) setUser(u);
        } catch {
          localStorage.removeItem('token');
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.warn('Supabase signOut failed during session check:', e.message);
          }
        }
      }
      if (isMounted) setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const currentToken = localStorage.getItem('token');
        if (currentToken !== session.access_token) {
          localStorage.setItem('token', session.access_token);
          try {
            const u = await api.auth.me();
            if (isMounted) {
              setUser(u);
              setLoading(false);
            }
          } catch (err) {
            console.error('Profile sync failed:', err);
          }
        }
      } else {
        if (localStorage.getItem('token')) {
          localStorage.removeItem('token');
          if (isMounted) setUser(null);
        }
      }
    });

    let deepLinkListener;
    if (Capacitor.isNativePlatform()) {
      deepLinkListener = CapApp.addListener('appUrlOpen', async (event) => {
        try {
          const urlStr = event.url.replace('com.smartcity.app://', 'http://localhost/');
          const parsed = new URL(urlStr);
          const hash = parsed.hash.substring(1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (error) throw error;
          }
        } catch (e) {
          console.error('Failed to parse deep link session:', e);
        }
      });
    }

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      if (deepLinkListener) {
        deepLinkListener.then(l => l.remove());
      }
    };
  }, []);

  const login = async (email, password) => {
    const { token, user: u } = await api.auth.login(email, password);
    localStorage.setItem('token', token);
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const { token, user: u } = await api.auth.register(data);
    localStorage.setItem('token', token);
    setUser(u);
    return u;
  };

  const loginWithGoogle = async () => {
    const redirectTo = Capacitor.isNativePlatform()
      ? 'com.smartcity.app://'
      : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut failed:', e.message);
    }
  };

  const updateUser = (updated) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      loginWithGoogle, 
      logout, 
      updateUser, 
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
