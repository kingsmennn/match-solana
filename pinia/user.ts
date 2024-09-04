import { ethers } from "ethers";
import { marketAbi } from "@/blockchain/abi";
import { defineStore } from "pinia";
import {
  AccountType,
  BlockchainUser,
  CreateUserDTO,
  STORE_KEY,
  STORE_KEY_MIDDLEWARE,
  User,
  Location,
  Store,
} from "@/types";
import {
  appMetaData,
  chainInfo,
  DEBUG,
  LOCATION_DECIMALS,
  PROJECT_ID,
} from "@/utils/constants";
import { getEvmAddress } from "@/utils/contract-utils";
import { useStoreStore } from "./store";

type UserStore = {
  accountId: string | null;

  userDetails?: BlockchainUser;
  storeDetails?: Store[];
  blockchainError: {
    userNotFound: boolean;
    message?: string;
  };
};

const getProvider = () => {
  const provider = new ethers.BrowserProvider(window.ethereum!);
  return provider;
};

export const useUserStore = defineStore(STORE_KEY, {
  state: (): UserStore => ({
    accountId: null,

    userDetails: undefined,
    storeDetails: undefined,
    blockchainError: {
      userNotFound: false,
    },
  }),
  getters: {
    isConnected: (state) => !!state.accountId,
    isNotOnboarded: (state) =>
      !!state.accountId && state.blockchainError.userNotFound,
    passedSecondaryCheck: (state) => {
      return state.userDetails?.[6] === AccountType.BUYER
        ? // buyers only need to give access to their location
          !!state.userDetails?.[3][0]
        : // sellers need to set up their store
          !!state?.storeDetails?.[0]?.name;
    },
    username: (state) => state.userDetails?.[1],
    phone: (state) => state.userDetails?.[2],
    location: (state) => state.userDetails?.[3],
    accountType: (state) => state.userDetails?.[6],
  },
  actions: {
    async connectToMetaMask() {
      try {
        if (!window.ethereum) {
          throw new Error("MetaMask is not installed");
        }

        // Request account access if needed
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        // Set the account ID (address)
        this.accountId = accounts[0];

        const blockchainUser = await this.fetchUser(this.accountId!);
        this.storeUserDetails(blockchainUser);

        // If the user is a seller, fetch their store details
        if (this.accountType === AccountType.SELLER) {
          const storeStore = useStoreStore();
          const res = await storeStore.getUserStores(this.accountId!);
          this.storeDetails = res || [];
        }
      } catch (error) {
        console.error("Failed to connect to MetaMask:", error);
      }
    },

    async setUpEVMConnectEvents() {
      window.ethereum!.on("accountsChanged", (accounts) => {
        if (!accounts.length) {
          this.disconnect();
        }
        this.accountId = accounts[0];
      });

      window.ethereum!.on("chainChanged", (chainId) => {
        if (chainInfo.chainId !== parseInt(chainId)) {
          this.blockchainError.message = `Please connect to ${chainInfo.name}`;
        }
      });
    },
    async disconnect() {
      this.accountId = null;
      this.userDetails = undefined;
      this.blockchainError.userNotFound = false;
    },

    async getContract() {
      const env = useRuntimeConfig().public;

      const provider = getProvider();

      const signer = await provider.getSigner();

      const network = await provider.getNetwork();
      const chainId = network.chainId;

      if (chainInfo.chainId !== Number(chainId)) {
        const error = `Please connect to ${chainInfo.name}`;
        this.blockchainError.message = error;
        throw error;
      }

      return new ethers.Contract(env.contractId, marketAbi, signer);
    },
    async fetchUser(account_id: string): Promise<BlockchainUser> {
      const contract = await this.getContract();
      const userAddress = await getEvmAddress(account_id);

      const user = await contract.users(userAddress);
      return user;
    },
    async fetchUserById(userId: number) {
      const env = useRuntimeConfig().public;
      try {
        const res = await $fetch<User>(
          `${env.matchApiUrl}/user/${userId}`,
          {
            method: "GET",
          }
        );
        return res;
      } catch (error) {
        console.log({ error });
      }
    },
    async storeUserDetails(user: BlockchainUser) {
      const userCookie = useCookie<User>(STORE_KEY_MIDDLEWARE);

      const hasId = !!user[0];
      if (hasId) {
        const details = {
          id: Number(user[0]),
          username: user[1],
          phone: user[2],
          location: {
            long: Number(user[3][0]),
            lat: Number(user[3][1]),
          },
          createdAt: Number(user[4]),
          updatedAt: Number(user[5]),
          accountType:
            Number(user[6]) === 0 ? AccountType.BUYER : AccountType.SELLER,
        };

        this.userDetails = [
          details.id,
          details.username,
          details.phone,
          [details.location.long, details.location.lat],
          details.createdAt,
          details.updatedAt,
          details.accountType,
        ];

        userCookie.value = {
          id: this.accountId!,
          username: details.username,
          phone: details.phone,
          location: [details.location.long, details.location.lat],
          createdAt: new Date(details.createdAt),
          updatedAt: new Date(details.updatedAt),
          accountType: details.accountType,
        };
        console.log({
          user,
          details,
          storeDetails: this.userDetails,
          cookieDetails: userCookie.value
        })
      } else if (!hasId && this.accountId) {
        this.blockchainError.userNotFound = true;
      }
    },

    async createUser({
      username,
      phone,
      lat,
      long,
      account_type,
    }: CreateUserDTO): Promise<ethers.ContractTransaction | undefined> {
      try {
        const contract = await this.getContract();
        const tx = await contract.createUser(
          username,
          phone,
          ethers.parseUnits(lat.toString(), LOCATION_DECIMALS).toString(),
          ethers.parseUnits(long.toString(), LOCATION_DECIMALS).toString(),
          account_type === AccountType.BUYER ? 0 : 1
        );

        const receipt = await tx.wait();

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const blockchainUser = await this.fetchUser(this.accountId!);
        this.storeUserDetails(blockchainUser);

        this.blockchainError.userNotFound = false;
        return receipt;
      } catch (error) {
        console.error("Error creating user:", error);
      }
    },
    async updateUser({
      username,
      phone,
      lat,
      long,
      account_type,
    }: Partial<CreateUserDTO>): Promise<
      { receipt: ethers.ContractTransaction; location: Location } | undefined
    > {
      const payload = {
        username: username || this.userDetails?.[1],
        phone: phone || this.userDetails?.[2],
        lat: ethers.parseUnits(
          (lat || this.userDetails?.[3][1]!).toString(),
          LOCATION_DECIMALS
        ),
        lng: ethers.parseUnits(
          (long || this.userDetails?.[3][0]!).toString(),
          LOCATION_DECIMALS
        ),
        account_type: account_type === AccountType.BUYER ? 0 : 1
      }
      try {
        const contract = await this.getContract();
        const tx = await contract.updateUser(
          payload.username,
          payload.phone,
          payload.lat,
          payload.lng,
          payload.account_type
        );

        const receipt = await tx.wait();
        return {
          receipt,
          location: [
            Number(payload.lng) || this.userDetails?.[3][0]!,
            Number(payload.lat) || this.userDetails?.[3][1]!,
          ],
        };
      } catch (error) {
        console.error("Error updating user:", error);
      }
    },
    async getUserLocation(){
      const env = useRuntimeConfig().public

      const requestBody = {
        considerIp: true, // Uses the IP address if no other data is available
        // Optionally, you can provide information about WiFi access points and cell towers
      };
    
      const response = await $fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${env.googleMapsApiKey}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response as {
        location: {
          lat: number
          lng: number
        }
        accuracy: number
      }
    }
  },
  persist: {
    paths: [
      "accountId",
      "userDetails",
      "blockchainError.userNotFound",
      "storeDetails.name",
      "storeDetails.description",
      "storeDetails.location",
    ],
    async afterRestore(context) {
      // Reconnect to MetaMask if the user is already connected
      if (context.store.accountId) {
        await context.store.connectToMetaMask();
        await context.store.setUpEVMConnectEvents();
      }
    },
  },
});
