const { dispAvailableClass, dispEnrolledClass, dispDroppedClass, getRegistration, pushRegistry, updateRegistry } = require('../database/registrationOperations');
const { getClassById } = require('../database/classOperations');
const { ValidationError, UnauthorizedError, NotFoundError, ConflictError } = require('../Middleware/errors');

/**
 * Display all available classes for a user
 * Returns classes that the user is not currently enrolled in
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function displayAllAvailableClasses(req, res) {
  try {
    // Extract userId from JWT payload (attached by auth middleware)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Get available classes for the user
    const availableClasses = await dispAvailableClass(userId);

    // Return class data with classId, className, credits, description
    return res.status(200).json({
      classes: availableClasses.map(c => ({
        classId: c.classId,
        className: c.className,
        credits: c.credits,
        description: c.description
      }))
    });

  } catch (error) {
    console.error('Error fetching available classes:', error);
    return res.status(500).json({ 
      error: 'Internal server error while fetching available classes' 
    });
  }
}

/**
 * Get enrolled classes for a user
 * Returns classes that the user is currently enrolled in
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getEnrolledClasses(req, res) {
  try {
    // Extract userId from JWT payload (attached by auth middleware)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Get enrolled classes for the user
    const enrolledRegistrations = await dispEnrolledClass(userId);

    // Fetch full class details for each enrolled class
    const enrolledClasses = await Promise.all(
      enrolledRegistrations.map(async (registration) => {
        const classDetails = await getClassById(registration.classId);
        return classDetails ? {
          classId: classDetails.classId,
          className: classDetails.className,
          credits: classDetails.credits,
          description: classDetails.description
        } : null;
      })
    );

    // Filter out any null values (in case a class was deleted)
    const validClasses = enrolledClasses.filter(c => c !== null);

    return res.status(200).json({
      classes: validClasses
    });

  } catch (error) {
    console.error('Error fetching enrolled classes:', error);
    return res.status(500).json({ 
      error: 'Internal server error while fetching enrolled classes' 
    });
  }
}

/**
 * Get dropped classes for a user
 * Returns classes that the user has previously dropped
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDroppedClasses(req, res) {
  try {
    // Extract userId from JWT payload (attached by auth middleware)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Get dropped classes for the user
    const droppedRegistrations = await dispDroppedClass(userId);

    // Fetch full class details for each dropped class
    const droppedClasses = await Promise.all(
      droppedRegistrations.map(async (registration) => {
        const classDetails = await getClassById(registration.classId);
        return classDetails ? {
          classId: classDetails.classId,
          className: classDetails.className,
          credits: classDetails.credits,
          description: classDetails.description
        } : null;
      })
    );

    // Filter out any null values (in case a class was deleted)
    const validClasses = droppedClasses.filter(c => c !== null);

    return res.status(200).json({
      classes: validClasses
    });

  } catch (error) {
    console.error('Error fetching dropped classes:', error);
    return res.status(500).json({ 
      error: 'Internal server error while fetching dropped classes' 
    });
  }
}

/**
 * Register a student in a class (enrollment)
 * Handles new enrollment and re-enrollment of previously dropped classes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function registerClass(req, res) {
  try {
    // Extract userId from JWT payload (attached by auth middleware)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Get classId from request body
    const { classId } = req.body;

    // Validate classId
    if (!classId || typeof classId !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid classId: must be a non-empty string' 
      });
    }

    // Check if class exists
    const classDetails = await getClassById(classId);
    if (!classDetails) {
      return res.status(404).json({ 
        error: 'Class not found' 
      });
    }

    // Check if registration record exists
    const existingRegistration = await getRegistration(classId, userId);

    if (existingRegistration) {
      // Check if already enrolled
      if (existingRegistration.registrationState === 'enrolled') {
        return res.status(409).json({ 
          error: 'Already enrolled in this class' 
        });
      }

      // If previously dropped, update status to "enrolled"
      if (existingRegistration.registrationState === 'dropped') {
        await updateRegistry(classId, userId, 'enrolled');
        return res.status(200).json({ 
          message: 'Successfully re-enrolled in class',
          classId: classId,
          className: classDetails.className
        });
      }
    }

    // Create new registration record
    await pushRegistry({
      classId: classId,
      userId: userId,
      className: classDetails.className,
      registrationState: 'enrolled'
    });

    return res.status(201).json({ 
      message: 'Successfully enrolled in class',
      classId: classId,
      className: classDetails.className
    });

  } catch (error) {
    console.error('Error enrolling in class:', error);
    return res.status(500).json({ 
      error: 'Internal server error while enrolling in class' 
    });
  }
}

/**
 * Deregister a student from a class (unenrollment)
 * Updates registration status from "enrolled" to "dropped"
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deregisterClass(req, res) {
  try {
    // Extract userId from JWT payload (attached by auth middleware)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Get classId from request body
    const { classId } = req.body;

    // Validate classId
    if (!classId || typeof classId !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid classId: must be a non-empty string' 
      });
    }

    // Check if class exists
    const classDetails = await getClassById(classId);
    if (!classDetails) {
      return res.status(404).json({ 
        error: 'Class not found' 
      });
    }

    // Check if registration record exists
    const existingRegistration = await getRegistration(classId, userId);

    if (!existingRegistration) {
      return res.status(404).json({ 
        error: 'Not enrolled in this class' 
      });
    }

    // Check if currently enrolled
    if (existingRegistration.registrationState !== 'enrolled') {
      return res.status(400).json({ 
        error: 'Cannot unenroll from a class that is not currently enrolled' 
      });
    }

    // Update registration status to "dropped"
    await updateRegistry(classId, userId, 'dropped');

    return res.status(200).json({ 
      message: 'Successfully unenrolled from class',
      classId: classId,
      className: classDetails.className
    });

  } catch (error) {
    console.error('Error unenrolling from class:', error);
    return res.status(500).json({ 
      error: 'Internal server error while unenrolling from class' 
    });
  }
}

module.exports = {
  displayAllAvailableClasses,
  getEnrolledClasses,
  getDroppedClasses,
  registerClass,
  deregisterClass
};
