<template>
  <div class="tw-relative">
    <div
      :class="{ 'tw-text-gray-400 !tw-border-black/5': completed }"
      class="tw-border-2 tw-border-black/10 tw-relative tw-z-10 tw-bg-white tw-group tw-overflow-hidden tw-flex tw-flex-col tw-h-full"
    >
      <div class="tw-p-2 tw-flex tw-flex-1">
        <div class="sm:tw-flex tw-flex-1">
          <div class="tw-flex-grow tw-flex tw-gap-2">
            <div
              :class="{ 'tw-opacity-40 tw-saturate-0': completed }"
              class="tw-h-full tw-aspect-square tw-bg-black tw-rounded-lg tw-relative tw-overflow-hidden tw-ring-1 tw-ring-black"
            >
              <img
                :src="thumbnail"
                class="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-cover"
              />
            </div>
            <div>
              <h3 class="tw-text-xl tw-truncate tw-font-semibold">
                {{ itemName }}
              </h3>
              <p class="tw-text-sm">ID: {{ requestId }}</p>

              <template
                v-if="
                  hasLocked &&
                  lifecycle === RequestLifecycleIndex.ACCEPTED_BY_BUYER &&
                  accountType === AccountType.BUYER
                "
              >
                <template v-if="fetchingStoreDetails">
                  <p>Fetching store details...</p>
                </template>
                <template v-else>
                  <p class="tw-text-sm">
                    Store name:
                    <strong>{{ sellerStore?.name }}</strong>
                  </p>
                  <p class="tw-text-sm">
                    Contact number:
                    <strong>{{ sellerStore?.phone }}</strong>
                  </p>
                  <p class="tw-text-sm">
                    Price: 
                    <strong
                      >{{ Number(lamportsToSol(sellersPriceQuote)) }} {{PAYMENT_COIN}}</strong
                    >
                  </p>
                </template>
              </template>

              <template v-if="lifecycle === RequestLifecycleIndex.PENDING && accountType === AccountType.BUYER">
                <div class="tw-block max-md:tw-hidden md:tw-h-12 tw-invisible">
                  artificial spacer
                </div>
                <button
                  v-if="lifecycle === RequestLifecycleIndex.PENDING"
                  :id="`revert-${requestId}`"
                  class="tw-absolute tw-z-10 tw-bottom-2 tw-right-2 tw-inline-block tw-p-2 tw-px-4 tw-rounded-full tw-bg-black tw-select-none tw-text-white hover:tw-bg-black/80 tw-transition-all tw-duration-300 tw-font-medium"
                  :disabled="cancelingRequest"
                >
                  <v-progress-circular
                    v-if="cancelingRequest"
                    indeterminate
                    color="white"
                    size="20"
                    width="2"
                  >
                  </v-progress-circular>
                  <template v-else> Revert </template>
                </button>

                <v-menu
                  v-if="userStore.isConnected"
                  :activator="`#revert-${requestId}`"
                  transition="slide-y-transition"
                >
                  <div
                    class="tw-bg-white tw-mt-2 tw-p-2 tw-rounded-lg tw-flex tw-flex-col tw-gap-3 tw-shadow-lg"
                  >
                    <span
                      class="tw-text-sm tw-border-b tw-px-3 tw-py-2 tw-pb-1.5"
                    >
                      Are you sure you want <br />to cancel this request?
                    </span>

                    <button
                      @click="handleCancelRequest"
                      class="tw-p-2 tw-px-4 tw-rounded-full tw-bg-red-600 tw-select-none tw-text-white hover:tw-bg-red-600/80 tw-transition-all tw-duration-300 tw-font-medium"
                    >
                      Cancel request
                    </button>
                  </div>
                </v-menu>
              </template>

              <button
                v-if="
                  hasLocked &&
                  lifecycle === RequestLifecycleIndex.ACCEPTED_BY_BUYER &&
                  accountType === AccountType.BUYER
                "
                @click="handleAttemptPayment"
                class="tw-inline-block tw-p-2 tw-px-4 mt-2 tw-rounded-full tw-bg-black tw-select-none tw-text-white hover:tw-bg-black/80 tw-transition-all tw-duration-300 tw-font-medium"
                :disabled="attemptingPayment"
              >
                <v-progress-circular
                  v-if="attemptingPayment"
                  indeterminate
                  color="white"
                  size="20"
                  width="2"
                >
                </v-progress-circular>
                <template v-else> Pay </template>
              </button>
              <button
                v-if="lifecycle === RequestLifecycleIndex.PAID && accountType === AccountType.BUYER"
                @click="handleMarkAsCompleted"
                class="tw-inline-block tw-p-2 tw-px-4 mt-2 tw-rounded-full tw-bg-black tw-select-none tw-text-white hover:tw-bg-black/80 tw-transition-all tw-duration-300 tw-font-medium"
                :disabled="markingAsCompleted || completed"
              >
                <v-progress-circular
                  v-if="markingAsCompleted"
                  indeterminate
                  color="white"
                  size="20"
                  width="2"
                >
                </v-progress-circular>
                <template v-else> Mark as completed </template>
              </button>
            </div>
          </div>
          <span class="tw-text-sm">{{ timeAgo }}</span>
        </div>
      </div>

      <div class="tw-relative">
        <span
          :class="{ 'tw-bg-black/10': completed }"
          class="tw-absolute tw-inset-0 tw-block tw-bg-black tw-transition-all tw-duration-300"
          :style="`width: ${lifecycleProgress}%`"
        >
        </span>
        <div
          :class="{ '!tw-text-gray-400': completed }"
          class="tw-text-white tw-relative tw-text-sm tw-grid tw-grid-cols-3 tw-py-1"
        >
          <div class="tw-flex tw-justify-center tw-items-center tw-gap-1">
            <template v-if="accountType === AccountType.BUYER">
              <v-icon>
                {{
                  lifecycle !== RequestLifecycleIndex.PENDING
                    ? "mdi-checkbox-marked-circle"
                    : "mdi-timelapse"
                }}
              </v-icon>
              <span>seller</span>
            </template>
            <template v-else>
              <v-icon>
                {{ hasMyOffer ? "mdi-checkbox-marked-circle" : "mdi-timelapse" }}
              </v-icon>
              <span>{{ hasMyOffer ? "accepted" : "available" }}</span>
            </template>
          </div>
          <div class="tw-flex tw-justify-center tw-items-center tw-gap-1">
            <template v-if="accountType === AccountType.SELLER">
              <v-icon>
                {{
                  lifecycle === RequestLifecycleIndex.ACCEPTED_BY_BUYER ||
                  lifecycle === RequestLifecycleIndex.REQUEST_LOCKED ||
                  lifecycle === RequestLifecycleIndex.COMPLETED
                    ? "mdi-checkbox-marked-circle"
                    : "mdi-timelapse"
                }}
              </v-icon>
              <span>buyer</span>
            </template>
            <template v-else>
              <v-icon>mdi-checkbox-marked-circle</v-icon>
              <span>accepted</span>
            </template>
          </div>
          <div class="tw-flex tw-justify-center tw-items-center tw-gap-1">
            <v-icon>
              {{
                hasLocked &&
                lifecycle === RequestLifecycleIndex.ACCEPTED_BY_BUYER
                  ? "mdi-lock"
                  : "mdi-timelapse"
              }}
            </v-icon>
            <span>
              {{
                hasLocked &&
                lifecycle === RequestLifecycleIndex.ACCEPTED_BY_BUYER
                  ? "locked"
                  : "locks in "+formatedTTL
              }}
            </span>
          </div>
        </div>
      </div>

      <div
        class="tw-absolute tw-inset-y-0 tw-right-0 tw-pointer-events-none tw-translate-x-full group-hover:tw-translate-x-0 tw-transition-all tw-duration-300 tw-flex tw-items-center tw-justify-center [&>*]:tw-ring-2 [&>*]:tw-ring-white/80 tw-select-none tw-pr-2"
      >
        <NuxtLink
          :to="`/requests/${requestId}`"
          class="tw-bg-black tw-text-white tw-p-2 tw-py-1 tw-rounded-md tw-pointer-events-auto"
        >
          <v-icon>mdi-eye</v-icon>
        </NuxtLink>
      </div>
    </div>

    <div
      v-if="lifecycle === RequestLifecycleIndex.REQUEST_LOCKED"
      class="tw-absolute tw-inset-0 tw-bg-black/20 tw-animate-ping tw-pointer-events-none"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { AccountType, Offer, RequestLifecycleIndex, Store, User } from "@/types";
