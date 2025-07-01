const express = require('express');
const router = express.Router();
const verifyToken = require('../Middleware/Auth');
const RecruiterProfile = require('../Models/RecruiterProfile');
const { useId } = require('react');
const mongoose = require('mongoose');
const User = require('../Models/User');
const JobSeekerProfile = require('../Models/JobSeekerProfile');

// @route   GET /api/recruiters/profile
// @desc    Get recruiter profile
// @access  Private
router.get('/profile', verifyToken, async (req, res) => {
  console.log('request for profile',req.user.id );
    try {
    const recruiter = await RecruiterProfile.findOne({ userId: req.user.id }).select(
      'fullName profileImage companyName designation companyWebsite'
    );
  console.log("bbbb",recruiter);//null
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    res.status(200).json(recruiter);
    console.log("bbbb",recruiter);
  } catch (err) {
    console.error('Error fetching recruiter profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/update-data', verifyToken, async (req, res) => {
  console.log("request");
  try {
    const userId = req.user.id; // From decoded JWT

    const updatedData = {
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      companyName: req.body.companyName,
      companyWebsite: req.body.companyWebsite,
      profileImage: req.body.profileImage,
    };

    const profile = await RecruiterProfile.findOneAndUpdate(
      { userId },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Recruiter profile not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Failed to update recruiter profile' });
  }
});


router.post('/create', verifyToken, async (req, res) => {
  console.log('request job post');
  try {
    const userId = req.user.id;

    const {
      jobTitle,
      companyName,
      companyLogo,
      salary,
      experience,
      location,
      description,
      jobType,
      remote,
      skills,
      recruiterEmail,
      openings,
    } = req.body;

    const recruiter = await RecruiterProfile.findOne({ userId });

    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter profile not found' });
    }

    const newJob = {
      jobTitle,
      companyName,
      companyLogo,
      salary,
      experience,
      location,
      description,
      jobType,
      remote,
      skills,
      recruiterEmail,
      openings,
      applicants: [],
    };

    recruiter.jobPosts.push(newJob);

    await recruiter.save();

    return res.status(201).json({ message: 'Job posted successfully' });
  } catch (error) {
    console.error('Job creation error:', error);
    return res.status(500).json({ message: 'Failed to post job', error: error.message });
  }
});


// Update job by oldTitle for the logged-in recruiter
router.put('/update-post', verifyToken, async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const { oldTitle, ...updatedJob } = req.body;

    if (!oldTitle) {
      return res.status(400).json({ message: 'Old job title is required' });
    }

    const recruiter = await RecruiterProfile.findOne({ userId: recruiterId });

    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter profile not found' });
    }

    const jobIndex = recruiter.jobPosts.findIndex(job => job.jobTitle === oldTitle);

    if (jobIndex === -1) {
      return res.status(404).json({ message: 'Job not found with the given title' });
    }

    // Update fields
    recruiter.jobPosts[jobIndex] = {
      ...recruiter.jobPosts[jobIndex]._doc,
      ...updatedJob,
      postedAt: new Date() // Optionally update posted date
    };

    await recruiter.save();

    res.status(200).json({ message: 'Job updated successfully', job: recruiter.jobPosts[jobIndex] });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error while updating job' });
  }
});


