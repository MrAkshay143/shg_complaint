import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import type { FarmerInstance } from './Farmer.ts';
import type { ComplaintInstance } from './Complaint.ts';

export interface EquipmentAttributes {
  id?: number;
  type: string;
  serialNumber: string;
  vendor: string;
  warrantyStatus: 'active' | 'expired' | 'na';
  installedDate: Date;
  warrantyExpiryDate?: Date;
  farmerId: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EquipmentInstance extends Model<EquipmentAttributes>, EquipmentAttributes {
  farmer?: FarmerInstance;
  complaints?: ComplaintInstance[];
}

const Equipment = sequelize.define<EquipmentInstance>('Equipment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  vendor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  warrantyStatus: {
    type: DataTypes.ENUM('active', 'expired', 'na'),
    allowNull: false,
    defaultValue: 'na'
  },
  installedDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  warrantyExpiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  farmerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Farmers',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'equipment',
  timestamps: true
});

export default Equipment;
// Restart trigger
