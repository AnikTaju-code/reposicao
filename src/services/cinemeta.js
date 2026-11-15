// Catálogos públicos Cinemeta para filmes e séries, sem autenticação.
const ROOT = 'https://v3-cinemeta.strem.io'
const PAGE_SIZE = 100

export const CINEMETA_GENRES = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western',
  'Reality-TV', 'Talk-Show', 'Game-Show',
]

async function getJson(path, { signal } = {}) {
  let response
  try {
    response = await fetch(`${ROOT}${path}`, { signal, headers: { Accept: 'application/json' } })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Sem ligação ao Cinemeta. Verifica a internet e tenta novamente.')
  }
  if (response.status === 429) throw new Error('O Cinemeta está a limitar os pedidos. Tenta novamente daqui a pouco.')
  if (!response.ok) throw new Error(`O Cinemeta devolveu HTTP ${response.status}.`)
  let data
  try { data = await response.json() } catch { throw new Error('O Cinemeta enviou uma resposta inválida.') }
  return data
}

function encodeExtras(extras) {
  return Object.entries(extras)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&')
}

export async function cinemetaBrowse(kind, {
  page = 1, query = '', genre = '', year = '', minRating = '', sort = 'popular', signal,
} = {}) {
  const resource = kind === 'movies' ? 'movie' : 'series'
  const search = String(query).trim()
  const selectedYear = String(year || '').trim()
  const useYearCatalog = !search && Boolean(selectedYear) && !genre
  const useRecentCatalog = !search && !genre && !selectedYear && sort === 'recent'
  const catalogId = useYearCatalog || useRecentCatalog ? 'year'
    : !search && sort === 'rating' ? 'imdbRating' : 'top'
  const extras = {}
  if (catalogId === 'year') extras.genre = selectedYear || String(new Date().getFullYear())
  else if (genre && !search) extras.genre = genre
  if (search) extras.search = search
  if (Number(page) > 1) extras.skip = (Number(page) - 1) * PAGE_SIZE
  const encoded = encodeExtras(extras)
  const path = `/catalog/${resource}/${catalogId}${encoded ? `/${encoded}` : ''}.json`
  const data = await getJson(path, { signal })
  const rawEntries = Array.isArray(data.metas) ? data.metas : []
  const minimum = Number(minRating) || 0
  const entries = rawEntries.filter(entry => {
    if (!entry || (!entry.id && !entry.imdb_id)) return false
    if (genre && (catalogId === 'year' || Boolean(search))) {
      if (!(entry.genres || []).some(value => String(value).toLowerCase() === String(genre).toLowerCase())) return false
    }
    if (selectedYear && catalogId !== 'year') {
      const candidate = String(entry.year || entry.releaseInfo || entry.released || '').match(/\b(?:19|20)\d{2}\b/)?.[0]
      if (candidate !== selectedYear) return false
    }
    if (minimum && (Number(entry.imdbRating) || 0) < minimum) return false
    return true
  })
  if (sort === 'recent' && catalogId !== 'year') {
    entries.sort((a, b) => String(b.released || b.year || b.releaseInfo || '').localeCompare(String(a.released || a.year || a.releaseInfo || '')))
  }
  if (sort === 'rating' && catalogId !== 'imdbRating') {
    entries.sort((a, b) => (Number(b.imdbRating) || 0) - (Number(a.imdbRating) || 0))
  }
  return {
    entries, currentPage: Number(page), hasNextPage: rawEntries.length >= PAGE_SIZE,
    source: 'cinemeta', limitedFilters: Boolean(search && (genre || year || minRating) || genre && year || minRating),
  }
}

export async function cinemetaDetails(kind, id, options = {}) {
  if (!/^[a-zA-Z0-9:_-]+$/.test(String(id))) throw new Error('Identificador de filme inválido.')
  const resource = kind === 'movies' ? 'movie' : 'series'
  const data = await getJson(`/meta/${resource}/${encodeURIComponent(id)}.json`, options)
  if (!data.meta) throw new Error('Não foram encontrados detalhes neste catálogo.')
  return data.meta
}