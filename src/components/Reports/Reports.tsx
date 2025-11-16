import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp,
  Warning,
  Phone,
  Business,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  FilterList,
  Analytics,
  PictureAsPdf,
  Description,
} from '@mui/icons-material';
import { api } from '../../utils/api';
import { ChartSuite, KPIStat, KPIStatGroup } from '../Charts/ChartSuite';
import { useCustomTheme } from '../../hooks/useCustomTheme';
import './reports.css';

interface Zone {
  name: string;
}

interface Branch {
  name: string;
  zone?: Zone;
}

interface Line {
  name: string;
  branch?: {
    name: string;
    zone?: Zone;
  };
}

interface Farmer {
  name: string;
  phone: string;
}

interface AssignedTo {
  name: string;
}

interface DataValues {
  totalComplaints: number;
  resolvedComplaints: number;
  closedComplaints: number;
  avgResolutionTime?: number;
  total?: number;
  compliant?: number;
  breached?: number;
}

interface EquipmentReportItem {
  serialNumber?: string;
  vendor?: string;
  farmerName?: string;
  farmerPhone?: string;
  totalComplaints?: number;
  avgResolutionTime?: number;
  complaints?: ComplaintItem[];
  zone?: Zone;
  branch?: Branch;
  line?: Line;
  farmer?: Farmer;
  assignedTo?: AssignedTo;
  priority?: string;
  ticketNumber?: string;
  slaDeadline?: string;
  type?: string;
  dataValues?: DataValues;
  name?: string;
  phone?: string;
  email?: string;
  managerPhone?: string;
  accountantPhone?: string;
  supervisorPhone?: string;
}

interface ComplaintItem {
  ticketNumber: string;
  priority: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionTime?: number;
}

interface MissingContactsSummary {
  totalFarmersMissingContacts?: number;
  totalBranchesMissingContacts?: number;
  totalLinesMissingContacts?: number;
}

interface MissingContactsData {
  summary?: MissingContactsSummary;
  missingContacts?: EquipmentReportItem[];
  branchMissingContacts?: EquipmentReportItem[];
  lineMissingContacts?: EquipmentReportItem[];
}

