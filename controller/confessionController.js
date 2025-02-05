


// backend/controller/confessionController.js
const Confession = require('../models/confessionModel');
const User = require('../models/userModel');

// Helper function for consistent datetime format
const getCurrentDateTime = () => {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
};

// Helper function to get user's nickname
const getCurrentUser = async (userId) => {
    try {
        const user = await User.findById(userId);
        return user ? user.nickname : 'anonymous';
    } catch (error) {
        console.error('Error getting user nickname:', error);
        return 'anonymous';
    }
};

// Helper function for error responses
const sendErrorResponse = (res, statusCode, message, error) => {
    console.error(`${message}:`, error);
    return res.status(statusCode).json({
        success: false,
        message,
        error: error.message,
        timestamp: getCurrentDateTime()
    });
};

// Create a new confession
const createConfession = async (req, res) => {
    try {
        const { title, content, category, isAnonymous } = req.body;
        const imageUrl = req.file ? req.file.path : null;
        const currentDateTime = getCurrentDateTime();
        const userNickname = await getCurrentUser(req.user._id);

        // Validate required fields
        if (!title || !content || !category) {
            return sendErrorResponse(res, 400, 'Please provide all required fields', {
                message: 'Missing required fields',
                provided: { title: !!title, content: !!content, category: !!category }
            });
        }

        // Validate user authentication
        if (!req.user || !req.user._id) {
            return sendErrorResponse(res, 401, 'User authentication required', {
                message: 'No user found in request'
            });
        }

        const confession = new Confession({
            title: title.trim(),
            content: content.trim(),
            category,
            imageUrl,
            isAnonymous: isAnonymous || false,
            author: userNickname,
            createdAt: currentDateTime,
            updatedAt: currentDateTime
        });

        await confession.save();

        res.status(201).json({
            success: true,
            message: 'Confession created successfully',
            confession: {
                ...confession.toObject(),
                authorNickname: userNickname
            },
            timestamp: currentDateTime
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Error creating confession', error);
    }
};

// Get all confessions with pagination
const getAllConfessions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalConfessions = await Confession.countDocuments();
        const confessions = await Confession.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: confessions.length,
            total: totalConfessions,
            currentPage: page,
            totalPages: Math.ceil(totalConfessions / limit),
            confessions: confessions.map(conf => ({
                ...conf.toObject(),
                authorNickname: conf.author
            })),
            timestamp: getCurrentDateTime()
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Error fetching confessions', error);
    }
};

// Get user's own confessions with pagination
const getMyConfessions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const userNickname = await getCurrentUser(req.user._id);

        const totalConfessions = await Confession.countDocuments({ author: userNickname });
        const confessions = await Confession.find({ author: userNickname })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: confessions.length,
            total: totalConfessions,
            currentPage: page,
            totalPages: Math.ceil(totalConfessions / limit),
            confessions: confessions.map(conf => ({
                ...conf.toObject(),
                authorNickname: userNickname
            })),
            timestamp: getCurrentDateTime()
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Error fetching your confessions', error);
    }
};

// Update confession
const updateConfession = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, isAnonymous } = req.body;
        const imageUrl = req.file ? req.file.path : undefined;
        const currentDateTime = getCurrentDateTime();
        const userNickname = await getCurrentUser(req.user._id);

        const confession = await Confession.findById(id);

        if (!confession) {
            return sendErrorResponse(res, 404, 'Confession not found', {
                message: `No confession found with id: ${id}`
            });
        }

        // Check if user is the author
        if (confession.author !== userNickname) {
            return sendErrorResponse(res, 403, 'Not authorized', {
                message: 'You are not authorized to update this confession'
            });
        }

        const updateData = {
            title: title?.trim(),
            content: content?.trim(),
            category,
            isAnonymous,
            ...(imageUrl && { imageUrl }),
            updatedAt: currentDateTime
        };

        const updatedConfession = await Confession.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Confession updated successfully',
            confession: {
                ...updatedConfession.toObject(),
                authorNickname: userNickname
            },
            timestamp: currentDateTime
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Error updating confession', error);
    }
};

// Delete confession
const deleteConfession = async (req, res) => {
    try {
        const { id } = req.params;
        const userNickname = await getCurrentUser(req.user._id);
        const confession = await Confession.findById(id);

        if (!confession) {
            return sendErrorResponse(res, 404, 'Confession not found', {
                message: `No confession found with id: ${id}`
            });
        }

        // Check if user is the author
        if (confession.author !== userNickname) {
            return sendErrorResponse(res, 403, 'Not authorized', {
                message: 'You are not authorized to delete this confession'
            });
        }

        await confession.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Confession deleted successfully',
            timestamp: getCurrentDateTime()
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Error deleting confession', error);
    }
};

module.exports = {
    createConfession,
    getAllConfessions,
    getMyConfessions,
    updateConfession,
    deleteConfession
};
