const express = require('express');
const router = express.Router();
const { 
  displayAllAvailableClasses, 
  getEnrolledClasses, 
  getDroppedClasses, 
  registerClass, 
  deregisterClass 
} = require('../Controller/classController');
const { verifyToken } = require('../Middleware/auth');

// Apply authentication middleware to all routes in this router
router.use(verifyToken);

/**
 * GET /api/classFunc/available
 * Get all available classes for the authenticated user
 * Requires authentication
 */
router.get('/available', displayAllAvailableClasses);

/**
 * GET /api/classFunc/enrolled
 * Get all enrolled classes for the authenticated user
 * Requires authentication
 */
router.get('/enrolled', getEnrolledClasses);

/**
 * GET /api/classFunc/dropped
 * Get all dropped classes for the authenticated user
 * Requires authentication
 */
router.get('/dropped', getDroppedClasses);

/**
 * POST /api/classFunc/enroll
 * Enroll the authenticated user in a class
 * Requires authentication
 * Body: { classId: string }
 */
router.post('/enroll', registerClass);

/**
 * POST /api/classFunc/unenroll
 * Unenroll the authenticated user from a class
 * Requires authentication
 * Body: { classId: string }
 */
router.post('/unenroll', deregisterClass);

module.exports = router;
