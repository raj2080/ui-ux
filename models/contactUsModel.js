// Importing the mongoose package
const mongoose = require('mongoose');

const contactUsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phonenumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'general',
        required: true
    }
});

// Creating the ContactUs model using the contactUsSchema
const ContactUs = mongoose.model('ContactUs', contactUsSchema);

module.exports = ContactUs;