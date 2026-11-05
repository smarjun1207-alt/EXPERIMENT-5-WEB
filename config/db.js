const mongoose = require("mongoose");

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected successfully -> ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Attempting reconnection...");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB runtime error: ${err.message}`);
});

module.exports = connectDB;
