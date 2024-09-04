<template>
  <div class="tw-flex tw-items-center tw-text-black">
    <v-icon class="tw-mx-1 tw-text-base">mdi-github</v-icon>
    <a class="tw-font-mono tw-text-sm" :href="link">{{text}}</a>
  </div>
</template>

<script setup lang="ts">
interface Props {
  link: string
  text: string
}
defineProps<Props>()
</script>