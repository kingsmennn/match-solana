<template>
  <div>
    <div>
      <div class="tw-col-span-3 sm:tw-col-span-1">
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
                  <button
                    v-if="hasImages"
                    type="button"
                    class="tw-group tw-absolute tw-top-2 tw-right-2 tw-bg-white tw-rounded-full
                    tw-h-8 tw-w-8 tw-ring-4 tw-ring-black/10 tw-flex tw-items-center tw-justify-center"
                    @click="removeImage(n)">
                    <v-icon
                      class="group-hover:!tw-text-red-600  tw-transition-all tw-duration-300"
                      size="28">
                      mdi-minus-circle
                    </v-icon>
                  </button>
                </v-carousel-item>
              </v-carousel>
            </ClientOnly>
          </v-col>
          <div
            v-if="!images.length"
            class="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center"
          >
            <v-icon>mdi-camera</v-icon>
          </div>

          <!-- image upload progress -->
          <div
            class="tw-absolute tw-inset-0 tw-flex tw-items-end tw-pointer-events-none"
          >
            <div v-show="!readyForAnotherUpload" class="tw-h-4 tw-w-full">
              <div
                :style="`width: ${Number(progress) * 100}%`"
                class="tw-w-0 tw-h-full tw-bg-black/90 tw-transition-all tw-duration-300"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!hasSubmittedOffer">
        <p
          v-if="files?.length === 1"
          class="tw-text-xs tw-inline-flex tw-items-center"
        >
          Selected file: <strong>{{ files.item(0)!.name }}</strong>
          <v-icon @click="resetFiles" size="28">mdi-minus-circle</v-icon>
        </p>
        <button
          type="button"
          @click="handleAddImageBtnClick"
          class="tw-w-full tw-bg-black tw-text-white tw-py-3 tw-mt-2 tw-font-medium tw-text-base"
          :disabled="uploadingImage"
        >
          <template v-if="!uploadingImage">
            <span>{{
              files?.length === 1 ? "Upload selected image" : "Add proof image"
            }}</span>
          </template>
          <v-progress-circular
            v-else
            indeterminate
            color="white"
            size="20"
            width="2"
          >
          </v-progress-circular>
        </button>
      </div>
    </div>

    <div>
      <form @submit.prevent="handleFormSubmit" class="tw-text-2xl tw-mt-6">
        <div class="tw-space-y-4">
          <div class="tw-col-span-3 sm:tw-col-span-2 tw-row-start-1">
            <label class="tw-relative tw-block">
              <span class="tw-absolute tw-text-base tw-pl-4 tw-pt-1"
                >How much are you selling({{ PAYMENT_COIN }})?</span
              >
              <input
                v-model="form.price"
                type="number"
                placeholder="0.1 SOL"
                min="0"
                step="0.0000000001"
                :required="true"
                class="tw-w-full tw-bg-gray-100 tw-p-4 tw-pt-7 tw-rounded-md tw-outline-black"
              />
            </label>
          </div>

          <button
            class="tw-w-full tw-bg-black tw-text-white tw-py-4 tw-rounded-md tw-font-medium tw-row-start-4 sm:tw-row-start-2 tw-col-start-1 tw-col-span-full sm:tw-col-span-2 disabled:tw-bg-black/20"
            :disabled="submiting || uploadingImage"
          >
            <template v-if="!submiting">
              {{ hasSubmittedOffer ? "Update" : "Submit" }} offer
            </template>
            <v-progress-circular
              v-else
              indeterminate
              color="white"
              size="20"
              width="2"
            >
            </v-progress-circular>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from "@/pinia/user";
import { useRequestsStore } from "@/pinia/request";
import { toast } from "vue-sonner";
import { AnchorError } from "@project-serum/anchor";
import { lamportsToSol } from "@/utils/contract-utils";
import { PAYMENT_COIN } from "@/utils/constants";

type Props = {
  requestId: number;
  sellerIds: number[];
  images: string[] | null; // used to pass default images for after offer is submitted
  quotePrice: number | null; // used to pass default price for after offer is submitted
  offerId: number | null; // used to update offer
  lockedSellerId: number | null; // used to check if seller is locked
};
const props = defineProps<Props>();
const carousel = ref(0);

// IMAGE UPLOAD SECTION
const { progress, uploadFile } = useLightHouseUpload();
const { files, open, reset: resetFiles } = useFileDialog();
const uploadingImage = ref(false);
const readyForAnotherUpload = ref(true);
const images = ref<string[]>([]);
const hasImages = computed(() => images.value.length > 0);
const handleAddImageBtnClick = async () => {
  // if a file has been selected
  if (files.value?.length === 1) {
    // start upload
    uploadingImage.value = true;
    readyForAnotherUpload.value = false;
    const data = files.value?.item(0);
    if (data) {
      const res = await uploadFile(data);
      images.value.push(res);
      // upload file here
      uploadingImage.value = false;
      carousel.value = 0;
      resetFiles();
    }
    return;
  }
  open({ accept: "image/*", multiple: false });
};
const removeImage = (n: number) => images.value.splice(n, 1);

// SUBMIT OFFER
const form = ref({
  price: null as number | null,
});
const userStore = useUserStore();
const requestsStore = useRequestsStore();
const hasSubmittedOffer = computed(() =>
  props.sellerIds.includes(userStore.userDetails?.[0]!)
);
const submiting = ref(false);
const handleFormSubmit = async () => {
  if (!images.value.length) {
    toast.warning("Please add proof image");
    return;
  }
  submiting.value = true;
  try {
    await requestsStore.createOffer({
      price: Math.trunc(solToLamports(form.value.price!)),
      requestId: props.requestId,
      storeName: userStore.storeDetails?.[0]?.name! || "default store",
      images: [...images.value],
    });
    images.value = [];
    form.value.price = 0;
    toast.success(
      `You have successfully ${
        hasSubmittedOffer.value ? "updated your" : "made an"
      } offer!`
    );
  } catch (error:any) {
    if (error instanceof AnchorError) {
      const err: AnchorError = error;
      toast.error(err.error.errorMessage);
      return;
    }
    if(error.transactionMessage) {
       toast.error(error.transactionMessage);
       return;
    }
    toast.error(error);
  } finally {
    submiting.value = false;
  }
};

const unwatch = watch(
  () => props.offerId,
  () => {
    form.value.price = props.quotePrice;
    images.value = props.images || [];
    unwatch();
  }
);
</script>
