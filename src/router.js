import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import CollectionView from './views/CollectionView.vue'
import SearchView from './views/SearchView.vue'

const routes = [
  { path: '/', name: 'inicio', component: HomeView },
  { path: '/historico', name: 'historico', component: CollectionView, props: { type: 'history' } },
  { path: '/filmes', name: 'filmes', component: CollectionView, props: { type: 'movies' } },
  { path: '/series', name: 'series', component: CollectionView, props: { type: 'series' } },
  { path: '/animes', name: 'animes', component: CollectionView, props: { type: 'anime' } },
  { path: '/pesquisa', name: 'pesquisa', component: SearchView },
  { path: '/:catchAll(.*)', redirect: '/' },
]
export default createRouter({ history: createWebHashHistory(), routes, scrollBehavior() { return { top: 0 } } })
