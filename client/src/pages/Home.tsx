import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHomeData } from '../api/anilist';
import { addToLibrary } from '../api/backend';
import { useAuth } from '../context/AuthContext';
import { AnimeCard, SkeletonCard, SectionHeader, HScroll, Modal, SpotlightHero } from '../components/ui';
import { C, STATUS_LABELS } from '../constants/colors';
import type { AniListMedia, WatchStatus } from '../types';



export default function Home() {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const [data,    setData]    = useState<Awaited<ReturnType<typeof fetchHomeData>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState<AniListMedia | null>(null);
  const [status,  setStatus]  = useState<WatchStatus>('plan_to_watch');
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');

  useEffect(() => {
    fetchHomeData().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
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

  const openAdd = (m: AniListMedia) => {
    setStatus(m.type === 'MANGA' ? 'plan_to_read' : 'plan_to_watch');
    setAddModal(m);
  };

  const spotlightItems = data?.trending.media || [];

  return (
    <div style={{ maxWidth: 1200 }}>

      {/* Hero */}
      {loading ? (
        <div style={{
          height: 380,
          borderRadius: 24,
          marginBottom: 36,
          background: `linear-gradient(90deg, ${C.bg2} 0%, ${C.card} 50%, ${C.bg2} 100%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          border: `1px solid ${C.border}`,
        }} />
      ) : spotlightItems.length > 0 ? (
        <SpotlightHero items={spotlightItems} onAdd={openAdd} />
      ) : null}

      {/* Trending */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="🔥 Trending Now" subtitle="What everyone's watching"
          onViewAll={() => navigate('/search?type=ANIME&sort=TRENDING_DESC')} />
        <HScroll>
          {loading
            ? Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : data?.trending.media.map((m) => <AnimeCard key={m.id} media={m} onAdd={openAdd} />)}
        </HScroll>
      </section>

      {/* Top Rated */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="🏆 Top Rated Anime" subtitle="Greatest of all time"
          onViewAll={() => navigate('/search?type=ANIME&sort=SCORE_DESC')} />
        <HScroll>
          {loading
            ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : data?.topRated.media.map((m) => <AnimeCard key={m.id} media={m} onAdd={openAdd} />)}
        </HScroll>
      </section>

      {/* Manga / Manhwa */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="📖 Popular Manga & Manhwa"
          onViewAll={() => navigate('/search?type=MANGA&sort=POPULARITY_DESC')} />
        <HScroll>
          {loading
            ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} h={200} />)
            : data?.popularManga.media.map((m) => <AnimeCard key={m.id} media={m} h={200} onAdd={openAdd} />)}
        </HScroll>
      </section>

      {/* Upcoming */}
      <section style={{ marginBottom: 8 }}>
        <SectionHeader title="📅 Upcoming Anime" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12 }}>
          {loading
            ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} w={200} h={110} />)
            : data?.upcoming.media.map((m) => (
              <div key={m.id} onClick={() => navigate(`/anime/${m.id}`)}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
                  padding: 14, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
                  transition: 'border-color 0.15s' }}>
                <img src={m.coverImage.large} alt="" style={{ width: 52, height: 70, borderRadius: 8, objectFit: 'cover' }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
                    {m.title.english || m.title.romaji}
                  </p>
                  <p style={{ fontSize: 11, color: C.accent, margin: 0 }}>Coming Soon</p>
                </div>
              </div>
            ))}
        </div>
      </section>

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
