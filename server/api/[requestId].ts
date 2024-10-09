import { Connection } from "@solana/web3.js";
import { marketAbi } from "../../blockchain/abi";
import { programID } from "../../utils/constants";
import { BorshCoder } from "@project-serum/anchor";
import { CoinDecimals, CoinPayment } from "../../types";
import { paymentModel } from "../models/paymentinfo.model";
import { connectWithRetry } from "./database";

export default defineEventHandler(async (event) => {
  connectWithRetry();
  const requestId = (event.context.params as any).requestId;
  const env = useRuntimeConfig().public;
  const preflightCommitment = "processed";
  const connection = new Connection(env.solanaRpcUrl, preflightCommitment);
  const abiDecoder = new BorshCoder(marketAbi as any);
  const filter = abiDecoder.accounts.memcmp("RequestPaymentTransaction");
  const accounts = await connection.getParsedProgramAccounts(programID, {
    filters: [
      {
        dataSize: filter.dataSize,
        memcmp: {
          offset: 8 + 32,
          bytes: requestId,
        },
      },
    ],
  });

  let decodedAccount;

  for (const account of accounts) {
    try {
      decodedAccount = abiDecoder.accounts.decode(
        "RequestPaymentTransaction",
        account.account.data as any
      );
      break;
    } catch (e) {}
  }
  const paymentMade = await paymentModel.findOne({
    requestId: Number(decodedAccount.requestId),
  });

  if (paymentMade) {
    return paymentMade;
  }

  const tokenInfo = Object.keys(decodedAccount.token)[0];

  let tokenMint = "";

  switch (tokenInfo) {
    case "pyusdt":
      tokenMint = env.pyUsdMint;
      break;
    case "solana":
      tokenMint = env.solMint;
      break;
  }
  const payload = {
    to: decodedAccount.sellerAuthority.toBase58(),
    token: tokenMint,
    amount: Number(decodedAccount.amount).toString(),
  };

  const data = await $fetch(
    `https://api.portalhq.io/api/v3/clients/me/chains/${env.solanaChainId}/assets/send/build-transaction`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.portalClientApiKey}`,
      },
      body: {
        to: payload.to,
        token: payload.token,
        amount: (
          +payload.amount /
          10 ** CoinDecimals[tokenInfo as CoinPayment]
        ).toString(),
      },
    }
  );

  return data;
});
