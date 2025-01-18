// controllers/forgotPassword.js
const User = require('../models/userModel');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

        // Save reset token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiry = resetTokenExpiry;
        await user.save();

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Email content
        const resetUrl = `http://yourdomain.com/reset-password/${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Please click on the following link to reset your password: ${resetUrl}\n\nIf you didn't request this, please ignore this email.`
        };

        // Send email
        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ 
            message: "Password reset link sent to email" 
        });

    } catch (error) {
        res.status(500).json({ 
            message: "Error in forgot password process", 
            error: error.message 
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        // Find user by reset token and check if token is expired
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }

        // Update password and clear reset token fields
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();

        res.status(200).json({ 
            message: "Password reset successful" 
        });

    } catch (error) {
        res.status(500).json({ 
            message: "Error in reset password process", 
            error: error.message 
        });
    }
};

module.exports = { forgotPassword, resetPassword };