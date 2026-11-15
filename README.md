# CineNexus — Vue 3 + Cinemeta + AniList + Kitsu

Catálogo de **filmes, séries e animes** com pesquisa, filtros, sinopses, cartazes reais e histórico de títulos abertos localmente.

## Iniciar

Requisitos: **Node.js 20.19+ ou 22.12+** e npm.

```bash
npm install
npm run dev
```

Abrir o endereço indicado no terminal (normalmente `http://localhost:5173`).

### APIs de catálogo

Todas as fontes funcionam sem chave configurada pelo utilizador:

- Filmes e séries usam os catálogos públicos do [Cinemeta](https://v3-cinemeta.strem.io/).
- Animes usam a [AniList](https://anilist.co/), com fallback automático para a [Kitsu](https://kitsu.app/) quando a AniList falha.

As APIs são consultadas diretamente pelo navegador. A disponibilidade e os filtros dependem dos serviços públicos; o Cinemeta pode limitar combinações de filtros e resultados por página.

## Funcionalidades

- Home com carrosséis: Histórico, Populares · Filmes, Populares · Séries, Em destaque · Animes.
- Cartazes reais de Cinemeta / AniList / Kitsu (logo CineNexus como fallback quando faltar imagem).
- Pesquisa conjunta dos três catálogos por título na barra superior.
- Filtros por **género, ano, nota**; ordenação por populares, mais avaliados e recentes; paginação.
- Painel de detalhes com imagem horizontal, sinopse, géneros, duração e episódios/temporadas quando existirem.
- Pré-visualização de trailers do YouTube no painel de detalhes, carregada apenas quando o utilizador inicia o vídeo.
- Histórico local automático dos **títulos que o utilizador abriu** (não há reprodução nem progresso de episódios); botão para apagar histórico.
- Vue Router em modo hash, compatível com hospedagem estática no GitHub Pages.
- Sem backend próprio, login, reprodução integral de filmes/séries, plugins, addons ou sincronização.

## Observações técnicas

- Cinemeta fornece catálogos públicos de filmes e séries; alguns filtros são aplicados aos resultados recebidos no navegador.
- A AniList usa GraphQL e solicita apenas os campos necessários. A Kitsu é usada como alternativa para animes se a AniList estiver indisponível.
- Os trailers são aceites apenas quando a fonte fornece um ID válido do YouTube; o player externo só é carregado após o clique.
- Sinopses e imagens são normalizadas a partir dos campos de cada serviço. Quando uma sinopse não existe, mostramos «Sinopse indisponível no momento».
- A avaliação mostrada é a média fornecida por cada base de dados, normalizada visualmente para 0–10; **não** é necessariamente a nota IMDb.
- Fontes: [Cinemeta](https://v3-cinemeta.strem.io/), [AniList](https://docs.anilist.co/) e [Kitsu](https://kitsu.app/).

## Compilar para distribuição

```bash
npm run build
npm run preview
```

A pasta `dist/` é o site estático gerado pelo Vite. O `vite.config.js` usa `base:'./'` e o Vue Router usa hash, adequados ao GitHub Pages.

## Estrutura

```text
src/
  assets/                 Logo e ícone CineNexus
  components/             Sidebar, Topbar, MediaCard, SectionRow, DetailPanel
  services/
    cinemeta.js            Catálogos públicos de filmes e séries
    anilist.js             Consultas GraphQL à AniList
    kitsu.js               Fallback público para animes
    catalog.js             Mapeamento de campos e cache de leitura
    history.js            Histórico local
  views/
    HomeView.vue          Home com carrosséis
    CollectionView.vue    Filmes, Séries, Animes, Histórico
    SearchView.vue        Pesquisa combinada
  App.vue                 Estado geral e eventos
  style.css               Estilos da interface
  router.js               Rotas
```

## Teste sem acesso à rede

```bash
npm run test:services
```

Este teste simula respostas das APIs para verificar pedidos e conversão de dados. **Não** valida a disponibilidade real dos serviços.
