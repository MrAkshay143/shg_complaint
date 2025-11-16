import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ChartPieIcon,
  ClockIcon as TrendIcon
} from '@heroicons/react/24/outline';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import { useCustomTheme } from '../../hooks/useCustomTheme';
import { LineChart, BarChart, PieChart } from '../Charts/ChartSuite';
import { AuditTimeline } from '../Audit/AuditTimeline';
import { ExportActions } from '../Common/ExportActions';
import './dashboard.css';

interface DashboardStats {
  stats: {
    totalComplaints: number;
    openComplaints: number;
    resolvedComplaints: number;
    closedComplaints: number;
    criticalComplaints: number;
    slaBreaches: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    createdAt: string;
    farmer?: {
      name: string;
    };
    createdByUser?: {
      name: string;
    };
  }>;
  zoneStats: Array<{
    zone?: {
      name: string;
    };
    dataValues?: {
      complaintCount: number;
    };
    complaintCount?: number;
  }>;
}

interface ComplaintTrend {
  date: string;
  received: number;
  resolved: number;
  pending: number;
}

interface PriorityDistribution {
  name: string;
  value: number;
  color: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<ComplaintTrend[]>([]);
  const [priorityData, setPriorityData] = useState<PriorityDistribution[]>([]);
  const { user } = useAuthStore();
  const { theme } = useCustomTheme();

