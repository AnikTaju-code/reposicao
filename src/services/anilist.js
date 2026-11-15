const ENDPOINT = 'https://graphql.anilist.co'
const PAGE_QUERY = `
query AnimeCatalog($page:Int,$search:String,$genre:String,$year:Int,$rating:Int,$sort:[MediaSort]) {
  Page(page:$page,perPage:20) {
    pageInfo { currentPage hasNextPage total }
    media(type:ANIME,isAdult:false,search:$search,genre:$genre,seasonYear:$year,averageScore_greater:$rating,sort:$sort) {
      id title { romaji english native } description(asHtml:false) format
      status episodes duration seasonYear genres averageScore popularity
      coverImage { large extraLarge color } bannerImage
    }
  }
}`
const DETAIL_QUERY = `
query AnimeDetail($id:Int) {
  Media(id:$id,type:ANIME) {
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
      method: 'POST',
      signal: options.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
  } catch (error) { if (error.name === 'AbortError') throw error; throw new Error('Não foi possível contactar a AniList.') }
  if (response.status === 429) throw new Error('A AniList atingiu o limite de pedidos. Tenta novamente mais tarde.')
  if (!response.ok) throw new Error(`A AniList devolveu o erro HTTP ${response.status}.`)
  const data = await response.json()
  if (data.errors?.length) throw new Error(data.errors[0].message || 'A AniList recusou a consulta.')
  return data.data
}

export async function anilistBrowse({ page = 1, query = '', genre = '', year = '', minRating = '', sort = 'popular', signal } = {}) {
  const variables = {
    page,
    search: query.trim() || null,
    genre: genre || null,
    year: year ? Number(year) : null,
    rating: minRating ? Number(minRating) * 10 - 1 : null,
    sort: [sort === 'rating' ? 'SCORE_DESC' : sort === 'recent' ? 'START_DATE_DESC' : 'POPULARITY_DESC'],
  }
  const data = await anilistRequest(PAGE_QUERY, variables, { signal })
  return { entries: data.Page?.media || [], currentPage: Number(data.Page?.pageInfo?.currentPage || page), totalPages: Math.ceil((data.Page?.pageInfo?.total || 0) / 20), hasNextPage: Boolean(data.Page?.pageInfo?.hasNextPage), source: 'anilist' }
}

export async function anilistDetails(id, options = {}) {
  const data = await anilistRequest(DETAIL_QUERY, { id: Number(id) }, options)
  return data.Media
}
