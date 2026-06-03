const BASE = 'https://api.mangadex.org';

export interface MDManga {
  id: string;
  attributes: {
    title: Record<string, string>;
    description: Record<string, string>;
    status: string;
    year: number;
    tags: { attributes: { name: Record<string, string>; group: string } }[];
  };
  relationships: { type: string; id: string; attributes?: Record<string, unknown> }[];
}

export interface MDChapter {
  id: string;
  attributes: {
    chapter: string | null;
    title:   string | null;
    pages:   number;
    publishAt: string;
    translatedLanguage: string;
  };
  relationships: { type: string; id: string; attributes?: Record<string, unknown> }[];
}

async function mdFetch<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`MangaDex error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function searchMangaDex(query: string, limit = 10): Promise<{ data: MDManga[] }> {
  return mdFetch('/manga', { title: query, limit, 'order[relevance]': 'desc', includes: 'cover_art' });
}

export async function getMangaChapters(mangaId: string, lang = 'en', limit = 30): Promise<{ data: MDChapter[] }> {
  return mdFetch(`/manga/${mangaId}/feed`, {
    translatedLanguage: lang,
    limit,
    'order[chapter]': 'asc',
    'order[publishAt]': 'desc',
  });
}

export function getMangaDexReadUrl(chapterId: string): string {
  return `https://mangadex.org/chapter/${chapterId}`;
}

export function getMangaDexTitleUrl(mangaId: string): string {
  return `https://mangadex.org/title/${mangaId}`;
}

export function getCoverUrl(manga: MDManga): string {
  const rel = manga.relationships.find((r) => r.type === 'cover_art');
  const fileName = rel?.attributes?.fileName as string | undefined;
  if (!fileName) return '';
  return `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg`;
}
