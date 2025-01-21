// backend/models/confessionModel.js
const mongoose = require('mongoose');

const confessionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Please provide content']
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: ['Personal', 'Relationship', 'Work', 'Family', 'School', 'Other']
    },
    imageUrl: {
        type: String
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    author: {
        type: String,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Confession', confessionSchema);