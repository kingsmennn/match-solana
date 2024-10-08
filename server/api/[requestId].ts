import { Connection, Keypair } from "@solana/web3.js";
import { marketAbi } from "../../blockchain/abi";
import { programID } from "../../utils/constants";
import { ntobs58 } from "../../utils/nb58";
import { connection } from "../../pinia/user";
import { AnchorProvider, BN, Idl, Program, Wallet } from "@coral-xyz/anchor";
import { BorshCoder } from "@project-serum/anchor";
import { CoinDecimals, CoinPayment } from "../../types";

export default defineEventHandler(async (event) => {
  const requestId = (event.context.params as any).requestId;
  const env = useRuntimeConfig().public;
  const preflightCommitment = "processed";

  const wallet = new Wallet(Keypair.generate());

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
