import { Router, type Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Complaint, User, Zone, Branch, Line, Farmer, Equipment } from '../models';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import * as XLSX from 'xlsx';

const router = Router();

/**
 * Generate Zone/Branch Performance Report
 * GET /api/reports/performance
 */
router.get('/performance', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const dateFilter: { [Op.gte]?: Date; [Op.lte]?: Date } = {};
    if (startDate) dateFilter[Op.gte] = new Date(startDate as string);
    if (endDate) dateFilter[Op.lte] = new Date(endDate as string);

    // Get performance data by zone
    const zonePerformance = await Complaint.findAll({
      attributes: [
        'zoneId',
        [fn('COUNT', col('Complaint.id')), 'totalComplaints'],
        [literal("SUM(CASE WHEN Complaint.status = 'resolved' THEN 1 ELSE 0 END)"), 'resolvedComplaints'],
        [literal("SUM(CASE WHEN Complaint.status = 'closed' THEN 1 ELSE 0 END)"), 'closedComplaints'],
        [literal("AVG(CASE WHEN Complaint.status IN ('resolved', 'closed') THEN ROUND((julianday(Complaint.resolvedAt) - julianday(Complaint.createdAt)) * 24, 2) ELSE NULL END)"), 'avgResolutionTime']
      ],
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      include: [{ model: Zone, as: 'zone', attributes: ['name', 'code'] }],
      group: ['zoneId', 'zone.id', 'zone.name', 'zone.code'],
      order: [[fn('COUNT', col('Complaint.id')), 'DESC']]
    });

    // Get performance data by branch
    const branchPerformance = await Complaint.findAll({
      attributes: [
        'branchId',
        [fn('COUNT', col('Complaint.id')), 'totalComplaints'],
        [literal("SUM(CASE WHEN Complaint.status = 'resolved' THEN 1 ELSE 0 END)"), 'resolvedComplaints'],
        [literal("SUM(CASE WHEN Complaint.status = 'closed' THEN 1 ELSE 0 END)"), 'closedComplaints'],
        [literal("AVG(CASE WHEN Complaint.status IN ('resolved', 'closed') THEN ROUND((julianday(Complaint.resolvedAt) - julianday(Complaint.createdAt)) * 24, 2) ELSE NULL END)"), 'avgResolutionTime']
      ],
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      include: [
        { model: Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: Zone, as: 'zone', attributes: ['name', 'code'] }
      ],
      group: ['branchId', 'branch.id', 'branch.name', 'branch.code', 'zone.name', 'zone.code'],
      order: [[fn('COUNT', col('Complaint.id')), 'DESC']]
    });

    const reportData = {
      zonePerformance,
      branchPerformance,
      generatedAt: new Date(),
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      }
    };

    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      
      // Zone performance sheet
      const zoneSheet = XLSX.utils.json_to_sheet(zonePerformance.map((item: any) => ({
        'Zone Name': item.zone?.name || 'Unknown',
        'Zone Code': item.zone?.code || 'N/A',
        'Total Complaints': item.totalComplaints || 0,
        'Resolved': item.resolvedComplaints || 0,
        'Closed': item.closedComplaints || 0,
        'Avg Resolution Time (Hours)': item.avgResolutionTime || 0
      })));
      XLSX.utils.book_append_sheet(workbook, zoneSheet, 'Zone Performance');

      // Branch performance sheet
      const branchSheet = XLSX.utils.json_to_sheet(branchPerformance.map((item: any) => ({
        'Zone Name': item.zone?.name || 'Unknown',
        'Branch Name': item.branch?.name || 'Unknown',
        'Branch Code': item.branch?.code || 'N/A',
        'Total Complaints': item.totalComplaints || 0,
        'Resolved': item.resolvedComplaints || 0,
        'Closed': item.closedComplaints || 0,
        'Avg Resolution Time (Hours)': item.avgResolutionTime || 0
      })));
      XLSX.utils.book_append_sheet(workbook, branchSheet, 'Branch Performance');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=performance-report.xlsx');
      res.send(buffer);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error('Performance report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate SLA Breach Report
 * GET /api/reports/sla-breaches
 */
router.get('/sla-breaches', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const dateFilter: { [Op.gte]?: Date; [Op.lte]?: Date } = {};
    if (startDate) dateFilter[Op.gte] = new Date(startDate as string);
    if (endDate) dateFilter[Op.lte] = new Date(endDate as string);

    const now = new Date();

    // Get SLA breaches
    const slaBreaches = await Complaint.findAll({
      where: {
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        status: ['received', 'calling', 'in_progress'],
        slaDeadline: { [Op.lt]: now }
      },
      include: [
        { model: Farmer, as: 'farmer', attributes: ['name', 'phone'] },
        { model: Zone, as: 'zone', attributes: ['name', 'code'] },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] },
        { model: Line, as: 'line', attributes: ['name', 'code'] },
        { model: User, as: 'assignedUser', attributes: ['name', 'phone'] }
      ],
      order: [['slaDeadline', 'ASC']]
    });

    // Get SLA compliance summary
    const slaSummary = await Complaint.findAll({
      attributes: [
        'priority',
        [fn('COUNT', col('Complaint.id')), 'total'],
        [literal("SUM(CASE WHEN Complaint.status IN ('resolved', 'closed') AND Complaint.resolvedAt <= Complaint.slaDeadline THEN 1 ELSE 0 END)"), 'compliant'],
        [literal("SUM(CASE WHEN Complaint.status IN ('received', 'calling', 'in_progress') AND Complaint.slaDeadline < datetime('now') THEN 1 ELSE 0 END)"), 'breached']
      ],
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      group: ['priority']
    });

    const reportData = {
      slaBreaches,
      slaSummary,
      generatedAt: new Date(),
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      }
    };

    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      
      // SLA breaches sheet
      const breachesSheet = XLSX.utils.json_to_sheet(slaBreaches.map((item: any) => ({
        'Ticket Number': item.ticketNumber,
        'Farmer Name': item.farmer?.name || 'Unknown',
        'Farmer Phone': item.farmer?.phone || 'N/A',
        'Priority': item.priority,
        'Status': item.status,
        'Zone': item.zone?.name || 'Unknown',
        'Branch': item.branch?.name || 'Unknown',
        'Line': item.line?.name || 'Unknown',
        'Assigned To': item.assignedUser?.name || 'Not Assigned',
        'SLA Deadline': item.slaDeadline,
        'Hours Overdue': Math.floor((now.getTime() - new Date(item.slaDeadline).getTime()) / (1000 * 60 * 60))
      })));
      XLSX.utils.book_append_sheet(workbook, breachesSheet, 'SLA Breaches');

      // SLA summary sheet
      const summarySheet = XLSX.utils.json_to_sheet(slaSummary.map((item: any) => ({
        'Priority': item.priority,
        'Total Complaints': item.total || 0,
        'Compliant': item.compliant || 0,
        'Breached': item.breached || 0,
        'Compliance Rate': `${((item.compliant || 0) / (item.total || 1) * 100).toFixed(1)}%`
      })));
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'SLA Summary');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=sla-breach-report.xlsx');
      res.send(buffer);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error('SLA breach report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate Equipment MTTR Report
 * GET /api/reports/equipment-mttr
 */
router.get('/equipment-mttr', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const dateFilter: { [Op.gte]?: Date; [Op.lte]?: Date } = {};
    if (startDate) dateFilter[Op.gte] = new Date(startDate as string);
    if (endDate) dateFilter[Op.lte] = new Date(endDate as string);

    // Get equipment with complaint data
    const equipmentMTTR = await Equipment.findAll({
      include: [
        {
          model: Complaint,
          as: 'complaints',
          where: {
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
            status: ['resolved', 'closed']
          },
          attributes: [
            'id',
            'ticketNumber',
            'createdAt',
            'resolvedAt',
            'priority'
          ]
        },
        { model: Farmer, as: 'farmer', attributes: ['name', 'phone'] }
      ],
      attributes: [
        'id',
        'type',
        'serialNumber',
        'vendor',
        'installedDate'
      ]
    });

    // Calculate MTTR for each equipment
    const mttrData = equipmentMTTR.map((equipment) => {
      const complaints = equipment.complaints || [];
      if (complaints.length === 0) return null;

      const totalResolutionTime = complaints.reduce((sum: number, complaint) => {
        if (complaint.resolvedAt) {
          const resolutionTime = new Date(complaint.resolvedAt).getTime() - new Date(complaint.createdAt).getTime();
          return sum + resolutionTime;
        }
        return sum;
      }, 0);

      const avgResolutionTime = totalResolutionTime / complaints.length;
      const avgResolutionHours = avgResolutionTime / (1000 * 60 * 60);

      return {
        equipmentId: equipment.id,
        type: equipment.type,
        serialNumber: equipment.serialNumber,
        vendor: equipment.vendor,
        installedDate: equipment.installedDate,
        farmerName: equipment.farmer?.name || 'Unknown',
        farmerPhone: equipment.farmer?.phone || 'N/A',
        totalComplaints: complaints.length,
        avgResolutionTime: avgResolutionHours,
        complaints: complaints.map((complaint) => ({
          ticketNumber: complaint.ticketNumber,
          priority: complaint.priority,
          createdAt: complaint.createdAt,
          resolvedAt: complaint.resolvedAt,
          resolutionTime: complaint.resolvedAt ? 
            (new Date(complaint.resolvedAt).getTime() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60) : null
        }))
      };
    }).filter(Boolean);

    const reportData = {
      mttrData,
      generatedAt: new Date(),
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      }
    };

    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      
      // MTTR summary sheet
      const summarySheet = XLSX.utils.json_to_sheet(mttrData.map((item) => ({
        'Equipment Type': item.type,
        'Serial Number': item.serialNumber,
        'Vendor': item.vendor,
        'Farmer Name': item.farmerName,
        'Farmer Phone': item.farmerPhone,
        'Total Complaints': item.totalComplaints,
        'Avg Resolution Time (Hours)': item.avgResolutionTime?.toFixed(2) || '0.00'
      })));
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Equipment MTTR');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=equipment-mttr-report.xlsx');
      res.send(buffer);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error('Equipment MTTR report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate Missing Contact Report
 * GET /api/reports/missing-contacts
 */
router.get('/missing-contacts', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { format = 'json' } = req.query;

    // Get farmers with missing contact information
    const missingContacts = await Farmer.findAll({
      where: {
        [Op.or]: [
          { phone: { [Op.or]: [null, ''] } },
          { email: { [Op.or]: [null, ''] } }
        ]
      },
      include: [
        { model: Line, as: 'line', include: [{ model: Branch, as: 'branch', include: ['zone'] }] }
      ],
      order: [['name', 'ASC']]
    });

    // Get branches with missing manager/accountant contacts
    const branchMissingContacts = await Branch.findAll({
      where: {
        [Op.or]: [
          { managerPhone: { [Op.or]: [null, ''] } },
          { accountantPhone: { [Op.or]: [null, ''] } }
        ]
      },
      include: ['zone'],
      order: [['name', 'ASC']]
    });

    // Get lines with missing supervisor contacts
    const lineMissingContacts = await Line.findAll({
      where: {
        supervisorPhone: { [Op.or]: [null, ''] }
      },
      include: ['branch'],
      order: [['name', 'ASC']]
    });

    const reportData = {
      missingContacts,
      branchMissingContacts,
      lineMissingContacts,
      generatedAt: new Date(),
      summary: {
        totalFarmersMissingContacts: missingContacts.length,
        totalBranchesMissingContacts: branchMissingContacts.length,
        totalLinesMissingContacts: lineMissingContacts.length
      }
    };

    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      
      // Farmers missing contacts sheet
      const farmersSheet = XLSX.utils.json_to_sheet(missingContacts.map((item) => ({
        'Farmer Name': item.name,
        'Phone': item.phone || 'Missing',
        'Email': item.email || 'Missing',
        'Line': item.line?.name || 'Unknown',
        'Branch': item.line?.branch?.name || 'Unknown',
        'Zone': item.line?.branch?.zone?.name || 'Unknown'
      })));
      XLSX.utils.book_append_sheet(workbook, farmersSheet, 'Farmers Missing Contacts');

      // Branches missing contacts sheet
      const branchesSheet = XLSX.utils.json_to_sheet(branchMissingContacts.map((item) => ({
        'Branch Name': item.name,
        'Manager Phone': item.managerPhone || 'Missing',
        'Accountant Phone': item.accountantPhone || 'Missing',
        'Zone': item.zone?.name || 'Unknown'
      })));
      XLSX.utils.book_append_sheet(workbook, branchesSheet, 'Branches Missing Contacts');

      // Lines missing contacts sheet
      const linesSheet = XLSX.utils.json_to_sheet(lineMissingContacts.map((item) => ({
        'Line Name': item.name,
        'Supervisor Phone': item.supervisorPhone || 'Missing',
        'Branch': item.branch?.name || 'Unknown'
      })));
      XLSX.utils.book_append_sheet(workbook, linesSheet, 'Lines Missing Contacts');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=missing-contacts-report.xlsx');
      res.send(buffer);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error('Missing contacts report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;