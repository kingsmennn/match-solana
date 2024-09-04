import { defineStore } from "pinia";
import {
  CreateOfferDTO,
  CreateRequestDTO,
  Offer,
  RequestResponse,
} from "@/types";

import { useUserStore } from "./user";

type RequestsStoreType = {
  list: RequestResponse[];
};
export const useRequestsStore = defineStore("requests", {
  state: (): RequestsStoreType => ({
    list: [],
  }),
  getters: {
    hasLocked() {
      return ({updatedAt, period}:{updatedAt: Date, period: number}) => {
        const updatedAtTime = updatedAt.getTime()
        const currentTime = Date.now();
        
        // Check if the duration plus updatedAt has passed the current time
        return currentTime >= updatedAtTime + period;
      }
    }
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

      const env = useRuntimeConfig().public;

      try {
        const contract = await userStore.getContract();

        // console.log({
        //   name: name,
        //   description: description,
        //   images: images,
        //   latitude: latitude.toString(),
        //   longitude: longitude.toString()
        // })

        const receipt = await contract.createRequest(
          name,
          description,
          images,
          latitude.toString(),
          longitude.toString()
        );
        return receipt;
      } catch (error) {
        console.error(error);
      }
    },
    async fetchAllUserRequests(accountId: string) {
      const env = useRuntimeConfig().public;
      const userAddress = await getEvmAddress(accountId);

      try {
        const res = await $fetch<RequestResponse[]>(
          `${env.matchApiUrl}/requests/${userAddress}`,
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
        const res = await contract.requests(requestId);

        const request: RequestResponse = {
          requestId: Number(res[0]),
          requestName: res[1],
          buyerId: Number(res[2]),
          sellersPriceQuote: Number(res[3]),
          lockedSellerId: Number(res[4]),
          description: res[5],
          lifecycle: Number(res[7]),
          longitude: Number(res[8][0]),
          latitude: Number(res[8][1]),
          createdAt: Number(res[6]),
          updatedAt: Number(res[9]),
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
      const length = await contract.getRequestImagesLength(request_id);

      const images = [];
      for (let i = 0; i < length; i++) {
        const image = await contract.getRequestImageByIndex(request_id, i);
        images.push(image);
      }
      return images;
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

      const env = useRuntimeConfig().public;

      try {
        const contract = await userStore.getContract();

        const receipt = await contract.createOffer(
          price,
          images,
          requestId,
          storeName
        );

        return receipt;
      } catch (error) {
        console.error(error);
      }
    },
    async acceptOffer(offerId: number): Promise<any | undefined> {
      const userStore = useUserStore();

      // const env = useRuntimeConfig().public;
      console.log({ offerId });

      try {
        const contract = await userStore.getContract();

        const receipt = await contract.acceptOffer(offerId);
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
