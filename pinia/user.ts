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
import { AnchorProvider, Idl, Program } from "@project-serum/anchor";
import { marketAbi } from "blockchain/abi";

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
const connection = new Connection(clusterApiUrl("devnet"), preflightCommitment);
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
    async connectToSolana() {
      const { publicKey } = useWallet();
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

      const userData = await contract.account.user.fetch(profilePda);
      return userData;
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

        const tx = await contract.methods
          .create_user(username, phone, lat, long, account_type)
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

        const tx = await contract.methods
          .update_user(username, phone, lat, long, account_type)
          .accounts({
            user: profilePda,
            authority: wallet!.value!.publicKey!,
          })
          .rpc();

        return {
          tx,
          location: [0, 0],
        };
      } catch (error) {
        console.error("Error updating user:", error);
      }
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
        await context.store.connectToSolana();
      }
    },
  },
});
