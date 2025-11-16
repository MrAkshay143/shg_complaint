import { Router, type Response } from 'express';
import { CallLog, Complaint, User, CallStatus } from '../models';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * Create Call Log
 * POST /api/call-logs
 */
router.post('/', authenticate, authorize(['admin', 'executive']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { complaintId, outcome, duration, remarks, nextFollowUpDate, complaintStatus, complaintStatusDate } = req.body;

    if (!complaintId || !outcome) {
      res.status(400).json({ error: 'Complaint ID and outcome are required' });
      return;
    }

    // Check if complaint exists and user has access
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    // Check role-based access
    if (req.user?.role === 'executive' && complaint.zoneId !== req.user.zoneId) {
      res.status(403).json({ error: 'Access denied. Complaint not in your zone.' });
      return;
    }

    // Find the call status ID by name
    const callStatus = await CallStatus.findOne({ where: { name: outcome } });
    if (!callStatus) {
      res.status(400).json({ error: 'Invalid call outcome' });
      return;
    }

    const callLog = await CallLog.create({
      complaintId,
      calledBy: req.user!.id,
      outcome,
      callStatusId: callStatus.id,
      duration: duration || null,
      remarks: remarks || null,
      nextFollowUpDate: nextFollowUpDate || null,
      complaintStatus: complaintStatus || null,
      complaintStatusDate: complaintStatusDate || null
    });

    const callLogWithDetails = await CallLog.findByPk(callLog.id, {
      include: [
        { model: Complaint, as: 'complaint', attributes: ['id', 'ticketNumber', 'title'] },
        { model: User, as: 'caller', attributes: ['id', 'name'] },
        { model: CallStatus, as: 'callStatus', attributes: ['id', 'name', 'displayName', 'icon', 'color'] }
      ]
    });

    res.status(201).json({
      message: 'Call log created successfully',
      callLog: callLogWithDetails
    });
  } catch (error) {
    console.error('Create call log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get Call Logs for a Complaint
 * GET /api/call-logs/complaint/:complaintId
 */
router.get('/complaint/:complaintId', authenticate, authorize(['admin', 'executive']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { complaintId } = req.params;

    // Check if complaint exists and user has access
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    // Check role-based access
    if (req.user?.role === 'executive' && complaint.zoneId !== req.user.zoneId) {
      res.status(403).json({ error: 'Access denied. Complaint not in your zone.' });
      return;
    }

    const callLogs = await CallLog.findAll({
      where: { complaintId },
      include: [
        { model: User, as: 'caller', attributes: ['id', 'name'] },
        { model: CallStatus, as: 'callStatus', attributes: ['id', 'name', 'displayName', 'icon', 'color'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ callLogs });
  } catch (error) {
    console.error('Get call logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get Recent Call Logs (for dashboard)
 * GET /api/call-logs/recent
 */
router.get('/recent', authenticate, authorize(['admin', 'executive']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    const whereClause: Record<string, unknown> = {};
    
    // Apply role-based filtering
    if (req.user?.role === 'executive') {
      whereClause.zoneId = req.user.zoneId;
    }

    const recentCallLogs = await CallLog.findAll({
      include: [
        { 
          model: Complaint, 
          as: 'complaint',
          where: whereClause,
          attributes: ['id', 'ticketNumber', 'title', 'zoneId']
        },
        { model: User, as: 'caller', attributes: ['id', 'name'] },
        { model: CallStatus, as: 'callStatus', attributes: ['id', 'name', 'displayName', 'icon', 'color'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit)
    });

    res.json({ callLogs: recentCallLogs });
  } catch (error) {
    console.error('Get recent call logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;