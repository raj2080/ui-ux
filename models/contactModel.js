//importing the mongoose package

const mongoose = require ('mongoose')

const contactSchema = new mongoose.Schema({
    
    name:{
        type : String,
        required : true
    },

    phonenumber: {
        type : String,
        required: true,
        
    },

    email:{
        type : String,
        required : true
    }


})

const Contact = mongoose.model('contacts',contactSchema)
module.exports = Contact;