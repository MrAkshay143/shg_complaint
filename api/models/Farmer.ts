import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import type { LineInstance } from './Line.ts';

export interface FarmerAttributes {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  address: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  farmCode: string;
  shedType: string;
  lineId: number;
  branchId: number;
  zoneId: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FarmerInstance extends Model<FarmerAttributes>, FarmerAttributes {
  line?: LineInstance;
}

const Farmer = sequelize.define<FarmerInstance>('Farmer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [10, 13]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  village: {
    type: DataTypes.STRING,
    allowNull: false
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pincode: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 6]
    }
  },
  farmCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  shedType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Traditional Shed', 'EC Shed', 'Basic EC Shed', 'Semi EC Shed', 'Full EC Shed']]
    }
  },
  lineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Lines',
      key: 'id'
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
  tableName: 'farmers',
  timestamps: true
});

export default Farmer;