import moment from "moment";
import { useRequestsStore } from "@/pinia/request";
import { useUserStore } from "@/pinia/user";
import { useStoreStore } from "@/pinia/store";
import { toast } from "vue-sonner";
import { lamportsToSol } from "@/utils/contract-utils";
import { PAYMENT_COIN } from "@/utils/constants";

interface Props {
  requestId: number;
  isCompleted?: boolean;
  lifecycle: RequestLifecycleIndex;
  itemName: string;
  thumbnail: string;
  createdAt: Date;
  updatedAt: Date;
  accountType: AccountType;
  sellersPriceQuote: number | null;
  buyerAddress: string;
  lockedSellerId: number | null;
}

const props = defineProps<Props>();
const completed = ref(!!props?.isCompleted);
const emits = defineEmits<{
  (e: 'onAttemptPayment', requestId: number): void
}>()
const env = useRuntimeConfig().public;

const requestStore = useRequestsStore();
const hasLocked = computed(() =>
  requestStore.hasLocked({ updatedAt: props.updatedAt, period: eval(env.timeTillLock) })
);

// TTL is in ms
const formatedTTL = moment(eval(env.timeTillLock)).format("m [mins]");
const lifecycleProgress = computed<number>(() => {
  if (
    hasLocked.value &&
    props.lifecycle === RequestLifecycleIndex.ACCEPTED_BY_BUYER &&
    props.accountType === AccountType.BUYER
  )
    return 100;

  switch (props.lifecycle) {
    case RequestLifecycleIndex.PENDING:
      return 100 / 3;
    case RequestLifecycleIndex.ACCEPTED_BY_SELLER:
      return props.accountType === AccountType.BUYER ? 100 / 3 : (100 / 3) * 2;
    case RequestLifecycleIndex.ACCEPTED_BY_BUYER:
      return props.accountType === AccountType.BUYER
        ? (100 / 3) * 2
        : (100 / 3) * 2;
    case RequestLifecycleIndex.REQUEST_LOCKED:
      return 100;
    case RequestLifecycleIndex.COMPLETED:
      return 100;
    default:
      return 0;
  }
});
const timeAgo = computed<string>(() => moment(props.createdAt).fromNow());

