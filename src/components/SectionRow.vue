<script setup>
import { ref } from 'vue'
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import MediaCard from './MediaCard.vue'

defineProps({
  title: { type: String, required: true }, subtitle: { type: String, default: '' },
  items: { type: Array, default: () => [] }, link: { type: String, required: true },
  loading: { type: Boolean, default: false }, message: { type: String, default: '' },
})
const emit = defineEmits(['select'])
const viewport = ref(null)
function move(direction) { viewport.value?.scrollBy({ left: direction * 590, behavior: 'smooth' }) }
</script>

<template>
  <section class="content-section">
    <div class="section-heading">
      <div><h2>{{ title }}</h2><p v-if="subtitle">{{ subtitle }}</p></div>
      <div class="section-controls">
        <button class="arrow-btn" type="button" aria-label="Deslizar para a esquerda" @click="move(-1)"><ChevronLeft :size="17" /></button>
        <button class="arrow-btn" type="button" aria-label="Deslizar para a direita" @click="move(1)"><ChevronRight :size="17" /></button>
        <RouterLink class="see-all" :to="link">Ver tudo <ArrowUpRight :size="16" /></RouterLink>
      </div>
    </div>
    <div v-if="loading" class="horizontal-scroll" aria-label="A carregar títulos">
      <div v-for="n in 7" :key="n" class="skeleton-card"><div class="skeleton-poster"></div><div class="skeleton-line"></div></div>
    </div>
    <div v-else-if="items.length" class="horizontal-scroll" ref="viewport">
      <MediaCard v-for="(media, index) in items" :key="media.key" :media="media" :index="index" @select="emit('select', $event)" />
    </div>
    <p v-else class="section-status">{{ message || 'Ainda não existem títulos nesta secção.' }}</p>
  </section>
</template>
