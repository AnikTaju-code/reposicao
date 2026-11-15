// AniList usa GraphQL. Tratamos erros no corpo JSON, inclusive respostas HTTP 400.
const ENDPOINT = 'https://graphql.anilist.co'
const PAGE_QUERY = `
query AnimeCatalog($page:Int!, $search:String, $genre:String, $rating:Int, $start:FuzzyDateInt, $end:FuzzyDateInt, $sort:[MediaSort]) {
  Page(page:$page, perPage:20) {
    pageInfo { currentPage hasNextPage }
    media(type:ANIME, isAdult:false, search:$search, genre:$genre, averageScore_greater:$rating,
      startDate_greater:$start, startDate_lesser:$end, sort:$sort) {
      id title { romaji english native } description(asHtml:false) format
      status episodes duration seasonYear genres averageScore popularity
      coverImage { large extraLarge color } bannerImage
    }
  }
}`
const DETAIL_QUERY = `
query AnimeDetail($id:Int!) {
  Media(id:$id, type:ANIME) {
    id title { romaji english native } description(asHtml:false)
    format status episodes duration seasonYear genres averageScore popularity
    coverImage { large extraLarge color } bannerImage
    studios(isMain:true) { nodes { name } }
    source countryOfOrigin siteUrl
  }
}`

async function anilistRequest(query, variables, options = {}) {
  let response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST', signal: options.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Não foi possível contactar a AniList.')
  }
  let json = null
  try { json = await response.json() } catch { /* resposta inválida do serviço */ }
  const serverMessage = json?.errors?.map(error => error.message).filter(Boolean).join('; ')
  if (response.status === 429) throw new Error('A AniList atingiu o limite de pedidos.')
  if (!response.ok || serverMessage) {
    throw new Error(serverMessage ? `AniList: ${serverMessage}` : `AniList: HTTP ${response.status}.`)
  }
  if (!json?.data) throw new Error('A AniList devolveu uma resposta vazia.')
  return json.data
}

export async function anilistBrowse({ page = 1, query = '', genre = '', year = '', minRating = '', sort = 'popular', signal } = {}) {
  const selectedYear = Number(year) || 0
  const variables = {
    page: Number(page),
    search: String(query).trim() || null,
    genre: genre || null,
    rating: minRating ? Number(minRating) * 10 - 1 : null,
    start: selectedYear ? selectedYear * 10000 : null,
    end: selectedYear ? (selectedYear + 1) * 10000 : null,
    sort: [sort === 'rating' ? 'SCORE_DESC' : sort === 'recent' ? 'START_DATE_DESC' : 'POPULARITY_DESC'],
  }
  const data = await anilistRequest(PAGE_QUERY, variables, { signal })
  return {
    entries: data.Page?.media || [],
    currentPage: Number(data.Page?.pageInfo?.currentPage || page),
    hasNextPage: Boolean(data.Page?.pageInfo?.hasNextPage),
    source: 'anilist',
  }
}

export async function anilistDetails(id, options = {}) {
  const data = await anilistRequest(DETAIL_QUERY, { id: Number(id) }, options)
  if (!data.Media) throw new Error('Anime não encontrado na AniList.')
  return data.Media
}
