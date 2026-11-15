import { tmdbBrowse, tmdbDetails, tmdbGenres, tmdbImage } from './tmdb.js'
import { anilistBrowse, anilistDetails } from './anilist.js'

export const typeLabels = { movies: 'Filme', series: 'Série', anime: 'Anime' }
export const categoryMeta = {
  movies: { title: 'Filmes', eyebrow: 'O GRANDE ECRÃ', description: 'Explora os filmes mais populares e encontra a tua próxima história.' },
  series: { title: 'Séries', eyebrow: 'HISTÓRIAS QUE CONTINUAM', description: 'Descobre séries, temporadas e personagens memoráveis.' },
  anime: { title: 'Animes', eyebrow: 'OUTROS UNIVERSOS', description: 'Explora animes populares, os géneros e os lançamentos.' },
  history: { title: 'Histórico', eyebrow: 'O QUE JÁ EXPLORASTE', description: 'Os títulos que abriste neste navegador. Sem guardar progresso de reprodução.' },
}

function formatRating(number) {
  return Number.isFinite(Number(number)) && Number(number) > 0 ? (Math.round(Number(number) * 10) / 10).toFixed(1) : '—'
}

// Mantemos só texto na sinopse: respostas GraphQL podem incluir marcação HTML.
function safeText(value) {
  return String(value || '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .trim()
}

export function normalizeTmdb(data, kind) {
  const genres = data.genres?.map(g => g.name) || []
  return {
    key: `tmdb-${kind}-${data.id}`, id: data.id, kind, provider: 'tmdb',
    type: typeLabels[kind], title: data.title || data.name || data.original_title || data.original_name || 'Sem título',
    year: (data.release_date || data.first_air_date || '').slice(0, 4) || '—',
    rating: formatRating(data.vote_average),
    genre: genres[0] || '', genres, genreIds: data.genre_ids || [],
    poster: tmdbImage(data.poster_path, 'w500'),
    backdrop: tmdbImage(data.backdrop_path, 'w1280'),
    synopsis: safeText(data.overview) || 'Sinopse indisponível no momento.',
    runtime: data.runtime || (data.episode_run_time || [])[0] || null,
    episodes: data.number_of_episodes || null, seasons: data.number_of_seasons || null,
    tagline: data.tagline || '', originalTitle: data.original_title || data.original_name || '',
    tint: 'violet',
  }
}

export function normalizeAnime(data) {
  const title = data.title?.english || data.title?.romaji || data.title?.native || 'Sem título'
  return {
    key: `anilist-anime-${data.id}`, id: data.id, kind: 'anime', provider: 'anilist', type: 'Anime', title,
    year: data.seasonYear || '—', rating: formatRating(data.averageScore ? data.averageScore / 10 : null),
    genre: data.genres?.[0] || '', genres: data.genres || [],
    poster: data.coverImage?.extraLarge || data.coverImage?.large || null,
    backdrop: data.bannerImage || null,
    synopsis: safeText(data.description) || 'Sinopse indisponível no momento.',
    episodes: data.episodes || null, runtime: data.duration || null, format: data.format || '',
    status: data.status || '', studios: (data.studios?.nodes || []).map(s => s.name),
    originalTitle: data.title?.native || '', tint: 'blue',
  }
}

const requestCache = new Map()
function cached(cacheKey, factory, lifetime = 90_000) {
  const cachedValue = requestCache.get(cacheKey)
  if (cachedValue && Date.now() - cachedValue.created < lifetime) return cachedValue.promise
  const promise = factory().catch(error => { requestCache.delete(cacheKey); throw error })
  requestCache.set(cacheKey, { created: Date.now(), promise })
  return promise
}
export function invalidateCatalogCache() { requestCache.clear() }

export async function browseCatalog(kind, options = {}) {
  // Não colocamos a chave em nenhuma cache ou URL da aplicação.
  const { signal, ...rest } = options
  const fetcher = () => kind === 'anime' ? anilistBrowse(rest) : tmdbBrowse(kind, rest)
  // Consultas com AbortSignal não são partilhadas, evitando abortar pedidos de outros componentes.
  const output = signal ? await (kind === 'anime' ? anilistBrowse({ ...rest, signal }) : tmdbBrowse(kind, { ...rest, signal }))
    : await cached(JSON.stringify([kind, rest]), fetcher)
  const items = output.entries.map(item => kind === 'anime' ? normalizeAnime(item) : normalizeTmdb(item, kind))
  if (kind !== 'anime') {
    try {
      const genreMap = new Map((await availableGenres(kind)).map(genre => [genre.id, genre.name]))
      for (const item of items) {
        item.genres = item.genreIds.map(id => genreMap.get(id)).filter(Boolean)
        item.genre = item.genres[0] || ''
      }
    } catch { /* lista ainda funciona sem nomes dos géneros */ }
  }
  return { ...output, items }
}

export async function readDetails(media) {
  const data = media.provider === 'anilist' ? await anilistDetails(media.id) : await tmdbDetails(media.kind, media.id)
  const detailed = media.provider === 'anilist' ? normalizeAnime(data) : normalizeTmdb(data, media.kind)
  // Conserva os campos já recebidos na listagem, se detalhes estiverem incompletos.
  return { ...media, ...detailed, poster: detailed.poster || media.poster, backdrop: detailed.backdrop || media.backdrop,
    genres: detailed.genres.length ? detailed.genres : media.genres || [],
    synopsis: detailed.synopsis === 'Sinopse indisponível no momento.' ? media.synopsis : detailed.synopsis }
}

export async function availableGenres(kind) {
  if (kind === 'anime') {
    return ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Mystery','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller']
      .map(name => ({ id: name, name }))
  }
  return cached(`genres-${kind}`, () => tmdbGenres(kind))
}
