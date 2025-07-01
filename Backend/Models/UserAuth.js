const mongoose = require('mongoose');

const userAuthSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },

  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['jobSeeker', 'recruiter', 'admin'],
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('UserAuth', userAuthSchema);
