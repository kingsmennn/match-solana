<template>
  <div>
    <div class="tw-relative">
      <div class="tw-max-w-7xl tw-mx-auto lg:tw-absolute tw-inset-0 tw-p-6 sm:tw-p-10 tw-z-10">
        <div class="lg:tw-w-1/2 tw-min-h-full tw-bg-white sm:tw-p-6">
          <!-- this Tabs component isn't visually rendered, only used to detect the tab user was
          coming from on the landing page OR the signup form to display -->
          <Tabs :tab_list="tab_list" query_name="user_type" :value="tab" @model-value="(value)=>handleInitAccountSelected(value as AccountType)"></Tabs>

          <div>
            <h2 class="tw-text-5xl tw-font-bold">Lastly...</h2>
            <form @submit.prevent="handleCompleteOnbaording" class="tw-mt-4 tw-text-2xl">
              <label class="tw-relative tw-block">
                <span class="tw-absolute tw-text-base tw-pl-4 tw-pt-1">Choose username</span>
                <input
                  v-model="form.username"
                  type="text"
                  :placeholder="usernameSlug"
                  :required="true"
                  @dblclick="handleDoubleClick"
                  class="tw-w-full tw-bg-gray-100 tw-p-4 tw-pt-7 tw-rounded-md tw-outline-black">
              </label>

              <label class="tw-block tw-cursor-pointer tw-select-none">
                <input
                  v-model="form.accountType"
                  type="radio"
                  name="account-type"
                  :value="AccountType.BUYER"
                  :required="true"
                  class="tw-appearance-none tw-peer">
                <div
                  class="tw-border-2 peer-checked:tw-border-black tw-text-gray-300 peer-checked:tw-text-black
                  tw-rounded-md tw-p-4 tw-font-medium tw-flex tw-justify-between">
                  <span>I am looking for items to buy</span>
                  <v-icon>mdi-check</v-icon>
                </div>
              </label>

              <label class="tw-block tw-cursor-pointer tw-select-none">
                <input
                  v-model="form.accountType"
                  type="radio"
                  name="account-type"
                  :value="AccountType.SELLER"
                  :required="true"
                  class="tw-appearance-none tw-peer">
                <div
                  class="tw-border-2 peer-checked:tw-border-black tw-text-gray-300 peer-checked:tw-text-black
                  tw-rounded-md tw-p-4 tw-font-medium tw-flex tw-justify-between">
                  <span>I sell stuff</span>
                  <v-icon>mdi-check</v-icon>
                </div>
              </label>

              <button
                class="tw-w-full tw-bg-black tw-text-white tw-py-4 tw-mt-10 tw-rounded-md tw-font-medium"
                :disabled="submiting">
                <template v-if="!submiting">
                  Complete
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

      <div class="tw-hidden lg:tw-block tw-h-[calc(100vh-80px)] tw-bg-gray-50">
        <img
          src="https://firebasestorage.googleapis.com/v0/b/i-get-am.appspot.com/o/pexels-laura-james-6097813.jpg?alt=media&token=87a84a9c-2917-4502-84b9-6d1d032b0770"
          class="tw-w-full tw-h-full tw-object-cover">
      </div>
    </div>
    <v-snackbar
      v-model="snackbar.show">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import Tabs from '@/components/Tabs.vue'
import { AccountType, CreateUserDTO, User } from '@/types';
import { useUserStore } from '@/pinia/user';
import { generateSlug, RandomWordOptions } from "random-word-slugs";

const env = useRuntimeConfig().public
useHead({
  title: env.appName+' - Register',
})
definePageMeta({
  middleware: 'guest',
})

const tab = ref()
const tab_list:{ slug: AccountType }[] = [
  { slug: AccountType.BUYER },
  { slug: AccountType.SELLER },
]

const form = ref<User>({
  accountType: '' as unknown as AccountType,
  username: '',
  // secondary data to be collected later or generated
  location: [ 0, 0 ],
  phone: '',
  createdAt: new Date(),
})

const snackbar = ref({
  show: false,
  text: ''
})

const handleInitAccountSelected = (value: AccountType) => {
  tab.value = value
  form.value.accountType = value
}

const options: RandomWordOptions<2> = {
  format: "kebab",
  categories: {
    noun: ["people"],
  },
  partsOfSpeech: ['noun', 'noun']
};
const usernameSlug = generateSlug(2, options);
const handleDoubleClick = ()=>form.value.username = usernameSlug

const router = useRouter()

const userStore = useUserStore()
const submiting = ref(false)
const handleCompleteOnbaording = async () => {
  submiting.value = true
  try {
    const payload: CreateUserDTO = {
      username: form.value.username,
      account_type: form.value.accountType,
      phone: '',
      long: form.value.location[0],
      lat: form.value.location[1],
    }
    await userStore.createUser(payload)
    router.push('/accounts/'+ userStore.accountId)
  } catch(e) {
    // haldle errors
    console.log(e)
  } finally {
    submiting.value = false
  }
}

// const userCookie = useCookie<User>('user')
// const saveToCookie = async (user: User) => {
//   await new Promise((resolve) => {
//     userCookie.value = user
//     resolve(true)
//   })
// }
</script>