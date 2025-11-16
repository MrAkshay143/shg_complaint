import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    zoneId?: number;
    branchId?: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

export const generateToken = (userId: number): string => {
  const secret = process.env.JWT_SECRET || 'default-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign({ userId }, secret as string, { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string): { userId: number } | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
  } catch {
    return null;
  }
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    console.log('Token received:', token.substring(0, 20) + '...');
    console.log('JWT_SECRET:', process.env.JWT_SECRET);

    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive.' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      zoneId: user.zoneId,
      branchId: user.branchId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    next();
  } catch {
    console.error('Auth error: Internal server error');
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' });
    }

    // Master admin has full permissions
    if (req.user.email === 'admin@shalimarcorp.in') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};