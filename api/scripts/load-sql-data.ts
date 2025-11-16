import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../config/database';
import { Zone, Branch, Line, Farmer, Equipment } from '../models';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadSQLData() {
  console.log('🔄 Starting SQL data loading...');
  
  try {
    // Read pre-added-data.sql
    const preAddedDataPath = path.join(__dirname, '../pre-added-data.sql');
    const sampleDataPath = path.join(__dirname, '../sample-data.sql');
    
    console.log('📍 Checking for SQL files...');
    console.log('📍 pre-added-data.sql path:', preAddedDataPath);
    console.log('📍 sample-data.sql path:', sampleDataPath);
    
    if (!fs.existsSync(preAddedDataPath)) {
      console.log('❌ pre-added-data.sql not found');
      return;
    }
    
    if (!fs.existsSync(sampleDataPath)) {
      console.log('❌ sample-data.sql not found');
      return;
    }
    
    console.log('✅ SQL files found!');
    console.log('📖 Reading SQL files...');
    const preAddedSQL = fs.readFileSync(preAddedDataPath, 'utf8');
    const sampleSQL = fs.readFileSync(sampleDataPath, 'utf8');
    
    console.log(`📊 Pre-added SQL size: ${preAddedSQL.length} characters`);
    console.log(`📊 Sample SQL size: ${sampleSQL.length} characters`);
    
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
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of sampleStatements) {
      try {
        await sequelize.query(statement);
      } catch {
        console.log(`⚠️  Skipping statement (may already exist): ${statement.substring(0, 50)}...`);
      }
    }
    
    console.log('✅ SQL data loaded successfully!');
    
    // Verify data loading
    const zoneCount = await Zone.count();
    const branchCount = await Branch.count();
    const lineCount = await Line.count();
    const farmerCount = await Farmer.count();
    const equipmentCount = await Equipment.count();
    
    console.log('📊 Data summary:');
    console.log(`   Zones: ${zoneCount}`);
    console.log(`   Branches: ${branchCount}`);
    console.log(`   Lines: ${lineCount}`);
    console.log(`   Farmers: ${farmerCount}`);
    console.log(`   Equipment: ${equipmentCount}`);
    
  } catch (error) {
    console.error('❌ Error loading SQL data:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadSQLData();
}

export default loadSQLData;