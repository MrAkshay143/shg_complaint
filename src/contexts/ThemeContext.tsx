import { useEffect, useState } from 'react';
import { ThemeContext, type Theme } from './ThemeConstants';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const CustomThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('vite-ui-theme') as Theme;
    return stored || defaultTheme;
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('vite-ui-theme', theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};



// Legacy ThemeProvider for backward compatibility
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  return (
    <CustomThemeProvider defaultTheme={defaultTheme}>
      {children}
    </CustomThemeProvider>
  );
};