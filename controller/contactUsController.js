const ContactUs = require('../models/contactUsModel');

const createContactUs = async (req, res) => {
    try {
        const { name, phonenumber, email, subject, message, category } = req.body;

        // Check if all required fields are present
        if (!name || !phonenumber || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Create a new contact entry
        const newContactUs = new ContactUs({
            name,
            phonenumber,
            email,
            subject,
            message,
            category
        });

        // Save the contact entry to the database
        await newContactUs.save();

        // Respond with a success message
        res.status(201).json({ message: 'Contact form submitted successfully' });
    } catch (error) {
        console.error('Error saving contact form:', error); // Log the error
        // Handle errors and respond with an error message
        res.status(500).json({ error: 'Failed to submit contact form' });
    }
};

module.exports = { createContactUs };