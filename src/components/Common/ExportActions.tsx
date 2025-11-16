import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface ExportActionsProps {
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
  onPrint?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'icon-only';
  disabled?: boolean;
  loading?: boolean;
}

export const ExportActions: React.FC<ExportActionsProps> = ({ 
  onExportExcel, 
  onExportPDF, 
  onExportCSV,
  onPrint,
  className,
  variant = 'default',
  disabled = false,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const exportOptions = [
    {
      key: 'excel',
      label: 'Export Excel',
      icon: '📊',
      action: onExportExcel,
      description: 'Download as Excel spreadsheet'
    },
    {
      key: 'pdf',
      label: 'Export PDF',
      icon: '📄',
      action: onExportPDF,
      description: 'Download as PDF document'
    },
    {
      key: 'csv',
      label: 'Export CSV',
      icon: '📋',
      action: onExportCSV,
      description: 'Download as CSV file'
    },
    {
      key: 'print',
      label: 'Print',
      icon: '🖨️',
      action: onPrint,
      description: 'Print current view'
    }
  ].filter(option => option.action);

  const handleExport = async (key: string, action?: () => void) => {
    if (!action || disabled || loading) return;
    
    setActiveAction(key);
    setIsOpen(false);
    
    try {
      await action();
    } catch (error) {
      console.error(`Export ${key} failed:`, error);
    } finally {
      setActiveAction(null);
    }
  };

  if (variant === 'icon-only') {
    return (
      <div className={cn("relative", className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className={cn(
            "p-2 rounded-lg border border-border bg-surface hover:bg-surface-subtle transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            loading && "animate-pulse"
          )}
          title="Export Options"
        >
          {loading && activeAction ? '⏳' : '📤'}
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated rounded-lg border border-border shadow-lg z-[var(--z-index-dropdown)]">
            {exportOptions.map(option => (
              <button
                key={option.key}
                onClick={() => handleExport(option.key, option.action)}
                className="w-full px-4 py-3 text-left hover:bg-surface-subtle transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-border last:border-b-0"
                disabled={disabled || loading}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{option.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-text-secondary">{option.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {exportOptions.slice(0, 2).map(option => (
          <button
            key={option.key}
            onClick={() => handleExport(option.key, option.action)}
            disabled={disabled || loading}
            className={cn(
              "px-3 py-2 text-sm rounded-lg border border-border bg-surface hover:bg-surface-subtle transition-colors flex items-center gap-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              loading && activeAction === option.key && "animate-pulse"
            )}
            title={option.description}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
        
        {exportOptions.length > 2 && (
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              disabled={disabled || loading}
              className={cn(
                "px-3 py-2 text-sm rounded-lg border border-border bg-surface hover:bg-surface-subtle transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                loading && "animate-pulse"
              )}
            >
              More ▼
            </button>
            
            {isOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-surface-elevated rounded-lg border border-border shadow-lg z-[var(--z-index-dropdown)]">
                {exportOptions.slice(2).map(option => (
                  <button
                    key={option.key}
                    onClick={() => handleExport(option.key, option.action)}
                    className="w-full px-4 py-2 text-left hover:bg-surface-subtle transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-border last:border-b-0 text-sm"
                    disabled={disabled || loading}
                  >
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <span className="text-sm font-medium text-text-secondary">Export:</span>
      {exportOptions.map(option => (
        <button
          key={option.key}
          onClick={() => handleExport(option.key, option.action)}
          disabled={disabled || loading}
          className={cn(
            "px-4 py-2 rounded-lg border border-border bg-surface hover:bg-surface-subtle transition-colors flex items-center gap-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            loading && activeAction === option.key && "animate-pulse opacity-75"
          )}
          title={option.description}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
          {loading && activeAction === option.key && (
            <span className="ml-1 animate-spin">⏳</span>
          )}
        </button>
      ))}
    </div>
  );
};

interface BulkActionsProps {
  selectedItems: string[];
  onBulkDelete?: () => void;
  onBulkExport?: () => void;
  onBulkUpdate?: () => void;
  className?: string;
  disabled?: boolean;
}

export const BulkActions: React.FC<BulkActionsProps> = ({ 
  selectedItems,
  onBulkDelete,
  onBulkExport,
  onBulkUpdate,
  className,
  disabled = false
}) => {
  if (selectedItems.length === 0) return null;

  const actions = [
    {
      key: 'update',
      label: `Update (${selectedItems.length})`,
      icon: '✏️',
      action: onBulkUpdate,
      variant: 'primary'
    },
    {
      key: 'export',
      label: `Export (${selectedItems.length})`,
      icon: '📤',
      action: onBulkExport,
      variant: 'secondary'
    },
    {
      key: 'delete',
      label: `Delete (${selectedItems.length})`,
      icon: '🗑️',
      action: onBulkDelete,
      variant: 'danger'
    }
  ].filter(action => action.action);

  return (
    <div className={cn("flex items-center gap-2 p-4 bg-surface-elevated rounded-lg border border-border", className)}>
      <span className="text-sm font-medium text-text-secondary">
        {selectedItems.length} items selected
      </span>
      
      <div className="flex items-center gap-2 ml-auto">
        {actions.map(action => (
          <button
            key={action.key}
            onClick={action.action}
            disabled={disabled}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5",
              action.variant === 'primary' && "bg-primary-600 text-white hover:bg-primary-700",
              action.variant === 'secondary' && "bg-surface text-text-primary hover:bg-surface-subtle border border-border",
              action.variant === 'danger' && "bg-error-600 text-white hover:bg-error-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};