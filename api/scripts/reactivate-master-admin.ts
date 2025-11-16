import sequelize from '../config/database.ts';
import User from '../models/User.ts';
import bcrypt from 'bcryptjs';

async function reactivateMasterAdmin() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if master admin exists
    const masterAdmin = await User.findOne({
      where: { email: 'admin@shalimarcorp.in' }
    });

    if (masterAdmin) {
      // Reactivate and reset password
      const hashedPassword = await bcrypt.hash('password', 10);
      
      await masterAdmin.update({
        isActive: true,
        password: hashedPassword,
        role: 'admin'
      });
      
      console.log('Master admin account reactivated successfully!');
      console.log('Email: admin@shalimarcorp.in');
      console.log('Password: password');
      console.log('Status: Active');
    } else {
      // Create master admin if doesn't exist
      const hashedPassword = await bcrypt.hash('password', 10);
      
      await User.create({
        name: 'Master Admin',
        email: 'admin@shalimarcorp.in',
        password: hashedPassword,
        role: 'admin',
        phone: '0000000000',
        isActive: true,
        permissions: JSON.stringify(['all'])
      });
      
      console.log('Master admin account created successfully!');
      console.log('Email: admin@shalimarcorp.in');
      console.log('Password: password');
      console.log('Status: Active');
    }

    // Close database connection
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error reactivating master admin:', error);
    process.exit(1);
  }
}

// Run the script
reactivateMasterAdmin();