const express = require('express');
const router = express.Router();

// Import controllers
const { registerStudentUser, loginStudentUser, logoutStudentUser } = require('../Controller/authController');

// Authentication routes
router.post('/register', registerStudentUser);
router.post('/login', loginStudentUser);
router.post('/logout', logoutStudentUser);

module.exports = router;