# CineNexus — Vue 3 + TMDB + AniList

Catálogo de **filmes, séries e animes** com pesquisa, filtros, sinopses, cartazes reais e histórico de títulos abertos localmente.

## Iniciar

Requisitos: **Node.js 20.19+ ou 22.12+** e npm.

```bash
npm install
npm run dev
```

Abrir o endereço indicado no terminal (normalmente `http://localhost:5173`).

### Configurar filmes e séries (TMDB)

1. Cria uma conta na [TMDB](https://www.themoviedb.org/) e obtém uma **API Key v3** em [Definições → API](https://www.themoviedb.org/settings/api).
2. Abre a aplicação e clica no ícone **Definições** no canto superior direito.
3. Cola a chave e clica em **Guardar nesta sessão**.
4. As listas de filmes e séries, capas, filtros, pesquisa e sinopses são carregadas pela API TMDB.

A chave é mantida em `sessionStorage` e usada em pedidos no navegador. **Aviso de segurança:** por ser enviada do frontend, ela é visível em pedidos de rede e no DevTools. Não coloques segredos reais no código nem uses chaves de produção confidenciais desta forma. A chave não é adicionada ao repositório nem compilada na aplicação. Para uma versão pública na qual visitantes não introduzam a própria chave, recomenda-se um endpoint servidor/edge que mantenha o token TMDB privado, com limites e proteção contra abusos. **O GitHub Pages sozinho não pode ocultar credenciais da API.**

### Animes (AniList)

A secção de animes funciona sem chave, utilizando `https://graphql.anilist.co`. Se a AniList estiver temporariamente indisponível ou limitar pedidos, a interface mostra uma mensagem clara.

## Funcionalidades

- Home com carrosséis: Histórico, Populares · Filmes, Populares · Séries, Em destaque · Animes.
- Cartazes reais de TMDB / AniList (logo CineNexus como fallback quando faltar imagem).
- Pesquisa conjunta dos três catálogos por título na barra superior.
- Filtros por **género, ano, nota**; ordenação por populares, mais avaliados e recentes; paginação.
- Painel de detalhes com imagem horizontal, sinopse, géneros, duração e episódios/temporadas quando existirem.
- Histórico local automático dos **títulos que o utilizador abriu** (não há reprodução nem progresso de episódios); botão para apagar histórico.
- Vue Router em modo hash, compatível com hospedagem estática no GitHub Pages.
- Sem backend próprio, sem login, streaming, trailers, plugins, addons ou sincronização.

## Observações técnicas

- A TMDB tem endpoints diferentes para popularidade, pesquisa e filtros: `/popular`, `/search` e `/discover`. Na barra de pesquisa, o filtro de texto é feito pelo endpoint `/search`, enquanto filtros avançados na página de coleção usam `/discover`.
- A AniList usa GraphQL e permite solicitar apenas os campos necessários.
- A sinopse vem de `overview` (TMDB) ou `description` (AniList). Quando não existe, mostramos «Sinopse indisponível no momento».
- As imagens vêm dos próprios serviços: cartazes (`poster_path`/`coverImage`) e fundos (`backdrop_path`/`bannerImage`).
- A avaliação mostrada é a média fornecida por cada base de dados, normalizada visualmente para 0–10; **não** é necessariamente a nota IMDb.
- Fontes e licenças: [TMDB](https://developer.themoviedb.org/) e [AniList](https://docs.anilist.co/). Este produto utiliza a API TMDB, mas não é apoiado ou certificado pela TMDB.

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
  components/             Sidebar, Topbar, MediaCard, SectionRow, DetailPanel, ApiSettings
  services/
    tmdb.js               Pedidos à API TMDB
    anilist.js            Consultas GraphQL à AniList
    catalog.js            Mapeamento de campos e cache de leitura
    history.js            Histórico local
  views/
    HomeView.vue          Home com carrosséis
    CollectionView.vue    Filmes, Séries, Animes, Histórico
    SearchView.vue        Pesquisa combinada
  App.vue                 Estado geral, diálogos e eventos
  style.css               Estilos da interface
  router.js               Rotas
```

## Teste sem acesso à rede

```bash
npm run test:services
```

Este teste simula respostas das APIs para verificar pedidos e conversão de dados. **Não** valida a disponibilidade real da TMDB/AniList.
