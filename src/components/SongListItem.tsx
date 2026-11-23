import React from 'react';
import { Star } from 'lucide-react';
import type { Song } from '../types/song';

interface SongListItemProps {
  song: Song;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: (songId: number) => void;
  onToggleFavorite: (songId: number) => void;
}

function formatUnitCount(song: Song): string {
  if (song.book === 'predspevy') {
    return song.stanzaCount > 1 ? `${song.stanzaCount} časti` : 'Liturgický predspev';
  }
  if (song.book === 'antifony') return 'Liturgické verše';
  const n = song.stanzaCount;
  if (song.id === 656) return `${n} kánonov`;
  if (song.id === 657) return `${n} žalmov`;
  if (n === 1) return '1 sloha';
  if (n >= 2 && n <= 4) return `${n} slohy`;
  return `${n} slôh`;
}

export const SongListItem: React.FC<SongListItemProps> = React.memo(
  ({ song, isSelected, isFavorite, onSelect, onToggleFavorite }) => {
    const isAntiphon = song.book === 'antifony';
    const isPredspev = song.book === 'predspevy';
    const itemType = isPredspev ? 'predspev' : isAntiphon ? 'antifónu' : 'pieseň';

    return (
      <div
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
          isSelected
            ? 'bg-[#EAE4D7] dark:bg-[#222C40]'
            : 'hover:bg-[#EFECE4] dark:hover:bg-[#1B2334]'
        }`}
        onClick={() => onSelect(song.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(song.id);
          }
        }}
        aria-current={isSelected ? 'true' : undefined}
      >
        <div
          className={`w-12 h-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold tabular-nums transition-colors ${
            isSelected
              ? 'bg-[#1A2232] text-[#FAF7F0] dark:bg-[#D4A34B] dark:text-[#111622]'
              : isAntiphon || isPredspev
              ? 'bg-[#EAE4D7] text-[#8C6D32] dark:bg-[#1E2638] dark:text-[#D4A34B]'
              : 'bg-[#F0ECE2] text-[#1A2232] dark:bg-[#20293B] dark:text-[#E5DFD2]'
          }`}
        >
          {song.id}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-[#1A2232] dark:text-[#F3EFE6] truncate leading-snug">
            {song.title}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate">
            <span>{song.category}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{formatUnitCount(song)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(song.id);
          }}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Odstrániť ${itemType} ${song.id} z obľúbených`
              : `Pridať ${itemType} ${song.id} do obľúbených`
          }
          className={`min-w-[44px] min-h-[44px] -mr-1 flex items-center justify-center rounded-xl transition active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A34B] ${
            isFavorite
              ? 'text-[#C78F28] dark:text-[#E0AE4E] hover:bg-[#D4A34B]/10'
              : 'text-[#9CA3AF] dark:text-[#6B7280] hover:text-[#1A2232] dark:hover:text-[#F3EFE6] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Star
            className={`w-5 h-5 transition-transform ${isFavorite ? 'fill-current' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>
    );
  }
);

SongListItem.displayName = 'SongListItem';
