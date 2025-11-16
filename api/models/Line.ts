import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import type { BranchInstance } from './Branch.ts';

export interface LineAttributes {
  id?: number;
  name: string;
  code: string;
  supervisorName: string;
  supervisorPhone: string;
  branchId: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LineInstance extends Model<LineAttributes>, LineAttributes {
  branch?: BranchInstance;
}

const Line = sequelize.define<LineInstance>('Line', {
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
  supervisorName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  supervisorPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [10, 13]
    }
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Branches',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'lines',
  timestamps: true
});

export default Line;
