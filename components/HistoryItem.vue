<script setup lang="ts">
import { CoinPayment } from '@/types';
import moment from 'moment';

type Props = {
  createdAt: Date,
  amount: number,
  token: CoinPayment,
  requestId: number,
  sellerId: number,
  buyerId: number,
}
const props = defineProps<Props>();
const isExpanded = ref(false)

// eg: Wed, Fri, Sat
const dayText = computed(()=>moment(props.createdAt).format('ddd'))
const dayNumber = computed(()=>moment(props.createdAt).format('D'))
</script>

<template>
  <div
    class="tw-ring-1 tw-ring-black/10 tw-rounded-xl tw-p-4
    tw-transition-all tw-duration-300"
    :class="{ 'tw-bg-black/5': isExpanded }">
    <!-- primary details -->
    <div class="tw-flex">
      <div
        class="tw-flex tw-flex-col tw-items-center tw-text-gray-400
        tw-transition-all tw-duration-300"
        :class="{ '!tw-text-black': isExpanded }">
        <span class="tw-text-xl tw-font-semibold">{{ dayText }}</span>
        <span class="tw-text-4xl tw-font-bold">{{ dayNumber }}</span>
      </div>
      <div class="tw-w-0.5 tw-mx-4 tw-bg-black/5"></div>
      <div class="tw-flex-1">

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
      <div class="pt-3">
        {{  props }}
      </div>
    </div>
  </div>
</template>