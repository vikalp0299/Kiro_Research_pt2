#!/usr/bin/env node

/**
 * Database initialization script
 * Run this to set up DynamoDB tables and populate sample data
 */

const { createDatabase, addDummyDataToClassDB } = require('./index');

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Create tables
    await createDatabase();
    
    // Add sample data
    await addDummyDataToClassDB();
    
    console.log('✅ Database initialization completed successfully!');
    console.log('📚 Sample classes have been added to the database');
    console.log('🔧 You can now start the backend server');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };