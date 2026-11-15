<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X, Star, CalendarDays, Film, Clock3, Layers3, Tv, Play } from 'lucide-vue-next'
import brand from '../assets/cinenexus-logo.png'
const props = defineProps({ media: { type: Object, required: true }, loading: { type: Boolean, default: false }, error: { type: String, default: '' } })
const emit = defineEmits(['close'])
const imageFailed = ref(false)
const trailerImageFailed = ref(false)
const trailerPlaying = ref(false)
const trailerAvailable = ref(Boolean(props.media?.trailer?.provider === 'youtube' && props.media?.trailer?.id))
const playerHost = ref(null)
let youtubePlayer = null
let playerGeneration = 0
let youtubeApiPromise = null

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve, reject) => {
      let settled = false
      const finish = (callback, value) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeout)
        callback(value)
      }
      const previousReady = window.onYouTubeIframeAPIReady
      const timeout = window.setTimeout(() => finish(reject, new Error('YouTube player API timeout')), 12000)
      window.onYouTubeIframeAPIReady = () => {
        try { if (typeof previousReady === 'function') previousReady() } catch { /* não interrompe o player */ }
        if (window.YT?.Player) finish(resolve, window.YT)
        else finish(reject, new Error('YouTube player API indisponível'))
      }
      let script = document.querySelector('script[data-cinenexus-youtube-api]')
      if (!script) {
        script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        script.async = true
        script.dataset.cinenexusYoutubeApi = 'true'
        script.onerror = () => finish(reject, new Error('Não foi possível carregar a API do YouTube'))
        document.head.appendChild(script)
      } else {
        script.addEventListener('error', () => finish(reject, new Error('Não foi possível carregar a API do YouTube')), { once: true })
      }
    }).catch(error => {
      youtubeApiPromise = null
      throw error
    })
  }
  return youtubeApiPromise
}

function destroyPlayer() {
  playerGeneration += 1
  if (youtubePlayer?.destroy) youtubePlayer.destroy()
  youtubePlayer = null
}

const hasTrailer = computed(() => trailerAvailable.value
  && props.media?.trailer?.provider === 'youtube'
  && Boolean(props.media?.trailer?.id))
const trailerThumbnail = computed(() => trailerImageFailed.value
  ? (props.media?.backdrop || props.media?.poster || '')
  : (props.media?.trailer?.thumbnail || props.media?.backdrop || props.media?.poster || ''))

async function startTrailer() {
  if (!hasTrailer.value || trailerPlaying.value) return
  trailerPlaying.value = true
  await nextTick()
  const generation = ++playerGeneration
  try {
    const YT = await loadYouTubeIframeApi()
    if (generation !== playerGeneration || !playerHost.value) return
    youtubePlayer = new YT.Player(playerHost.value, {
      width: '100%', height: '100%', videoId: props.media.trailer.id,
      playerVars: { autoplay: 1, rel: 0, playsinline: 1, origin: window.location.origin },
      events: {
        onReady: event => event.target.playVideo(),
        onError: () => {
          if (generation !== playerGeneration) return
          trailerAvailable.value = false
          trailerPlaying.value = false
          destroyPlayer()
        },
      },
    })
  } catch {
    if (generation === playerGeneration) {
      trailerAvailable.value = false
      trailerPlaying.value = false
      destroyPlayer()
    }
  }
}

watch(() => [props.media?.key, props.media?.trailer?.id], () => {
  destroyPlayer()
  imageFailed.value = false
  trailerImageFailed.value = false
  trailerPlaying.value = false
  trailerAvailable.value = Boolean(props.media?.trailer?.provider === 'youtube' && props.media?.trailer?.id)
})
onBeforeUnmount(destroyPlayer)
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
        <section v-if="hasTrailer" class="trailer-section" aria-label="Trailer">
          <div class="trailer-heading"><h3>Trailer</h3><span>Pré-visualização</span></div>
          <div class="trailer-frame">
            <div v-if="trailerPlaying" ref="playerHost" class="trailer-player-host"></div>
            <button v-else class="trailer-preview" type="button" @click="startTrailer">
              <img v-if="trailerThumbnail" :src="trailerThumbnail" :alt="`Pré-visualização do trailer de ${media.title}`" @error="trailerImageFailed = true" />
              <span class="trailer-preview-shade"></span>
              <span class="trailer-play"><Play :size="27" fill="currentColor" /></span>
              <span class="trailer-preview-label"><Play :size="16" fill="currentColor" /> Assistir trailer</span>
            </button>
          </div>
        </section>
        <h3>Sinopse</h3>
        <p class="detail-synopsis">{{ media.synopsis || 'Sinopse indisponível no momento.' }}</p>
        <p v-if="loading" class="detail-loading">A carregar informações completas...</p>
        <p v-if="error" class="detail-error">{{ error }}</p>
        <p v-if="media.studios?.length" class="detail-additional"><strong>Estúdio:</strong> {{ media.studios.join(', ') }}</p>
        <p v-if="media.originalTitle && media.originalTitle !== media.title" class="detail-additional"><strong>Título original:</strong> {{ media.originalTitle }}</p>
        <div class="detail-provider">Informação: {{ media.provider === 'anilist' ? 'AniList' : media.provider === 'kitsu' ? 'Kitsu' : media.provider === 'tmdb' ? 'TMDB' : 'Cinemeta' }} · Aberto no histórico local</div>
      </div>
    </aside>
  </div>
</template>
