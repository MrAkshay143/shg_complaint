import { Router, type Request, type Response } from 'express';
import { Op } from 'sequelize';
import { Zone, Branch, Line, Farmer, Equipment, TicketStatus, CallStatus } from '../models';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// ==================== ZONE ROUTES ====================

/**
 * Get All Zones
 * GET /api/masters/zones
 */
router.get('/zones', authenticate, authorize(['admin', 'executive']), async (req: Request, res: Response): Promise<void> => {
  try {
    const zones = await Zone.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json({ zones });
  } catch (error) {
    console.error('Get zones error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create Zone
 * POST /api/masters/zones
 */
router.post('/zones', authenticate, authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      res.status(400).json({ error: 'Name and code are required' });
      return;
    }

    const zone = await Zone.create({
      name,
      code: code.toUpperCase(),
      description
    });

    res.status(201).json({
      message: 'Zone created successfully',
      zone
    });
  } catch (error) {
    console.error('Create zone error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update Zone
 * PUT /api/masters/zones/:id
 */
router.put('/zones/:id', authenticate, authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const zone = await Zone.findByPk(id);
    if (!zone) {
      res.status(404).json({ error: 'Zone not found' });
      return;
    }

    await zone.update({
      name,
      code: code?.toUpperCase(),
      description
    });

    res.json({
      message: 'Zone updated successfully',
      zone
    });
  } catch (error) {
    console.error('Update zone error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== BRANCH ROUTES ====================

/**
 * Get All Branches
 * GET /api/masters/branches
 */
router.get('/branches', authenticate, authorize(['admin', 'executive']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.query;
    const whereClause: Record<string, unknown> = { isActive: true };
    
    if (zoneId) {
      whereClause.zoneId = zoneId;
    }

    const branches = await Branch.findAll({
      where: whereClause,
      include: ['zone'],
      order: [['name', 'ASC']]
    });
    res.json({ branches });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create Branch
 * POST /api/masters/branches
 */
router.post('/branches', authenticate, authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, address, managerName, managerPhone, accountantName, accountantPhone, zoneId } = req.body;

    if (!name || !code || !address || !managerName || !managerPhone || !accountantName || !accountantPhone || !zoneId) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const branch = await Branch.create({
      name,
      code: code.toUpperCase(),
      address,
      managerName,
      managerPhone,
      accountantName,
      accountantPhone,
      zoneId
    });

    const branchWithZone = await Branch.findByPk(branch.id, {
      include: ['zone']
    });

    res.status(201).json({
      message: 'Branch created successfully',
      branch: branchWithZone
    });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update Branch
 * PUT /api/masters/branches/:id
 */
router.put('/branches/:id', authenticate, authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, code, address, managerName, managerPhone, accountantName, accountantPhone, zoneId } = req.body;

    const branch = await Branch.findByPk(id);
    if (!branch) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }

    await branch.update({
      name,
      code: code?.toUpperCase(),
      address,
      managerName,
      managerPhone,
      accountantName,
      accountantPhone,
      zoneId
    });

    const branchWithZone = await Branch.findByPk(branch.id, {
      include: ['zone']
    });

    res.json({
      message: 'Branch updated successfully',
      branch: branchWithZone
    });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== LINE ROUTES ====================

/**
 * Get All Lines
 * GET /api/masters/lines
 */
router.get('/lines', authenticate, authorize(['admin', 'executive']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { branchId } = req.query;
    const whereClause: Record<string, unknown> = { isActive: true };
    
    if (branchId) {
      whereClause.branchId = branchId;
    }

    const lines = await Line.findAll({
      where: whereClause,
      include: ['branch'],
      order: [['name', 'ASC']]
    });
    res.json({ lines });
  } catch (error) {
    console.error('Get lines error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create Line
 * POST /api/masters/lines
 */
router.post('/lines', authenticate, authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, supervisorName, supervisorPhone, branchId } = req.body;

    if (!name || !code || !supervisorName || !supervisorPhone || !branchId) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const line = await Line.create({
      name,
      code: code.toUpperCase(),
      supervisorName,
      supervisorPhone,
      branchId
    });

    const lineWithBranch = await Line.findByPk(line.id, {
      include: ['branch']
    });

    res.status(201).json({
      message: 'Line created successfully',
      line: lineWithBranch
    });
  } catch (error) {
    console.error('Create line error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update Line
 * PUT /api/masters/lines/:id
 */
router.put('/lines/:id', authenticate, authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, code, supervisorName, supervisorPhone, branchId } = req.body;

    const line = await Line.findByPk(id);
    if (!line) {
      res.status(404).json({ error: 'Line not found' });
      return;
    }

    await line.update({
      name,
      code: code?.toUpperCase(),
      supervisorName,
      supervisorPhone,
      branchId
    });

    const lineWithBranch = await Line.findByPk(line.id, {
      include: ['branch']
    });

    res.json({
      message: 'Line updated successfully',
      line: lineWithBranch
    });
  } catch (error) {
    console.error('Update line error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== FARMER ROUTES ====================

/**
 * Get All Farmers
 * GET /api/masters/farmers
 */
router.get('/farmers', authenticate, authorize(['admin', 'executive']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId, branchId, lineId, search } = req.query;
    const whereClause: { [key: string]: unknown; [Op.or]?: unknown } = { isActive: true };
    
    if (zoneId) whereClause.zoneId = zoneId;
    if (branchId) whereClause.branchId = branchId;
    if (lineId) whereClause.lineId = lineId;
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const farmers = await Farmer.findAll({
      where: whereClause,
      include: [
        { model: Line, as: 'line', include: [{ model: Branch, as: 'branch', include: ['zone'] }] }
      ],
      order: [['name', 'ASC']]
    });
    res.json({ farmers });
  } catch (error) {
    console.error('Get farmers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create Farmer
 * POST /api/masters/farmers
 */
router.post('/farmers', authenticate, authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, address, village, district, state, pincode, lineId, farmCode, shedType } = req.body;

    if (!name || !phone || !address || !village || !district || !state || !pincode || !lineId || !farmCode || !shedType) {
      res.status(400).json({ error: 'All required fields must be provided' });
      return;
    }

    // Get line details to set zone and branch
    const line = await Line.findByPk(lineId, {
      include: [{ model: Branch, as: 'branch' }]
    }) as { id: number; branchId: number; branch?: { zoneId: number } };

    if (!line) {
      res.status(404).json({ error: 'Line not found' });
      return;
    }

    const farmer = await Farmer.create({
      name,
      phone,
      email,
      address,
      village,
      district,
      state,
      pincode,
      lineId,
      farmCode,
      shedType,
      branchId: line.branchId,
      zoneId: line.branch?.zoneId || 1
    });

    const farmerWithDetails = await Farmer.findByPk(farmer.id, {
      include: [
        { model: Line, as: 'line', include: [{ model: Branch, as: 'branch', include: ['zone'] }] }
      ]
    });

    res.status(201).json({
      message: 'Farmer created successfully',
      farmer: farmerWithDetails
    });
  } catch (error) {
    console.error('Create farmer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update Farmer
 * PUT /api/masters/farmers/:id
 */
router.put('/farmers/:id', authenticate, authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, village, district, state, pincode, lineId, farmCode, shedType } = req.body;

    const farmer = await Farmer.findByPk(id);
    if (!farmer) {
      res.status(404).json({ error: 'Farmer not found' });
      return;
    }

    let branchId = farmer.branchId;
    let zoneId = farmer.zoneId;

    if (lineId && lineId !== farmer.lineId) {
      const line = await Line.findByPk(lineId, {
        include: [{ model: Branch, as: 'branch' }]
      });

      if (!line) {
        res.status(404).json({ error: 'Line not found' });
        return;
      }

      branchId = line.branchId;
      zoneId = (line as { branch?: { zoneId?: number } }).branch?.zoneId ?? zoneId;
    }

    await farmer.update({
      name,
      phone,
      email,
      address,
      village,
      district,
      state,
      pincode,
      lineId,
      farmCode,
      shedType,
      branchId,
      zoneId
    });

    const farmerWithDetails = await Farmer.findByPk(farmer.id, {
      include: [
        { model: Line, as: 'line', include: [{ model: Branch, as: 'branch', include: ['zone'] }] }
      ]
    });

    res.json({
      message: 'Farmer updated successfully',
      farmer: farmerWithDetails
    });
  } catch (error) {
    console.error('Update farmer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== EQUIPMENT ROUTES ====================

/**
 * Get All Equipment
 * GET /api/masters/equipment
 */
router.get('/equipment', authenticate, authorize(['admin', 'executive']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { farmerId, type, warrantyStatus } = req.query;
    const whereClause: Record<string, unknown> = { isActive: true };
    
    if (farmerId) whereClause.farmerId = farmerId;
    if (type) whereClause.type = type;
    if (warrantyStatus) whereClause.warrantyStatus = warrantyStatus;

    const equipment = await Equipment.findAll({
      where: whereClause,
      include: [
        { model: Farmer, as: 'farmer', include: [{ model: Line, as: 'line', include: [{ model: Branch, as: 'branch', include: ['zone'] }] }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ equipment });
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create Equipment
 * POST /api/masters/equipment
 */
router.post('/equipment', authenticate, authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, serialNumber, vendor, warrantyStatus, installedDate, warrantyExpiryDate, farmerId } = req.body;

    if (!type || !serialNumber || !vendor || !installedDate || !farmerId) {
      res.status(400).json({ error: 'All required fields must be provided' });
      return;
    }

    // Get farmer details
    const farmer = await Farmer.findByPk(farmerId);
    if (!farmer) {
      res.status(404).json({ error: 'Farmer not found' });
      return;
    }

    const equipment = await Equipment.create({
      type,
      serialNumber,
      vendor,
      warrantyStatus: warrantyStatus || 'na',
      installedDate: new Date(installedDate),
      warrantyExpiryDate: warrantyExpiryDate ? new Date(warrantyExpiryDate) : null,
      farmerId
    });

    const equipmentWithDetails = await Equipment.findByPk(equipment.id, {
      include: [
        { model: Farmer, as: 'farmer', include: [{ model: Line, as: 'line', include: [{ model: Branch, as: 'branch', include: ['zone'] }] }] }
      ]
    });

    res.status(201).json({
      message: 'Equipment created successfully',
      equipment: equipmentWithDetails
    });
  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update Equipment
 * PUT /api/masters/equipment/:id
 */
router.put('/equipment/:id', authenticate, authorize(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, serialNumber, vendor, warrantyStatus, installedDate, warrantyExpiryDate, farmerId } = req.body;

    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    await equipment.update({
      type,
      serialNumber,
      vendor,
      warrantyStatus,
      installedDate: installedDate ? new Date(installedDate) : equipment.installedDate,
      warrantyExpiryDate: warrantyExpiryDate ? new Date(warrantyExpiryDate) : equipment.warrantyExpiryDate,
      farmerId
    });

    const equipmentWithDetails = await Equipment.findByPk(equipment.id, {
      include: [
        { model: Farmer, as: 'farmer', include: [{ model: Line, as: 'line', include: [{ model: Branch, as: 'branch', include: ['zone'] }] }] }
      ]
    });

    res.json({
      message: 'Equipment updated successfully',
      equipment: equipmentWithDetails
    });
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get All Ticket Statuses
 * GET /api/masters/ticket-statuses
 */
router.get('/ticket-statuses', authenticate, authorize(['admin', 'executive']), async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketStatuses = await TicketStatus.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['displayName', 'ASC']]
    });
    res.json({ ticketStatuses });
  } catch (error) {
    console.error('Get ticket statuses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get All Call Statuses
 * GET /api/masters/call-statuses
 */
router.get('/call-statuses', authenticate, authorize(['admin', 'executive']), async (req: Request, res: Response): Promise<void> => {
  try {
    const callStatuses = await CallStatus.findAll({
      order: [['displayName', 'ASC'], ['name', 'ASC']]
    });
    res.json({ callStatuses });
  } catch (error) {
    console.error('Get call statuses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;