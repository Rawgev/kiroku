import { useState, ReactNode, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, STATUS_COLORS, STATUS_LABELS } from '../../constants/colors';
import type { AniListMedia, WatchStatus } from '../../types';

// ── AnimeCard ──────────────────────────────────────────────
interface AnimeCardProps {
  media:    AniListMedia;
  w?:       number;
  h?:       number;
  onAdd?:   (m: AniListMedia) => void;
}

export function AnimeCard({ media, w = 150, h = 210, onAdd }: AnimeCardProps) {
  const [hov, setHov] = useState(false);
  const navigate = useNavigate();
  const title = media.title.english || media.title.romaji;
  const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : '—';
  const sub   = media.nextAiringEpisode
    ? `Ep ${media.nextAiringEpisode.episode} airing`
    : media.episodes ? `${media.episodes} eps`
    : media.chapters  ? `${media.chapters} ch`
    : media.status    || '';

  const handleClick = () => navigate(`/${media.type === 'MANGA' ? 'manga' : 'anime'}/${media.id}`);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ width: w, flexShrink: 0, cursor: 'pointer',
        transform: hov ? 'translateY(-4px)' : 'none',
        transition: 'transform 0.2s' }}
    >
      <div style={{ width: w, height: h, borderRadius: 12, overflow: 'hidden', position: 'relative',
        boxShadow: hov ? `0 12px 30px rgba(139,92,246,0.4)` : '0 4px 12px rgba(0,0,0,0.5)',
        transition: 'box-shadow 0.2s' }}
        onClick={handleClick}
      >
        {media.coverImage?.large && (
          <img src={media.coverImage.large} alt={title} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', top: 7, left: 7, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: C.warning }}>
          ⭐ {score}
        </div>
        {hov && (
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(11,16,32,0.95) 0%, rgba(11,16,32,0.2) 55%, transparent 100%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 8 }}>
            {onAdd && (
              <button onClick={(e) => { e.stopPropagation(); onAdd(media); }}
                style={{ width: '100%', padding: '6px 0', background: C.accent, border: 'none',
                  borderRadius: 7, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Add to List
              </button>
            )}
          </div>
        )}
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: '7px 0 1px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{sub}</p>
    </div>
  );
}

// ── SkeletonCard ───────────────────────────────────────────
export function SkeletonCard({ w = 150, h = 210 }: { w?: number; h?: number }) {
  const shimmer: CSSProperties = {
    background: `linear-gradient(90deg, ${C.card} 0%, ${C.bg2} 50%, ${C.card} 100%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.3s infinite',
    borderRadius: 12,
  };
  return (
    <div style={{ width: w, flexShrink: 0 }}>
      <div style={{ ...shimmer, height: h }} />
      <div style={{ ...shimmer, height: 11, marginTop: 7 }} />
      <div style={{ ...shimmer, height: 10, marginTop: 4, width: '55%' }} />
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────
export function StatusBadge({ status }: { status: WatchStatus }) {
  return (
    <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: `${STATUS_COLORS[status]}22`, color: STATUS_COLORS[status],
      border: `1px solid ${STATUS_COLORS[status]}44` }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Modal ──────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number; }
export function Modal({ open, onClose, title, children, width = 480 }: ModalProps) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(6px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 18,
        padding: 24, width: '100%', maxWidth: width, position: 'relative' }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted,
            fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── SectionHeader ──────────────────────────────────────────
interface ConfirmDeleteModalProps {
  open: boolean;
  title?: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  open,
  title = 'Delete this?',
  message,
  detail = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onCancel} title={title} width={420}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${C.danger}18`, border: `1px solid ${C.danger}35`,
          color: C.danger, fontSize: 22, fontWeight: 800
        }}>
          !
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.55, fontWeight: 650 }}>
            {message}
          </p>
          <p style={{ fontSize: 12, color: C.muted, margin: '7px 0 0', lineHeight: 1.55 }}>
            {detail}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, flexWrap: 'wrap' }}>
        <button onClick={onCancel} disabled={loading}
          style={{
            padding: '9px 16px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 10, color: C.muted, fontSize: 12, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            opacity: loading ? 0.6 : 1
          }}>
          {cancelLabel}
        </button>
        <button onClick={onConfirm} disabled={loading}
          style={{
            padding: '9px 18px', background: C.danger, border: 'none',
            borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            boxShadow: `0 10px 24px ${C.danger}30`,
            opacity: loading ? 0.7 : 1
          }}>
          {loading ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function SectionHeader({ title, subtitle, onViewAll }: { title: string; subtitle?: string; onViewAll?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0' }}>{subtitle}</p>}
      </div>
      {onViewAll && (
        <button onClick={onViewAll}
          style={{ padding: '5px 12px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 8, color: C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          View All →
        </button>
      )}
    </div>
  );
}

// ── HScroll ────────────────────────────────────────────────
export function HScroll({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 20, marginBottom: -12, scrollbarWidth: 'thin' }}>
      {children}
    </div>
  );
}

// ── StarRating ─────────────────────────────────────────────
export function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <span key={n}
          onMouseEnter={() => setHov(n)}
          onMouseLeave={() => setHov(0)}
          onClick={() => onChange?.(n === value ? 0 : n)}
          style={{ fontSize: 18, cursor: onChange ? 'pointer' : 'default',
            color: n <= (hov || value) ? C.warning : C.card,
            transition: 'color 0.1s' }}>★</span>
      ))}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────
export function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%',
      border: `3px solid ${C.border}`, borderTopColor: C.accent,
      animation: 'spin 0.7s linear infinite' }} />
  );
}

export * from './SpotlightHero';
