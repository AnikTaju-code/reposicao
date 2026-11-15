<script setup>
import { ref, provide, watch, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import Topbar from './components/Topbar.vue'
import DetailPanel from './components/DetailPanel.vue'
import { readDetails } from './services/catalog.js'
import { trackOpened } from './services/history.js'

const route = useRoute()
const selectedMedia = ref(null)
const detailLoading = ref(false)
const detailError = ref('')
let detailSequence = 0

function openDetails(media) {
  if (!media) return
  selectedMedia.value = media
  detailError.value = ''
  trackOpened(media)
  const sequence = ++detailSequence
  detailLoading.value = true
  readDetails(media).then(details => {
    if (sequence === detailSequence) selectedMedia.value = details
  }).catch(error => {
    if (sequence === detailSequence) detailError.value = error.message || 'Não foi possível obter os detalhes.'
  }).finally(() => { if (sequence === detailSequence) detailLoading.value = false })
}
function closeDetails() { detailSequence++; selectedMedia.value = null; detailLoading.value = false }
function onKeyDown(event) { if (event.key === 'Escape' && selectedMedia.value) closeDetails() }
provide('openDetails', openDetails)
watch(() => route.fullPath, closeDetails)
onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="app-shell">
    <Sidebar />
    <div class="app-column">
      <Topbar />
      <main class="main-content"><RouterView /></main>
    </div>
    <DetailPanel v-if="selectedMedia" :media="selectedMedia" :loading="detailLoading" :error="detailError" @close="closeDetails" />
  </div>
</template>
