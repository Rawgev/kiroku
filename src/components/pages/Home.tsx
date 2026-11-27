'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { fetchHomeData } from '@/api/anilist';
import type { AniListMedia } from '@/types';

export default function Home() {
  const router = useRouter();
  const [homeData, setHomeData] = useState<Awaited<ReturnType<typeof fetchHomeData>> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    fetchHomeData()
      .then((res) => setHomeData(res))
      .catch(console.error);
  }, []);

  const items = homeData?.trending?.media || [];
  const current = items[activeIndex];
  const card1 = items.length > 0 ? items[activeIndex % items.length] : null;
  const card2 = items.length > 1 ? items[(activeIndex + 1) % items.length] : null;
  const card3 = items.length > 2 ? items[(activeIndex + 2) % items.length] : null;

  const title = current ? current.title.english || current.title.romaji : '';
  const description = current?.description
    ? current.description.replace(/<[^>]*>/g, '').trim()
    : '';
  const score10 = current?.averageScore ? (current.averageScore / 10).toFixed(1) : '9.0';
  const filledStars = current?.averageScore ? Math.round((current.averageScore / 100) * 5) : 5;

  const handlePrev = () => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const handleWatchTrailer = () => {
    if (!current) return;
    if (current.trailer?.id && current.trailer.site === 'youtube') {
      setTrailerOpen(true);
    } else {
      router.push(`/anime/${current.id}`);
    }
  };

  const goToMedia = (m: AniListMedia) => {
    router.push(`/${m.type === 'MANGA' ? 'manga' : 'anime'}/${m.id}`);
  };

  return (
    <div className="w-full bg-[#0B0D12] text-[#F5F5F2]">
      {/* ── HERO SECTION (normal document flow, 100vw × 100vh) ── */}
      <section className="relative w-full min-h-screen overflow-hidden flex items-center">
        {/* Full-Bleed Dynamic Background Layer inside Hero */}
        <div className="absolute inset-0 z-0 bg-[#0B0D12] pointer-events-none overflow-hidden">
          {items.map((item, idx) => {
            const bgSrc = item.bannerImage || item.coverImage?.extraLarge || item.coverImage?.large;
            if (!bgSrc) return null;
            return (
              <img
                key={item.id}
                src={bgSrc}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out"
                style={{ opacity: idx === activeIndex ? 1 : 0 }}
              />
            );
          })}

          {/* Directional dark gradient + top/bottom vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(11, 13, 18, 0.92) 0%, rgba(11, 13, 18, 0.65) 50%, rgba(11, 13, 18, 0.4) 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(11, 13, 18, 0.55) 0%, rgba(11, 13, 18, 0) 28%, rgba(11, 13, 18, 0) 68%, rgba(11, 13, 18, 1) 100%)',
            }}
          />
        </div>

        {/* Hero Two-Column Content */}
        <div className="relative z-10 w-full max-w-[1440px] mx-auto pl-[24px] md:pl-[80px] pr-0 pt-[96px] pb-[56px] grid grid-cols-1 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)] items-center gap-y-10 lg:gap-x-[72px]">
          {/* Left Column: Spotlight Details */}
          <div className="flex flex-col items-start pr-6 lg:pr-0">
            {current && (
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="flex items-center gap-[3px]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className="text-[13px]"
                      style={{
                        color: star <= filledStars ? '#F59E0B' : 'rgba(245, 245, 242, 0.25)',
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-[13px] font-semibold text-[#F5F5F2]">
                  {score10} / 10
                </span>
              </div>
            )}

            <h1 className="text-[36px] md:text-[46px] font-bold leading-[1.15] text-[#F5F5F2] m-0">
              {title || 'Loading...'}
            </h1>

            <p className="mt-[18px] text-[15.5px] font-medium leading-[1.65] text-[#F5F5F2]/72 line-clamp-4">
              {description}
            </p>

            <button
              onClick={handleWatchTrailer}
              className="mt-9 inline-flex items-center gap-4 bg-transparent border-none p-0 cursor-pointer text-[#F5F5F2]"
            >
              <span className="w-8 h-8 rounded-full border-[1.8px] border-[#F5F5F2] inline-flex items-center justify-center shrink-0">
                <svg width="10" height="12" viewBox="0 0 12 14" fill="#F5F5F2">
                  <path d="M1 1.5L11 7L1 12.5V1.5Z" />
                </svg>
              </span>
              <span className="text-[17px] font-semibold text-[#F5F5F2]">
                Watch Trailer
              </span>
            </button>
          </div>

          {/* Right Column: 3 Horizontal Cards + Chevrons */}
          <div className="flex flex-col items-start min-w-0 overflow-hidden">
            <div className="flex items-center gap-6">
              <SpotlightPosterCard
                media={card1}
                width={276}
                height={410}
                onClick={() => card1 && goToMedia(card1)}
              />

              <SpotlightPosterCard
                media={card2}
                width={224}
                height={320}
                onClick={() => {
                  if (items.length > 1) {
                    setActiveIndex((activeIndex + 1) % items.length);
                  }
                }}
              />

              <SpotlightPosterCard
                media={card3}
                width={224}
                height={320}
                onClick={() => {
                  if (items.length > 2) {
                    setActiveIndex((activeIndex + 2) % items.length);
                  }
                }}
              />
            </div>

            {/* Left / Right Chevrons aligned below first card */}
            <div className="w-full pr-[80px] mt-7 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  aria-label="Previous"
                  className="w-[34px] h-[34px] rounded-full border-[1.5px] border-[#F5F5F2]/55 bg-transparent text-[#F5F5F2] inline-flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft size={15} strokeWidth={2} />
                </button>

                <button
                  onClick={handleNext}
                  aria-label="Next"
                  className="w-[34px] h-[34px] rounded-full border-[1.5px] border-[#F5F5F2]/55 bg-transparent text-[#F5F5F2] inline-flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BELOW-THE-FOLD CONTENT ROWS (4 SECTIONS) ── */}
      <div className="w-full max-w-[1440px] mx-auto pt-12 pb-20 flex flex-col gap-12">
        <MediaRow
          title="Trending Now"
          items={homeData?.trending?.media || []}
          exploreHref="/anime?sort=trending"
          onCardClick={goToMedia}
        />

        <MediaRow
          title="Top Rated"
          items={homeData?.topRated?.media || []}
          exploreHref="/anime?sort=top-rated"
          onCardClick={goToMedia}
        />

        <MediaRow
          title="Popular Manga and Manhwa"
          items={homeData?.popularManga?.media || []}
          exploreHref="/manga?sort=popular"
          onCardClick={goToMedia}
        />

        <MediaRow
          title="Upcoming"
          items={homeData?.upcoming?.media || []}
          exploreHref="/anime?status=upcoming"
          onCardClick={goToMedia}
        />
      </div>

      {/* Trailer Modal */}
      {trailerOpen && current?.trailer?.id && (
        <div
          onClick={() => setTrailerOpen(false)}
          className="fixed inset-0 bg-[#0B0D12]/90 z-[1000] flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[880px] aspect-video bg-[#0B0D12] rounded-2xl overflow-hidden border border-[#F5F5F2]/15"
          >
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${current.trailer.id}?autoplay=1`}
              title={title}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="border-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MediaRow({
  title,
  items,
  exploreHref,
  onCardClick,
}: {
  title: string;
  items: AniListMedia[];
  exploreHref: string;
  onCardClick: (m: AniListMedia) => void;
}) {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const updateScrollState = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
  };

  const handleScrollBy = (delta: number) => {
    trackRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full relative"
    >
      {/* Row Header */}
      <div className="pl-[24px] md:pl-[80px] pr-[24px] md:pr-[80px] mb-[18px] flex items-center">
        <h2 className="text-[24px] md:text-[26px] font-bold text-[#F5F5F2] leading-tight m-0">
          {title}
        </h2>

        <motion.button
          type="button"
          initial={false}
          animate={{
            opacity: isHovered ? 1 : 0,
            x: isHovered ? 0 : -6,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={() => router.push(exploreHref)}
          className={`ml-[14px] inline-flex items-center gap-1 bg-transparent border-none p-0 text-[14px] font-medium text-[#38BDF8] cursor-pointer ${
            isHovered ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <span>explore all</span>
          <ChevronRight size={15} strokeWidth={2.2} />
        </motion.button>
      </div>

      {/* Scrollable Card Track + Hover-Reveal Edge Arrows */}
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={updateScrollState}
          className="flex gap-[20px] overflow-x-auto no-scrollbar pl-[24px] md:pl-[80px] pr-[24px] md:pr-[80px] scroll-smooth"
        >
          {items.length === 0
            ? Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="w-[314px] h-[180px] rounded-[14px] shrink-0 bg-[#E5E5E5]/90"
                />
              ))
            : items.map((media) => {
                const imgSrc =
                  media.bannerImage || media.coverImage?.extraLarge || media.coverImage?.large;
                const mediaTitle = media.title.english || media.title.romaji;
                const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;

                return (
                  <div
                    key={media.id}
                    onClick={() => onCardClick(media)}
                    className="w-[314px] h-[180px] rounded-[14px] shrink-0 relative overflow-hidden bg-[#161922] cursor-pointer"
                  >
                    {imgSrc && (
                      <img
                        src={imgSrc}
                        alt={mediaTitle}
                        loading="lazy"
                        className="w-full h-full object-cover block"
                      />
                    )}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(11, 13, 18, 0.05) 0%, rgba(11, 13, 18, 0.25) 55%, rgba(11, 13, 18, 0.9) 100%)',
                      }}
                    />
                    <div className="absolute left-4 right-4 bottom-3.5">
                      <p className="text-[15px] font-bold text-[#F5F5F2] m-0 truncate">
                        {mediaTitle}
                      </p>
                      <div className="flex items-center gap-2.5 mt-1 text-[12px] text-[#F5F5F2]/75 font-medium">
                        {media.format && <span>{media.format}</span>}
                        {score && (
                          <span className="inline-flex items-center gap-1 text-[#F5F5F2]">
                            <span className="text-[#F59E0B]">★</span> {score}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Left-Edge Back Arrow (when scrolled right & hovered) */}
        <motion.button
          type="button"
          aria-label={`Scroll ${title} left`}
          initial={false}
          animate={{ opacity: isHovered && canScrollLeft ? 1 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={() => handleScrollBy(-980)}
          className={`absolute left-0 top-0 bottom-0 w-[88px] flex items-center justify-start pl-5 border-none cursor-pointer bg-gradient-to-r from-[#0B0D12]/85 via-[#0B0D12]/40 to-transparent ${
            isHovered && canScrollLeft ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <ChevronLeft size={30} strokeWidth={2.2} className="text-[#F5F5F2]" />
        </motion.button>

        {/* Right-Edge Forward Arrow */}
        <motion.button
          type="button"
          aria-label={`Scroll ${title} right`}
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={() => handleScrollBy(980)}
          className={`absolute right-0 top-0 bottom-0 w-[96px] flex items-center justify-end pr-6 border-none cursor-pointer bg-gradient-to-l from-[#0B0D12]/85 via-[#0B0D12]/40 to-transparent ${
            isHovered ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <ChevronRight size={30} strokeWidth={2.2} className="text-[#F5F5F2]" />
        </motion.button>
      </div>
    </section>
  );
}

function SpotlightPosterCard({
  media,
  width,
  height,
  onClick,
}: {
  media: AniListMedia | null;
  width: number;
  height: number;
  onClick: () => void;
}) {
  const poster = media?.coverImage?.extraLarge || media?.coverImage?.large;
  const title = media ? media.title.english || media.title.romaji : '';
  const meta = media
    ? [media.format, media.episodes ? `${media.episodes} Eps` : null].filter(Boolean).join(' • ')
    : '';
  const score = media?.averageScore ? (media.averageScore / 10).toFixed(1) : null;

  return (
    <div
      onClick={onClick}
      style={{ width, height }}
      className={`rounded-[16px] bg-[#161922] overflow-hidden shrink-0 relative ${
        media ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      {poster && (
        <img
          src={poster}
          alt={title}
          className="w-full h-full object-cover block"
        />
      )}

      {/* Subtle bottom gradient for card text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(11, 13, 18, 0.15) 0%, rgba(11, 13, 18, 0) 40%, rgba(11, 13, 18, 0.88) 100%)',
        }}
      />

      {/* Top-left subtle bookmark icon */}
      {media && (
        <div className="absolute top-3.5 left-3.5 text-[#F5F5F2] opacity-90">
          <Bookmark size={16} strokeWidth={2} />
        </div>
      )}

      {/* Bottom card details */}
      {media && (
        <div className="absolute left-4 right-4 bottom-4">
          {meta && (
            <p className="text-[11.5px] font-medium text-[#F5F5F2]/72 mt-0 mb-1">
              {meta}
            </p>
          )}
          <p className="text-[15px] font-bold text-[#F5F5F2] m-0 truncate">
            {title}
          </p>
          {score && (
            <p className="text-[12px] font-semibold text-[#F5F5F2] mt-1.5 mb-0 flex items-center gap-1.5">
              <span className="text-[#F59E0B]">★</span> {score}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
