const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const userSignup = async (req, res) => {
    try {
        const { nickname, email, password, retypePassword } = req.body;

        // Basic validation checks
        if (!nickname || !email || !password || !retypePassword) {
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

        // Check if passwords match
        if (password !== retypePassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
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

// Helper function to generate nickname suggestions
async function generateNicknameSuggestions(nickname) {
    const suggestions = [];
    const suffixes = ['123', '_2', '_new', '22', '_cool'];
    
    for (let suffix of suffixes) {
        const suggestion = nickname + suffix;
        if (suggestion.length <= 10) {  // Ensure suggestion meets length requirement
            const exists = await User.findOne({ nickname: suggestion });
            if (!exists) {
                suggestions.push(suggestion);
            }
        }
    }

    // Add random number suggestion if we have few suggestions
    if (suggestions.length < 3) {
        const randomNum = Math.floor(Math.random() * 999);
        const randomSuggestion = `${nickname.slice(0, 7)}${randomNum}`.slice(0, 10);
        if (!(await User.findOne({ nickname: randomSuggestion }))) {
            suggestions.push(randomSuggestion);
        }
    }

    return suggestions.slice(0, 3); // Return up to 3 suggestions
}

module.exports = { userSignup };