<script setup lang="ts">
import WalletModalProvider from 'solana-wallets-vue'
</script>

<template>
  <WalletModalProvider dark>
    <template #default="modalScope">
      <button @click="modalScope.openModal()">hey</button>
    </template>
  </WalletModalProvider>
</template>