// Testes locais sem rede: validam normalização e configuração de pedidos.
import assert from 'node:assert/strict'
import { tmdbBrowse, tmdbDetails, setTmdbKey, tmdbImage } from '../src/services/tmdb.js'
import { anilistBrowse, anilistDetails } from '../src/services/anilist.js'
import { normalizeTmdb, normalizeAnime } from '../src/services/catalog.js'

const calls = []
globalThis.sessionStorage = {
  data: new Map(),
  getItem(key) { return this.data.get(key) || null },
  setItem(key, value) { this.data.set(key, value) },
  removeItem(key) { this.data.delete(key) },
}
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), init })
  if (String(url).startsWith('https://graphql.anilist.co')) {
    const { query } = JSON.parse(init.body)
    const anime = { id: 123, title: { english: 'Exemplo', romaji: 'Rei' }, description: 'Uma <b>sinopse</b>!', seasonYear: 2026, averageScore: 85, genres: ['Action'], coverImage: { extraLarge: 'https://cdn.example/anime.jpg' }, bannerImage: 'https://cdn.example/banner.jpg' }
    return { ok: true, status: 200, json: async () => ({ data: query.includes('AnimeDetail') ? { Media: anime } : { Page: { media: [anime], pageInfo: { currentPage: 1, hasNextPage: true, total: 400 } } } }) }
  }
  if (String(url).includes('/genre/')) return { ok:true,status:200,json:async()=>({genres:[{id:18,name:'Drama'}]}) }
  if (String(url).includes('/movie/12')) return { ok:true,status:200,json:async()=>({id:12,title:'Exemplo',overview:'Uma sinopse.',vote_average:8.1,release_date:'2026-05-01',poster_path:'/poster.jpg',backdrop_path:'/back.jpg',genres:[{id:18,name:'Drama'}]}) }
  return { ok:true,status:200,json:async()=>({page:1,total_pages:2,results:[{id:12,title:'Exemplo',release_date:'2026-05-01',vote_average:8.1,genre_ids:[18],overview:'Uma sinopse.',poster_path:'/poster.jpg'}]}) }
}

setTmdbKey('chave-de-teste')
const listing = await tmdbBrowse('movies', { page:1, year:'2026', minRating:'8', genre:'18',sort:'rating' })
assert.equal(listing.entries.length,1)
assert(calls[0].url.includes('/discover/movie'))
assert(calls[0].url.includes('vote_average.gte=8'))
assert.equal((await tmdbDetails('movies',12)).overview,'Uma sinopse.')
assert.equal(tmdbImage('/poster.jpg'),'https://image.tmdb.org/t/p/w500/poster.jpg')
assert.equal(normalizeTmdb(listing.entries[0],'movies').rating,'8.1')
const animePage = await anilistBrowse({ page:1, genre:'Action' })
assert.equal(animePage.hasNextPage,true)
assert.equal(animePage.entries[0].title.english,'Exemplo')
const animeDetails = await anilistDetails(123)
assert.equal(normalizeAnime(animeDetails).synopsis,'Uma sinopse!')
assert.equal(normalizeAnime(animeDetails).rating,'8.5')
console.log('6 testes das integrações passaram (respostas simuladas; não é uma ligação real às APIs).')