//count of openings
router.get('/all-with-openings', verifyToken, async (req, res) => {
  try {
    // Fetch all recruiter profiles
    const recruiters = await RecruiterProfile.find();

    // Map each recruiter to add a `totalOpenings` property
    const updatedRecruiters = recruiters.map(rec => {
      let totalOpenings = 0;

      // Loop through jobPosts and sum openings
      if (Array.isArray(rec.jobPosts)) {
        for (const job of rec.jobPosts) {
          const openings = Number(job.openings) || 0; // Ensure it's a number
          totalOpenings += openings;
        }
      }

      // Return the recruiter object with totalOpenings added
      return {
        ...rec.toObject(),
        totalOpenings
      };
    });

    // Calculate the grand total of all recruiters' openings
    const grandTotalOpenings = updatedRecruiters.reduce(
      (sum, rec) => sum + (rec.totalOpenings || 0),
      0
    );

    // Send response to frontend
    res.status(200).json({
      recruiters: updatedRecruiters,
      grandTotalOpenings
    });

  } catch (error) {
    console.error('Error fetching recruiter data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//my jobs
router.get('/my-jobs', verifyToken, async (req, res) => {
  console.log('request jobs');
  console.log(req.user.id)
  try {
    const recruiter = await RecruiterProfile.findOne({ userId: req.user.id });

    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    res.status(200).json({ jobs: recruiter.jobPosts });
  } catch (error) {
    console.error('Error fetching job posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/:jobId', verifyToken, async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;

  try {
    const recruiter = await RecruiterProfile.findOne({ userId });
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });

    const jobIndex = recruiter.jobPosts.findIndex(job => job._id.toString() === jobId);
    if (jobIndex === -1) return res.status(404).json({ message: 'Job not found' });

    recruiter.jobPosts.splice(jobIndex, 1); // remove job
    await recruiter.save();

    res.status(200).json({ message: 'Job post deleted successfully' });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE a job post
router.put('/:jobId', verifyToken, async (req, res) => {
  const { jobId } = req.params;
  const updates = req.body;
  const userId = req.user.id;

  try {
    const recruiter = await RecruiterProfile.findOne({ userId });
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });

    const job = recruiter.jobPosts.id(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    Object.keys(updates).forEach(key => {
      if (key in job) job[key] = updates[key];
    });

    await recruiter.save();
    res.status(200).json({ message: 'Job updated successfully', job });
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/jobs/count
// ✅ FIXED /api/jobs/count
router.get('/count', verifyToken, async (req, res) => {
  console.log('request for count');
  try {
    const recruiters = await RecruiterProfile.find({}, 'jobPosts');
    let totalJobs = 0;

    recruiters.forEach(recruiter => {
      totalJobs += recruiter.jobPosts.length;
    });

    res.json({ total: totalJobs });
  } catch (error) {
    console.error('Error fetching total job count:', error.message);
    res.status(500).json({ error: 'Failed to fetch total job count' });
  }
});


// routes/jobs.js
// GET /api/jobs/applied/count
// ✅ FIXED /api/jobs/applied/count
// Get total applied count for current user
router.get('/applied/count', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const result = await RecruiterProfile.aggregate([
      { $unwind: '$jobPosts' },
      { $unwind: '$jobPosts.applicants' },
      {
        $match: {
          'jobPosts.applicants.userId': new mongoose.Types.ObjectId(currentUserId),
        },
      },
      {
        $count: 'count',
      },
    ]);

    const count = result.length > 0 ? result[0].count : 0;
    res.json({ count });
  } catch (err) {
    console.error('Error counting applications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});





//latest jobs

router.get('/latest', verifyToken, async (req, res) => {
  try {
    console.log("Requested /latest by:", req.user);

    const latestJobs = await RecruiterProfile.aggregate([
      { $unwind: "$jobPosts" }, // flatten jobPosts array
      { $sort: { "jobPosts.postedAt": -1 } }, // sort by post date
      { $limit: 10 },
      {
        $project: {
          _id: "$jobPosts._id",
          jobTitle: "$jobPosts.jobTitle",
          companyName: "$jobPosts.companyName",
          companyLogo: "$jobPosts.companyLogo",
          salary: "$jobPosts.salary",
          experience: "$jobPosts.experience",
          location: "$jobPosts.location",
          description: "$jobPosts.description",
          jobType: "$jobPosts.jobType",
          remote: "$jobPosts.remote",
          Skills: "$jobPosts.skills",
          openings: "$jobPosts.openings",
          postedAt: "$jobPosts.postedAt",
        }
      }
    ]);

    //console.log("Fetched latest jobs:", latestJobs);
    res.json(latestJobs);
  } catch (error) {
    console.error('Error fetching latest jobs:', error.message);
    res.status(500).json({ error: 'Failed to fetch latest jobs' });
  }
});




//recommended jobs
// POST /api/jobs/recommended




router.post('/recommended', verifyToken, async (req, res) => {
  console.log('🔍 Recommending jobs...');

  try {
    const { designation, skills, location } = req.body;
    console.log('📥 Request body:', req.body);

    const normalize = (str) => str?.trim().toLowerCase();

    const userDesignation = normalize(designation || '');
    const userLocation = normalize(location || '');

    // Normalize skills whether array of strings or objects
    const userSkills = (skills || []).map((s) =>
      normalize(typeof s === 'string' ? s : s?.name)
    );

    console.log('🧠 Normalized User Skills:', userSkills);

    const allRecruiters = await RecruiterProfile.find();

    let recommendedJobs = [];

    allRecruiters.forEach((recruiter) => {
      recruiter.jobPosts.forEach((job) => {
        const jobTitle = normalize(job.jobTitle || '');
        const jobLocation = normalize(job.location || '');
        const jobSkills = (job.skills || []).map(normalize);

        //console.log('📦 Checking Job:', job.jobTitle);
        //console.log('➡ Job Skills:', jobSkills);

        const matchesDesignation =
          userDesignation && jobTitle.includes(userDesignation);
        const matchesLocation =
          userLocation && jobLocation.includes(userLocation);
        const matchesSkills = userSkills.some((skill) =>
          jobSkills.includes(skill)
        );

        if (matchesDesignation || matchesLocation || matchesSkills) {
          recommendedJobs.push(job);
        }
      });
    });

    // Limit to 10 results
    recommendedJobs = recommendedJobs.slice(0, 10);

    res.json(recommendedJobs);
  } catch (error) {
    console.error('❌ Error fetching recommended jobs:', error.message);
    res.status(500).json({ error: 'Failed to fetch recommended jobs' });
  }
});



// Apply to a job

router.post('/:jobId/apply', verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId, name, email, resume, address, profileImage } = req.body;
    console.log('Apply request:', req.body);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Valid userId is required' });
    }

    if (!name || !email || !resume || !address || !profileImage) {
      return res.status(400).json({ message: 'Update your profile' });
    }

    const recruiter = await RecruiterProfile.findOne({ 'jobPosts._id': jobId });
    if (!recruiter) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const job = recruiter.jobPosts.id(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found in jobPosts' });
    }

    const alreadyApplied = job.applicants.some(
      app => app.userId?.toString() === userId
    );
    if (alreadyApplied) {
      return res.status(400).json({ message: 'Already applied' });
    }

    job.applicants.push({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      email,
      resume,
      address,
      profileImage,
    });

    await recruiter.save();

    res.status(200).json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error('Apply error:', err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});


// Check if user has applied
router.get('/:jobId/is-applied', verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    console.log(jobId);
    console.log(userId);
    const recruiter = await RecruiterProfile.findOne({ 'jobPosts._id': jobId });
    if (!recruiter) return res.status(404).json({ message: 'Job not found' });

    const job = recruiter.jobPosts.id(jobId);
    if (!job) return res.status(404).json({ message: 'Job post not found' });

    const alreadyApplied = job.applicants.some(
      app => app.userId?.toString() === userId
    );

    res.json({ applied: alreadyApplied });
  } catch (err) {
    console.error('Error checking application:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

//applied-jobs
router.get('/applied-jobs', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const recruiters = await RecruiterProfile.find();

    const appliedJobs = [];

    recruiters.forEach(recruiter => {
      recruiter.jobPosts.forEach(job => {
        const hasApplied = job.applicants.some(app => app.userId?.toString() === userId);
        if (hasApplied) {
          appliedJobs.push({
            ...job.toObject(),
            companyName: recruiter.companyName,
            companyLogo: recruiter.companyLogo,
          });
        }
      });
    });

    res.json(appliedJobs);
  } catch (error) {
    console.error('Error fetching applied jobs:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// Save job
router.post('/save-job', verifyToken, async (req, res) => {
  const { jobId } = req.body;
  console.log('Save job request:', req.body);
  console.log('Authenticated User ID:', req.user.id);
  try {

    await JobSeekerProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $addToSet: { savedJobs: jobId } },
      { new: true }
    );
    res.json({ message: 'Job saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unsave job
router.delete('/unsave-job/:jobId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // or req.user._id, but be consistent
    const jobId = req.params.jobId;

    console.log('Unsave job request for jobId:', jobId);
    console.log('Authenticated User ID:', userId);

    const updatedProfile = await JobSeekerProfile.findOneAndUpdate(
      { userId },
      { $pull: { savedJobs: jobId } },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ error: 'User not found or job not saved.' });
    }

    res.json({ message: 'Job unsaved successfully', updatedSavedJobs: updatedProfile.savedJobs });
  } catch (err) {
    console.error('Error unsaving job:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});




// Get saved jobs (IDs only)
router.get('/saved-jobs', verifyToken, async (req, res) => {
  try {
    
    const profile = await JobSeekerProfile.findOne({ userId: req.user._id });
    res.json(profile.savedJobs || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET saved jobs related to recruiter's job posts
router.post('/saved-jobs/details', verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;

    console.log('Request for saved job details of user:', userId);

    // Step 1: Find the JobSeekerProfile and extract saved job IDs
    const jobSeeker = await JobSeekerProfile.findOne({ userId });

    if (!jobSeeker || !Array.isArray(jobSeeker.savedJobs) || jobSeeker.savedJobs.length === 0) {
      return res.json([]); // No saved jobs
    }

    const savedJobIds = jobSeeker.savedJobs;

    // Step 2: Find recruiter profiles that contain any of the saved job IDs
    const recruiters = await RecruiterProfile.find({
      'jobPosts._id': { $in: savedJobIds },
    });

    const savedJobs = [];

    // Step 3: Loop through recruiters and extract matching job posts
    recruiters.forEach((recruiter) => {
      recruiter.jobPosts.forEach((job) => {
        if (savedJobIds.some((id) => job._id.equals(id))) {
          savedJobs.push({
            _id: job._id,
            jobTitle: job.jobTitle,
            companyName: job.companyName,
            companyLogo: job.companyLogo,
            salary: job.salary,
            experience: job.experience,
            location: job.location,
            description: job.description,
            jobType: job.jobType,
            remote: job.remote,
            skills: job.skills,
            openings: job.openings,
            postedAt: job.postedAt,
          });
        }
      });
    });

    res.json(savedJobs);
  } catch (err) {
    console.error('Error retrieving saved job details:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});



/// GET /api/recruiters/job-applicants/:jobId
router.get('/job-applicants/:jobId', verifyToken, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const recruiterUserId = req.user.id; // from token (e.g., '68519cdb0843f0999e658a5b')

    // Log check
    console.log('Recruiter userId from token:', recruiterUserId);

    // Find RecruiterProfile with matching userId
    const recruiter = await RecruiterProfile.findOne({ userId: new mongoose.Types.ObjectId(recruiterUserId) });
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    // Find job post by ID inside jobPosts array
    const job = recruiter.jobPosts.find(j => j._id.toString() === jobId);
    console.log('Job found:', job); // Debugging line
    if (!job) {
      return res.status(404).json({ message: 'Job not found in recruiter profile' });
    }

    // Return applicants
    return res.status(200).json({ applicants: job.applicants });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Get full applicant details
// @route   GET /api/recruiters/applicant/:applicantId
// @desc    Get full details of a job applicant by ID
// @access  Private
router.get('/applicant/:applicantId', verifyToken, async (req, res) => {
  try {
    const { applicantId } = req.params;

    console.log('Fetching details for applicant with userId:', applicantId);

    const user = await JobSeekerProfile.findOne({ userId: applicantId }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    res.status(200).json({ applicant: user });
  } catch (error) {
    console.error('Error fetching applicant details:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// GET /api/recruiters/jobs?search=React&location=Remote&jobType=Internship...

// POST /api/recruiters/search-jobs
router.post('/search-jobs', async (req, res) => {
  try {
    const { designation = [], location = '', type = '' } = req.body;

    console.log('Search criteria:', { designation, location, type });

    // Handle flexible matching
    const searchRegexes =
      designation.length > 0
        ? designation.map((term) => new RegExp(term, 'i'))
        : [/.*/];

    const locationRegex = location ? new RegExp(location, 'i') : /.*/;

    // Define job type filter logic
    const jobTypeFilter = (jobType) => {
      const lowerType = type.toLowerCase();

      if (lowerType === 'job') {
        return ['full-time', 'part-time', 'contract'].includes(
          jobType.toLowerCase()
        );
      } else if (lowerType === 'internship') {
        return jobType.toLowerCase() === 'internship';
      } else {
        return true; // Match all job types if type is not specified
      }
    };

    // Fetch recruiters and jobs
    const recruiters = await RecruiterProfile.find({}, 'jobPosts');

    let matchingJobs = recruiters.flatMap((recruiter) =>
      recruiter.jobPosts.filter((job) => {
        const matchesDesignation =
          searchRegexes.some((regex) => regex.test(job.jobTitle)) ||
          (Array.isArray(job.skills) &&
            searchRegexes.some((regex) =>
              job.skills.some((skill) => regex.test(skill))
            )) ||
          searchRegexes.some((regex) => regex.test(job.description));

        const matchesLocation = locationRegex.test(job.location);
        const matchesType = jobTypeFilter(job.jobType);

        return matchesDesignation && matchesLocation && matchesType;
      })
    );

    const formattedJobs = matchingJobs.map((job) => ({
      _id: job._id,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      salary: job.salary,
      experience: job.experience,
      location: job.location,
      description: job.description,
      jobType: job.jobType,
      remote: job.remote,
      skills: job.skills,
      postedAt: job.postedAt,
    }));

    formattedJobs.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

    res.status(200).json(formattedJobs);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});




module.exports = router;
