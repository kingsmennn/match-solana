import mongoose from "mongoose";
export function connectWithRetry() {
    const MONGO_URI = useRuntimeConfig().mongo_uri;
    mongoose
      .connect(MONGO_URI)
      .then(() => {
        console.log("Connected to Database");
      })
      .catch((err) => {
        console.error(
          "Failed to connect to MongoDB, retrying in 5 seconds...",
          err
        );
        setTimeout(connectWithRetry, 5000);
      });
    mongoose.set("debug", process.env.NODE_ENV != "production");
  }