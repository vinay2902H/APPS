const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const UserAuth = require('../Models/UserAuth');
const JobSeekerProfile = require('../Models/JobSeekerProfile');
const RecruiterProfile = require('../Models/RecruiterProfile');
const verifyToken = require('../Middleware/Auth');
const { sendPasswordChangeEmail } = require('../utils/emailService');
const { sendOtpEmail } = require('../utils/emailService');

const otpResetStore = new Map();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


router.post('/register', async (req, res) => {
  try {
    const { email, password, role, fullName, mobileNumber, ...rest } = req.body;
    console.log("Data", req.body);

    // Check if user already exists
    const existingUser = await UserAuth.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create UserAuth record
    const user = await UserAuth.create({
      email,
      password: hashedPassword,
      role,
    });

    // Create profile based on role
    if (role === 'jobSeeker') {
      await JobSeekerProfile.create({
        userId: user._id,
        fullName,
        mobileNumber,
        ...rest,
      });
    } else if (role === 'recruiter') {
      await RecruiterProfile.create({
        userId: user._id,
        fullName,
        email,
        phoneNumber: mobileNumber,
        companyName: rest.companyName ?? null,
        companyWebsite: rest.companyWebsite ?? null,
        jobPosts: [],
      });
    }

    return res.status(201).json({ message: 'Registered successfully' });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});




router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Step 1: Find user in UserAuth collection
    const user = await UserAuth.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Step 2: Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Step 3: Validate requested role matches the user’s actual role
    if (user.role !== role) {
      return res.status(403).json({ message: `You are not registered as a ${role}` });
    }

    // Step 4: Check if corresponding role-based profile exists
    let profile = null;
    if (role === 'jobseeker') {
      profile = await JobSeekerProfile.findOne({ userId: user._id });
      if (!profile) return res.status(404).json({ message: 'Jobseeker profile not found' });
    } else if (role === 'recruiter') {
      profile = await RecruiterProfile.findOne({ userId: user._id });
      if (!profile) return res.status(404).json({ message: 'Recruiter profile not found' });
    }

    // Step 5: Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Step 6: Send response
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      profile,
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});


router.post('/change-password', verifyToken, async (req, res) => {

  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
   console.log("Change Password Data", req.body);
   console.log("User ID", userId);
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new passwords are required' });
  }

  try {
    const user = await UserAuth.findById(userId);
    console.log("User Data", user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log("Password Match", isMatch);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect current password' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

     // ✅ Send confirmation email
   try {
  console.log('Sending email...');
  await sendPasswordChangeEmail(user.email, user.fullName);
  console.log('Email sent');
} catch (emailErr) {
  console.error('Email sending failed:', emailErr);
}

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/forgot-password/send-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserAuth.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOtp();
    const expiresAt = Date.now() + 3 * 60 * 1000; // 3 mins

    await sendOtpEmail(email, otp);
    otpResetStore.set(email, { otp, expiresAt });

    console.log(`🔐 OTP for ${email}: ${otp}`);
    res.json({ success: true, message: 'OTP sent to your email' });

  } catch (err) {
    console.error('Failed to send OTP:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/forgot-password/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  const record = otpResetStore.get(email);
  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  return res.json({ success: true, message: 'OTP verified successfully' });
});


// Reset password
router.post('/forgot-password/reset', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const record = otpResetStore.get(email);
  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  try {
    const user = await UserAuth.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    otpResetStore.delete(email);
    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});



module.exports = router;
