<template>
  <div>
    <div class="tw-h-[70vh] tw-bg-gray-100 tw-relative">
      <v-col class="tw-h-full pa-0">
        <ClientOnly>
          <v-carousel v-model="carousel" cycle :show-arrows="(requestDetails?.images || []).length>1"
            hide-delimiter-background hide-delimiters height="100%">
            <v-carousel-item ripple v-for="(image, n) in requestDetails?.images" :key="n" :src="image" cover>
              <div class="tw-absolute tw-inset-x-0 tw-bottom-0 tw-max-w-7xl tw-mx-auto">
                <div class="tw-p-6 sm:tw-p-10 tw-flex tw-justify-end">
                  <button
                    @click="previewImage(image)"
                    class="tw-bg-black tw-text-white tw-p-1 tw-ring-1 tw-ring-white/30">
                    <v-icon>mdi-arrow-expand-all</v-icon>
                  </button>
                </div>
              </div>
            </v-carousel-item>
          </v-carousel>
        </ClientOnly>
      </v-col>
    </div>
    <div v-if="!!requestDetails?.requestId" class="tw-max-w-7xl tw-mx-auto tw-p-6 sm:tw-p-10">
      <Tabs
        :tab_list="tab_list"
        :value="tab"
        @model-value="($event: any) => tab = $event"
        class="tw-inline-flex tw-gap-x-1 sm:tw-gap-x-2 tw-justify-between
        tw-rounded-sm tw-w-full [&>*]:tw-flex-grow [&>*]:tw-max-w-[50%] sm:tw-hidden">
        <template v-slot:tab="{ tab, index: i, is_active }">
          <div
            :class="[is_active ? 'tw-border-black' : 'tw-text-gray-400 tw-border-transparent']"
            class="tw-border-b-4 tw-py-2 tw-transition tw-duration-300 tw-font-medium tw-cursor-pointer">
            <span class="tw-flex tw-flex-col tw-items-center">
              <span>{{ tab?.name }}</span>
            </span>
          </div>
        </template>
      </Tabs>

      <div>
        <div class="tw-grid sm:tw-grid-cols-3 tw-gap-10 tw-pt-4 sm:tw-pt-0">
          <div
            :class="{ 'tw-hidden sm:tw-block': tab !== tab_list[0].slug }"
            class="sm:tw-col-span-2 tw-space-y-14">
            <div>
              <h2 class="tw-text-5xl tw-font-bold tw-bg-black tw-text-white">
                {{ requestDetails.requestName }}
              </h2>
              <p>{{ timeAgo }}</p>
            </div>

            <div class="">
              <h3 class="tw-text-5xl tw-font-bold">Description</h3>
              <p class="tw-mt-2 tw-text-2xl">{{ requestDetails.description }}</p>
            </div>
          </div>

          <div
            :class="{ 'tw-hidden sm:tw-block': tab !== tab_list[1].slug }"
            class="sm:tw-col-span-1">
            <template v-if="isBuyer" >
              <div v-if="renderedOffers.length" class="tw-space-y-4">
                <template v-for="(offer,n) in renderedOffers" :key="n">
                  <!-- {{ offer }} -->
                  <SellerOffer
                    :offer-id="offer.offerId!"
                    :request-id="requestDetails.requestId"
                    :store-name="offer.storeName"
                    :buyer-id="requestDetails.buyerId"
                    :seller-id="Number(offer.sellerId)"
                    :images="offer.images"
                    :lifecycle="requestDetails.lifecycle"
                    :price-quote="offer.price"
                    :is-accepted="offer.isAccepted"
                    @offer-accepted="handleMarkAsAccepted(offer.offerId!)"
                  />
                </template>
              </div>
              <div v-else
                class="tw-p-6 tw-py-10 tw-text-center tw-border-4 tw-border-gray-400/5 tw-rounded-2xl
                tw-bg-gray-300/5 tw-text-2xl tw-text-gray-500">
                <p>No offers yet</p>
              </div>
            </template>

            <template v-else>
              <SellerQuoteRequestor
                :request-id="requestDetails.requestId"
                :seller-ids="requestDetails?.sellerIds || []"
                :locked-seller-id="requestDetails?.lockedSellerId || null"
                :images="sellerExistingOffer?.images || []"
                :quote-price="sellerExistingOffer?.price || 0"
                :offer-id="sellerExistingOffer?.id || null"
              />
            </template>
          </div>
        </div>
      </div>

    </div>
    <div v-else class="tw-text-center tw-py-20">
      <p class="tw-text-4xl tw-text-black">loading...</p>
    </div>

    <v-dialog v-model="imagePreview" max-width="500">
      <div>
        <img
          :src="previewedImage"
          class="tw-h-full tw-w-full tw-object-contain">
      </div>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import SellerOffer from '@/components/SellerOffer.vue';
