import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../api/client';

let ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  let { user, setUser } = useAuth();
  let preference = user?.themePreference || 'light';
  let [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    let mql = window.matchMedia('(prefers-color-scheme: dark)');
    let handler = (e) => setSystemDark(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  let effective = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effective);
  }, [effective]);

  async function setPreference(pref) {
    let data = await apiFetch('/auth/theme', {
      method: 'PATCH',
      body: JSON.stringify({ themePreference: pref }),
    });
    setUser(data.user);
  }

  let value = { preference, effective, setPreference };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  let ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
