const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set. Add it to backend/.env or set the environment variable.");
    process.exit(1);
  }

  try {
    // Let mongoose use its defaults; provide the uri only
    await mongoose.connect(uri);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    if (error.name) console.error("Error name:", error.name);
    if (error.code) console.error("Error code:", error.code);

    console.error("Helpful tips:");
    console.error("- Verify MONGO_URI is correct (username, password, cluster host, database).");
    console.error("- If your password contains special characters, URL-encode them (e.g. @ -> %40).");
    console.error("- Ensure your IP is whitelisted in MongoDB Atlas Network Access or allow access from anywhere while testing.");
    console.error("- If you see 'querySrv ENOTFOUND', confirm the cluster host (e.g. cluster0.xxxx.mongodb.net) is correct.");

    process.exit(1);
  }
};

module.exports = connectDB;