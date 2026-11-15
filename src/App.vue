<script setup>
import { ref, provide, watch, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import Topbar from './components/Topbar.vue'
import DetailPanel from './components/DetailPanel.vue'
import ApiSettings from './components/ApiSettings.vue'
import { readDetails, invalidateCatalogCache } from './services/catalog.js'
import { hasTmdbKey, setTmdbKey } from './services/tmdb.js'
import { trackOpened } from './services/history.js'

const route = useRoute()
const selectedMedia = ref(null)
const detailLoading = ref(false)
const detailError = ref('')
const showSettings = ref(false)
const apiRefresh = ref(0)
const tmdbConfigured = ref(hasTmdbKey())
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
function saveKey(key) {
  setTmdbKey(key)
  tmdbConfigured.value = hasTmdbKey()
  invalidateCatalogCache()
  apiRefresh.value++
  showSettings.value = false
}
function onKeyDown(event) { if (event.key === 'Escape') { if (showSettings.value) showSettings.value = false; else if (selectedMedia.value) closeDetails() } }
provide('openDetails', openDetails)
provide('openSettings', () => { showSettings.value = true })
provide('tmdbConfigured', tmdbConfigured)
provide('apiRefresh', apiRefresh)
watch(() => route.fullPath, closeDetails)
onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="app-shell">
    <Sidebar />
    <div class="app-column">
      <Topbar @settings="showSettings = true" />
      <main class="main-content"><RouterView /></main>
    </div>
    <DetailPanel v-if="selectedMedia" :media="selectedMedia" :loading="detailLoading" :error="detailError" @close="closeDetails" />
    <ApiSettings v-if="showSettings" @save="saveKey" @close="showSettings = false" />
  </div>
</template>
