import User from './User.ts';
import Zone from './Zone.ts';
import Branch from './Branch.ts';
import Line from './Line.ts';
import Farmer from './Farmer.ts';
import Equipment from './Equipment.ts';
import Complaint from './Complaint.ts';
import CallLog from './CallLog.ts';
import AuditLog from './AuditLog.ts';
import TicketStatus from './TicketStatus.ts';
import CallStatus from './CallStatus.ts';

// Zone -> Branch (1:N)
Zone.hasMany(Branch, { foreignKey: 'zoneId', as: 'branches' });
Branch.belongsTo(Zone, { foreignKey: 'zoneId', as: 'zone' });

// Branch -> Line (1:N)
Branch.hasMany(Line, { foreignKey: 'branchId', as: 'lines' });
Line.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

// Line -> Farmer (1:N)
Line.hasMany(Farmer, { foreignKey: 'lineId', as: 'farmers' });
Farmer.belongsTo(Line, { foreignKey: 'lineId', as: 'line' });

// Zone -> User (1:N)
Zone.hasMany(User, { foreignKey: 'zoneId', as: 'users' });
User.belongsTo(Zone, { foreignKey: 'zoneId', as: 'zone' });

// Branch -> User (1:N)
Branch.hasMany(User, { foreignKey: 'branchId', as: 'users' });
User.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

// Farmer -> Equipment (1:N)
Farmer.hasMany(Equipment, { foreignKey: 'farmerId', as: 'equipment' });
Equipment.belongsTo(Farmer, { foreignKey: 'farmerId', as: 'farmer' });

// Farmer -> Complaint (1:N)
Farmer.hasMany(Complaint, { foreignKey: 'farmerId', as: 'complaints' });
Complaint.belongsTo(Farmer, { foreignKey: 'farmerId', as: 'farmer' });

// Equipment -> Complaint (1:N)
Equipment.hasMany(Complaint, { foreignKey: 'equipmentId', as: 'complaints' });
Complaint.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

// User -> Complaint (assigned) (1:N)
User.hasMany(Complaint, { foreignKey: 'assignedTo', as: 'assignedComplaints' });
Complaint.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });

// User -> Complaint (created) (1:N)
User.hasMany(Complaint, { foreignKey: 'createdBy', as: 'createdComplaints' });
Complaint.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Zone -> Complaint (1:N)
Zone.hasMany(Complaint, { foreignKey: 'zoneId', as: 'complaints' });
Complaint.belongsTo(Zone, { foreignKey: 'zoneId', as: 'zone' });

// Branch -> Complaint (1:N)
Branch.hasMany(Complaint, { foreignKey: 'branchId', as: 'complaints' });
Complaint.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

// Line -> Complaint (1:N)
Line.hasMany(Complaint, { foreignKey: 'lineId', as: 'complaints' });
Complaint.belongsTo(Line, { foreignKey: 'lineId', as: 'line' });

// Complaint -> CallLog (1:N)
Complaint.hasMany(CallLog, { foreignKey: 'complaintId', as: 'callLogs' });
CallLog.belongsTo(Complaint, { foreignKey: 'complaintId', as: 'complaint' });

// User -> CallLog (1:N)
User.hasMany(CallLog, { foreignKey: 'calledBy', as: 'callLogs' });
CallLog.belongsTo(User, { foreignKey: 'calledBy', as: 'caller' });

// User -> AuditLog (1:N)
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// TicketStatus -> Complaint (1:N)
TicketStatus.hasMany(Complaint, { foreignKey: 'ticketStatusId', as: 'complaints' });
Complaint.belongsTo(TicketStatus, { foreignKey: 'ticketStatusId', as: 'ticketStatus' });

// CallStatus -> CallLog (1:N)
CallStatus.hasMany(CallLog, { foreignKey: 'callStatusId', as: 'callLogs' });
CallLog.belongsTo(CallStatus, { foreignKey: 'callStatusId', as: 'callStatus' });

export {
  User,
  Zone,
  Branch,
  Line,
  Farmer,
  Equipment,
  Complaint,
  CallLog,
  AuditLog,
  TicketStatus,
  CallStatus
};