const buyer = ref<User | null>(null);
const lockedSeller = ref<User | null>(null);

const userStore = useUserStore();
const storesStore = useStoreStore();

const sellerStore = ref<Store>();

const fetchingStoreDetails = ref(false);
watch(
  () => props.lockedSellerId,
  async (val) => {
    if (!val) return;
    fetchingStoreDetails.value = true;
    try {
      const res = (await userStore.fetchUserById(
        props.lockedSellerId!
      )) as unknown as { userAddress: string };
      const stores = await storesStore.getUserStores(res?.userAddress);
      if (!stores) return;
      sellerStore.value = !!stores[0] ? stores[0] : undefined;
    } catch (error: any) {
      console.log(error);
      toast.error(error);
    } finally {
      fetchingStoreDetails.value = false;
    }
  },
  { immediate: true }
);

const attemptingPayment = ref(false);
const handleAttemptPayment = async () => {
  attemptingPayment.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  emits('onAttemptPayment', props.requestId);
  attemptingPayment.value = false;
  // try {
  //   await requestStore.markRequestAsCompleted(props.requestId);
  //   completed.value = true;
  //   toast.success("request completed");
  // } catch (error: any) {
  //   console.log(error);
  //   toast.error(error);
  // } finally {
  //   attemptingPayment.value = false;
  // }
};

const markingAsCompleted = ref(false);
const handleMarkAsCompleted = async () => {
  markingAsCompleted.value = true;
  try {
    await requestStore.markRequestAsCompleted(props.requestId);
    completed.value = true;
    toast.success("request completed");
  } catch (error: any) {
    console.log(error);
    toast.error(error);
  } finally {
    markingAsCompleted.value = false;
  }
};

const cancelingRequest = ref(false);
const handleCancelRequest = async () => {
  cancelingRequest.value = true;
  try {
    await requestStore.deleteRequest(props.requestId);
    requestStore.removeDeletedRequestFromList(props.requestId);
    toast.success("request canceled");
  } catch (error: any) {
    console.log(error);
    toast.error(error);
  } finally {
    cancelingRequest.value = false;
  }
};

// check if I have made offer to request
const hasMyOffer = ref(false);
const requestsStore = useRequestsStore();
const fetchAllRequestOffers = async () => {
  try {
    const res = await requestsStore.fetchAllOffers(props.requestId!) as Offer[]
    hasMyOffer.value = res.some((offer) => offer.sellerId === userStore.userId)
  } catch (error) {
    toast.error("error fetching offers")
  } finally {
  }
}
onMounted(fetchAllRequestOffers)
</script>
