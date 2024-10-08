<script setup lang="ts">
import HistoryItem from '@/components/HistoryItem.vue';
import { useUserStore } from '@/pinia/user';
import { useRequestsStore } from '@/pinia/request';
import { AccountType, CoinPayment, STORE_KEY_MIDDLEWARE, User } from '@/types';
import { toast } from 'vue-sonner';

definePageMeta({
  middleware: ["auth"],
  requiresAuth: true,
});

const userStore = useUserStore();
const requestsStore = useRequestsStore();
const histories = ref<any>([]);
onMounted(async () => {
  try {
    const res = await requestsStore.getTransactionHistory()
    histories.value = res
  } catch (error) {
    toast.error((error as Error).message || 'unable to fetch transaction history')
  }
});

const userCookie = useCookie<User>(STORE_KEY_MIDDLEWARE, { watch: true });
const isSeller = computed(
  () => userCookie.value?.accountType === AccountType.SELLER
);
</script>

<template>
  <div class="tw-max-w-7xl tw-mx-auto">
    <div class="tw-p-6 sm:tw-p-10 tw-text-2xl">
      <NuxtLink
        :to="'/accounts/' + userStore.accountId"
        class="tw-text-xl tw-font-medium tw-inline-flex tw-items-center tw-gap-2"
      >
        <v-icon>mdi-chevron-left</v-icon>
        <span>Back</span>
      </NuxtLink>

      <h1 class="tw-text-5xl tw-font-bold tw-mt-4">History</h1>
      <p class="tw-text-gray-500">
        {{
          isSeller ?
            'Here you can see the history of requests you fulfilled.' :
            'Here you can see the history of your requests.'
        }}
      </p>

      <div class="tw-mt-10 tw-grid tw-gap-3">
        <HistoryItem
          v-for="(history,i) in histories" :key="i"
          :createdAt="history.createdAt"
          :amount="history.amount"
          :token="history.token"
          :requestId="history.requestId"
          :sellerId="history.sellerId"
          :buyerId="history.buyerId"
          :is-seller="isSeller"
        />
      </div>
    </div>
  </div>
</template>