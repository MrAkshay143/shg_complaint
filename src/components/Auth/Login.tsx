import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  EyeSlashIcon,
  MoonIcon,
  SunIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import { useCustomTheme } from '../../hooks/useCustomTheme';
import './login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const { theme, toggleTheme } = useCustomTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(email, password);
    } catch {
      // Error is handled in the store
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!mounted) return null;

  return (
    <div className={`page-container ${theme}`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="login-theme-toggle"
        aria-label="Toggle theme"
      >
        <div className="login-theme-toggle-icons">
          <SunIcon className={`login-theme-icon ${theme === 'dark' ? 'active' : ''}`} />
          <MoonIcon className={`login-theme-icon ${theme === 'dark' ? '' : 'active'}`} />
        </div>
      </button>

      {/* Main Login Card */}
      <div className={`login-card-wrapper ${mounted ? 'mounted' : ''}`}>
        <div className="form-card">
          {/* Logo Section */}
          <div className="login-logo-section">
            <div className="login-logo">
              <BuildingOfficeIcon className="login-logo-icon" />
            </div>
            <h1 className="page-title">Shalimar Poultry</h1>
            <h2 className="page-subtitle">Complaint Management System</h2>
            <p className="login-description">Admin & Executive Portal</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="login-error">
              <span>{error}</span>
              <button 
                onClick={clearError}
                className="login-error-close"
                aria-label="Close error message"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-group">
              <label className="login-label">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className={`login-input ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                autoComplete="email"
                required
              />
            </div>

            <div className="login-form-group">
              <label className="login-label">
                Password
              </label>
              <div className="login-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={`login-input ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={handleTogglePasswordVisibility}
                  className="login-password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-submit-btn"
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="login-loading" />
                  <span style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>Signing In...</span>
                </div>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Sign In
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="login-footer-text">
              Use your <span className="login-footer-highlight">@shalimarcorp.in</span> email to login
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}