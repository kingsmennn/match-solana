export const marketAbi = {
  version: "0.1.0",
  name: "marketplace",
  constants: [
    {
      name: "USER_TAG",
      type: "bytes",
      value: "[85, 83, 69, 82, 95, 83, 84, 65, 84, 69]",
    },
    {
      name: "ADMIN_TAG",
      type: "bytes",
      value: "[65, 68, 77, 73, 78, 95, 84, 65, 71]",
    },
    {
      name: "STORE_TAG",
      type: "bytes",
      value: "[83, 84, 79, 82, 69, 95, 83, 84, 65, 84, 69]",
    },
    { name: "TIME_TO_LOCK", type: "u64", value: "900" },
    {
      name: "REQUEST_TAG",
      type: "bytes",
      value: "[82, 69, 81, 85, 69, 83, 84, 95, 83, 84, 65, 84, 69]",
    },
    {
      name: "OFFER_TAG",
      type: "bytes",
      value: "[79, 70, 70, 69, 82, 95, 83, 84, 65, 84, 69]",
    },
    {
      name: "USER_COUNTER",
      type: "bytes",
      value: "[85, 83, 69, 82, 95, 67, 79, 85, 78, 84, 69, 82]",
    },
    {
      name: "STORE_COUNTER",
      type: "bytes",
      value: "[83, 84, 79, 82, 69, 95, 67, 79, 85, 78, 84, 69, 82]",
    },
    {
      name: "REQUEST_COUNTER",
      type: "bytes",
      value: "[82, 69, 81, 85, 69, 83, 84, 95, 67, 79, 85, 78, 84, 69, 82]",
    },
    {
      name: "OFFER_COUNTER",
      type: "bytes",
      value: "[79, 70, 70, 69, 82, 95, 67, 79, 85, 78, 84, 69, 82]",
    },
  ],
  instructions: [
    {
      name: "initializeCounters",
      accounts: [
        { name: "userCounter", isMut: true, isSigner: false },
        { name: "storeCounter", isMut: true, isSigner: false },
        { name: "requestCounter", isMut: true, isSigner: false },
        { name: "offerCounter", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "createUser",
      accounts: [
        { name: "user", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "userCounter", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "username", type: "string" },
        { name: "phone", type: "string" },
        { name: "latitude", type: "i64" },
        { name: "longitude", type: "i64" },
        { name: "accountType", type: { defined: "AccountType" } },
      ],
    },
    {
      name: "updateUser",
      accounts: [
        { name: "user", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
      ],
      args: [
        { name: "username", type: "string" },
        { name: "phone", type: "string" },
        { name: "latitude", type: "i64" },
        { name: "longitude", type: "i64" },
        { name: "accountType", type: { defined: "AccountType" } },
      ],
    },
    {
      name: "createStore",
      accounts: [
        { name: "user", isMut: true, isSigner: false },
        { name: "store", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "storeCounter", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "name", type: "string" },
        { name: "description", type: "string" },
        { name: "phone", type: "string" },
        { name: "latitude", type: "i64" },
        { name: "longitude", type: "i64" },
      ],
    },
    {
      name: "createRequest",
      accounts: [
        { name: "user", isMut: true, isSigner: false },
        { name: "request", isMut: true, isSigner: false },
        { name: "requestCounter", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "name", type: "string" },
        { name: "description", type: "string" },
        { name: "images", type: { vec: "string" } },
        { name: "latitude", type: "i64" },
        { name: "longitude", type: "i64" },
      ],
    },
    {
      name: "createOffer",
      accounts: [
        { name: "user", isMut: true, isSigner: false },
        { name: "request", isMut: true, isSigner: false },
        { name: "offer", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "offerCounter", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "price", type: "i64" },
        { name: "images", type: { vec: "string" } },
        { name: "storeName", type: "string" },
      ],
    },
    {
      name: "acceptOffer",
      accounts: [
        { name: "user", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "offer", isMut: true, isSigner: false },
        { name: "request", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "User",
      type: {
        kind: "struct",
        fields: [
          { name: "id", type: "u64" },
          { name: "username", type: "string" },
          { name: "phone", type: "string" },
          { name: "location", type: { defined: "Location" } },
          { name: "createdAt", type: "i64" },
          { name: "updatedAt", type: "i64" },
          { name: "accountType", type: { defined: "AccountType" } },
          { name: "authority", type: "publicKey" },
        ],
      },
    },
    {
      name: "Store",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "id", type: "u64" },
          { name: "name", type: "string" },
          { name: "description", type: "string" },
          { name: "phone", type: "string" },
          { name: "location", type: { defined: "Location" } },
        ],
      },
    },
    {
      name: "Request",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "id", type: "u64" },
          { name: "name", type: "string" },
          { name: "buyerId", type: "u64" },
          { name: "description", type: "string" },
          { name: "images", type: { vec: "string" } },
          { name: "sellersPriceQuote", type: "i64" },
          { name: "sellerIds", type: { vec: "u64" } },
          { name: "offerIds", type: { vec: "u64" } },
          { name: "lockedSellerId", type: "u64" },
          { name: "location", type: { defined: "Location" } },
          { name: "createdAt", type: "u64" },
          { name: "updatedAt", type: "u64" },
          { name: "lifecycle", type: { defined: "RequestLifecycle" } },
        ],
      },
    },
    {
      name: "Offer",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "id", type: "u64" },
          { name: "requestId", type: "u64" },
          { name: "price", type: "i64" },
          { name: "images", type: { vec: "string" } },
          { name: "storeName", type: "string" },
          { name: "sellerId", type: "u64" },
          { name: "isAccepted", type: "bool" },
          { name: "createdAt", type: "u64" },
          { name: "updatedAt", type: "u64" },
        ],
      },
    },
    {
      name: "Counter",
      type: { kind: "struct", fields: [{ name: "current", type: "u64" }] },
    },
  ],
  types: [
    {
      name: "Location",
      type: {
        kind: "struct",
        fields: [
          { name: "latitude", type: "i64" },
          { name: "longitude", type: "i64" },
        ],
      },
    },
    {
      name: "AccountType",
      type: { kind: "enum", variants: [{ name: "Buyer" }, { name: "Seller" }] },
    },
    {
      name: "RequestLifecycle",
      type: {
        kind: "enum",
        variants: [
          { name: "Pending" },
          { name: "AcceptedBySeller" },
          { name: "AcceptedByBuyer" },
          { name: "RequestLocked" },
          { name: "Completed" },
        ],
      },
    },
  ],
  events: [
    {
      name: "StoreCreated",
      fields: [
        { name: "sellerAddress", type: "publicKey", index: false },
        { name: "storeId", type: "u64", index: false },
        { name: "storeName", type: "string", index: false },
        { name: "latitude", type: "i64", index: false },
        { name: "longitude", type: "i64", index: false },
      ],
    },
    {
      name: "RequestCreated",
      fields: [
        { name: "requestId", type: "u64", index: false },
        { name: "buyerAddress", type: "publicKey", index: false },
        { name: "requestName", type: "string", index: false },
        { name: "latitude", type: "i64", index: false },
        { name: "longitude", type: "i64", index: false },
        { name: "images", type: { vec: "string" }, index: false },
        { name: "lifecycle", type: "u8", index: false },
        { name: "description", type: "string", index: false },
        { name: "buyerId", type: "u64", index: false },
        { name: "sellerIds", type: { vec: "u64" }, index: false },
        { name: "sellersPriceQuote", type: "i64", index: false },
        { name: "lockedSellerId", type: "u64", index: false },
        { name: "createdAt", type: "u64", index: false },
        { name: "updatedAt", type: "u64", index: false },
      ],
    },
    {
      name: "OfferCreated",
      fields: [
        { name: "offerId", type: "u64", index: false },
        { name: "sellerAddress", type: "publicKey", index: false },
        { name: "storeName", type: "string", index: false },
        { name: "price", type: "i64", index: false },
        { name: "requestId", type: "u64", index: false },
        { name: "images", type: { vec: "string" }, index: false },
        { name: "sellerId", type: "u64", index: false },
        { name: "sellerIds", type: { vec: "u64" }, index: false },
      ],
    },
    {
      name: "RequestAccepted",
      fields: [
        { name: "requestId", type: "u64", index: false },
        { name: "offerId", type: "u64", index: false },
        { name: "sellerId", type: "u64", index: false },
        { name: "updatedAt", type: "u64", index: false },
        { name: "sellersPriceQuote", type: "i64", index: false },
      ],
    },
    {
      name: "OfferAccepted",
      fields: [
        { name: "offerId", type: "u64", index: false },
        { name: "buyerAddress", type: "publicKey", index: false },
        { name: "isAccepted", type: "bool", index: false },
      ],
    },
  ],
  errors: [
    { code: 6000, name: "UserAlreadyExists", msg: "User already exists." },
    { code: 6001, name: "InvalidAccountType", msg: "Invalid account type." },
    { code: 6002, name: "InvalidUser", msg: "Invalid user." },
    { code: 6003, name: "OnlySellersAllowed", msg: "Only sellers allowed." },
    { code: 6004, name: "OnlyBuyersAllowed", msg: "Only buyers allowed." },
    { code: 6005, name: "UnauthorizedBuyer", msg: "Unauthorized buyer." },
    {
      code: 6006,
      name: "OfferAlreadyAccepted",
      msg: "Offer already accepted.",
    },
    { code: 6007, name: "RequestLocked", msg: "Request locked." },
    {
      code: 6008,
      name: "IncorrectNumberOfSellers",
      msg: "Incorrect number of sellers.",
    },
  ],
};
