// Testes de integração com respostas simuladas: NÃO fazem pedidos reais à internet.
import assert from 'node:assert/strict'
import { cinemetaBrowse, cinemetaDetails, CINEMETA_GENRES } from '../src/services/cinemeta.js'
import { anilistBrowse } from '../src/services/anilist.js'
import { kitsuBrowse } from '../src/services/kitsu.js'
import { browseCatalog, normalizeCinemeta, normalizeAnime, normalizeKitsu, readDetails } from '../src/services/catalog.js'

const calls = []
let anilistFails = false
const movie = {
  id: 'tt0816692', name: 'Interstellar', year: 2014, imdbRating: '8.7',
  genres: ['Adventure', 'Drama'], poster: 'https://images.example/interstellar.jpg',
  background: 'https://images.example/interstellar-back.jpg', description: 'Uma missão no espaço.',
  trailers: [{ source: 'abcDEF12345', type: 'Trailer' }],
}
const series = { id: 'tt0903747', name: 'Breaking Bad', releaseInfo: '2008–2013', imdbRating: '9.5', genres: ['Crime', 'Drama'] }
const anime = {
  id: 7, title: { english: 'Exemplo', romaji: 'Rei', native: '例' }, seasonYear: 2026,
  description: 'Uma <b>sinopse</b>!', averageScore: 85, genres: ['Action'],
  coverImage: { large: 'https://cdn.example/anime.jpg' }, bannerImage: 'https://cdn.example/banner.jpg',
  trailer: { id: 'xyzABC12345', site: 'youtube', thumbnail: 'https://cdn.example/trailer.jpg' },
}
const kitsu = {
  id: '18', type: 'anime', attributes: { canonicalTitle: 'Exemplo Kitsu', synopsis: 'Uma sinopse Kitsu',
    averageRating: '81.20', posterImage: { large: 'https://img.example/kitsu.jpg' }, startDate: '2023-01-01', episodeCount: 13, youtubeVideoId: 'kitsu123456' },
}
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body })
globalThis.fetch = async (input, init = {}) => {
  const url = String(input)
  calls.push({ url, init })
  if (url.startsWith('https://v3-cinemeta.strem.io/')) {
    if (url.includes('/meta/')) return response({ meta: url.includes('/series/') ? series : movie })
    return response({ metas: url.includes('/series/') ? [series] : [movie] })
  }
  if (url === 'https://graphql.anilist.co') {
    const payload = JSON.parse(init.body)
    if (anilistFails) return response({ errors: [{ message: 'Consulta temporariamente recusada' }], data: null }, 400)
    return response({ data: payload.query.includes('AnimeDetail') ? { Media: anime } : { Page: { pageInfo: { currentPage: 1, hasNextPage: false }, media: [anime] } } })
  }
  if (url.startsWith('https://kitsu.app/api/edge/')) {
    return response(url.includes('/anime/') ? { data: kitsu } : { data: [kitsu], links: { next: null } })
  }
  throw new Error('Serviço inesperado: ' + url)
}
const test = (label, fn) => fn().then(() => console.log('✓ ' + label))

