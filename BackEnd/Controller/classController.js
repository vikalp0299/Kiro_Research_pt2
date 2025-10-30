const { dispAvailableClass, dispEnrolledClass, dispDroppedClass, getAllClasses } = require('../../Database/dataExtraction');
const { pushRegistry, updateRegistry } = require('../../Database/dataInsertion');

/**
 * Get all available classes for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const displayAllAvailableClasses = async (req, res) => {
  try {
    const userID = req.user.userID;

    // Get available classes for the user
    const availableClasses = await dispAvailableClass(userID);

    res.status(200).json({
      success: true,
      data: availableClasses
    });

  } catch (error) {
    console.error('Error getting available classes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching available classes',
      code: 'FETCH_AVAILABLE_ERROR'
    });
  }
};

/**
 * Get enrolled classes for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEnrolledClasses = async (req, res) => {
  try {
    const userID = req.user.userID;

    // Get enrolled classes for the user
    const enrolledClasses = await dispEnrolledClass(userID);

    res.status(200).json({
      success: true,
      data: enrolledClasses
    });

  } catch (error) {
    console.error('Error getting enrolled classes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching enrolled classes',
      code: 'FETCH_ENROLLED_ERROR'
    });
  }
};

/**
 * Get dropped classes for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDroppedClasses = async (req, res) => {
  try {
    const userID = req.user.userID;

    // Get dropped classes for the user
    const droppedClasses = await dispDroppedClass(userID);

    res.status(200).json({
      success: true,
      data: droppedClasses
    });

  } catch (error) {
    console.error('Error getting dropped classes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching dropped classes',
      code: 'FETCH_DROPPED_ERROR'
    });
  }
};

/**
 * Register user for a class
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerClass = async (req, res) => {
  try {
    const userID = req.user.userID;
    const { classId } = req.body;

    // Validate required fields
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required',
        code: 'MISSING_CLASS_ID'
      });
    }

    // Check if class exists in classDB
    const allClasses = await getAllClasses();
    const classToRegister = allClasses.find(cls => cls.classId === classId);
    
    if (!classToRegister) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
        code: 'CLASS_NOT_FOUND'
      });
    }

    // Check if user is already enrolled
    const enrolledClasses = await dispEnrolledClass(userID);
    const isAlreadyEnrolled = enrolledClasses.some(cls => cls.classId === classId);
    
    if (isAlreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this class',
        code: 'ALREADY_ENROLLED'
      });
    }

    // Check if user previously dropped this class
    const droppedClasses = await dispDroppedClass(userID);
    const previouslyDropped = droppedClasses.find(cls => cls.classId === classId);

    let registrationResult;

    if (previouslyDropped) {
      // Update existing record to "enrolled"
      registrationResult = await updateRegistry(classId, userID, 'enrolled');
    } else {
      // Create new enrollment record
      registrationResult = await pushRegistry({
        classId,
        userID,
        className: classToRegister.className
      });
    }

    res.status(200).json({
      success: true,
      data: registrationResult,
      message: 'Successfully registered for class'
    });

  } catch (error) {
    console.error('Error registering for class:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during class registration',
      code: 'REGISTRATION_ERROR'
    });
  }
};

/**
 * Deregister user from a class (drop class)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deregisterClass = async (req, res) => {
  try {
    const userID = req.user.userID;
    const { classId } = req.body;

    // Validate required fields
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required',
        code: 'MISSING_CLASS_ID'
      });
    }

    // Check if user is enrolled in this class
    const enrolledClasses = await dispEnrolledClass(userID);
    const isEnrolled = enrolledClasses.some(cls => cls.classId === classId);
    
    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Not enrolled in this class',
        code: 'NOT_ENROLLED'
      });
    }

    // Update registration status to "dropped"
    const deregistrationResult = await updateRegistry(classId, userID, 'dropped');

    res.status(200).json({
      success: true,
      data: deregistrationResult,
      message: 'Successfully dropped class'
    });

  } catch (error) {
    console.error('Error dropping class:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during class deregistration',
      code: 'DEREGISTRATION_ERROR'
    });
  }
};

module.exports = {
  displayAllAvailableClasses,
  getEnrolledClasses,
  getDroppedClasses,
  registerClass,
  deregisterClass
};