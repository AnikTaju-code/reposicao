// A chave é fornecida pelo próprio utilizador durante a sessão.
// NÃO guardar chaves TMDB em VITE_*: variáveis Vite são públicas no build.
const API_ROOT = 'https://api.themoviedb.org/3'
const KEY_NAME = 'cinenexus-tmdb-session-key'
let memoryKey = ''

export function readTmdbKey() {
  try { return sessionStorage.getItem(KEY_NAME) || memoryKey } catch { return memoryKey }
}

export function setTmdbKey(key) {
  memoryKey = String(key || '').trim()
  try {
    if (memoryKey) sessionStorage.setItem(KEY_NAME, memoryKey)
    else sessionStorage.removeItem(KEY_NAME)
  } catch { /* browsers with disabled storage */ }
}

export function hasTmdbKey() { return Boolean(readTmdbKey()) }

export function tmdbImage(path, size = 'w500') {
  if (!path || typeof path !== 'string' || !path.startsWith('/')) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}

export async function tmdbRequest(path, query = {}, options = {}) {
  const key = readTmdbKey()
  if (!key) throw new Error('Configura a tua chave TMDB para carregar filmes e séries.')
  const url = new URL(`${API_ROOT}${path}`)
  url.searchParams.set('api_key', key)
  url.searchParams.set('language', 'pt-BR')
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(name, String(value))
  }
  let response
  try { response = await fetch(url, { signal: options.signal, headers: { Accept: 'application/json' } }) }
  catch (error) { if (error.name === 'AbortError') throw error; throw new Error('Falha de rede ao contactar a TMDB.') }
  if (!response.ok) {
    if (response.status === 401) throw new Error('A chave TMDB é inválida. Verifica-a nas definições.')
    if (response.status === 429) throw new Error('Limite de pedidos da TMDB atingido. Tenta novamente mais tarde.')
    throw new Error(`A TMDB devolveu um erro HTTP ${response.status}.`)
  }
  return response.json()
}

export async function tmdbGenres(kind, options = {}) {
  const category = kind === 'movies' ? 'movie' : 'tv'
  const result = await tmdbRequest(`/genre/${category}/list`, {}, options)
  return result.genres || []
}

export async function tmdbBrowse(kind, { page = 1, query = '', genre = '', year = '', minRating = '', sort = 'popular', signal } = {}) {
  const isMovie = kind === 'movies'
  const resource = isMovie ? 'movie' : 'tv'
  const parameters = { page, include_adult: false }
  let endpoint
  if (query.trim()) {
    endpoint = `/search/${resource}`
    parameters.query = query.trim()
  } else if (genre || year || minRating || sort !== 'popular') {
    endpoint = `/discover/${resource}`
    parameters.sort_by = sort === 'rating' ? 'vote_average.desc' : sort === 'recent' ? (isMovie ? 'primary_release_date.desc' : 'first_air_date.desc') : 'popularity.desc'
    if (genre) parameters.with_genres = genre
    if (year) parameters[isMovie ? 'primary_release_year' : 'first_air_date_year'] = year
    if (minRating) parameters['vote_average.gte'] = minRating
    if (sort === 'rating') parameters['vote_count.gte'] = 100
  } else {
    endpoint = `/${resource}/popular`
  }
  const data = await tmdbRequest(endpoint, parameters, { signal })
  return { entries: data.results || [], currentPage: Number(data.page || page), totalPages: Math.min(data.total_pages || 1, 500), hasNextPage: page < Math.min(data.total_pages || 1, 500), source: 'tmdb' }
}

export async function tmdbDetails(kind, id, options = {}) {
  const path = `/${kind === 'movies' ? 'movie' : 'tv'}/${encodeURIComponent(id)}`
  const details = await tmdbRequest(path, {}, options)
  if (!details.overview?.trim()) {
    // Nem todos os títulos têm tradução. A sinopse original/inglesa é alternativa.
    try {
      const english = await tmdbRequest(path, { language: 'en-US' }, options)
      if (english.overview) details.overview = english.overview
    } catch { /* usa os restantes detalhes em vez de falhar toda a página */ }
  }
  return details
}
