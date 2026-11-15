import { ref } from 'vue'
const HISTORY_KEY = 'cinenexus-opened-v1'
const version = ref(0)
const limit = 60

function getStored() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch { return [] }
}
function persist(items) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items)) } catch { /* armazenamento indisponível */ }
  version.value++
}
export function useHistoryVersion() { return version }
export function getHistory() { return getStored() }
export function trackOpened(media) {
  if (!media?.key) return
  // Apenas metadados de catálogo: sem guardar streaming, percentagem, episódios vistos, contas, etc.
  const entry = { key: media.key, id: media.id, kind: media.kind, provider: media.provider, type: media.type,
    title: media.title, year: media.year, rating: media.rating, genre: media.genre,
    genres: media.genres, poster: media.poster, backdrop: media.backdrop,
    synopsis: media.synopsis, openedAt: new Date().toISOString() }
  const history = getStored().filter(item => item.key !== media.key)
  persist([entry, ...history].slice(0, limit))
}
export function clearHistory() { persist([]) }
