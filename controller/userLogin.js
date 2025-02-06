const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        
        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if password has expired
        const passwordAge = Date.now() - new Date(user.passwordCreatedAt).getTime();
        const passwordExpiryTime = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
        if (passwordAge > passwordExpiryTime) {
            return res.status(400).json({
                success: false,
                message: 'Password has expired. Please change your password.'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user._id,
                nickname: user.nickname 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    nickname: user.nickname,
                    email: user.email
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
};

module.exports = { userLogin };