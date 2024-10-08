<script setup lang="ts">
import { CoinPayment } from '@/types';
import { tokens } from "~/utils/constants";
import moment from 'moment';

type Props = {
  createdAt: Date,
  amount: number,
  token: CoinPayment,
  requestId: number,
  sellerId: number,
  buyerId: number,
  isSeller: boolean
}
const props = defineProps<Props>();
const isExpanded = ref(false)

// eg: Wed, Fri, Sat
const dayText = computed(()=>moment(props.createdAt).format('ddd'))
const dayNumber = computed(()=>moment(props.createdAt).format('D'))
const tokenDetails = computed(()=>tokens.find(t=>t.symbol === props.token))

const moreDetails = computed(()=> {
  return {
    amount: props.amount,
    token: props.token,
    request: props.requestId,
    'my id': props.isSeller ? props.sellerId : props.buyerId,
    date: props.createdAt
  }
})
</script>

<template>
  <div
    class="tw-ring-1 tw-ring-black/10 tw-rounded-xl tw-p-4
    tw-transition-all tw-duration-300"
    :class="{ 'tw-bg-black/5': isExpanded }">
    <!-- primary details -->
    <div class="tw-flex tw-divide-x tw-divide-gray-100">
      <div
        class="tw-flex tw-flex-col tw-items-center tw-text-gray-400
        tw-transition-all tw-duration-300 tw-pl-2 tw-pr-6"
        :class="{ '!tw-text-black': isExpanded }">
        <span class="tw-text-xl tw-font-semibold">{{ dayText }}</span>
        <span class="tw-text-4xl tw-font-bold">{{ dayNumber }}</span>
      </div>

      <div class="tw-flex-1 tw-flex max-md:tw-flex-col">
        <div class="tw-flex tw-items-center">
          <span
            class="tw-mx-4 tw-h-12 tw-w-12 tw-rounded-full tw-bg-gray-100
            tw-flex tw-items-center tw-justify-center tw-opacity-50"
            :class="{ '!tw-opacity-100': isExpanded }">
            <img :src="tokenDetails?.logo" class="tw-object-contain tw-h-10" />
          </span>
        </div>
  
        <div
          class="tw-flex-1 tw-flex tw-items-center tw-px-3 tw-text-gray-600"
          :class="{ '!tw-text-black': isExpanded }">
          <template v-if="isSeller">
            You got paid {{amount}} {{tokenDetails?.symbol}} for request
            <NuxtLink class="tw-pl-2 hover:tw-underline" :to="'/requests/' + requestId">#{{ requestId }}</NuxtLink>
          </template>
          <template v-else>
            You paid {{amount}} {{tokenDetails?.symbol}} for request
            <NuxtLink class="tw-pl-2 hover:tw-underline" :to="'/requests/' + requestId">#{{ requestId }}</NuxtLink>
          </template>
        </div>
      </div>
      <button
        class="tw-bg-gray-50 hover:tw-bg-gray-100 tw-rounded
        tw-text-gray-400 tw-transition-all tw-duration-300"
        @click="isExpanded = !isExpanded">
        <v-icon
          class="-tw-rotate-90 tw-transition-all tw-duration-300"
          :class="{ '!tw-rotate-0': isExpanded }">
          mdi-chevron-down
        </v-icon>
      </button>
    </div>
    <!-- more details -->
    <div
      :class="{ '!tw-max-h-0 !tw-duration-500': !isExpanded }"
      class="tw-max-h-[999px] tw-transition-all tw-duration-1000 tw-ease-in-out
      tw-overflow-hidden tw-font-light">
      <div class="tw-pt-3 tw-grid md:tw-grid-cols-2 tw-gap-2">
        <div
          v-for="(value, key) in moreDetails"
          class="tw-grid md:tw-grid-cols-4 tw-bg-white tw-rounded-lg tw-p-2">
          <span class="tw-text-gray-400">{{ key }}</span>
          <span class="md:tw-col-span-3 tw-text-gray-600">
            <template v-if="key === 'request'">
              <NuxtLink class="tw-pl-2 hover:tw-underline" :to="'/requests/' + value">#{{ value }}</NuxtLink>
            </template>
            <template v-else>{{ value }}</template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>