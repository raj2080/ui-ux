const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found for email:", email);
            return res.status(404).json({ message: "User not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + (15 * 60 * 1000)); // 15 minutes

        // Update user with reset token
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiry = resetTokenExpiry;
        await user.save();

        // Verify token was saved
        const updatedUser = await User.findOne({ email });
        console.log("Token saved:", updatedUser.resetPasswordToken);
        console.log("Token expiry saved:", updatedUser.resetPasswordExpiry);

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Email content with current time
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
        const currentTime = new Date('2025-02-07 07:26:50');
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset Request</h1>
                <p>You requested a password reset. Please click the link below to reset your password:</p>
                <a href="${resetUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>This link will expire in 15 minutes.</p>
                <p>Current time: ${currentTime.toISOString()}</p>
                <p>Link expires at: ${resetTokenExpiry.toISOString()}</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        console.log({
            message: "Reset token details",
            token: resetToken,
            expiry: resetTokenExpiry,
            currentTime: currentTime
        });

        res.status(200).json({ 
            success: true,
            message: "Password reset link sent to email"
        });

    } catch (error) {
        console.error("Error in forgot password process:", error);
        res.status(500).json({ 
            success: false,
            message: "Error in forgot password process", 
            error: error.message 
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        const currentTime = new Date('2025-02-07 07:26:50');
        console.log("Reset attempt:", {
            time: currentTime,
            token: token
        });

        // Find user with valid token and check expiry
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: currentTime }
        });

        if (!user) {
            console.log("Reset failed: Invalid or expired token");
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        // Check if the new password is in password history
        const isInHistory = await user.isPasswordInHistory(newPassword);
        if (isInHistory) {
            return res.status(400).json({
                success: false,
                message: "Cannot reuse any of your last 5 passwords"
            });
        }

        // Update user fields (password hashing handled by pre-save middleware)
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        
        await user.save();

        console.log("Password reset successful for user:", user.email);
        console.log("New password created at:", user.passwordCreatedAt);

        res.status(200).json({ 
            success: true,
            message: "Password reset successful" 
        });

    } catch (error) {
        console.error("Error in reset password process:", error);
        res.status(500).json({ 
            success: false,
            message: "Error in reset password process", 
            error: error.message 
        });
    }
};

module.exports = { forgotPassword, resetPassword };