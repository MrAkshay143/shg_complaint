import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';

export interface ZoneAttributes {
  id?: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ZoneInstance extends Model<ZoneAttributes>, ZoneAttributes {}

const Zone = sequelize.define<ZoneInstance>('Zone', {
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
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'zones',
  timestamps: true
});

export default Zone;