<template>
  <div>
    <div
      ref="tab"
      v-for="(tab, i) in tab_list"
      :key="i"
      @click="handleTabClicks(tab)"
      class="sm:w-auto text-center sm:text-left">
      <slot name="tab" :tab="tab" :index="i" :is_active="active_tab === tab.slug"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

// Define Props
type Tab = {
  slug: string
}

const props = withDefaults(defineProps<{
  tab_list: Tab[]
  value: string
  auto_add_query?: boolean
  query_name?: string
}>(), {
  value: ''
})

const emits = defineEmits<{
  (e: 'model-value', value: string): void
  (e: 'tab-click', value: string): void
}>()

const router = useRouter()
const active_tab = ref<string>(props.value) // Track active tab

// Helper function to format query
const serialize_query = (query: string) => query.replace(/ /g, '_')

// Handle tab clicks
const handleTabClicks = (tab: Tab) => {
  if (!tab.slug) return
  active_tab.value = tab.slug
  if (props.auto_add_query) {
    router.push({
      query: {
        ...router.currentRoute.value.query,
        [props.query_name || 'tab']: serialize_query(tab.slug)
      },
    })
  }
  emits('model-value', tab.slug)
  emits('tab-click', tab.slug)
}

// Set active tab based on query parameter
const { [props.query_name || 'tab']: tab_q } = router.currentRoute.value.query
if (tab_q) {
  props.tab_list.forEach(tab => {
    if (serialize_query(tab.slug) === tab_q) {
      active_tab.value = tab_q
      emits('model-value', tab_q)
    }
  })
}

// Default to the first tab if no query or model value is set
if (!tab_q && !props.value) {
  active_tab.value = props.tab_list[0].slug
  emits('model-value', props.tab_list[0].slug)
}

// Watch value prop to handle changes
const valuePropRef = computed(() => props.value)
watch(valuePropRef, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    handleTabClicks({ slug: newVal } as Tab)
  }
})

// Watch router query to handle back/forward navigation
watch(() => router.currentRoute.value.query, (newVal, oldVal) => {
  if (newVal[props.query_name || 'tab'] !== oldVal[props.query_name || 'tab']) {
    props.tab_list.forEach(tab => {
      if (serialize_query(tab.slug) === newVal[props.query_name || 'tab']) {
        active_tab.value = tab.slug
        emits('model-value', tab.slug)
      }
    })
  }
}, { deep: true })
</script>