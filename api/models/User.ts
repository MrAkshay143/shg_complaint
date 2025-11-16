import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';

export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'executive';
  zoneId?: number;
  branchId?: number;
  phone: string;
  isActive: boolean;
  permissions?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserInstance extends Model<UserAttributes>, UserAttributes {}

const User = sequelize.define<UserInstance>('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      is: /^[\w._%+-]+@shalimarcorp\.in$/i
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'executive'),
    allowNull: false
  },
  zoneId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Zones',
      key: 'id'
    }
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Branches',
      key: 'id'
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [10, 13]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  permissions: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

export default User;