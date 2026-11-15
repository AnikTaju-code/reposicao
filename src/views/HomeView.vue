<script setup>
import { inject, reactive, computed, watch } from 'vue'
import { Sparkles, Dot, ArrowUpRight, Settings2 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import SectionRow from '../components/SectionRow.vue'
import { browseCatalog } from '../services/catalog.js'
import { getHistory, useHistoryVersion } from '../services/history.js'

const openDetails = inject('openDetails')
const openSettings = inject('openSettings')
const tmdbConfigured = inject('tmdbConfigured')
const apiRefresh = inject('apiRefresh')
const historyVersion = useHistoryVersion()
const history = computed(() => { historyVersion.value; return getHistory() })
const sections = reactive({
  movies: { items: [], loading: false, error: '' },
  series: { items: [], loading: false, error: '' },
  anime: { items: [], loading: false, error: '' },
})
let sequence = 0
async function loadSection(kind, version) {
  const section = sections[kind]
  section.items = []
  section.error = ''
  if (kind !== 'anime' && !tmdbConfigured.value) { section.loading = false; section.error = 'Configura a chave TMDB para mostrar o catálogo de filmes e séries.'; return }
  section.loading = true
  try {
    const data = await browseCatalog(kind, { page: 1 })
    if (version === sequence) section.items = data.items
  } catch (error) { if (version === sequence) section.error = error.message || 'Não foi possível carregar este catálogo.' }
  finally { if (version === sequence) section.loading = false }
}
watch(apiRefresh, () => {
  const current = ++sequence
  for (const kind of ['movies', 'series', 'anime']) loadSection(kind, current)
}, { immediate: true })
</script>

<template>
  <div class="home-view page-enter">
    <div class="welcome">
      <div class="welcome-copy">
        <div class="eyebrow"><Sparkles :size="14" /><span>O TEU UNIVERSO DE ENTRETENIMENTO</span></div>
        <h1>Histórias que <em>merecem</em> ser descobertas.</h1>
        <p>Filmes, séries e animes. Tudo num só lugar.</p>
      </div>
      <RouterLink to="/filmes" class="explore-button">Explorar filmes <ArrowUpRight :size="17" /></RouterLink>
    </div>
    <div v-if="!tmdbConfigured" class="setup-callout">
      <div><strong>Ativa o catálogo de filmes e séries</strong><p>A AniList já funciona sem chave. Para veres cartazes, sinopses e listas da TMDB, configura a tua chave gratuita.</p></div>
      <button type="button" class="setup-action" @click="openSettings"><Settings2 :size="16" /> Configurar TMDB</button>
    </div>
    <SectionRow title="Histórico" subtitle="Títulos que abriste neste navegador" :items="history" link="/historico" message="Ainda não abriste nenhum título. Explora os catálogos para começar." @select="openDetails" />
    <SectionRow title="Populares · Filmes" subtitle="Os filmes em destaque na TMDB" :items="sections.movies.items" :loading="sections.movies.loading" :message="sections.movies.error" link="/filmes" @select="openDetails" />
    <SectionRow title="Populares · Séries" subtitle="Séries populares na TMDB" :items="sections.series.items" :loading="sections.series.loading" :message="sections.series.error" link="/series" @select="openDetails" />
    <SectionRow title="Em destaque · Animes" subtitle="Animes populares na AniList" :items="sections.anime.items" :loading="sections.anime.loading" :message="sections.anime.error" link="/animes" @select="openDetails" />
    <footer class="page-footer">CINENEXUS <Dot :size="16" /> DADOS: <a target="_blank" rel="noopener noreferrer" href="https://www.themoviedb.org/">TMDB</a> E <a target="_blank" rel="noopener noreferrer" href="https://anilist.co/">ANILIST</a> <Dot :size="16" /> Este produto utiliza a API TMDB, mas não é apoiado ou certificado pela TMDB.</footer>
  </div>
</template>
