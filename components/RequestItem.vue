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
                    <strong>{{ usedSellerStoreDetails?.name }}</strong>
                  </p>
                  <p class="tw-text-sm">
                    Contact number:
                    <strong>{{ usedSellerStoreDetails?.phone }}</strong>
                  </p>
                  <p class="tw-text-sm">
                    Price:
                    <strong
                      >₦{{ Number(sellersPriceQuote).toLocaleString() }}</strong
                    >
                  </p>
                </template>
              </template>
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
              <v-icon>mdi-checkbox-marked-circle</v-icon>
              <span>accepted</span>
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
                  : "locks in 15mins"
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
import { AccountType, RequestLifecycleIndex, Store, User } from "@/types";
import moment from "moment";
import { useRequestsStore } from "@/pinia/request";
import { TIME_TILL_LOCK } from "@/utils/constants";
import { useUserStore } from "@/pinia/user";
import { useStoreStore } from "@/pinia/store";

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

const requestStore = useRequestsStore();
const hasLocked = computed(() =>
  requestStore.hasLocked({ updatedAt: props.updatedAt, period: TIME_TILL_LOCK })
);
const lifecycleProgress = computed<number>(() => {
  if (
    hasLocked.value &&
    RequestLifecycleIndex.ACCEPTED_BY_BUYER &&
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
const usedSellerStoreDetails = computed(() => {
  const store = sellerStore.value as unknown as [
    number,
    string,
    string,
    string,
    [number, number]
  ];
  if (!store) return undefined;

  return {
    id: Number(store[0]),
    name: store[1],
    description: store[2],
    phone: store[3],
    location: [Number(store[4][0]), Number(store[4][1])],
  };
});

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
    } catch (error) {
      console.log(error);
    } finally {
      fetchingStoreDetails.value = false;
    }
  },
  { immediate: true }
);
</script>
