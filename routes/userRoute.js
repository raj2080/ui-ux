// backend/routes/userRoute.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Constants
const CURRENT_DATETIME = '2025-01-20 21:17:48';
const CURRENT_USER = '2025raj';

// Import controllers
const { userSignup } = require('../controller/userSignup');
const { userLogin } = require('../controller/userLogin');
const authMiddleware = require('../middleware/auth'); // Changed back to auth
const userProfileController = require('../controller/userProfile');
const { forgotPassword, resetPassword } = require('../controller/forgotPassword');
const confessionController = require('../controller/confessionController');

// Create uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads', 'confessions');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `confession-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Multer error handler
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: err.code === 'LIMIT_FILE_SIZE' 
                ? 'File is too large. Maximum size is 5MB' 
                : err.message,
            timestamp: CURRENT_DATETIME
        });
    }
    next(err);
};

// Route handlers
const routeHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        next(error);
    }
};

// Auth Routes
router.post('/signup', routeHandler(userSignup));
router.post('/login', routeHandler(userLogin));
router.post('/forgot-password', routeHandler(forgotPassword));
router.post('/reset-password/:token', routeHandler(resetPassword));

// Profile Routes
router.get(
    '/profile/:id', 
    authMiddleware, 
    routeHandler(userProfileController.getUserProfile)
);

router.put(
    '/profile/update', 
    authMiddleware, 
    routeHandler(userProfileController.updateUserProfile)
);

router.put(
    '/change-password', 
    authMiddleware, 
    routeHandler(userProfileController.changePassword)
);

// Confession Routes
router.post(
    '/confessions/create',
    authMiddleware,
    upload.single('image'),
    handleMulterError,
    routeHandler(confessionController.createConfession)
);

router.get(
    '/confessions/all',
    routeHandler(confessionController.getAllConfessions)
);

router.get(
    '/confessions/my',
    authMiddleware,
    routeHandler(confessionController.getMyConfessions)
);

router.put(
    '/confessions/:id',
    authMiddleware,
    upload.single('image'),
    handleMulterError,
    routeHandler(confessionController.updateConfession)
);

router.delete(
    '/confessions/:id',
    authMiddleware,
    routeHandler(confessionController.deleteConfession)
);

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('Route Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        timestamp: CURRENT_DATETIME,
        path: req.path,
        method: req.method,
        user: req.user?.id || 'anonymous'
    });

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong',
        timestamp: CURRENT_DATETIME,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = router;