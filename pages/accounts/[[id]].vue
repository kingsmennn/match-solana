<template>
  <div class="tw-max-w-7xl tw-mx-auto">
    <div class="tw-p-6 sm:tw-p-10">
      <FinalizeRegistration
        v-if="!userStore.passedSecondaryCheck"
        class="tw-mb-6"
      />

      <div class="tw-mb-6 tw-flex max-md:tw-flex-col tw-justify-between tw-items-center">
        <div
          class="tw-h-16 tw-w-16 tw-rounded-full tw-bg-gray-100 tw-text-4xl tw-font-black
          tw-flex tw-items-center tw-justify-center tw-select-none max-md:tw-self-start">
          {{ userInitial }}
        </div>

        <div class="tw-flex tw-gap-2">
          <NuxtLink
            to="/requests/history"
            class="tw-inline-flex tw-p-4 tw-px-6 tw-rounded-full tw-items-center
            tw-select-none tw-text-black tw-bg-transparent hover:tw-bg-black/10
            tw-transition-all tw-duration-300 tw-font-black">
            Transactions
          </NuxtLink>

          <NuxtLink
            v-if="isBuyer"
            to="/requests/create"
            class="tw-inline-flex tw-p-4 tw-px-6 tw-rounded-full tw-bg-black
            tw-select-none tw-text-white hover:tw-bg-black/80 tw-text-center
            tw-transition-all tw-duration-300 tw-font-black">
            Request for an item
          </NuxtLink>
        </div>
      </div>
      
      <div>
        <Tabs
          :tab_list="tab_list"
          :value="tab"
          @model-value="($event) => tab = $event"
          class="tw-inline-flex tw-gap-x-1 sm:tw-gap-x-2 tw-justify-between
          tw-rounded-sm tw-w-full [&>*]:tw-flex-grow [&>*]:tw-max-w-[50%]">
          <template v-slot:tab="{ tab, index: i, is_active }">
            <div
              :class="[is_active ? 'tw-border-black' : 'tw-text-gray-400 tw-border-transparent']"
              class="tw-border-b-4 tw-py-2 tw-transition tw-duration-300 tw-font-medium tw-cursor-pointer">
              <span class="tw-flex tw-flex-col tw-items-center">
                <v-icon>{{ (tab as any)?.icon }}</v-icon>
                <span>{{ (tab as any)?.name }}</span>
              </span>
            </div>
          </template>
        </Tabs>

        <div class="tw-mt-6">
          <div v-show="tab===tab_list[0].slug" class="tw-grid sm:tw-grid-cols-2 tw-gap-3">
            <RequestItem
              v-for="request in activeRequestList" :key="request._id"
              :requestId="request.requestId"
              :lifecycle="request.lifecycle"
              :itemName="request.requestName"
              :thumbnail="request.images[0]"
              :created-at="new Date(request.createdAt * 1000)"
              :updated-at="new Date(request.updatedAt * 1000)"
              :buyerId="request.buyerAddress"
              :buyer-address="request.buyerAddress!"
              :lockedSellerId="request.lockedSellerId ?? null"
              :sellers-price-quote="request.sellersPriceQuote ?? null"
              :account-type="userStore.accountType!"
              @on-attempt-payment="()=>handlePaymentModal(request.requestId)"
            />
          </div>
          
          <div v-show="tab===tab_list[1].slug" class="tw-grid tw-gap-3">
            <RequestItem
              v-for="request in completedRequestList" :key="request._id"
              :requestId="request.requestId"
              :lifecycle="request.lifecycle"
              :itemName="request.requestName"
              :thumbnail="request.images[0]"
              :created-at="new Date(request.createdAt * 1000)"
              :updated-at="new Date(request.updatedAt * 1000)"
              :buyerId="request.buyerAddress"
              :buyer-address="request.buyerAddress!"
              :lockedSellerId="request.lockedSellerId ?? null"
              :sellers-price-quote="request.sellersPriceQuote ?? null"
              :account-type="userStore.accountType!"
              is-completed
            />
          </div>

          <!-- show empty state UI when either tab has no content -->
          <div
            v-show="(tab===tab_list[0].slug && activeRequestList.length===0) || (tab===tab_list[1].slug && completedRequestList.length===0)"
            class="tw-p-6 tw-py-10 tw-text-center tw-border-4 tw-border-gray-400/5 tw-rounded-2xl
            tw-bg-gray-300/5 tw-my-10 tw-text-2xl tw-text-gray-500">
            <p>All {{ tab }} requests will be listed here...</p>
          </div>
        </div>
      </div>
    </div>

    <PaymentModal
      :is-open="showPaymentModal"
      :requestId="attemptPaymentForRequest?.requestId!"
      :amount="lamportsToSol(attemptPaymentForRequest?.sellersPriceQuote!)"
      :account-id="userStore.accountId!"
      :in-progress="processingPayment"
      @update:is-open="(val) => showPaymentModal = val"
      @on-process-payment="handleProcessPayment"
      :payment-coin="PAYMENT_COIN"
    />
  </div>
