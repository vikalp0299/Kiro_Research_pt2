// Main database module - exports all database functions
const { createDatabase } = require('./createDatabase');
const { 
  userExistsInDB, 
  dispEnrolledClass, 
  getAllClasses, 
  dispAvailableClass, 
  dispDroppedClass 
} = require('./dataExtraction');
const { 
  pushUserData, 
  addDummyDataToClassDB, 
  pushRegistry, 
  updateRegistry 
} = require('./dataInsertion');

module.exports = {
  // Database initialization
  createDatabase,
  
  // Data extraction functions
  userExistsInDB,
  dispEnrolledClass,
  getAllClasses,
  dispAvailableClass,
  dispDroppedClass,
  
  // Data insertion and update functions
  pushUserData,
  addDummyDataToClassDB,
  pushRegistry,
  updateRegistry
};