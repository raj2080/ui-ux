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

        // Check if nickname contains valid characters (optional)
        const nicknameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!nicknameRegex.test(normalizedNickname)) {
            return res.status(400).json({
                success: false,
                message: 'Nickname can only contain letters, numbers, underscores, and hyphens'
            });
        }

        

        // Check if nickname is already taken
        const existingNickname = await User.findOne({ nickname: normalizedNickname });
        if (existingNickname) {
            return res.status(400).json({
                success: false,
                message: 'This nickname is already taken. Please choose another one.',
                suggestions: await generateNicknameSuggestions(normalizedNickname)
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

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            nickname: normalizedNickname,
            email: email.toLowerCase(),
            password: hashedPassword
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