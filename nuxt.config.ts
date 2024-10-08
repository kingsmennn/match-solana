// https://nuxt.com/docs/api/configuration/nuxt-config
// import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt",
    "@pinia-plugin-persistedstate/nuxt",
    "@invictus.codes/nuxt-vuetify",
    "@vueuse/nuxt",
  ],
  build: {
    transpile: ["vue-sonner"],
  },
  css: ["~/assets/css/solana.css"],
  vite: {
    esbuild: {
      target: "esnext",
    },
    plugins: [
      // nodePolyfills({
      //   globals: {
      //     global: true,
      //     Buffer: true,
      //     process: true,
      //   },
      // }),
    ],
    build: {
      target: "esnext",
    },
    optimizeDeps: {
      include: ["@project-serum/anchor", "@solana/web3.js", "buffer"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    define: {
      "process.env.BROWSER": true,
      // global: "globalThis", // Polyfill `global` with `globalThis` for browser compatibility
    },
    // resolve: {
    //   alias: {
    //     // Aliasing Node.js `crypto` module to `crypto-browserify`
    //     crypto: "crypto-browserify",
    //   },
    // },
  },
  ssr: false,
  runtimeConfig: {
    mongo_uri: process.env.MONGO_URI,
    public: {
      appName: "Match",
      appContactEmail:
        process.env.MATCH_CONTACT_EMAIL || "kingsmen.hackers@gmail.com",
      matchApiUrl: process.env.MATCH_API_URL,
      lightHouseApiKey: process.env.LIGHTHOUSE_API_KEY,
      hederaBaseUrl: process.env.HEDERA_BASE_URL,
      contractId: process.env.CONTRACT_ID,
      chainId: process.env.CHAIN_ID,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      solanaRpcUrl: process.env.SOLANA_RPC_URL,
      portalClientApiKey: process.env.PORTAL_CLIENT_API_KEY,
      solanaChainId: process.env.SOLANA_CHAIN_ID,
      solMint: process.env.SOL_MINT,
      pyUsdMint: process.env.PY_USD_MINT,
      timeTillLock: process.env.TIME_TILL_LOCK,
    },
  },
  vuetify: {
    /* vuetify options */
    vuetifyOptions: {
      // @TODO: list all vuetify options
    },
  },
});
