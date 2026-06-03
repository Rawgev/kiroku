import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getLibrary, updateEntry, deleteEntry } from '../api/backend';
import { useAuth } from '../context/AuthContext';
import { Modal, StatusBadge, StarRating, Spinner } from '../components/ui';
import { C, STATUS_COLORS, STATUS_LABELS, inputStyle } from '../constants/colors';
import type { MediaEntry, WatchStatus } from '../types';

const COLUMNS: { status: WatchStatus; icon: string }[] = [
  { status: 'watching', icon: '▶' },
  { status: 'reading', icon: '📖' },
  { status: 'completed', icon: '✅' },
  { status: 'on_hold', icon: '⏸' },
  { status: 'dropped', icon: '🗑' },
  { status: 'plan_to_watch', icon: '📋' },
  { status: 'plan_to_read', icon: '📚' },
];

export default function Library() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterStatus = searchParams.get('status') as WatchStatus | null;

  const [entries, setEntries] = useState<MediaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MediaEntry | null>(null);
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<WatchStatus>('watching');
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'kanban' | 'list'>('list');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Local filter states
  const [selectedType, setSelectedType] = useState<'ALL' | 'ANIME' | 'MANGA'>('ALL');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('updated_desc');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('');

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    getLibrary(filterStatus ? { status: filterStatus } : undefined)
      .then(setEntries).catch(console.error).finally(() => setLoading(false));
  }, [user, filterStatus]);

  const openEdit = (e: MediaEntry) => { setEditing(e); setScore(e.score); setProgress(e.progress); setStatus(e.status); setIsFavorite(e.isFavorite); };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await updateEntry(editing._id, {
        score,
        progress: status === 'completed' && editing.totalProgress
          ? editing.totalProgress
          : progress,
        status,
        isFavorite,
      });
      setEntries((prev) => prev.map((e) => e._id === updated._id ? updated : e));
      setEditing(null);
    } catch { alert('Failed to update.'); }
    finally { setSaving(false); }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await deleteEntry(deletingId).catch(console.error);
    setEntries((prev) => prev.filter((e) => e._id !== deletingId));
    setDeletingId(null);
  };

  if (!user) return null;
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={44} /></div>;

  // 1. Extract dynamic list of genres present in user's library
  const availableGenres = Array.from(
    new Set(entries.flatMap((e) => e.genres || []))
  ).sort();

  // 2. Filter local entries client-side
  const filteredEntries = entries.filter((entry) => {
    // Type filter: ANIME vs MANGA (manhwa, manhua, lightnovel, manga)
    if (selectedType === 'ANIME' && entry.mediaType !== 'anime') return false;
    if (selectedType === 'MANGA' && entry.mediaType === 'anime') return false;

    // Genre filter
    if (selectedGenre && !entry.genres?.includes(selectedGenre)) return false;

    // Subtype (Format) filter
    if (selectedSubtype && entry.mediaType !== selectedSubtype) return false;

    return true;
  });

  // 3. Sort entries client-side
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (selectedSort === 'title_asc') {
      return a.title.localeCompare(b.title);
    }
    if (selectedSort === 'score_desc') {
      return b.score - a.score;
    }
    if (selectedSort === 'progress_desc') {
      return b.progress - a.progress;
    }
    if (selectedSort === 'updated_desc') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return 0;
  });

  // 4. Group only the filtered & sorted entries for Kanban columns
  const grouped = Object.fromEntries(
    COLUMNS.map(({ status }) => [status, sortedEntries.filter((e) => e.status === status)])
  ) as Record<WatchStatus, MediaEntry[]>;

  // 5. Columns visibility: hide irrelevant columns based on current type filter
  let visibleColumns = filterStatus
    ? COLUMNS.filter((c) => c.status === filterStatus)
    : COLUMNS;

  if (selectedType === 'ANIME') {
    visibleColumns = visibleColumns.filter((c) => c.status !== 'reading' && c.status !== 'plan_to_read');
  } else if (selectedType === 'MANGA') {
    visibleColumns = visibleColumns.filter((c) => c.status !== 'watching' && c.status !== 'plan_to_watch');
  }

  // 6. Subtype filter options based on type toggle
  const getSubtypeOptions = () => {
    if (selectedType === 'ANIME') {
      return [{ val: 'anime', label: 'Anime' }];
    }
    if (selectedType === 'MANGA') {
      return [
        { val: 'manga', label: 'Manga' },
        { val: 'manhwa', label: 'Manhwa' },
        { val: 'manhua', label: 'Manhua' },
        { val: 'lightnovel', label: 'Light Novel' },
      ];
    }
    return [
      { val: 'anime', label: 'Anime' },
      { val: 'manga', label: 'Manga' },
      { val: 'manhwa', label: 'Manhwa' },
      { val: 'manhua', label: 'Manhua' },
      { val: 'lightnovel', label: 'Light Novel' },
    ];
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>My Library</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>{entries.length} titles tracked</p>
        </div>
        <div style={{
          display: 'flex', background: C.card, borderRadius: 9, overflow: 'hidden',
          border: `1px solid ${C.border}`
        }}>
          {(['list', 'kanban'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: '7px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                background: view === v ? C.accent : 'transparent',
                color: view === v ? '#fff' : C.muted
              }}>
              {v === 'list' ? '⊞ Grid' : '📋 Kanban'}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Advanced Filter Bar */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '14px 18px', marginBottom: 22, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Type toggle */}
        <div style={{ display: 'flex', background: C.bg2, borderRadius: 8, overflow: 'hidden', width: isMobile ? '100%' : 'auto' }}>
          {(['ALL', 'ANIME', 'MANGA'] as const).map((t) => (
            <button key={t} onClick={() => {
              setSelectedType(t);
              setSelectedSubtype('');
            }}
              style={{ flex: isMobile ? 1 : 'none', padding: '7px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, fontWeight: 600, background: selectedType === t ? C.accent : 'transparent',
                color: selectedType === t ? '#fff' : C.muted }}>
              {t}
            </button>
          ))}
        </div>

        {/* Genre select */}
        <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}
          style={{ ...inputStyle, width: isMobile ? '100%' : 160, flex: isMobile ? '1 1 130px' : 'none', padding: '7px 10px' }}>
          <option value="">All Genres</option>
          {availableGenres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>

        {/* Sort */}
        <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}
          style={{ ...inputStyle, width: isMobile ? '100%' : 160, flex: isMobile ? '1 1 130px' : 'none', padding: '7px 10px' }}>
          <option value="updated_desc">Recently Updated</option>
          <option value="title_asc">Title (A-Z)</option>
          <option value="score_desc">Highest Rated</option>
          <option value="progress_desc">Most Progress</option>
        </select>

        {/* Format select */}
        <select value={selectedSubtype} onChange={(e) => setSelectedSubtype(e.target.value)}
          style={{ ...inputStyle, width: isMobile ? '100%' : 150, flex: isMobile ? '1 1 130px' : 'none', padding: '7px 10px' }}>
          <option value="">{selectedType === 'MANGA' ? 'All Manga Formats' : 'All Formats'}</option>
          {getSubtypeOptions().map((opt) => (
            <option key={opt.val} value={opt.val}>{opt.label}</option>
          ))}
        </select>

        <span style={{ marginLeft: isMobile ? 'none' : 'auto', width: isMobile ? '100%' : 'auto', textAlign: isMobile ? 'center' : 'right', fontSize: 12, color: C.muted }}>
          {sortedEntries.length.toLocaleString()} result{sortedEntries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid view */}
      {view === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 16 }}>
          {sortedEntries.map((entry) => (
            <LibraryCard
              key={entry._id}
              entry={entry}
              onEdit={() => openEdit(entry)}
              onDelete={() => handleDelete(entry._id)}
            />
          ))}
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start' }}>
          {visibleColumns.map(({ status, icon }) => (
            <div key={status} style={{ flex: '1 1 280px', minWidth: 280, maxWidth: filterStatus ? '100%' : 360, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, color: C.muted,
                  background: C.bg2, padding: '1px 7px', borderRadius: 10
                }}>
                  {grouped[status]?.length || 0}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grouped[status]?.map((entry) => (
                  <KanbanCard key={entry._id} entry={entry} onEdit={() => openEdit(entry)} onDelete={() => handleDelete(entry._id)} />
                ))}
                {grouped[status]?.length === 0 && (
                  <div style={{
                    background: C.card, border: `1px dashed ${C.border}`, borderRadius: 12,
                    padding: 16, textAlign: 'center', color: C.muted, fontSize: 12
                  }}>
                    Nothing here yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit: ${editing?.title}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Status</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(editing?.mediaType === 'anime'
                ? (['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'] as WatchStatus[])
                : (['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read'] as WatchStatus[])
              ).map((s) => (
                <button key={s} onClick={() => {
                  setStatus(s);
                  if (s === 'completed' && editing?.totalProgress) {
                    setProgress(editing.totalProgress);
                  }
                }}
                  style={{
                    padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: 600, border: '1px solid',
                    background: status === s ? C.accent : 'transparent',
                    borderColor: status === s ? C.accent : C.border,
                    color: status === s ? '#fff' : C.muted
                  }}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Score</label>
            <StarRating value={score} onChange={setScore} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
              Progress {editing?.totalProgress ? `(out of ${editing.totalProgress})` : ''}
            </label>
            <input type="number" value={progress} min={0} max={editing?.totalProgress || 9999}
              onChange={(e) => {
                const val = Number(e.target.value);
                setProgress(val);
                if (editing?.totalProgress && val === editing.totalProgress) {
                  setStatus('completed');
                }
              }}
              style={{
                width: '100%', padding: '9px 12px', background: C.bg2, border: `1px solid ${C.border}`,
                borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit'
              }} />
          </div>
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: C.text,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              ⭐ Add to Favorites
            </label>
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{
              padding: '10px 0', background: C.accent, border: 'none', borderRadius: 10,
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1, fontFamily: 'inherit'
            }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal open={!!deletingId} onClose={() => setDeletingId(null)} title="Remove from Library?" width={360}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to remove this title from your library?
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setDeletingId(null)}
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

function KanbanCard({ entry, onEdit, onDelete }: { entry: MediaEntry; onEdit: () => void; onDelete: () => void }) {
  const [hov, setHov] = useState(false);
  const pct = entry.totalProgress ? Math.round((entry.progress / entry.totalProgress) * 100) : 0;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: C.card, border: `1px solid ${hov ? C.accentLight : C.border}`,
        borderRadius: 14, padding: 14, transition: 'border-color 0.15s'
      }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <img src={entry.coverImage} alt={entry.title}
          style={{ width: 52, height: 72, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 4px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>{entry.title}</p>
          <p style={{ fontSize: 11, color: C.muted, margin: '0 0 8px' }}>
            {entry.progress}{entry.totalProgress ? `/${entry.totalProgress}` : ''} · {entry.score > 0 ? `⭐ ${entry.score}` : 'Unscored'}
          </p>
          {entry.totalProgress && (
            <div style={{ height: 4, borderRadius: 2, background: C.bg2 }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: `linear-gradient(90deg,${C.accent},${C.accentLight})`, borderRadius: 2
              }} />
            </div>
          )}
        </div>
      </div>
      {hov && (
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <button onClick={onEdit}
            style={{
              flex: 1, padding: '6px 0', background: `${C.accent}20`, border: `1px solid ${C.accent}40`,
              borderRadius: 8, color: C.accent, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
            }}>Edit</button>
          <button onClick={onDelete}
            style={{
              padding: '6px 12px', background: `${C.danger}15`, border: `1px solid ${C.danger}40`,
              borderRadius: 8, color: C.danger, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
            }}>✕</button>
        </div>
      )}
    </div>
  );
}

function LibraryCard({ entry, onEdit, onDelete }: { entry: MediaEntry; onEdit: () => void; onDelete: () => void }) {
  const [hov, setHov] = useState(false);
  const navigate = useNavigate();

  const title = entry.title;
  const score = entry.score > 0 ? entry.score.toString() : '—';
  const linkPath = `/${entry.mediaType === 'anime' ? 'anime' : 'manga'}/${entry.mediaId}`;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0,
        cursor: 'pointer',
        transform: hov ? 'translateY(-4px)' : 'none',
        transition: 'transform 0.2s',
      }}
    >
      <div
        style={{
          height: 210,
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: hov ? `0 12px 30px rgba(139,92,246,0.4)` : '0 4px 12px rgba(0,0,0,0.5)',
          transition: 'box-shadow 0.2s',
        }}
        onClick={() => navigate(linkPath)}
      >
        <img
          src={entry.coverImage}
          alt={title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Score Badge */}
        <div
          style={{
            position: 'absolute',
            top: 7,
            left: 7,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            padding: '2px 6px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            color: C.warning,
          }}
        >
          ⭐ {score}
        </div>
        {/* Status Badge */}
        <div
          style={{
            position: 'absolute',
            top: 7,
            right: 7,
          }}
        >
          <StatusBadge status={entry.status} />
        </div>
        {/* Hover Overlay */}
        {hov && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(11,16,32,0.95) 0%, rgba(11,16,32,0.4) 60%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: 10,
              gap: 6,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={onEdit}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  background: C.accent,
                  border: 'none',
                  borderRadius: 7,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                style={{
                  padding: '6px 8px',
                  background: `${C.danger}33`,
                  border: `1px solid ${C.danger}40`,
                  borderRadius: 7,
                  color: C.danger,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Title */}
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.text,
          margin: '7px 0 1px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </p>
      {/* Progress */}
      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
        Progress: {entry.progress}
        {entry.totalProgress ? `/${entry.totalProgress}` : ''}
      </p>
    </div>
  );
}
