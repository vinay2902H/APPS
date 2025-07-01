// middleware/auth.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  console.log('Verifying token...');
  const authHeader = req.headers['authorization'];
  console.log('Authorization header:', authHeader);
  const token = authHeader?.split(' ')[1]; // Expecting "Bearer <token>"
   console.log('Extracted token:', token);
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token,process.env.JWT_SECRET); // Replace with your secret
    req.user = decoded; // decoded contains { id: user._id, ... }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken;
