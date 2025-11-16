import { Router, type Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Complaint, User, Zone, Branch, Line, Farmer } from '../models';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * Get Dashboard Statistics
 * GET /api/dashboard/stats
 */
router.get('/stats', authenticate, authorize(['admin', 'executive']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const whereClause: Record<string, unknown> = {};
    
    // Apply role-based filtering
    if (req.user?.role === 'executive') {
      whereClause.zoneId = req.user.zoneId;
    }

    // Get complaint statistics
    const totalComplaints = await Complaint.count({ where: whereClause });
    const openComplaints = await Complaint.count({ 
      where: { 
        ...whereClause, 
        status: ['received', 'calling', 'in_progress'] 
      } 
    });
    const resolvedComplaints = await Complaint.count({ 
      where: { 
        ...whereClause, 
        status: 'resolved' 
      } 
    });
    const closedComplaints = await Complaint.count({ 
      where: { 
        ...whereClause, 
        status: 'closed' 
      } 
    });
    const criticalComplaints = await Complaint.count({ 
      where: { 
        ...whereClause, 
        priority: 'critical' 
      } 
    });

    // Get SLA breach count
    const now = new Date();
    const slaBreaches = await Complaint.count({ 
      where: { 
        ...whereClause, 
        status: ['received', 'calling', 'in_progress'],
        slaDeadline: { [Op.lt]: now }
      } 
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await Complaint.findAll({
      where: {
        ...whereClause,
        createdAt: { [Op.gte]: sevenDaysAgo }
      },
      include: [
        { model: Farmer, as: 'farmer', attributes: ['name', 'phone'] },
        { model: User, as: 'assignedUser', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get zone-wise statistics (for admin only)
    let zoneStats = [];
    if (req.user?.role === 'admin') {
      zoneStats = await Complaint.findAll({
        attributes: [
          'zoneId',
          [fn('COUNT', col('Complaint.id')), 'complaintCount']
        ],
        include: [{ model: Zone, as: 'zone', attributes: ['name', 'code'] }],
        group: ['zoneId', 'zone.id', 'zone.name', 'zone.code'],
        order: [[fn('COUNT', col('Complaint.id')), 'DESC']]
      });
    }

    res.json({
      stats: {
        totalComplaints,
        openComplaints,
        resolvedComplaints,
        closedComplaints,
        criticalComplaints,
        slaBreaches
      },
      recentActivity,
      zoneStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get Dashboard Charts Data
 * GET /api/dashboard/charts
 */
router.get('/charts', authenticate, authorize(['admin', 'executive']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const whereClause: Record<string, unknown> = {};
    
    // Apply role-based filtering
    if (req.user?.role === 'executive') {
      whereClause.zoneId = req.user.zoneId;
    }

    // Get complaints by status
    const statusData = await Complaint.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      where: whereClause,
      group: ['status'],
      order: [[fn('COUNT', col('id')), 'DESC']]
    });

    // Get complaints by priority
    const priorityData = await Complaint.findAll({
      attributes: [
        'priority',
        [fn('COUNT', col('id')), 'count']
      ],
      where: whereClause,
      group: ['priority'],
      order: [[fn('COUNT', col('id')), 'DESC']]
    });

    // Get complaints by category
    const categoryData = await Complaint.findAll({
      attributes: [
        'category',
        [fn('COUNT', col('id')), 'count']
      ],
      where: whereClause,
      group: ['category'],
      order: [[fn('COUNT', col('id')), 'DESC']]
    });

    // Get daily complaint trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = await Complaint.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        ...whereClause,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']]
    });

    res.json({
      statusChart: statusData,
      priorityChart: priorityData,
      categoryChart: categoryData,
      trendChart: trendData
    });
  } catch (error) {
    console.error('Dashboard charts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get SLA Compliance Data
 * GET /api/dashboard/sla
 */
router.get('/sla', authenticate, authorize(['admin', 'executive']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const whereClause: Record<string, unknown> = {};
    
    // Apply role-based filtering
    if (req.user?.role === 'executive') {
      whereClause.zoneId = req.user.zoneId;
    }

    const now = new Date();

    // Get SLA compliance by priority
    const slaByPriority = await Complaint.findAll({
      attributes: [
        'priority',
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', 
          literal(`CASE WHEN status IN ('resolved', 'closed') AND resolvedAt <= slaDeadline THEN 1 ELSE 0 END`)
        ), 'onTime']
      ],
      where: whereClause,
      group: ['priority']
    });

    // Get SLA breach details
    const slaBreaches = await Complaint.findAll({
      where: {
        ...whereClause,
        status: ['received', 'calling', 'in_progress'],
        slaDeadline: { [Op.lt]: now }
      },
      include: [
        { model: Farmer, as: 'farmer', attributes: ['name', 'phone'] },
        { model: Zone, as: 'zone', attributes: ['name', 'code'] },
        { model: User, as: 'assignedTo', attributes: ['name', 'phone'] }
      ],
      order: [['slaDeadline', 'ASC']],
      limit: 20
    });

    res.json({
      slaByPriority,
      slaBreaches
    });
  } catch (error) {
    console.error('SLA dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get Contact Directory
 * GET /api/dashboard/contacts
 */
router.get('/contacts', authenticate, authorize(['admin', 'executive']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { zoneId, branchId, role } = req.query;
    const whereClause: Record<string, unknown> = { isActive: true };
    
    // Apply role-based filtering
    if (req.user?.role === 'executive') {
      whereClause.zoneId = req.user.zoneId;
    }

    if (zoneId) whereClause.zoneId = zoneId;
    if (branchId) whereClause.branchId = branchId;
    if (role) whereClause.role = role;

    const users = await User.findAll({
      where: whereClause,
      include: [
        { model: Zone, as: 'zone', attributes: ['name', 'code'] },
        { model: Branch, as: 'branch', attributes: ['name', 'code'] }
      ],
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });

    // Get branch contacts (managers and accountants)
    const branches = await Branch.findAll({
      where: req.user?.role === 'executive' && req.user.zoneId ? { zoneId: req.user.zoneId } : {},
      include: ['zone'],
      order: [['name', 'ASC']]
    });

    // Get line supervisors
    const lines = await Line.findAll({
      where: req.user?.role === 'executive' && req.user.zoneId ? 
        { '$branch.zoneId$': req.user.zoneId } : {},
      include: [
        { model: Branch, as: 'branch', include: ['zone'] }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      staff: users,
      branches,
      lines
    });
  } catch (error) {
    console.error('Contact directory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;