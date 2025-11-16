import { Router, type Request, type Response } from 'express';
import { User } from '../models';
import { generateToken, authenticate, type AuthRequest } from '../middleware/auth';
import { hashPassword, comparePassword } from '../utils/auth';
import { validateEmail, validatePhoneNumber } from '../utils/validation';

const router = Router();

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Invalid email format. Must be @shalimarcorp.in' });
      return;
    }

    const user = await User.findOne({ 
      where: { email, isActive: true },
      include: ['zone', 'branch']
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user.id);
    
    // Remove password from response
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      zoneId: user.zoneId,
      branchId: user.branchId,
      phone: user.phone
    };

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * User Registration (Admin only)
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, zoneId, branchId, phone } = req.body;

    // Validation
    if (!name || !email || !password || !role || !phone) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (!['admin', 'executive'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be admin or executive' });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Invalid email format. Must be @shalimarcorp.in' });
      return;
    }

    if (!validatePhoneNumber(phone)) {
      res.status(400).json({ error: 'Invalid phone number. Must be 10-13 digits' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      zoneId: role === 'executive' ? zoneId : null,
      branchId: role === 'executive' ? branchId : null,
      phone,
      isActive: true
    });

    // Remove password from response
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      zoneId: user.zoneId,
      branchId: user.branchId,
      phone: user.phone
    };

    res.status(201).json({
      message: 'User created successfully',
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get Current User Profile
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const userData = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: ['zone', 'branch']
    });

    res.json({ user: userData });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // Here we can perform any cleanup if needed
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
