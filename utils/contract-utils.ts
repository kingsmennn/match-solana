import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const env = useRuntimeConfig().public;
export const getEvmAddress = async (account_id: string) => {
  return account_id;
};

export const lamportsToSol = (lamports: any) => {
  return +lamports / LAMPORTS_PER_SOL;
};
export const solToLamports = (sol: any) => {
  return +sol * LAMPORTS_PER_SOL;
};

export const buildSolanaTransaction = async (body: any): Promise<Response> => {
  const data = await fetch(
    `https://api.portalhq.io/api/v3/clients/me/chains/${env.solanaChainId}/assets/send/build-transaction`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.portalClientApiKey}`,
      },
      body: body,
    }
  );

  return data;
};
