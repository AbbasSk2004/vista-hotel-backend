const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoUrl = process.env.MONGODB_URL || process.env.mongo_url || 'mongodb://localhost:27017/hotel_management';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUrl);
    console.log('✓ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { mongoose, connectDB };
