const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  qualification: String,
  board: String,
  medium: String,
  percentage: String,
  yearOfPassing: String,
  course: String,
  college: String,
  grading: String,
  cgpa: String,
  courseType: String,
  startYear: String,
  endYear: String,
});

const employmentSchema = new mongoose.Schema({
  company: String,
  jobTitle: String,
  isCurrentCompany: Boolean,
  currentSalary: {
    fixedPay: String,
    variablePay: String,
  },
  startDate: String,
  endDate: String,
  isOngoing: Boolean,
  payType: String,
  experience: String,
  projects: [String],
  responsibilities: [String],
});

const languageSchema = new mongoose.Schema({
  language: String,
  proficiency: String,
  canRead: Boolean,
  canWrite: Boolean,
  canSpeak: Boolean,
});

const jobSeekerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAuth', required: true },
  fullName: { type: String, required: true },
  profileImage: { type: String, default: 'https://randomuser.me/api/portraits/men/1.jpg' },
    emailVerified: { type: Boolean, default: false },
  mobileNumber: { type: String, required: true },
  resume: { type: String, default: '' },
  updatesViaEmail: { type: Boolean, default: false },
  workStatus: { type: String, enum: ['experienced', 'fresher'], default: 'fresher' },

  basicDetails: {
    location: String,
    experience: String,
    ctc: String,
    noticePeriod: String,
    currentlyServingNotice: Boolean,
    noticeEndDate: Date,
  },
  professionalDetails: {
    currentIndustry: String,
    department: String,
    designation: String,
  },
  personalDetails: {
    address: String,
    isDisabled: Boolean,
    gender: String,
    dateOfBirth: String,
    maritalStatus: String,
    languages: [languageSchema],
  },
  skills: {
    technologies: [String],
  },
  education: [educationSchema],
  employmentDetailsList: [employmentSchema],
  savedJobs: {
  type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  default: []
}

}, { timestamps: true });

module.exports = mongoose.model('JobSeekerProfile', jobSeekerProfileSchema);
