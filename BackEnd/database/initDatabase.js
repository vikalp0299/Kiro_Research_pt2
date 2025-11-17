/**
 * Database initialization script
 * Creates all required DynamoDB tables and populates dummy data
 */

const { createDatabase } = require('./userOperations');
const { createClassDB, addDummyDataToClassDB } = require('./classOperations');
const { createRegistrationDB } = require('./registrationOperations');

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...\n');

    // Create studentUserDB table
    console.log('Creating studentUserDB table...');
    await createDatabase();
    console.log('✓ studentUserDB table ready\n');

    // Create classDB table
    console.log('Creating classDB table...');
    await createClassDB();
    console.log('✓ classDB table ready\n');

    // Add dummy class data
    console.log('Adding dummy class data...');
    await addDummyDataToClassDB();
    console.log('✓ Dummy class data added\n');

    // Create classRegistrationDB table
    console.log('Creating classRegistrationDB table...');
    await createRegistrationDB();
    console.log('✓ classRegistrationDB table ready\n');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
