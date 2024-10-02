import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const getEvmAddress = async (account_id: string) => {
  return account_id;
};

export const lamportsToSol = (lamports: any) => {
  return +lamports / LAMPORTS_PER_SOL;
};
export const solToLamports = (sol: any) => {
  return +sol * LAMPORTS_PER_SOL;
};
