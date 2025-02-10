const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const helmet = require('helmet');
const connectDB = require('./database/database');
const userRoutes = require('./routes/userRoute');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Directory setup (ensure your directories are not exposed to the public)
const setupDirectories = () => {
    const directories = [
        path.join(__dirname, 'uploads'),
        path.join(__dirname, 'uploads', 'confessions')
    ];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
};

// CORS Configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // CORS preflight cache for 24 hours
};

// Middleware Setup
const setupMiddleware = (app) => {
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(cors(corsOptions));

    // Use Helmet to set various HTTP headers for security
    app.use(helmet());

    // Session configuration - Set maxAge for inactivity timeout (5 minutes)
    const sessionMaxAge = 1000 * 60 * 5; // 5 minutes

    app.use(session({
        secret: process.env.SESSION_SECRET || 'your_secret_key',
        resave: false,
        saveUninitialized: true,
        rolling: true, // Reset the expiration time on each request
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: sessionMaxAge
        }
    }));

    // Security Headers
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', corsOptions.origin);
        res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
        res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('X-Frame-Options', 'DENY');
        res.header('X-XSS-Protection', '1; mode=block');
        next();
    });

    // Serve static files from the 'public' directory
    // app.use(express.static(path.join(__dirname, 'public')));

    // Add this line to serve files from the uploads directory
    app.use('/uploads', express.static('uploads'));
};

// Route Setup
const setupRoutes = (app) => {
    // API Routes
    app.use('/api/users', userRoutes);

    // Health Check
    app.get('/health', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Server is healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    });

    // 404 Handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: `Route ${req.originalUrl} not found`
        });
    });
};

// Error Handler Setup
const setupErrorHandlers = (app) => {
    // Custom error handler
    app.use((err, req, res, next) => {
        console.error(`[${new Date().toISOString()}] Error:`, {
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
            path: req.path,
            method: req.method
        });

        // Specific error handling
        const errorHandlers = {
            MulterError: () => ({
                status: 400,
                message: `File upload error: ${err.message}`
            }),
            ValidationError: () => ({
                status: 400,
                message: Object.values(err.errors).map(e => e.message).join(', ')
            }),
            JsonWebTokenError: () => ({
                status: 401,
                message: 'Invalid or expired token'
            }),
            TokenExpiredError: () => ({
                status: 401,
                message: 'Token has expired'
            })
        };

        const errorResponse = errorHandlers[err.name]?.() || {
            status: err.status || 500,
            message: err.message || 'Internal server error'
        };

        res.status(errorResponse.status).json({
            success: false,
            message: errorResponse.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    });

    // Global error handler
    app.use(errorHandler);
};

// Process Event Handlers
const setupProcessHandlers = () => {
    process.on('unhandledRejection', (err) => {
        console.error('⚠️ Unhandled Promise Rejection:', err);
        console.error(err.stack);
        process.exit(1);
    });

    process.on('uncaughtException', (err) => {
        console.error('⚠️ Uncaught Exception:', err);
        console.error(err.stack);
        process.exit(1);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
        console.log('🔄 Received shutdown signal. Closing server...');
        server.close(() => {
            console.log('👋 Server closed. Exiting process...');
            process.exit(0);
        });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
};

// Initialize Application
const initializeApp = async () => {
    try {
        // Setup directories
        setupDirectories();

        // Setup middleware
        setupMiddleware(app);

        // Setup routes
        setupRoutes(app);

        // Setup error handlers
        setupErrorHandlers(app);

        // Setup process handlers
        setupProcessHandlers();

        // Connect to database
        await connectDB();

        // Start server
        const PORT = process.env.PORT || 5000;
        const server = app.listen(PORT, () => {
            console.log(`
🚀 Server Status:
    Port: ${PORT}
    Environment: ${process.env.NODE_ENV}
    Frontend URL: ${corsOptions.origin}
    Upload Directory: ${path.join(__dirname, 'uploads')}
    Started at: ${new Date().toISOString()}
    Current User: ${process.env.CURRENT_USER || 'raj2080'}
            `);
        });

        // Handle server errors
        server.on('error', (error) => {
            console.error('Server Error:', error);
            process.exit(1);
        });

    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
};

// Start the application
initializeApp();