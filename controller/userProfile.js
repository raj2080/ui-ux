const User = require('../models/userModel');

const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    // Select only name and email fields
    const user = await User.findById(userId).select('nickname email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



const updateUserProfile = async (req, res) => {
    try {
        // Debug logs
        console.log('Request user:', req.user);
        console.log('Token payload:', req.user.id); // From your auth middleware
        console.log('Update data:', req.body);

        const userId = req.user.id; // Make sure this matches your JWT payload

        // Validate userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Find user first
        const user = await User.findById(userId);
        
        // Debug log
        console.log('Found user:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                debug: { 
                    searchedId: userId,
                }
            });
        }

        const { nickname, email } = req.body;

        // Update only provided fields
        if (nickname) user.nickname = nickname;
        if (email) user.email = email;

        // Save the updated user
        const updatedUser = await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                nickname: updatedUser.nickname,
                email: updatedUser.email,
                updatedAt: updatedUser.updatedAt
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: Object.values(error.errors)[0].message
            });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `This ${field} is already in use`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { 
    getUserProfile,
    updateUserProfile 
};

