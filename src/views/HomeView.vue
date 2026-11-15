<script setup>
import { inject, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Sparkles, Dot, ArrowUpRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import SectionRow from '../components/SectionRow.vue'
import { browseCatalog } from '../services/catalog.js'
import { getHistory, useHistoryVersion } from '../services/history.js'

const openDetails = inject('openDetails')
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
  section.loading = true
  try {
    const data = await browseCatalog(kind, { page: 1 })
    if (version === sequence) section.items = data.items
  } catch (error) {
    if (version === sequence) section.error = error.message || 'Não foi possível carregar este catálogo.'
  } finally { if (version === sequence) section.loading = false }
}
onMounted(() => {
  const current = ++sequence
  for (const kind of ['movies', 'series', 'anime']) loadSection(kind, current)
})
onUnmounted(() => { sequence++ })
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
    <SectionRow title="Histórico" subtitle="Títulos que abriste neste navegador" :items="history" link="/historico" message="Ainda não abriste nenhum título. Explora os catálogos para começar." @select="openDetails" />
    <SectionRow title="Populares · Filmes" subtitle="Filmes do catálogo Cinemeta" :items="sections.movies.items" :loading="sections.movies.loading" :message="sections.movies.error" link="/filmes" @select="openDetails" />
    <SectionRow title="Populares · Séries" subtitle="Séries do catálogo Cinemeta" :items="sections.series.items" :loading="sections.series.loading" :message="sections.series.error" link="/series" @select="openDetails" />
    <SectionRow title="Em destaque · Animes" subtitle="AniList · alternativa Kitsu quando necessário" :items="sections.anime.items" :loading="sections.anime.loading" :message="sections.anime.error" link="/animes" @select="openDetails" />
    <footer class="page-footer">CINENEXUS <Dot :size="16" /> DADOS: <a target="_blank" rel="noopener noreferrer" href="https://v3-cinemeta.strem.io/">CINEMETA</a>, <a target="_blank" rel="noopener noreferrer" href="https://anilist.co/">ANILIST</a> E <a target="_blank" rel="noopener noreferrer" href="https://kitsu.app/">KITSU</a> <Dot :size="16" /> Catálogo informativo, sem reprodução.</footer>
  </div>
</template>
