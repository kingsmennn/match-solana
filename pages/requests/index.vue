<template>
  <div class="tw-max-w-7xl tw-mx-auto">
    <div class="tw-p-6 sm:tw-p-10">
      <h1 class="tw-text-5xl tw-font-bold tw-mt-4">
        Active requests {{userStore.locationEnabled ? 'made around your store' : ''}}
      </h1>
      <p v-if="!userStore.locationEnabled" class="tw-bg-black tw-text-white tw-mt-2">You are currently viewing requests that was not made with any location data</p>

      <div class="tw-flex tw-justify-end tw-mt-10">
        <div class="tw-flex tw-gap-1.5 tw-select-none">
          <v-icon>{{ visibleRequestsIcon }}</v-icon>
          <span>{{ userStore.locationEnabled ? 'Nearby' : 'No location' }}</span>
          <span class="tw-text-white tw-bg-black">
            <strong> {{ visibleRequestsCount }}</strong> 
          </span>
  
          <v-tooltip
            activator="parent"
            location="top"
            theme="dark"
          >This preference can be changed in your settings</v-tooltip>
        </div>
      </div>
      
      <div v-if="!loading" class="tw-grid sm:tw-grid-cols-2 tw-gap-3 tw-mt-2">
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
          :account-type="userStore?.accountType!"
          :buyer-address="request.buyerAddress!"
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
import { User, Request, RequestResponse, AccountType } from '@/types';
import { useRequestsStore } from '@/pinia/request';
import { useUserStore } from '@/pinia/user';

definePageMeta({
  middleware: ['auth', 'seller'],
  requiresAuth: true,
})

const userStore = useUserStore()
const visibleRequestsIcon = computed(()=>userStore.locationEnabled ? 'mdi-map-marker-radius' : 'mdi-map-marker-question')
const visibleRequestsCount = computed(()=>
  `${requestsStore.list.length} request${requestsStore.list.length === 1 ? '' : 's'}`
)

const requestsStore = useRequestsStore()
const loading = ref(true)
const fetchUserRequests = async () => {
  loading.value = true
  try {
    const res = await requestsStore.fetchNearbyRequestsForSellers({
      lat: userStore.location?.[1]!,
      long: userStore.location?.[0]!,
    })
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

// this is used to eject users with accountType === BUYER from this page
// use-case is when SELLER account was initially here then switched to BUYER account
watch([() => userStore.accountType, () => userStore.accountId], ([accountType, accountId]) => {
  if(!accountType || !accountId) return
  if(accountType === AccountType.SELLER) return
  navigateTo('/')
})
</script>