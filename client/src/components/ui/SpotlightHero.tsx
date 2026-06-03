import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import type { AniListMedia } from '../../types';

interface SpotlightHeroProps {
  items: AniListMedia[];
  onAdd: (m: AniListMedia) => void;
}

export function SpotlightHero({ items, onAdd }: SpotlightHeroProps) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play interval
  useEffect(() => {
    if (items.length <= 1) return;

    if (!isHovered) {
      timerRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % items.length);
      }, 5500);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [items, isHovered]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  if (!items || items.length === 0) return null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        height: 380,
        marginBottom: 36,
        background: C.bg2,
        border: `1px solid ${C.border}`,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Slides (Absolute Stacked) */}
      {items.map((media, idx) => {
        const isActive = idx === activeIndex;
        const title = media.title.english || media.title.romaji;
        const cleanDescription = media.description?.replace(/<[^>]*>/g, '') || '';
        const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : '—';
        
        // Dynamic badges
        const episodesCount = media.episodes ? `${media.episodes} Episodes` : '';
        const mediaFormat = media.format || media.type || '';
        const nextEp = media.nextAiringEpisode
          ? `Ep ${media.nextAiringEpisode.episode} airing`
          : '';

        // Image Selection (Fallback logic)
        const hasBanner = !!media.bannerImage;
        const bgImage = media.bannerImage || media.coverImage.large;

        return (
          <div
            key={media.id}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
              transition: 'opacity 0.8s ease-in-out',
              zIndex: isActive ? 1 : 0,
            }}
          >
            {/* Background Image Container */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
              }}
            >
              <img
                src={bgImage}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  inset: 0,
                  transform: isActive ? 'scale(1)' : 'scale(1.06)',
                  filter: hasBanner ? 'none' : 'blur(20px) brightness(0.6)',
                  transition: 'transform 5.5s linear, filter 0.8s ease-in-out',
                }}
              />
            </div>

            {/* Gradient Overlay for Text Readability & Edge Blending */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, #0B1020 0%, rgba(11, 16, 32, 0.94) 30%, rgba(11, 16, 32, 0.7) 60%, rgba(11, 16, 32, 0.25) 80%, transparent 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, #0B1020 0%, rgba(11, 16, 32, 0.4) 40%, transparent 100%)',
              }}
            />

            {/* Elegant Portrait Cover Image Card (Shown on the right side if banner is a fallback cover) */}
            {!hasBanner && isActive && (
              <div
                style={{
                  position: 'absolute',
                  right: 80,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 170,
                  height: 245,
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: `0 12px 36px rgba(139, 92, 246, 0.35)`,
                  border: `1px solid ${C.accent}50`,
                  animation: 'fadeInRight 0.8s ease-out',
                  zIndex: 2,
                }}
              >
                <img
                  src={media.coverImage.large}
                  alt={title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Content Container */}
            <div
              style={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 48px',
                maxWidth: 620,
                zIndex: 2,
              }}
            >
              {/* Spotlight Rank & Genre Tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    background: `linear-gradient(135deg, ${C.accent} 0%, #7C3AED 100%)`,
                    color: '#FFF',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 8,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  #{idx + 1} Spotlight
                </span>
                
                {/* Format / Type */}
                {mediaFormat && (
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.muted,
                    }}
                  >
                    {mediaFormat}
                  </span>
                )}

                {/* Score */}
                {media.averageScore && (
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.warning,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    ★ {score}
                  </span>
                )}
              </div>

              {/* Dynamic Anime Title */}
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: C.text,
                  margin: '0 0 12px',
                  lineHeight: 1.25,
                  letterSpacing: '-0.5px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {title}
              </h1>

              {/* Badges Bar (Airing/Episode Info, Release Status) */}
              {(episodesCount || nextEp || media.status) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  {nextEp && (
                    <span
                      style={{
                        padding: '3px 9px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.success,
                      }}
                    >
                      🟢 {nextEp}
                    </span>
                  )}
                  
                  {episodesCount && !nextEp && (
                    <span
                      style={{
                        padding: '3px 9px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.info,
                      }}
                    >
                      {episodesCount}
                    </span>
                  )}

                  {media.genres && media.genres.length > 0 && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {media.genres.slice(0, 2).map((genre) => (
                        <span
                          key={genre}
                          style={{
                            fontSize: 11,
                            color: C.muted,
                            background: 'rgba(255, 255, 255, 0.04)',
                            padding: '3px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Description / Synopsis */}
              <p
                style={{
                  fontSize: 13,
                  color: C.muted,
                  margin: '0 0 24px',
                  lineHeight: 1.6,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {cleanDescription}
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <button
                  onClick={() => navigate(`/anime/${media.id}`)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 24px',
                    background: C.accent,
                    border: 'none',
                    borderRadius: 12,
                    color: '#FFF',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                    transition: 'transform 0.15s, opacity 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {/* Play Icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Now
                </button>

                <button
                  onClick={() => onAdd(media)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 20px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 12,
                    color: '#FFF',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 0.2s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add to List
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Manual Horizontal Controls (Bottom Right) */}
      {items.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 28,
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            zIndex: 10,
          }}
        >
          {/* Arrow Prev */}
          <button
            onClick={handlePrev}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(11, 16, 32, 0.75)',
              border: `1px solid ${C.border}`,
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.accent;
              e.currentTarget.style.borderColor = C.accentLight;
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(11, 16, 32, 0.75)';
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          {/* Arrow Next */}
          <button
            onClick={handleNext}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(11, 16, 32, 0.75)',
              border: `1px solid ${C.border}`,
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.accent;
              e.currentTarget.style.borderColor = C.accentLight;
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(11, 16, 32, 0.75)';
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      )}

      {/* Progress Indicators / Dots (Bottom Center) */}
      {items.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 6,
            zIndex: 10,
          }}
        >
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              style={{
                width: idx === activeIndex ? 20 : 6,
                height: 6,
                borderRadius: 4,
                border: 'none',
                background: idx === activeIndex ? C.accent : 'rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* Inject Keyframe Animations for Fallback cover slide-in */}
      <style>{`
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translate(20px, -50%);
          }
          to {
            opacity: 1;
            transform: translate(0, -50%);
          }
        }
      `}</style>
    </div>
  );
}
