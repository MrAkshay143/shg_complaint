import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';

export type AuditAction = 'create' | 'update' | 'delete' | 'import' | 'export' | 'login' | 'logout';

export interface AuditLogAttributes {
  id?: number;
  userId: number;
  action: AuditAction;
  entity: string;
  entityId?: number;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

export interface AuditLogInstance extends Model<AuditLogAttributes>, AuditLogAttributes {}

const AuditLog = sequelize.define<AuditLogInstance>('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM('create', 'update', 'delete', 'import', 'export', 'login', 'logout'),
    allowNull: false
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  oldValues: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  newValues: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false
});

export default AuditLog;
