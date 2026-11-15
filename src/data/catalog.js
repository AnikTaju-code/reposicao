// Conteúdo fictício para demonstrar a interface — NÃO é uma ligação à TMDB/AniList.
// As capas são deliberadamente substituídas pela logo oficial do projeto.
const item = (id, title, type, year, genre, rating, tint) => ({
  id, title, type, year, genre, rating, tint,
  synopsis: 'Área reservada para a sinopse. Mais tarde, o texto virá da API pública.',
})

export const movies = [
  item(101, 'Interstellar', 'Filme', 2014, 'Ficção científica', '8.6', 'violet'),
  item(102, 'Dune', 'Filme', 2021, 'Aventura', '8.0', 'blue'),
  item(103, 'Inception', 'Filme', 2010, 'Suspense', '8.4', 'rose'),
  item(104, 'Oppenheimer', 'Filme', 2023, 'Drama', '8.1', 'navy'),
  item(105, 'The Batman', 'Filme', 2022, 'Ação', '7.8', 'plum'),
  item(106, 'Avatar', 'Filme', 2009, 'Aventura', '7.6', 'cyan'),
  item(107, 'Parasite', 'Filme', 2019, 'Suspense', '8.5', 'indigo'),
  item(108, 'The Matrix', 'Filme', 1999, 'Ficção científica', '8.2', 'blue'),
]

export const series = [
  item(201, 'Daredevil', 'Série', 2015, 'Ação', '8.1', 'rose'),
  item(202, 'Dark', 'Série', 2017, 'Mistério', '8.7', 'navy'),
  item(203, 'Severance', 'Série', 2022, 'Suspense', '8.5', 'violet'),
  item(204, 'Stranger Things', 'Série', 2016, 'Ficção científica', '8.5', 'plum'),
  item(205, 'The Last of Us', 'Série', 2023, 'Drama', '8.6', 'indigo'),
  item(206, 'The Bear', 'Série', 2022, 'Comédia dramática', '8.3', 'blue'),
  item(207, 'Arcane', 'Série', 2021, 'Animação', '8.7', 'cyan'),
]

export const anime = [
  item(301, 'Jujutsu Kaisen', 'Anime', 2020, 'Ação', '8.5', 'blue'),
  item(302, 'Attack on Titan', 'Anime', 2013, 'Fantasia', '9.0', 'rose'),
  item(303, 'Demon Slayer', 'Anime', 2019, 'Aventura', '8.5', 'plum'),
  item(304, 'Frieren', 'Anime', 2023, 'Fantasia', '8.9', 'cyan'),
  item(305, 'One Piece', 'Anime', 1999, 'Aventura', '8.7', 'violet'),
  item(306, 'Chainsaw Man', 'Anime', 2022, 'Ação', '8.3', 'navy'),
  item(307, 'Death Note', 'Anime', 2006, 'Suspense', '8.6', 'indigo'),
]

export const history = [series[0], movies[1], anime[0], movies[0], anime[2], series[2]]

export const collections = {
  history: {
    title: 'Histórico', eyebrow: 'O QUE JÁ EXPLORASTE',
    description: 'Os títulos que visitaste aparecem aqui. Por enquanto, são apenas exemplos visuais.',
    items: history, tabs: ['Todos', 'Filmes', 'Séries', 'Animes'],
  },
  movies: {
    title: 'Filmes', eyebrow: 'O GRANDE ECRÃ',
    description: 'Descobre histórias para todos os gostos, organizadas numa interface simples e elegante.',
    items: movies, tabs: ['Todos', 'Populares', 'Ação', 'Drama', 'Ficção científica'],
  },
  series: {
    title: 'Séries', eyebrow: 'HISTÓRIAS QUE CONTINUAM',
    description: 'Temporadas, episódios e universos que merecem ser descobertos.',
    items: series, tabs: ['Todos', 'Populares', 'Drama', 'Mistério', 'Ação'],
  },
  anime: {
    title: 'Animes', eyebrow: 'OUTROS UNIVERSOS',
    description: 'Uma seleção de animes para descobrir novas aventuras.',
    items: anime, tabs: ['Todos', 'Populares', 'Ação', 'Fantasia', 'Aventura'],
  },
}
