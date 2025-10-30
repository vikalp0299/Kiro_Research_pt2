const { ScanCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { docClient } = require('./config');

/**
 * Check if user exists in database by username or email
 * @param {string} username - Username to check
 * @param {string} email - Email to check
 * @returns {Object} - User data if exists, null if not found
 */
async function userExistsInDB(username, email) {
  try {
    const scanCommand = new ScanCommand({
      TableName: 'studentUserDB',
      FilterExpression: '#username = :username OR #email = :email',
      ExpressionAttributeNames: {
        '#username': 'username',
        '#email': 'email'
      },
      ExpressionAttributeValues: {
        ':username': { S: username },
        ':email': { S: email }
      }
    });

    const result = await docClient.send(scanCommand);
    
    if (result.Items && result.Items.length > 0) {
      // Convert DynamoDB format to regular object
      const user = result.Items[0];
      return {
        userID: parseInt(user.userID.N),
        username: user.username.S,
        fullName: user.fullName.S,
        email: user.email.S,
        password: user.password.S
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking user existence:', error);
    throw error;
  }
}

/**
 * Get all enrolled classes for a specific user
 * @param {number} userId - User ID
 * @returns {Array} - Array of enrolled class objects
 */
async function dispEnrolledClass(userId) {
  try {
    const scanCommand = new ScanCommand({
      TableName: 'classRegistrationDB',
      FilterExpression: '#userID = :userId AND #status = :status',
      ExpressionAttributeNames: {
        '#userID': 'userID',
        '#status': 'registrationStatus'
      },
      ExpressionAttributeValues: {
        ':userId': { N: userId.toString() },
        ':status': { S: 'enrolled' }
      }
    });

    const result = await docClient.send(scanCommand);
    
    if (result.Items && result.Items.length > 0) {
      return result.Items.map(item => ({
        classId: item.classId.S,
        className: item.className.S,
        userID: parseInt(item.userID.N),
        registrationStatus: item.registrationStatus.S
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error getting enrolled classes:', error);
    throw error;
  }
}

/**
 * Get all available classes from the database
 * @returns {Array} - Array of all class objects
 */
async function getAllClasses() {
  try {
    const scanCommand = new ScanCommand({
      TableName: 'classDB'
    });

    const result = await docClient.send(scanCommand);
    
    if (result.Items && result.Items.length > 0) {
      return result.Items.map(item => ({
        classId: item.classId.S,
        className: item.className.S,
        credits: parseInt(item.credits.N),
        description: item.description.S
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error getting all classes:', error);
    throw error;
  }
}

/**
 * Get available classes for a specific user (not enrolled)
 * @param {number} userId - User ID
 * @returns {Array} - Array of available class objects
 */
async function dispAvailableClass(userId) {
  try {
    // Get all classes
    const allClasses = await getAllClasses();
    
    // Get user's enrolled classes
    const enrolledClasses = await dispEnrolledClass(userId);
    const enrolledClassIds = enrolledClasses.map(cls => cls.classId);
    
    // Filter out enrolled classes
    const availableClasses = allClasses.filter(cls => 
      !enrolledClassIds.includes(cls.classId)
    );
    
    return availableClasses;
  } catch (error) {
    console.error('Error getting available classes:', error);
    throw error;
  }
}

/**
 * Get all dropped classes for a specific user
 * @param {number} userId - User ID
 * @returns {Array} - Array of dropped class objects
 */
async function dispDroppedClass(userId) {
  try {
    const scanCommand = new ScanCommand({
      TableName: 'classRegistrationDB',
      FilterExpression: '#userID = :userId AND #status = :status',
      ExpressionAttributeNames: {
        '#userID': 'userID',
        '#status': 'registrationStatus'
      },
      ExpressionAttributeValues: {
        ':userId': { N: userId.toString() },
        ':status': { S: 'dropped' }
      }
    });

    const result = await docClient.send(scanCommand);
    
    if (result.Items && result.Items.length > 0) {
      return result.Items.map(item => ({
        classId: item.classId.S,
        className: item.className.S,
        userID: parseInt(item.userID.N),
        registrationStatus: item.registrationStatus.S
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error getting dropped classes:', error);
    throw error;
  }
}

module.exports = {
  userExistsInDB,
  dispEnrolledClass,
  getAllClasses,
  dispAvailableClass,
  dispDroppedClass
};