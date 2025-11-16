import React from 'react';
import { cn } from '../../lib/utils';
import './layout.css';

interface AppShellAdaptiveProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'wide';
}

export const AppShellAdaptive: React.FC<AppShellAdaptiveProps> = ({ 
  children, 
  className,
  variant = 'default' 
}) => {
  return (
    <div className={cn(
      "min-h-screen bg-background text-text-primary transition-colors duration-base",
      "flex flex-col md:flex-row",
      variant === 'compact' && "max-w-7xl mx-auto",
      variant === 'wide' && "max-w-full",
      className
    )}>
      {children}
    </div>
  );
};

interface NavRailCompactProps {
  children: React.ReactNode;
  className?: string;
  isCollapsed?: boolean;
  position?: 'left' | 'right';
}

export const NavRailCompact: React.FC<NavRailCompactProps> = ({ 
  children, 
  className,
  isCollapsed = false,
  position = 'left'
}) => {
  return (
    <nav className={cn(
      "bg-surface-elevated/80 backdrop-blur-xl border-border transition-all duration-base",
      "flex flex-col",
      position === 'left' ? "border-r" : "border-l",
      isCollapsed ? "w-16" : "w-64 md:w-72",
      "fixed md:relative h-screen z-[var(--z-index-sticky)]",
      "shadow-lg shadow-black/5",
      "dark:bg-surface-elevated/90 dark:backdrop-blur-lg dark:shadow-black/20",
      className
    )}>
      {children}
    </nav>
  );
};

interface HeaderBarTransparentProps {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
  glass?: boolean;
}

export const HeaderBarTransparent: React.FC<HeaderBarTransparentProps> = ({ 
  children, 
  className,
  sticky = true,
  glass = true
}) => {
  return (
    <header className={cn(
      "top-0 z-[var(--z-index-fixed)] transition-all duration-base",
      sticky && "sticky",
      glass && "backdrop-blur-lg bg-glass-bg/50 border-b border-glass-border",
      "px-4 md:px-6 py-4",
      className
    )}>
      {children}
    </header>
  );
};

interface ContentAreaProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'compact' | 'normal' | 'relaxed';
}

export const ContentArea: React.FC<ContentAreaProps> = ({ 
  children, 
  className,
  padding = 'normal'
}) => {
  const paddingClasses = {
    none: '',
    compact: 'p-2 md:p-4',
    normal: 'p-4 md:p-6 lg:p-8',
    relaxed: 'p-6 md:p-8 lg:p-12'
  };

  return (
    <main className={cn(
      "flex-1 overflow-auto transition-all duration-base",
      paddingClasses[padding],
      "bg-background-subtle",
      className
    )}>
      {children}
    </main>
  );
};

interface GlassSurfaceProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
  interactive?: boolean;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({ 
  children, 
  className,
  variant = 'default',
  interactive = false
}) => {
  const variantClasses = {
    default: 'bg-glass-bg border border-glass-border shadow-glass',
    elevated: 'bg-glass-bg border border-glass-border shadow-xl',
    subtle: 'bg-glass-bg/30 border border-glass-border/50 shadow-sm'
  };

  return (
    <div className={cn(
      variantClasses[variant],
      "backdrop-blur-lg rounded-lg transition-all duration-base",
      interactive && "hover:shadow-xl hover:scale-[1.02] cursor-pointer",
      className
    )}>
      {children}
    </div>
  );
};