import React from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';

interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
}

interface ChartSuiteProps {
  data: ChartDataPoint[];
  type: 'line' | 'area' | 'bar' | 'pie';
  title?: string;
  height?: number;
  colors?: string[];
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  animated?: boolean;
}

const defaultColors = [
  'var(--color-primary-500)',
  'var(--color-success-500)',
  'var(--color-warning-500)',
  'var(--color-error-500)',
  'var(--color-primary-400)',
  'var(--color-success-400)'
];

export const ChartSuite: React.FC<ChartSuiteProps> = ({ 
  data, 
  type, 
  title, 
  height = 300, 
  colors = defaultColors,
  className,
  showGrid = true,
  showLegend = true,
  animated = true
}) => {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
            <XAxis 
              dataKey="name" 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
            {showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={colors[0]} 
              strokeWidth={3}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
              animationDuration={animated ? 1000 : 0}
            />
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
            <XAxis 
              dataKey="name" 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
            {showLegend && <Legend />}
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={colors[0]} 
              fill={`url(#gradient-${type})`}
              strokeWidth={2}
              animationDuration={animated ? 1000 : 0}
            />
            <defs>
              <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0}/>
              </linearGradient>
            </defs>
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
            <XAxis 
              dataKey="name" 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
            {showLegend && <Legend />}
            <Bar 
              dataKey="value" 
              fill={colors[0]}
              radius={[4, 4, 0, 0]}
              animationDuration={animated ? 1000 : 0}
            />
          </BarChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationDuration={animated ? 1000 : 0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
            {showLegend && <Legend />}
          </PieChart>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {title && (
        <h3 className="text-lg font-semibold text-text-primary mb-4">{title}</h3>
      )}
      <div className="bg-surface-elevated rounded-xl p-4 border border-border shadow-sm">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export { LineChart, AreaChart, BarChart, PieChart };

interface KPIStatProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral' | { value: number; direction: 'up' | 'down' | 'neutral' };
  icon?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
}

export const KPIStat: React.FC<KPIStatProps> = ({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon,
  className,
  variant = 'default'
}) => {
  // Normalize trend prop
  const normalizedTrend = typeof trend === 'object' ? trend.direction : trend;
  const trendValue = typeof trend === 'object' ? trend.value : change;
  
  const trendColors = {
    up: 'text-success-500',
    down: 'text-error-500',
    neutral: 'text-text-secondary'
  };

  const trendIcons = {
    up: '▲',
    down: '▼',
    neutral: '●'
  };

  const variantClasses = {
    default: 'bg-surface-elevated border-border',
    accent: 'bg-primary-50 border-primary-200 text-primary-700',
    success: 'bg-success-50 border-success-200 text-success-700',
    warning: 'bg-warning-50 border-warning-200 text-warning-700',
    error: 'bg-error-50 border-error-200 text-error-700'
  };

  return (
    <div className={cn(
      "dashboard-stat-card p-4 rounded-lg border shadow-sm transition-all duration-base hover:shadow-md",
      variantClasses[variant],
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        {icon && (
          <div className="dashboard-stat-icon w-8 h-8 rounded-md flex items-center justify-center">
            <div className="w-4 h-4 opacity-60">{icon}</div>
          </div>
        )}
      </div>
      <div className="mb-1">
        <h3 className="dashboard-stat-value text-xl font-semibold">{value}</h3>
      </div>
      <p className="dashboard-stat-label text-xs font-medium uppercase tracking-wide opacity-80 mb-2">
        {title}
      </p>
      {trendValue !== undefined && (
        <div className={cn("dashboard-stat-change inline-flex items-center px-2 py-1 rounded text-xs font-medium mt-2", trendColors[normalizedTrend])}>
          <span className="mr-1">{trendIcons[normalizedTrend]}</span>
          <span>{Math.abs(trendValue)}%</span>
        </div>
      )}
    </div>
  );
};

interface KPIStatGroupProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'compact' | 'normal' | 'relaxed';
  sx?: React.CSSProperties;
}

export const KPIStatGroup: React.FC<KPIStatGroupProps> = ({ 
  children, 
  className,
  columns = 4,
  gap = 'compact',
  sx
}) => {
  const gapClasses = {
    compact: 'gap-2 md:gap-4',
    normal: 'gap-4 md:gap-6',
    relaxed: 'gap-6 md:gap-8'
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6'
  };

  return (
    <div 
      className={cn(
        "grid",
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
      style={sx}
    >
      {children}
    </div>
  );
};

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  value, 
  max = 100, 
  className,
  variant = 'default',
  size = 'md',
  showLabel = false,
  animated = true
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const variantColors = {
    default: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500'
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(
        "w-full bg-border rounded-full overflow-hidden",
        sizeClasses[size]
      )}>
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-slow",
            variantColors[variant],
            animated && "ease-out"
          )}
          style={{ 
            width: `${percentage}%`,
            transitionDelay: animated ? '100ms' : '0ms'
          }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-text-secondary">Progress</span>
          <span className="text-sm font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
};