await test('Cinemeta: listagem sem chave, imagens e nota', async () => {
  const list = await cinemetaBrowse('movies')
  assert.equal(list.entries[0].name, 'Interstellar')
  assert(calls.at(-1).url.endsWith('/catalog/movie/top.json'))
  const normalized = normalizeCinemeta(list.entries[0], 'movies')
  assert.equal(normalized.poster, 'https://images.example/interstellar.jpg')
  assert.equal(normalized.rating, '8.7')
  assert.equal(normalized.synopsis, 'Uma missão no espaço.')
  assert.equal(normalized.trailer.id, 'abcDEF12345')
  assert.equal(normalized.trailer.provider, 'youtube')
  assert.equal(normalizeCinemeta({ id: 'tt0000001', trailers: [{ source: 'clip1234567', type: 'Clip' }] }, 'movies').trailer, null)
  assert.equal(normalizeCinemeta({ id: 'tt0000002', trailers: [{ source: 'abcDEF12345', site: 'dailymotion', type: 'Trailer' }] }, 'movies').trailer, null)
  assert.equal(normalizeCinemeta({ id: 'tt0000003', trailers: [{ source: 'abcDEF12345', type: 'Trailer' }] }, 'movies').trailer.provider, 'youtube')
  assert.equal(normalizeCinemeta({ id: 'tt0000005', trailers: [{ url: 'https://youtu.be/abcDEF12345', type: 'Trailer' }] }, 'movies').trailer.id, 'abcDEF12345')
  assert.equal(normalizeCinemeta({ id: 'tt0000004' }, 'movies').trailer, null)
  assert.equal((await readDetails(normalized)).trailer.id, 'abcDEF12345')
})
await test('Cinemeta: pesquisa com extras corretos', async () => {
  await cinemetaBrowse('movies', { query: 'Spider Man' })
  assert(calls.at(-1).url.endsWith('/catalog/movie/top/search=Spider%20Man.json'))
  await cinemetaBrowse('series', { genre: 'Crime' })
  assert(calls.at(-1).url.endsWith('/catalog/series/top/genre=Crime.json'))
})
await test('Cinemeta: catálogo por ano, nota e paginação', async () => {
  await cinemetaBrowse('movies', { year: '2026' })
  assert(calls.at(-1).url.endsWith('/catalog/movie/year/genre=2026.json'))
  await cinemetaBrowse('movies', { sort: 'rating', page: 2 })
  assert(calls.at(-1).url.endsWith('/catalog/movie/imdbRating/skip=100.json'))
})
await test('Cinemeta: detalhes de série e gêneros', async () => {
  assert.equal((await cinemetaDetails('series', 'tt0903747')).name, 'Breaking Bad')
  assert.equal(normalizeCinemeta(series, 'series').year, '2008')
  assert(CINEMETA_GENRES.includes('Drama'))
})
await test('AniList: consulta, datas e sinopse sem HTML', async () => {
  const listing = await anilistBrowse({ page: 1, year: '2026' })
  assert.equal(listing.entries[0].title.english, 'Exemplo')
  assert.equal(normalizeAnime(listing.entries[0]).synopsis, 'Uma sinopse!')
  assert.equal(normalizeAnime(listing.entries[0]).rating, '8.5')
  assert.equal(normalizeAnime(listing.entries[0]).trailer.id, 'xyzABC12345')
  assert(calls.at(-1).init.body.includes('trailer { id site thumbnail }'))
  const variables = JSON.parse(calls.at(-1).init.body).variables
  assert.equal(variables.start, 20260000)
  assert.equal(variables.end, 20270000)
})
await test('Kitsu: normalização de alternativa', async () => {
  const list = await kitsuBrowse()
  const item = normalizeKitsu(list.entries[0])
  assert.equal(item.title, 'Exemplo Kitsu')
  assert.equal(item.rating, '8.1')
  assert.equal(item.episodes, 13)
  assert.equal(item.trailer.id, 'kitsu123456')
})
await test('Fallback: HTTP 400 AniList utiliza Kitsu', async () => {
  anilistFails = true
  const result = await browseCatalog('anime', { query: 'fallback-test-400' })
  assert.equal(result.source, 'kitsu')
  assert.equal(result.items[0].provider, 'kitsu')
  assert.equal((await readDetails(result.items[0])).synopsis, 'Uma sinopse Kitsu')
  anilistFails = false
})
await test('Histórico: conserva detalhes locais de itens TMDB antigos', async () => {
  const legacyMedia = { provider: 'tmdb', title: 'Filme antigo', id: 12 }
  assert.equal(await readDetails(legacyMedia), legacyMedia)
})
await test('Navegação: sem configuração de API', async () => {
  const { readFileSync } = await import('node:fs')
  const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
  const top = readFileSync(new URL('../src/components/Topbar.vue', import.meta.url), 'utf8')
  const detail = readFileSync(new URL('../src/components/DetailPanel.vue', import.meta.url), 'utf8')
  assert(!app.includes('ApiSettings'))
  assert(!top.includes('Configurar TMDB'))
  assert(detail.includes('v-if="hasTrailer"'))
  assert(detail.includes('Assistir trailer'))
  assert(detail.includes('onError: () =>'))
  assert(detail.includes('https://www.youtube.com/iframe_api'))
})
console.log('Todos os 9 testes de serviços passaram (dados simulados).')
