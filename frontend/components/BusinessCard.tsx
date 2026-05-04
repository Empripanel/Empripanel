import React from 'react';
import { BusinessProfile } from '../types';
import { ChevronRight, ExternalLink, Star } from 'lucide-react';

interface BusinessCardProps {
  business: BusinessProfile;
  onClick: (id: string) => void;
  onVisit: (business: BusinessProfile) => void;
  isFeatured?: boolean;
  /** 1-based position when Explore ranking is active; omit for no badge */
  rankingPosition?: number;
}

function isUnbrokenText(s: string) {
  return !/\s/.test(s ?? '');
}

function truncateSlogan(input: string, maxChars: number) {
  const text = input ?? '';
  if (text.length <= maxChars) return text;

  const ellipsis = '...';
  const maxWithoutEllipsis = Math.max(0, maxChars - ellipsis.length);
  const slice = text.slice(0, maxWithoutEllipsis);

  // Avoid cutting mid-word: prefer cutting at the last space.
  const lastSpace = slice.lastIndexOf(' ');
  const safe = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${safe}${ellipsis}`;
}

/** Anchor: tighter to corner on small screens; baseline at lg */
const RANK_BADGE_ANCHOR =
  'absolute z-20 top-1.5 right-1.5 sm:top-2 sm:right-2 lg:top-3 lg:right-3';

/** Shared disc size for all ranking badges (#1–#n) */
const RANK_BADGE_DISC_SIMPLE =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-black leading-none lg:h-9 lg:w-9 lg:text-[11px]';

/** Flat metallic (gradient only, no shadow/relief) — same dimensions as #4+ */
function topThreeMetallicClass(position: 1 | 2 | 3): string {
  const shell = `${RANK_BADGE_ANCHOR} pointer-events-none ${RANK_BADGE_DISC_SIMPLE} border border-black/10 dark:border-white/15`;
  if (position === 1) {
    return `${shell} bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 text-amber-950 dark:from-amber-300 dark:via-amber-500 dark:to-amber-900 dark:text-amber-50`;
  }
  if (position === 2) {
    return `${shell} bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 text-slate-950 dark:from-slate-300 dark:via-slate-500 dark:to-slate-700 dark:text-slate-50`;
  }
  return `${shell} bg-gradient-to-br from-orange-200 via-amber-600 to-amber-900 text-stone-900 dark:from-amber-400 dark:via-amber-700 dark:to-amber-950 dark:text-amber-50`;
}

function ExploreRankingBadge({ position }: { position: number }) {
  const label = `Puesto ${position} en el ranking`;

  if (position >= 4) {
    return (
      <div
        className={`${RANK_BADGE_ANCHOR} pointer-events-none ${RANK_BADGE_DISC_SIMPLE} border-2 border-teal-500 bg-white/95 text-teal-600 shadow-md dark:border-teal-400 dark:bg-gray-900/95 dark:text-teal-400`}
        aria-label={label}
      >
        #{position}
      </div>
    );
  }

  return (
    <div className={topThreeMetallicClass(position as 1 | 2 | 3)} aria-label={label}>
      #{position}
    </div>
  );
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, onClick, onVisit, isFeatured, rankingPosition }) => {
  const TITLE_MAX_CHARS = 21;
  const SLOGAN_MAX_CHARS = 21;

  const title = truncateSlogan(business.publicName, TITLE_MAX_CHARS);
  const slogan = truncateSlogan(business.shortDescription, SLOGAN_MAX_CHARS);
  const titleUnbroken = isUnbrokenText(title);
  const sloganUnbroken = isUnbrokenText(slogan);
  return (
    <div 
      onClick={() => onClick(business.id)}
      className={`group bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-md hover:shadow-2xl transition-all duration-300 border-2 cursor-pointer flex flex-col lg:flex-row items-center gap-5 relative overflow-hidden box-border w-full max-w-full min-w-0 ${
        isFeatured ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-900/10' : 'border-gray-50 dark:border-gray-800 hover:border-teal-500/30'
      }`}
    >
      {isFeatured && (
        <div className="absolute top-0 left-0 bg-teal-500 text-white px-4 py-1 rounded-br-2xl flex items-center gap-1.5 shadow-sm z-10 max-w-full whitespace-normal overflow-hidden break-normal">
          <Star size={12} fill="currentColor" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Destacado</span>
        </div>
      )}

      {rankingPosition != null && rankingPosition >= 1 && <ExploreRankingBadge position={rankingPosition} />}

      {/* Categoría encima del banner (sin superponer la imagen) */}
      <div className="flex flex-col gap-2 w-full lg:w-56 flex-shrink-0 min-w-0">
        <div className="bg-teal-600 dark:bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 max-w-full whitespace-normal overflow-hidden break-normal text-center lg:text-left self-center lg:self-start shadow-sm">
          {business.category}
        </div>
        <div className="relative overflow-hidden rounded-[1.75rem] w-full aspect-[16/9] shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-teal-600">
          <img
            src={business.logo}
            alt={business.publicName}
            className="w-full h-full object-cover rounded-[1.5rem] group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>

      <div className="flex-1 text-center lg:text-left min-w-0">
        <h3
          className={`text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-1 leading-tight max-w-full min-w-0 block w-full ${
            titleUnbroken
              ? 'truncate whitespace-nowrap overflow-hidden text-ellipsis'
              : 'whitespace-normal break-words overflow-hidden'
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-full min-w-0 block w-full ${
            sloganUnbroken
              ? 'truncate whitespace-nowrap overflow-hidden text-ellipsis'
              : 'whitespace-normal break-words overflow-hidden'
          }`}
        >
          {slogan}
        </p>
      </div>

      <div className="flex gap-2 w-full lg:w-auto mt-2 lg:mt-0 min-w-0 max-w-full">
  <button 
    onClick={(e) => {
      e.stopPropagation();
      onVisit(business);
    }}
    className="flex-1 lg:flex-none min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 bg-teal-600 text-white px-4 sm:px-6 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm hover:bg-teal-700 transition-all shadow-md active:scale-95 border border-white/10 whitespace-normal break-normal overflow-hidden"
  >
    <ExternalLink className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
    Visitar
  </button>

  <div className="hidden lg:flex items-center text-gray-300 dark:text-gray-700 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1 transition-all">
    <ChevronRight size={28} />
  </div>
</div>
    </div>
  );
};

export default BusinessCard;
