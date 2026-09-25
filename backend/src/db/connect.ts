import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/rrce_erp';

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🍃 Connected successfully to MongoDB via Mongoose!');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
}
