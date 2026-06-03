import type { AniListMedia, AniListPage } from '../types';

const ENDPOINT = 'https://graphql.anilist.co';

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body:    JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList API error: ${res.status}`);
  const json = await res.json() as { data: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

// ── Fragments ──────────────────────────────────────────────────────────────────
const CARD_FIELDS = `
  id
  title { english romaji }
  coverImage { large }
  averageScore
  episodes
  chapters
  nextAiringEpisode { episode airingAt }
  genres
  type
  format
  status
`;

const DETAIL_FIELDS = `
  id
  title { english romaji native }
  coverImage { large extraLarge }
  bannerImage
  description(asHtml: false)
  averageScore meanScore popularity favourites
  episodes chapters volumes
  status format source countryOfOrigin
  genres
  tags { name }
  startDate { year month day }
  endDate   { year month day }
  nextAiringEpisode { episode airingAt }
  studios(isMain: true) { nodes { name siteUrl } }
  staff(sort: RELEVANCE, page: 1, perPage: 8) {
    edges { role node { name { full } image { medium } } }
  }
  characters(sort: ROLE, page: 1, perPage: 12) {
    edges {
      role
      voiceActors(language: JAPANESE) { name { full } image { medium } }
      node { name { full } image { medium } }
    }
  }
  trailer { id site thumbnail }
  recommendations(sort: RATING_DESC, page: 1, perPage: 8) {
    nodes { mediaRecommendation { id title { english romaji } coverImage { large } averageScore type } }
  }
  externalLinks { url site type }
`;

// ── Home dashboard ────────────────────────────────────────────────────────────
export async function fetchHomeData(): Promise<{
  trending:     { media: AniListMedia[] };
  topRated:     { media: AniListMedia[] };
  popularManga: { media: AniListMedia[] };
  upcoming:     { media: AniListMedia[] };
}> {
  return gql(`{
    trending: Page(page:1, perPage:10) {
      media(sort:TRENDING_DESC, type:ANIME, isAdult:false) {
        ${CARD_FIELDS}
        bannerImage
        description(asHtml: false)
      }
    }
    topRated: Page(page:1, perPage:8) {
      media(sort:SCORE_DESC, type:ANIME, isAdult:false, status:FINISHED) { ${CARD_FIELDS} }
    }
    popularManga: Page(page:1, perPage:8) {
      media(sort:POPULARITY_DESC, type:MANGA, isAdult:false) { ${CARD_FIELDS} }
    }
    upcoming: Page(page:1, perPage:4) {
      media(sort:POPULARITY_DESC, type:ANIME, isAdult:false, status:NOT_YET_RELEASED) { ${CARD_FIELDS} }
    }
  }`);
}

// ── Fetch single media by ID ──────────────────────────────────────────────────
export async function fetchMediaDetail(id: number, type: 'ANIME' | 'MANGA'): Promise<{ Media: AniListMedia }> {
  return gql(`query($id:Int, $type:MediaType){ Media(id:$id, type:$type){ ${DETAIL_FIELDS} } }`, { id, type });
}

// ── Search ────────────────────────────────────────────────────────────────────
export interface SearchParams {
  query?:  string;
  type?:   'ANIME' | 'MANGA';
  genre?:  string;
  year?:   number;
  format?: string;
  sort?:   string;
  page?:   number;
  perPage?: number;
  countryOfOrigin?: string;
}

export async function searchMedia(params: SearchParams): Promise<{ search: AniListPage }> {
  const {
    query, type, genre, year, format,
    sort = 'POPULARITY_DESC', page = 1, perPage = 20,
    countryOfOrigin,
  } = params;

  // 1. Start with the guaranteed base variables
  const variables: Record<string, unknown> = {
    page,
    perPage,
    sort: [sort],
  };

  // 2. Only attach optional filters if they actually have a value
  if (query?.trim()) variables.search = query;
  if (type)           variables.type = type;
  if (genre)          variables.genre = genre;
  if (year)           variables.year = year;
  if (format)         variables.format = format;
  if (countryOfOrigin) variables.countryOfOrigin = countryOfOrigin;

  // 3. Fire the query with the perfectly stripped variables object
  return gql(
    `query($search:String,$type:MediaType,$genre:String,$year:Int,$format:MediaFormat,$sort:[MediaSort],$page:Int,$perPage:Int,$countryOfOrigin:CountryCode){
      search: Page(page:$page, perPage:$perPage){
        pageInfo { total currentPage lastPage hasNextPage }
        media(search:$search, type:$type, genre:$genre, seasonYear:$year, format:$format, sort:$sort, countryOfOrigin:$countryOfOrigin, isAdult:false){
          ${CARD_FIELDS}
        }
      }
    }`,
    variables,
  );
}

// ── Seasonal anime ────────────────────────────────────────────────────────────
export type AniListSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

export function getCurrentSeason(): AniListSeason {
  const m = new Date().getMonth() + 1;
  if (m <= 3)  return 'WINTER';
  if (m <= 6)  return 'SPRING';
  if (m <= 9)  return 'SUMMER';
  return 'FALL';
}

export async function fetchSeasonal(season: AniListSeason, year: number, page = 1): Promise<{ seasonal: AniListPage }> {
  return gql(
    `query($season:MediaSeason,$year:Int,$page:Int){
      seasonal: Page(page:$page, perPage:24){
        pageInfo { total currentPage lastPage hasNextPage }
        media(season:$season, seasonYear:$year, type:ANIME, isAdult:false, sort:POPULARITY_DESC){ ${CARD_FIELDS} }
      }
    }`,
    { season, year, page },
  );
}

// ── All genres ────────────────────────────────────────────────────────────────
export async function fetchGenres(): Promise<{ GenreCollection: string[] }> {
  return gql(`{ GenreCollection }`);
}

// ── Top by genre ──────────────────────────────────────────────────────────────
export async function fetchByGenre(genre: string, type: 'ANIME' | 'MANGA' = 'ANIME'): Promise<{ byGenre: AniListPage }> {
  return gql(
    `query($genre:String,$type:MediaType){
      byGenre: Page(page:1, perPage:10){
        media(genre:$genre, type:$type, sort:SCORE_DESC, isAdult:false){ ${CARD_FIELDS} }
      }
    }`,
    { genre, type },
  );
}
