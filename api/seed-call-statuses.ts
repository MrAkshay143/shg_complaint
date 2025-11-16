import CallStatus from './models/CallStatus';
import sequelize from './config/database';

const callStatuses = [
  {
    name: 'connected',
    displayName: 'Connected',
    description: 'Call was successfully connected',
    color: '#10b981',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'no_answer',
    displayName: 'No Answer',
    description: 'Call was made but no answer received',
    color: '#f59e0b',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'busy',
    displayName: 'Busy',
    description: 'Line was busy during call attempt',
    color: '#ef4444',
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'wrong_number',
    displayName: 'Wrong Number',
    description: 'Contact number is incorrect',
    color: '#8b5cf6',
    isActive: true,
    sortOrder: 4
  }
];

async function seedCallStatuses() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if call statuses already exist
    const existingStatuses = await CallStatus.findAll();
    console.log(`Found ${existingStatuses.length} existing call statuses.`);

    for (const status of callStatuses) {
      const [callStatus, created] = await CallStatus.findOrCreate({
        where: { name: status.name },
        defaults: status
      });
      
      if (created) {
        console.log(`Created call status: ${status.displayName}`);
      } else {
        console.log(`Call status already exists: ${status.displayName}`);
      }
    }

    console.log('Call statuses seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding call statuses:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the seeder
if (require.main === module) {
  seedCallStatuses();
}

export { seedCallStatuses };