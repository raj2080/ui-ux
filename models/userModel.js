const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    passwordHistory: {
        type: [String],
        default: [],
        maxLength: 5
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
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    accountLocked: {
        type: Boolean,
        default: false
    },
    lockUntil: {
        type: Date,
        default: null
    },
    lastLoginAttempt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

userSchema.methods.isPasswordInHistory = async function(password) {
    for (const oldPassword of this.passwordHistory) {
        if (await bcrypt.compare(password, oldPassword)) {
            return true;
        }
    }
    return false;
};

userSchema.methods.handleFailedLogin = async function() {
    const currentDate = new Date();
    
    this.loginAttempts += 1;
    this.lastLoginAttempt = currentDate;

    if (this.loginAttempts >= 5) {
        this.accountLocked = true;
        this.lockUntil = new Date(currentDate.getTime() + 15 * 60 * 1000); // 15 minutes from now
        console.log(`Account locked until: ${this.lockUntil.toISOString()}`);
    }

    await this.save();
    return this.accountLocked;
};

userSchema.methods.resetLoginAttempts = async function() {
    this.loginAttempts = 0;
    this.accountLocked = false;
    this.lockUntil = null;
    await this.save();
};

userSchema.methods.isAccountLocked = function() {
    if (!this.accountLocked) return false;
    const currentDate = new Date();
    return this.lockUntil && this.lockUntil > currentDate;
};

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(this.password, salt);

            if (this.passwordHistory.length >= 5) {
                this.passwordHistory.shift();
            }
            this.passwordHistory.push(hashedPassword);

            this.password = hashedPassword;
            this.passwordCreatedAt = new Date();
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;