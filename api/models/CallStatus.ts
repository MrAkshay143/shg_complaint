import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';

export interface CallStatusAttributes {
  id?: number;
  name: string;
  displayName: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CallStatusInstance extends Model<CallStatusAttributes>, CallStatusAttributes {}

const CallStatus = sequelize.define<CallStatusInstance>('CallStatus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#6B7280'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'call_statuses',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['sortOrder']
    }
  ]
});

export default CallStatus;