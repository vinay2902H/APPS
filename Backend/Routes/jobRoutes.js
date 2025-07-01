const express = require('express');
const Job = require('../models/Jobs');
const User = require('../models/User'); // Assuming you have a User model
const auth = require('../middleware/auth'); // JWT auth middleware
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Application = require('../Models/Application');



// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }); // Sort by latest
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});



// POST /api/jobs/create// routes/jobRoutes.js
// POST a new job
router.post('/create', auth, async (req, res) => {
  try {
    const userId = req.user.id; // comes from auth middleware
    const jobData = {
      ...req.body,
      postedBy: userId, // ✅ add this line to include required postedBy field
    };

    const newJob = new Job(jobData);
    await newJob.save();

    res.status(201).json({ message: 'Job posted successfully', job: newJob });
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ message: 'Server error during job creation' });
  }
});


// GET /api/jobs/count - Total jobs available
router.get('/count', async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    res.json({ total: totalJobs });
  } catch (err) {
    console.error('Total job count error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// GET /api/jobs/latest
router.get('/latest', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).limit(10); // Get latest 10 jobs
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: err.message });
  }
});


router.get('/protected-route', auth, (req, res) => {
  // Access user info via req.user
  res.json({ message: 'Access granted', user: req.user });
});



// GET /api/jobs/my-jobs/count

router.get('/my-jobs/count', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token directly here
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    const userId = decoded.id;

    const count = await Job.countDocuments({ postedBy: userId });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching job count:', error);
    res.status(401).json({ message: 'Unauthorized or Server Error' });
  }
});


// GET all jobs by current user
router.get('/my-jobs', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.user.id });
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: err.message });
  }
});


// router.post('/apply', auth, async (req, res) => {
//   const { jobId } = req.body;
//   const userId = req.user.id;
 

//   if (!jobId) {
//     return res.status(400).json({ message: 'Job ID is required' });
//   }

//   try {
//     // Prevent duplicate applications
//     const alreadyApplied = await Application.findOne({ jobId, userId });
//     if (alreadyApplied) {
//       return res.status(400).json({ message: 'Already applied to this job' });
//     }

//     const application = new Application({ jobId, userId });
//     await application.save();

//     res.status(201).json({ 
//       message: 'Applied successfully',
//       applicationId: application._id,
//       jobId: application.jobId
//     });
//   } catch (err) {
//     console.error('Application error:', err);

//     res.status(500).json({ message: 'Server error' });
//   }
// });





// GET /api/jobs/applied/count
// GET /api/jobs/applied/count (when using applicants array in Job model)
router.get('/applied/count', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Job.countDocuments({
      applicants: { $elemMatch: { userId: userId } }
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching job application count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// POST /api/jobs/:id/apply
// ✅ Apply to a job
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User not found in request' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const alreadyApplied = job.applicants.some(
      app => app.userId.toString() === userId.toString()
    );
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    job.applicants.push({ userId });
    await job.save();

    res.status(200).json({ message: 'Application submitted', job });
  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;
