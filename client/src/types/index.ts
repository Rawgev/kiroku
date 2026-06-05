// ─── AniList types ─────────────────────────────────────────────────────────────
export interface AniListTitle   { english: string | null; romaji: string; native?: string; }
export interface AniListImage   { large: string; medium?: string; extraLarge?: string; }
export interface AniListDate    { year: number | null; month: number | null; day: number | null; }
export interface AniListStudio  { name: string; siteUrl?: string; }
export interface AniListStaff   { role: string; node: { name: { full: string }; image: { medium: string } } }
export interface AniListVA      { name: { full: string }; image: { medium: string } }
export interface AniListChar    {
  role: string;
  voiceActors: AniListVA[];
  node: { name: { full: string }; image: { medium: string } };
}

export interface AniListMedia {
  id:                  number;
  title:               AniListTitle;
  coverImage:          AniListImage;
  bannerImage?:        string;
  description?:        string;
  averageScore?:       number;
  meanScore?:          number;
  popularity?:         number;
  favourites?:         number;
  episodes?:           number;
  chapters?:           number;
  volumes?:            number;
  status?:             string;
  genres?:             string[];
  format?:             string;
  source?:             string;
  countryOfOrigin?:    string;
  type?:               'ANIME' | 'MANGA';
  startDate?:          AniListDate;
  endDate?:            AniListDate;
  nextAiringEpisode?:  { episode: number; airingAt: number };
  studios?:            { nodes: AniListStudio[] };
  staff?:              { edges: AniListStaff[] };
  characters?:         { edges: AniListChar[] };
  trailer?:            { id: string; site: string; thumbnail: string };
  recommendations?:    { nodes: { mediaRecommendation: AniListMedia }[] };
  externalLinks?:      { url: string; site: string; type: string }[];
  tags?:               { name: string }[];
}

export interface AniListPage {
  pageInfo: { total: number; currentPage: number; lastPage: number; hasNextPage: boolean };
  media:    AniListMedia[];
}

// ─── User / Auth ───────────────────────────────────────────────────────────────
export interface User {
  _id:       string;
  username:  string;
  email:     string;
  avatar:    string;
  bio:       string;
  role:      'user' | 'admin';
  level:     number;
  xp:        number;
  provider:  'local' | 'google';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse { token: string; user: User; }

// ─── Library ───────────────────────────────────────────────────────────────────
export type MediaType   = 'anime' | 'manga' | 'manhwa' | 'manhua' | 'lightnovel';
export type WatchStatus = 'watching' | 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch' | 'plan_to_read';

export interface MediaEntry {
  _id:           string;
  userId:        string;
  mediaId:       number;
  mediaType:     MediaType;
  title:         string;
  coverImage:    string;
  status:        WatchStatus;
  score:         number;
  progress:      number;
  totalProgress?: number;
  startDate?:    string;
  finishDate?:   string;
  notes:         string;
  genres:        string[];
  rewatches:     number;
  isFavorite:    boolean;
  createdAt:     string;
  updatedAt:     string;
}

export interface CreateEntryPayload {
  mediaId:       number;
  mediaType:     MediaType;
  title:         string;
  coverImage:    string;
  status:        WatchStatus;
  score?:        number;
  progress?:     number;
  totalProgress?: number;
  genres?:       string[];
  notes?:        string;
}

// ─── Reviews ───────────────────────────────────────────────────────────────────
export interface Review {
  _id:           string;
  userId:        { _id: string; username: string; avatar: string };
  mediaId:       number;
  mediaType:     string;
  mediaTitle:    string;
  mediaCover:    string;
  rating:        number;
  title:         string;
  body:          string;
  likes:         string[];
  likesCount:    number;
  upvotes?:      string[];
  downvotes?:    string[];
  score?:        number;
  reactionHeart?: string[];
  reactionFire?:  string[];
  reactionZany?:  string[];
  spoiler:       boolean;
  createdAt:     string;
}

// ─── Watch Party ───────────────────────────────────────────────────────────────
export interface WatchPartyItem {
  _id:        string;
  mediaId:    number;
  title:      string;
  coverImage: string;
  mediaType:  string;
  currentEp:  number;
  totalEps?:  number;
  completed:  boolean;
  airingDay?: string;
}

export interface WatchParty {
  _id:       string;
  userId:    string;
  name:      string;
  season:    string;
  items:     WatchPartyItem[];
  isPublic:  boolean;
  createdAt: string;
}

// ─── Stats ─────────────────────────────────────────────────────────────────────
export interface UserStats {
  animeWatched:       number;
  mangaRead:          number;
  episodesWatched:    number;
  chaptersRead:       number;
  hoursWatched:       number;
  avgScore:           number;
  statusDistribution: Record<string, number>;
  typeDistribution:   Record<string, number>;
  scoreDistribution:  Record<string, number>;
  genreDistribution:  Record<string, number>;
}

// ─── API pagination ────────────────────────────────────────────────────────────
export interface Pagination {
  total:   number;
  page:    number;
  pages:   number;
  hasMore: boolean;
}
