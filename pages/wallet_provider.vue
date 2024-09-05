<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

import {
  // GlowWalletAdapter,
  PhantomWalletAdapter,
  CloverWalletAdapter,
  LedgerWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  TrustWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import * as anchor from "@project-serum/anchor";
import { marketAbi } from "../blockchain/abi";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";

import { BN } from "@project-serum/anchor";
const env = useRuntimeConfig().public;
const network = ref(WalletAdapterNetwork.Devnet);
const endpoint = computed(() => clusterApiUrl(network.value));

const wallets = ref([
  new PhantomWalletAdapter(),
  new LedgerWalletAdapter(),
  new TorusWalletAdapter(),
  new TrustWalletAdapter(),
]);

const wallet = useWallet();
const { connection } = useConnection();
const anchorWallet = useAnchorWallet();

const program = computed(() => {
  if (anchorWallet) {
    const provider = new anchor.AnchorProvider(
      connection,
      anchorWallet,
      anchor.AnchorProvider.defaultOptions()
    );
    return new anchor.Program(
      marketAbi as anchor.Idl,
      env.contractId,
      provider
    );
  }
});
// , [connection, anchorWallet] -> dependency array
</script>
<template>
  <ConnectionProvider :endpoint="endpoint">
    <Toaster />
    <WalletProvider :wallets="wallets" autoConnect>
      <WalletModalProvider> </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
</template>
