const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,  // fail fast if Atlas unreachable (IP not whitelisted)
      connectTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('👉 Check: (1) IP whitelisted in Atlas Network Access, (2) MONGODB_URI in .env is correct.');
    process.exit(1);
  }
};

module.exports = connectDB;

