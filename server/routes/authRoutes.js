const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected Routes
const { protect } = require('../middleware/authMiddleware');
router.get('/me', protect, authController.getMe);

module.exports = router;