  useEffect(() => {
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.dashboard.stats();
      setStats(data);
      
      generateTrendData();
      generatePriorityData();
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = () => {
    const mockTrend: ComplaintTrend[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      mockTrend.push({
        date: date.toISOString().split('T')[0],
        received: Math.floor(Math.random() * 10) + 5,
        resolved: Math.floor(Math.random() * 8) + 3,
        pending: Math.floor(Math.random() * 5) + 2,
      });
    }
    
    setTrendData(mockTrend);
  };

  const generatePriorityData = () => {
    const mockPriority: PriorityDistribution[] = [
      { name: 'Critical', value: Math.floor(Math.random() * 10) + 5, color: '#f44336' },
      { name: 'High', value: Math.floor(Math.random() * 15) + 8, color: '#ff9800' },
      { name: 'Medium', value: Math.floor(Math.random() * 20) + 10, color: '#2196f3' },
      { name: 'Low', value: Math.floor(Math.random() * 12) + 3, color: '#4caf50' },
    ];
    
    setPriorityData(mockPriority);
  };

  const getResolutionRate = () => {
    if (!stats) return 0;
    const { resolvedComplaints, totalComplaints } = stats.stats;
    return totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;
  };

  const getSLAComplianceRate = () => {
    if (!stats) return 100;
    const { totalComplaints, slaBreaches } = stats.stats;
    return totalComplaints > 0 ? Math.round(((totalComplaints - slaBreaches) / totalComplaints) * 100) : 100;
  };

  if (loading) {
    return (
      <div className={`dashboard-loading min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="dashboard-loading-content text-center">
          <div className={`dashboard-loading-spinner w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3 ${
            theme === 'dark' ? 'border-blue-400 border-t-gray-700' : 'border-blue-500 border-t-gray-200'
          }`} />
          <p className={`dashboard-loading-text text-base ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dashboard-error p-4 rounded-lg border ${
        theme === 'dark'
          ? 'bg-red-900/20 border-red-500/30 text-red-300'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        <div className="dashboard-error-content flex items-center">
          <ExclamationTriangleIcon className="dashboard-error-icon w-5 h-5 mr-2 flex-shrink-0" />
          <span className="dashboard-error-text font-medium">{error}</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { stats: dashboardStats, recentActivity, zoneStats } = stats;
  const resolutionRate = getResolutionRate();
  const slaComplianceRate = getSLAComplianceRate();

  return (
    <div className={`dashboard-container min-h-screen p-4 ${
      theme === 'dark' 
        ? 'bg-gray-900' 
        : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className={`dashboard-header mb-6 p-4 rounded-lg border ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="dashboard-header-content flex justify-between items-center mb-3">
            <div className="dashboard-header-info">
              <h1 className={`dashboard-header-title text-2xl font-semibold mb-1 ${
                theme === 'dark'
                  ? 'text-white'
                  : 'text-gray-900'
              }`}>
                Welcome back, {user?.name}!
              </h1>
              <p className={`dashboard-header-subtitle text-base ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {user?.role === 'admin' ? 'System Administrator' : `Executive - Zone ${user?.zone?.name}`}
              </p>
            </div>
            <div className="dashboard-header-actions">
              <ExportActions variant="compact" />
            </div>
          </div>

          {dashboardStats.slaBreaches > 0 && (
            <div className={`dashboard-sla-alert p-3 rounded-md border ${
              theme === 'dark'
                ? 'bg-red-900/20 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="dashboard-sla-alert-header flex items-center mb-1">
                <ExclamationTriangleIcon className="dashboard-sla-alert-icon w-4 h-4 mr-2 flex-shrink-0" />
                <h3 className="dashboard-sla-alert-title text-base font-medium">SLA Breaches Alert</h3>
              </div>
              <p className="dashboard-sla-alert-text ml-6 text-sm">
                {dashboardStats.slaBreaches} complaints are overdue and need immediate attention.
              </p>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="dashboard-stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Complaints */}
          <div className={`dashboard-stat-card p-4 rounded-lg border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className={`dashboard-stat-icon w-8 h-8 rounded-md flex items-center justify-center mb-3 ${
              theme === 'dark'
                ? 'bg-blue-600'
                : 'bg-blue-600'
            }`}>
              <DocumentTextIcon className="w-4 h-4 text-white" />
            </div>
            <h3 className={`dashboard-stat-value text-xl font-semibold mb-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {dashboardStats.totalComplaints}
            </h3>
            <p className={`dashboard-stat-label text-xs font-medium uppercase tracking-wide ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Total Complaints
            </p>
            <div className={`dashboard-stat-change inline-flex items-center px-2 py-1 rounded text-xs font-medium mt-2 bg-green-100 text-green-800 ${
              theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
            }`}>
              <span>↑ 12%</span>
            </div>
          </div>

          {/* Open Complaints */}
          <div className={`dashboard-stat-card p-4 rounded-lg border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className={`dashboard-stat-icon w-8 h-8 rounded-md flex items-center justify-center mb-3 ${
              theme === 'dark'
                ? 'bg-orange-600'
                : 'bg-orange-600'
            }`}>
              <ClockIcon className="w-4 h-4 text-white" />
            </div>
            <h3 className={`dashboard-stat-value text-xl font-semibold mb-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {dashboardStats.openComplaints}
            </h3>
            <p className={`dashboard-stat-label text-xs font-medium uppercase tracking-wide ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Open Complaints
            </p>
            <div className={`dashboard-stat-change inline-flex items-center px-2 py-1 rounded text-xs font-medium mt-2 bg-red-100 text-red-800 ${
              theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
            }`}>
              <span>↓ 8%</span>
            </div>
          </div>

          {/* Resolution Rate */}
          <div className={`dashboard-stat-card p-4 rounded-lg border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className={`dashboard-stat-icon w-8 h-8 rounded-md flex items-center justify-center mb-3 ${
              theme === 'dark'
                ? 'bg-green-600'
                : 'bg-green-600'
            }`}>
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <h3 className={`dashboard-stat-value text-xl font-semibold mb-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {resolutionRate}%
            </h3>
            <p className={`dashboard-stat-label text-xs font-medium uppercase tracking-wide ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Resolution Rate
            </p>
            <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mt-2 ${
              resolutionRate > 75 
                ? (theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                : (theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')
            }`}>
              <span>{resolutionRate > 75 ? '↑' : '↓'} {Math.abs(resolutionRate - 75)}%</span>
            </div>
          </div>

          {/* SLA Compliance */}
          <div className={`dashboard-stat-card p-4 rounded-lg border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className={`dashboard-stat-icon w-8 h-8 rounded-md flex items-center justify-center mb-3 ${
              slaComplianceRate > 90
                ? (theme === 'dark' ? 'bg-blue-600' : 'bg-blue-600')
                : (theme === 'dark' ? 'bg-red-600' : 'bg-red-600')
            }`}>
              <ExclamationTriangleIcon className="w-4 h-4 text-white" />
            </div>
            <h3 className={`dashboard-stat-value text-xl font-semibold mb-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {slaComplianceRate}%
            </h3>
            <p className={`dashboard-stat-label text-xs font-medium uppercase tracking-wide ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              SLA Compliance
            </p>
            <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mt-2 ${
              slaComplianceRate > 90 
                ? (theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                : (theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')
            }`}>
              <span>{slaComplianceRate > 90 ? '↑' : '↓'} {Math.abs(slaComplianceRate - 90)}%</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="dashboard-charts-section grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Complaint Trends */}
          <div className="lg:col-span-2">
            <div className={`dashboard-chart-card p-4 rounded-lg border h-full ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <div className="dashboard-chart-header flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className={`dashboard-chart-title text-lg font-medium mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Complaint Trends (Last 7 Days)
                  </h3>
                  <p className={`dashboard-chart-subtitle text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Daily complaint activity over the past week
                  </p>
                </div>
                <TrendIcon className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div className="dashboard-chart-content h-64">
                <LineChart
                  data={trendData}
                  height={256}
                />
              </div>
            </div>
          </div>

          {/* Priority Distribution */}
          <div>
            <div className={`dashboard-chart-card p-4 rounded-lg border h-full ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <div className="dashboard-chart-header flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className={`dashboard-chart-title text-lg font-medium mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Priority Distribution
                  </h3>
                  <p className={`dashboard-chart-subtitle text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Breakdown of complaints by priority level
                  </p>
                </div>
                <ChartPieIcon className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </div>
              <div className="dashboard-chart-content h-64">
                <PieChart
                  data={priorityData}
                  height={256}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity and Zone Stats */}
        <div className="dashboard-activity-section grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className={`dashboard-activity-card p-4 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <div className="dashboard-activity-header flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className={`dashboard-activity-title text-lg font-medium mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Recent Activity
                  </h3>
                  <p className={`dashboard-activity-subtitle text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Latest complaint updates and actions
                  </p>
                </div>
                <button 
                  onClick={() => window.location.href = '/complaints'}
                  className={`dashboard-activity-button px-3 py-2 rounded border text-sm transition-colors ${
                    theme === 'dark'
                      ? 'border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white'
                      : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  View All
                </button>
              </div>
              
              {recentActivity.length === 0 ? (
                <div className={`text-center py-6 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <ClockIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <AuditTimeline
                  items={recentActivity.map((activity) => ({
                    id: activity.id,
                    title: `${activity.farmer?.name} - ${activity.title}`,
                    description: `Priority: ${activity.priority} • Status: ${activity.status}`,
                    timestamp: activity.createdAt,
                    user: activity.createdByUser?.name || 'System',
                    status: (activity.status === 'resolved' || activity.status === 'closed') ? 'success' : 
                           activity.status === 'received' ? 'info' : 
                           activity.priority === 'critical' ? 'error' : 'warning',
                    priority: activity.priority,
                    action: 'complaint_created'
                  }))}
                  variant="compact"
                />
              )}
            </div>
          </div>

          {/* Zone Performance */}
          <div>
            <div className={`dashboard-zone-card p-4 rounded-lg border h-full ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <div className="dashboard-zone-header flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className={`dashboard-zone-title text-lg font-medium mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Zone Performance
                  </h3>
                  <p className={`dashboard-zone-subtitle text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Complaints by agricultural zone
                  </p>
                </div>
                <ChartBarIcon className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`} />
              </div>
              
              {user?.role === 'admin' && zoneStats.length > 0 ? (
                <div className="dashboard-zone-content h-64">
                  <BarChart
                    data={zoneStats.map(zone => ({
                      name: zone.zone?.name?.split(' ')[0] || 'Unknown',
                      complaints: zone.dataValues?.complaintCount || zone.complaintCount || 0,
                    }))}
                    height={256}
                  />
                </div>
              ) : (
                <div className={`dashboard-zone-empty text-center py-6 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <ChartBarIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {user?.role === 'executive' 
                      ? `Your Zone: ${user.zone?.name}` 
                      : 'Zone performance data will appear here'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}