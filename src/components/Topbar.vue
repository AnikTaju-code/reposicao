<script setup>
import { ref, watch } from 'vue'
import { Search, CircleUserRound } from 'lucide-vue-next'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const search = ref('')
watch(() => route.query.q, q => { search.value = typeof q === 'string' ? q : '' }, { immediate: true })
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
      <span class="avatar" title="CineNexus"><CircleUserRound :size="20" /></span>
    </div>
  </header>
</template>
