<template>
  <div class="tw-max-w-7xl tw-mx-auto">
    <div class="tw-p-6 sm:tw-p-10 tw-text-2xl">
      <NuxtLink
        :to="'/accounts/' + userStore.accountId"
        class="tw-text-xl tw-font-medium tw-inline-flex tw-items-center tw-gap-2"
      >
        <v-icon>mdi-chevron-left</v-icon>
        <span>Back</span>
      </NuxtLink>

      <h1 class="tw-text-5xl tw-font-bold tw-mt-4">New request creation</h1>
      <p class="tw-text-gray-500">
        Please provide some details and images of the item you want to buy.
      </p>

      <form @submit.prevent="handleNewRequest" class="tw-text-2xl">
        <div class="tw-grid tw-grid-cols-3 tw-items-end tw-gap-10 tw-mt-6">
          <div class="tw-col-span-3 sm:tw-col-span-2 tw-row-start-1">
            <label class="tw-relative tw-block">
              <span class="tw-absolute tw-text-base tw-pl-4 tw-pt-1"
                >Name of item</span
              >
              <input
                v-model="form.name"
                type="text"
                placeholder="Plastic Spatula"
                :required="true"
                class="tw-w-full tw-bg-gray-100 tw-p-4 tw-pt-7 tw-rounded-md tw-outline-black"
              />
            </label>

            <label class="tw-relative tw-block tw-mt-6">
              <span
                class="tw-absolute tw-top-px tw-left-1 tw-text-base tw-pl-3 tw-pt-[3px] tw-bg-gray-100"
                >Describe this items</span
              >
              <textarea
                v-model="form.description"
                placeholder="Any spatular made of plastic is fine but it must be black"
                :required="true"
                class="tw-w-full tw-bg-gray-100 tw-p-4 tw-pt-7 tw-rounded-md tw-outline-black tw-min-h-[120px] tw-max-h-[120px]"
              >
              </textarea>
            </label>
          </div>

          <button
            class="tw-w-full tw-bg-black tw-text-white tw-py-4 tw-rounded-md tw-font-medium tw-row-start-4 sm:tw-row-start-2 tw-col-start-1 tw-col-span-full sm:tw-col-span-2 disabled:tw-bg-black/20"
            :disabled="submiting || uploadingImage"
          >
            <template v-if="!submiting"> Create! </template>
            <v-progress-circular
              v-else
              indeterminate
              color="white"
              size="20"
              width="2"
            >
            </v-progress-circular>
          </button>

          <div class="tw-col-span-3 sm:tw-col-span-1">
            <div
              class="tw-h-[300px] tw-bg-gray-100 tw-relative tw-rounded-lg tw-overflow-hidden"
            >
              <v-col class="tw-h-full pa-0">
                <ClientOnly>
                  <v-carousel
                    v-model="carousel"
                    cycle
                    :show-arrows="true"
                    hide-delimiter-background
                    hide-delimiters
                    height="100%"
                  >
                    <v-carousel-item
                      ripple
                      v-for="(image, n) in renderedCarouselImages"
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

              <!-- image upload progress -->
              {{ progress }}
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

          <div class="tw-col-span-full sm:tw-col-span-1">
            <p
              v-if="files?.length === 1"
              class="tw-text-xs tw-inline-flex tw-items-center"
            >
              Selected file: <strong>{{ files.item(0)!.name }}</strong>
              <v-icon @click="resetFiles" size="28">mdi-minus-circle</v-icon>
            </p>
            <button
              type="button"
              @click="handleAddImaageBtnClick"
              class="tw-w-full tw-bg-black tw-text-white tw-py-3 tw-mt-2 tw-rounded-md tw-font-medium tw-text-base"
              :disabled="uploadingImage"
            >
              <template v-if="!uploadingImage">
                <span>{{
                  files?.length === 1 ? "Upload selected image" : "Add image"
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
      </form>
    </div>
    <v-dialog v-model="successModal" max-width="300">
      <div
        class="tw-bg-white tw-p-6 tw-text-black tw-flex tw-flex-col tw-items-center"
      >
        <div class="tw-text-center">
          <h2 class="tw-text-5xl tw-font-bold">Success!!!</h2>
          <p>Your request has been broadcasted</p>
        </div>

        <div class="tw-pb-6 tw-mt-10">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/i-get-am.appspot.com/o/giphy.gif?alt=media&token=06ec1248-5943-4153-aa62-9e4e28d8c9f2"
            class="tw-h-[200px] tw-w-[200px] tw-object-cover tw-object-left tw-rounded-xl"
          />
        </div>
        <p class="tw-text-center tw-font-medium">
          Redirecting you in 3 seconds...
        </p>
      </div>
    </v-dialog>

    <v-snackbar v-model="snackbar.show">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useFileDialog } from "@vueuse/core";
import { useRequestsStore } from "@/pinia/request";
import { toast } from "vue-sonner";
import { useUserStore } from "@/pinia/user";

definePageMeta({
  middleware: ["auth", "buyer"],
  requiresAuth: true,
});

const snackbar = ref({
  show: false,
  text: "",
});

const carousel = ref(0);
const spatularImages = [
  "https://firebasestorage.googleapis.com/v0/b/i-get-am.appspot.com/o/istockphoto-1167356564-612x612.jpg?alt=media&token=ec1b8ee2-d532-4204-a1f3-c66833ee694e",
  "https://firebasestorage.googleapis.com/v0/b/i-get-am.appspot.com/o/istockphoto-1270011649-612x612.jpg?alt=media&token=210f6704-b960-437a-b30b-3ea4c3a146ff",
  "https://firebasestorage.googleapis.com/v0/b/i-get-am.appspot.com/o/istockphoto-134724298-612x612.jpg?alt=media&token=adf99e2d-daef-41f9-af29-4fc4fbb72284",
];
const hasImages = computed(() => form.value.images.length > 0);
const renderedCarouselImages = computed(() =>
  hasImages.value ? form.value.images : spatularImages
);

const form = ref({
  name: "",
  description: "",
  images: [] as string[],
  state: "",
  lga: "",
  market: "",
});
const resetForm = () => {
  form.value = {
    name: "",
    description: "",
    images: [] as string[],
    state: "",
    lga: "",
    market: "",
  };
};
const removeImage = (n: number) => form.value.images.splice(n, 1);

// IMAGE UPLOAD SECTION
const { progress, uploadFile } = useLightHouseUpload();
const { files, open, reset: resetFiles } = useFileDialog();
const uploadingImage = ref(false);
const readyForAnotherUpload = ref(true);
const handleAddImaageBtnClick = async () => {
  // if a file has been selected
  if (files.value?.length === 1) {
    // start upload
    uploadingImage.value = true;
    readyForAnotherUpload.value = false;
    const data = files.value?.item(0);
    if (data) {
      const res = await uploadFile(data);
      form.value.images.push(res);
      // upload file here
      uploadingImage.value = false;
      carousel.value = 0;
      resetFiles();
    }
    return;
  }
  open({ accept: "image/*", multiple: false });
};

// SUBMIT REQUEST
const router = useRouter();
const successModal = ref(false);
const submiting = ref(false);
const requestsStore = useRequestsStore();
const userStore = useUserStore();
const handleNewRequest = async () => {
  // because image is required
  if (!form.value.images.length) {
    toast.warning("Please add at least one image of the item you want to buy");
    return;
  }

  try {
    submiting.value = true;
    const response = await requestsStore.createRequest({
      name: form.value.name,
      description: form.value.description,
      images: form.value.images,
      longitude: userStore.location?.[0]!,
      latitude: userStore.location?.[1]!,
    });
    if (typeof response === "undefined") {
      return;
    }
    resetForm();
    toast.success("Request created successfully");
    // get request details
    // setTimeout(()=>router.push('/requests/'+res.key), 3000)
  } catch (error) {
    toast.error("an error occured, please try again");
    console.log({ errorCreatingRequest: error });
  } finally {
    submiting.value = false;
  }
};
</script>