</template>

<script setup lang="ts">
import { AnchorWallet, useAnchorWallet, useWallet } from "solana-wallets-vue";
const anchor = useAnchorWallet();
import FinalizeRegistration from '@/components/FinalizeRegistration.vue'
import Tabs from '@/components/Tabs.vue';
import RequestItem from '@/components/RequestItem.vue';
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { RequestLifecycle, AccountType, User, RequestResponse, Offer, RequestLifecycleIndex, CoinPayment } from '@/types'
import { useUserStore } from '@/pinia/user';
import { useRequestsStore } from '@/pinia/request';
import PaymentModal from '@/components/PaymentModal.vue';
import { toast } from 'vue-sonner';
import { AnchorError } from '@project-serum/anchor';
import { lamportsToSol } from '@/utils/contract-utils';
import { PAYMENT_COIN } from '@/utils/constants';

const env = useRuntimeConfig().public
useHead({
  title: env.appName+' - Your account',
})
definePageMeta({
  middleware: 'auth',
  requiresAuth: true,
})

const route = useRoute()
const userStore = useUserStore()
const userInitial = computed(() => userStore?.username?.charAt(0).toUpperCase() ?? '?')
const isSeller = computed(() => userStore.accountType === AccountType.SELLER)
const isBuyer = computed(() => userStore.accountType === AccountType.BUYER) 

const tab = ref()
const tab_list = ref<{ name: string, slug: string, icon: string }[]>([])
onBeforeMount(()=>{
  if (isSeller.value) {
    tab_list.value = [
      { name: 'Accepted requests', slug: 'accepted', icon: 'mdi-timelapse' },
      { name: 'Requests I fulfilled', slug: 'fulfilled', icon: 'mdi-cube-send' },
    ]
    return
  }

  tab_list.value = [
    { name: 'Active requests', slug: 'active', icon: 'mdi-timelapse' },
    { name: 'Completed requests', slug: 'completed', icon: 'mdi-cube-send' },
  ]
})

const requestsStore = useRequestsStore()
onMounted(()=>{
  if (isSeller.value) {
    requestsStore.fetchAllSellersRequests(userStore.accountId!)
    return
  }

  requestsStore.fetchAllUserRequests(userStore.accountId!)
})

const activeRequestList = computed(() => {
  // if (isSeller.value) {
  //   // return sellerRequestList.value.filter(request => request.lifecycle !== RequestLifecycle.COMPLETED).reverse()
  // }
  return requestsStore.list.filter(request=>{
    return request.lifecycle !== RequestLifecycleIndex.COMPLETED
  })
})

const completedRequestList = computed(() => {
  // if (isSeller.value) {
  //   // return sellerRequestList.value.filter(request => request.lifecycle === RequestLifecycle.COMPLETED).reverse()
  // }
  return requestsStore.list.filter(request=>{
    return request.lifecycle === RequestLifecycleIndex.COMPLETED
  })
})

const showPaymentModal = ref(false)
const attemptPaymentForRequest = ref<RequestResponse>()
const handlePaymentModal = (requestId: RequestResponse['requestId']) => {
  const request = requestsStore.list.find(request => request.requestId === requestId)
  if (!request) return
  showPaymentModal.value = true
  attemptPaymentForRequest.value = request
}

const processingPayment = ref(false)
const handleProcessPayment = async (
  {
    requestId,
    amount,
    token,
    accountId
  }:{
    requestId: RequestResponse['requestId'],
    amount: number
    token: CoinPayment
    accountId: string
  }
) => {
  processingPayment.value = true

  try {
    if(token == CoinPayment.SOLANA) {
      await requestsStore.payForRequest(requestId,token)
    }else {
      await requestsStore.payForRequestToken(requestId,token)
    }
    toast.success('Payment successful')
  } catch (error:any) {
 
    if (error instanceof AnchorError) {
      const err: AnchorError = error;
      toast.error(err.error.errorMessage);
      return;
    }
    if(error.transactionMessage) {
       toast.error(error.transactionMessage);
       return;
    }
    toast.error(error);
  }finally {
    showPaymentModal.value = false
    processingPayment.value = false
  }
}
</script>