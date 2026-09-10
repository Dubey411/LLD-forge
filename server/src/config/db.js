const mongoose = require('mongoose');

const connectDB = async (customUri) => {
  const uri = customUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lld_practice';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database] Error connecting to MongoDB: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[Database] MongoDB connection closed');
    }
  } catch (error) {
    console.error(`[Database] Error disconnecting from MongoDB: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
