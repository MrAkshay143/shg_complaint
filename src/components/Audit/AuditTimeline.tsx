import React from 'react';
import { cn } from '../../lib/utils';
import './audit-timeline.css';

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  user: string;
  action: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  metadata?: Record<string, unknown>;
}

interface AuditTimelineProps {
  items: TimelineItem[];
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showUser?: boolean;
  showStatus?: boolean;
  interactive?: boolean;
  onItemClick?: (item: TimelineItem) => void;
}

const statusIcons = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️'
};

const statusColors = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info'
};

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ 
  items, 
  className,
  variant = 'default',
  showUser = true,
  showStatus = true,
  interactive = false,
  onItemClick
}) => {
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const itemTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - itemTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cn("audit-timeline", className)}>
      {/* Timeline Line */}
      <div className="audit-timeline-list">
        {items.map((item) => (
          <div 
            key={item.id}
            className={cn(
              "audit-timeline-item",
              `audit-timeline-dot ${item.status || 'info'}`,
              interactive && "interactive",
              onItemClick && "cursor-pointer"
            )}
            onClick={() => interactive && onItemClick?.(item)}
          >
            {/* Timeline Dot */}
            <div className={cn(
              "audit-timeline-dot",
              statusColors[item.status || 'info'],
              variant === 'compact' && "compact"
            )}>
              {showStatus && statusIcons[item.status || 'info']}
            </div>
            
            {/* Content */}
            <div className={cn("audit-timeline-content", variant === 'compact' && "compact")}>
              <div className={cn(
                "audit-timeline-item-header",
                variant === 'compact' && "compact"
              )}>
                <div className="audit-timeline-item-content">
                  <h4 className={cn(
                    "audit-timeline-item-title",
                    variant === 'compact' && "compact"
                  )}>
                    {item.title}
                  </h4>
                  
                  {variant !== 'compact' && (
                    <p className="audit-timeline-description">
                      {item.description}
                    </p>
                  )}
                  
                  <div className={cn(
                    "audit-timeline-item-meta",
                    variant === 'compact' && "compact"
                  )}>
                    <span className="audit-timeline-meta-item">
                      <span className="audit-timeline-meta-icon">🕒</span>
                      {getRelativeTime(item.timestamp)}
                    </span>
                    
                    {showUser && (
                      <span className="audit-timeline-meta-item">
                        <span className="audit-timeline-meta-icon">👤</span>
                        {item.user}
                      </span>
                    )}
                    
                    <span className="audit-timeline-meta-item">
                      <span className="audit-timeline-meta-icon">⚡</span>
                      {item.action}
                    </span>
                  </div>
                  
                  {variant === 'detailed' && item.metadata && (
                    <div className="audit-timeline-details">
                      <div className="audit-timeline-details-list">
                        {Object.entries(item.metadata).map(([key, value]) => (
                          <div key={key} className="audit-timeline-details-item">
                            <span className="audit-timeline-details-label">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="audit-timeline-details-value">{JSON.stringify(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={cn(
                  "audit-timeline-item-time",
                  variant === 'compact' && "compact"
                )}>
                  {formatTimestamp(item.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {items.length === 0 && (
        <div className="audit-timeline-empty">
          <div className="audit-timeline-empty-icon">📋</div>
          <p className="audit-timeline-empty-text">No audit trail available</p>
        </div>
      )}
    </div>
  );
};

interface ActivityLogProps {
  items: TimelineItem[];
  className?: string;
  title?: string;
  showFilter?: boolean;
  onFilterChange?: (status: string) => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ 
  items, 
  className,
  title = "Activity Log",
  showFilter = true,
  onFilterChange
}) => {
  const [filter, setFilter] = React.useState<string>('all');
  
  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.status === filter);
  
  const statusOptions = [
    { value: 'all', label: 'All Activities' },
    { value: 'success', label: 'Success' },
    { value: 'warning', label: 'Warnings' },
    { value: 'error', label: 'Errors' },
    { value: 'info', label: 'Info' }
  ];

  return (
    <div className={cn("audit-timeline-wrapper", className)}>
      <div className="audit-timeline-header">
        <h3 className="audit-timeline-title">{title}</h3>
        
        {showFilter && (
          <select 
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              onFilterChange?.(e.target.value);
            }}
            className="audit-timeline-filter-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
      
      <AuditTimeline 
        items={filteredItems}
        variant="detailed"
        showUser={true}
        showStatus={true}
      />
    </div>
  );
};