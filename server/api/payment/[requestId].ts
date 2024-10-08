import mongoose from "mongoose";
import { paymentModel } from "../models/paymentinfo.model";


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

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { requestId, transactionHash } = body as any;
    connectWithRetry();
    await paymentModel.updateOne(
      { requestId: requestId },
      { transactionHash, requestId },
      { upsert: true }
    );
    return { success: true };
  } catch (error) {
    console.log("Error", error);
    return { error: error, success: false };
  }
});
