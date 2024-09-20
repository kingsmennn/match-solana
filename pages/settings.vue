<script setup lang="ts">
import { useUserStore } from '@/pinia/user';
import { AccountType } from '@/types';
import { toast } from 'vue-sonner';

definePageMeta({
  middleware: ['auth'],
  requiresAuth: true,
})
const userStore = useUserStore()
// if user was in this page and they disconnected, eject them
watch(() => userStore.accountId, (accountId) => {
  if(accountId) return
  navigateTo('/')
})

const enableRequestByProximity = ref(false)
const updatingProximityPreference = ref(false)
watch(()=>userStore.locationEnabled, (value)=>{
  enableRequestByProximity.value = value
}, { immediate: true })

// this is used to enable/disable location preference
const handleToggleEnableLocation = async (val: boolean) => {
  updatingProximityPreference.value = true
  try {
    await userStore.toggleEnableLocation(val)
    toast.success(val ? 'proximity preference enabled' : 'proximity preference disabled')
  } catch (error) {
    console.log(error)
    toast.error((error as Error).message || 'unable to update proximity preference')
    // revert back to previous value
    enableRequestByProximity.value = !val
  } finally {
    updatingProximityPreference.value = false
  }
}
const switchColor = computed(()=>enableRequestByProximity.value ? 'white' : 'black')
const locationText = computed(()=>
  userStore.accountType === AccountType.SELLER ?
    'Show only requests near me' : 'Only stores arround me should see my requests (use location)'
)
</script>

<template>
  <div class="tw-max-w-7xl tw-mx-auto">
    <div class="tw-p-6 sm:tw-p-10">
      <h1 class="tw-text-5xl tw-font-bold tw-mt-4">
        Settings
      </h1>

      <div class="tw-mt-10 tw-py-10 tw-flex tw-flex-col tw-gap-4 tw-border-t">

        <div
          class="tw-flex tw-justify-between md:tw-items-center tw-p-2 tw-px-4
          tw-gap-3 tw-rounded-2xl tw-bg-gray-50 tw-text-2xl">
          <span class="flex-1 tw-font-bold">{{ locationText }}</span>
          <span class="max-md:tw-self-start">
            <v-switch
              v-model="enableRequestByProximity"
              :loading="updatingProximityPreference && switchColor"
              hide-details="auto"
              inset
              @update:model-value="(handleToggleEnableLocation as any)"
            ></v-switch>
          </span>
        </div>

      </div>
    </div>
  </div>
</template>