import mongoose from 'mongoose';

export const connectDB = async () => {
  const atlasUri = process.env.MONGODB_URI;
  const localUri = 'mongodb://127.0.0.1:27017/gurukul_assessment';

  if (atlasUri) {
    try {
      console.log('⏳ Connecting to MongoDB Atlas...');
      const conn = await mongoose.connect(atlasUri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.warn(`⚠️ MongoDB Atlas Connection Failed: ${error.message}`);
      console.warn(`💡 Tip: Ensure your current IP is whitelisted on MongoDB Atlas (Network Access -> 0.0.0.0/0).`);
    }
  }

  try {
    console.log('⏳ Attempting connection to local MongoDB fallback...');
    const localConn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`✅ Local MongoDB Connected: ${localConn.connection.host}`);
    return localConn;
  } catch (localError) {
    console.error(`❌ Local MongoDB Connection Error: ${localError.message}`);
  }
};
