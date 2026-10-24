import { useEffect } from 'react';

export type Theme = 'light';

export function useTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    try {
      localStorage.setItem('reviewqr_theme', 'light');
    } catch {}
  }, []);

  const toggleTheme = () => {
    // Pure Light Mode only - dark mode removed
    const root = document.documentElement;
    root.classList.remove('dark');
  };

  return {
    theme: 'light' as const,
    setTheme: () => {},
    toggleTheme,
    isDark: false
  };
}
