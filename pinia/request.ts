import { defineStore } from "pinia";
import {
  CreateOfferDTO,
  CreateRequestDTO,
  Offer,
  RequestResponse,
} from "@/types";

import { programID, useUserStore } from "./user";
import {
  OFFER_COUNTER_PUBKEY,
  OFFER_TAG,
  REQUEST_COUNTER_PUBKEY,
  REQUEST_TAG,
  USER_TAG,
} from "@/utils/constants";
import { request } from "http";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { useWallet } from "solana-wallets-vue";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { off } from "process";

type RequestsStoreType = {
  list: RequestResponse[];
};
export const useRequestsStore = defineStore("requests", {
  state: (): RequestsStoreType => ({
    list: [],
  }),
  getters: {
    hasLocked() {
      return ({ updatedAt, period }: { updatedAt: Date; period: number }) => {
        const updatedAtTime = updatedAt.getTime();
        const currentTime = Date.now();

        return currentTime >= updatedAtTime + period;
      };
    },
  },
  actions: {
    async createRequest({
      name,
      description,
      images,
      latitude,
      longitude,
    }: CreateRequestDTO): Promise<any | undefined> {
      const userStore = useUserStore();
      const { publicKey } = useWallet();

      try {
        const contract = await userStore.getContract();

        const [profilePda, _] = findProgramAddressSync(
          [utf8.encode(USER_TAG), publicKey.value!.toBuffer()],
          programID
        );

        const requestCounter = await contract.account.counter.fetch(
          REQUEST_COUNTER_PUBKEY
        );

        const [requestPda] = findProgramAddressSync(
          [
            utf8.encode(REQUEST_TAG),
            publicKey.value!.toBuffer(),
            new BN(requestCounter.current).toArrayLike(Buffer, "be", "2"),
          ],
          programID
        );

        const receipt = await contract.methods
          .createRequest(
            name,
            description,
            images,
            new BN(Math.trunc(latitude)),
            new BN(Math.trunc(longitude))
          )
          .accounts({
            user: profilePda,
            systemProgram: SystemProgram.programId,
            requestCounter: REQUEST_COUNTER_PUBKEY,
            authority: publicKey.value!,
            request: requestPda,
          })
          .rpc();
        return receipt;
      } catch (error) {
        console.error(error);
      }
    },
    async fetchAllUserRequests(accountId: string) {
      try {
        const userStore = useUserStore();
        const contract = await userStore.getContract();

        const userRequests = await contract.account.request.all([
          {
            memcmp: {
              offset: 8 + 0,
              bytes: accountId,
            },
          },
        ]);
        return userRequests;
      } catch (error) {
        console.log({ error });
      }
    },
    async fetchAllSellersRequests(accountId: string) {
      const env = useRuntimeConfig().public;
      const userAddress = await getEvmAddress(accountId);

      try {
        const res = await $fetch<RequestResponse[]>(
          `${env.matchApiUrl}/accepted-requests/${userAddress}`,
          {
            method: "GET",
          }
        );
        this.list = res;
        return res;
      } catch (error) {
        console.log({ error });
      }
    },
    async getRequest(requestId: number) {
      const userStore = useUserStore();

      try {
        const contract = await userStore.getContract();

        const requests = await contract.account.request.all([
          {
            memcmp: {
              offset: 8 + 32,
              bytes: requestId.toString(),
            },
          },
        ]);

        const request: RequestResponse = {
          requestId: 0,
          requestName: "",
          buyerId: 0,
          sellersPriceQuote: 0,
          lockedSellerId: 0,
          description: "",
          lifecycle: 0,
          longitude: 0,
          latitude: 0,
          createdAt: 0,
          updatedAt: 0,
          images: [],
        };

        const images = await this.getRequestImages(request.requestId);
        request.images = images || [];
        return request;
      } catch (error) {
        console.log(error);
      }
    },
    async getRequestImages(request_id: number): Promise<string[] | undefined> {
      const userStore = useUserStore();

      const contract = await userStore.getContract();
      // const length = await contract.getRequestImagesLength(request_id);

      // const images = [];
      // for (let i = 0; i < length; i++) {
      //   const image = await contract.getRequestImageByIndex(request_id, i);
      //   images.push(image);
      // }
      return [];
    },

    // SELLERS
    async fetchNearbyRequestsForSellers({
      lat,
      long,
    }: {
      lat: number;
      long: number;
    }) {
      const env = useRuntimeConfig().public;

      try {
        const res = await $fetch<RequestResponse[]>(
          `${env.matchApiUrl}/requests`,
          {
            method: "POST",
            body: {
              sellerLat: lat,
              sellerLong: long,
            },
          }
        );

        this.list = res;
        return res;
      } catch (error) {
        console.log({ error });
      }
    },
    async createOffer({
      price,
      images,
      requestId,
      storeName,
    }: CreateOfferDTO): Promise<any | undefined> {
      const userStore = useUserStore();
      const { publicKey } = useWallet();
      const env = useRuntimeConfig().public;

      try {
        const contract = await userStore.getContract();
        const [profilePda, _] = findProgramAddressSync(
          [utf8.encode(USER_TAG), publicKey.value!.toBuffer()],
          programID
        );

        const offerCounter = await contract.account.counter.fetch(
          OFFER_COUNTER_PUBKEY
        );

        const requestMade = await contract.account.request.all([
          {
            memcmp: {
              offset: 8 + 32,
              bytes: requestId.toString(),
            },
          },
        ]);

        const request = requestMade[0];

        const [offerPda] = findProgramAddressSync(
          [
            utf8.encode(OFFER_TAG),
            publicKey.value!.toBuffer(),
            new BN(offerCounter.current).toArrayLike(Buffer, "be", "2"),
          ],
          programID
        );

        const receipt = await contract.methods
          .createOffer(price, images, requestId, storeName)
          .accounts({
            user: profilePda,
            systemProgram: SystemProgram.programId,
            offerCounter: OFFER_COUNTER_PUBKEY,
            authority: publicKey.value!,
            request: request.publicKey,
            offer: offerPda,
          })
          .rpc();

        return receipt;
      } catch (error) {
        console.error(error);
      }
    },
    async acceptOffer(offerId: number): Promise<any | undefined> {
      const userStore = useUserStore();
      const { publicKey } = useWallet();
      try {
        const [profilePda, _] = findProgramAddressSync(
          [utf8.encode(USER_TAG), publicKey.value!.toBuffer()],
          programID
        );
        const contract = await userStore.getContract();

        const offerMade = await contract.account.offer.all([
          {
            memcmp: {
              offset: 8 + 32,
              bytes: offerId.toString(),
            },
          },
        ]);

        const offer = offerMade[0];

        const requestMade = await contract.account.request.all([
          {
            memcmp: {
              offset: 8 + 32,
              bytes: (offer as any).requestId.toString(),
            },
          },
        ]);

        const request = requestMade[0];

        const receipt = await contract.methods
          .acceptOffer()
          .accounts({
            user: profilePda,
            systemProgram: SystemProgram.programId,
            authority: publicKey.value!,
            offer: offer.publicKey,
            request: request.publicKey,
          })
          .rpc();
        return receipt;
      } catch (error) {
        console.error(error);
      }
    },
    async fetchAllOffers(requestId: number) {
      const env = useRuntimeConfig().public;

      try {
        const res = await $fetch<Offer[]>(
          `${env.matchApiUrl}/offers/${requestId}`,
          {
            method: "GET",
          }
        );
        // this.list = res
        return res;
      } catch (error) {
        console.log({ error });
      }
    },
  },
});
