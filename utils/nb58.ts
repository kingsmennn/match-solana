import { BN, utils } from "@project-serum/anchor";

export const ntobs58 = (x: any) => utils.bytes.bs58.encode(new BN(x).toArrayLike(Buffer, 'le', 8));