
//first import then second create function then third export


//importing a database package
const mongoose = require('mongoose')




//creating a function
const connectDatabase = () => {
       
     mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

}

// Exporting the function
module.exports = connectDatabase