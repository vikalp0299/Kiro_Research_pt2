const express = require('express');
const router = express.Router();

// Import middleware and controllers
const { authenticateToken } = require('../Middleware/auth');
const { displayAllAvailableClasses, getEnrolledClasses, getDroppedClasses, registerClass, deregisterClass } = require('../Controller/classController');

// Class management routes
router.get('/available', authenticateToken, displayAllAvailableClasses);
router.get('/enrolled', authenticateToken, getEnrolledClasses);
router.get('/dropped', authenticateToken, getDroppedClasses);
router.post('/register', authenticateToken, registerClass);
router.post('/deregister', authenticateToken, deregisterClass);

module.exports = router;