<template>
  <div class="tw-max-w-7xl tw-mx-auto">
    <div class="tw-p-6 sm:tw-p-10">
      <h1 class="tw-text-5xl tw-font-bold tw-mt-4">
        List of requests made around your store
      </h1>
      <!-- <p
        v-if="!(!!userCookie?.stores?.[0]?.location.lga!)"
        class="tw-text-white tw-bg-black">
        Please complete your profile in your account page to be able to view requests.
      </p> -->
      
      <div v-if="!loading" class="tw-grid sm:tw-grid-cols-2 tw-gap-3 tw-mt-10">
        <RequestItem
          v-for="request in userRequestList" :key="request.requestId"
          :requestId="request.requestId!"
          :lifecycle="request.lifecycle"
          :itemName="request.requestName"
          :thumbnail="request.images[0]"
          :created-at="new Date(request.createdAt * 1000)"
          :updated-at="new Date(request.updatedAt * 1000)"
          :buyerId="request.buyerId"
          :locked-seller-id="request.lockedSellerId ?? null"
          :sellers-price-quote="request.sellersPriceQuote ?? null"
          :account-type="userStore?.accountType"
        />
      </div>

      <div
        v-else
        class="tw-p-6 tw-py-10 tw-text-center tw-border-4 tw-border-gray-400/5 tw-rounded-2xl
        tw-bg-gray-300/5 tw-my-10 tw-text-2xl tw-text-gray-500">
        <p>loading...</p>
      </div>

      <div
        v-if="!loading && !userRequestList.length"
        class="tw-p-6 tw-py-10 tw-text-center tw-border-4 tw-border-gray-400/5 tw-rounded-2xl
        tw-bg-gray-300/5 tw-my-10 tw-text-2xl tw-text-gray-500">
        <p>No requests have been made in this location</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Request, RequestResponse } from '@/types';
import { useRequestsStore } from '@/pinia/request';
import { useUserStore } from '@/pinia/user';
import { HashConnectConnectionState } from 'hashconnect';

definePageMeta({
  middleware: ['auth', 'seller'],
  requiresAuth: true,
})

const requestsStore = useRequestsStore()
const userStore = useUserStore()
const loading = ref(true)
const fetchUserRequests = async () => {
  loading.value = true
  try {
    const res = await requestsStore.fetchNearbyRequestsForSellers({
      lat: userStore.location?.[1]!,
      long: userStore.location?.[0]!,
    })
    console.log({fetchUserRequestsRes: res})
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false
  }
}

const unwatch = watch(()=>userStore.accountId, async (val)=>{
  if(!val) return
  fetchUserRequests()
}, { immediate: true })
const userRequestList = computed(()=>requestsStore.list)
</script>