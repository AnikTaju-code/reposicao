<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { House, Clock3, Film, Tv2, Sparkles } from 'lucide-vue-next'
import brandIcon from '../assets/cinenexus-icon.png'

const route = useRoute()
const menu = [
  { name: 'Início', to: '/', icon: House },
  { name: 'Histórico', to: '/historico', icon: Clock3 },
  { name: 'Filmes', to: '/filmes', icon: Film },
  { name: 'Séries', to: '/series', icon: Tv2 },
  { name: 'Animes', to: '/animes', icon: Sparkles },
]
</script>

<template>
  <aside class="sidebar" aria-label="Navegação principal">
    <RouterLink class="sidebar-brand" to="/" title="CineNexus — Início" aria-label="Voltar ao início">
      <img :src="brandIcon" alt="CineNexus" />
    </RouterLink>

    <nav class="sidebar-navigation" aria-label="Categorias">
      <RouterLink
        v-for="link in menu"
        :key="link.to"
        :to="link.to"
        class="sidebar-link"
        :class="{ active: route.path === link.to }"
        :title="link.name"
      >
        <component :is="link.icon" :size="23" :stroke-width="1.8" />
        <span>{{ link.name }}</span>
      </RouterLink>
    </nav>
    <div class="sidebar-bottom">
      <span class="sidebar-mini-dot"></span>
    </div>
  </aside>
</template>
