// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

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