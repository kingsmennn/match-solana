<template>
  <div
    class="tw-flex tw-flex-col tw-items-center tw-min-h-screen tw-overflow-x-hidden"
  >
    <header class="tw-w-full tw-bg-black tw-text-white">
      <div
        class="tw-px-6 sm:tw-px-10 tw-p-4 tw-max-w-7xl tw-mx-auto tw-flex tw-justify-between tw-items-center"
      >
        <div class="tw-flex tw-items-center tw-gap-10">
          <span class="tw-select-none tw-relative">
            <span class="tw-tracking-tighter tw-text-2xl">
              {{ env.appName }}
            </span>
            <NuxtLink to="/" class="tw-absolute tw-inset-0"></NuxtLink>
          </span>
          <nav v-if="isSeller">
            <NuxtLink to="/requests">Active Requests</NuxtLink>
          </nav>
        </div>

        <div class="tw-flex tw-gap-2 tw-items-center">
          <wallet-multi-button></wallet-multi-button>
          <NuxtLink
            v-if="!!userStore.accountId"
            :to="'/accounts/' + userStore.accountId"
            class="tw-flex tw-bg-white hover:tw-bg-white/80 tw-rounded-full tw-h-7 tw-w-7
            tw-items-center tw-justify-center tw-leading-none
            tw-transition-all tw-duration-300">
            <v-icon class="tw-text-black !tw-text-xl">mdi-home</v-icon>
          </NuxtLink>
          <NuxtLink
            v-if="!!userStore.accountId"
            to="/settings"
            class="tw-flex tw-bg-white hover:tw-bg-white/80 tw-rounded-full tw-h-7 tw-w-7
            tw-items-center tw-justify-center tw-leading-none
            tw-transition-all tw-duration-300">
            <v-icon class="tw-text-black !tw-text-xl">mdi-cog</v-icon>
          </NuxtLink>
          <!-- <button
            id="account-type"
            class="tw-inline-flex tw-items-center tw-p-1 tw-px-3 tw-rounded-full tw-bg-white tw-select-none tw-text-black hover:tw-bg-white/80 tw-relative tw-transition-all tw-duration-300"
            :disabled="connecting"
            @click="
              () => (userStore.isConnected ? null : handleWalletConnect())
            "
          >
            <template v-if="!connecting">
              {{ userStore.isConnected ? "Connected" : "Connect" }}
            </template>
            <v-progress-circular
              v-else
              indeterminate
              color="black"
              size="20"
              width="2"
            >
            </v-progress-circular>
            <span
              v-if="userStore.isNotOnboarded"
              class="tw-h-1.5 tw-w-1.5 tw-absolute tw-bottom-full tw-left-0 tw-bg-white tw-rounded-full tw-animate-ping"
            >
            </span>
          </button> -->

          <!-- <v-menu
            v-if="userStore.isConnected"
            activator="#account-type"
            transition="slide-y-transition"
          >
            <div
              class="tw-bg-white tw-mt-2 tw-rounded-lg tw-flex tw-flex-col tw-gap-3 tw-shadow-lg"
            >
              <span class="tw-text-sm tw-border-b tw-px-3 tw-py-2 tw-pb-1.5">
                Active account id
                <strong>{{ ellipsify(userStore.accountId!, 5) }}</strong>
              </span>
              <div
                class="tw-flex tw-gap-y-3 tw-px-3 tw-pb-3 [&>*]:tw-flex-1 tw-text-center"
              >
                <NuxtLink
                  :to="`${
                    userStore.isNotOnboarded
                      ? '/onboarding'
                      : '/accounts/' + userStore.accountId
                  }`"
                  class="tw-bg-black tw-text-white tw-justify-center tw-rounded-md tw-px-2 tw-p-1 tw-select-none"
                >
                  {{ userStore.isNotOnboarded ? "Onboarding" : "My account" }}
                </NuxtLink>
                <button
                  class="tw-select-none tw-self-start tw-text-rose-700"
                  @click="disconnect"
                >
                  Disconnect
                </button>
              </div>

              <span
                v-if="userStore.isNotOnboarded"
                class="tw-text-xs tw-text-gray-500 tw-px-3 tw-pb-3 tw-pt-2 tw-border-t"
              >
                Complete onboarding to start using the platform
              </span>
            </div>
          </v-menu> -->
        </div>
      </div>
    </header>

    <main class="tw-flex-grow tw-w-full">
      <slot />
    </main>

    <footer
      class="tw-max-w-7xl tw-w-full tw-mx-auto tw-px-6 sm:tw-px-10 tw-p-10"
    >
      <div>
        <div class="tw-select-none">
          <span
            class="tw-font-black tw-text-gray-200 tw-tracking-tighter tw-text-6xl"
          >
            {{ env.appName }}
          </span>
        </div>
      </div>
      <hr class="tw-max-w-7xl tw-w-full tw-mx-auto tw-mb-20 tw-mt-10" />
      <div>
        <span class="tw-text-xs tw-text-gray-500"
          >&copy;{{ env.appName }} 2023 | All rights reserved.</span
        >
        <div class="tw-flex tw-justify-between tw-items-end tw-text-sm">
          <div class="tw-space-x-4 tw-mt-3">
            <NuxtLink to="/terms">Terms of use</NuxtLink>
          </div>
        </div>
      </div>
    </footer>
    <Toaster closeButton />
  </div>
</template>

<script setup lang="ts">
import { User, AccountType, STORE_KEY_MIDDLEWARE, STORE_KEY } from "@/types";
import { useUserStore } from "@/pinia/user";
import { toast, Toaster } from "vue-sonner";
import { useWallet, WalletMultiButton } from "solana-wallets-vue";

const { publicKey, connected, disconnecting } = useWallet();
const env = useRuntimeConfig().public;
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const unwatch = watch(
  publicKey,
  async (val) => {
    if (!!val) {
      userStore.blockchainError.userNotFound = false;
      await userStore.connectToSolana();
      unwatch();
    }
  },
  { immediate: true }
);

watch(connected, (val) => {
  if(val){
    userStore.setUpSolanaConnectEvents();
    userStore.connectToSolana();
  }
});
watch(disconnecting, (val) => val && disconnect());

const userCookie = useCookie<User>(STORE_KEY_MIDDLEWARE, { watch: true });
const storeCookie = useCookie(STORE_KEY);
const isSeller = computed(
  () => userCookie.value?.accountType === AccountType.SELLER
);

const disconnect = async () => {
  try {
    userCookie.value = null as unknown as User;
    storeCookie.value = null;
    await userStore.disconnect();
    // only redirect if user is on a protected route
    if (route.meta.requiresAuth) {
      router.push("/");
    }
  } catch (error) {
    console.log(error);
  }
};

// check if connected user has been saved to the blockchain
watch(
  [() => userStore.blockchainError.userNotFound, () => userStore.accountId],
  ([userExists, accountId]) => {
    if (userExists && accountId) {
      // redirect to register page
      router.push("/onboarding");
    }
  }
);
watch(
  () => userStore.blockchainError.message,
  (message) => {
    if (message) {
      toast.error(message);
      userStore.blockchainError.message = "";
    }
  }
);
</script>
