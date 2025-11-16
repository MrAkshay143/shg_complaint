import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/database.ts';
import { User } from './models/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadSQLData() {
  console.log('🔄 Loading SQL data...');
  
  try {
    // Read pre-added-data.sql
    const preAddedDataPath = path.join(__dirname, 'pre-added-data.sql');
    const sampleDataPath = path.join(__dirname, 'sample-data.sql');
    
    if (!fs.existsSync(preAddedDataPath)) {
      console.log('⚠️  pre-added-data.sql not found, skipping...');
      return;
    }
    
    if (!fs.existsSync(sampleDataPath)) {
      console.log('⚠️  sample-data.sql not found, skipping...');
      return;
    }
    
    console.log('📖 Reading SQL files...');
    const preAddedSQL = fs.readFileSync(preAddedDataPath, 'utf8');
    const sampleSQL = fs.readFileSync(sampleDataPath, 'utf8');
    
    // Execute pre-added data SQL
    console.log('🔄 Loading pre-added data...');
    const preAddedStatements = preAddedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of preAddedStatements) {
      try {
        await sequelize.query(statement);
      } catch {
        console.log(`⚠️  Skipping statement (may already exist): ${statement.substring(0, 50)}...`);
      }
    }
    
    // Execute sample data SQL
    console.log('🔄 Loading sample data...');
    const sampleStatements = sampleSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        const cleanStmt = stmt.trim();
        if (cleanStmt.length === 0) return false;
        
        // Check if this is a DELETE statement (skip these)
        if (cleanStmt.startsWith('DELETE FROM')) return false;
        
        // Check if this contains any INSERT statements after removing comments
        const lines = cleanStmt.split('\n').map(line => line.trim());
        const hasInsert = lines.some(line => line.toUpperCase().startsWith('INSERT INTO'));
        
        if (!hasInsert && cleanStmt.length > 0) {
          console.log(`🚫 Filtered out: "${cleanStmt.substring(0, 50)}..."`);
        }
        return hasInsert;
      });
    
    console.log(`📊 Processing ${sampleStatements.length} sample data statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of sampleStatements) {
      try {
        if (statement.trim()) {
          console.log(`📝 Executing: ${statement.substring(0, 100)}...`);
          await sequelize.query(statement);
          console.log(`✅ Success - Statement executed successfully`);
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Error executing statement: ${error instanceof Error ? error.message : String(error)}`);
        console.log(`📝 Full statement: ${statement}`);
        console.log(`🔍 Error details:`, error);
        errorCount++;
      }
    }
    
    console.log(`📊 Summary: ${successCount} successful, ${errorCount} failed`);
    
    console.log('✅ SQL data loaded successfully!');
    
  } catch (error) {
    console.error('❌ Error loading SQL data:', error);
  }
}

async function initializeDatabase() {
  console.log('Starting database initialization...');
  try {
    // Test database connection
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Create tables
    console.log('Creating database tables...');
    await sequelize.sync({ force: true }); // Force recreate tables for development
    console.log('✅ All tables created successfully.');

    // Load SQL data
    await loadSQLData();

    // Create default admin user if not exists
    console.log('Checking for default admin user...');
    const adminExists = await User.findOne({ where: { email: 'admin@shalimarcorp.in' } });
    if (!adminExists) {
      console.log('Creating default admin user...');
      await User.create({
        name: 'System Admin',
        email: 'admin@shalimarcorp.in',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'admin',
        phone: '1234567890',
        isActive: true
      });
      console.log('✅ Default admin user created.');
    } else {
      console.log('Admin user already exists.');
    }

    console.log('✅ Database initialization completed successfully.');
  } catch (error) {
    console.error('❌ Unable to initialize database:', error);
    process.exit(1);
  }
}

// Always run initialization when executed directly
console.log('Running database initialization...');
initializeDatabase();

export default initializeDatabase;