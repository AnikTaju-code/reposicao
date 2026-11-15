<script setup>
import { ref, watch } from 'vue'
import { X, Star, CalendarDays, Film, Clock3, Layers3, Tv } from 'lucide-vue-next'
import brand from '../assets/cinenexus-logo.png'
const props = defineProps({ media: { type: Object, required: true }, loading: { type: Boolean, default: false }, error: { type: String, default: '' } })
const emit = defineEmits(['close'])
const imageFailed = ref(false)
watch(() => props.media?.key, () => { imageFailed.value = false })
</script>

<template>
  <div class="detail-backdrop" @click.self="emit('close')">
    <aside class="detail-panel" role="dialog" aria-modal="true" :aria-label="`Detalhes de ${media.title}`">
      <button class="detail-close" type="button" aria-label="Fechar detalhes" @click="emit('close')"><X :size="20" /></button>
      <div class="detail-hero" :class="`poster--${media.tint || 'violet'}`">
        <img v-if="(media.backdrop || media.poster) && !imageFailed" :src="media.backdrop || media.poster" :alt="`Imagem de ${media.title}`" class="detail-hero-photo" @error="imageFailed = true" />
        <img v-else :src="brand" alt="CineNexus" class="detail-hero-brand" />
        <div class="detail-hero-overlay"></div>
      </div>
      <div class="detail-body">
        <div class="eyebrow"><span class="eyebrow-line"></span>{{ media.type }}</div>
        <h2>{{ media.title }}</h2>
        <div class="detail-meta">
          <span><CalendarDays :size="15" /> {{ media.year }}</span>
          <span><Star :size="15" fill="currentColor" /> {{ media.rating }}</span>
          <span v-if="media.runtime"><Clock3 :size="15" /> {{ media.runtime }} min</span>
          <span v-if="media.episodes"><Tv :size="15" /> {{ media.episodes }} episódios</span>
          <span v-if="media.seasons"><Layers3 :size="15" /> {{ media.seasons }} temporadas</span>
        </div>
        <div v-if="media.genres?.length || media.genre" class="detail-genres"><span v-for="genre in (media.genres?.length ? media.genres : [media.genre])" :key="genre"><Film :size="12"/> {{ genre }}</span></div>
        <h3>Sinopse</h3>
        <p class="detail-synopsis">{{ media.synopsis || 'Sinopse indisponível no momento.' }}</p>
        <p v-if="loading" class="detail-loading">A carregar informações completas...</p>
        <p v-if="error" class="detail-error">{{ error }}</p>
        <p v-if="media.studios?.length" class="detail-additional"><strong>Estúdio:</strong> {{ media.studios.join(', ') }}</p>
        <p v-if="media.originalTitle && media.originalTitle !== media.title" class="detail-additional"><strong>Título original:</strong> {{ media.originalTitle }}</p>
        <div class="detail-provider">Informação: {{ media.provider === 'anilist' ? 'AniList' : 'TMDB' }} · Aberto no histórico local</div>
      </div>
    </aside>
  </div>
</template>
