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
  REQUEST_PAYMENT_COUNTER_PUBKEY,
  USER_COUNTER_PUBKEY,
  USER_TAG,
} from "@/utils/constants";
import { useStoreStore } from "./store";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { AnchorWallet, useAnchorWallet, useWallet } from "solana-wallets-vue";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { AnchorProvider, BN, Idl, Program } from "@project-serum/anchor";
import { marketAbi } from "@/blockchain/abi";
import { programID } from "@/utils/constants";

type UserStore = {
  accountId: string | null;
  userDetails?: BlockchainUser;
  storeDetails?: Store[];
  blockchainError: {
    userNotFound: boolean;
    message?: string;
  };
  locationEnabled: boolean;
  anchorWallet: AnchorWallet | undefined;
};

const env = useRuntimeConfig().public;
const preflightCommitment = "processed";
export const connection = new Connection(env.solanaRpcUrl, preflightCommitment);

export const useUserStore = defineStore(STORE_KEY, {
  state: (): UserStore => ({
    accountId: null,
    userDetails: undefined,
    storeDetails: undefined,
    blockchainError: {
      userNotFound: false,
    },
    locationEnabled: false,
    anchorWallet: undefined,
  }),
  getters: {
    isConnected: (state) => !!state.accountId,
    userId: (state): number | undefined => state.userDetails?.[0],
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
    provider: (state) => {
      const wallet = state.anchorWallet;
      if (!wallet) return;
      return new AnchorProvider(
        connection,
        wallet,
        AnchorProvider.defaultOptions()
      );
    },
    program() {
      if (!this.provider) return;
      return new Program(marketAbi as Idl, programID, this.provider as any);
    },
  },
  actions: {
    async setUpSolanaConnectEvents() {
      const { publicKey, wallet } = useWallet();
      if (!wallet.value) return;
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
        await this.initializeCounters();
        const blockchainUser = await this.fetchUser(publicKey!.value!);

        this.storeUserDetails(blockchainUser);

        this.fetchLocationPreference().then((res) => {
          this.locationEnabled = res;
        });

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
      if (!this.program) {
        throw new Error("Program not initialized");
      }
      return this.program;
    },

    async disconnect() {
      try {
        this.accountId = null;
        this.userDetails = undefined;
        this.storeDetails = undefined;
        this.blockchainError.userNotFound = false;
        this.locationEnabled = false;
        const userCookie = useCookie<User | null>(STORE_KEY_MIDDLEWARE, {
          watch: true,
        });
        userCookie.value = null;
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
    },
    async initializeCounters() {
      const contract = await this.getContract();

      try {
        const userCounter = await contract.account.counter.fetch(
          USER_COUNTER_PUBKEY
        );

        if (userCounter) return;

        await contract.methods
          .initializeCounters() // Corresponds to your instruction name in Rust
          .accounts({
            userCounter: USER_COUNTER_PUBKEY,
            storeCounter: STORE_COUNTER_PUBKEY,
            requestCounter: REQUEST_COUNTER_PUBKEY,
            offerCounter: OFFER_COUNTER_PUBKEY,
            authority: this.anchorWallet!.publicKey!,
            systemProgram: SystemProgram.programId,
          })
          .rpc(); // Send the transaction
      } catch (error) {
        console.error("Error initializing counters:", error);
      }
      try {
        const paymentCounter = await contract.account.counter.fetch(
          REQUEST_PAYMENT_COUNTER_PUBKEY
        );

        if (paymentCounter) return;

        await contract.methods
          .initializeCountersPay() // Corresponds to your instruction name in Rust
          .accounts({
            requestPaymentCounter: REQUEST_PAYMENT_COUNTER_PUBKEY,
            authority: this.anchorWallet!.publicKey!,
            systemProgram: SystemProgram.programId,
          })
          .rpc(); // Send the transaction
      } catch (error) {}
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
          [utf8.encode(USER_TAG), this.anchorWallet!.publicKey!.toBuffer()],
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
            authority: this.anchorWallet!.publicKey!,
          })
          .rpc();

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const blockchainUser = await this.fetchUser(
          this.anchorWallet!.publicKey!
        );
        this.storeUserDetails(blockchainUser);
        this.fetchLocationPreference().then((res) => {
          this.locationEnabled = res;
        });

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
          [utf8.encode(USER_TAG), this.anchorWallet!.publicKey!.toBuffer()],
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
            authority: this.anchorWallet!.publicKey!,
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
    async toggleEnableLocation(value: boolean) {
      try {
        const [profilePda] = findProgramAddressSync(
          [utf8.encode(USER_TAG), this.anchorWallet!.publicKey!.toBuffer()],
          programID
        );
        const contract = await this.getContract();

        const tx = await contract.methods
          .toggleLocation(value)
          .accounts({
            user: profilePda,
            authority: this.anchorWallet!.publicKey!,
          })
          .rpc();
        this.locationEnabled = value;
      } catch (error) {
        console.error("Error updating user:", error);
        throw error;
      }
    },
    async fetchLocationPreference(): Promise<boolean> {
      try {
        const contract = await this.getContract();
        const [profilePda] = findProgramAddressSync(
          [utf8.encode(USER_TAG), this.anchorWallet!.publicKey!.toBuffer()],
          programID
        );
        const userData = await contract.account.user.fetch(profilePda);
        return userData.locationEnabled;
      } catch (error) {
        console.error("Error fetching location preference:", error);
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
          userAddress: user_.account.authority.toBase58(),
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
      "locationEnabled",
      "storeDetails.name",
      "storeDetails.description",
      "storeDetails.location",
    ],
    async afterRestore(context) {
      context.store.anchorWallet = useAnchorWallet();
      if (context.store.accountId) {
        await context.store.setUpSolanaConnectEvents();
      }
    },
  },
});
