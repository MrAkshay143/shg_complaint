import { Router, type Response } from 'express';
import { Op } from 'sequelize';
import { Complaint, Farmer, Equipment, User, CallLog, Zone, Branch, Line, TicketStatus, CallStatus } from '../models';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { generateTicketNumber, calculateSLADeadline } from '../utils/validation';

const router = Router();

/**
 * Get All Complaints with Filters
 * GET /api/complaints
 */
router.get('/', authenticate, authorize(['admin', 'executive']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      status, priority, category, zoneId, branchId, lineId, 
      farmerId, assignedTo, startDate, endDate, page = 1, limit = 20 
    } = req.query;

    const whereClause: Record<string, unknown> = {};
    
    // Apply role-based filtering
    if (req.user?.role === 'executive') {
      whereClause.zoneId = req.user.zoneId;
    }
    // Master admin can see all complaints regardless of zone

    // Apply filters
    if (status && typeof status === 'string') {
      // Find the ticket status ID by name
      const ticketStatus = await TicketStatus.findOne({ where: { name: status } });
      if (ticketStatus) {
        whereClause.ticketStatusId = ticketStatus.id;
      }
    }
    if (priority) whereClause.priority = priority;
    if (category) whereClause.category = category;
    if (zoneId) whereClause.zoneId = zoneId;
    if (branchId) whereClause.branchId = branchId;
    if (lineId) whereClause.lineId = lineId;
    if (farmerId) whereClause.farmerId = farmerId;
    if (assignedTo) whereClause.assignedTo = assignedTo;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate as string);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate as string);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Complaint.findAndCountAll({
      where: whereClause,
      include: [
        { model: Farmer, as: 'farmer' },
        { model: Equipment, as: 'equipment' },
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
        { model: Zone, as: 'zone', attributes: ['id', 'name', 'code'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
        { model: Line, as: 'line', attributes: ['id', 'name', 'code'] },
        { model: TicketStatus, as: 'ticketStatus', attributes: ['id', 'name', 'displayName', 'color'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      complaints: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get Complaint by ID
 * GET /api/complaints/:id
 */
router.get('/:id', authenticate, authorize(['admin', 'executive']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findByPk(id, {
      include: [
        { model: Farmer, as: 'farmer' },
        { model: Equipment, as: 'equipment' },
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Zone, as: 'zone', attributes: ['id', 'name', 'code'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
        { model: Line, as: 'line', attributes: ['id', 'name', 'code'] },
        { model: TicketStatus, as: 'ticketStatus', attributes: ['id', 'name', 'displayName', 'color'] },
        { 
          model: CallLog, 
          as: 'callLogs',
          include: [
            { model: User, as: 'calledBy', attributes: ['id', 'name'] },
            { model: CallStatus, as: 'callStatus', attributes: ['id', 'name', 'displayName', 'icon', 'color'] }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    // Check role-based access
    if (req.user?.role === 'executive' && complaint.zoneId !== req.user.zoneId) {
      res.status(403).json({ error: 'Access denied. Complaint not in your zone.' });
      return;
    }

    res.json({ complaint });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create New Complaint
 * POST /api/complaints
 */
router.post('/', authenticate, authorize(['admin', 'executive']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      title, description, category, priority, farmerId, 
      equipmentId, assignedTo, attachments 
    } = req.body;

    // Validation
    if (!title || !description || !category || !priority || !farmerId) {
      res.status(400).json({ error: 'All required fields must be provided' });
      return;
    }

    // Get farmer details for zone/branch/line assignment
    const farmer = await Farmer.findByPk(farmerId);
    if (!farmer) {
      res.status(404).json({ error: 'Farmer not found' });
      return;
    }

    // Check role-based access for executives
    if (req.user?.role === 'executive' && farmer.zoneId !== req.user.zoneId) {
      res.status(403).json({ error: 'Access denied. Farmer not in your zone.' });
      return;
    }

    // Generate ticket number
    const ticketNumber = generateTicketNumber();
    
    // Calculate SLA deadline
    const slaDeadline = calculateSLADeadline(priority);

    const complaint = await Complaint.create({
      ticketNumber,
      title,
      description,
      category,
      priority,
      ticketStatusId: 1, // Default to 'open' status (ID 1)
      farmerId,
      equipmentId: equipmentId || null,
      assignedTo: assignedTo || null,
      zoneId: farmer.zoneId,
      branchId: farmer.branchId,
      lineId: farmer.lineId,
      slaDeadline,
      createdBy: req.user!.id,
      attachments: attachments || null
    });

    const complaintWithDetails = await Complaint.findByPk(complaint.id, {
      include: [
        { model: Farmer, as: 'farmer' },
        { model: Equipment, as: 'equipment' },
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
        { model: Zone, as: 'zone', attributes: ['id', 'name', 'code'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
        { model: Line, as: 'line', attributes: ['id', 'name', 'code'] },
        { model: TicketStatus, as: 'ticketStatus', attributes: ['id', 'name', 'displayName', 'color'] }
      ]
    });

    res.status(201).json({
      message: 'Complaint created successfully',
      complaint: complaintWithDetails
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update Complaint Status
 * PUT /api/complaints/:id/status
 */
router.put('/:id/status', authenticate, authorize(['admin', 'executive']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    // Check role-based access
    if (req.user?.role === 'executive' && complaint.zoneId !== req.user.zoneId) {
      res.status(403).json({ error: 'Access denied. Complaint not in your zone.' });
      return;
    }

    // Check if user is assigned to this complaint (for executives)
    if (req.user?.role === 'executive' && complaint.assignedTo !== req.user.id) {
      res.status(403).json({ error: 'Access denied. Complaint not assigned to you.' });
      return;
    }

    // Find the ticket status ID by name
    const ticketStatus = await TicketStatus.findOne({ where: { name: status } });
    if (!ticketStatus) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const updateData: Record<string, unknown> = { ticketStatusId: ticketStatus.id };
    
    // Update timestamps based on status
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    } else if (status === 'closed') {
      updateData.closedAt = new Date();
    }

    await complaint.update(updateData);

    // Create call log if remarks are provided
    if (remarks) {
      // Find the 'connected' call status ID
      const connectedCallStatus = await CallStatus.findOne({ where: { name: 'connected' } });
      const callStatusId = connectedCallStatus?.id || 1; // Default to 1 if not found
      
      await CallLog.create({
        complaintId: complaint.id,
        calledBy: req.user!.id,
        callStatusId, // Use callStatusId instead of outcome
        remarks
      });
    }

    const updatedComplaint = await Complaint.findByPk(id, {
      include: [
        { model: Farmer, as: 'farmer' },
        { model: Equipment, as: 'equipment' },
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
        { model: TicketStatus, as: 'ticketStatus', attributes: ['id', 'name', 'displayName', 'color'] },
        { model: CallLog, as: 'callLogs', include: [{ model: User, as: 'caller', attributes: ['id', 'name'] }] }
      ]
    });

    res.json({
      message: 'Complaint status updated successfully',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Assign Complaint to Executive
 * PUT /api/complaints/:id/assign
 */
router.put('/:id/assign', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      res.status(400).json({ error: 'Assigned user ID is required' });
      return;
    }

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    const executive = await User.findOne({
      where: { id: assignedTo, role: 'executive', isActive: true }
    });

    if (!executive) {
      res.status(404).json({ error: 'Executive not found or inactive' });
      return;
    }

    // Check if executive is in the same zone as the complaint
    if (executive.zoneId !== complaint.zoneId) {
      res.status(400).json({ error: 'Executive must be in the same zone as the complaint' });
      return;
    }

    await complaint.update({ assignedTo });

    const updatedComplaint = await Complaint.findByPk(id, {
      include: [
        { model: Farmer, as: 'farmer' },
        { model: Equipment, as: 'equipment' },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({
      message: 'Complaint assigned successfully',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Assign complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update Complaint
 * PUT /api/complaints/:id
 */
router.put('/:id', authenticate, authorize(['admin', 'executive']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, status } = req.body;

    // Find the complaint
    const complaint = await Complaint.findByPk(id, {
      include: [
        { model: Farmer, as: 'farmer' },
        { model: Equipment, as: 'equipment' },
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    // Check role-based access
    if (req.user?.role === 'executive' && complaint.zoneId !== req.user.zoneId) {
      res.status(403).json({ error: 'Access denied. Complaint not in your zone.' });
      return;
    }

    // Check if user is assigned to this complaint (for executives)
    if (req.user?.role === 'executive' && complaint.assignedTo !== req.user.id) {
      res.status(403).json({ error: 'Access denied. Complaint not assigned to you.' });
      return;
    }

    // Update the complaint
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      // Find the ticket status ID by name
      const ticketStatus = await TicketStatus.findOne({ where: { name: status } });
      if (!ticketStatus) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
      updateData.ticketStatusId = ticketStatus.id;
      // Update timestamps based on status
      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
      } else if (status === 'closed') {
        updateData.closedAt = new Date();
      }
    }

    await complaint.update(updateData);

    // Fetch updated complaint with all relationships
    const updatedComplaint = await Complaint.findByPk(id, {
      include: [
        { model: Farmer, as: 'farmer' },
        { model: Equipment, as: 'equipment' },
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'] },
        { model: Zone, as: 'zone', attributes: ['id', 'name', 'code'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
        { model: Line, as: 'line', attributes: ['id', 'name', 'code'] },
        { model: TicketStatus, as: 'ticketStatus', attributes: ['id', 'name', 'displayName', 'color'] }
      ]
    });

    res.json({
      message: 'Complaint updated successfully',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;