import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.ts';
import type { TicketStatusInstance } from './TicketStatus.ts';

export type ComplaintStatus = 'open' | 'progress' | 'closed' | 'reopen';
export type ComplaintPriority = 'normal' | 'urgent' | 'critical';
export type ComplaintCategory = 'equipment' | 'feed' | 'medicine' | 'service' | 'billing' | 'other';

export interface ComplaintAttributes {
  id?: number;
  ticketNumber: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  ticketStatusId: number;
  farmerId: number;
  equipmentId?: number;
  assignedTo?: number;
  zoneId: number;
  branchId: number;
  lineId: number;
  slaDeadline: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdBy: number;
  attachments?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ComplaintInstance extends Model<ComplaintAttributes>, ComplaintAttributes {
  ticketStatus?: TicketStatusInstance;
}

const Complaint = sequelize.define<ComplaintInstance>('Complaint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticketNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('equipment', 'feed', 'medicine', 'service', 'billing', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  priority: {
    type: DataTypes.ENUM('normal', 'urgent', 'critical'),
    allowNull: false,
    defaultValue: 'normal'
  },
  status: {
    type: DataTypes.VIRTUAL,
    get() {
      const ticketStatus = (this as ComplaintInstance).ticketStatus;
      return ticketStatus?.name || 'open';
    }
  },
  ticketStatusId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    references: {
      model: 'ticket_statuses',
      key: 'id'
    }
  },
  farmerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'farmers',
      key: 'id'
    }
  },
  equipmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'equipment',
      key: 'id'
    }
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  zoneId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'zones',
      key: 'id'
    }
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  lineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lines',
      key: 'id'
    }
  },
  slaDeadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  attachments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'complaints',
  timestamps: true
});

export default Complaint;
