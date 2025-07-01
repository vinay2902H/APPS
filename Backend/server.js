const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./Routes/Auth');
const userRoutes = require('./Routes/userRoutes'); // Assuming you have a user data route
const uploadRoutes = require('./Routes/UploadProfile'); // Assuming you have a profile image upload route
const recuriterRoutes=require('./Routes/recuriterRoutes');
const verifyRoutes = require('./Routes/verifyRoutes'); // Assuming you have a verification route
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/recruiters',recuriterRoutes)
app.use('/api/uploads',uploadRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/verify', verifyRoutes);

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});
