const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const userSignup = async (req, res) => {
    try {
        const { nickname, email, password, retypepassword } = req.body;

        // Basic validation checks
        if (!nickname || !email || !password || !retypepassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Normalize nickname (convert to lowercase and trim)
        const normalizedNickname = nickname.toLowerCase().trim();

        // Check nickname length
        if (normalizedNickname.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Nickname must not exceed 10 characters'
            });
        }

        // Check if nickname contains valid characters
        const nicknameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!nicknameRegex.test(normalizedNickname)) {
            return res.status(400).json({
                success: false,
                message: 'Nickname can only contain letters, numbers, underscores, and hyphens'
            });
        }

        // Check if email is already registered
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        // Check password length and complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be 8-16 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character'
            });
        }

        // Check if passwords match
        if (password !== retypepassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Create new user (password hashing and history initialization handled by pre-save middleware)
        const newUser = new User({
            nickname: normalizedNickname,
            email: email.toLowerCase(),
            password: password,
            passwordCreatedAt: new Date('2025-02-07 07:26:50')
        });

        // Save user to database
        await newUser.save();

        // Return success response
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                nickname: newUser.nickname,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Signup error:', error);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: error.keyPattern.nickname
                    ? 'This nickname is already taken'
                    : 'This email is already registered'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error in user registration',
            error: error.message
        });
    }
};

module.exports = { userSignup };