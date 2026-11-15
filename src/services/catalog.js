import { cinemetaBrowse, cinemetaDetails, CINEMETA_GENRES } from './cinemeta.js'
import { anilistBrowse, anilistDetails } from './anilist.js'
import { kitsuBrowse, kitsuDetails } from './kitsu.js'

export const typeLabels = { movies: 'Filme', series: 'Série', anime: 'Anime' }
export const categoryMeta = {
  movies: { title: 'Filmes', eyebrow: 'O GRANDE ECRÃ', description: 'Explora os filmes mais populares e encontra a tua próxima história.' },
  series: { title: 'Séries', eyebrow: 'HISTÓRIAS QUE CONTINUAM', description: 'Descobre séries, temporadas e personagens memoráveis.' },
  anime: { title: 'Animes', eyebrow: 'OUTROS UNIVERSOS', description: 'Explora animes populares, os géneros e os lançamentos.' },
  history: { title: 'Histórico', eyebrow: 'O QUE JÁ EXPLORASTE', description: 'Os títulos que abriste neste navegador. Sem guardar progresso de reprodução.' },
}
const UNAVAILABLE = 'Sinopse indisponível no momento.'

function formatRating(number) {
  return Number.isFinite(Number(number)) && Number(number) > 0 ? (Math.round(Number(number) * 10) / 10).toFixed(1) : '—'
}
function safeText(value) {
  return String(value || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').trim()
}
function safeImage(value) {
  return typeof value === 'string' && /^https:\/\//i.test(value) ? value : null
}
function yearOf(...values) {
  for (const value of values) {
    const match = String(value || '').match(/\b(?:19|20)\d{2}\b/)
    if (match) return match[0]
  }
  return '—'
}
function runtimeMinutes(value) {
  if (Number.isFinite(Number(value)) && Number(value) > 0) return Number(value)
  if (typeof value !== 'string') return null
  const hours = Number(value.match(/(\d+)\s*h\b/i)?.[1] || 0)
  const mins = Number(value.match(/(\d+)\s*m(?:in)?/i)?.[1] || 0)
  if (hours || mins) return hours * 60 + mins
  const digits = Number(value.match(/\d+/)?.[0] || 0)
  return digits || null
}
function splitGenres(data) {
  if (Array.isArray(data.genres)) return data.genres.filter(Boolean).map(genre => typeof genre === 'string' ? genre : genre.name).filter(Boolean)
  return []
}

function youtubeIdFrom(value) {
  const text = String(value || '').trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text
  try {
    const url = new URL(text)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (!['youtu.be', 'm.youtube.com', 'youtube.com', 'youtube-nocookie.com'].includes(host)) return null
    const id = url.searchParams.get('v') || (host === 'youtu.be'
      ? url.pathname.slice(1).split('/')[0]
      : url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1])
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null
  } catch { return null }
}

function normalizeTrailerEntry(entry, defaultSite = 'youtube') {
  if (!entry || typeof entry !== 'object') return null
  const site = String(entry.site || defaultSite || '').toLowerCase()
  if (!site.includes('youtube')) return null
  const youtubeId = youtubeIdFrom(entry.source || entry.key || entry.id || entry.youtubeVideoId)
    || youtubeIdFrom(entry.url || entry.link)
  if (!youtubeId) return null
  return {
    provider: 'youtube', id: youtubeId, title: entry.name || entry.title || 'Trailer',
    type: entry.type || 'Trailer',
    thumbnail: safeImage(entry.thumbnail) || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
  }
}

function normalizeCinemetaTrailer(data) {
  const candidates = [
    ...(Array.isArray(data.trailers) ? data.trailers : []),
    ...(Array.isArray(data.trailerStreams) ? data.trailerStreams : []),
  ]
  return candidates
    .filter(entry => !entry?.type || String(entry.type).toLowerCase() === 'trailer')
    .map(entry => normalizeTrailerEntry(entry, entry?.site || 'youtube'))
    .find(Boolean) || null
}

export function normalizeCinemeta(data, kind) {
  const genres = splitGenres(data)
  const id = data.id || data.imdb_id
  return {
    key: `cinemeta-${kind}-${id}`, id, kind, provider: 'cinemeta', type: typeLabels[kind],
    title: data.name || data.title || 'Sem título', year: yearOf(data.year, data.releaseInfo, data.released),
    rating: formatRating(data.imdbRating), genre: genres[0] || '', genres,
    poster: safeImage(data.poster), backdrop: safeImage(data.background || data.backdrop),
    synopsis: safeText(data.description) || UNAVAILABLE, runtime: runtimeMinutes(data.runtime),
    episodes: Array.isArray(data.videos) ? data.videos.filter(video => Number(video.season) > 0).length || null : null,
    seasons: Array.isArray(data.videos) ? new Set(data.videos.map(video => Number(video.season)).filter(number => number > 0)).size || null : null,
    originalTitle: data.originalName || '', cast: Array.isArray(data.cast) ? data.cast : [],
    director: Array.isArray(data.director) ? data.director : [],
    trailer: normalizeCinemetaTrailer(data), tint: 'violet',
  }
}

