import { Router, type Response } from 'express';
import { Op } from 'sequelize';
import { User, Zone, Branch } from '../models';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * Get All Users
 * GET /api/users
 */
router.get('/', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, role, zoneId, branchId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const whereClause: { [key: string]: unknown; [Op.or]?: unknown } = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    // Master admin can see all users, regular admins are filtered by their zone/branch
    if (req.user?.email !== 'admin@shalimarcorp.in') {
      if (zoneId) {
        whereClause.zoneId = zoneId;
      }
      
      if (branchId) {
        whereClause.branchId = branchId;
      }
    }
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        { model: Zone, as: 'zone', attributes: ['id', 'name', 'code'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: offset
    });
    
    res.json({
      users,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get User by ID
 * GET /api/users/:id
 */
router.get('/:id', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      include: [
        { model: Zone, as: 'zone', attributes: ['id', 'name', 'code'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] }
      ],
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create User
 * POST /api/users
 */
router.post('/', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone, zoneId, branchId, permissions } = req.body;
    
    if (!name || !email || !password || !role || !phone) {
      res.status(400).json({ error: 'Name, email, password, role, and phone are required' });
      return;
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      zoneId: zoneId || null,
      branchId: branchId || null,
      permissions: permissions || null,
      isActive: true
    });
    
    // Fetch created user with associations
    const createdUser = await User.findByPk(user.id, {
      include: [
        { model: Zone, as: 'zone', attributes: ['id', 'name', 'code'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] }
      ],
      attributes: { exclude: ['password'] }
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user: createdUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
   * Update User
   * PUT /api/users/:id
   */
  router.put('/:id', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, email, role, phone, zoneId, branchId, permissions, isActive } = req.body;
      
      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // Prevent deactivating master admin account
      if (user.email === 'admin@shalimarcorp.in' && isActive === false) {
        res.status(403).json({ error: 'Cannot deactivate master admin account' });
        return;
      }
      
      // Prevent changing master admin role
      if (user.email === 'admin@shalimarcorp.in' && role && role !== 'admin') {
        res.status(403).json({ error: 'Cannot change master admin role' });
        return;
      }
      
      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          res.status(409).json({ error: 'Email already taken by another user' });
          return;
        }
      }
      
      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (phone) updateData.phone = phone;
      if (zoneId !== undefined) updateData.zoneId = zoneId;
      if (branchId !== undefined) updateData.branchId = branchId;
      if (permissions !== undefined) updateData.permissions = permissions;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      await user.update(updateData);
      
      // Fetch updated user with associations
      const updatedUser = await User.findByPk(id, {
        include: [
          { model: Zone, as: 'zone', attributes: ['id', 'name', 'code'] },
          { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] }
        ],
        attributes: { exclude: ['password'] }
      });
      
      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

/**
   * Reset User Password
   * PUT /api/users/:id/reset-password
   */
  router.put('/:id/reset-password', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword) {
        res.status(400).json({ error: 'New password is required' });
        return;
      }
      
      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await user.update({ password: hashedPassword });
      
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Change User Password (with current password verification)
   * PUT /api/users/:id/change-password
   */
  router.put('/:id/change-password', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required' });
        return;
      }
      
      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await user.update({ password: hashedPassword });
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

/**
   * Delete User
   * DELETE /api/users/:id
   */
  router.delete('/:id', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // Prevent deleting master admin account
      if (user.email === 'admin@shalimarcorp.in') {
        res.status(403).json({ error: 'Cannot delete master admin account' });
        return;
      }
      
      // Prevent deleting the last admin
      if (user.role === 'admin') {
        const adminCount = await User.count({ where: { role: 'admin', isActive: true } });
        if (adminCount <= 1) {
          res.status(400).json({ error: 'Cannot delete the last admin user' });
          return;
        }
      }
      
      await user.destroy();
      
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

export default router;