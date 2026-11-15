<script setup>
import { computed, inject, ref, watch } from 'vue'
import { LayoutGrid, SlidersHorizontal, Sparkles, ChevronLeft, ChevronRight, Trash2, Settings2 } from 'lucide-vue-next'
import MediaCard from '../components/MediaCard.vue'
import { availableGenres, browseCatalog, categoryMeta } from '../services/catalog.js'
import { getHistory, clearHistory, useHistoryVersion } from '../services/history.js'

const props = defineProps({ type: { type: String, required: true } })
const openDetails = inject('openDetails')
const openSettings = inject('openSettings')
const tmdbConfigured = inject('tmdbConfigured')
const apiRefresh = inject('apiRefresh')
const historyVersion = useHistoryVersion()

const meta = computed(() => categoryMeta[props.type] || categoryMeta.movies)
const items = ref([])
const loading = ref(false)
const error = ref('')
const genreOptions = ref([])
const genre = ref('')
const year = ref('')
const minRating = ref('')
const sort = ref('popular')
const page = ref(1)
const hasNextPage = ref(false)
const historyFilter = ref('all')
const years = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => String(new Date().getFullYear() - i))
const isHistory = computed(() => props.type === 'history')
const historyItems = computed(() => {
  historyVersion.value
  return getHistory().filter(m => historyFilter.value === 'all' || m.kind === historyFilter.value)
})
const visibleItems = computed(() => isHistory.value ? historyItems.value : items.value)
const hasKey = computed(() => props.type === 'anime' || isHistory.value || tmdbConfigured.value)
let requestId = 0

async function load() {
  const current = ++requestId
  if (isHistory.value) return
  items.value = []
  error.value = ''
  if (!hasKey.value) { loading.value = false; error.value = 'Para veres este catálogo precisas de configurar a tua chave TMDB.'; return }
  loading.value = true
  try {
    const result = await browseCatalog(props.type, { page: page.value, genre: genre.value, year: year.value, minRating: minRating.value, sort: sort.value })
    if (current === requestId) { items.value = result.items; hasNextPage.value = result.hasNextPage }
  } catch (e) { if (current === requestId) error.value = e.message || 'Falha ao carregar os títulos.' }
  finally { if (current === requestId) loading.value = false }
}
async function loadGenres() {
  const kind = props.type
  genreOptions.value = []
  if (kind === 'history' || (kind !== 'anime' && !tmdbConfigured.value)) return
  try { const options = await availableGenres(kind); if (kind === props.type) genreOptions.value = options }
  catch { /* O catálogo continua sem a lista de géneros. */ }
}
function resetFilters() { page.value = 1; genre.value = ''; year.value = ''; minRating.value = ''; sort.value = 'popular'; historyFilter.value = 'all' }
function changePage(next) { if (next < 1 || (next > page.value && !hasNextPage.value)) return; page.value = next; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function removeHistory() { if (window.confirm('Apagar o histórico de títulos abertos neste navegador?')) clearHistory() }
watch(() => props.type, resetFilters)
watch([() => props.type, apiRefresh], loadGenres, { immediate: true })
watch([() => props.type, page, genre, year, minRating, sort, apiRefresh], load, { immediate: true })
watch([genre, year, minRating, sort], () => { page.value = 1 })
</script>

<template>
  <div class="collection-view page-enter">
    <div class="collection-heading">
      <div><div class="eyebrow"><Sparkles :size="14" /> {{ meta.eyebrow }}</div><h1>{{ meta.title }}<span class="heading-dot">.</span></h1><p>{{ meta.description }}</p></div>
      <div class="collection-counter"><LayoutGrid :size="16" /> {{ isHistory ? visibleItems.length : visibleItems.length }} títulos{{ !isHistory ? ' nesta página' : '' }}</div>
    </div>

    <div v-if="isHistory" class="collection-toolbar">
      <div class="filter-pills">
        <button v-for="filter in [{key:'all',label:'Todos'},{key:'movies',label:'Filmes'},{key:'series',label:'Séries'},{key:'anime',label:'Animes'}]" :key="filter.key" type="button" class="filter-pill" :class="{ selected: historyFilter === filter.key }" @click="historyFilter = filter.key">{{ filter.label }}</button>
      </div>
      <button v-if="getHistory().length" type="button" class="ghost-control" @click="removeHistory"><Trash2 :size="16" /> Limpar histórico</button>
    </div>
    <div v-else class="collection-toolbar filter-toolbar">
      <div class="filter-pills">
        <button v-for="option in [{key:'popular',label:'Populares'},{key:'rating',label:'Mais avaliados'},{key:'recent',label:'Recentes'}]" :key="option.key" type="button" class="filter-pill" :class="{ selected: sort === option.key }" @click="sort = option.key">{{ option.label }}</button>
      </div>
      <div class="catalog-filters"><SlidersHorizontal :size="17" />
        <select v-model="genre" aria-label="Filtrar por género"><option value="">Todos os géneros</option><option v-for="g in genreOptions" :key="g.id" :value="g.id">{{ g.name }}</option></select>
        <select v-model="year" aria-label="Filtrar por ano"><option value="">Qualquer ano</option><option v-for="y in years" :key="y" :value="y">{{ y }}</option></select>
        <select v-model="minRating" aria-label="Filtrar por classificação"><option value="">Qualquer nota</option><option value="7">7.0+</option><option value="8">8.0+</option><option value="9">9.0+</option></select>
      </div>
    </div>
    <div v-if="!hasKey" class="setup-callout"><div><strong>Falta ligar a TMDB</strong><p>Coloca uma chave TMDB para carregar os cartazes e dados reais.</p></div><button type="button" class="setup-action" @click="openSettings"><Settings2 :size="16" /> Configurar TMDB</button></div>
    <div v-if="loading" class="collection-grid" aria-label="A carregar"><div v-for="n in 12" :key="n" class="skeleton-card"><div class="skeleton-poster"></div><div class="skeleton-line"></div></div></div>
    <div v-else-if="visibleItems.length" class="collection-grid"><MediaCard v-for="(media, index) in visibleItems" :key="media.key" :media="media" :index="index" @select="openDetails" /></div>
    <div v-else class="collection-empty-note">{{ error || (isHistory ? 'O histórico está vazio. Abre um filme, uma série ou um anime para começar.' : 'Não foram encontrados títulos para os filtros selecionados.') }}</div>
    <div v-if="!isHistory && hasKey && !loading && (page > 1 || hasNextPage)" class="pagination">
      <button type="button" :disabled="page === 1" @click="changePage(page - 1)"><ChevronLeft :size="17"/> Anterior</button><span>Página {{ page }}</span><button type="button" :disabled="!hasNextPage" @click="changePage(page + 1)">Seguinte <ChevronRight :size="17"/></button>
    </div>
  </div>
</template>
