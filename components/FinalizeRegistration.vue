<template>
  <div>
    <div
      class="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4 sm:tw-items-center tw-justify-between
      tw-bg-black tw-p-3 tw-rounded-lg tw-text-white md:tw-gap-10">
      <div class="tw-space-y-1">
        <div>
          <strong>Almost done!</strong> {{ heading }}
          <small class="tw-block tw-mb-2">
            <v-icon size="20">mdi-alert-circle</v-icon>
            {{ subHeading }}
          </small>
        </div>
        <div class="tw-h-3 tw-rounded-full tw-bg-white/40 tw-overflow-hidden">
          <span class="tw-block tw-h-full tw-w-[70%] tw-bg-white tw-rounded-full"></span>
        </div>
      </div>
  
      <button
        class="tw-px-3 tw-py-1 tw-rounded-full tw-bg-white tw-text-black
        hover:tw-bg-white/80 tw-transition-all tw-duration-300"
        @click="complete">
        <template v-if="!submitting">
          Complete
        </template>
        <v-progress-circular
          v-else
          indeterminate
          color="black"
          size="20" width="2">
        </v-progress-circular>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/pinia/user';
import { AccountType, STORE_KEY_MIDDLEWARE, User } from '@/types';
import { toast } from 'vue-sonner';

const location = ref({ lat: 0, lng: 0 })
const {
  getDevicePosition,
  locationWarnNotice
} = useGetLocation()

const heading = computed(()=>
  userStore.accountType === AccountType.BUYER ?
    'We just need access to your location 📍' :
    userStore.accountType === AccountType.SELLER ?
      'Lets help you setup your store' :
      null
)
const subHeading = computed(()=>
  userStore.accountType === AccountType.BUYER ?
    "For us to give you the best match for your items, you're advised to complete this step in the area you live" :
    userStore.accountType === AccountType.SELLER ?
      'This process is required for you to start using our platform as a '+AccountType.SELLER :
      null
)

const userStore = useUserStore()
const userCookie = useCookie<User>(STORE_KEY_MIDDLEWARE, { watch: true })
const router = useRouter()
const submitting = ref(false)
const complete = () => {
  submitting.value = true
  userStore.accountType === AccountType.BUYER ?
    getDevicePosition({
      // bePrecise:true,
      callback: async (position) => {
        location.value = {
          lng: position.coords.longitude,
          lat: position.coords.latitude
        }
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
          submitting.value = false
        }
      }
    }) :
    userStore.accountType === AccountType.SELLER ? router.push('/accounts/store-setup') : null
}

const unwatch = watch(()=>location.value.lat, async (val)=>{
  if(!val) return

  try {
    const res = await userStore.updateUser({
      lat: location.value.lat,
      long: location.value.lng,
      account_type: userStore.accountType
    })
    if (userStore?.userDetails) {
      userStore.userDetails[3] = [
        res?.location[0]!,
        res?.location[1]!
      ]
      userCookie.value.location = [
        res?.location[0]!,
        res?.location[1]!
      ]
    }
    unwatch()
  } catch (e){
    console.log(e)
  } finally {
    submitting.value = false
  }
}, { immediate: true })
</script>

<!-- <script setup lang="ts">
import { AccountType, Location, Store, User } from '@/types';
import { ref } from 'vue'
import states from '@/nigerian-states.json'
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useFirebaseAuth, useFirestore } from 'vuefire'

interface Props {
  modelValue: boolean
  accountType: AccountType
}
const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const modal = ref(false)
const form = ref<{
  username:string
  phone: string | null
  storeName?: string | null
  state?: string
  lga?: string
  market?: string
  stores?: Store[] | null
  location?: Location | null
}>({
  username: '',
  phone: null,
  storeName: null,
  state: '',
  lga: '',
  market: '',
  stores: null,
  location: null,
})

const statesAndLga = states as {
  code: string
  name: string
  lgas: string[]
}[]
const stateNames = computed(()=>{
  return statesAndLga.map(state=>state.name)
})
watch(()=>form.value.state, (value)=>{
  if(!value) return
  form.value.lga = ''
})
const activeLgas = computed(()=>{
  const state = statesAndLga.find(state=>state.name === form.value.state)
  return state?.lgas || []
})
const recordedMarkets = {
  "aba": [
    "aba main market",
    "ahia ohuru (new market)",
    "eziukwu market",
    "ariaria international market",
    "cemetery market",
  ],
  "nsukka": [
    "odenigbo market",
    "orie oba market",
    "orie iheaka market",
    "orie ofulonu market",
    "orie nru market",
    "orie eha alumona market",
    "orie opi market",
    "orie edem market",
    "orie ibagwa market",
    "orie ovoko market",
    "ogige market",
  ],
  "onitsha-north": [
    "onitsha main market",
    "ogboefere market",
    "ogbo ogwu market",
    "ogbo ogwu new market",
    "ogbo ogwu timber market",
    "ogbo ogwu motor parts market",
    "ogbo ogwu building materials market",
    "ogbo ogwu electrical materials market",
    "ogbo ogwu auto spare parts market",
    "ogbo ogwu iron and steel market",
    "ogbo ogwu plastic market",
    "ogbo ogwu textile market",
    "ogbo ogwu foodstuff market",
    "ogbo ogwu yam market",
  ],
  "enugu-east": [
    "abakpa market",
    "new haven market",
  ],
}
const marketsInActiveLga = computed(()=>{
  const markets = recordedMarkets[form.value.lga]
  return markets || []
})
watch(()=>form.value.lga, (value)=>{
  if(!value) return
  form.value.market = ''
})

const auth = useFirebaseAuth()! // only exists on client side
const db = useFirestore()
const user = useCurrentUser()
const userCookie = useCookie<User>('user')

const submiting = ref(false)
const handleFinalSignup = async () => {
  submiting.value = true
  const userRef = doc(db, "users", user.value?.email!)
  const payload = {
    ...form.value,
    updatedAt: Timestamp.now(),
  }
  if(props.accountType === AccountType.BUYER) {
    // empty unnecessary fields
    payload.phone = !!form.value.phone ? form.value.phone : null
    payload.location = {
      state: form.value.state!,
      lga: form.value.lga!,
    }
    delete payload.stores
  } else {
    // seller payload
    delete payload.location
    payload.stores = [
      {
        name: form.value.storeName!,
        location: {
          state: form.value.state!,
          lga: form.value.lga!,
          market: form.value.market!,
        }
      }
    ]
  }
  delete payload.market
  delete payload.state
  delete payload.lga
  delete payload.storeName

  await updateDoc(userRef, payload)
  const temp = userCookie.value
  // delete user cookie with vanilla js because useCookie was not working
  document.cookie = `user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  // set new cookie with updated info
  document.cookie = `user=${JSON.stringify({
    ...temp,
    username: payload.username,
    phone: payload.phone,
    stores: payload?.stores || null,
  })}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT;`

  emit('update:modelValue', true)
  submiting.value = false
  modal.value = false
}
</script> -->