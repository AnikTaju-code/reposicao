// Fonte de reserva para animes quando a AniList estiver indisponível.
const ROOT = 'https://kitsu.app/api/edge'

async function request(path, params = {}, { signal } = {}) {
  const url = new URL(`${ROOT}${path}`)
  for (const [name, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') url.searchParams.set(name, String(value))
  }
  let response
  try { response = await fetch(url, { signal, headers: { Accept: 'application/vnd.api+json' } }) }
  catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Não foi possível contactar a Kitsu.')
  }
  if (!response.ok) throw new Error(`Kitsu: erro HTTP ${response.status}.`)
  const data = await response.json()
  if (!data?.data) throw new Error('A Kitsu devolveu dados inesperados.')
  return data
}

export async function kitsuBrowse({ page = 1, query = '', genre = '', year = '', minRating = '', sort = 'popular', signal } = {}) {
  const params = {
    'page[limit]': 20,
    'page[offset]': (Number(page) - 1) * 20,
    sort: sort === 'rating' ? '-averageRating' : sort === 'recent' ? '-startDate' : '-userCount',
  }
  if (String(query).trim()) params['filter[text]'] = String(query).trim()
  if (genre) params['filter[categories]'] = String(genre).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const data = await request('/anime', params, { signal })
  const entries = data.data.filter(item => !item.attributes?.nsfw).filter(item => {
    const date = String(item.attributes?.startDate || '')
    if (year && !date.startsWith(String(year))) return false
    if (minRating && Number(item.attributes?.averageRating || 0) < Number(minRating) * 10) return false
    return true
  })
  return { entries, currentPage: Number(page), hasNextPage: Boolean(data.links?.next), source: 'kitsu', limitedFilters: Boolean(year || minRating) }
}

export async function kitsuDetails(id, options = {}) {
  if (!/^\d+$/.test(String(id))) throw new Error('Identificador Kitsu inválido.')
  const data = await request(`/anime/${encodeURIComponent(id)}`, {}, options)
  return data.data
}