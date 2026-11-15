<script setup>
import { ref, watch } from 'vue'
import { Search, CircleUserRound, Settings2 } from 'lucide-vue-next'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const search = ref('')
const emit = defineEmits(['settings'])
watch(() => route.query.q, q => { if (typeof q === 'string') search.value = q })
function submit() {
  const q = search.value.trim()
  if (q) router.push({ name: 'pesquisa', query: { q } })
}
</script>

<template>
  <header class="topbar">
    <RouterLink class="topbar-mobile-brand" to="/">Cine<span>Nexus</span></RouterLink>
    <form class="topbar-search" role="search" aria-label="Pesquisar no catálogo" @submit.prevent="submit">
      <button class="search-button" type="submit" aria-label="Pesquisar"><Search :size="19" :stroke-width="2" /></button>
      <input v-model="search" aria-label="Pesquisar filmes, séries ou animes" placeholder="Pesquisar filmes, séries ou animes..." autocomplete="off" />
      <span class="search-shortcut">ENTER ↵</span>
    </form>
    <div class="topbar-actions">
      <span class="demo-label">FILMES · SÉRIES · ANIMES</span>
      <button type="button" class="topbar-action" title="Configurar TMDB" aria-label="Configurar TMDB" @click="emit('settings')"><Settings2 :size="20" /></button>
      <span class="avatar" title="CineNexus"><CircleUserRound :size="20" /></span>
    </div>
  </header>
</template>
