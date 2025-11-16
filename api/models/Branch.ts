import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import type { ZoneInstance } from './Zone.ts';

export interface BranchAttributes {
  id?: number;
  name: string;
  code: string;
  address: string;
  managerName: string;
  managerPhone: string;
  accountantName: string;
  accountantPhone: string;
  zoneId: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BranchInstance extends Model<BranchAttributes>, BranchAttributes {
  zone?: ZoneInstance;
}

const Branch = sequelize.define<BranchInstance>('Branch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  managerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  managerPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [10, 13]
    }
  },
  accountantName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accountantPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [10, 13]
    }
  },
  zoneId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Zones',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'branches',
  timestamps: true
});

export default Branch;