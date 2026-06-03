import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMediaDetail } from '../api/anilist';
import { addToLibrary, getLibrary, getReviews, createReview, updateEntry } from '../api/backend';
import { useAuth } from '../context/AuthContext';
import { AnimeCard, Modal, StarRating, Spinner } from '../components/ui';
import { C, STATUS_LABELS, btnPrimaryStyle } from '../constants/colors';
import type { AniListMedia, WatchStatus, MediaEntry, Review } from '../types';

const STATUSES: WatchStatus[] = ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'];

const STREAM_LINKS: Record<string, string> = {
  Crunchyroll: 'https://crunchyroll.com/search?q=',
  'Muse Asia': 'https://youtube.com/@MuseAsia',
};

export default function AnimeDetail() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [media,   setMedia]   = useState<AniListMedia | null>(null);
  const [entry,   setEntry]   = useState<MediaEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [status,  setStatus]  = useState<WatchStatus>('plan_to_watch');
  const [score,   setScore]   = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState<'overview'|'characters'|'staff'|'reviews'>('overview');

  // Reviews state — BUG FIX: tab existed but state + fetch were missing,
  // causing the reviews tab to always render blank.
  const [reviews,        setReviews]        = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewModal,    setReviewModal]    = useState(false);
  const [revTitle,       setRevTitle]       = useState('');
  const [revBody,        setRevBody]        = useState('');
  const [revRating,      setRevRating]      = useState(0);
  const [revSaving,      setRevSaving]      = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchMediaDetail(Number(id), 'ANIME')
      .then(({ Media }) => setMedia(Media))
      .catch(console.error)
      .finally(() => setLoading(false));

    if (user) {
      getLibrary().then((entries) => {
        const found = entries.find((e) => e.mediaId === Number(id));
        if (found) { setEntry(found); setStatus(found.status); setScore(found.score); }
      }).catch(() => {});
    }
  }, [id, user]);

  // BUG FIX: fetch reviews whenever the reviews tab is opened.
  // Previously the tab had no render block at all — clicking it showed nothing.
  useEffect(() => {
    if (tab !== 'reviews' || !id) return;
    setReviewsLoading(true);
    getReviews({ mediaId: Number(id), mediaType: 'anime' })
      .then((d: any) => setReviews(d.reviews || []))
      .catch(console.error)
      .finally(() => setReviewsLoading(false));
  }, [tab, id]);

  const handleSubmitReview = async () => {
    if (!user) { navigate('/login'); return; }
    if (!media || !revTitle.trim() || !revBody.trim() || revRating === 0) {
      alert('Please fill in all review fields and set a rating.');
      return;
    }
    setRevSaving(true);
    try {
      const newRev = await createReview({
        mediaId:    media.id,
        mediaType:  'anime',
        mediaTitle: media.title.english || media.title.romaji,
        mediaCover: media.coverImage.large,
        rating:     revRating,
        title:      revTitle,
        body:       revBody,
        spoiler:    false,
      });
      setReviews((prev) => [newRev as any, ...prev]);
      setReviewModal(false);
      setRevTitle(''); setRevBody(''); setRevRating(0);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to post review.');
    } finally {
      setRevSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user || !media) { navigate('/login'); return; }
    setSaving(true);
    try {
      if (entry) {
        const updated = await updateEntry(entry._id, {
          status,
          score,
          progress: status === 'completed' && media.episodes ? media.episodes : entry.progress,
        });
        setEntry(updated);
      } else {
        const newEntry = await addToLibrary({
          mediaId:   media.id,
          mediaType: 'anime',
          title:     media.title.english || media.title.romaji,
          coverImage: media.coverImage.large,
          status, score,
          progress: status === 'completed' && media.episodes ? media.episodes : 0,
          totalProgress: media.episodes,
          genres:   media.genres || [],
        });
        setEntry(newEntry);
      }
      setModal(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={48} /></div>;
  if (!media)  return <p style={{ color: C.muted, padding: 40 }}>Anime not found.</p>;

  const title = media.title.english || media.title.romaji;
  const score_ = media.averageScore ? (media.averageScore / 10).toFixed(1) : '—';

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Banner */}
      <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', height: isMobile ? 160 : 240, marginBottom: 24 }}>
        {media.bannerImage
          ? <img src={media.bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${C.accent}40,${C.bg2})` }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,1) 0%, transparent 60%)' }} />
      </div>

      {/* Main Info */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 24, marginBottom: 28, marginTop: isMobile ? -50 : -80, position: 'relative', zIndex: 1, alignItems: isMobile ? 'center' : 'flex-start' }}>
        <img src={media.coverImage.extraLarge || media.coverImage.large} alt={title}
          style={{ width: isMobile ? 140 : 160, height: isMobile ? 200 : 225, borderRadius: 14, objectFit: 'cover', flexShrink: 0,
            border: `3px solid ${C.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }} />

        <div style={{ flex: 1, paddingTop: isMobile ? 10 : 80, width: '100%', textAlign: isMobile ? 'center' : 'left' }}>
          <h1 style={{ fontSize: isMobile ? 22 : 24, fontWeight: 800, color: C.text, margin: '0 0 6px' }}>{title}</h1>
          {media.title.native && <p style={{ fontSize: 13, color: C.muted, margin: '0 0 12px' }}>{media.title.native}</p>}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, justifyContent: isMobile ? 'center' : 'flex-start' }}>
            {media.genres?.slice(0, 5).map((g) => (
              <span key={g} style={{ padding: '3px 10px', background: `${C.accent}20`, border: `1px solid ${C.accent}40`,
                borderRadius: 20, fontSize: 11, color: C.accentLight, cursor: 'pointer' }}
                onClick={() => navigate(`/search?type=ANIME&genre=${g}`)}>
                {g}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16, justifyContent: isMobile ? 'center' : 'flex-start' }}>
            {[
              { label: 'Score',    val: `⭐ ${score_}` },
              { label: 'Episodes', val: media.episodes ? String(media.episodes) : '—' },
              { label: 'Status',   val: media.status || '—' },
              { label: 'Studio',   val: media.studios?.nodes[0]?.name || '—' },
              { label: 'Year',     val: media.startDate?.year ? String(media.startDate.year) : '—' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: isMobile ? 'center' : 'left' }}>
                <p style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>{s.label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
            <button onClick={() => setModal(true)} style={btnPrimaryStyle}>
              {entry ? `📋 ${STATUS_LABELS[entry.status]}` : '+ Add to Library'}
            </button>
            {media.trailer?.site === 'youtube' && (
              <a href={`https://youtube.com/watch?v=${media.trailer.id}`} target="_blank" rel="noreferrer"
                style={{ ...btnPrimaryStyle, background: '#EF4444', textDecoration: 'none' }}>
                ▶ Trailer
              </a>
            )}
            {/* Watch links */}
            {Object.entries(STREAM_LINKS).map(([name, url]) => (
              <a key={name} href={`${url}${encodeURIComponent(title)}`} target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  background: `${C.success}15`,
                  border: `1px solid ${C.success}40`,
                  borderRadius: 10,
                  color: C.success,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none'
                }}>
                Watch on {name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 22 }}>
        {(['overview', 'characters', 'staff', 'reviews'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
              color: tab === t ? C.accent : C.muted,
              borderBottom: `2px solid ${tab === t ? C.accent : 'transparent'}`,
              marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div>
          {media.description && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 10px' }}>Synopsis</h3>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: 0 }}>
                {media.description.replace(/<[^>]*>/g, '')}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {(media.recommendations?.nodes?.length ?? 0) > 0 && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>You Might Also Like</h3>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
                {media.recommendations!.nodes.map((n) =>
                  n.mediaRecommendation
                    ? <AnimeCard key={n.mediaRecommendation.id} media={n.mediaRecommendation} w={130} h={185} />
                    : null
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Characters */}
      {tab === 'characters' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {media.characters?.edges.map((e, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <img src={e.node.image.medium} alt={e.node.name.full}
                style={{ width: 46, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>{e.node.name.full}</p>
                <p style={{ fontSize: 10, color: C.accent, margin: '0 0 4px' }}>{e.role}</p>
                {e.voiceActors[0] && <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>VA: {e.voiceActors[0].name.full}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Staff */}
      {tab === 'staff' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {media.staff?.edges.map((e, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <img src={e.node.image.medium} alt={e.node.name.full}
                style={{ width: 46, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>{e.node.name.full}</p>
                <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{e.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Reviews — BUG FIX: this tab existed in the type union but had NO render block.
          Clicking "reviews" showed a completely blank area. Now shows fetched reviews
          and a write-review button for logged-in users. */}
      {tab === 'reviews' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
              {reviews.length} Review{reviews.length !== 1 ? 's' : ''}
            </h3>
            {user && (
              <button onClick={() => setReviewModal(true)} style={{ ...btnPrimaryStyle, fontSize: 12, padding: '7px 14px' }}>
                ✏️ Write a Review
              </button>
            )}
          </div>

          {reviewsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📝</p>
              <p style={{ color: C.muted }}>No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map((r: any) => (
                <div key={r._id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%',
                        background: `linear-gradient(135deg,${C.accent},#06b6d4)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {r.userId?.avatar
                          ? <img src={r.userId.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : '🦊'}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: C.accent, margin: 0 }}>{r.userId?.username || 'User'}</p>
                        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: C.warning, fontWeight: 700 }}>⭐ {r.rating}/10</span>
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>{r.title}</h4>
                  <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.65, margin: 0 }}>{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Write Review Modal */}
      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title="Write a Review">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Your Rating</label>
            <StarRating value={revRating} onChange={setRevRating} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Review Title</label>
            <input value={revTitle} onChange={(e) => setRevTitle(e.target.value)} maxLength={100}
              placeholder="e.g. A masterpiece of storytelling"
              style={{ width: '100%', padding: '9px 12px', background: C.bg2, border: `1px solid ${C.border}`,
                borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Review Body</label>
            <textarea value={revBody} onChange={(e) => setRevBody(e.target.value)} rows={5} maxLength={2000}
              placeholder="Share your thoughts..."
              style={{ width: '100%', padding: '9px 12px', background: C.bg2, border: `1px solid ${C.border}`,
                borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
          <button onClick={handleSubmitReview} disabled={revSaving}
            style={{ padding: '10px 0', background: C.accent, border: 'none', borderRadius: 10,
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: revSaving ? 'not-allowed' : 'pointer',
              opacity: revSaving ? 0.6 : 1, fontFamily: 'inherit' }}>
            {revSaving ? 'Posting…' : 'Post Review'}
          </button>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={entry ? 'Edit Library Entry' : 'Add to Library'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Status</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: 600, border: '1px solid',
                    background: status === s ? C.accent : 'transparent',
                    borderColor: status === s ? C.accent : C.border,
                    color: status === s ? '#fff' : C.muted }}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Your Score</label>
            <StarRating value={score} onChange={setScore} />
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '10px 0', background: C.accent, border: 'none', borderRadius: 10,
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
            {saving ? 'Saving…' : entry ? 'Save Changes' : 'Save to Library'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
