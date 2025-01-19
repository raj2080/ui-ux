const express = require('express');
const router = express.Router();
const { userSignup } = require('../controller/userSignup');
const { userLogin } = require('../controller/userLogin');
const authMiddleware = require('../middleware/auth');
const { getUserProfile, updateUserProfile, changePassword } = require('../controller/userProfile');
const { forgotPassword, resetPassword } = require('../controller/forgotPassword');

// Public routes
router.post('/signup', userSignup);
router.post('/login', userLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Profile routes
router.get('/profile/:id', getUserProfile);
router.put('/profile/update', authMiddleware, updateUserProfile); // Add this new route
router.put('/change-password', authMiddleware, changePassword);

module.exports = router;