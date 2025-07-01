const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  companyName: { type: String, required: true },
  companyLogo: { type: String },
  salary: { type: String },
  experience: { type: String },
  location: { type: String },
  description: { type: String },
  skills: { type: [String] },
  jobType: { type: String },
  remote: { type: Boolean, default: false },
  recruiterEmail: { type: String, required: true },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  openings: {   // ✅ New field for number of openings
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  applicants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      appliedAt: {
        type: Date,
        default: Date.now,
      },
      jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      },
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
