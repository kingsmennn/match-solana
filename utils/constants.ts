import { PublicKey } from "@solana/web3.js";

export const chainName = "Sepolia";
const env = useRuntimeConfig().public;

const chains: {
  [key: number]: {
    name: string;
    chainId: number;
    blockExplorer: string;
  };
} = {
  11155111: {
    name: "Sepolia",
    chainId: 11155111,
    blockExplorer: "https://sepolia.etherscan.io",
  },
  80002: {
    name: "Amoy",
    chainId: 80002,
    blockExplorer: "https://amoy.polygonscan.com/",
  },
  97: {
    name: "BSC Testnet",
    chainId: 97,
    blockExplorer: "https://testnet.bscscan.com",
  },
  1337: {
    name: "BSC Testnet",
    chainId: 1337,
    blockExplorer: "https://testnet.bscscan.com",
  },
};

export const chainInfo = chains[+env.chainId];

export const LOCATION_DECIMALS = 18;
export const PROJECT_ID = "73801621aec60dfaa2197c7640c15858";
export const DEBUG = true;
export const appMetaData = {
  name: "Finder",
  description:
    "Finder is a blockchain application that allows buyers to find the best deals on products they want to buy.",
  icons: [window.location.origin + "/favicon.ico"],
  url: window.location.origin,
};

export const TIME_TILL_LOCK = 15 * 60 * 1000; // mss

export const USER_TAG = "USER_STATE";

export const ADMIN_TAG = "ADMIN_TAG";

export const STORE_TAG = "STORE_STATE";

export const REQUEST_TAG = "REQUEST_STATE";

export const OFFER_TAG = "OFFER_STATE";

export const USER_COUNTER = "USER_COUNTER";

export const STORE_COUNTER = "STORE_COUNTER";

export const REQUEST_COUNTER = "REQUEST_COUNTER";

export const OFFER_COUNTER = "OFFER_COUNTER";

export const USER_COUNTER_PUBKEY = new PublicKey(
  "5sddT4AzjpYGpw9kFNGkk8jN4gxY7ptYjkjb8qVv6vas"
);

export const STORE_COUNTER_PUBKEY = new PublicKey(
  "3dasQGBqSYaiiManp4xhymJfxrVVodb1hY438NoHBTtS"
);

export const REQUEST_COUNTER_PUBKEY = new PublicKey(
  "ETETC6gEtjrmD34zrapJeqgBzBkW2ERL3sGRpH5KRSzC"
);

export const OFFER_COUNTER_PUBKEY = new PublicKey(
  "DbKA8yJ8uZHWMh71vRSkroJUAgsrxLta1D275YtcZs1c"
);
