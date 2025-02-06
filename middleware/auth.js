const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Helper function for getting current datetime in UTC
const getCurrentDateTime = () => {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
};

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided',
                timestamp: getCurrentDateTime()
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.id) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token structure',
                timestamp: getCurrentDateTime()
            });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
                timestamp: getCurrentDateTime()
            });
        }

        // Check if password has expired
        const passwordAge = Date.now() - new Date(user.passwordCreatedAt).getTime();
        const passwordExpiryTime = 2 * 60 * 1000; // 2 minutes in milliseconds
        if (passwordAge > passwordExpiryTime) {
            return res.status(400).json({
                success: false,
                message: 'Password has expired. Please change your password.',
                timestamp: getCurrentDateTime()
            });
        }

        req.user = {
            _id: decoded.id,
            id: decoded.id,
            timestamp: getCurrentDateTime()
        };

        next();
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed',
            error: error.message,
            timestamp: getCurrentDateTime()
        });
    }
};

module.exports = authMiddleware;