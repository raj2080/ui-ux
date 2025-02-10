const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Helper function for getting current datetime in UTC
const getCurrentDateTime = () => {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
};

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        const { userId, cookie } = req.session;

        if (!token && !userId) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token or session provided',
                timestamp: getCurrentDateTime()
            });
        }

        // Check for inactivity timeout
        if (req.session.cookie.maxAge < 0) {
            req.session.destroy();
            return res.status(401).json({
                success: false,
                message: 'Session expired due to inactivity',
                timestamp: getCurrentDateTime()
            });
        }

        let user;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token structure',
                    timestamp: getCurrentDateTime()
                });
            }
            user = await User.findById(decoded.id);
        } else {
            user = await User.findById(userId);
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
                timestamp: getCurrentDateTime()
            });
        }

        // Check if password has expired
        const passwordAge = Date.now() - new Date(user.passwordCreatedAt).getTime();
        const passwordExpiryTime =  90 * 24 * 60 * 60 * 1000; // 90 days
        if (passwordAge > passwordExpiryTime) {
            return res.status(400).json({
                success: false,
                message: 'Password has expired. Please change your password.',
                timestamp: getCurrentDateTime()
            });
        }

        req.user = {
            _id: user._id,
            id: user._id,
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