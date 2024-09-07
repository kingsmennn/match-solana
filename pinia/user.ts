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
  USER_COUNTER_PUBKEY,
  USER_TAG,
} from "@/utils/constants";
import { useStoreStore } from "./store";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { useAnchorWallet, useWallet } from "solana-wallets-vue";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { AnchorProvider, BN, Idl, Program } from "@project-serum/anchor";
import { marketAbi } from "@/blockchain/abi";

type UserStore = {
  accountId: string | null;
  userDetails?: BlockchainUser;
  storeDetails?: Store[];
  blockchainError: {
    userNotFound: boolean;
    message?: string;
  };
};

const env = useRuntimeConfig().public;
const wallet = useAnchorWallet();
export const programID = new PublicKey(env.contractId);
const preflightCommitment = "processed";
const connection = new Connection(env.solanaRpcUrl, preflightCommitment);
const provider = computed(() => {
  if (!wallet.value) return;
  return new AnchorProvider(
    connection,
    wallet.value,
    AnchorProvider.defaultOptions()
  );
});
const program = computed(() => {
  if (!provider.value) return;
  return new Program(marketAbi as Idl, programID, provider.value);
});

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
        ? !!state.userDetails?.[3][0] // buyers only need to give access to their location
        : !!state?.storeDetails?.[0]?.name; // sellers need to set up their store
    },
    username: (state) => state.userDetails?.[1],
    phone: (state) => state.userDetails?.[2],
    location: (state) => state.userDetails?.[3],
    accountType: (state) => state.userDetails?.[6],
  },
  actions: {
    async setUpSolanaConnectEvents() {
      const { publicKey, wallet } = useWallet();

      const walletAdapter = wallet.value!.adapter;

      walletAdapter.on("connect", (newPublicKey) => {
        this.blockchainError.userNotFound = false;
        this.accountId = newPublicKey.toBase58();
        this.connectToSolana();
      });

      walletAdapter.on("disconnect", () => {
        this.disconnect();
      });
    },
    async connectToSolana() {
      const { publicKey, wallet } = useWallet();

      try {
        // Set the account ID (address)
        this.accountId = publicKey!.value!.toString();

        const blockchainUser = await this.fetchUser(publicKey!.value!);

        this.storeUserDetails(blockchainUser);

        // If the user is a seller, fetch their store details
        if (this.accountType === AccountType.SELLER) {
          const storeStore = useStoreStore();
          const res = await storeStore.getUserStores(this.accountId!);
          this.storeDetails = res || [];
        }
      } catch (error) {
        console.error("Failed to connect to Solana Wallet:", error);
      }
    },
    async getContract() {
      if (!program.value) {
        throw new Error("Program not initialized");
      }
      return program.value;
    },

    async disconnect() {
      this.accountId = null;
      this.userDetails = undefined;
      this.blockchainError.userNotFound = false;
    },

    async fetchUser(account_id: PublicKey): Promise<any> {
      const contract = await this.getContract();
      const [profilePda, _] = findProgramAddressSync(
        [utf8.encode(USER_TAG), account_id.toBuffer()],
        programID
      );

      try {
        const userData = await contract.account.user.fetch(profilePda);

        const accountType = Object.keys(userData.accountType)[0];

        const results = [
          Number(userData.id),
          userData.username,
          userData.phone,
          [
            Number(userData.location.longitude),
            Number(userData.location.latitude),
          ],
          Number(userData.createdAt),
          Number(userData.updatedAt),
          Number(accountType === AccountType.BUYER ? 0 : 1),
        ];

        return results;
      } catch (error) {
        return [0, "", "", [0, 0], 0, 0, 0];
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
    }: CreateUserDTO): Promise<string | undefined> {
      try {
        const [profilePda, _] = findProgramAddressSync(
          [utf8.encode(USER_TAG), wallet!.value!.publicKey!.toBuffer()],
          programID
        );

        const contract = await this.getContract();

        const latitude = new BN(
          Math.trunc(lat * 10 ** LOCATION_DECIMALS).toString()
        );
        const longitude = new BN(
          Math.trunc(long * 10 ** LOCATION_DECIMALS).toString()
        );

        const tx = await contract.methods
          .createUser(username, phone, latitude, longitude, {
            [account_type]: {},
          })
          .accounts({
            user: profilePda,
            systemProgram: SystemProgram.programId,
            userCounter: USER_COUNTER_PUBKEY,
            authority: wallet!.value!.publicKey!,
          })
          .rpc();

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const blockchainUser = await this.fetchUser(wallet!.value!.publicKey!);
        this.storeUserDetails(blockchainUser);

        this.blockchainError.userNotFound = false;
        return tx;
      } catch (error) {
        console.error("Error creating user:", error);
        throw error;
      }
    },

    async updateUser({
      username,
      phone,
      lat,
      long,
      account_type,
    }: Partial<CreateUserDTO>): Promise<
      { tx: string; location: Location } | undefined
    > {
      try {
        const [profilePda] = findProgramAddressSync(
          [utf8.encode(USER_TAG), wallet!.value!.publicKey!.toBuffer()],
          programID
        );

        const contract = await this.getContract();

        const payload = {
          username: username || this.userDetails?.[1],
          phone: phone || this.userDetails?.[2],
          lat: new BN(
            Math.trunc(
              (lat || this.userDetails?.[3][1]!) * 10 ** LOCATION_DECIMALS
            ).toString()
          ),
          lng: new BN(
            Math.trunc(
              (long || this.userDetails?.[3][0]!) * 10 ** LOCATION_DECIMALS
            ).toString()
          ),
          account_type: {
            [account_type ?? "buyer"]: {},
          },
        };

        const tx = await contract.methods
          .updateUser(
            payload.username,
            payload.phone,
            payload.lat,
            payload.lng,
            payload.account_type
          )
          .accounts({
            user: profilePda,
            authority: wallet!.value!.publicKey!,
          })
          .rpc();

        return {
          tx,
          location: [Number(payload.lng), Number(payload.lat)],
        };
      } catch (error) {
        console.error("Error updating user:", error);
        throw error;
      }
    },
    async fetchUserById(userId: number) {
      const contract = await this.getContract();
      try {
        const userInfo = await contract.account.user.all([
          {
            memcmp: {
              offset: 8 + 0,
              bytes: ntobs58(userId),
            },
          },
        ]);

        const user_ = userInfo[0];

        const userStores = await contract.account.store.all([
          {
            memcmp: {
              offset: 8 + 0,
              bytes: user_.account.authority,
            },
          },
        ]);

        const user: any = {
          id: user_.account.id.toString(),
          username: user_.account.username,
          phone: user_.account.phone,
          location: [
            user_.account.location.longitude.toString(),
            user_.account.location.latitude.toString(),
          ],
          createdAt: new Date(user_.account.createdAt.toString() * 1000),
          updatedAt: new Date(user_.account.updatedAt.toString() * 1000),
          accountType: Object.keys(user_.account.accountType)[0],
        };

        user.stores = userStores.map((store: any) => {
          return {
            id: store.account.id.toString(),
            name: store.account.name,
            description: store.account.description,
            phone: store.account.phone,
            location: [
              store.account.location.longitude.toString(),
              store.account.location.latitude.toString(),
            ],
          };
        });

        return user;
      } catch (error) {
        console.log({ error });
      }
    },

    async getUserLocation() {
      const env = useRuntimeConfig().public;

      const requestBody = {
        considerIp: true, // Uses the IP address if no other data is available
        // Optionally, you can provide information about WiFi access points and cell towers
      };

      const response = await $fetch(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${env.googleMapsApiKey}`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response as {
        location: {
          lat: number;
          lng: number;
        };
        accuracy: number;
      };
    },
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
      if (context.store.accountId) {
        await context.store.setUpSolanaConnectEvents();
      }
    },
  },
});
