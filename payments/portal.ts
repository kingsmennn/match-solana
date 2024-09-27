import Portal from "@portal-hq/web";
const env = useRuntimeConfig().public;
export const portal = new Portal({
  apiKey: "YOUR-CLIENT-API-KEY",
  autoApprove: true,
  rpcConfig: {
    "eip155:1": "YOUR-INFURA-OR-ALCHEMY-URL",
    "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp":
      "https://api.mainnet-beta.solana.com",
  },
  host: "YOUR-CUSTOM-SUBDOMAN", // Set this once you've defined your custom subdomain
});
