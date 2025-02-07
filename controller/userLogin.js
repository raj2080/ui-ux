const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const formatDate = (date) => {
    return date.toISOString().split('.')[0].replace('T', ' ');
};

const userLogin = async (req, res) => {
    const currentDate = new Date();
    const formattedCurrentDate = formatDate(currentDate);
    
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password',
                timestamp: formattedCurrentDate
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        
        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                timestamp: formattedCurrentDate
            });
        }

        // Check if account is locked
        if (user.isAccountLocked()) {
            const remainingTime = Math.ceil((user.lockUntil - currentDate) / 1000 / 60);
            return res.status(423).json({
                success: false,
                message: `Account is locked. Please try again in ${remainingTime} minutes`,
                lockUntil: formatDate(user.lockUntil),
                timestamp: formattedCurrentDate
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Handle failed login attempt
            await user.handleFailedLogin();
            
            // Check if account just got locked
            if (user.accountLocked) {
                return res.status(423).json({
                    success: false,
                    message: 'Account has been locked due to too many failed attempts. Please try again in 15 minutes',
                    lockUntil: formatDate(user.lockUntil),
                    timestamp: formattedCurrentDate
                });
            }

            // Return remaining attempts message
            const remainingAttempts = 5 - user.loginAttempts;
            return res.status(401).json({
                success: false,
                message: `Invalid credentials. ${remainingAttempts} attempts remaining before account lockout`,
                remainingAttempts,
                timestamp: formattedCurrentDate
            });
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        // Check if password has expired
        const passwordAge = currentDate.getTime() - user.passwordCreatedAt.getTime();
        const passwordExpiryTime = 90 * 24 * 60 * 60 * 1000; // 90 days
        if (passwordAge > passwordExpiryTime) {
            return res.status(400).json({
                success: false,
                message: 'Password has expired. Please change your password.',
                timestamp: formattedCurrentDate
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

        // Log successful login
        console.log('Successful login:', {
            userId: user._id,
            nickname: user.nickname,
            timestamp: formattedCurrentDate,
            currentUser: process.env.CURRENT_USER || 'system'
        });

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
            },
            timestamp: formattedCurrentDate
        });

    } catch (error) {
        console.error('Login error:', {
            error: error.message,
            timestamp: formattedCurrentDate,
            currentUser: process.env.CURRENT_USER || 'system'
        });
        
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: formattedCurrentDate
        });
    }
};

module.exports = { userLogin };