<script setup>
import { computed, ref, inject, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Settings2 } from 'lucide-vue-next'
import SectionRow from '../components/SectionRow.vue'
import { browseCatalog } from '../services/catalog.js'

const route = useRoute()
const query = computed(() => String(route.query.q || '').trim())
const openDetails = inject('openDetails')
const openSettings = inject('openSettings')
const configured = inject('tmdbConfigured')
const apiRefresh = inject('apiRefresh')
const sections = ref({ movies: {items:[],error:'',loading:false}, series: {items:[],error:'',loading:false}, anime: {items:[],error:'',loading:false} })
let sequence = 0
async function searchKind(kind, q, current) {
  const section = sections.value[kind]
  section.loading = true
  section.error = ''
  section.items = []
  if (kind !== 'anime' && !configured.value) { section.loading = false; section.error = 'Configura a TMDB para procurar filmes e séries.'; return }
  try { const data = await browseCatalog(kind, { query: q, page: 1 }); if (sequence === current) section.items = data.items }
  catch(e) { if (sequence === current) section.error = e.message }
  finally { if (sequence === current) section.loading = false }
}
watch([query, apiRefresh], () => {
  const current = ++sequence
  if (!query.value) return
  for (const kind of ['movies','series','anime']) searchKind(kind, query.value, current)
}, { immediate: true })
</script>
<template>
  <div class="search-view page-enter">
    <div class="collection-heading"><div><div class="eyebrow"><Search :size="14" /> PESQUISA NO CINENEXUS</div><h1>Resultados<span class="heading-dot">.</span></h1><p v-if="query">Pesquisa por “{{ query }}” em filmes, séries e animes.</p><p v-else>Escreve um título na barra superior e carrega em Enter.</p></div></div>
    <div v-if="query && !configured" class="setup-callout"><div><strong>Os animes já estão disponíveis</strong><p>Para pesquisar também filmes e séries, configura uma chave TMDB.</p></div><button class="setup-action" type="button" @click="openSettings"><Settings2 :size="16" /> Configurar TMDB</button></div>
    <template v-if="query">
      <SectionRow title="Filmes" :items="sections.movies.items" :loading="sections.movies.loading" :message="sections.movies.error || 'Sem resultados em filmes.'" link="/filmes" @select="openDetails"/>
      <SectionRow title="Séries" :items="sections.series.items" :loading="sections.series.loading" :message="sections.series.error || 'Sem resultados em séries.'" link="/series" @select="openDetails"/>
      <SectionRow title="Animes" :items="sections.anime.items" :loading="sections.anime.loading" :message="sections.anime.error || 'Sem resultados em animes.'" link="/animes" @select="openDetails"/>
    </template>
  </div>
</template>
