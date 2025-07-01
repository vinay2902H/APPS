const express = require('express');
const router = express.Router();
const UserAuth = require('../Models/UserAuth');
const JobSeekerProfile = require('../Models/JobSeekerProfile');
const RecruiterProfile = require('../Models/RecruiterProfile');
const verifyToken = require('../Middleware/Auth');
const { sendOtpEmail } = require('../utils/emailService');

const otpStore = new Map(); // Map: email => { otp, expiresAt }

// Helper: Generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ Route: Send Email OTP
router.post('/send-email-otp', async (req, res) => {
  let { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  email = email.trim().toLowerCase();
  const otp = generateOtp();
  const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes

  try {
    await sendOtpEmail(email, otp);
    otpStore.set(email, { otp, expiresAt });

    console.log(`✅ OTP generated for ${email}: ${otp}`);
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    console.error('❌ Failed to send OTP:', err);
    res.status(500).json({ success: false, message: 'Could not send OTP' });
  }
});

// ✅ Route: Verify Email OTP and update email
router.post('/verify-email-otp', verifyToken, async (req, res) => {
  let { email, otp } = req.body;
  const userId = req.user.id;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  email = email.trim().toLowerCase();
  const record = otpStore.get(email);
  console.log(`📨 Verifying OTP for ${email} | Provided: ${otp} | Stored:`, record);

  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  try {
    // Get user to access role (do NOT update email)
    const user = await UserAuth.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update emailVerified based on role
    if (user.role === 'jobSeeker') {
      await JobSeekerProfile.findOneAndUpdate({ userId }, { emailVerified: true });
    } else if (user.role === 'recruiter') {
      await RecruiterProfile.findOneAndUpdate({ userId }, { emailVerified: true });
    }

    otpStore.delete(email);
    console.log(`✅ Email OTP verified for ${email}, emailVerified flag updated`);

    res.json({ success: true, message: 'Email verified successfully' });

  } catch (error) {
    console.error('❌ Error verifying email OTP:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;
