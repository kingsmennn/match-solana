<script setup lang="ts">
import { useStoreStore } from '@/pinia/store';
import { useUserStore } from '@/pinia/user';
import { toast } from 'vue-sonner';

definePageMeta({
  middleware: ['auth', 'seller'],
  requiresAuth: true,
})

const form = ref({
  storeName: '',
  description: '',
  phone: '',
  locationObtained: false
})

const location = ref({ lat: 0, lng: 0 })
const {
  getDevicePosition,
  locationWarnNotice
} = useGetLocation()

// location preference
const locationEnabled = computed(() => userStore.locationEnabled)

const gettingLocation = ref(false)
const handleLocation = ()=> {
  gettingLocation.value = true
  getDevicePosition({
    // bePrecise:true,
    callback: (position) => {
      location.value = {
        lng: position.coords.longitude,
        lat: position.coords.latitude
      }
      form.value.locationObtained = true
      gettingLocation.value = false
    },
    onError: async (error) => {
      try {
        const res = await userStore.getUserLocation()
        location.value = {
          lng: res.location.lng,
          lat: res.location.lat,
        }
      } catch (error) {
        toast.error('Please try again: '+(error as Error).message)
      } finally {
        gettingLocation.value = false
      }
    }
  })
}

const router = useRouter()
const userStore = useUserStore()
const storesStore = useStoreStore()
const submiting = ref(false)
const complete = async () => {
  // if(!form.value.locationObtained) return toast.error(locationWarnNotice)
  submiting.value = true
  try {
    await storesStore.createStore({
      name: form.value.storeName,
      description: form.value.description,
      phone: form.value.phone,
      longitude: location.value.lng || 0,
      latitude: location.value.lat || 0,
    })
    // redirect back to accounts page
    toast.success("Your store's successfully created!")
    router.replace('/accounts/'+ userStore.accountId)
  } catch (error) {
    console.log(error)
    toast.error(error as any)
  } finally {
    submiting.value = false
  }
}
</script>

<template>
  <div class="tw-max-w-7xl tw-mx-auto">
    <div class="tw-p-6 sm:tw-p-10">
      <div class="tw-bg-white tw-gap-4 tw-text-black">
        <div>
          <h2 class="tw-text-5xl tw-font-bold">Store Setup</h2>
          <small
            v-if="locationEnabled"
            class="tw-bg-black tw-text-white tw-p-1 tw-mt-2">
            <v-icon size="20">mdi-alert-circle</v-icon>
            This (ONE-TIME-SETUP) process is to be completed within your store premise (<strong>recommended: inside your store</strong>)
          </small>
          <small v-else class="tw-bg-black tw-text-white tw-p-1 tw-mt-2">
            <v-icon size="20">mdi-alert-circle</v-icon>
            (ONE-TIME-SETUP): Note that your location preference is disabled in <NuxtLink class="tw-underline" to="/settings">settings</NuxtLink>,
            you will not be able to see requests made around your store
          </small>
          <form @submit.prevent="complete" class="tw-mt-4 tw-text-2xl">
            <div>
              <label class="tw-relative tw-mt-4 tw-block">
                <span class="tw-absolute tw-text-base tw-pl-4 tw-pt-1">
                  Contact number
                </span>
                <input
                  v-model="form.phone"
                  type="text"
                  placeholder="+234 901 2345 678"
                  required
                  class="tw-w-full tw-bg-gray-100 tw-p-4 tw-pt-7 tw-rounded-md tw-outline-black">
              </label>
  
              <fieldset class="tw-border-t-4 tw-my-10">
                <legend class="tw-px-4 tw-text-center">
                  <h2 class="tw-text-gray-600">About your store</h2>
                </legend>
              </fieldset>
  
              <label class="tw-relative tw-block">
                <span class="tw-absolute tw-text-base tw-pl-4 tw-pt-1">What is your stores name?</span>
                <input
                  v-model="form.storeName"
                  type="text"
                  placeholder="Arya's Clothing"
                  :required="true"
                  class="tw-w-full tw-bg-gray-100 tw-p-4 tw-pt-7 tw-rounded-md tw-outline-black">
              </label>

              <label class="tw-relative tw-block tw-mt-4">
                <span class="tw-absolute tw-text-base tw-pl-4 tw-pt-1">What is your stores description?</span>
                <textarea
                  v-model="form.description"
                  placeholder="We sell the best cosplay clothes in the universe"
                  required
                  class="tw-w-full tw-bg-gray-100 tw-p-4 tw-pt-7 tw-rounded-md tw-outline-black tw-min-h-[100px]">
                </textarea>
              </label>

              <div v-if="locationEnabled">
                <div class="tw-flex tw-mt-4">
                  <button
                    @click="handleLocation"
                    type="button"
                    :disabled="gettingLocation"
                    class="tw-bg-black tw-text-white tw-px-6 tw-rounded-l-md tw-relative tw-flex tw-items-center tw-justify-center">
                    Add
                    <v-progress-circular
                      v-if="gettingLocation"
                      class="!tw-absolute"
                      indeterminate
                      color="white"
                      size="30" width="3">
                    </v-progress-circular>
                  </button>
                  <label class="tw-flex-1 tw-relative tw-block">
                    <span class="tw-absolute tw-text-base tw-pl-4 tw-pt-1">
                      Add stores location
                    </span>
                    <input
                      :value="form.locationObtained ? `long - ${location.lng} lat - ${location.lat}` : null"
                      type="text"
                      placeholder="long - xxx, lat - xxx"
                      required
                      readonly
                      class="tw-w-full tw-bg-gray-100 tw-p-4 tw-pt-7 tw-rounded-md tw-outline-black">
                  </label>
                </div>
                <small
                  class="tw-bg-black tw-text-white tw-p-1 tw-mt-2 tw-text-base">
                  <v-icon size="20">mdi-alert-circle</v-icon>
                  You're seeing this because your location preference is enabled in <NuxtLink class="tw-underline" to="/settings">settings</NuxtLink>
                </small>
              </div>
            </div>

            <button
              class="tw-w-full tw-bg-black tw-text-white tw-py-4 tw-mt-10 tw-rounded-md tw-font-medium"
              :disabled="submiting">
              <template v-if="!submiting">
                Finish
              </template>
              <v-progress-circular
                v-else
                indeterminate
                color="white"
                size="20" width="2">
              </v-progress-circular>
            </button>
          </form>
        </div>
      </div>

    </div>
  </div>
</template>