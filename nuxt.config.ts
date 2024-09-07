// https://nuxt.com/docs/api/configuration/nuxt-config
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
  css: ['~/assets/css/solana.css'],
  vite: {
    esbuild: {
      target: "esnext",
    },
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
    },
  },
  ssr: false,
  runtimeConfig: {
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
    },
  },
  vuetify: {
    /* vuetify options */
    vuetifyOptions: {
      // @TODO: list all vuetify options
    },
  },
});
