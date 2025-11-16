// Manual migration runner
import sequelize from './config/database.ts';
import { TicketStatus, CallStatus, Complaint, CallLog } from './models/index.ts';

async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    // Sync all models to create tables if they don't exist
    console.log('Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('Database models synced');
    
    // Check if TicketStatus table exists and has data
    let ticketStatusCount = 0;
    try {
      ticketStatusCount = await TicketStatus.count();
      console.log(`TicketStatus count: ${ticketStatusCount}`);
    } catch {
      console.log('TicketStatus table might not exist yet, will create...');
    }
    
    if (ticketStatusCount === 0) {
      console.log('Creating ticket statuses...');
      await TicketStatus.bulkCreate([
        { name: 'open', displayName: 'Open', color: '#3B82F6', isActive: true, sortOrder: 1 },
        { name: 'progress', displayName: 'In Progress', color: '#F59E0B', isActive: true, sortOrder: 2 },
        { name: 'closed', displayName: 'Closed', color: '#10B981', isActive: true, sortOrder: 3 },
        { name: 'reopen', displayName: 'Re-opened', color: '#EF4444', isActive: true, sortOrder: 4 },
      ]);
      console.log('Ticket statuses created');
    }
    
    // Check if CallStatus table exists and has data
    let callStatusCount = 0;
    try {
      callStatusCount = await CallStatus.count();
      console.log(`CallStatus count: ${callStatusCount}`);
    } catch {
      console.log('CallStatus table might not exist yet, will create...');
    }
    
    if (callStatusCount === 0) {
      console.log('Creating call statuses...');
      await CallStatus.bulkCreate([
        { name: 'connected', displayName: 'Connected', icon: '✅', color: '#10B981', isActive: true, sortOrder: 1 },
        { name: 'no_answer', displayName: 'No Answer', icon: '📵', color: '#F59E0B', isActive: true, sortOrder: 2 },
        { name: 'busy', displayName: 'Busy', icon: '📞', color: '#EF4444', isActive: true, sortOrder: 3 },
        { name: 'wrong_number', displayName: 'Wrong Number', icon: '❌', color: '#6B7280', isActive: true, sortOrder: 4 },
      ]);
      console.log('Call statuses created');
    }
    
    // Check if Complaints table has ticketStatusId column
    try {
      console.log('Complaints table structure check passed');
      
      // Check if complaints have ticketStatusId set
      const complaintsWithoutStatus = await Complaint.count({ where: { ticketStatusId: null } });
      console.log(`Complaints without ticketStatusId: ${complaintsWithoutStatus}`);
      
      if (complaintsWithoutStatus > 0) {
        console.log('Updating complaints with proper ticketStatusId...');
        // Update existing complaints with proper ticketStatusId based on default status
        await sequelize.query(`
          UPDATE complaints 
          SET ticketStatusId = (
            SELECT id FROM ticket_statuses WHERE name = 'open' LIMIT 1
          )
          WHERE ticketStatusId IS NULL
        `);
        console.log('Complaints updated with ticketStatusId');
      }
      
    } catch (error) {
      console.log('Complaints table might not have ticketStatusId column:', (error as Error).message);
    }
    
    // Check if CallLogs table has callStatusId column
    try {
      console.log('CallLogs table structure check passed');
      
      // Check if call logs have callStatusId set
      const callLogsWithoutStatus = await CallLog.count({ where: { callStatusId: null } });
      console.log(`CallLogs without callStatusId: ${callLogsWithoutStatus}`);
      
      if (callLogsWithoutStatus > 0) {
        console.log('Updating call logs with proper callStatusId...');
        // Update existing call logs with proper callStatusId based on default status
        await sequelize.query(`
          UPDATE call_logs 
          SET callStatusId = (
            SELECT id FROM call_statuses WHERE name = 'connected' LIMIT 1
          )
          WHERE callStatusId IS NULL
        `);
        console.log('Call logs updated with callStatusId');
      }
      
    } catch (error) {
      console.log('CallLogs table might not have callStatusId column:', (error as Error).message);
    }
    
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();