export enum AccountType {
  BUYER = "buyer",
  SELLER = "seller",
}
export enum CoinPayment {
  SOLANA = "solana",
  PyUSDT = "pyusdt",
}

export const CoinDecimals = {
  [CoinPayment.SOLANA]: 9,
  [CoinPayment.PyUSDT]: 6,
};

export type Location = [
  // state: string
  // lga: string
  // market?: string
  longitude: number,
  latitude: number
];
export type User = {
  id?: string;
  username: string;
  // email: string
  phone: string;
  location: Location;
  createdAt: Date;
  updatedAt: Date;
  accountType: AccountType;
  stores?: Store[];
};
export type Store = {
  id?: number;
  name: string;
  description?: string;
  phone: string;
  location: Location;
};

export enum RequestLifecycle {
  PENDING = "pending",
  ACCEPTED_BY_SELLER = "accepted_by_seller",
  ACCEPTED_BY_BUYER = "accepted_by_buyer",
  REQUEST_LOCKED = "request_locked",
  PAID = "paid",
  COMPLETED = "completed",
}
export enum RequestLifecycleIndex {
  PENDING,
  ACCEPTED_BY_SELLER,
  ACCEPTED_BY_BUYER,
  REQUEST_LOCKED,
  PAID,
  COMPLETED,
}

export type Request = {
  id?: number;
  name: string;
  buyerId: string;
  sellersPriceQuote?: number;
  sellerIds?: string[];
  lockedSellerId?: string;
  description: string;
  images: string[];
  createdAt: Date;
  lifecycle: RequestLifecycle;
  market: string;
  lga: string;
  state: string;
  updatedAt: Date;
  acceptedOfferId?: number;
  paid?: boolean;
};

export type RequestResponse = {
  _id?: string;
  transactionHash?: string;
  address?: string;
  buyerAddress?: string;
  images: string[];
  lifecycle: RequestLifecycleIndex;
  requestId: number;
  signature?: string;
  createdAt: number;
  updatedAt: number;
  buyerId: number;
  description: string;
  requestName: string;
  sellerIds?: number[];
  lockedSellerId?: number;
  longitude: number;
  latitude: number;
  sellersPriceQuote?: number;
};

export type Offer = {
  id?: number;
  offerId?: number;
  price: number;
  images: string[];
  requestId: number;
  storeName: string;
  sellerId: number;
  isAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// contract types
export type CreateUserDTO = {
  username: string;
  phone: string;
  lat: number;
  long: number;
  account_type: AccountType;
};

type id = number;
type username = string;
type phone = string;
type createdAt = number;
type updatedAt = number;
export type BlockchainUser = [
  id,
  username,
  phone,
  Location,
  createdAt,
  updatedAt,
  AccountType
];

export type CreateStoreDTO = {
  name: string;
  description: string;
  phone: string;
  latitude: number;
  longitude: number;
};

export type CreateRequestDTO = {
  name: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
};

export type CreateOfferDTO = {
  price: number;
  images: string[];
  requestId: number;
  storeName: string;
};

export const STORE_KEY = "@userStore";
export const STORE_KEY_MIDDLEWARE = "@userStoreMiddleware";

export const STORE_STORE_KEY = "@StoreStore";
