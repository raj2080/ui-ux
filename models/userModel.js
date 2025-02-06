const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nickname: {
        type: String,
        required: [true, 'Nickname is required'],
        trim: true,
        minlength: [1, 'Nickname must be at least 1 character long'],
        maxlength: [10, 'Nickname cannot exceed 10 characters'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9_]+$/.test(v);
            },
            message: 'Nickname can only contain letters, numbers, and underscores'
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    passwordCreatedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpiry: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Pre-save middleware to update passwordCreatedAt
userSchema.pre('save', function(next) {
    if (this.isModified('password')) {
        this.passwordCreatedAt = new Date();
    }
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;