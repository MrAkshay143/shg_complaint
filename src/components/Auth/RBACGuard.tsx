import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { GlassSurface } from '../Layout/AppShell';

interface RBACGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
  fallbackMessage?: string;
}

export const RBACGuard: React.FC<RBACGuardProps> = ({ 
  children, 
  allowedRoles, 
  fallback,
  fallbackMessage = "You don't have permission to access this content."
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return (
      <GlassSurface className="p-8 text-center">
        <div className="text-text-secondary">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p>Please log in to access this content.</p>
        </div>
      </GlassSurface>
    );
  }

  const hasPermission = allowedRoles.includes(user.role);
  
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <GlassSurface className="p-8 text-center">
        <div className="text-text-secondary">
          <div className="text-4xl mb-4">🚫</div>
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p>{fallbackMessage}</p>
          <p className="text-sm mt-2 opacity-60">
            Your role: <span className="font-medium">{user.role}</span>
          </p>
        </div>
      </GlassSurface>
    );
  }

  return <>{children}</>;
};

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
  userPermissions: string[];
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  requiredPermission, 
  userPermissions, 
  fallback 
}) => {
  const hasPermission = userPermissions.includes(requiredPermission);
  
  if (!hasPermission) {
    return fallback || null;
  }

  return <>{children}</>;
};

interface FeatureFlagProps {
  children: React.ReactNode;
  flag: string;
  enabledFeatures: string[];
  fallback?: React.ReactNode;
}

export const FeatureFlag: React.FC<FeatureFlagProps> = ({ 
  children, 
  flag, 
  enabledFeatures, 
  fallback 
}) => {
  const isEnabled = enabledFeatures.includes(flag);
  
  if (!isEnabled) {
    return fallback || null;
  }

  return <>{children}</>;
};