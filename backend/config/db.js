const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/dialog_reload_db';
  
  try {
    // Set short timeout so if mongo isn't installed/running, it doesn't hang the app
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.log(`[Database Notice] MongoDB connection skipped (${error.message}). Using local persistent JSON storage engine.`);
    return false;
  }
};

module.exports = connectDB;
