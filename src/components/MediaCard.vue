<script setup>
import { ref, watch } from 'vue'
import { Eye, Star } from 'lucide-vue-next'
import brand from '../assets/cinenexus-logo.png'
const props = defineProps({ media: { type: Object, required: true }, index: { type: Number, default: 0 } })
const emit = defineEmits(['select'])
const failed = ref(false)
watch(() => props.media.poster, () => { failed.value = false })
</script>

<template>
  <button class="media-card" type="button" @click="emit('select', media)" :aria-label="`Ver detalhes de ${media.title}`">
    <span class="poster" :class="`poster--${media.tint || 'violet'}`">
      <img v-if="media.poster && !failed" :src="media.poster" :alt="`Cartaz de ${media.title}`" class="poster-cover" loading="lazy" @error="failed = true" />
      <template v-else>
        <span class="poster-grain"></span>
        <img :src="brand" alt="" class="poster-logo" loading="lazy" />
      </template>
      <span class="poster-play"><Eye :size="22" /></span>
    </span>
    <span class="media-title" :title="media.title">{{ media.title }}</span>
    <span class="media-meta"><span>{{ media.year || '—' }}</span><span class="media-meta-dot">•</span><Star :size="11" fill="currentColor" /><span>{{ media.rating || '—' }}</span></span>
  </button>
</template>
