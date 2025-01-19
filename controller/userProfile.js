const User = require('../models/userModel');
const bcrypt = require('bcryptjs'); // Add this import


const getUserProfile = async (req, res) => {
  try {
      const userId = req.params.id;
      // Select necessary fields
      const user = await User.findById(userId).select('nickname email updatedAt');

      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'User not found'
          });
      }

      // Return data in consistent format
      res.json({
          success: true,
          data: {
              nickname: user.nickname,
              email: user.email,
              updatedAt: user.updatedAt
          }
      });
  } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
          success: false,
          message: 'Server error',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};

const updateUserProfile = async (req, res) => {
    try {
        // Debug logs
        console.log('Update profile request:', {
            userId: req.user.id,
            updateData: req.body
        });

        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Find user first
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { nickname, email } = req.body;

        // Validate input
        if (!nickname && !email) {
            return res.status(400).json({
                success: false,
                message: 'No update data provided'
            });
        }

        // Update only provided fields
        if (nickname) user.nickname = nickname;
        if (email) user.email = email.toLowerCase(); // Convert email to lowercase

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

const changePassword = async (req, res) => {
    try {
        console.log('Password change request received'); // Debug log
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both current and new password'
            });
        }

        // Validate password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('User found, verifying current password'); // Debug log

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        console.log('Current password verified, hashing new password'); // Debug log

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        console.log('Password updated successfully'); // Debug log

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        
        // Handle specific errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Password validation failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error changing password. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    changePassword
};