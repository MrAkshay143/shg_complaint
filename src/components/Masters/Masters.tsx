import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  IconButton,
  Chip,
  LinearProgress,
  Fab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  LocationOn,
  AccountBalance,
  Route,
  Person,
  Build,
} from '@mui/icons-material';
import './masters.css';
import { api } from '../../utils/api';
import { KPIStat, KPIStatGroup } from '../Charts/ChartSuite';
import { useCustomTheme } from '../../hooks/useCustomTheme';

interface Zone {
  id: number;
  name: string;
  code: string;
  description?: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  managerName: string;
  managerPhone: string;
  accountantName: string;
  accountantPhone: string;
  zoneId: number;
  zone?: Zone;
}

interface Line {
  id: number;
  name: string;
  code: string;
  supervisorName: string;
  supervisorPhone: string;
  branchId: number;
  branch?: Branch;
}

interface Farmer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  farmCode: string;
  shedType: string;
  lineId: number;
  line?: Line;
}

interface Equipment {
  id: number;
  type: string;
  serialNumber: string;
  vendor: string;
  warrantyStatus: 'active' | 'expired' | 'na';
  installedDate: string;
  warrantyExpiryDate?: string;
  farmerId: number;
  farmer?: Farmer;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Masters() {
  const [tabValue, setTabValue] = useState(0);
  const [zones, setZones] = useState<Zone[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<string>('');
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  
  // State for dynamic data fetching
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [filteredLines, setFilteredLines] = useState<Line[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const { theme } = useCustomTheme();

  // KPI data processing
  const getMasterDataStats = () => {
    const totalZones = zones.length;
    const totalBranches = branches.length;
    const totalLines = lines.length;
    const totalFarmers = farmers.length;
    const totalEquipment = equipment.length;
    
    // Calculate coverage metrics
    const avgBranchesPerZone = totalZones > 0 ? (totalBranches / totalZones).toFixed(1) : '0.0';
    const avgLinesPerBranch = totalBranches > 0 ? (totalLines / totalBranches).toFixed(1) : '0.0';
    const avgFarmersPerLine = totalLines > 0 ? (totalFarmers / totalLines).toFixed(1) : '0.0';
    
    // Equipment warranty status
    const activeWarranty = equipment.filter(eq => eq.warrantyStatus === 'active').length;
    const expiredWarranty = equipment.filter(eq => eq.warrantyStatus === 'expired').length;
    const warrantyRate = totalEquipment > 0 ? ((activeWarranty / totalEquipment) * 100).toFixed(1) : '0.0';

    return {
      totalZones,
      totalBranches,
      totalLines,
      totalFarmers,
      totalEquipment,
      avgBranchesPerZone,
      avgLinesPerBranch,
      avgFarmersPerLine,
      activeWarranty,
      expiredWarranty,
      warrantyRate
    };
  };

  const stats = getMasterDataStats();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [zonesData, branchesData, linesData, farmersData, equipmentData] = await Promise.all([
        api.masters.zones.list(),
        api.masters.branches.list(),
        api.masters.lines.list(),
        api.masters.farmers.list(),
        api.masters.equipment.list(),
      ]);

      setZones(zonesData.zones);
      setBranches(branchesData.branches);
      setLines(linesData.lines);
      setFarmers(farmersData.farmers);
      setEquipment(equipmentData.equipment);
    } catch (error) {
      setError('Failed to load master data');
      console.error('Masters error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchesByZone = async (zoneId: number) => {
    try {
      const branchesData = await api.masters.branches.list(zoneId);
      setFilteredBranches(branchesData.branches);
    } catch (error) {
      console.error('Fetch branches error:', error);
      setFilteredBranches([]);
    }
  };

  const fetchLinesByBranch = async (branchId: number) => {
    try {
      const linesData = await api.masters.lines.list(branchId);
      setFilteredLines(linesData.lines);
    } catch (error) {
      console.error('Fetch lines error:', error);
      setFilteredLines([]);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAdd = (type: string) => {
    setDialogType(type);
    setEditingItem(null);
    setSelectedZoneId(null);
    setSelectedBranchId(null);
    setFilteredBranches([]);
    setFilteredLines([]);
    setDialogOpen(true);
  };

  const handleEdit = (type: string, item: Zone | Branch | Line | Farmer | Equipment) => {
    setDialogType(type);
    setEditingItem({...item}); // Create a copy to avoid direct mutation
    
    // Reset dynamic selection states
    setSelectedZoneId(null);
    setSelectedBranchId(null);
    setFilteredBranches([]);
    setFilteredLines([]);
    
    // For line editing, fetch branches for the selected zone
    if (type === 'lines' && 'branchId' in item) {
      const lineItem = item as Line;
      const branch = branches.find(b => b.id === lineItem.branchId);
      if (branch) {
        setSelectedZoneId(branch.zoneId);
        fetchBranchesByZone(branch.zoneId);
      }
    }
    
    // For farmer editing, fetch lines for the selected branch
    if (type === 'farmers' && 'lineId' in item) {
      const farmerItem = item as Farmer;
      const line = lines.find(l => l.id === farmerItem.lineId);
      if (line) {
        setSelectedBranchId(line.branchId);
        fetchLinesByBranch(line.branchId);
      }
    }
    
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        // Update existing item
        await api.masters[dialogType as keyof typeof api.masters].update(editingItem.id as number, editingItem);
      } else {
        // Create new item
        await api.masters[dialogType as keyof typeof api.masters].create(editingItem || {});
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      setError('Failed to save data');
      console.error('Save error:', error);
    }
  };

  if (loading) {
    return (
      <Card className="masters-loading-card" sx={{ 
        backgroundColor: 'var(--color-surface)', 
        borderColor: 'var(--color-border)' 
      }}>
        <CardContent className="masters-loading-content">
          <LinearProgress className="masters-loading-progress" sx={{ color: 'var(--primary-main)' }} />
          <Typography variant="body2" className="masters-loading-text" sx={{ color: 'var(--color-text-secondary)' }}>
            Loading master data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        className="masters-error-alert"
        sx={{ 
          backgroundColor: 'var(--error-100)', 
          borderColor: 'var(--error-main)', 
          color: 'var(--error-main)'
        }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box className="masters-container" sx={{ 
      flexGrow: 1,
      backgroundColor: 'var(--color-background)',
      color: 'var(--color-text-primary)'
    }}>
        {/* Header Section */}
        <Box className="dashboard-header mb-6 p-4 rounded-lg border" sx={{ 
          backgroundColor: 'var(--color-background-elevated)', 
          borderColor: 'var(--color-border)',
          border: '1px solid var(--color-border)'
        }}>
          <div className="dashboard-header-content flex justify-between items-center mb-3">
            <div className="dashboard-header-info">
              <Typography variant="h5" className="dashboard-header-title text-2xl font-semibold mb-1" sx={{ color: 'var(--color-text-primary)' }}>
                Master Data Management
              </Typography>
              <Typography variant="body1" className="dashboard-header-subtitle text-base" sx={{ color: 'var(--color-text-secondary)' }}>
                Manage zones, branches, lines, farmers, and equipment
              </Typography>
            </div>
          </div>
        </Box>

        <KPIStatGroup className="dashboard-stats-grid mb-6" sx={{ marginBottom: '24px' }} columns={4}>
          <KPIStat
            title="Total Zones"
            value={stats.totalZones.toLocaleString()}
            change={2}
            trend="up"
            variant="accent"
            icon={<LocationOn sx={{ fontSize: 24, color: 'var(--primary-main)' }} />}
          />
          <KPIStat
            title="Total Branches"
            value={stats.totalBranches.toLocaleString()}
            change={parseFloat(stats.avgBranchesPerZone)}
            trend="up"
            variant="success"
            icon={<AccountBalance sx={{ fontSize: 24, color: 'var(--success-main)' }} />}
          />
          <KPIStat
            title="Total Lines"
            value={stats.totalLines.toLocaleString()}
            change={parseFloat(stats.avgLinesPerBranch)}
            trend="up"
            variant="default"
            icon={<Route sx={{ fontSize: 24, color: 'var(--text-secondary)' }} />}
          />
          <KPIStat
            title="Total Farmers"
            value={stats.totalFarmers.toLocaleString()}
            change={parseFloat(stats.avgFarmersPerLine)}
            trend="up"
            variant="warning"
            icon={<Person sx={{ fontSize: 24, color: 'var(--warning-main)' }} />}
          />
          <KPIStat
            title="Total Equipment"
            value={stats.totalEquipment.toLocaleString()}
            change={parseFloat(stats.warrantyRate)}
            trend="up"
            variant="error"
            icon={<Build sx={{ fontSize: 24, color: 'var(--error-main)' }} />}
          />
        </KPIStatGroup>

        {/* Equipment Warranty Status */}
        <Card className="masters-card" sx={{ 
          backgroundColor: 'var(--color-surface)', 
          borderColor: 'var(--color-border)' 
        }}>
          <CardContent className="masters-card-content">
            <Box className="masters-card-header">
              <Build className="masters-card-icon primary" sx={{ color: 'var(--primary-main)' }} />
              <Typography variant="h6" className="masters-card-title" sx={{ color: 'var(--color-text-primary)' }}>
                Equipment Warranty Status
              </Typography>
            </Box>
            <Grid container className="masters-warranty-grid">
              <Grid size={{ xs: 12, md: 3 }}>
                <Box className="masters-warranty-item">
                  <Typography variant="h4" className="masters-warranty-value success" sx={{ color: 'var(--success-main)' }}>
                    {stats.activeWarranty}
                  </Typography>
                  <Typography variant="body2" className="masters-warranty-label" sx={{ color: 'var(--color-text-secondary)' }}>
                    Active Warranties
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box className="masters-warranty-item">
                  <Typography variant="h4" className="masters-warranty-value error" sx={{ color: 'var(--error-main)' }}>
                    {stats.expiredWarranty}
                  </Typography>
                  <Typography variant="body2" className="masters-warranty-label" sx={{ color: 'var(--color-text-secondary)' }}>
                    Expired Warranties
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box className="masters-warranty-progress">
                  <Typography variant="body2" className="masters-warranty-progress-label" sx={{ color: 'var(--color-text-secondary)' }}>
                    Warranty Coverage Rate
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(stats.warrantyRate)}
                    className="masters-warranty-progress-bar"
                    sx={{ 
                      backgroundColor: 'var(--color-border-subtle)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'var(--primary-main)'
                      }
                    }}
                  />
                  <Typography variant="body2" className="masters-warranty-progress-value" sx={{ color: 'var(--color-text-secondary)' }}>
                    {stats.warrantyRate}% Coverage
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Master Data Tabs */}
        <Card className="masters-tabs-card masters-mb-3xl" sx={{ 
          backgroundColor: 'var(--color-surface)', 
          borderColor: 'var(--color-border)' 
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            className="masters-tabs"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'var(--primary-main)'
              },
              '& .MuiTab-root': {
                color: 'var(--color-text-secondary)',
                '&.Mui-selected': {
                  color: 'var(--primary-main)'
                },
                '&:hover': {
                  color: 'var(--color-text-primary)'
                }
              }
            }}
          >
          <Tab icon={<LocationOn />} iconPosition="start" label={`Zones (${stats.totalZones})`} />
          <Tab icon={<AccountBalance />} iconPosition="start" label={`Branches (${stats.totalBranches})`} />
          <Tab icon={<Route />} iconPosition="start" label={`Lines (${stats.totalLines})`} />
          <Tab icon={<Person />} iconPosition="start" label={`Farmers (${stats.totalFarmers})`} />
          <Tab icon={<Build />} iconPosition="start" label={`Equipment (${stats.totalEquipment})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box className="masters-tab-content masters-mt-xl">
            <Box className="masters-table-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" className="masters-table-title" sx={{ m: 0, color: 'var(--color-text-primary)' }}>
                Zones ({zones.length})
              </Typography>
              <Button 
                variant="contained" 
                className="masters-btn-primary"
                startIcon={<AddIcon />} 
                onClick={() => handleAdd('zones')}
                size="small"
              >
                Add Zone
              </Button>
            </Box>
            <TableContainer className="masters-table-container" sx={{ 
              backgroundColor: 'var(--color-surface)', 
              borderColor: 'var(--color-border)' 
            }}>
              <Table className="masters-table">
                <TableHead className="masters-table-head" sx={{ backgroundColor: 'var(--color-background-subtle)' }}>
                  <TableRow>
                    <TableCell className="masters-table-cell" sx={{ 
                      color: 'var(--color-text-primary)', 
                      borderBottomColor: 'var(--color-border)' 
                    }}>Code</TableCell>
                    <TableCell className="masters-table-cell" sx={{ 
                      color: 'var(--color-text-primary)', 
                      borderBottomColor: 'var(--color-border)' 
                    }}>Name</TableCell>
                    <TableCell className="masters-table-cell" sx={{ 
                      color: 'var(--color-text-primary)', 
                      borderBottomColor: 'var(--color-border)' 
                    }}>Description</TableCell>
                    <TableCell className="masters-table-cell" sx={{ 
                      color: 'var(--color-text-primary)', 
                      borderBottomColor: 'var(--color-border)' 
                    }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id} className="masters-table-row" sx={{ 
                      '&:hover': { backgroundColor: 'var(--primary-100)' }
                    }}>
                      <TableCell className="masters-table-cell" sx={{ 
                        color: 'var(--color-text-primary)', 
                        borderBottomColor: 'var(--color-border)' 
                      }}>
                        <Typography variant="body2" sx={{ color: 'var(--primary-main)', fontWeight: 600 }}>
                          {zone.code}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell" sx={{ 
                        color: 'var(--color-text-primary)', 
                        borderBottomColor: 'var(--color-border)' 
                      }}>
                        <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                          {zone.name}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell" sx={{ 
                        color: 'var(--color-text-primary)', 
                        borderBottomColor: 'var(--color-border)' 
                      }}>
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                          {zone.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <IconButton 
                          className="masters-action-btn edit"
                          onClick={() => handleEdit('zones', zone)}
                          sx={{ 
                            color: 'var(--primary-main)',
                            backgroundColor: 'transparent',
                            '&:hover': { 
                              backgroundColor: 'var(--primary-100)',
                              color: 'var(--primary-dark)'
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box className="masters-table-header masters-mt-xl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" className="masters-table-title" sx={{ m: 0, color: 'var(--color-text-primary)' }}>
              Branches ({branches.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => handleAdd('branches')}
              sx={{ borderRadius: 'var(--border-radius-md)' }}
              size="small"
            >
              Add Branch
            </Button>
          </Box>
          <TableContainer className="masters-table-container" sx={{ 
            backgroundColor: 'var(--color-surface)', 
            borderColor: 'var(--color-border)' 
          }}>
            <Table className="masters-table">
              <TableHead className="masters-table-head" sx={{ backgroundColor: 'var(--color-background-subtle)' }}>
                <TableRow>
                  <TableCell className="masters-table-cell" sx={{ 
                    color: 'var(--color-text-primary)', 
                    borderBottomColor: 'var(--color-border)' 
                  }}>Code</TableCell>
                  <TableCell className="masters-table-cell" sx={{ 
                    color: 'var(--color-text-primary)', 
                    borderBottomColor: 'var(--color-border)' 
                  }}>Name</TableCell>
                  <TableCell className="masters-table-cell" sx={{ 
                    color: 'var(--color-text-primary)', 
                    borderBottomColor: 'var(--color-border)' 
                  }}>Zone</TableCell>
                  <TableCell className="masters-table-cell" sx={{ 
                    color: 'var(--color-text-primary)', 
                    borderBottomColor: 'var(--color-border)' 
                  }}>Manager</TableCell>
                  <TableCell className="masters-table-cell" sx={{ 
                    color: 'var(--color-text-primary)', 
                    borderBottomColor: 'var(--color-border)' 
                  }}>Phone</TableCell>
                  <TableCell className="masters-table-cell" sx={{ 
                    color: 'var(--color-text-primary)', 
                    borderBottomColor: 'var(--color-border)' 
                  }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id} className="masters-table-row" sx={{ 
                    '&:hover': { backgroundColor: 'var(--primary-100)' }
                  }}>
                    <TableCell className="masters-table-cell" sx={{ 
                      color: 'var(--color-text-primary)', 
                      borderBottomColor: 'var(--color-border)' 
                    }}>
                      <Typography variant="body2" sx={{ color: 'var(--primary-main)', fontWeight: 600 }}>
                        {branch.code}
                      </Typography>
                    </TableCell>
                    <TableCell className="masters-table-cell" sx={{ 
                      color: 'var(--color-text-primary)', 
                      borderBottomColor: 'var(--color-border)' 
                    }}>
                      <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                        {branch.name}
                      </Typography>
                    </TableCell>
                    <TableCell className="masters-table-cell" sx={{ 
                      color: 'var(--color-text-primary)', 
                      borderBottomColor: 'var(--color-border)' 
                    }}>
                      <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                        {branch.zone?.name}
                      </Typography>
                    </TableCell>
                    <TableCell className="masters-table-cell" sx={{ 
                      color: 'var(--color-text-primary)', 
                      borderBottomColor: 'var(--color-border)' 
                    }}>
                      <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                        {branch.managerName}
                      </Typography>
                    </TableCell>
                    <TableCell className="masters-table-cell" sx={{ 
                      color: 'var(--color-text-primary)', 
                      borderBottomColor: 'var(--color-border)' 
                    }}>
                      <Typography variant="body2" sx={{ color: 'var(--color-text-tertiary)' }}>
                        {branch.managerPhone}
                      </Typography>
                    </TableCell>
                    <TableCell className="masters-table-cell">
                      <IconButton 
                        className="masters-action-btn edit"
                        onClick={() => handleEdit('branches', branch)}
                        sx={{ 
                          color: 'var(--primary-main)',
                          backgroundColor: 'transparent',
                          '&:hover': { 
                            backgroundColor: 'var(--primary-100)',
                            color: 'var(--primary-dark)'
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box className="masters-tab-content masters-mt-xl">
            <Box className="masters-table-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" className="masters-table-title" sx={{ m: 0 }}>
                Lines ({lines.length})
              </Typography>
              <Button 
                variant="contained" 
                className="masters-btn-primary"
                startIcon={<AddIcon />} 
                onClick={() => handleAdd('lines')}
                size="small"
              >
                Add Line
              </Button>
            </Box>
            <TableContainer className="masters-table-container">
              <Table className="masters-table">
                <TableHead className="masters-table-head">
                  <TableRow>
                    <TableCell className="masters-table-cell">Code</TableCell>
                    <TableCell className="masters-table-cell">Name</TableCell>
                    <TableCell className="masters-table-cell">Branch</TableCell>
                    <TableCell className="masters-table-cell">Supervisor</TableCell>
                    <TableCell className="masters-table-cell">Phone</TableCell>
                    <TableCell className="masters-table-cell">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id} className="masters-table-row">
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-code-text">
                          {line.code}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-name-text">
                          {line.name}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-info-text">
                          {line.branch?.name}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-info-text">
                          {line.supervisorName}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-secondary-text">
                          {line.supervisorPhone}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <IconButton 
                          className="masters-action-btn edit"
                          onClick={() => handleEdit('lines', line)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box className="masters-tab-content masters-mt-xl">
            <Box className="masters-table-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" className="masters-table-title" sx={{ m: 0 }}>
                Farmers ({farmers.length})
              </Typography>
              <Button 
                variant="contained" 
                className="masters-btn-primary"
                startIcon={<AddIcon />} 
                onClick={() => handleAdd('farmers')}
                size="small"
              >
                Add Farmer
              </Button>
            </Box>
            <TableContainer className="masters-table-container">
              <Table className="masters-table">
                <TableHead className="masters-table-head">
                  <TableRow>
                    <TableCell className="masters-table-cell">Name</TableCell>
                    <TableCell className="masters-table-cell">Farm Code</TableCell>
                    <TableCell className="masters-table-cell">Shed Type</TableCell>
                    <TableCell className="masters-table-cell">Phone</TableCell>
                    <TableCell className="masters-table-cell">Village</TableCell>
                    <TableCell className="masters-table-cell">Line</TableCell>
                    <TableCell className="masters-table-cell">Branch</TableCell>
                    <TableCell className="masters-table-cell">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {farmers.map((farmer) => (
                    <TableRow key={farmer.id} className="masters-table-row">
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-name-text">
                          {farmer.name}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-code-text">
                          {farmer.farmCode}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-info-text">
                          {farmer.shedType}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-secondary-text">
                          {farmer.phone}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-info-text">
                          {farmer.village}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-info-text">
                          {farmer.line?.name}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-secondary-text">
                          {farmer.line?.branch?.name}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <IconButton 
                          className="masters-action-btn edit"
                          onClick={() => handleEdit('farmers', farmer)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box className="masters-tab-content masters-mt-xl">
            <Box className="masters-table-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" className="masters-table-title" sx={{ m: 0 }}>
                Equipment ({equipment.length})
              </Typography>
              <Button 
                variant="contained" 
                className="masters-btn-primary"
                startIcon={<AddIcon />} 
                onClick={() => handleAdd('equipment')}
                size="small"
              >
                Add Equipment
              </Button>
            </Box>
            <TableContainer className="masters-table-container">
              <Table className="masters-table">
                <TableHead className="masters-table-head">
                  <TableRow>
                    <TableCell className="masters-table-cell">Type</TableCell>
                    <TableCell className="masters-table-cell">Serial Number</TableCell>
                    <TableCell className="masters-table-cell">Vendor</TableCell>
                    <TableCell className="masters-table-cell">Farmer</TableCell>
                    <TableCell className="masters-table-cell">Warranty</TableCell>
                    <TableCell className="masters-table-cell">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {equipment.map((item) => (
                    <TableRow key={item.id} className="masters-table-row">
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-name-text">
                          {item.type}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-secondary-text">
                          {item.serialNumber}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-info-text">
                          {item.vendor}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Typography variant="body2" className="masters-info-text">
                          {item.farmer?.name}
                        </Typography>
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <Chip
                          label={item.warrantyStatus.toUpperCase()}
                          color={item.warrantyStatus === 'active' ? 'success' : 'default'}
                          size="small"
                          className={`masters-status-chip ${item.warrantyStatus}`}
                        />
                      </TableCell>
                      <TableCell className="masters-table-cell">
                        <IconButton 
                          className="masters-action-btn edit"
                          onClick={() => handleEdit('equipment', item)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        className="masters-dialog"
      >
        <DialogTitle className="masters-dialog-title">
          {editingItem ? 'Edit' : 'Add'} {dialogType}
        </DialogTitle>
        <DialogContent className="masters-dialog-content">
          {dialogType === 'zones' && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Zone Name"
                  value={editingItem?.name || ''}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Zone Code"
                  value={editingItem?.code || ''}
                  onChange={(e) => setEditingItem({...editingItem, code: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editingItem?.description || ''}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          )}
          
          {dialogType === 'branches' && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Branch Name"
                  value={editingItem?.name || ''}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Branch Code"
                  value={editingItem?.code || ''}
                  onChange={(e) => setEditingItem({...editingItem, code: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Address"
                  value={editingItem?.address || ''}
                  onChange={(e) => setEditingItem({...editingItem, address: e.target.value})}
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Manager Name"
                  value={editingItem?.managerName || ''}
                  onChange={(e) => setEditingItem({...editingItem, managerName: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Manager Phone"
                  value={editingItem?.managerPhone || ''}
                  onChange={(e) => setEditingItem({...editingItem, managerPhone: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Accountant Name"
                  value={editingItem?.accountantName || ''}
                  onChange={(e) => setEditingItem({...editingItem, accountantName: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Accountant Phone"
                  value={editingItem?.accountantPhone || ''}
                  onChange={(e) => setEditingItem({...editingItem, accountantPhone: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Zone</InputLabel>
                  <Select
                    value={editingItem?.zoneId || ''}
                    onChange={(e) => setEditingItem({...editingItem, zoneId: e.target.value})}
                    label="Zone"
                    required
                  >
                    <MenuItem value="">Select Zone</MenuItem>
                    {zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
          
          {dialogType === 'lines' && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Line Name"
                  value={editingItem?.name || ''}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Line Code"
                  value={editingItem?.code || ''}
                  onChange={(e) => setEditingItem({...editingItem, code: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Supervisor Name"
                  value={editingItem?.supervisorName || ''}
                  onChange={(e) => setEditingItem({...editingItem, supervisorName: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Supervisor Phone"
                  value={editingItem?.supervisorPhone || ''}
                  onChange={(e) => setEditingItem({...editingItem, supervisorPhone: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={zones}
                  getOptionLabel={(option) => option.name}
                  value={zones.find(zone => zone.id === selectedZoneId) || null}
                  onChange={(event, newValue) => {
                    const zoneId = newValue?.id || null;
                    setSelectedZoneId(zoneId);
                    setEditingItem({...editingItem, branchId: ''}); // Reset branch selection
                    if (zoneId) {
                      fetchBranchesByZone(zoneId);
                    } else {
                      setFilteredBranches([]);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Zone"
                      required
                      placeholder="Search and select zone"
                    />
                  )}
                  noOptionsText="No zones found"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={filteredBranches}
                  getOptionLabel={(option) => option.name}
                  value={filteredBranches.find(branch => branch.id === editingItem?.branchId) || null}
                  onChange={(event, newValue) => {
                    setEditingItem({...editingItem, branchId: newValue?.id || ''});
                  }}
                  disabled={!selectedZoneId || filteredBranches.length === 0}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Branch"
                      required
                      placeholder={selectedZoneId ? "Search and select branch" : "Select zone first"}
                    />
                  )}
                  noOptionsText={selectedZoneId ? "No branches found for selected zone" : "Select zone first"}
                />
              </Grid>
            </Grid>
          )}
          
          {dialogType === 'farmers' && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Farmer Name"
                  value={editingItem?.name || ''}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={editingItem?.phone || ''}
                  onChange={(e) => setEditingItem({...editingItem, phone: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Farm Code"
                  value={editingItem?.farmCode || ''}
                  onChange={(e) => setEditingItem({...editingItem, farmCode: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Shed Type</InputLabel>
                  <Select
                    value={editingItem?.shedType || 'Traditional Shed'}
                    onChange={(e) => setEditingItem({...editingItem, shedType: e.target.value})}
                    label="Shed Type"
                    required
                  >
                    <MenuItem value="Traditional Shed">Traditional Shed</MenuItem>
                    <MenuItem value="EC Shed">EC Shed</MenuItem>
                    <MenuItem value="Basic EC Shed">Basic EC Shed</MenuItem>
                    <MenuItem value="Semi EC Shed">Semi EC Shed</MenuItem>
                    <MenuItem value="Full EC Shed">Full EC Shed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editingItem?.email || ''}
                  onChange={(e) => setEditingItem({...editingItem, email: e.target.value})}
                  type="email"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Village"
                  value={editingItem?.village || ''}
                  onChange={(e) => setEditingItem({...editingItem, village: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="District"
                  value={editingItem?.district || ''}
                  onChange={(e) => setEditingItem({...editingItem, district: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="State"
                  value={editingItem?.state || ''}
                  onChange={(e) => setEditingItem({...editingItem, state: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Pincode"
                  value={editingItem?.pincode || ''}
                  onChange={(e) => setEditingItem({...editingItem, pincode: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Address"
                  value={editingItem?.address || ''}
                  onChange={(e) => setEditingItem({...editingItem, address: e.target.value})}
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={zones}
                  getOptionLabel={(option) => option.name}
                  value={zones.find(zone => zone.id === selectedZoneId) || null}
                  onChange={(event, newValue) => {
                    const zoneId = newValue?.id || null;
                    setSelectedZoneId(zoneId);
                    setSelectedBranchId(null);
                    setEditingItem({...editingItem, branchId: '', lineId: ''}); // Reset branch and line selection
                    if (zoneId) {
                      fetchBranchesByZone(zoneId);
                    } else {
                      setFilteredBranches([]);
                      setFilteredLines([]);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Zone"
                      required
                      placeholder="Search and select zone"
                    />
                  )}
                  noOptionsText="No zones found"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={filteredBranches}
                  getOptionLabel={(option) => option.name}
                  value={filteredBranches.find(branch => branch.id === selectedBranchId) || null}
                  onChange={(event, newValue) => {
                    const branchId = newValue?.id || null;
                    setSelectedBranchId(branchId);
                    setEditingItem({...editingItem, branchId: branchId || '', lineId: ''}); // Reset line selection
                    if (branchId) {
                      fetchLinesByBranch(branchId);
                    } else {
                      setFilteredLines([]);
                    }
                  }}
                  disabled={!selectedZoneId || filteredBranches.length === 0}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Branch"
                      required
                      placeholder={selectedZoneId ? "Search and select branch" : "Select zone first"}
                    />
                  )}
                  noOptionsText={selectedZoneId ? "No branches found for selected zone" : "Select zone first"}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={filteredLines}
                  getOptionLabel={(option) => option.name}
                  value={filteredLines.find(line => line.id === editingItem?.lineId) || null}
                  onChange={(event, newValue) => {
                    setEditingItem({...editingItem, lineId: newValue?.id || ''});
                  }}
                  disabled={!selectedBranchId || filteredLines.length === 0}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Line"
                      required
                      placeholder={selectedBranchId ? "Search and select line" : "Select branch first"}
                    />
                  )}
                  noOptionsText={selectedBranchId ? "No lines found for selected branch" : "Select branch first"}
                />
              </Grid>
            </Grid>
          )}
          
          {dialogType === 'equipment' && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Equipment Type"
                  value={editingItem?.type || ''}
                  onChange={(e) => setEditingItem({...editingItem, type: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Serial Number"
                  value={editingItem?.serialNumber || ''}
                  onChange={(e) => setEditingItem({...editingItem, serialNumber: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Vendor"
                  value={editingItem?.vendor || ''}
                  onChange={(e) => setEditingItem({...editingItem, vendor: e.target.value})}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Warranty Status</InputLabel>
                  <Select
                    value={editingItem?.warrantyStatus || 'na'}
                    onChange={(e) => setEditingItem({...editingItem, warrantyStatus: e.target.value})}
                    label="Warranty Status"
                    required
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                    <MenuItem value="na">Not Applicable</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Installed Date"
                  value={editingItem?.installedDate || ''}
                  onChange={(e) => setEditingItem({...editingItem, installedDate: e.target.value})}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Warranty Expiry Date"
                  value={editingItem?.warrantyExpiryDate || ''}
                  onChange={(e) => setEditingItem({...editingItem, warrantyExpiryDate: e.target.value})}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Farmer</InputLabel>
                  <Select
                    value={editingItem?.farmerId || ''}
                    onChange={(e) => setEditingItem({...editingItem, farmerId: e.target.value})}
                    label="Farmer"
                    required
                  >
                    <MenuItem value="">Select Farmer</MenuItem>
                    {farmers.map((farmer) => (
                      <MenuItem key={farmer.id} value={farmer.id}>
                        {farmer.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions className="masters-dialog-actions">
          <Button 
            onClick={handleCloseDialog}
            className="masters-btn-secondary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            className="masters-btn-primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add item"
        className="masters-fab"
        onClick={() => handleAdd(['zones', 'branches', 'lines', 'farmers', 'equipment'][tabValue])}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}