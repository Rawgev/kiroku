'use client';

import { useState, ReactNode, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { C, STATUS_COLORS, STATUS_LABELS } from '@/constants/colors';
import type { AniListMedia, WatchStatus } from '@/types';

// ── AnimeCard ──────────────────────────────────────────────
interface AnimeCardProps {
  media: AniListMedia;
  w?: number;
  h?: number;
  onAdd?: (m: AniListMedia) => void;
}

export function AnimeCard({ media, w = 165, h = 232, onAdd }: AnimeCardProps) {
  const [hov, setHov] = useState(false);
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const title = media.title.english || media.title.romaji;
  const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : '—';
  const sub = media.nextAiringEpisode
    ? `Ep ${media.nextAiringEpisode.episode} airing`
    : media.episodes
      ? `${media.episodes} eps`
      : media.chapters
        ? `${media.chapters} ch`
        : media.status || '';

  const handleClick = () => navigate(`/${media.type === 'MANGA' ? 'manga' : 'anime'}/${media.id}`);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: w,
        flexShrink: 0,
        cursor: 'pointer',
        transform: hov ? 'translateY(-4px)' : 'none',
        transition: 'transform 0.2s ease',
      }}
    >
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          background: '#161922',
          border: `1px solid ${hov ? 'rgba(245, 245, 242, 0.25)' : 'rgba(245, 245, 242, 0.08)'}`,
          boxShadow: hov ? '0 14px 32px rgba(0, 0, 0, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.4)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
        onClick={handleClick}
      >
        {(media.coverImage?.extraLarge || media.coverImage?.large) && (
          <img
            src={media.coverImage.extraLarge || media.coverImage.large}
            alt={title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(11, 13, 18, 0.78)',
            backdropFilter: 'blur(6px)',
            padding: '3px 7px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            color: '#F5F5F2',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ color: '#F59E0B' }}>★</span> {score}
        </div>
        {hov && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(11, 13, 18, 0.94) 0%, rgba(11, 13, 18, 0.25) 55%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: 10,
            }}
          >
            {onAdd && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(media);
                }}
                style={{
                  width: '100%',
                  padding: '7px 0',
                  background: '#F5F5F2',
                  border: 'none',
                  borderRadius: 999,
                  color: '#0B0D12',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                + Add to List
              </button>
            )}
          </div>
        )}
      </div>
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: C.text,
          margin: '8px 0 2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </p>
      <p style={{ fontSize: 11.5, color: C.muted, margin: 0 }}>{sub}</p>
    </div>
  );
}

// ── SkeletonCard ───────────────────────────────────────────
export function SkeletonCard({ w = 165, h = 232 }: { w?: number; h?: number }) {
  const shimmer: CSSProperties = {
    background: 'linear-gradient(90deg, #13161F 0%, #1C202D 50%, #13161F 100%)',
    backgroundSize: '200% 100%',
    borderRadius: 14,
  };
  return (
    <div style={{ width: w, flexShrink: 0 }}>
      <div style={{ ...shimmer, height: h }} />
      <div style={{ ...shimmer, height: 12, marginTop: 8, borderRadius: 6 }} />
      <div style={{ ...shimmer, height: 10, marginTop: 5, width: '55%', borderRadius: 6 }} />
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────
export function StatusBadge({ status }: { status: WatchStatus }) {
  return (
    <span
      style={{
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: `${STATUS_COLORS[status]}22`,
        color: STATUS_COLORS[status],
        border: `1px solid ${STATUS_COLORS[status]}44`,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Modal ──────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 480 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11, 13, 18, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#13161F',
          border: '1px solid rgba(245, 245, 242, 0.14)',
          borderRadius: 18,
          padding: 24,
          width: '100%',
          maxWidth: width,
          position: 'relative',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F5F5F2', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(245, 245, 242, 0.08)',
              border: 'none',
              borderRadius: 999,
              width: 30,
              height: 30,
              color: '#F5F5F2',
              fontSize: 14,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>{children}</div>
      </div>
    </div>
  );
}

// ── ConfirmDeleteModal ─────────────────────────────────────
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
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${C.danger}18`,
            border: `1px solid ${C.danger}35`,
            color: C.danger,
            fontSize: 22,
            fontWeight: 800,
          }}
        >
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
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            padding: '9px 16px',
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: 999,
            color: C.muted,
            fontSize: 12,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            padding: '9px 18px',
            background: C.danger,
            border: 'none',
            borderRadius: 999,
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ── SectionHeader ──────────────────────────────────────────
export function SectionHeader({
  title,
  subtitle,
  onViewAll,
}: {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: C.muted, margin: '2px 0 0' }}>{subtitle}</p>}
      </div>
      {onViewAll && (
        <button
          onClick={onViewAll}
          style={{
            padding: '6px 14px',
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: 999,
            color: C.accent,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          explore all →
        </button>
      )}
    </div>
  );
}

// ── HScroll ────────────────────────────────────────────────
export function HScroll({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        overflowX: 'auto',
        paddingBottom: 20,
        marginBottom: -12,
        scrollbarWidth: 'thin',
      }}
    >
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
        <span
          key={n}
          onMouseEnter={() => setHov(n)}
          onMouseLeave={() => setHov(0)}
          onClick={() => onChange?.(n === value ? 0 : n)}
          style={{
            fontSize: 18,
            cursor: onChange ? 'pointer' : 'default',
            color: n <= (hov || value) ? C.warning : 'rgba(245, 245, 242, 0.2)',
            transition: 'color 0.1s',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────
export function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `3px solid ${C.border}`,
        borderTopColor: C.accent,
        animation: 'spin 0.7s linear infinite',
      }}
    />
  );
}

export * from './SpotlightHero';
