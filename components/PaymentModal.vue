<script setup lang="ts">
import { CoinPayment, RequestResponse } from "@/types";
import { toast } from "vue-sonner";
import { ellipsify } from "~/utils/ellipsify";
import { tokens } from "~/utils/constants";

type Props = {
  requestId: RequestResponse['requestId']
  accountId: string
  amount: number
  isOpen: boolean
  inProgress: boolean
  paymentCoin: string
}
const props = defineProps<Props>();
type ProcessPaymentPayload = {
  accountId: string
  requestId: number
  token: CoinPayment
  amount: number
}
const emits = defineEmits<{
  (e: 'update:isOpen', value: boolean): void,
  (e: 'onProcessPayment', value: ProcessPaymentPayload): void
}>()
const truncatedAccountId = computed(() => ellipsify(props.accountId, 6))
const selectedToken = ref()

const paymentMethods:{
  name: string
  value: string
  channelImages: string[]
  disabled?: boolean
}[] = [
  {
    name: 'Credit or debit card (coming soon)',
    value: 'credit-card',
    channelImages: [
      'https://www.svgrepo.com/show/328112/visa.svg',
      'https://www.svgrepo.com/show/303248/mastercard-2-logo.svg'
    ],
    disabled: true
  },
  {
    name: 'Crypto',
    value: 'crypto',
    channelImages: [...tokens.map(token => token.logo)],
  }
]
const selectedPaymentMethod = ref('crypto')

const dialog = ref(false)
watch(() => props.isOpen, (val) => {
  dialog.value = val
})
const handleCancel = () => {
  dialog.value = false
  selectedToken.value = undefined
  selectedPaymentMethod.value = 'crypto'
  emits('update:isOpen', false)
}

const handleProceed = () => {
  if (!selectedPaymentMethod.value) {
    toast.error('Please select a payment method')
    return
  }
  if (!selectedToken.value) {
    toast.error('Please select a token')
    return
  }
  emits('onProcessPayment', {
    accountId: props.accountId,
    requestId: props.requestId!,
    token: selectedToken.value,
    amount: props.amount
  })
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    max-width="500"
    persistent>
    <div
      class="tw-bg-white tw-min-h-[400px] tw-p-6 tw-rounded-2xl
      tw-flex tw-flex-col tw-gap-8 tw-overflow-y-auto">
      <section>
        <div
          class="tw-flex tw-items-center tw-border-2 tw-border-gray-200 tw-rounded-xl
          tw-p-2 tw-gap-2">
          <v-icon
            class="tw-text-2xl"
            color="black">
            mdi-check-circle
          </v-icon>
  
          <div class="tw-text-sm">
            <p class="tw-text-gray-400">Connected with</p>
            <span class="tw-font-semibold">{{ truncatedAccountId }}</span>
          </div>
        </div>
      </section>

      <section>
        <fieldset class="tw-border-t-4 tw-my-4">
          <legend class="tw-px-4 tw-text-center">
            <p class="tw-leading-tight tw-text-gray-500">Payable amount</p>
            <p class="tw-text-2xl tw-font-bold">{{ amount }} {{ paymentCoin }}</p>
          </legend>
        </fieldset>
      </section>
      
      <section class="tw-space-y-2">
        <p class="tw-leading-tight tw-text-gray-500">Payment method</p>
        <div
          v-for="method in paymentMethods"
          :key="method.name"
          class="tw-flex tw-items-center tw-justify-between tw-border-2
          tw-border-gray-400 tw-rounded-xl tw-p-2 tw-gap-4 tw-mt-2"
          :class="{
            'tw-grayscale tw-cursor-not-allowed tw-text-gray-400 !tw-border-gray-200': method.disabled,
          }">
          <div class="tw-flex tw-gap-1 tw-items-center">
            <v-radio
              v-model="selectedPaymentMethod"
              :value="method.value"
              :disabled="method.disabled"
            />
            <span class="max-md:tw-text-sm max-md:tw-max-w-[100px] tw-truncate">
              {{ method.name }}
            </span>
          </div>

          <div class="tw-flex tw-gap-3 tw-text-sm tw-select-none">
            <img
              v-for="image in method.channelImages"
              :key="image"
              :src="image"
              class="tw-object-contain tw-h-10"
            />
          </div>
        </div>
      </section>

      <section class="tw-space-y-2">
        <p class="tw-leading-tight tw-text-gray-500">Token selection</p>
        <div class="tw-grid tw-grid-cols-2 tw-gap-4">
          <div
            v-for="token in tokens"
            :key="token.name"
            @click="()=>selectedToken = token.symbol"
            class="tw-flex tw-items-center tw-justify-between tw-border-2
            tw-border-gray-200 tw-rounded-xl tw-p-2 tw-gap-4 tw-cursor-pointer
            transition-all duration-300"
            :class="{'tw-bg-black tw-text-white': selectedToken === token.symbol}">
            <div class="tw-flex tw-flex-col">
              <span class="tw-text-semibold">{{ token.name }}</span>
              <span
                v-if="token?.network"
                class="tw-text-xs tw-text-gray-500"
                :class="{'tw-text-white': selectedToken === token.symbol}">
                On {{ token.network }}
              </span>
            </div>
            <span class="tw-h-10 tw-w-10 tw-rounded-full tw-bg-white">
              <img
                :src="token.logo"
                class="tw-object-contain tw-h-10"
              />
            </span>
          </div>
        </div>
      </section>

      <section
        class="tw-flex tw-justify-between tw-gap-4
        [&>*]:tw-p-4 [&>*]:tw-rounded-full [&>*]:tw-w-full
        [&>*]:tw-transition-all [&>*]:tw-duration-300">
        <button
          @click="handleCancel"
          class="hover:tw-bg-gray-200">
          Cancel
        </button>
        <button
          @click="handleProceed"
          class="tw-bg-black tw-text-white hover:tw-bg-black/80
          tw-relative tw-overflow-hidden">
          Proceed
          <span
            v-if="inProgress"
            class="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center
            tw-bg-white/60">
            <v-progress-circular
              indeterminate
              color="white"
              size="20"
              width="2"
            >
            </v-progress-circular>
          </span>
        </button>
      </section>
    </div>
  </v-dialog>
</template>