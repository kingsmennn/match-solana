import { defineStore } from "pinia";
import { CreateStoreDTO, Store, STORE_STORE_KEY } from "@/types";
import { useUserStore } from "./user";
import { LOCATION_DECIMALS } from "@/utils/constants";
import { getEvmAddress } from "@/utils/contract-utils";

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

        const receipt = await contract.createStore(
          payload.name,
          payload.description,
          payload.phone,
          payload.lat.toString(),
          payload.long.toString()
        );

        // save to store
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
      }
    },
    async getUserStores(accountId: string): Promise<Store[] | undefined> {
      const userStore = useUserStore();

      try {
        const userAddress = await getEvmAddress(accountId);
        const contract = await userStore.getContract();
        const storeCount = await contract.userStoreCount(userAddress);
        const stores = [];
        for (let i = 0; i < storeCount; i++) {
          const storeId = await contract.userStoreIds(userAddress, i);
          const store = await contract.userStores(userAddress, storeId);
          stores.push(store);
        }
        // save to store
        userStore.storeDetails = stores
        return stores;
      } catch (error) {
        console.error(error);
      }
    },
    async getUserStoreIds(accountId: string, index: number) {
      const userStore = useUserStore();

      const userAddress = await getEvmAddress(accountId);
      const contract = await userStore.getContract();
      const storeIds = await contract.userStoreIds(userAddress, index);
      return storeIds;
    },
    async getUserStore(accountId: string, storeId: number) {
      const userStore = useUserStore();

      const userAddress = await getEvmAddress(accountId);
      const contract = await userStore.getContract();
      const store = await contract.userStores(userAddress, storeId);
      return store;
    },
  },
});
