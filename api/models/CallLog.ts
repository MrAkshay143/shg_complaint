import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import type { CallStatusInstance } from './CallStatus.ts';

export type CallOutcome = 'connected' | 'no_answer' | 'busy' | 'wrong_number';

export interface CallLogAttributes {
  id?: number;
  complaintId: number;
  calledBy: number;
  outcome: CallOutcome;
  callStatusId: number;
  duration?: number;
  remarks?: string;
  nextFollowUpDate?: Date;
  complaintStatus?: 'open' | 'progress' | 'closed' | 'reopen';
  complaintStatusDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CallLogInstance extends Model<CallLogAttributes>, CallLogAttributes {
  callStatus?: CallStatusInstance;
}

const CallLog = sequelize.define<CallLogInstance>('CallLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  complaintId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'complaints',
      key: 'id'
    }
  },
  calledBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  outcome: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'connected'
  },
  callStatusId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'call_statuses',
      key: 'id'
    }
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nextFollowUpDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  complaintStatus: {
    type: DataTypes.ENUM('open', 'progress', 'closed', 'reopen'),
    allowNull: true
  },
  complaintStatusDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'call_logs',
  timestamps: true
});

export default CallLog;
