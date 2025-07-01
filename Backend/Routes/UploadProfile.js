const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage, cloudinary } = require('../cloudinaryConfig');
const upload = multer({ storage });
const verifyToken = require('../Middleware/Auth');
const JobSeekerProfile = require('../Models/JobSeekerProfile');
const RecruiterProfile=require('../Models/RecruiterProfile');
// POST /api/users/upload-profile
router.post('/upload-profile', verifyToken, upload.single('profileImage'), async (req, res) => {
  console.log('File upload request received');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = req.file.path;
    const userId = req.user.id;

    await JobSeekerProfile.findOneAndUpdate({ userId }, { profileImage: imageUrl });

    res.status(200).json({ message: 'Profile image updated', imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/uploads/upload-profile-R
router.post('/upload-profile-R', verifyToken, upload.single('profileImage'), async (req, res) => {
  console.log('File upload request received');

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = req.file.path; // Cloudinary file URL
    const userId = req.user.id;

    const updated = await RecruiterProfile.findOneAndUpdate(
      { userId },
      { profileImage: imageUrl },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Recruiter profile not found' });
    }

    res.status(200).json({ message: 'Profile image updated successfully', imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// POST /api/uploads/upload-profile-R
router.post('/upload-logo-R', verifyToken, upload.single('companyLogo'), async (req, res) => {
  console.log('File upload request received for company logo');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

   const imageUrl = `${req.file.path.replace(/\\/g, '/')}`;

    const userId = req.user.id;

    const updated = await RecruiterProfile.findOneAndUpdate(
      { userId },
      { companyLogo: imageUrl },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Recruiter profile not found' });
    }

    res.status(200).json({ message: 'Profile image updated successfully', imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});


// POST /api/users/upload-resume
const fs = require('fs');

router.post('/upload-resume', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.file || !req.file.path) return res.status(400).json({ error: 'No file uploaded' });

    const uploaded = await cloudinary.uploader.upload(req.file.path, {
      public_id: `user_profiles/user_${userId}`,
      resource_type: 'raw',
      overwrite: true,
      type: 'upload',
      format: 'pdf', // or let Cloudinary auto-detect
      use_filename: true,
      unique_filename: false,
    });

    await JobSeekerProfile.findOneAndUpdate({ userId }, { resume: uploaded.secure_url });

    return res.status(200).json({
      message: 'Resume uploaded successfully',
      resumeUrl: uploaded.secure_url,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

module.exports = router;
