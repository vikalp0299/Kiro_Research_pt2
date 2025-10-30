const { PutItemCommand, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { docClient } = require('./config');
const bcrypt = require('bcrypt');

/**
 * Generate a unique 10-digit user ID
 * @returns {number} - Unique 10-digit user ID
 */
function generateUniqueUserID() {
  // Generate random 10-digit number (1000000000 to 9999999999)
  return Math.floor(Math.random() * 9000000000) + 1000000000;
}

/**
 * Insert new user data with encrypted password
 * @param {Object} userData - User data object
 * @param {string} userData.username - Username
 * @param {string} userData.fullName - Full name
 * @param {string} userData.email - Email address
 * @param {string} userData.password - Plain text password
 * @returns {Object} - Created user data with userID
 */
async function pushUserData(userData) {
  try {
    const { username, fullName, email, password } = userData;
    
    // Generate unique user ID
    const userID = generateUniqueUserID();
    
    // Encrypt password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const putCommand = new PutItemCommand({
      TableName: 'studentUserDB',
      Item: {
        userID: { N: userID.toString() },
        username: { S: username },
        fullName: { S: fullName },
        email: { S: email },
        password: { S: hashedPassword }
      }
    });

    await docClient.send(putCommand);
    
    console.log(`User created successfully with ID: ${userID}`);
    
    return {
      userID,
      username,
      fullName,
      email
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Add dummy/sample data to classDB table
 * Populates with 5-10 sample courses
 */
async function addDummyDataToClassDB() {
  try {
    console.log('Adding sample course data to classDB...');
    
    const sampleClasses = [
      {
        classId: 'IFT 593',
        className: 'Advanced Database Systems',
        credits: 3,
        description: 'Advanced concepts in database design, implementation, and optimization'
      },
      {
        classId: 'CSE 201',
        className: 'Data Structures and Algorithms',
        credits: 4,
        description: 'Fundamental data structures and algorithmic problem solving'
      },
      {
        classId: 'CCE 301',
        className: 'Computer Networks',
        credits: 3,
        description: 'Network protocols, architecture, and distributed systems'
      },
      {
        classId: 'EEE 425',
        className: 'Digital Signal Processing',
        credits: 4,
        description: 'Digital signal analysis and processing techniques'
      },
      {
        classId: 'IFT 402',
        className: 'Software Engineering',
        credits: 3,
        description: 'Software development methodologies and project management'
      },
      {
        classId: 'CSE 310',
        className: 'Operating Systems',
        credits: 4,
        description: 'Operating system concepts, processes, and memory management'
      },
      {
        classId: 'CCE 205',
        className: 'Computer Architecture',
        credits: 3,
        description: 'Computer hardware design and assembly language programming'
      },
      {
        classId: 'EEE 350',
        className: 'Microprocessors',
        credits: 4,
        description: 'Microprocessor architecture and embedded systems programming'
      }
    ];

    for (const classData of sampleClasses) {
      // Check if class already exists
      const getCommand = new GetItemCommand({
        TableName: 'classDB',
        Key: {
          classId: { S: classData.classId }
        }
      });

      try {
        const existingClass = await docClient.send(getCommand);
        if (existingClass.Item) {
          console.log(`Class ${classData.classId} already exists, skipping...`);
          continue;
        }
      } catch (error) {
        // Class doesn't exist, continue with insertion
      }

      const putCommand = new PutItemCommand({
        TableName: 'classDB',
        Item: {
          classId: { S: classData.classId },
          className: { S: classData.className },
          credits: { N: classData.credits.toString() },
          description: { S: classData.description }
        }
      });

      await docClient.send(putCommand);
      console.log(`Added class: ${classData.classId} - ${classData.className}`);
    }
    
    console.log('Sample course data added successfully');
    return { success: true, message: 'Sample data populated' };
  } catch (error) {
    console.error('Error adding sample data:', error);
    throw error;
  }
}

/**
 * Create a new class registration record
 * @param {Object} registrationData - Registration data
 * @param {string} registrationData.classId - Class ID
 * @param {number} registrationData.userID - User ID
 * @param {string} registrationData.className - Class name
 * @returns {Object} - Registration record
 */
async function pushRegistry(registrationData) {
  try {
    const { classId, userID, className } = registrationData;
    
    const putCommand = new PutItemCommand({
      TableName: 'classRegistrationDB',
      Item: {
        classId: { S: classId },
        userID: { N: userID.toString() },
        className: { S: className },
        registrationStatus: { S: 'enrolled' }
      }
    });

    await docClient.send(putCommand);
    
    console.log(`Registration created: User ${userID} enrolled in ${classId}`);
    
    return {
      classId,
      userID,
      className,
      registrationStatus: 'enrolled'
    };
  } catch (error) {
    console.error('Error creating registration:', error);
    throw error;
  }
}

/**
 * Update existing registration status
 * @param {string} classId - Class ID
 * @param {number} userID - User ID
 * @param {string} newStatus - New status ('enrolled' or 'dropped')
 * @returns {Object} - Updated registration record
 */
async function updateRegistry(classId, userID, newStatus) {
  try {
    const updateCommand = new UpdateItemCommand({
      TableName: 'classRegistrationDB',
      Key: {
        classId: { S: classId },
        userID: { N: userID.toString() }
      },
      UpdateExpression: 'SET registrationStatus = :status',
      ExpressionAttributeValues: {
        ':status': { S: newStatus }
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);
    
    console.log(`Registration updated: User ${userID} ${newStatus} in ${classId}`);
    
    return {
      classId: result.Attributes.classId.S,
      userID: parseInt(result.Attributes.userID.N),
      className: result.Attributes.className.S,
      registrationStatus: result.Attributes.registrationStatus.S
    };
  } catch (error) {
    console.error('Error updating registration:', error);
    throw error;
  }
}

module.exports = {
  pushUserData,
  addDummyDataToClassDB,
  pushRegistry,
  updateRegistry
};