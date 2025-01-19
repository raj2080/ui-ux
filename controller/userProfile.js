// controller/userProfile.js
const User = require('../models/userModel');

const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    // Select only name and email fields
    const user = await User.findById(userId).select('nickname email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = { getUserProfile };