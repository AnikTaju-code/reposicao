<script setup>
import { ref } from 'vue'
import { X, KeyRound, ShieldAlert, ExternalLink, CheckCircle2 } from 'lucide-vue-next'
import { readTmdbKey } from '../services/tmdb.js'
const emit = defineEmits(['save', 'close'])
const inputKey = ref(readTmdbKey())
function submit() { emit('save', inputKey.value.trim()) }
function remove() { inputKey.value = ''; emit('save', '') }
</script>

<template>
  <div class="settings-backdrop" @click.self="emit('close')">
    <section class="settings-modal" role="dialog" aria-modal="true" aria-label="Configuração TMDB">
      <div class="settings-heading"><div class="settings-icon"><KeyRound :size="22" /></div><button type="button" class="detail-close settings-close" @click="emit('close')" aria-label="Fechar"><X :size="19" /></button></div>
      <h2>Configurar a TMDB</h2>
      <p>Para carregar os filmes e séries com cartazes reais, introduz uma chave de API v3 da TMDB. Os animes da AniList não precisam de chave.</p>
      <form @submit.prevent="submit">
        <label for="tmdb-key">Chave TMDB (API v3)</label>
        <input id="tmdb-key" type="password" v-model="inputKey" placeholder="Cola aqui a tua API key" autocomplete="off" spellcheck="false" />
        <div class="settings-buttons"><button type="button" class="settings-remove" @click="remove">Remover chave</button><button class="settings-save" type="submit"><CheckCircle2 :size="16" /> Guardar nesta sessão</button></div>
      </form>
      <p class="settings-hint"><ShieldAlert :size="18" /> Atenção: pedidos diretos expõem a chave ao próprio navegador e à rede. Não uses uma credencial confidencial nem a publiques no repositório. A chave só é mantida nesta sessão do navegador.</p>
      <a href="https://www.themoviedb.org/settings/api" rel="noopener noreferrer" target="_blank" class="settings-link">Obter chave gratuita na TMDB <ExternalLink :size="15" /></a>
    </section>
  </div>
</template>
