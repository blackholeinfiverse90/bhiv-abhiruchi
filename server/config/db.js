import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.trim() === '') {
    console.error('❌ MONGODB_URI environment variable is missing or empty! Please define MONGODB_URI in your server environment (.env).');
    return;
  }

  try {
    console.log('⏳ Connecting to MongoDB...');
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    console.warn(`💡 Tip: Ensure your server IP is whitelisted on MongoDB Atlas (Network Access -> 0.0.0.0/0).`);
  }
};
