import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Fab,
  Autocomplete,
  Grid,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import { useCustomTheme } from '../../hooks/useCustomTheme';
import { ExportActions } from '../Common/ExportActions';
import { KPIStat, KPIStatGroup } from '../Charts/ChartSuite';
import './complaints.css';

interface Complaint {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: 'normal' | 'urgent' | 'critical';
  status: 'open' | 'progress' | 'closed' | 'reopen';
  ticketStatus?: {
    id: number;
    name: string;
    displayName: string;
    color: string;
  };
  farmer: {
    name: string;
    phone: string;
  };
  zone: {
    name: string;
    code: string;
  };
  branch: {
    name: string;
    code: string;
  };
  line: {
    name: string;
    code: string;
  };
  assignedTo?: {
    name: string;
    email: string;
  };
  slaDeadline: string;
  createdAt: string;
}

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
    zoneId: '',
    branchId: '',
    lineId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedComplaint, setEditedComplaint] = useState<Complaint | null>(null);
  const [callLogDialogOpen, setCallLogDialogOpen] = useState(false);
  const [callLogText, setCallLogText] = useState('');
  const [callLogOutcome, setCallLogOutcome] = useState<'connected' | 'no_answer' | 'busy' | 'wrong_number'>('connected');
  const [callLogDuration, setCallLogDuration] = useState<number>(0);
  const [callLogNextFollowUp, setCallLogNextFollowUp] = useState<string>('');
  const [callLogComplaintStatus, setCallLogComplaintStatus] = useState<string>('open');
  const [callLogComplaintDate, setCallLogComplaintDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  interface CallLogItem {
    id?: number;
    complaintStatus?: 'open' | 'progress' | 'closed' | 'reopen';
    createdAt?: string;
    outcome?: 'connected' | 'no_answer' | 'busy' | 'wrong_number';
    duration?: number;
    remarks?: string;
    nextFollowUpDate?: string;
    complaintStatusDate?: string;
    caller?: {
      name: string;
      email: string;
    };
    callStatus?: {
      name: string;
      displayName: string;
      color: string;
      icon?: string;
    };
  }
  
  const [callLogs, setCallLogs] = useState<CallLogItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'normal' as 'normal' | 'urgent' | 'critical',
    farmerId: 0,
    zoneId: 0,
    branchId: 0,
    lineId: 0,
    equipmentId: '',
  });
  
  // Farmer selection states - new flexible approach
  interface ZoneOption { id: number; name: string; code?: string }
  interface BranchOption { id: number; name: string; code?: string; zone?: ZoneOption }
  interface LineOption { id: number; name: string; code?: string; branchId: number; branch?: BranchOption }
  interface FarmerOption { id: number; name: string; phone?: string; farmCode: string; zoneId: number; branchId: number; lineId: number; line?: LineOption; address?: string; village?: string; shedType?: string }
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [lines, setLines] = useState<LineOption[]>([]);
  
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerOption | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneOption | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<BranchOption | null>(null);
  const [selectedLine, setSelectedLine] = useState<LineOption | null>(null);
  
  // Input field values for flexible selection
  const [zoneInput, setZoneInput] = useState('');
  const [branchInput, setBranchInput] = useState('');
  const [lineInput, setLineInput] = useState('');
  const [farmInput, setFarmInput] = useState('');
  
  // Filtered options for each field
  const [filteredZones, setFilteredZones] = useState<ZoneOption[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<BranchOption[]>([]);
  const [filteredLines, setFilteredLines] = useState<LineOption[]>([]);
  const [filteredFarmers, setFilteredFarmers] = useState<FarmerOption[]>([]);
  useAuthStore();
  const { theme } = useCustomTheme();

  useEffect(() => {
    fetchComplaints();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchCallLogs = async (complaintId: number) => {
    try {
      const data = await api.callLogs.list(complaintId);
      setCallLogs(data.callLogs || []);
      
      // Auto-select previous call's complaint status if available
      if (data.callLogs && data.callLogs.length > 0) {
        const lastCall = data.callLogs[0];
        setCallLogComplaintStatus(lastCall.complaintStatus || 'open');
        setCallLogComplaintDate(new Date().toISOString().split('T')[0]);
      } else {
        // Default to current complaint status if no previous calls
        setCallLogComplaintStatus(selectedComplaint?.status || 'open');
        setCallLogComplaintDate(new Date().toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Failed to fetch call logs:', error);
      setCallLogs([]);
      // Default values on error
      setCallLogComplaintStatus(selectedComplaint?.status || 'open');
      setCallLogComplaintDate(new Date().toISOString().split('T')[0]);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.zoneId) params.zoneId = filters.zoneId;
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.lineId) params.lineId = filters.lineId;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      
      const data = await api.complaints.list(params);
      setComplaints(data.complaints);
    } catch (error) {
      setError('Failed to load complaints');
      console.error('Complaints error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFarmerSearch = async (searchValue: string) => {
    if (searchValue.length >= 2) {
      try {
        // Search farmers by name or farm code
        const params: Record<string, string | number> = { search: searchValue };
        
        // If we have selected branch, prioritize that branch
        if (selectedBranch) {
          params.branchId = selectedBranch.id;
        }
        
        const data = await api.masters.farmers.list(params);
        setFilteredFarmers(data.farmers);
      } catch (error) {
        console.error('Failed to search farmers:', error);
      }
    }
  };

  // Fetch zones, branches, and farmers for selection
  const fetchZones = async () => {
    try {
      const data = await api.masters.zones.list();
      setZones(data.zones);
      setFilteredZones(data.zones);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    }
  };

  const fetchBranches = async (zoneId?: number) => {
    try {
      const data = await api.masters.branches.list(zoneId);
      setBranches(data.branches);
      setFilteredBranches(data.branches);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchLines = async (branchId?: number) => {
    try {
      const data = await api.masters.lines.list(branchId);
      setLines(data.lines);
      setFilteredLines(data.lines);
    } catch (error) {
      console.error('Failed to fetch lines:', error);
    }
  };

  const fetchFarmers = async (search?: string, branchId?: number, zoneId?: number) => {
    try {
      const params: Record<string, string | number> = {};
      if (search) params.search = search;
      if (branchId) params.branchId = branchId;
      if (zoneId) params.zoneId = zoneId;
      
      const data = await api.masters.farmers.list(params);
      setFilteredFarmers(data.farmers);
    } catch (error) {
      console.error('Failed to fetch farmers:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'urgent': return 'warning';
      case 'normal': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string | { color?: string; name?: string }): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (typeof status === 'object') {
      // For TicketStatus objects, use the name field
      const statusName = status.name || 'default';
      switch (statusName) {
        case 'open': return 'info';
        case 'progress': return 'warning';
        case 'closed': return 'success';
        case 'reopen': return 'error';
        default: return 'default';
      }
    }
    switch (status) {
      case 'open': return 'info';
      case 'progress': return 'warning';
      case 'closed': return 'success';
      case 'reopen': return 'error';
      default: return 'default';
    }
  };

  const getStatusDisplayName = (status: string | { displayName?: string; name?: string }) => {
    // If status is an object, use displayName or fall back to name
    if (typeof status === 'object') {
      return status.displayName || status.name || 'Unknown';
    }
    // Fallback to old string status for backward compatibility
    return status?.replace('_', ' ') || 'Unknown';
  };

  const hasStatusName = (complaint: Complaint, statusName: string) => {
    if (!complaint || !statusName) {
      return false;
    }
    
    // Check if complaint has ticketStatus object with name
    if (complaint.ticketStatus && typeof complaint.ticketStatus === 'object') {
      return complaint.ticketStatus.name === statusName;
    }
    // Fallback to old status field for backward compatibility
    return complaint.status === statusName;
  };

  const getComplaintStatusForDisplay = (complaint: Complaint) => {
    if (!complaint) {
      return { name: 'open', displayName: 'Open', color: 'info' };
    }
    
    if (complaint.ticketStatus && typeof complaint.ticketStatus === 'object') {
      return {
        name: complaint.ticketStatus.name || 'open',
        displayName: complaint.ticketStatus.displayName || 'Open',
        color: complaint.ticketStatus.color || 'info'
      };
    }
    
    // Fallback to basic status
    const statusMap = {
      'open': { name: 'open', displayName: 'Open', color: 'info' },
      'progress': { name: 'progress', displayName: 'Progress', color: 'warning' },
      'closed': { name: 'closed', displayName: 'Closed', color: 'success' },
      'reopen': { name: 'reopen', displayName: 'Re-open', color: 'error' }
    };
    return statusMap[complaint.status as keyof typeof statusMap] || statusMap['open'];
  };

  const getCallStatusForDisplay = (callLog: CallLogItem) => {
    if (callLog.callStatus && typeof callLog.callStatus === 'object') {
      return {
        name: callLog.callStatus.name,
        displayName: callLog.callStatus.displayName,
        color: callLog.callStatus.color
      };
    }
    // Fallback to basic outcome
    const outcomeMap = {
      'connected': { name: 'connected', displayName: 'Connected', color: 'success' },
      'no_answer': { name: 'no_answer', displayName: 'No Answer', color: 'warning' },
      'busy': { name: 'busy', displayName: 'Busy', color: 'info' },
      'wrong_number': { name: 'wrong_number', displayName: 'Wrong Number', color: 'error' }
    };
    return outcomeMap[callLog.outcome as keyof typeof outcomeMap] || outcomeMap['connected'];
  };

  const isSLABreached = (slaDeadline: string) => {
    return new Date(slaDeadline) < new Date();
  };

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setEditMode(false); // Ensure we're in view mode
    setEditedComplaint(null); // Clear any edit data
    fetchCallLogs(complaint.id);
    setDialogOpen(true);
  };

  const handleEditComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setEditedComplaint({ ...complaint });
    setEditMode(true);
    setCallLogDialogOpen(false); // Close call log dialog if open
    setCreateDialogOpen(false); // Close create dialog if open
    setDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editedComplaint) return;
    
    try {
      setError(null);
      await api.complaints.update(editedComplaint.id, editedComplaint);
      
      // Update local state
      setComplaints(prev => prev.map(c => 
        c.id === editedComplaint.id ? editedComplaint : c
      ));
      
      setEditMode(false);
      setSelectedComplaint(editedComplaint);
    } catch (error) {
      setError('Failed to update complaint');
      console.error('Edit error:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedComplaint(null);
    if (selectedComplaint) {
      setEditedComplaint({ ...selectedComplaint });
    }
  };

  const handleCallLog = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDialogOpen(false); // Close details dialog if open
    setCreateDialogOpen(false); // Close create dialog if open
    setCallLogDialogOpen(true);
  };

  const handleSaveCallLog = async () => {
    if (!selectedComplaint || !callLogText.trim()) return;
    
    try {
      setError(null);
      
      // Create call log with all details including complaint status
      await api.callLogs.create({
        complaintId: selectedComplaint.id,
        outcome: callLogOutcome,
        remarks: callLogText,
        duration: callLogDuration,
        nextFollowUpDate: callLogNextFollowUp || null,
        complaintStatus: callLogComplaintStatus,
        complaintStatusDate: callLogComplaintDate,
      });
      
      // Update complaint status based on selected complaint status in call log
      if (callLogComplaintStatus !== selectedComplaint.status) {
        await api.complaints.updateStatus(selectedComplaint.id, callLogComplaintStatus, callLogText);
        
        // Update local state
        setSelectedComplaint(prev => prev ? { ...prev, status: callLogComplaintStatus as 'open' | 'progress' | 'closed' | 'reopen' } : null);
      }
      
      // Reset form and refresh data
      setCallLogText('');
      setCallLogOutcome('connected');
      setCallLogDuration(0);
      setCallLogNextFollowUp('');
      setCallLogDialogOpen(false);
      
      // Refresh call logs and complaints
      fetchCallLogs(selectedComplaint.id);
      fetchComplaints();
      
    } catch (error) {
      setError('Failed to save call log');
      console.error('Call log error:', error);
    }
  };

  const handleCreateComplaint = () => {
    setNewComplaint({
      title: '',
      description: '',
      category: '',
      priority: 'normal',
      farmerId: 0,
      zoneId: 0,
      branchId: 0,
      lineId: 0,
      equipmentId: '',
    });
    
    // Reset all selection states
    setSelectedFarmer(null);
    setSelectedZone(null);
    setSelectedBranch(null);
    setSelectedLine(null);
    
    // Reset input fields
    setZoneInput('');
    setBranchInput('');
    setLineInput('');
    setFarmInput('');
    
    // Reset filtered options
    setFilteredZones([]);
    setFilteredBranches([]);
    setFilteredLines([]);
    setFilteredFarmers([]);
    
    // Reset data arrays
    setBranches([]);
    setLines([]);
    setFilteredFarmers([]);
    
    // Fetch initial data
    fetchZones();
    fetchBranches();
    fetchLines();
    fetchFarmers();
    
    setCreateDialogOpen(true);
  };

  // Smart input handlers for flexible selection
  const handleZoneInputChange = (value: string) => {
    setZoneInput(value);
    if (value.length >= 1) {
      const filtered = zones.filter(zone => 
        zone.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredZones(filtered);
    } else {
      setFilteredZones(zones);
    }
  };

  const handleBranchInputChange = (value: string) => {
    setBranchInput(value);
    if (value.length >= 1) {
      const filtered = branches.filter(branch => 
        branch.name.toLowerCase().includes(value.toLowerCase()) ||
        branch.code.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredBranches(filtered);
      
      // If user types branch name, auto-fetch farmers for that branch
      if (filtered.length === 1 && value.length >= 3) {
        fetchFarmers('', filtered[0].id);
      }
    } else {
      setFilteredBranches(branches);
    }
  };

  const handleLineInputChange = (value: string) => {
    setLineInput(value);
    if (value.length >= 1) {
      const filtered = lines.filter(line => 
        line.name.toLowerCase().includes(value.toLowerCase()) ||
        line.code.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLines(filtered);
    } else {
      setFilteredLines(lines);
    }
  };

  

  const handleZoneChange = (zone: ZoneOption) => {
    if (zone) {
      setSelectedZone(zone);
      setZoneInput(zone.name);
      fetchBranches(zone.id);
      // Reset dependent fields
      setSelectedBranch(null);
      setSelectedLine(null);
      setSelectedFarmer(null);
      setBranchInput('');
      setLineInput('');
      setFarmInput('');
      setBranches([]);
      setLines([]);
    }
  };

  const handleBranchChange = (branch: BranchOption) => {
    if (branch) {
      setSelectedBranch(branch);
      setBranchInput(branch.name);
      fetchLines(branch.id);
      fetchFarmers('', branch.id);
      // Reset dependent fields
      setSelectedLine(null);
      setSelectedFarmer(null);
      setLineInput('');
      setFarmInput('');
      setLines([]);
    }
  };

  const handleLineSelect = (line: LineOption) => {
    if (line) {
      setSelectedLine(line);
      setLineInput(line.name);
      setFilteredLines([]);
      // Fetch farmers for this line
      fetchFarmers('', line.branchId);
      setSelectedFarmer(null);
      setFarmInput('');
    }
  };

  const handleFarmerSelect = (farmer: FarmerOption) => {
    if (farmer) {
      setSelectedFarmer(farmer);
      setFarmInput(`${farmer.name} (${farmer.farmCode})`);
      setFilteredFarmers([]);
      
      // Auto-fill the hierarchy when farmer is selected directly
      if (farmer.line) {
        setSelectedZone(farmer.line.branch.zone);
        setSelectedBranch(farmer.line.branch);
        setSelectedLine(farmer.line);
        
        setZoneInput(farmer.line.branch.zone.name);
        setBranchInput(farmer.line.branch.name);
        setLineInput(farmer.line.name);
        
        // Fetch the related data for the hierarchy
        fetchBranches(farmer.line.branch.zone.id);
        fetchLines(farmer.line.branch.id);
      }
      
      // Update complaint data
      setNewComplaint(prev => ({
        ...prev,
        farmerId: farmer.id,
        zoneId: farmer.zoneId,
        branchId: farmer.branchId,
        lineId: farmer.lineId
      }));
    }
  };

  const handleSaveNewComplaint = async () => {
    try {
      setError(null);
      
      // Validate required fields
      if (!newComplaint.title || !newComplaint.description || !newComplaint.category || !newComplaint.priority || !newComplaint.farmerId) {
        setError('Please fill in all required fields including farmer selection');
        return;
      }

      // Create the complaint
      await api.complaints.create({
        title: newComplaint.title,
        description: newComplaint.description,
        category: newComplaint.category,
        priority: newComplaint.priority,
        farmerId: newComplaint.farmerId || undefined,
        zoneId: newComplaint.zoneId || undefined,
        branchId: newComplaint.branchId || undefined,
        lineId: newComplaint.lineId || undefined,
        equipmentId: newComplaint.equipmentId || undefined,
      });

      setCreateDialogOpen(false);
      fetchComplaints(); // Refresh the list
    } catch (error) {
      setError('Failed to create complaint');
      console.error('Create complaint error:', error);
    }
  };

  return (
    <Box className="page-container" sx={{ flexGrow: 1 }}>
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
              Complaint Management
            </h1>
            <p className={`dashboard-header-subtitle text-base ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Manage and track all farmer complaints with zone-based filtering
            </p>
          </div>
          <div className="dashboard-header-actions flex items-center justify-end gap-3">
            <ExportActions variant="compact" />
            <Button
              variant="contained"
              className="btn-primary"
              startIcon={<AddIcon />}
              onClick={handleCreateComplaint}
            >
              New Complaint
            </Button>
          </div>
        </div>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 'var(--border-radius-lg)',
              backgroundColor: 'var(--surface-error)',
              border: '1px solid var(--border-error)',
            }}
          >
            {error}
          </Alert>
        )}
      </div>

      {/* Statistics Overview */}
      <KPIStatGroup className="dashboard-stats-grid mb-6" sx={{ marginBottom: '24px' }} columns={4}>
        <KPIStat
          title="Open Complaints"
          value={complaints.filter(c => hasStatusName(c, 'open')).length.toLocaleString()}
          change={5}
          trend="up"
          variant="accent"
          icon={<AssignmentIcon sx={{ fontSize: 24 }} />}
        />
        <KPIStat
          title="In Progress"
          value={complaints.filter(c => hasStatusName(c, 'progress')).length.toLocaleString()}
          change={3}
          trend="up"
          variant="warning"
          icon={<ScheduleIcon sx={{ fontSize: 24 }} />}
        />
        <KPIStat
          title="Closed"
          value={complaints.filter(c => hasStatusName(c, 'closed')).length.toLocaleString()}
          change={12}
          trend="up"
          variant="success"
          icon={<CheckCircleIcon sx={{ fontSize: 24 }} />}
        />
        <KPIStat
          title="Re-opened"
          value={complaints.filter(c => c.status === 'reopen').length.toLocaleString()}
          change={-2}
          trend="down"
          variant="error"
          icon={<RefreshIcon sx={{ fontSize: 24 }} />}
        />
      </KPIStatGroup>

      {/* Filters Section */}
      <Card className="card-base" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Filters
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </Box>
          
          {showFilters && (
            <Box sx={{ 
              p: 2, 
              backgroundColor: 'var(--surface-glass)', 
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 2, fontWeight: 600, fontSize: '0.875rem' }}>
                🔍 Filter Options
              </Typography>
              <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'var(--text-secondary)' }}>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    sx={{ 
                      borderRadius: 'var(--border-radius-md)',
                      backgroundColor: 'var(--background-paper)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-main)'
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ color: 'var(--text-primary)' }}>All</MenuItem>
                    <MenuItem value="open" sx={{ color: 'var(--text-primary)' }}>Open</MenuItem>
                    <MenuItem value="progress" sx={{ color: 'var(--text-primary)' }}>Progress</MenuItem>
                    <MenuItem value="closed" sx={{ color: 'var(--text-primary)' }}>Closed</MenuItem>
                    <MenuItem value="reopen" sx={{ color: 'var(--text-primary)' }}>Re-open</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'var(--text-secondary)' }}>Priority</InputLabel>
                  <Select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    sx={{ 
                      borderRadius: 'var(--border-radius-md)',
                      backgroundColor: 'var(--background-paper)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-main)'
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ color: 'var(--text-primary)' }}>All</MenuItem>
                    <MenuItem value="normal" sx={{ color: 'var(--text-primary)' }}>Normal</MenuItem>
                    <MenuItem value="urgent" sx={{ color: 'var(--text-primary)' }}>Urgent</MenuItem>
                    <MenuItem value="critical" sx={{ color: 'var(--text-primary)' }}>Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'var(--text-secondary)' }}>Category</InputLabel>
                  <Select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    sx={{ 
                      borderRadius: 'var(--border-radius-md)',
                      backgroundColor: 'var(--background-paper)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-main)'
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ color: 'var(--text-primary)' }}>All</MenuItem>
                    <MenuItem value="equipment" sx={{ color: 'var(--text-primary)' }}>Equipment</MenuItem>
                    <MenuItem value="feed" sx={{ color: 'var(--text-primary)' }}>Feed</MenuItem>
                    <MenuItem value="medicine" sx={{ color: 'var(--text-primary)' }}>Medicine</MenuItem>
                    <MenuItem value="service" sx={{ color: 'var(--text-primary)' }}>Service</MenuItem>
                    <MenuItem value="billing" sx={{ color: 'var(--text-primary)' }}>Billing</MenuItem>
                    <MenuItem value="other" sx={{ color: 'var(--text-primary)' }}>Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'var(--text-secondary)' }}>Zone</InputLabel>
                  <Select
                    value={filters.zoneId}
                    onChange={(e) => setFilters({ ...filters, zoneId: e.target.value, branchId: '', lineId: '' })}
                    sx={{ 
                      borderRadius: 'var(--border-radius-md)',
                      backgroundColor: 'var(--background-paper)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-main)'
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ color: 'var(--text-primary)' }}>All Zones</MenuItem>
                    {zones.map(zone => (
                      <MenuItem key={zone.id} value={zone.id} sx={{ color: 'var(--text-primary)' }}>{zone.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'var(--text-secondary)' }}>Branch</InputLabel>
                  <Select
                    value={filters.branchId}
                    onChange={(e) => setFilters({ ...filters, branchId: e.target.value, lineId: '' })}
                    disabled={!filters.zoneId}
                    sx={{ 
                      borderRadius: 'var(--border-radius-md)',
                      backgroundColor: 'var(--background-paper)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-main)'
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'var(--action-disabled-background)'
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ color: 'var(--text-primary)' }}>All Branches</MenuItem>
                    {branches.filter(branch => !filters.zoneId || branch.zone?.id === Number(filters.zoneId)).map(branch => (
                      <MenuItem key={branch.id} value={branch.id} sx={{ color: 'var(--text-primary)' }}>{branch.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'var(--text-secondary)' }}>Line</InputLabel>
                  <Select
                    value={filters.lineId}
                    onChange={(e) => setFilters({ ...filters, lineId: e.target.value })}
                    disabled={!filters.branchId}
                    sx={{ 
                      borderRadius: 'var(--border-radius-md)',
                      backgroundColor: 'var(--background-paper)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary-main)'
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'var(--action-disabled-background)'
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ color: 'var(--text-primary)' }}>All Lines</MenuItem>
                    {lines.filter(line => !filters.branchId || line.branchId === Number(filters.branchId)).map(line => (
                      <MenuItem key={line.id} value={line.id} sx={{ color: 'var(--text-primary)' }}>{line.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="From Date"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ borderRadius: 'var(--border-radius-md)' }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="To Date"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ borderRadius: 'var(--border-radius-md)' }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by farmer name or phone"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'var(--text-secondary)' }} />,
                  }}
                  sx={{ borderRadius: 'var(--border-radius-md)' }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchComplaints}
                  fullWidth
                  sx={{ borderRadius: 'var(--border-radius-md)' }}
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />
            <Typography variant="body2" sx={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading complaints...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Complaints Table */}
      {!loading && (
        <TableContainer 
          className="complaints-table-container"
          component={Paper} 
          sx={{ 
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <Table className="complaints-table">
            <TableHead className="complaints-table-head" sx={{ 
              backgroundColor: 'var(--surface-glass)',
              borderBottom: '2px solid var(--border-subtle)'
            }}>
              <TableRow>
                <TableCell className="complaints-table-th" sx={{ 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Ticket #</TableCell>
                <TableCell className="complaints-table-th" sx={{ 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Farmer</TableCell>
                <TableCell className="complaints-table-th" sx={{ 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Title</TableCell>
                <TableCell className="complaints-table-th" sx={{ 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Zone/Branch</TableCell>
                <TableCell className="complaints-table-th" sx={{ 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Priority</TableCell>
                <TableCell className="complaints-table-th" sx={{ 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Status</TableCell>
                <TableCell className="complaints-table-th" sx={{ 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>SLA</TableCell>
                <TableCell className="complaints-table-th" sx={{ 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Assigned</TableCell>
                <TableCell className="complaints-table-th" sx={{ 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {complaints.map((complaint) => (
                <TableRow 
                  key={complaint.id}
                  className="complaints-table-row"
                  sx={{
                    '&:hover': {
                      backgroundColor: 'var(--surface-hover)',
                    },
                    '&.MuiTableRow-root': {
                      borderBottom: '1px solid var(--border-subtle)',
                    }
                  }}
                >
                  <TableCell className="complaints-table-td" sx={{ color: 'var(--text-primary)' }}>
                    <Typography variant="body2" fontWeight="600" color="var(--primary-main)">
                      {complaint.ticketNumber}
                    </Typography>
                  </TableCell>
                  <TableCell className="complaints-table-td" sx={{ color: 'var(--text-primary)' }}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium" color="var(--text-primary)">
                        {complaint.farmer?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="var(--text-secondary)">
                        {complaint.farmer?.phone || 'Unknown'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell className="complaints-table-td" sx={{ color: 'var(--text-primary)' }}>
                    <Typography variant="body2" color="var(--text-primary)" sx={{ mb: 0.5 }}>
                      {complaint.title}
                    </Typography>
                    <Chip 
                      label={complaint.category} 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'var(--primary-100)',
                        color: 'var(--primary-800)',
                        fontSize: '0.7rem',
                        border: '1px solid var(--primary-200)'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)' }}>
                    <Box>
                      <Typography variant="body2" fontWeight="500" color="var(--text-primary)">
                        {complaint.zone?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="var(--text-secondary)">
                        {complaint.branch?.name || 'Unknown'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)' }}>
                    <Chip
                      label={complaint.priority.toUpperCase()}
                      color={getPriorityColor(complaint.priority)}
                      size="small"
                      sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)' }}>
                    <Chip
                      label={getComplaintStatusForDisplay(complaint).displayName.toUpperCase()}
                      color={getComplaintStatusForDisplay(complaint).color as any}
                      size="small"
                      sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)' }}>
                    <Typography
                      variant="body2"
                      color={isSLABreached(complaint.slaDeadline) ? 'var(--error-main)' : 'var(--text-primary)'}
                      fontWeight={isSLABreached(complaint.slaDeadline) ? 600 : 400}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {new Date(complaint.slaDeadline).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="var(--text-secondary)" sx={{ fontSize: '0.75rem' }}>
                      {new Date(complaint.slaDeadline).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)' }}>
                    {complaint.assignedTo ? (
                      <Typography variant="body2" color="var(--text-primary)" sx={{ fontSize: '0.875rem' }}>
                        {complaint.assignedTo.name}
                      </Typography>
                    ) : (
                      <Chip 
                        label="Not Assigned" 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          color: 'var(--text-secondary)', 
                          borderColor: 'var(--border-subtle)',
                          fontSize: '0.75rem',
                          backgroundColor: 'transparent'
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'var(--text-primary)' }}>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewComplaint(complaint);
                          }}
                          sx={{ 
                            color: 'var(--primary-main)',
                            backgroundColor: 'transparent',
                            '&:hover': { 
                              backgroundColor: 'var(--primary-100)',
                              color: 'var(--primary-dark)'
                            },
                            '&:disabled': {
                              color: 'var(--action-disabled-text)'
                            }
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Complaint">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditComplaint(complaint);
                          }}
                          sx={{ 
                            color: 'var(--warning-main)',
                            backgroundColor: 'transparent',
                            '&:hover': { 
                              backgroundColor: 'var(--warning-100)',
                              color: 'var(--warning-dark)'
                            },
                            '&:disabled': {
                              color: 'var(--action-disabled-text)'
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Call Log">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCallLog(complaint);
                          }}
                          sx={{ 
                            color: 'var(--success-main)',
                            backgroundColor: 'transparent',
                            '&:hover': { 
                              backgroundColor: 'var(--success-100)',
                              color: 'var(--success-dark)'
                            },
                            '&:disabled': {
                              color: 'var(--action-disabled-text)'
                            }
                          }}
                        >
                          <PhoneIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Complaint Details Dialog */}
      <Dialog
        className="complaints-dialog"
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-elevated)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-subtle)',
          }
        }}
      >
        <DialogTitle className="complaints-dialog-title" sx={{ 
          backgroundColor: 'var(--surface-glass)',
          borderBottom: '1px solid var(--border-subtle)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 3,
          py: 2
        }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%',
            backgroundColor: 'var(--primary-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {selectedComplaint?.ticketNumber?.charAt(0) || 'C'}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Complaint Details
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              {selectedComplaint?.ticketNumber}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Chip 
              label={selectedComplaint?.priority?.toUpperCase()}
              color={getPriorityColor(selectedComplaint?.priority) as any}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={getComplaintStatusForDisplay(selectedComplaint)?.displayName?.toUpperCase()}
              color={getComplaintStatusForDisplay(selectedComplaint)?.color as any}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </DialogTitle>
        <DialogContent className="complaints-dialog-content" sx={{ pt: 0, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', p: 0 }}>
          {selectedComplaint && (
            <Box>
              {/* Quick Stats Bar */}
              <Box sx={{ 
                backgroundColor: 'var(--surface-glass)', 
                borderBottom: '1px solid var(--border-subtle)',
                p: 3,
                display: 'flex',
                gap: 3,
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                    Category
                  </Typography>
                  <Chip 
                    label={selectedComplaint.category} 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary-main)',
                      fontWeight: 600 
                    }}
                  />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                    Priority
                  </Typography>
                  <Chip
                    label={selectedComplaint.priority.toUpperCase()}
                    color={getPriorityColor(selectedComplaint.priority)}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                    Status
                  </Typography>
                  <Chip
                    label={getComplaintStatusForDisplay(selectedComplaint).displayName.toUpperCase()}
                    color={getComplaintStatusForDisplay(selectedComplaint).color as any}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                    SLA
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: isSLABreached(selectedComplaint.slaDeadline) ? 'var(--status-error)' : 'var(--success-main)',
                      fontWeight: 600
                    }}
                  >
                    {new Date(selectedComplaint.slaDeadline).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                    Created
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Main Content - Full Width for Better Layout */}
                  <Grid size={{ xs: 12 }}>
                    {/* Complaint Details Card */}
                    <Card sx={{ 
                      backgroundColor: 'var(--surface-base)', 
                      mb: 3, 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: 'var(--border-radius-lg)',
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        backgroundColor: 'var(--surface-elevated)', 
                        borderBottom: '1px solid var(--border-subtle)',
                        p: 2
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ fontSize: '20px' }}>📝</Box>
                          Complaint Details
                        </Typography>
                      </Box>
                      <CardContent sx={{ p: 3 }}>
                        {editMode ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <TextField
                              label="Title"
                              value={editedComplaint?.title || ''}
                              onChange={(e) => setEditedComplaint(prev => prev ? { ...prev, title: e.target.value } : null)}
                              size="small"
                              fullWidth
                              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'var(--surface-elevated)' } }}
                            />
                            <TextField
                              label="Description"
                              value={editedComplaint?.description || ''}
                              onChange={(e) => setEditedComplaint(prev => prev ? { ...prev, description: e.target.value } : null)}
                              size="small"
                              fullWidth
                              multiline
                              rows={4}
                              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'var(--surface-elevated)' } }}
                            />
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl size="small" fullWidth>
                                  <InputLabel>Category</InputLabel>
                                  <Select
                                    value={editedComplaint?.category || ''}
                                    onChange={(e) => setEditedComplaint(prev => prev ? { ...prev, category: e.target.value } : null)}
                                    label="Category"
                                    sx={{ backgroundColor: 'var(--surface-elevated)' }}
                                  >
                                    <MenuItem value="equipment">Equipment</MenuItem>
                                    <MenuItem value="feed">Feed</MenuItem>
                                    <MenuItem value="medicine">Medicine</MenuItem>
                                    <MenuItem value="service">Service</MenuItem>
                                    <MenuItem value="billing">Billing</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl size="small" fullWidth>
                                  <InputLabel>Priority</InputLabel>
                                  <Select
                                    value={editedComplaint?.priority || ''}
                                    onChange={(e) => setEditedComplaint(prev => prev ? { ...prev, priority: e.target.value as 'normal' | 'urgent' | 'critical' } : null)}
                                    label="Priority"
                                    sx={{ backgroundColor: 'var(--surface-elevated)' }}
                                  >
                                    <MenuItem value="normal">Normal</MenuItem>
                                    <MenuItem value="urgent">Urgent</MenuItem>
                                    <MenuItem value="critical">Critical</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl size="small" fullWidth>
                                  <InputLabel>Status</InputLabel>
                                  <Select
                                    value={editedComplaint?.status || ''}
                                    onChange={(e) => setEditedComplaint(prev => prev ? { ...prev, status: e.target.value as 'open' | 'progress' | 'closed' | 'reopen' } : null)}
                                    label="Status"
                                    sx={{ backgroundColor: 'var(--surface-elevated)' }}
                                  >
                                    <MenuItem value="open">Open</MenuItem>
                                    <MenuItem value="progress">Progress</MenuItem>
                                    <MenuItem value="closed">Closed</MenuItem>
                                    <MenuItem value="reopen">Re-open</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                            </Grid>
                          </Box>
                        ) : (
                          <Box>
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1, fontWeight: 600 }}>
                                Title
                              </Typography>
                              <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.3 }}>
                                {selectedComplaint.title}
                              </Typography>
                            </Box>
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1, fontWeight: 600 }}>
                                Description
                              </Typography>
                              <Typography variant="body1" sx={{ color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                {selectedComplaint.description}
                              </Typography>
                            </Box>
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1, fontWeight: 600 }}>
                                    Category
                                  </Typography>
                                  <Chip 
                                    label={selectedComplaint.category} 
                                    size="small" 
                                    sx={{ 
                                      backgroundColor: 'var(--primary-light)',
                                      color: 'var(--primary-main)',
                                      fontWeight: 600,
                                      px: 1
                                    }}
                                  />
                                </Box>
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1, fontWeight: 600 }}>
                                    Priority
                                  </Typography>
                                  <Chip
                                    label={selectedComplaint.priority.toUpperCase()}
                                    color={getPriorityColor(selectedComplaint.priority)}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                  />
                                </Box>
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1, fontWeight: 600 }}>
                                    Status
                                  </Typography>
                                  <Chip
                                    label={getComplaintStatusForDisplay(selectedComplaint).displayName.toUpperCase()}
                                    color={getComplaintStatusForDisplay(selectedComplaint).color as any}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                  />
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                        )}
                      </CardContent>
                    </Card>

                    {/* Farmer Information Card */}
                    <Card sx={{ 
                      backgroundColor: 'var(--surface-base)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: 'var(--border-radius-lg)',
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        backgroundColor: 'var(--surface-elevated)', 
                        borderBottom: '1px solid var(--border-subtle)',
                        p: 2
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ fontSize: '20px' }}>👨‍🌾</Box>
                          Farmer & Location
                        </Typography>
                      </Box>
                      <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1, fontWeight: 600 }}>
                                Farmer Name
                              </Typography>
                              <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                {selectedComplaint.farmer?.name || 'Unknown'}
                              </Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1, fontWeight: 600 }}>
                                Contact Number
                              </Typography>
                              <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                {selectedComplaint.farmer?.phone || 'Unknown'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1, fontWeight: 600 }}>
                                Zone
                              </Typography>
                              <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                {selectedComplaint.zone?.name || 'Unknown'}
                              </Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1, fontWeight: 600 }}>
                                Branch
                              </Typography>
                              <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                {selectedComplaint.branch?.name || 'Unknown'}
                              </Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 1, fontWeight: 600 }}>
                                Line
                              </Typography>
                              <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                {selectedComplaint.line?.name || 'Unknown'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="complaints-dialog-actions" sx={{ 
          backgroundColor: 'var(--surface-glass)',
          borderTop: '1px solid var(--border-subtle)',
          px: 3,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {editMode ? (
            <Box display="flex" gap={2}>
              <Button 
                onClick={handleCancelEdit}
                variant="outlined"
                sx={{ 
                  borderRadius: 'var(--border-radius-md)',
                  px: 3,
                  py: 1
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                variant="contained"
                sx={{ 
                  borderRadius: 'var(--border-radius-md)',
                  px: 3,
                  py: 1,
                  fontWeight: 600
                }}
              >
                Save Changes
              </Button>
            </Box>
          ) : (
            <Box display="flex" gap={2} width="100%">
              <Box display="flex" gap={1}>
                <Button 
                  onClick={() => setCallLogDialogOpen(true)}
                  variant="contained"
                  color="primary"
                  startIcon={<PhoneIcon />}
                  sx={{ 
                    borderRadius: 'var(--border-radius-md)',
                    px: 2,
                    py: 1,
                    fontWeight: 600
                  }}
                >
                  New Call
                </Button>
                <Button 
                  onClick={() => setEditMode(true)}
                  variant="outlined"
                  startIcon={<EditIcon />}
                  sx={{ 
                    borderRadius: 'var(--border-radius-md)',
                    px: 2,
                    py: 1
                  }}
                >
                  Edit
                </Button>
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Button 
                  onClick={() => setDialogOpen(false)}
                  variant="text"
                  sx={{ 
                    borderRadius: 'var(--border-radius-md)',
                    px: 2,
                    py: 1,
                    color: 'var(--text-secondary)'
                  }}
                >
                  Close
                </Button>
              </Box>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      {/* Enhanced Call Log Dialog */}
      <Dialog
        className="complaints-dialog"
        open={callLogDialogOpen}
        onClose={() => setCallLogDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-elevated)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-subtle)',
          }
        }}
      >
        <DialogTitle className="complaints-dialog-title" sx={{ 
          backgroundColor: 'var(--surface-glass)',
          borderBottom: '1px solid var(--border-subtle)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 3,
          py: 2
        }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%',
            backgroundColor: 'var(--success-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px'
          }}>
            📞
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Call Management
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              {selectedComplaint?.ticketNumber} - {selectedComplaint?.farmer?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent className="complaints-dialog-content" sx={{ pt: 0, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', p: 0 }}>
          <Grid container spacing={3}>
            
            {/* New Call Section */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ 
                backgroundColor: 'var(--surface-base)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 0,
                borderTop: 'none'
              }}>
                <Box sx={{ 
                  backgroundColor: 'var(--surface-elevated)', 
                  borderBottom: '1px solid var(--border-subtle)',
                  p: 3
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%',
                      backgroundColor: 'var(--success-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--success-main)',
                      fontSize: '16px'
                    }}>
                      🆕
                    </Box>
                    New Call Entry
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  
                  <Grid container spacing={3}>
                    {/* Call Details Section */}
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 2, fontWeight: 600, fontSize: '0.9rem' }}>
                          📞 Call Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Call Result</InputLabel>
                              <Select
                                value={callLogOutcome}
                                onChange={(e) => setCallLogOutcome(e.target.value as 'connected' | 'no_answer' | 'busy' | 'wrong_number')}
                                label="Call Result"
                              >
                                <MenuItem value="connected">✅ Connected</MenuItem>
                                <MenuItem value="no_answer">📵 No Answer</MenuItem>
                                <MenuItem value="busy">📞 Busy</MenuItem>
                                <MenuItem value="wrong_number">❌ Wrong Number</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Call Duration (minutes)"
                              type="number"
                              value={callLogDuration}
                              onChange={(e) => setCallLogDuration(parseInt(e.target.value) || 0)}
                              InputProps={{ inputProps: { min: 0, max: 120 } }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                    
                    {/* Call Notes Section */}
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 2, fontWeight: 600, fontSize: '0.9rem' }}>
                          📝 Call Notes & Remarks
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Call Notes & Remarks"
                          placeholder="Enter call details, farmer response, follow-up actions..."
                          value={callLogText}
                          onChange={(e) => setCallLogText(e.target.value)}
                          size="small"
                        />
                      </Box>
                    </Grid>
                    
                    {/* Complaint Status Section */}
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 2, fontWeight: 600, fontSize: '0.9rem' }}>
                          Status Update
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Complaint Status</InputLabel>
                              <Select
                                value={callLogComplaintStatus}
                                onChange={(e) => setCallLogComplaintStatus(e.target.value)}
                                label="Complaint Status"
                              >
                                <MenuItem value="open">Open</MenuItem>
                                <MenuItem value="progress">Progress</MenuItem>
                                <MenuItem value="closed">Closed</MenuItem>
                                <MenuItem value="reopen">Re-open</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Status Change Date"
                              type="date"
                              value={callLogComplaintDate}
                              onChange={(e) => setCallLogComplaintDate(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Next Follow-up Date"
                              type="date"
                              value={callLogNextFollowUp}
                              onChange={(e) => setCallLogNextFollowUp(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                    
                    {/* Action Buttons */}
                    <Grid size={{ xs: 12 }}>
                      <Box display="flex" gap={2}>
                        <Button 
                          onClick={handleSaveCallLog}
                          variant="contained"
                          disabled={!callLogText.trim()}
                          sx={{ borderRadius: 'var(--border-radius-md)' }}
                          size="small"
                        >
                          💾 Save Call Log
                        </Button>
                        <Button 
                          onClick={() => {
                            setCallLogText('');
                            setCallLogOutcome('connected');
                            setCallLogDuration(0);
                            setCallLogNextFollowUp('');
                          }}
                          variant="outlined"
                          sx={{ borderRadius: 'var(--border-radius-md)' }}
                          size="small"
                        >
                          🔄 Reset Form
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Call History Section */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ 
                backgroundColor: 'var(--surface-base)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 0,
                borderTop: 'none'
              }}>
                <Box sx={{ 
                  backgroundColor: 'var(--surface-elevated)', 
                  borderBottom: '1px solid var(--border-subtle)',
                  p: 3
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%',
                      backgroundColor: 'var(--info-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--info-main)',
                      fontSize: '16px'
                    }}>
                      📋
                    </Box>
                    Call History ({callLogs.length} calls)
                  </Typography>
                </Box>
                <CardContent sx={{ p: 0 }}>
                  
                  {callLogs.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                        No call logs found for this complaint.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {callLogs.map((log) => (
                        <Box key={log.id} sx={{ 
                          p: 3, 
                          mb: 2, 
                          backgroundColor: 'var(--surface-glass)', 
                          borderRadius: 'var(--border-radius-md)',
                          border: '1px solid var(--border-subtle)',
                          '&:last-child': { mb: 0 }
                        }}>
                          <Grid container spacing={3} alignItems="flex-start">
                            {/* Call Status & Time */}
                            <Grid size={{ xs: 12, sm: 3 }}>
                              <Chip 
                                label={getCallStatusForDisplay(log).displayName}
                                color={getCallStatusForDisplay(log).color as any}
                                size="small"
                                sx={{ mb: 1, fontWeight: 500 }}
                              />
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mb: 0.5 }}>
                                📅 {new Date(log.createdAt).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                                🕐 {new Date(log.createdAt).toLocaleTimeString()}
                              </Typography>
                            </Grid>
                            
                            {/* Call Details */}
                            <Grid size={{ xs: 12, sm: 3 }}>
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                  Duration
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                  {log.duration || 0} minutes
                                </Typography>
                              </Box>
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                  Caller
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                  {log.caller?.name || 'Unknown'}
                                </Typography>
                              </Box>
                              {log.complaintStatus && (
                                <Chip 
                                  label={log.complaintStatus === 'open' ? 'Open' :
                                         log.complaintStatus === 'progress' ? 'Progress' :
                                         log.complaintStatus === 'closed' ? 'Closed' : 'Re-open'}
                                  color={log.complaintStatus === 'open' ? 'info' :
                                         log.complaintStatus === 'progress' ? 'warning' :
                                         log.complaintStatus === 'closed' ? 'success' : 'error'}
                                  size="small"
                                  sx={{ mt: 1 }}
                                />
                              )}
                            </Grid>
                            
                            {/* Notes & Follow-up */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.5 }}>
                                  Notes
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                  {log.remarks || 'No remarks available'}
                                </Typography>
                              </Box>
                              
                              {(log.nextFollowUpDate || log.complaintStatusDate) && (
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                  {log.nextFollowUpDate && (
                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                      <strong>Follow-up:</strong> {new Date(log.nextFollowUpDate).toLocaleDateString()}
                                    </Typography>
                                  )}
                                  {log.complaintStatusDate && (
                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                      <strong>Status Date:</strong> {new Date(log.complaintStatusDate).toLocaleDateString()}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
          </Grid>
        </DialogContent>
        <DialogActions className="complaints-dialog-actions" sx={{ 
          backgroundColor: 'var(--surface-glass)',
          borderTop: '1px solid var(--border-subtle)',
          px: 3,
          py: 2
        }}>
          <Button 
            onClick={() => setCallLogDialogOpen(false)}
            sx={{ borderRadius: 'var(--border-radius-md)' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create New Complaint Dialog */}
      <Dialog
        className="complaints-dialog"
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-elevated)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-subtle)',
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
        scroll="paper"
      >
        <DialogTitle className="complaints-dialog-title" sx={{ 
          backgroundColor: 'var(--surface-glass)',
          borderBottom: '1px solid var(--border-subtle)',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          Create New Complaint
        </DialogTitle>
        <DialogContent className="complaints-dialog-content" sx={{ pt: 3, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
          <Grid container spacing={3}>
            
            {/* TOP: Farmer Selection Section */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', mb: 3, borderRadius: 'var(--border-radius-lg)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, color: 'var(--text-primary)', fontWeight: 600 }}>
                    🧑‍🌾 Farmer Details
                  </Typography>
                  
                  {/* 4 Flexible Input Fields */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Autocomplete
                        options={filteredZones.length > 0 ? filteredZones : zones}
                        getOptionLabel={(option) => option.name}
                        value={selectedZone}
                        onChange={(event, newValue) => handleZoneChange(newValue)}
                        inputValue={zoneInput}
                        onInputChange={(event, newInputValue) => {
                          setZoneInput(newInputValue);
                          handleZoneInputChange(newInputValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Zone"
                            placeholder="Search zone"
                          />
                        )}
                        noOptionsText="No zones found"
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Autocomplete
                        options={filteredBranches.length > 0 ? filteredBranches : branches}
                        getOptionLabel={(option) => option.name}
                        value={selectedBranch}
                        onChange={(event, newValue) => handleBranchChange(newValue)}
                        inputValue={branchInput}
                        onInputChange={(event, newInputValue) => {
                          setBranchInput(newInputValue);
                          handleBranchInputChange(newInputValue);
                        }}
                        disabled={!selectedZone && branches.length === 0}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Branch"
                            placeholder={selectedZone ? "Search branch" : "Select zone first"}
                          />
                        )}
                        noOptionsText={selectedZone ? "No branches found" : "Select zone first"}
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Autocomplete
                        options={filteredLines.length > 0 ? filteredLines : lines}
                        getOptionLabel={(option) => option.name}
                        value={selectedLine}
                        onChange={(event, newValue) => handleLineSelect(newValue)}
                        inputValue={lineInput}
                        onInputChange={(event, newInputValue) => {
                          setLineInput(newInputValue);
                          handleLineInputChange(newInputValue);
                        }}
                        disabled={!selectedBranch && lines.length === 0}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Line"
                            placeholder={selectedBranch ? "Search line" : "Select branch first"}
                          />
                        )}
                        noOptionsText={selectedBranch ? "No lines found" : "Select branch first"}
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Autocomplete
                        options={filteredFarmers}
                        getOptionLabel={(option) => `${option.name} (${option.farmCode})`}
                        value={selectedFarmer}
                        onChange={(event, newValue) => handleFarmerSelect(newValue)}
                        inputValue={farmInput}
                        onInputChange={(event, newInputValue) => {
                          setFarmInput(newInputValue);
                          // Direct farm search - fetch matching farmers
                          if (newInputValue.length >= 2) {
                            handleFarmerSearch(newInputValue);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Farm Name (Code)"
                            placeholder="Search farm name or code"
                          />
                        )}
                        noOptionsText="No farms found"
                      />
                    </Grid>
                  </Grid>
                  
                  {/* Auto-fetched Read-Only Details */}
                  {selectedFarmer && (
                    <Box sx={{ mt: 3, p: 2, backgroundColor: 'var(--surface-glass)', borderRadius: 'var(--border-radius-md)' }}>
                      <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                        Farmer Contact Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)', mb: 1 }}>
                            <strong>Address:</strong> {selectedFarmer.address}, {selectedFarmer.village}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)', mb: 1 }}>
                            <strong>Shed Type:</strong> {selectedFarmer.shedType}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)', mb: 1 }}>
                            <strong>Contact:</strong> {selectedFarmer.phone}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* MIDDLE: Complaint Details Section */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', mb: 3, borderRadius: 'var(--border-radius-lg)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, color: 'var(--text-primary)', fontWeight: 600 }}>
                    📝 Complaint Details
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Title"
                        value={newComplaint.title}
                        onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Description"
                        multiline
                        rows={3}
                        value={newComplaint.description}
                        onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={newComplaint.category}
                          onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                          label="Category"
                          required
                        >
                          <MenuItem value="">Select Category</MenuItem>
                          <MenuItem value="equipment">Equipment</MenuItem>
                          <MenuItem value="feed">Feed</MenuItem>
                          <MenuItem value="medicine">Medicine</MenuItem>
                          <MenuItem value="service">Service</MenuItem>
                          <MenuItem value="billing">Billing</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={newComplaint.priority}
                          onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value as 'normal' | 'urgent' | 'critical' })}
                          label="Priority"
                          required
                        >
                          <MenuItem value="normal">Normal</MenuItem>
                          <MenuItem value="urgent">Urgent</MenuItem>
                          <MenuItem value="critical">Critical</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* BOTTOM: Additional Information Section */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius-lg)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, color: 'var(--text-primary)', fontWeight: 600 }}>
                    🔧 Additional Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Equipment ID (Optional)"
                        type="number"
                        value={newComplaint.equipmentId}
                        onChange={(e) => setNewComplaint({ ...newComplaint, equipmentId: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
          </Grid>
        </DialogContent>
        <DialogActions className="complaints-dialog-actions" sx={{ 
          backgroundColor: 'var(--surface-glass)',
          borderTop: '1px solid var(--border-subtle)',
          px: 3,
          py: 2
        }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            sx={{ borderRadius: 'var(--border-radius-md)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveNewComplaint}
            variant="contained"
            disabled={!newComplaint.title || !newComplaint.description || !newComplaint.category || !newComplaint.priority}
            sx={{ borderRadius: 'var(--border-radius-md)' }}
          >
            Create Complaint
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add complaint"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' },
        }}
        onClick={handleCreateComplaint}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}