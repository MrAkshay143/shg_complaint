import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeConstants';

export const useCustomTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error('useCustomTheme must be used within a CustomThemeProvider');

  return context;
};