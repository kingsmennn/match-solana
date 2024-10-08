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


export const decryptWithRSA = async (data: any) => {
  // const decrypted = await window.crypto.subtle.decrypt(
  //   {
  //     name: "RSA-OAEP",
  //   },
  //   decryptionKey,
  //   data
  // );
  // return new TextDecoder().decode(decrypted);
};