interface ReportData {
  zonePerformance?: EquipmentReportItem[];
  branchPerformance?: EquipmentReportItem[];
  slaBreaches?: EquipmentReportItem[];
  slaSummary?: EquipmentReportItem[];
  mttrData?: EquipmentReportItem[];
  missingContacts?: MissingContactsData;
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('performance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogContent, setDialogContent] = useState<React.ReactNode>(null);
  const { theme } = useCustomTheme();

  // Chart data processing functions
  const getZonePerformanceChartData = () => {
    if (!reportData.zonePerformance) return [];
    return reportData.zonePerformance.map(zone => ({
      name: zone.zone?.name || 'Unknown',
      total: zone.dataValues?.totalComplaints || 0,
      resolved: zone.dataValues?.resolvedComplaints || 0,
      closed: zone.dataValues?.closedComplaints || 0,
      avgTime: parseFloat((zone.dataValues?.avgResolutionTime || 0).toFixed(2))
    }));
  };

  const getSLAComplianceChartData = () => {
    if (!reportData.slaSummary) return [];
    return reportData.slaSummary.map(item => ({
      name: (item.priority || 'unknown').toUpperCase(),
      value: parseFloat((((item.dataValues?.compliant || 0) / (item.dataValues?.total || 1)) * 100).toFixed(1)),
      total: item.dataValues?.total || 0,
      compliant: item.dataValues?.compliant || 0,
      breached: item.dataValues?.breached || 0
    }));
  };

  const getComplaintTrendData = () => {
    // Mock trend data - in real implementation, this would come from API
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      complaints: Math.floor(Math.random() * 100) + 50,
      resolved: Math.floor(Math.random() * 80) + 30,
      pending: Math.floor(Math.random() * 20) + 5
    }));
  };

  const reports = [
    { id: 'performance', name: 'Zone/Branch Performance', icon: <Business /> },
    { id: 'sla-breaches', name: 'SLA Breach Report', icon: <Warning /> },
    { id: 'equipment-mttr', name: 'Equipment MTTR Report', icon: <TrendingUp /> },
    { id: 'missing-contacts', name: 'Missing Contacts Report', icon: <Phone /> },
  ];

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let data;
      switch (selectedReport) {
        case 'performance':
          data = await api.reports.performance(params);
          break;
        case 'sla-breaches':
          data = await api.reports.slaBreaches(params);
          break;
        case 'equipment-mttr':
          data = await api.reports.equipmentMttr(params);
          break;
        case 'missing-contacts':
          data = await api.reports.missingContacts();
          break;
        default:
          throw new Error('Invalid report type');
      }

      setReportData(data);
    } catch (error) {
      setError('Failed to generate report');
      console.error('Report error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format: 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('format', format);

      let endpoint;
      switch (selectedReport) {
        case 'performance':
          endpoint = `/api/reports/performance?${params.toString()}`;
          break;
        case 'sla-breaches':
          endpoint = `/api/reports/sla-breaches?${params.toString()}`;
          break;
        case 'equipment-mttr':
          endpoint = `/api/reports/equipment-mttr?${params.toString()}`;
          break;
        case 'missing-contacts':
          endpoint = `/api/reports/missing-contacts?${params.toString()}`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Failed to download report');
      console.error('Download error:', error);
    }
  };

  const showDetailsDialog = (title: string, content: React.ReactNode) => {
    setDialogTitle(title);
    setDialogContent(content);
    setDialogOpen(true);
  };

  const renderPerformanceReport = () => {
    if (!reportData.zonePerformance && !reportData.branchPerformance) return null;

    const chartData = getZonePerformanceChartData();
    const totalComplaints = chartData.reduce((sum, item) => sum + item.total, 0);
    const totalResolved = chartData.reduce((sum, item) => sum + item.resolved, 0);
    const avgResolutionTime = chartData.length > 0 
      ? (chartData.reduce((sum, item) => sum + item.avgTime, 0) / chartData.length).toFixed(1)
      : '0.0';

    return (
      <Box>
        {/* KPI Cards */}
        <KPIStatGroup className="dashboard-stats-grid mb-6" sx={{ marginBottom: '24px' }}>
          <KPIStat
            title="Total Complaints"
            value={totalComplaints.toLocaleString()}
            change={12}
            trend="up"
            variant="accent"
          />
          <KPIStat
            title="Total Resolved"
            value={totalResolved.toLocaleString()}
            change={8}
            trend="up"
            variant="success"
          />
          <KPIStat
            title="Avg Resolution Time"
            value={`${avgResolutionTime} hrs`}
            change={-5}
            trend="down"
            variant="default"
          />
          <KPIStat
            title="Resolution Rate"
            value={`${totalComplaints > 0 ? ((totalResolved / totalComplaints) * 100).toFixed(1) : 0}%`}
            change={3}
            trend="up"
            variant="warning"
          />
        </KPIStatGroup>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className="reports-card" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', mb: 2 }}>
                  Zone Performance Overview
                </Typography>
                <ChartSuite
                  data={chartData.map(item => ({
                    name: item.name,
                    value: item.total
                  }))}
                  type="bar"
                  title="Total Complaints by Zone"
                  height={250}
                  colors={['var(--primary-main)']}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className="reports-card" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Resolution Time Analysis
                </Typography>
                <ChartSuite
                  data={chartData.map(item => ({
                    name: item.name,
                    value: item.avgTime
                  }))}
                  type="line"
                  title="Average Resolution Time (Hours)"
                  height={300}
                  colors={['var(--warning-main)']}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Data Tables */}
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', mb: 2 }}>
          Zone Performance Details
        </Typography>
        <TableContainer 
          component={Paper} 
          className="reports-table"
          sx={{ mb: 3 }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: 'var(--surface-subtle)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', py: 1 }}>Zone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', py: 1 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', py: 1 }}>Resolved</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', py: 1 }}>Closed</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', py: 1 }}>Avg Time</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', py: 1 }}>Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.zonePerformance?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ py: 1, fontSize: '0.875rem' }}>
                    {item.zone?.name || 'Unknown'}
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.875rem' }}>
                    {item.dataValues?.totalComplaints || 0}
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.875rem', color: 'var(--success-main)' }}>
                    {item.dataValues?.resolvedComplaints || 0}
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.875rem' }}>
                    {item.dataValues?.closedComplaints || 0}
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.875rem' }}>
                    {item.dataValues?.avgResolutionTime?.toFixed(2) || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-main)' }}>
                    {item.dataValues && item.dataValues.totalComplaints > 0 
                      ? ((item.dataValues.resolvedComplaints / item.dataValues.totalComplaints) * 100).toFixed(1)
                      : 0}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          Branch Performance Details
        </Typography>
        <TableContainer 
          component={Paper}
          className="reports-table"
        >
          <Table>
            <TableHead sx={{ backgroundColor: 'var(--surface-elevated)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Zone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total Complaints</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Resolved</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Closed</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Avg Resolution Time (Hours)</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Resolution Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.branchPerformance?.map((item, index) => (
                <TableRow 
                  key={index}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'var(--surface-hover)',
                    },
                    '&.MuiTableRow-root': {
                      borderBottom: '1px solid var(--border-subtle)',
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="500" color="var(--text-primary)">
                      {item.zone?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-primary)">
                      {item.branch?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-primary)">
                      {item.dataValues?.totalComplaints || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--success-main)">
                      {item.dataValues?.resolvedComplaints || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-primary)">
                      {item.dataValues?.closedComplaints || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-secondary)">
                      {item.dataValues?.avgResolutionTime?.toFixed(2) || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500" color="var(--primary-main)">
                      {item.dataValues && item.dataValues.totalComplaints > 0 
                        ? ((item.dataValues.resolvedComplaints / item.dataValues.totalComplaints) * 100).toFixed(1)
                        : 0}%
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderSLABreachReport = () => {
    if (!reportData.slaBreaches) return null;

    const slaChartData = getSLAComplianceChartData();
    const totalComplaints = slaChartData.reduce((sum, item) => sum + item.total, 0);
    const totalBreaches = slaChartData.reduce((sum, item) => sum + item.breached, 0);
    const overallCompliance = totalComplaints > 0 
      ? ((totalComplaints - totalBreaches) / totalComplaints * 100).toFixed(1)
      : '100.0';

    return (
      <Box>
        {/* KPI Cards */}
        <KPIStatGroup className="dashboard-stats-grid mb-6" sx={{ marginBottom: '24px' }}>
          <KPIStat
            title="Total Complaints"
            value={totalComplaints.toLocaleString()}
            change={5}
            trend="up"
            variant="accent"
          />
          <KPIStat
            title="SLA Breaches"
            value={totalBreaches.toLocaleString()}
            change={-12}
            trend="down"
            variant="error"
          />
          <KPIStat
            title="Overall Compliance"
            value={`${overallCompliance}%`}
            change={2}
            trend="up"
            variant="success"
          />
          <KPIStat
            title="Critical Priority"
            value={slaChartData.find(item => item.name === 'CRITICAL')?.total || 0}
            change={-8}
            trend="down"
            variant="warning"
          />
        </KPIStatGroup>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className="reports-card" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  SLA Compliance by Priority
                </Typography>
                <ChartSuite
                  data={slaChartData}
                  type="pie"
                  title="Compliance Rate (%)"
                  height={300}
                  colors={['var(--error-main)', 'var(--warning-main)', 'var(--info-main)']}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className="reports-card" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Complaint Trends
                </Typography>
                <ChartSuite
                  data={getComplaintTrendData().map(item => ({
                    name: item.month,
                    value: item.complaints
                  }))}
                  type="line"
                  title="Monthly Complaint Volume"
                  height={300}
                  colors={['var(--primary-main)']}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* SLA Summary Table */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          SLA Breaches Summary
        </Typography>
        <TableContainer 
          component={Paper} 
          className="reports-table"
          sx={{ mb: 3 }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: 'var(--surface-elevated)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Compliant</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Breached</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Compliance Rate</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.slaSummary?.map((item, index) => (
                <TableRow 
                  key={index}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'var(--surface-hover)',
                    },
                    '&.MuiTableRow-root': {
                      borderBottom: '1px solid var(--border-subtle)',
                    }
                  }}
                >
                  <TableCell>
                    <Chip 
                      label={(item.priority || 'unknown').toUpperCase()} 
                      color={(item.priority || 'unknown') === 'critical' ? 'error' : (item.priority || 'unknown') === 'urgent' ? 'warning' : 'info'} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-primary)">
                      {item.dataValues?.total || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--success-main)">
                      {item.dataValues?.compliant || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--status-error)">
                      {item.dataValues?.breached || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500" color="var(--text-primary)">
                      {item.dataValues && item.dataValues.total > 0 
                        ? ((item.dataValues.compliant / item.dataValues.total) * 100).toFixed(1)
                        : 0}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.dataValues && item.dataValues.total > 0 && ((item.dataValues.compliant / item.dataValues.total) * 100) >= 95 ? 'Excellent' : 
                             item.dataValues && item.dataValues.total > 0 && ((item.dataValues.compliant / item.dataValues.total) * 100) >= 85 ? 'Good' : 'Needs Attention'}
                      color={item.dataValues && item.dataValues.total > 0 && ((item.dataValues.compliant / item.dataValues.total) * 100) >= 95 ? 'success' : 
                             item.dataValues && item.dataValues.total > 0 && ((item.dataValues.compliant / item.dataValues.total) * 100) >= 85 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* SLA Breach Details */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          SLA Breach Details
        </Typography>
        <TableContainer 
          component={Paper}
          className="reports-table"
        >
          <Table>
            <TableHead sx={{ backgroundColor: 'var(--surface-elevated)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Ticket #</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Farmer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Zone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>SLA Deadline</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Hours Overdue</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.slaBreaches?.map((item, index) => (
                <TableRow 
                  key={index}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'var(--surface-hover)',
                    },
                    '&.MuiTableRow-root': {
                      borderBottom: '1px solid var(--border-subtle)',
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="500" color="var(--primary-main)">
                      {item.ticketNumber || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium" color="var(--text-primary)">
                        {item.farmer?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="var(--text-secondary)">
                        {item.farmer?.phone || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={(item.priority || 'unknown').toUpperCase()} 
                      color={(item.priority || 'unknown') === 'critical' ? 'error' : (item.priority || 'unknown') === 'urgent' ? 'warning' : 'info'} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500" color="var(--text-primary)">
                      {item.zone?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-primary)">
                      {item.branch?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-primary)">
                      {item.assignedTo?.name || 'Not Assigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--status-error)">
                      {item.slaDeadline ? new Date(item.slaDeadline).toLocaleString() : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600" color="var(--status-error)">
                      {item.slaDeadline ? Math.floor((new Date().getTime() - new Date(item.slaDeadline).getTime()) / (1000 * 60 * 60)) : 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label="Overdue"
                      color="error"
                      size="small"
                      icon={<Warning />}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderEquipmentMTTRReport = () => {
    if (!reportData.mttrData) return null;

    const mttrChartData = reportData.mttrData.map(item => ({
      name: item.type,
      value: parseFloat(item.avgResolutionTime.toFixed(2)),
      total: item.totalComplaints,
      vendor: item.vendor
    }));

    const totalEquipment = reportData.mttrData.length;
    const avgMTTR = totalEquipment > 0 
      ? (reportData.mttrData.reduce((sum, item) => sum + item.avgResolutionTime, 0) / totalEquipment).toFixed(1)
      : '0.0';
    const totalComplaints = reportData.mttrData.reduce((sum, item) => sum + item.totalComplaints, 0);

    return (
      <Box>
        {/* KPI Cards */}
        <KPIStatGroup className="dashboard-stats-grid mb-6" sx={{ marginBottom: '24px' }}>
          <KPIStat
            title="Total Equipment"
            value={totalEquipment.toLocaleString()}
            change={8}
            trend="up"
            variant="accent"
          />
          <KPIStat
            title="Average MTTR"
            value={`${avgMTTR} hrs`}
            change={-15}
            trend="down"
            variant="success"
          />
          <KPIStat
            title="Total Complaints"
            value={totalComplaints.toLocaleString()}
            change={5}
            trend="up"
            variant="default"
          />
          <KPIStat
            title="Equipment Performance"
            value="85%"
            change={3}
            trend="up"
            variant="warning"
          />
        </KPIStatGroup>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className="reports-card" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  MTTR by Equipment Type
                </Typography>
                <ChartSuite
                  data={mttrChartData}
                  type="bar"
                  title="Average Resolution Time (Hours)"
                  height={300}
                  colors={['var(--warning-main)']}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className="reports-card" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Complaint Volume by Equipment
                </Typography>
                <ChartSuite
                  data={mttrChartData.map(item => ({
                    name: item.name,
                    value: item.total
                  }))}
                  type="pie"
                  title="Total Complaints"
                  height={300}
                  colors={['var(--primary-main)', 'var(--success-main)', 'var(--info-main)', 'var(--warning-main)']}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Equipment Details Table */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          Equipment Mean Time To Resolution (MTTR)
        </Typography>
        <TableContainer 
          component={Paper}
          className="reports-table"
        >
          <Table>
            <TableHead sx={{ backgroundColor: 'var(--surface-elevated)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Equipment Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Serial Number</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Vendor</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Farmer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total Complaints</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Avg Resolution Time (Hours)</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Performance</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.mttrData.map((item, index) => (
                <TableRow 
                  key={index}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'var(--surface-hover)',
                    },
                    '&.MuiTableRow-root': {
                      borderBottom: '1px solid var(--border-subtle)',
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="500" color="var(--text-primary)">
                      {item.type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--primary-main)">
                      {item.serialNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-secondary)">
                      {item.vendor}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium" color="var(--text-primary)">
                        {item.farmerName}
                      </Typography>
                      <Typography variant="caption" color="var(--text-secondary)">
                        {item.farmerPhone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-primary)">
                      {item.totalComplaints}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500" color="var(--warning-main)">
                      {item.avgResolutionTime.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.avgResolutionTime <= 24 ? 'Excellent' : item.avgResolutionTime <= 48 ? 'Good' : 'Needs Attention'}
                      color={item.avgResolutionTime <= 24 ? 'success' : item.avgResolutionTime <= 48 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => showDetailsDialog(
                        `Equipment Details - ${item.serialNumber}`,
                        <Box>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            Complaint History
                          </Typography>
                          {item.complaints?.map((complaint, idx) => (
                            <Card key={idx} sx={{ mb: 2, p: 2, backgroundColor: 'var(--surface-glass)' }}>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Ticket:</strong> <span style={{ color: 'var(--primary-main)' }}>{complaint.ticketNumber}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Priority:</strong> <Chip label={complaint.priority.toUpperCase()} size="small" />
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Created:</strong> {new Date(complaint.createdAt).toLocaleString()}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Resolved:</strong> {complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleString() : 'N/A'}
                              </Typography>
                              {complaint.resolutionTime && (
                                <Typography variant="body2">
                                  <strong>Resolution Time:</strong> <span style={{ color: 'var(--warning-main)' }}>{complaint.resolutionTime.toFixed(2)} hours</span>
                                </Typography>
                              )}
                            </Card>
                          ))}
                        </Box>
                      )}
                      sx={{ borderRadius: 'var(--border-radius-md)' }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderMissingContactsReport = () => {
    if (!reportData.missingContacts) return null;

    const totalFarmers = reportData.missingContacts?.summary?.totalFarmersMissingContacts || 0;
    const totalBranches = reportData.missingContacts?.summary?.totalBranchesMissingContacts || 0;
    const totalLines = reportData.missingContacts?.summary?.totalLinesMissingContacts || 0;
    const totalMissing = totalFarmers + totalBranches + totalLines;

    // Chart data for missing contacts
    const missingContactsChartData = [
      { name: 'Farmers', value: totalFarmers, color: 'var(--primary-main)' },
      { name: 'Branches', value: totalBranches, color: 'var(--warning-main)' },
      { name: 'Lines', value: totalLines, color: 'var(--info-main)' }
    ];

    return (
      <Box>
        {/* KPI Cards */}
        <KPIStatGroup className="dashboard-stats-grid mb-6" sx={{ marginBottom: '24px' }}>
          <KPIStat
            title="Total Missing Contacts"
            value={totalMissing.toLocaleString()}
            change={-5}
            trend="down"
            variant="error"
          />
          <KPIStat
            title="Farmers Missing"
            value={totalFarmers.toLocaleString()}
            change={-8}
            trend="down"
            variant="accent"
          />
          <KPIStat
            title="Branches Missing"
            value={totalBranches.toLocaleString()}
            change={-3}
            trend="down"
            variant="warning"
          />
          <KPIStat
            title="Lines Missing"
            value={totalLines.toLocaleString()}
            change={-12}
            trend="down"
            variant="default"
          />
        </KPIStatGroup>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Missing Contacts Distribution
                </Typography>
                <ChartSuite
                  data={missingContactsChartData}
                  type="pie"
                  title="Missing Contacts by Type"
                  height={300}
                  colors={['var(--primary-main)', 'var(--warning-main)', 'var(--info-main)']}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Contact Completion Rate
                </Typography>
                <ChartSuite
                  data={[
                    { name: 'Farmers', value: totalFarmers > 0 ? 85 : 100 },
                    { name: 'Branches', value: totalBranches > 0 ? 90 : 100 },
                    { name: 'Lines', value: totalLines > 0 ? 88 : 100 }
                  ]}
                  type="bar"
                  title="Completion Rate (%)"
                  height={300}
                  colors={['var(--success-main)']}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Summary Cards */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          Missing Contacts Summary
        </Typography>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card className="reports-card">
              <CardContent sx={{ p: 0 }}>
                <Box display="flex" alignItems="center" sx={{ marginBottom: '8px' }}>
                  <Phone sx={{ color: 'var(--primary-main)', marginRight: '8px' }} />
                  <Typography color="var(--text-secondary)" gutterBottom>
                    Farmers Missing Contacts
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ color: 'var(--error-main)', fontWeight: 600 }}>
                  {totalFarmers.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                  {totalFarmers > 0 ? `${((totalFarmers / totalMissing) * 100).toFixed(1)}% of total` : 'No missing contacts'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card className="reports-card">
              <CardContent sx={{ p: 0 }}>
                <Box display="flex" alignItems="center" sx={{ marginBottom: '8px' }}>
                  <Business sx={{ color: 'var(--warning-main)', marginRight: '8px' }} />
                  <Typography color="var(--text-secondary)" gutterBottom>
                    Branches Missing Contacts
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ color: 'var(--warning-main)', fontWeight: 600 }}>
                  {totalBranches.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                  {totalBranches > 0 ? `${((totalBranches / totalMissing) * 100).toFixed(1)}% of total` : 'No missing contacts'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ backgroundColor: 'var(--surface-glass)' }}>
              <CardContent>
                <Box display="flex" alignItems="center" sx={{ marginBottom: '8px' }}>
                  <TrendingUp sx={{ color: 'var(--info-main)', marginRight: '8px' }} />
                  <Typography color="var(--text-secondary)" gutterBottom>
                    Lines Missing Contacts
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ color: 'var(--info-main)', fontWeight: 600 }}>
                  {totalLines.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                  {totalLines > 0 ? `${((totalLines / totalMissing) * 100).toFixed(1)}% of total` : 'No missing contacts'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Missing Contact Details */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          Missing Contact Details
        </Typography>
        <TableContainer 
          component={Paper}
          className="reports-table"
        >
          <Table>
            <TableHead sx={{ backgroundColor: 'var(--surface-elevated)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Missing Contact</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Zone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Line</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.missingContacts?.missingContacts?.map((item, index) => (
                <TableRow 
                  key={index}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'var(--surface-hover)',
                    },
                    '&.MuiTableRow-root': {
                      borderBottom: '1px solid var(--border-subtle)',
                    }
                  }}
                >
                  <TableCell>
                    <Chip label="Farmer" color="primary" size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500" color="var(--text-primary)">
                      {item.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--error-main)">
                      {item.phone ? 'Email Missing' : item.email ? 'Phone Missing' : 'Both Missing'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-secondary)">
                      {item.line?.branch?.zone?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-secondary)">
                      {item.line?.branch?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-secondary)">
                      {item.line?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label="Action Required"
                      color="error"
                      size="small"
                      icon={<Phone />}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {reportData.missingContacts?.branchMissingContacts?.map((item, index) => (
                <TableRow 
                  key={`branch-${index}`}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'var(--surface-hover)',
                    },
                    '&.MuiTableRow-root': {
                      borderBottom: '1px solid var(--border-subtle)',
                    }
                  }}
                >
                  <TableCell>
                    <Chip label="Branch" color="warning" size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500" color="var(--text-primary)">
                      {item.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--error-main)">
                      {item.managerPhone ? 'Accountant Missing' : item.accountantPhone ? 'Manager Missing' : 'Both Missing'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-secondary)">
                      {item.zone?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500" color="var(--text-primary)">
                      {item.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-secondary)">
                      N/A
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label="Action Required"
                      color="warning"
                      size="small"
                      icon={<Business />}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {reportData.missingContacts?.lineMissingContacts?.map((item, index) => (
                <TableRow 
                  key={`line-${index}`}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'var(--surface-hover)',
                    },
                    '&.MuiTableRow-root': {
                      borderBottom: '1px solid var(--border-subtle)',
                    }
                  }}
                >
                  <TableCell>
                    <Chip label="Line" color="info" size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500" color="var(--text-primary)">
                      {item.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--error-main)">
                      Supervisor Phone Missing
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-secondary)">
                      {item.branch?.zone?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="var(--text-secondary)">
                      {item.branch?.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500" color="var(--text-primary)">
                      {item.name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label="Action Required"
                      color="info"
                      size="small"
                      icon={<TrendingUp />}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box className="reports-container">
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
                Reports & Analytics
              </h1>
              <p className={`dashboard-header-subtitle text-base ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Generate and analyze complaint performance reports
              </p>
            </div>
            <div className="dashboard-header-actions">
              {/* Additional actions can be added here */}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, fontSize: '0.875rem' }}>
            {error}
          </Alert>
        )}

        {/* Report Configuration */}
        <Card className="reports-filters">
          <CardContent sx={{ p: 0 }}>
            <Box display="flex" alignItems="center" sx={{ marginBottom: '20px' }}>
              <FilterList sx={{ color: 'var(--primary-main)', marginRight: '12px', fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Report Configuration
              </Typography>
            </Box>
            
            {/* Report Type Section */}
            <Box sx={{ marginBottom: '16px' }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Report Type
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel className="reports-filter-label">Select Report</InputLabel>
                    <Select
                      value={selectedReport}
                      onChange={(e) => setSelectedReport(e.target.value)}
                      className="reports-filter-select"
                      sx={{
                        backgroundColor: 'var(--background-paper)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'var(--border-color)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'var(--primary-main)'
                        }
                      }}
                    >
                      {reports.map((report) => (
                        <MenuItem key={report.id} value={report.id}>
                          <Box display="flex" alignItems="center">
                            {report.icon}
                            <Typography sx={{ ml: 1, fontSize: '0.875rem' }}>{report.name}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Date Range Section */}
            <Box sx={{ marginBottom: '20px' }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Date Range
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    className="reports-filter-input"
                    sx={{
                      backgroundColor: 'var(--background-paper)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-main)'
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    className="reports-filter-input"
                    sx={{
                      backgroundColor: 'var(--background-paper)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-main)'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Action Buttons */}
            <Box display="flex" gap={2} alignItems="center">
              <Button
                variant="contained"
                onClick={generateReport}
                disabled={loading}
                startIcon={<AssessmentIcon />}
                className="reports-btn-primary"
                sx={{
                  backgroundColor: 'var(--primary-main)',
                  color: 'var(--primary-contrast-text)',
                  '&:hover': {
                    backgroundColor: 'var(--primary-dark)'
                  },
                  '&:disabled': {
                    backgroundColor: 'var(--action-disabled-background)',
                    color: 'var(--action-disabled-text)'
                  }
                }}
              >
                Generate Report
              </Button>
              <Tooltip title="Refresh Report">
                <IconButton
                  onClick={() => generateReport()}
                  disabled={loading}
                  className="reports-btn-secondary"
                  sx={{
                    color: 'var(--primary-main)',
                    border: '1px solid var(--border-color)',
                    '&:hover': {
                      backgroundColor: 'var(--action-hover)',
                      borderColor: 'var(--primary-main)'
                    },
                    '&:disabled': {
                      color: 'var(--action-disabled-text)',
                      borderColor: 'var(--action-disabled-background)'
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="reports-loading">
            <CardContent sx={{ p: 0 }}>
              <Box display="flex" alignItems="center" sx={{ marginBottom: '16px' }}>
                <div className="reports-loading-spinner" />
                <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500, marginLeft: '16px' }}>
                  Generating report...
                </Typography>
              </Box>
              <LinearProgress sx={{ borderRadius: 2, height: 4 }} />
            </CardContent>
          </Card>
        )}

        {/* Report Content */}
        {!loading && (
          <Box>
            {selectedReport === 'performance' && renderPerformanceReport()}
            {selectedReport === 'sla-breaches' && renderSLABreachReport()}
            {selectedReport === 'equipment-mttr' && renderEquipmentMTTRReport()}
            {selectedReport === 'missing-contacts' && renderMissingContactsReport()}

            {Object.keys(reportData).length > 0 && (
              <Card className="reports-card">
                <CardContent sx={{ p: 0 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
                      Export
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Description sx={{ fontSize: 16 }} />}
                        onClick={() => downloadReport('excel')}
                        className="reports-btn-secondary"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        Excel
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PictureAsPdf sx={{ fontSize: 16 }} />}
                        onClick={() => downloadReport('pdf')}
                        className="reports-btn-secondary"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        PDF
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* Details Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 'var(--radius-2xl)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: 'var(--shadow-lg), var(--shadow-glow-primary)'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'rgba(255, 255, 255, 0.8)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            px: 4,
            py: 3
          }}>
            <Analytics sx={{ mr: 2, color: 'var(--primary-main)' }} />
            {dialogTitle}
          </DialogTitle>
          <DialogContent sx={{ 
            pt: 4, 
            background: 'rgba(255, 255, 255, 0.7)',
            px: 4
          }}>
            {dialogContent}
          </DialogContent>
          <DialogActions sx={{ 
            background: 'rgba(255, 255, 255, 0.8)',
            borderTop: '1px solid rgba(255, 255, 255, 0.3)',
            px: 4,
            py: 3
          }}>
            <Button 
              onClick={() => setDialogOpen(false)}
              variant="outlined"
              className="reports-btn-secondary"
              sx={{ borderRadius: 'var(--radius-lg)' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
}