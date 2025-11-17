/**
 * Script to regenerate class data
 * Clears existing classes and generates new dummy data
 */

require('dotenv').config();
const { addDummyDataToClassDB, getAllClasses } = require('../database/classOperations');
const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../database/dynamoClient');

const TABLE_NAME = 'classDB';

async function clearAllClasses() {
  try {
    console.log('Fetching all existing classes...');
    const classes = await getAllClasses();
    
    console.log(`Found ${classes.length} classes. Deleting...`);
    
    for (const classItem of classes) {
      const params = {
        TableName: TABLE_NAME,
        Key: {
          classId: classItem.classId
        }
      };
      
      await docClient.send(new DeleteCommand(params));
      console.log(`Deleted: ${classItem.classId} - ${classItem.className}`);
    }
    
    console.log('All classes deleted successfully!');
  } catch (error) {
    console.error('Error clearing classes:', error);
    throw error;
  }
}

async function regenerateClasses() {
  try {
    console.log('=== Starting Class Data Regeneration ===\n');
    
    // Step 1: Clear existing classes
    await clearAllClasses();
    
    console.log('\n=== Generating New Classes ===\n');
    
    // Step 2: Generate new dummy data
    await addDummyDataToClassDB();
    
    console.log('\n=== Regeneration Complete! ===');
    console.log('New classes have been added to the database.');
    
    // Display the new classes
    console.log('\n=== New Class List ===\n');
    const newClasses = await getAllClasses();
    newClasses.forEach(c => {
      console.log(`${c.classId} - ${c.className} (${c.credits} credits)`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error regenerating classes:', error);
    process.exit(1);
  }
}

// Run the regeneration
regenerateClasses();