import SellerQuoteRequestor from '@/components/SellerQuoteRequestor.vue';
import { AccountType, Offer, Request, RequestLifecycleIndex, RequestResponse, User } from '@/types';
import moment from 'moment'
import { useRequestsStore } from '@/pinia/request';
import { useUserStore } from '@/pinia/user';
import { toast } from 'vue-sonner';

definePageMeta({
  middleware: 'auth',
  requiresAuth: true,
})

const route = useRoute()
const router = useRouter()
if(!route.params.id) router.push('/')

const carousel = ref(0)

const requestDetails = ref<RequestResponse>()
const requestsStore = useRequestsStore()
const userStore = useUserStore()
const fetchUserRequest = async () => {
  const res = await requestsStore.getRequest(route.params.id as unknown as number)
  requestDetails.value = res
}

const unwatch = watch(()=>userStore.accountId, (val)=>{
  if(!val ) return
  fetchUserRequest()
}, { immediate: true })

const timeAgo = computed<string>(()=>{
  if(!requestDetails.value) return ''
  return moment(new Date(requestDetails.value.createdAt * 1000)).fromNow()
})


const imagePreview = ref(false)
const previewedImage = ref('')
const previewImage = (src: string) => {
  imagePreview.value = true
  previewedImage.value = src
}

const isSeller = computed(() => userStore.accountType === AccountType.SELLER)
const isBuyer = computed(() => userStore.accountType === AccountType.BUYER) 

const tab = ref()
const tab_list = ref<{ name: string, slug: string }[]>([])
onBeforeMount(()=>{
  if (isSeller.value) {
    tab_list.value = [
      { name: 'Details', slug: 'details' },
      { name: 'My offer', slug: 'seller' },
    ]
    return
  }

  tab_list.value = [
    { name: 'Details', slug: 'details' },
    { name: 'Sellers offer', slug: 'seller' },
  ]
})

const allOffers = ref<Offer[]>([])
const fetchingOffers = ref(false)
const fetchAllOffers = async () => {
  fetchingOffers.value = true
  try {
    const res = await requestsStore.fetchAllOffers(requestDetails.value?.requestId!)
    allOffers.value = res || []
  } catch (error) {
    toast.error("error fetching offers")
  } finally {
    fetchingOffers.value = false
  }
  // allOffers.value = offerList
}
watch(()=>requestDetails.value?.requestId, (val)=>{
  if(!val) return
  fetchAllOffers()
}, { immediate: true })

const renderedOffers = computed(()=>{
  if(requestDetails.value?.lifecycle === RequestLifecycleIndex.ACCEPTED_BY_BUYER) {
    return allOffers.value
  }
  return (
    requestDetails.value?.lifecycle === RequestLifecycleIndex.REQUEST_LOCKED ||
    requestDetails.value?.lifecycle === RequestLifecycleIndex.COMPLETED
  )
    ? allOffers.value.filter(offer => offer.isAccepted)
    : allOffers.value
})

const sellerExistingOffer = computed(()=>{
  if(!allOffers.value.length) return null as unknown as Offer
  let res: Offer = null as unknown as Offer
  allOffers.value.forEach((offer)=>{
    if(Number(offer.sellerId) === userStore.userId){
      res = offer
    }
  })
  return res
})

const handleMarkAsAccepted = (offerId: number) => {
  // mark offer as accepted
  allOffers.value.forEach((offer)=>{
    // reset all other offers
    offer.isAccepted = false
    if(offer.id === offerId){
      offer.isAccepted = true
    }
  })
}
</script>