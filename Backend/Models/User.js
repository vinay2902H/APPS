const mongoose = require('mongoose');

// Education Sub-schema
const educationSchema = new mongoose.Schema({
  qualification: { type: String, required: true },
  board: { type: String },
  medium: { type: String },
  percentage: { type: String },
  yearOfPassing: { type: String },
  course: { type: String },
  college: { type: String },
  grading: { type: String },
  cgpa: { type: String },
  courseType: { type: String },
  startYear: { type: String },
  endYear: { type: String },
});

// Employment Sub-schema
const employmentSchema = new mongoose.Schema({
  company: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  isCurrentCompany: { type: Boolean, default: false },
  currentSalary: {
    fixedPay: { type: String, default: '' },
    variablePay: { type: String, default: '' },
  },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  isOngoing: { type: Boolean, default: false },
  payType: { type: String, default: '' },
  experience: { type: String, default: '' },
  projects: { type: [String], default: [] },
  responsibilities: { type: [String], default: [] },
});

// Language Sub-schema
const languageSchema = new mongoose.Schema({
  language: { type: String, required: true },
  proficiency: { type: String },
  canRead: { type: Boolean, default: false },
  canWrite: { type: Boolean, default: false },
  canSpeak: { type: Boolean, default: false },
});

// User Schema
const userSchema = new mongoose.Schema(
  {
    profileImage: {
      type: String,
      default: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    updatesViaEmail: { type: Boolean, default: false },

    basicDetails: {
  location: { type: String, default: '' },
  experience: { type: String, default: '' },
  ctc: { type: String, default: '' },
  noticePeriod: { type: String, default: '' },              // e.g., "2 Months"
  currentlyServingNotice: { type: Boolean, default: false },// e.g., true/false
  noticeEndDate: { type: Date, default: null },             // e.g., 2025-08-01
},


     professionalDetails: {
      currentIndustry: { type: String, default: '' },
      department: { type: String, default: '' },
      designation: { type: String, default: '' },
    },

    employmentDetailsList: {
      type: [employmentSchema],
      default: [],
    },

  skills: {
      technologies: {
        type: [String],
        default: [],
      },
    },

    education: {
      type: [educationSchema],
      default: [],
    },

     personalDetails: {
      address: { type: String, default: '' },
      isDisabled: { type: Boolean, default: false },
      gender: { type: String, default: '' },
      dateOfBirth: { type: String, default: '' },
      maritalStatus: { type: String, default: '' },
      languages: {
        type: [languageSchema],
        default: [],
      },
    },
    resume: { type: String, default: '' },

    role: {
      type: String,
      enum: ['jobSeeker', 'recruiter', 'admin'],
      default: 'jobSeeker',
    },
   
    

    // Recruiter fields
    companyName: { type: String, default: '' },
    companyWebsite: { type: String, default: '' },
    companyLogo: { type: String, default: '' },
    
    workStatus: {
      type: String,
      enum: ['experienced', 'fresher'],
      default: 'fresher',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
