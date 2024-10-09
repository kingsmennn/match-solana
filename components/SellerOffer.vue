<template>
  <div>
    <div class="tw-h-[200px] tw-bg-gray-100 tw-relative">
      <v-col class="tw-h-full pa-0">
        <ClientOnly>
          <v-carousel
            v-model="carousel"
            cycle
            :show-arrows="images.length > 1"
            hide-delimiter-background
            hide-delimiters
            height="100%"
          >
            <v-carousel-item
              ripple
              v-for="(image, n) in images"
              :key="n"
              :src="image"
              cover
            >
            </v-carousel-item>
          </v-carousel>
        </ClientOnly>
      </v-col>
    </div>

    <div>
      <p>
        By <strong>{{ storeName }}</strong>
      </p>
    </div>

    <div class="tw-flex tw-justify-between tw-items-end">
      <button
        class="tw-p-2 tw-py-1 tw-bg-black tw-text-white hover:tw-bg-black/80 tw-transition-colors tw-duration-300 disabled:tw-bg-black/20 disabled:tw-cursor-not-allowed"
        @click="handleAcceptBtnClick"
        :disabled="
          lifecycle === RequestLifecycleIndex.REQUEST_LOCKED ||
          lifecycle === RequestLifecycleIndex.COMPLETED ||
          submiting ||
          isAccepted
        "
      >
        <template v-if="!submiting"> Accept </template>
        <v-progress-circular
          v-else
          indeterminate
          color="white"
          size="20"
          width="2"
        >
        </v-progress-circular>
      </button>
      <h4
        class="tw-text-2xl tw-font-medium tw-truncate"
        :title="displayedPrice"
      >
        {{ displayedPrice }}
      </h4>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RequestLifecycleIndex } from "@/types";
import { useRequestsStore } from "@/pinia/request";
import { toast } from "vue-sonner";
import moment from "moment";

interface Props {
  offerId: number;
  requestId: number;
  lifecycle: RequestLifecycleIndex;
  images: string[];
  priceQuote: number | null;
  buyerId: number;
  sellerId: number;
  storeName: string;
  isAccepted?: boolean;
}
const props = defineProps<Props>();
const emits = defineEmits<{
  (e: "offer-accepted", offerId: number): void
}>();

const carousel = ref(0);
const displayedPrice = computed<string>(() => {
  if (!props.priceQuote) return "";
  return `${lamportsToSol(props.priceQuote)} ${PAYMENT_COIN}`;
});

const env = useRuntimeConfig().public;
const submiting = ref(false);
const requestStore = useRequestsStore();
const handleAcceptBtnClick = async () => {
  submiting.value = true;
  try {
    await requestStore.acceptOffer(props.offerId);
    emits("offer-accepted", props.offerId);
    toast.success("offer accepted!");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.info("You can pay for this item after "+ moment(eval(env.timeTillLock)).format("m [mins]"))
  } catch (error: any) {
    toast.error(error);
  } finally {
    submiting.value = false;
  }
};
</script>
