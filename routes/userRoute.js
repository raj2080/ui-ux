const express = require('express');
const router = express.Router();
const { userSignup } = require('../controller/userSignup');
const { userLogin } = require('../controller/userLogin');
const authMiddleware = require('../middleware/auth');
const { getUserProfile } = require('../controller/userProfile');

const { forgotPassword, resetPassword } = require('../controller/forgotPassword');


// Public routes
router.post('/signup', userSignup);
router.post('/login', userLogin);

// Add these new routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);


// Route to get user profile by ID
router.get('/profile/:id', getUserProfile);



// // Protected route example
// router.get('/profile', authMiddleware, (req, res) => {
//     res.json({
//         success: true,
//         message: 'Profile accessed successfully',
//         user: req.user
//     });
// });

module.exports = router;