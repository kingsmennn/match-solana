import { paymentModel } from "../../models/paymentinfo.model";
import { connectWithRetry } from "../database";

export default defineEventHandler(async (event) => {
  try {
    connectWithRetry();
    const body = await readBody(event);
    const { requestId, transactionHash } = body as any;
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
