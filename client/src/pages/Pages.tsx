// ─────────────────────────────────────────────────────────────────────────────
// Profile Page
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicProfile, getUserLibrary, getReviews, updateProfile } from '../api/backend';
import { useAuth } from '../context/AuthContext';
import { ConfirmDeleteModal, StatusBadge, Modal, Spinner } from '../components/ui';
import { C, inputStyle, btnPrimaryStyle } from '../constants/colors';
import type { User, MediaEntry, Review } from '../types';

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [entries, setEntries] = useState<MediaEntry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats_, setStats_] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<'library' | 'reviews' | 'favorites'>('library');
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  // Review editing states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editRating, setEditRating] = useState(10);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [deleteReviewSaving, setDeleteReviewSaving] = useState(false);
  // Floating emojis and reaction handlers
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; char: string; x: number; y: number; reviewId: string }[]>([]);

  const spawnEmoji = (char: string, reviewId: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newEmoji = { id: Date.now() + Math.random(), char, x, y, reviewId };
    setFloatingEmojis((prev) => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
    }, 1000);
  };

  const handleVote = async (id: string, direction: 'up' | 'down') => {
    if (!me) { navigate('/login'); return; }
    const { voteReview } = await import('../api/backend');
    const updated = await voteReview(id, direction).catch(() => null);
    if (updated) {
      setReviews((prev) => prev.map((r) => r._id === id ? {
        ...r,
        upvotes: updated.upvotes,
        downvotes: updated.downvotes,
        score: updated.score,
        likesCount: updated.likesCount
      } : r));
    }
  };

  const handleReact = async (id: string, emoji: 'heart' | 'fire' | 'zany') => {
    if (!me) { navigate('/login'); return; }
    const { reactReview } = await import('../api/backend');
    const updated = await reactReview(id, emoji).catch(() => null);
    if (updated) {
      setReviews((prev) => prev.map((r) => r._id === id ? {
        ...r,
        reactionHeart: updated.reactionHeart,
        reactionFire: updated.reactionFire,
        reactionZany: updated.reactionZany
      } : r));
    }
  };

  const handleDeleteReview = (id: string) => {
    setDeletingReviewId(id);
  };

  const handleConfirmDeleteReview = async () => {
    if (!deletingReviewId) return;
    setDeleteReviewSaving(true);
    try {
      const { deleteReview } = await import('../api/backend');
      await deleteReview(deletingReviewId);
      setReviews((prev) => prev.filter((r) => r._id !== deletingReviewId));
      setDeletingReviewId(null);
    } catch {
      alert('Failed to delete review.');
    } finally {
      setDeleteReviewSaving(false);
    }
  };

  const isOwn = me?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);

    // BUG FIX: Previously this Promise.all had two wasted/broken calls:
    //   1. getUserLibrary('') → hits /api/library/user/ with empty string → 400 Bad Request
    //      (Mongoose rejects '' as an invalid ObjectId)
    //   2. getReviews({ userId: undefined }) → fetches ALL reviews in the DB, no filter applied.
    //      The results were immediately discarded anyway (only [profileData] destructured).
    //
    // Fix: fetch only the profile first, then use the real userId from the response
    // to make the library + review fetches in parallel.
    getPublicProfile(username)
      .then(async (profileData) => {
        setProfile(profileData.user);
        setStats_(profileData.stats || {});
        setBio(profileData.user.bio || '');

        // Now we have the real _id — fetch library and reviews in parallel
        const [entries_, rev_] = await Promise.all([
          getUserLibrary(profileData.user._id).catch(() => []),
          getReviews({ userId: profileData.user._id }).catch(() => ({ reviews: [] })),
        ]);
        setEntries(entries_);
        setReviews((rev_ as any).reviews || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);


  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({ bio });
      setProfile((p) => p ? { ...p, bio: updated.bio } : p);
      setEditOpen(false);
    } catch { alert('Failed to update.'); }
    finally { setSaving(false); }
  };

  const openEditModal = (r: Review) => {
    setSelectedReview(r);
    setEditTitle(r.title);
    setEditBody(r.body);
    setEditRating(r.rating);
    setEditModalOpen(true);
  };

  const handleUpdateReview = async () => {
    if (!selectedReview) return;
    if (!editTitle.trim() || !editBody.trim()) {
      alert('Please fill in all review fields.');
      return;
    }
    setEditSaving(true);
    try {
      const { updateReview } = await import('../api/backend');
      const updated = await updateReview(selectedReview._id, {
        title: editTitle,
        body: editBody,
        rating: Number(editRating),
      });
      if (updated) {
        setReviews((prev) => prev.map((r) => r._id === selectedReview._id ? { ...r, title: editTitle, body: editBody, rating: Number(editRating) } : r));
        setEditModalOpen(false);
        setSelectedReview(null);
      }
    } catch (e) {
      alert('Failed to update review.');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={44} /></div>;
  if (!profile) return <p style={{ color: C.muted, padding: 40 }}>User not found.</p>;

  const favorites = entries.filter((e) => e.isFavorite);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
      {/* Banner */}
      <div style={{
        height: 160, borderRadius: 18, marginBottom: 0, overflow: 'hidden',
        background: `linear-gradient(135deg, ${C.accent}40, #06b6d440)`
      }} />

      {/* Profile header */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginTop: -40, marginBottom: 24, paddingLeft: 24 }}>
        <div style={{
          width: 90, height: 90, borderRadius: '50%', flexShrink: 0,
          background: profile.avatar ? undefined : `linear-gradient(135deg,${C.accent},#06b6d4)`,
          border: `4px solid ${C.bg}`, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36
        }}>
          {profile.avatar ? <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🦊'}
        </div>
        <div style={{ flex: 1, paddingBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 4px' }}>{profile.username}</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{profile.bio || 'No bio yet.'}</p>
        </div>
        {isOwn && (
          <button onClick={() => setEditOpen(true)}
            style={{ ...btnPrimaryStyle, padding: '8px 16px', fontSize: 12 }}>
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {/* Stat chips */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Titles Tracked', val: stats_?.entriesCount || entries.length },
          { label: 'Reviews', val: stats_?.reviewsCount || reviews.length },
          { label: 'Favorites', val: stats_?.favoritesCount || favorites.length },
          { label: 'Level', val: profile.level },
        ].map((s) => (
          <div key={s.label} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: '10px 18px', textAlign: 'center'
          }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: C.accent, margin: 0 }}>{s.val}</p>
            <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {(['library', 'reviews', 'favorites'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
              color: tab === t ? C.accent : C.muted,
              borderBottom: `2px solid ${tab === t ? C.accent : 'transparent'}`, marginBottom: -1
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'library' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.slice(0, 20).map((e) => (
            <div key={e._id} onClick={() => navigate(`/${e.mediaType === 'anime' ? 'anime' : 'manga'}/${e.mediaId}`)}
              style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 11,
                padding: 12, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer'
              }}>
              <img src={e.coverImage} alt={e.title} style={{ width: 42, height: 58, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>{e.title}</p>
                <StatusBadge status={e.status} />
              </div>
              {e.score > 0 && <span style={{ fontSize: 13, color: C.warning }}>⭐ {e.score}</span>}
            </div>
          ))}
          {entries.length === 0 && <p style={{ color: C.muted }}>No entries yet.</p>}
        </div>
      )}

      {tab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
          <style>{`
            @keyframes floatUpProfile {
              0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              100% { transform: translate(-50%, -80px) scale(1.5); opacity: 0; }
            }
          `}</style>
          {reviews.map((r) => (
            <div key={r._id} style={{ position: 'relative', background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
              {/* Floating emojis inside this review */}
              {floatingEmojis.filter((fe) => fe.reviewId === r._id).map((fe) => (
                <span key={fe.id} style={{
                  position: 'absolute', left: fe.x, top: fe.y,
                  fontSize: 24, pointerEvents: 'none',
                  animation: 'floatUpProfile 0.8s forwards ease-out', zIndex: 10
                }}>{fe.char}</span>
              ))}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.mediaTitle}</span>
                  <span style={{ fontSize: 13, color: C.warning, fontWeight: 700 }}>⭐ {r.rating}/10</span>
                </div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.accentLight, margin: '0 0 6px' }}>{r.title}</h4>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, margin: '0 0 16px' }}>{r.body.slice(0, 200)}…</p>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
                  {/* Reddit-style Vote Pill */}
                  {(() => {
                    const isUp = me && r.upvotes?.includes(me._id);
                    const isDown = me && r.downvotes?.includes(me._id);
                    return (
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          height: 30,
                          background: isUp ? 'rgba(255, 69, 0, 0.08)' : (isDown ? 'rgba(90, 115, 243, 0.08)' : 'rgba(255,255,255,0.03)'),
                          border: `1px solid ${isUp ? '#FF4500' : (isDown ? '#5A73F3' : C.border)}`,
                          borderRadius: 20,
                          padding: '0 8px',
                          gap: 6,
                          boxSizing: 'border-box',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isUp && !isDown) {
                            e.currentTarget.style.borderColor = C.accent;
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isUp && !isDown) {
                            e.currentTarget.style.borderColor = C.border;
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          }
                        }}
                      >
                        <button 
                          onClick={() => handleVote(r._id, 'up')}
                          style={{
                            background: 'none', border: 'none', color: isUp ? '#FF4500' : C.muted,
                            fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '2px 4px', transition: 'all 0.15s', outline: 'none'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.2)';
                            if (!isUp) e.currentTarget.style.color = '#FF4500';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            if (!isUp) e.currentTarget.style.color = C.muted;
                          }}
                        >
                          ▲
                        </button>
                        <span style={{ 
                          fontSize: 12, fontWeight: 800, minWidth: 16, textAlign: 'center',
                          color: isUp ? '#FF4500' : (isDown ? '#5A73F3' : C.text)
                        }}>
                          {r.score ?? 0}
                        </span>
                        <button 
                          onClick={() => handleVote(r._id, 'down')}
                          style={{
                            background: 'none', border: 'none', color: isDown ? '#5A73F3' : C.muted,
                            fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '2px 4px', transition: 'all 0.15s', outline: 'none'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.2)';
                            if (!isDown) e.currentTarget.style.color = '#5A73F3';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            if (!isDown) e.currentTarget.style.color = C.muted;
                          }}
                        >
                          ▼
                        </button>
                      </div>
                    );
                  })()}

                  {/* Emoji Reaction buttons */}
                  {[
                    { emoji: '❤️', type: 'heart', list: r.reactionHeart },
                    { emoji: '🔥', type: 'fire', list: r.reactionFire },
                    { emoji: '🤪', type: 'zany', list: r.reactionZany }
                  ].map(({ emoji, type, list }) => {
                    const count = list?.length || 0;
                    const hasReacted = me && list?.includes(me._id);
                    return (
                      <button key={type}
                        onClick={(e) => {
                          spawnEmoji(emoji, r._id, e);
                          handleReact(r._id, type as 'heart' | 'fire' | 'zany');
                        }}
                        style={{
                          height: 30,
                          padding: '0 12px', background: hasReacted ? `${C.accent}20` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${hasReacted ? C.accent : C.border}`,
                          borderRadius: 20, color: hasReacted ? C.accentLight : C.text, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 6, boxSizing: 'border-box', transition: 'all 0.15s'
                        }}
                        onMouseEnter={(ev) => {
                          if (!hasReacted) {
                            ev.currentTarget.style.background = `${C.accent}15`;
                            ev.currentTarget.style.borderColor = C.accent;
                          }
                        }}
                        onMouseLeave={(ev) => {
                          if (!hasReacted) {
                            ev.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            ev.currentTarget.style.borderColor = C.border;
                          }
                        }}>
                        {emoji} {count}
                      </button>
                    );
                  })}

                  {isOwn && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <button onClick={() => openEditModal(r)}
                        style={{
                          padding: '4px 12px', background: 'rgba(255, 255, 255, 0.05)', border: `1px solid ${C.border}`,
                          borderRadius: 7, color: C.accentLight, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit'
                        }}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDeleteReview(r._id)}
                        style={{
                          padding: '4px 12px', background: `${C.danger}15`, border: `1px solid ${C.danger}40`,
                          borderRadius: 7, color: C.danger, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
                        }}>
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && <p style={{ color: C.muted }}>No reviews yet.</p>}
        </div>
      )}

      {tab === 'favorites' && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {favorites.map((e) => (
            <div key={e._id} onClick={() => navigate(`/${e.mediaType === 'anime' ? 'anime' : 'manga'}/${e.mediaId}`)}
              style={{ cursor: 'pointer', width: 120 }}>
              <img src={e.coverImage} alt={e.title}
                style={{ width: 120, height: 170, borderRadius: 10, objectFit: 'cover' }} />
              <p style={{
                fontSize: 11, color: C.text, margin: '6px 0 0',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>{e.title}</p>
            </div>
          ))}
          {favorites.length === 0 && <p style={{ color: C.muted }}>No favorites yet.</p>}
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={4}
              style={{ ...inputStyle, resize: 'vertical', padding: '10px 14px' }} />
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{
              padding: '10px 0', background: C.accent, border: 'none', borderRadius: 10,
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1, fontFamily: 'inherit'
            }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* Edit Review Modal */}
      <Modal open={editModalOpen} onClose={() => { setEditModalOpen(false); setSelectedReview(null); }} title="Edit Review">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Rating (1-10)</label>
            <select value={editRating} onChange={(e) => setEditRating(Number(e.target.value))}
              style={{ width: '100%', padding: '9px 12px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
              {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => (
                <option key={n} value={n}>{n} / 10</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Review Title</label>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Summary..."
              style={{ width: '100%', padding: '9px 12px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Review</label>
            <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} placeholder="Thoughts..." rows={5}
              style={{ width: '100%', padding: '9px 12px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
          <button onClick={handleUpdateReview} disabled={editSaving}
            style={{ padding: '10px 0', background: C.accent, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: editSaving ? 'not-allowed' : 'pointer', opacity: editSaving ? 0.6 : 1, fontFamily: 'inherit' }}>
            {editSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <ConfirmDeleteModal
        open={!!deletingReviewId}
        title="Delete Review?"
        message="Are you sure you want to delete this review?"
        detail="Your rating, title, and review text will be permanently removed."
        confirmLabel="Delete Review"
        loading={deleteReviewSaving}
        onCancel={() => setDeletingReviewId(null)}
        onConfirm={handleConfirmDeleteReview}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Community Feed Page
// ─────────────────────────────────────────────────────────────────────────────
export function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Floating emojis and reaction handlers
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; char: string; x: number; y: number; reviewId: string }[]>([]);

  const spawnEmoji = (char: string, reviewId: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newEmoji = { id: Date.now() + Math.random(), char, x, y, reviewId };
    setFloatingEmojis((prev) => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
    }, 1000);
  };

  const handleDeleteReview = (id: string) => {
    setDeletingReviewId(id);
  };

  const handleConfirmDeleteReview = async () => {
    if (!deletingReviewId) return;
    setDeleteReviewSaving(true);
    try {
      const { deleteReview } = await import('../api/backend');
      await deleteReview(deletingReviewId);
      setReviews((prev) => prev.filter((r) => r._id !== deletingReviewId));
      setDeletingReviewId(null);
    } catch {
      alert('Failed to delete review.');
    } finally {
      setDeleteReviewSaving(false);
    }
  };

  // Review editing states & filter states
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editRating, setEditRating] = useState(10);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [deleteReviewSaving, setDeleteReviewSaving] = useState(false);

  useEffect(() => {
    getReviews({ page: 1 }).then((d) => setReviews(d.reviews || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const openEditModal = (r: Review) => {
    setSelectedReview(r);
    setEditTitle(r.title);
    setEditBody(r.body);
    setEditRating(r.rating);
    setEditModalOpen(true);
  };

  const handleUpdateReview = async () => {
    if (!selectedReview) return;
    if (!editTitle.trim() || !editBody.trim()) {
      alert('Please fill in all review fields.');
      return;
    }
    setEditSaving(true);
    try {
      const { updateReview } = await import('../api/backend');
      const updated = await updateReview(selectedReview._id, {
        title: editTitle,
        body: editBody,
        rating: Number(editRating),
      });
      if (updated) {
        setReviews((prev) => prev.map((r) => r._id === selectedReview._id ? { ...r, title: editTitle, body: editBody, rating: Number(editRating) } : r));
        setEditModalOpen(false);
        setSelectedReview(null);
      }
    } catch (e) {
      alert('Failed to update review.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleVote = async (id: string, direction: 'up' | 'down') => {
    if (!user) { navigate('/login'); return; }
    const { voteReview } = await import('../api/backend');
    const updated = await voteReview(id, direction).catch(() => null);
    if (updated) {
      setReviews((prev) => prev.map((r) => r._id === id ? {
        ...r,
        upvotes: updated.upvotes,
        downvotes: updated.downvotes,
        score: updated.score,
        likesCount: updated.likesCount
      } : r));
    }
  };

  const handleReact = async (id: string, emoji: 'heart' | 'fire' | 'zany') => {
    if (!user) { navigate('/login'); return; }
    const { reactReview } = await import('../api/backend');
    const updated = await reactReview(id, emoji).catch(() => null);
    if (updated) {
      setReviews((prev) => prev.map((r) => r._id === id ? {
        ...r,
        reactionHeart: updated.reactionHeart,
        reactionFire: updated.reactionFire,
        reactionZany: updated.reactionZany
      } : r));
    }
  };

  const displayedReviews = filter === 'my' && user
    ? reviews.filter((r) => r.userId?._id === user._id || r.userId?.username === user.username)
    : reviews;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 22px' }}>💬 Community</h1>

      {/* My Reviews vs All Reviews filter toggle */}
      {user && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button onClick={() => setFilter('all')}
            style={{
              padding: '6px 14px', borderRadius: 10, border: '1px solid',
              borderColor: filter === 'all' ? C.accent : C.border,
              background: filter === 'all' ? C.accent : 'rgba(255,255,255,0.03)',
              color: filter === 'all' ? '#FFF' : C.muted, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
            }}>
            All Reviews
          </button>
          <button onClick={() => setFilter('my')}
            style={{
              padding: '6px 14px', borderRadius: 10, border: '1px solid',
              borderColor: filter === 'my' ? C.accent : C.border,
              background: filter === 'my' ? C.accent : 'rgba(255,255,255,0.03)',
              color: filter === 'my' ? '#FFF' : C.muted, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
            }}>
            My Reviews
          </button>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
          <style>{`
            @keyframes floatUpComm {
              0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              100% { transform: translate(-50%, -80px) scale(1.5); opacity: 0; }
            }
          `}</style>
          {displayedReviews.map((r) => {
            const isOwnReview = user && (r.userId?._id === user._id || r.userId?.username === user.username);
            return (
              <div key={r._id} style={{ position: 'relative', background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                {/* Floating emojis inside this review */}
                {floatingEmojis.filter((fe) => fe.reviewId === r._id).map((fe) => (
                  <span key={fe.id} style={{
                    position: 'absolute', left: fe.x, top: fe.y,
                    fontSize: 24, pointerEvents: 'none',
                    animation: 'floatUpComm 0.8s forwards ease-out', zIndex: 10
                  }}>{fe.char}</span>
                ))}

                <div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: `linear-gradient(135deg,${C.accent},#06b6d4)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0
                    }}>
                      {r.userId?.avatar
                        ? <img src={r.userId.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : '🦊'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{r.userId?.username || 'User'}</span>
                      <span style={{ fontSize: 12, color: C.muted }}> reviewed </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.mediaTitle}</span>
                    </div>
                    <span style={{ fontSize: 13, color: C.warning, fontWeight: 700 }}>⭐ {r.rating}/10</span>
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>{r.title}</h4>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, margin: '0 0 16px' }}>
                    {r.body.slice(0, 280)}{r.body.length > 280 ? '…' : ''}
                  </p>
                  
                  {/* Reactions row and Admin buttons */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
                    {/* Reddit-style Vote Pill */}
                    {(() => {
                      const isUp = user && r.upvotes?.includes(user._id);
                      const isDown = user && r.downvotes?.includes(user._id);
                      return (
                        <div 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: 30,
                            background: isUp ? 'rgba(255, 69, 0, 0.08)' : (isDown ? 'rgba(90, 115, 243, 0.08)' : 'rgba(255,255,255,0.03)'),
                            border: `1px solid ${isUp ? '#FF4500' : (isDown ? '#5A73F3' : C.border)}`,
                            borderRadius: 20,
                            padding: '0 8px',
                            gap: 6,
                            boxSizing: 'border-box',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            if (!isUp && !isDown) {
                              e.currentTarget.style.borderColor = C.accent;
                              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isUp && !isDown) {
                              e.currentTarget.style.borderColor = C.border;
                              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            }
                          }}
                        >
                          <button 
                            onClick={() => handleVote(r._id, 'up')}
                            style={{
                              background: 'none', border: 'none', color: isUp ? '#FF4500' : C.muted,
                              fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: '2px 4px', transition: 'all 0.15s', outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.2)';
                              if (!isUp) e.currentTarget.style.color = '#FF4500';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              if (!isUp) e.currentTarget.style.color = C.muted;
                            }}
                          >
                            ▲
                          </button>
                          <span style={{ 
                            fontSize: 12, fontWeight: 800, minWidth: 16, textAlign: 'center',
                            color: isUp ? '#FF4500' : (isDown ? '#5A73F3' : C.text)
                          }}>
                            {r.score ?? 0}
                          </span>
                          <button 
                            onClick={() => handleVote(r._id, 'down')}
                            style={{
                              background: 'none', border: 'none', color: isDown ? '#5A73F3' : C.muted,
                              fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: '2px 4px', transition: 'all 0.15s', outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.2)';
                              if (!isDown) e.currentTarget.style.color = '#5A73F3';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              if (!isDown) e.currentTarget.style.color = C.muted;
                            }}
                          >
                            ▼
                          </button>
                        </div>
                      );
                    })()}

                    {/* Emoji Reaction buttons */}
                    {[
                      { emoji: '❤️', type: 'heart', list: r.reactionHeart },
                      { emoji: '🔥', type: 'fire', list: r.reactionFire },
                      { emoji: '🤪', type: 'zany', list: r.reactionZany }
                    ].map(({ emoji, type, list }) => {
                      const count = list?.length || 0;
                      const hasReacted = user && list?.includes(user._id);
                      return (
                        <button key={type}
                          onClick={(e) => {
                            spawnEmoji(emoji, r._id, e);
                            handleReact(r._id, type as 'heart' | 'fire' | 'zany');
                          }}
                          style={{
                            height: 30,
                            padding: '0 12px', background: hasReacted ? `${C.accent}20` : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${hasReacted ? C.accent : C.border}`,
                            borderRadius: 20, color: hasReacted ? C.accentLight : C.text, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 6, boxSizing: 'border-box', transition: 'all 0.15s'
                          }}
                          onMouseEnter={(ev) => {
                            if (!hasReacted) {
                              ev.currentTarget.style.background = `${C.accent}15`;
                              ev.currentTarget.style.borderColor = C.accent;
                            }
                          }}
                          onMouseLeave={(ev) => {
                            if (!hasReacted) {
                              ev.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                              ev.currentTarget.style.borderColor = C.border;
                            }
                          }}>
                          {emoji} {count}
                        </button>
                      );
                    })}

                    {isOwnReview && (
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        <button onClick={() => openEditModal(r)}
                          style={{
                            padding: '5px 12px', background: 'rgba(255, 255, 255, 0.05)', border: `1px solid ${C.border}`,
                            borderRadius: 7, color: C.accentLight, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit'
                          }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDeleteReview(r._id)}
                          style={{
                            padding: '5px 12px', background: `${C.danger}15`, border: `1px solid ${C.danger}40`,
                            borderRadius: 7, color: C.danger, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
                          }}>
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {displayedReviews.length === 0 && <p style={{ color: C.muted }}>No reviews found.</p>}
        </div>
      )}

      {/* Edit Review Modal */}
      <Modal open={editModalOpen} onClose={() => { setEditModalOpen(false); setSelectedReview(null); }} title="Edit Review">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Rating (1-10)</label>
            <select value={editRating} onChange={(e) => setEditRating(Number(e.target.value))}
              style={{ width: '100%', padding: '9px 12px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
              {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => (
                <option key={n} value={n}>{n} / 10</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Title</label>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Summary..."
              style={{ width: '100%', padding: '9px 12px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Body</label>
            <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} placeholder="Thoughts..." rows={5}
              style={{ width: '100%', padding: '9px 12px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
          <button onClick={handleUpdateReview} disabled={editSaving}
            style={{ padding: '10px 0', background: C.accent, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: editSaving ? 'not-allowed' : 'pointer', opacity: editSaving ? 0.6 : 1, fontFamily: 'inherit' }}>
            {editSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <ConfirmDeleteModal
        open={!!deletingReviewId}
        title="Delete Review?"
        message="Are you sure you want to delete this review?"
        detail="Your rating, title, and review text will be permanently removed."
        confirmLabel="Delete Review"
        loading={deleteReviewSaving}
        onCancel={() => setDeletingReviewId(null)}
        onConfirm={handleConfirmDeleteReview}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Watch Party Page
// ─────────────────────────────────────────────────────────────────────────────
import { getWatchParties, createWatchParty, updateWatchPartyItem, deleteWatchParty } from '../api/backend';
import type { WatchParty } from '../types';

export function WatchPartyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parties, setParties] = useState<WatchParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [season, setSeason] = useState('Spring 2026');
  const [saving, setSaving] = useState(false);
  const [deletingPartyId, setDeletingPartyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getWatchParties().then(setParties).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const p = await createWatchParty({ name, season });
      setParties((prev) => [p, ...prev]);
      setModal(false); setName('');
    } catch { alert('Failed.'); }
    finally { setSaving(false); }
  };

  const handleEp = async (partyId: string, itemId: string, delta: number, currentEp: number) => {
    const updated = await updateWatchPartyItem(partyId, itemId, { currentEp: Math.max(0, currentEp + delta) }).catch(() => null);
    if (updated) setParties((prev) => prev.map((p) => p._id === partyId ? updated : p));
  };

  const handleDelete = (id: string) => {
    setDeletingPartyId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPartyId) return;
    await deleteWatchParty(deletingPartyId).catch(() => { });
    setParties((prev) => prev.filter((p) => p._id !== deletingPartyId));
    setDeletingPartyId(null);
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>📅 Watch Parties</h1>
        <button onClick={() => setModal(true)} style={{ ...btnPrimaryStyle }}>+ New Watch Party</button>
      </div>

      {loading ? <Spinner /> : parties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📅</p>
          <p style={{ color: C.muted }}>No watch parties yet. Create one to track seasonal anime!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {parties.map((p) => (
            <div key={p._id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{p.name}</h3>
                  <p style={{ fontSize: 12, color: C.accent, margin: '3px 0 0' }}>{p.season}</p>
                </div>
                <button onClick={() => handleDelete(p._id)}
                  style={{
                    padding: '5px 10px', background: `${C.danger}15`, border: `1px solid ${C.danger}40`,
                    borderRadius: 7, color: C.danger, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit'
                  }}>
                  Delete
                </button>
              </div>
              {p.items.length === 0 ? (
                <p style={{ fontSize: 12, color: C.muted }}>No anime in this watch party yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.items.map((item) => (
                    <div key={item._id} style={{
                      display: 'flex', gap: 12, alignItems: 'center',
                      background: C.bg2, borderRadius: 10, padding: '10px 14px'
                    }}>
                      {item.coverImage && (
                        <img src={item.coverImage} alt={item.title}
                          style={{ width: 38, height: 52, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>{item.title}</p>
                        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                          Ep {item.currentEp}{item.totalEps ? `/${item.totalEps}` : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button onClick={() => handleEp(p._id, item._id, -1, item.currentEp)}
                          style={{
                            width: 28, height: 28, borderRadius: 7, background: C.bg, border: `1px solid ${C.border}`,
                            color: C.text, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit'
                          }}>−</button>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 28, textAlign: 'center' }}>
                          {item.currentEp}
                        </span>
                        <button onClick={() => handleEp(p._id, item._id, 1, item.currentEp)}
                          style={{
                            width: 28, height: 28, borderRadius: 7, background: C.accent, border: 'none',
                            color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit'
                          }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Watch Party">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring 2026 Watchlist"
              style={{ ...inputStyle }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Season</label>
            <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="Spring 2026"
              style={{ ...inputStyle }} />
          </div>
          <button onClick={handleCreate} disabled={saving}
            style={{
              padding: '10px 0', background: C.accent, border: 'none', borderRadius: 10,
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1, fontFamily: 'inherit'
            }}>
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal open={!!deletingPartyId} onClose={() => setDeletingPartyId(null)} title="Delete Watch Party?" width={360}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to delete this watch party? All seasonal tracking entries inside it will be lost.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setDeletingPartyId(null)}
              style={{
                padding: '8px 16px', background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 9, color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>
              Cancel
            </button>
            <button onClick={handleConfirmDelete}
              style={{
                padding: '8px 16px', background: C.danger, border: 'none',
                borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Login Page
// ─────────────────────────────────────────────────────────────────────────────
export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await login(email, password); navigate('/'); }
    catch (err: any) { setError(err?.response?.data?.message || 'Login failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.bg
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⛩️</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>
            Kiroku<span style={{ color: C.accent }}>Vault</span>
          </h1>
          <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 0' }}>Welcome back, Senpai</p>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{
                padding: '10px 14px', background: `${C.danger}15`, border: `1px solid ${C.danger}30`,
                borderRadius: 9, fontSize: 13, color: C.danger
              }}>{error}</div>
            )}
            <div>
              <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                style={{ ...inputStyle }} placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                style={{ ...inputStyle }} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              style={{ ...btnPrimaryStyle, padding: '11px 0', fontSize: 14, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="/api/auth/google"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '10px 0', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10,
                color: C.text, fontSize: 13, fontWeight: 600, textDecoration: 'none'
              }}>
              🔴 Continue with Google
            </a>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 18, marginBottom: 0 }}>
            No account?{' '}
            <span onClick={() => navigate('/register')}
              style={{ color: C.accent, cursor: 'pointer', fontWeight: 600 }}>Sign up free</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Register Page
// ─────────────────────────────────────────────────────────────────────────────
export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await register(username, email, password); navigate('/'); }
    catch (err: any) { setError(err?.response?.data?.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⛩️</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0 }}>
            Join Kiroku<span style={{ color: C.accent }}>Vault</span>
          </h1>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{
                padding: '10px 14px', background: `${C.danger}15`, border: `1px solid ${C.danger}30`,
                borderRadius: 9, fontSize: 13, color: C.danger
              }}>{error}</div>
            )}
            {[
              { label: 'Username', val: username, set: setUsername, type: 'text', ph: 'KirokuUser' },
              { label: 'Email', val: email, set: setEmail, type: 'email', ph: 'you@example.com' },
              { label: 'Password', val: password, set: setPassword, type: 'password', ph: '6+ characters' },
            ].map((f) => (
              <div key={f.label}>
                <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)} required
                  placeholder={f.ph} style={{ ...inputStyle }} />
              </div>
            ))}
            <button type="submit" disabled={loading}
              style={{ ...btnPrimaryStyle, padding: '11px 0', fontSize: 14, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="/api/auth/google" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '10px 0', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10,
              color: C.text, fontSize: 13, fontWeight: 600, textDecoration: 'none'
            }}>
              🔴 Continue with Google
            </a>
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 18, marginBottom: 0 }}>
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} style={{ color: C.accent, cursor: 'pointer', fontWeight: 600 }}>Sign in</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OAuth Callback — reads token from URL, stores it, redirects to /
// ─────────────────────────────────────────────────────────────────────────────
export function OAuthCallback() {
  const { setTokenFromOAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setTokenFromOAuth(token).then(() => navigate('/')).catch(() => navigate('/login?error=oauth_failed'));
    } else {
      navigate('/login?error=no_token');
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner size={48} />
        <p style={{ color: C.muted, marginTop: 16 }}>Signing you in…</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Dashboard
// ─────────────────────────────────────────────────────────────────────────────
import { adminGetUsers, adminGetReviews, adminDeleteUser, adminSetRole } from '../api/backend';

export function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setAdminRev] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'users' | 'reviews'>('users');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/'); return; }
    Promise.all([adminGetUsers(), adminGetReviews()])
      .then(([u, r]) => { setUsers(u.users || []); setAdminRev(r.reviews || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleDeleteUser = (id: string) => {
    setDeletingUserId(id);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUserId) return;
    await adminDeleteUser(deletingUserId).catch(() => { });
    setUsers((prev) => prev.filter((u) => u._id !== deletingUserId));
    setDeletingUserId(null);
  };

  const handleRole = async (id: string, role: string) => {
    await adminSetRole(id, role).catch(() => { });
    setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role: role as 'user' | 'admin' } : u));
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>🛡 Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
          {[
            { label: 'Total Users', val: users.length },
            { label: 'Total Reviews', val: reviews.length },
          ].map((s) => (
            <div key={s.label} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '8px 16px', textAlign: 'center'
            }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: C.accent, margin: 0 }}>{s.val}</p>
              <p style={{ fontSize: 10, color: C.muted, margin: '2px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {(['users', 'reviews'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
              color: tab === t ? C.accent : C.muted,
              borderBottom: `2px solid ${tab === t ? C.accent : 'transparent'}`, marginBottom: -1
            }}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : tab === 'users' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map((u) => (
            <div key={u._id} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 11,
              padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: `${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
              }}>
                {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '🦊'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>{u.username}</p>
                <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0' }}>{u.email} · {u.provider}</p>
              </div>
              <span style={{
                fontSize: 11, padding: '3px 9px', borderRadius: 20,
                background: u.role === 'admin' ? `${C.warning}20` : `${C.accent}15`,
                color: u.role === 'admin' ? C.warning : C.accent, fontWeight: 600
              }}>
                {u.role}
              </span>
              <select value={u.role} onChange={(e) => handleRole(u._id, e.target.value)}
                style={{
                  padding: '5px 8px', background: C.bg2, border: `1px solid ${C.border}`,
                  borderRadius: 7, color: C.text, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit'
                }}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <button onClick={() => handleDeleteUser(u._id)}
                style={{
                  padding: '5px 10px', background: `${C.danger}15`, border: `1px solid ${C.danger}40`,
                  borderRadius: 7, color: C.danger, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit'
                }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reviews.map((r: any) => (
            <div key={r._id} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 11,
              padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>{r.mediaTitle}</p>
                <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0' }}>
                  by {r.userId?.username || '—'} · Rating: {r.rating}/10
                </p>
              </div>
              <span style={{ fontSize: 11, color: C.muted }}>{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Delete User Modal */}
      <Modal open={!!deletingUserId} onClose={() => setDeletingUserId(null)} title="Delete User?" width={360}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to delete this user and all their library data? This action is permanent.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setDeletingUserId(null)}
              style={{
                padding: '8px 16px', background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 9, color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>
              Cancel
            </button>
            <button onClick={handleConfirmDeleteUser}
              style={{
                padding: '8px 16px', background: C.danger, border: 'none',
                borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
