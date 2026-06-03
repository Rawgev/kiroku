import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMediaDetail } from '../api/anilist';
import { searchMangaDex, getMangaChapters, getMangaDexReadUrl, getMangaDexTitleUrl } from '../api/mangadex';
import { addToLibrary, getLibrary, getReviews, createReview, updateEntry } from '../api/backend';
import { useAuth } from '../context/AuthContext';
import { Modal, StarRating, Spinner } from '../components/ui';
import { C, STATUS_LABELS, btnPrimaryStyle } from '../constants/colors';
import type { AniListMedia, WatchStatus, MediaEntry, Review } from '../types';
import type { MDManga, MDChapter } from '../api/mangadex';

const STATUSES: WatchStatus[] = ['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read'];

function getMangaType(media: AniListMedia): 'manga' | 'manhwa' | 'manhua' {
  const c = media.countryOfOrigin;
  if (c === 'KR') return 'manhwa';
  if (c === 'CN') return 'manhua';
  return 'manga';
}

export default function MangaDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [media,    setMedia]    = useState<AniListMedia | null>(null);
  const [entry,    setEntry]    = useState<MediaEntry | null>(null);
  const [mdManga,  setMdManga]  = useState<MDManga | null>(null);
  const [chapters, setChapters] = useState<MDChapter[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [status,   setStatus]   = useState<WatchStatus>('plan_to_read');
  const [score,    setScore]    = useState(0);
  const [saving,   setSaving]   = useState(false);
  const [tab,      setTab]      = useState<'overview'|'chapters'|'characters'|'reviews'>('overview');

  // Reviews state
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
    fetchMediaDetail(Number(id), 'MANGA')
      .then(async ({ Media }) => {
        setMedia(Media);
        const title = Media.title.english || Media.title.romaji;
        const results = await searchMangaDex(title, 5).catch(() => null);
        if (results?.data?.length) {
          const md = results.data[0];
          setMdManga(md);
          const ch = await getMangaChapters(md.id).catch(() => null);
          if (ch?.data) setChapters(ch.data.slice(0, 30));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    if (user) {
      getLibrary().then((entries) => {
        const found = entries.find((e) => e.mediaId === Number(id));
        if (found) { setEntry(found); setStatus(found.status); setScore(found.score); }
      }).catch(() => {});
    }
  }, [id, user]);

  // Fetch reviews whenever the reviews tab is opened
  useEffect(() => {
    if (tab !== 'reviews' || !id || !media) return;
    setReviewsLoading(true);
    getReviews({ mediaId: Number(id), mediaType: getMangaType(media) })
      .then((d: any) => setReviews(d.reviews || []))
      .catch(console.error)
      .finally(() => setReviewsLoading(false));
  }, [tab, id, media]);

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
        mediaType:  getMangaType(media),
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
          progress: status === 'completed' && media.chapters ? media.chapters : entry.progress,
        });
        setEntry(updated);
      } else {
        const newEntry = await addToLibrary({
          mediaId:   media.id,
          mediaType: getMangaType(media),
          title:     media.title.english || media.title.romaji,
          coverImage: media.coverImage.large,
          status, score,
          progress: status === 'completed' && media.chapters ? media.chapters : 0,
          totalProgress: media.chapters,
          genres: media.genres || [],
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
  if (!media)  return <p style={{ color: C.muted, padding: 40 }}>Manga not found.</p>;

  const title    = media.title.english || media.title.romaji;
  const score_   = media.averageScore ? (media.averageScore / 10).toFixed(1) : '—';
  const typeLabel = getMangaType(media).charAt(0).toUpperCase() + getMangaType(media).slice(1);

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 20 : 28, marginBottom: 28, alignItems: isMobile ? 'center' : 'flex-start' }}>
        <img src={media.coverImage.large} alt={title}
          style={{ width: 180, height: 255, borderRadius: 14, objectFit: 'cover', flexShrink: 0,
            border: `2px solid ${C.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />

        <div style={{ flex: 1, width: '100%', textAlign: isMobile ? 'center' : 'left' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start' }}>
            <span style={{ padding: '3px 10px', background: `${C.success}20`, border: `1px solid ${C.success}40`,
              borderRadius: 20, fontSize: 11, color: C.success }}>
              {typeLabel}
            </span>
            {media.genres?.slice(0, 4).map((g) => (
              <span key={g} style={{ padding: '3px 10px', background: `${C.accent}15`, border: `1px solid ${C.accent}30`,
                borderRadius: 20, fontSize: 11, color: C.accentLight }}>{g}</span>
            ))}
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 24, fontWeight: 800, color: C.text, margin: '0 0 6px' }}>{title}</h1>
          {media.title.native && <p style={{ fontSize: 13, color: C.muted, margin: '0 0 14px' }}>{media.title.native}</p>}

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 18, justifyContent: isMobile ? 'center' : 'flex-start' }}>
            {[
              { label: 'Score',    val: `⭐ ${score_}` },
              { label: 'Chapters', val: media.chapters ? String(media.chapters) : '—' },
              { label: 'Volumes',  val: media.volumes  ? String(media.volumes)  : '—' },
              { label: 'Status',   val: media.status || '—' },
              { label: 'Year',     val: media.startDate?.year ? String(media.startDate.year) : '—' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: isMobile ? 'center' : 'left' }}>
                <p style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>{s.label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{s.val}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
            <button onClick={() => setModal(true)} style={btnPrimaryStyle}>
              {entry ? `📋 ${STATUS_LABELS[entry.status]}` : '+ Add to Library'}
            </button>
            {mdManga && (
              <a href={getMangaDexTitleUrl(mdManga.id)} target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  background: `${C.info}15`,
                  border: `1px solid ${C.info}40`,
                  borderRadius: 10,
                  color: '#60a5fa',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none'
                }}>
                📖 Read on MangaDex
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 22 }}>
        {(['overview', 'chapters', 'characters', 'reviews'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
              color: tab === t ? C.accent : C.muted,
              borderBottom: `2px solid ${tab === t ? C.accent : 'transparent'}`, marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: 0 }}>
            {media.description?.replace(/<[^>]*>/g, '') || 'No description available.'}
          </p>
        </div>
      )}

      {tab === 'chapters' && (
        <div>
          {chapters.length === 0
            ? <p style={{ color: C.muted }}>No chapters found on MangaDex. Try searching directly.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {chapters.map((ch) => (
                  <a key={ch.id} href={getMangaDexReadUrl(ch.id)} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
                      padding: '11px 16px', textDecoration: 'none',
                      transition: 'border-color 0.15s' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.accent, minWidth: 80 }}>
                        Chapter {ch.attributes.chapter || '—'}
                      </span>
                      <span style={{ fontSize: 12, color: C.text }}>
                        {ch.attributes.title || 'No title'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: C.muted }}>{ch.attributes.pages} pages</span>
                      <span style={{ fontSize: 11, color: C.success }}>Read →</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
        </div>
      )}

      {tab === 'characters' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {media.characters?.edges.map((e, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <img src={e.node.image.medium} alt={e.node.name.full}
                style={{ width: 46, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>{e.node.name.full}</p>
                <p style={{ fontSize: 10, color: C.accent, margin: 0 }}>{e.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Score</label>
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