export function normalizeAnime(data) {
  const title = data.title?.english || data.title?.romaji || data.title?.native || 'Sem título'
  return {
    key: `anilist-anime-${data.id}`, id: data.id, kind: 'anime', provider: 'anilist', type: 'Anime', title,
    year: data.seasonYear || '—', rating: formatRating(data.averageScore ? data.averageScore / 10 : null),
    genre: data.genres?.[0] || '', genres: data.genres || [],
    poster: safeImage(data.coverImage?.extraLarge || data.coverImage?.large), backdrop: safeImage(data.bannerImage),
    synopsis: safeText(data.description) || UNAVAILABLE,
    episodes: data.episodes || null, runtime: data.duration || null, format: data.format || '',
    status: data.status || '', studios: (data.studios?.nodes || []).map(studio => studio.name),
    originalTitle: data.title?.native || '',
    trailer: normalizeTrailerEntry(data.trailer, data.trailer?.site || 'youtube'), tint: 'blue',
  }
}

export function normalizeKitsu(data) {
  const attributes = data.attributes || {}
  const genres = Array.isArray(data.genres) ? data.genres : []
  return {
    key: `kitsu-anime-${data.id}`, id: data.id, kind: 'anime', provider: 'kitsu', type: 'Anime',
    title: attributes.titles?.en || attributes.canonicalTitle || attributes.titles?.en_jp || 'Sem título',
    year: yearOf(attributes.startDate), rating: formatRating(attributes.averageRating ? Number(attributes.averageRating) / 10 : null),
    genre: genres[0] || '', genres,
    poster: safeImage(attributes.posterImage?.large || attributes.posterImage?.original || attributes.posterImage?.medium),
    backdrop: safeImage(attributes.coverImage?.original || attributes.coverImage?.large),
    synopsis: safeText(attributes.synopsis || attributes.description) || UNAVAILABLE,
    episodes: attributes.episodeCount || null, runtime: attributes.episodeLength || null,
    originalTitle: attributes.titles?.ja_jp || '', status: attributes.status || '',
    trailer: attributes.youtubeVideoId ? normalizeTrailerEntry({ id: attributes.youtubeVideoId }) : null,
    tint: 'blue',
  }
}

const requestCache = new Map()
export function invalidateCatalogCache() { requestCache.clear() }
function cached(key, factory, lifetime = 90_000) {
  const hit = requestCache.get(key)
  if (hit && Date.now() - hit.created < lifetime) return hit.promise
  const promise = factory().catch(error => { requestCache.delete(key); throw error })
  requestCache.set(key, { created: Date.now(), promise })
  return promise
}

async function browseRaw(kind, options) {
  if (kind !== 'anime') return cinemetaBrowse(kind, options)
  try { return await anilistBrowse(options) }
  catch (firstError) {
    if (firstError.name === 'AbortError') throw firstError
    try { return await kitsuBrowse(options) }
    catch (secondError) {
      if (secondError.name === 'AbortError') throw secondError
      throw new Error(`Anime indisponível. ${firstError.message} Alternativa Kitsu: ${secondError.message}`)
    }
  }
}

export async function browseCatalog(kind, options = {}) {
  const { signal, ...rest } = options
  const raw = signal ? await browseRaw(kind, { ...rest, signal })
    : await cached(JSON.stringify([kind, rest]), () => browseRaw(kind, rest))
  const normalizer = raw.source === 'anilist' ? normalizeAnime
    : raw.source === 'kitsu' ? normalizeKitsu : item => normalizeCinemeta(item, kind)
  return { ...raw, items: raw.entries.map(normalizer) }
}

export async function readDetails(media) {
  if (media.provider === 'tmdb') return media
  let detailed
  if (media.provider === 'cinemeta') detailed = normalizeCinemeta(await cinemetaDetails(media.kind, media.id), media.kind)
  else if (media.provider === 'kitsu') detailed = normalizeKitsu(await kitsuDetails(media.id))
  else detailed = normalizeAnime(await anilistDetails(media.id))
  return {
    ...media, ...detailed,
    poster: detailed.poster || media.poster, backdrop: detailed.backdrop || media.backdrop,
    genres: detailed.genres?.length ? detailed.genres : media.genres || [],
    synopsis: detailed.synopsis === UNAVAILABLE ? media.synopsis : detailed.synopsis,
    trailer: detailed.trailer || media.trailer || null,
  }
}

export async function availableGenres(kind) {
  if (kind === 'anime') {
    return ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller']
      .map(name => ({ id: name, name }))
  }
  const list = kind === 'movies' ? CINEMETA_GENRES.slice(0, 19) : CINEMETA_GENRES
  return list.map(name => ({ id: name, name }))
}
