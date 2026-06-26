import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchMedia, fetchGenres } from '../api/anilist';
import { AnimeCard, SkeletonCard, Spinner, Modal } from '../components/ui';
import { C, inputStyle, STATUS_LABELS } from '../constants/colors';
import type { AniListMedia, WatchStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { addToLibrary } from '../api/backend';

const FORMATS = ['TV','MOVIE','OVA','ONA','SPECIAL','MANGA','ONE_SHOT','NOVEL'];
const SORTS   = [
  { val: 'POPULARITY_DESC', label: 'Most Popular' },
  { val: 'SCORE_DESC',      label: 'Highest Rated' },
  { val: 'TRENDING_DESC',   label: 'Trending' },
  { val: 'START_DATE_DESC', label: 'Newest' },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [results,  setResults]  = useState<AniListMedia[]>([]);
  const [genres,   setGenres]   = useState<string[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(false);
  const [total,    setTotal]    = useState(0);

  // Library Add states
  const [addModal, setAddModal] = useState<AniListMedia | null>(null);
  const [status, setStatus] = useState<WatchStatus>('plan_to_watch');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const openAdd = (m: AniListMedia) => {
    setStatus(m.type === 'MANGA' ? 'plan_to_read' : 'plan_to_watch');
    setAddModal(m);
  };

  const handleAdd = async () => {
    if (!user || !addModal) { navigate('/login'); return; }
    setSaving(true);
    try {
      const totalProg = addModal.type === 'MANGA' ? addModal.chapters : addModal.episodes;
      await addToLibrary({
        mediaId:   addModal.id,
        mediaType: addModal.type === 'MANGA' ? 'manga' : 'anime',
        title:     addModal.title.english || addModal.title.romaji,
        coverImage: addModal.coverImage.large,
        status,
        progress: status === 'completed' && totalProg ? totalProg : 0,
        totalProgress: totalProg,
        genres:    addModal.genres || [],
      });
      showToast(`✅ Added to ${STATUS_LABELS[status]}!`);
      setAddModal(null);
    } catch (e: any) {
      showToast(e?.response?.data?.message || '❌ Already in library');
    } finally {
      setSaving(false);
    }
  };

  const [searchMangaDropdownOpen, setSearchMangaDropdownOpen] = useState(false);
  const searchMangaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchMangaMouseEnter = () => {
    if (searchMangaTimeoutRef.current) {
      clearTimeout(searchMangaTimeoutRef.current);
      searchMangaTimeoutRef.current = null;
    }
    setSearchMangaDropdownOpen(true);
  };

  const handleSearchMangaMouseLeave = () => {
    searchMangaTimeoutRef.current = setTimeout(() => {
      setSearchMangaDropdownOpen(false);
    }, 250);
  };

  const q      = searchParams.get('q')      || '';
  const type   = (searchParams.get('type')  || 'ANIME') as 'ANIME' | 'MANGA' | 'MANHWA' | 'MANHUA';
  const genre  = searchParams.get('genre')  || '';
  const sort   = searchParams.get('sort')   || 'POPULARITY_DESC';
  const format = searchParams.get('format') || '';

  useEffect(() => {
    fetchGenres().then((d) => setGenres(d.GenreCollection)).catch(() => {});
  }, []);

  const doSearch = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const apiType = type === 'ANIME' ? 'ANIME' : 'MANGA';
      const countryOfOrigin = type === 'MANHWA' ? 'KR' : type === 'MANHUA' ? 'CN' : undefined;
      const { search } = await searchMedia({
        query: q || undefined,
        type: apiType,
        genre: genre || undefined,
        sort,
        format: format || undefined,
        page: p,
        perPage: 24,
        countryOfOrigin,
      });
      if (p === 1) setResults(search.media);
      else         setResults((prev) => [...prev, ...search.media]);
      setHasMore(search.pageInfo.hasNextPage);
      setTotal(search.pageInfo.total);
    } catch (e) { console.error(e); }
    finally  { setLoading(false); }
  }, [q, type, genre, sort, format]);

  useEffect(() => { setPage(1); doSearch(1); }, [doSearch]);

  const set = (key: string, val: string) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    setSearchParams(p);
  };

  const loadMore = () => { const np = page + 1; setPage(np); doSearch(np); };

  return (
    <div>
      {/* Filter bar */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '14px 18px', marginBottom: 22, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Type toggle */}
        <div style={{ display: 'flex', background: C.bg2, borderRadius: 8, overflow: 'visible', position: 'relative' }}>
          <button
            onClick={() => {
              set('type', 'ANIME');
              if (searchMangaTimeoutRef.current) {
                clearTimeout(searchMangaTimeoutRef.current);
                searchMangaTimeoutRef.current = null;
              }
              setSearchMangaDropdownOpen(false);
            }}
            style={{
              padding: '7px 16px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: '8px 0 0 8px',
              background: type === 'ANIME' ? C.accent : 'transparent',
              color: type === 'ANIME' ? '#fff' : C.muted,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            ANIME
          </button>

          <div
            onMouseEnter={handleSearchMangaMouseEnter}
            onMouseLeave={handleSearchMangaMouseLeave}
            style={{ position: 'relative', display: 'flex' }}
          >
            <button
              onClick={() => {
                if (type === 'ANIME') {
                  set('type', 'MANGA');
                }
                setSearchMangaDropdownOpen(!searchMangaDropdownOpen);
              }}
              style={{
                padding: '7px 16px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: '0 8px 8px 0',
                background: type !== 'ANIME' ? C.accent : 'transparent',
                color: type !== 'ANIME' ? '#fff' : C.muted,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {type === 'MANHWA' ? 'MANHWA' : type === 'MANHUA' ? 'MANHUA' : 'MANGA'} ▾
            </button>

            {searchMangaDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: 130,
                  background: 'rgba(20, 26, 47, 0.96)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  padding: '5px 0',
                  zIndex: 220,
                  marginTop: 4,
                  animation: 'fadeIn 0.15s ease-out',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {[
                  { label: '📖 All Manga', val: 'MANGA' },
                  { label: '🇰🇷 Manhwa', val: 'MANHWA' },
                  { label: '🇨🇳 Manhua', val: 'MANHUA' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => {
                      set('type', opt.val);
                      if (searchMangaTimeoutRef.current) {
                        clearTimeout(searchMangaTimeoutRef.current);
                        searchMangaTimeoutRef.current = null;
                      }
                      setSearchMangaDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: type === opt.val ? C.accentLight : C.text,
                      fontSize: 11.5,
                      fontWeight: 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${C.accent}20`;
                      e.currentTarget.style.color = '#FFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = type === opt.val ? C.accentLight : C.text;
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Genre select */}
        <select value={genre} onChange={(e) => set('genre', e.target.value)}
          style={{ ...inputStyle, width: 160, padding: '7px 10px' }}>
          <option value="">All Genres</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>

        {/* Sort */}
        <select value={sort} onChange={(e) => set('sort', e.target.value)}
          style={{ ...inputStyle, width: 160, padding: '7px 10px' }}>
          {SORTS.map((s) => <option key={s.val} value={s.val}>{s.label}</option>)}
        </select>

        {/* Format */}
        <select value={format} onChange={(e) => set('format', e.target.value)}
          style={{ ...inputStyle, width: 130, padding: '7px 10px' }}>
          <option value="">All Formats</option>
          {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        {total > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: C.muted }}>
            {total.toLocaleString()} results
          </span>
        )}
      </div>

      {/* Results */}
      {q && <h2 style={{ fontSize: 16, color: C.text, marginBottom: 16 }}>Results for "{q}"</h2>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 14 }}>
        {loading && page === 1
          ? Array(24).fill(0).map((_, i) => <SkeletonCard key={i} w={148} />)
          : results.map((m) => (
            <AnimeCard key={m.id} media={m}
              onAdd={openAdd} />
          ))}
      </div>

      {results.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
          <p style={{ color: C.muted }}>No results found. Try different filters.</p>
        </div>
      )}

      {hasMore && !loading && (
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <button onClick={loadMore}
            style={{ padding: '10px 32px', background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 10, color: C.accent, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit' }}>
            Load More
          </button>
        </div>
      )}

      {loading && page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner /></div>
      )}

      {/* Add to Library Modal */}
      <Modal open={!!addModal} onClose={() => setAddModal(null)}
        title={`Add "${addModal?.title.english || addModal?.title.romaji}" to Library`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Status</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(addModal?.type === 'MANGA'
                ? ['reading', 'plan_to_read', 'completed', 'on_hold', 'dropped'] as WatchStatus[]
                : ['watching', 'plan_to_watch', 'completed', 'on_hold', 'dropped'] as WatchStatus[]
              ).map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: 600, border: '1px solid',
                    background: status === s ? C.accent : 'transparent',
                    borderColor: status === s ? C.accent : C.border,
                    color: status === s ? '#fff' : C.muted }}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleAdd} disabled={saving}
            style={{ padding: '10px 0', background: C.accent, border: 'none', borderRadius: 10,
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
            {saving ? 'Saving…' : 'Add to Library'}
          </button>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 20px',
          fontSize: 13, fontWeight: 600, color: C.text, zIndex: 2000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
