import { defineStore } from "pinia";
import { CreateStoreDTO, Store, STORE_STORE_KEY } from "@/types";
import { useUserStore } from "./user";
import {
  LOCATION_DECIMALS,
  STORE_COUNTER_PUBKEY,
  USER_TAG,
} from "@/utils/constants";
import { getEvmAddress } from "@/utils/contract-utils";
import { SystemProgram } from "@solana/web3.js";
import { useWallet } from "solana-wallets-vue";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { BN } from "@project-serum/anchor";
import { ntobs58 } from "@/utils/nb58";
import { programID } from "@/utils/constants";
const { publicKey, wallet } = useWallet();
export const useStoreStore = defineStore(STORE_STORE_KEY, {
  state: () => ({}),
  getters: {},
  actions: {
    async createStore({
      name,
      description,
      phone,
      latitude,
      longitude,
    }: CreateStoreDTO): Promise<any | undefined> {
      const userStore = useUserStore();
      try {
        const payload = {
          name,
          description,
          phone,
          long: Math.trunc(longitude * 10 ** LOCATION_DECIMALS),
          lat: Math.trunc(latitude * 10 ** LOCATION_DECIMALS),
        };

        const contract = await userStore.getContract();

        const [profilePda, _] = findProgramAddressSync(
          [utf8.encode(USER_TAG), publicKey.value!.toBuffer()],
          programID
        );

        const storeCounter = await contract.account.counter.fetch(
          STORE_COUNTER_PUBKEY
        );

        const [storePda] = findProgramAddressSync(
          [
            utf8.encode(STORE_TAG),
            publicKey.value!.toBuffer(),
            Buffer.from(storeCounter.current.toArray("le", 8)),
          ],
          programID
        );

        const receipt = await contract.methods
          .createStore(
            payload.name,
            payload.description,
            payload.phone,
            new BN(payload.lat.toString()),
            new BN(payload.long.toString())
          )
          .accounts({
            user: profilePda,
            systemProgram: SystemProgram.programId,
            storeCounter: STORE_COUNTER_PUBKEY,
            authority: publicKey!.value!,
            store: storePda,
          })
          .rpc();

        userStore.storeDetails = [
          {
            name: payload.name,
            description: payload.description,
            phone: payload.phone,
            location: [payload.long, payload.lat],
          },
        ];
        return receipt;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    async getUserStores(accountId: string): Promise<Store[] | undefined> {
      const userStore = useUserStore();
      const contract = await userStore.getContract();
      try {
        const stores = await contract.account.store.all([
          {
            memcmp: {
              offset: 8 + 0,
              bytes: accountId,
            },
          },
        ]);

        const response: Store[] = stores.map((store) => {
          return {
            id: store.account.id.toString(),
            name: store.account.name,
            description: store.account.description,
            phone: store.account.phone,
            location: [
              Number(store.account.location.longitude.toString()),
              Number(store.account.location.latitude.toString()),
            ],
          };
        });

        userStore.storeDetails = response;
        return response;
      } catch (error) {
        console.error(error);
      }
    },
  },
});
