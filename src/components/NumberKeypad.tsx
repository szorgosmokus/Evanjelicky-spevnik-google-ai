import React, { useEffect, useState } from 'react';
import { ArrowRight, Delete, Star } from 'lucide-react';
import { useOrientation } from '../hooks/useOrientation';
import type { BookType, Song } from '../types/song';

interface NumberKeypadProps {
  bookType: BookType;
  onSelectBookType: (book: BookType) => void;
  songsById: Map<number, Song>;
  antiphonsById: Map<number, Song>;
  predspevyById: Map<number, Song>;
  favoritesSet: Set<number>;
  onOpenSong: (songId: number, book: BookType) => void;
  onToggleFavorite: (songId: number, book: BookType) => void;
}

export const NumberKeypad: React.FC<NumberKeypadProps> = ({
  bookType,
  onSelectBookType,
  songsById,
  antiphonsById,
  predspevyById,
  favoritesSet,
  onOpenSong,
  onToggleFavorite,
}) => {
  const [digits, setDigits] = useState('');
  const { isCompactLandscape } = useOrientation();

  const isAntiphon = bookType === 'antifony';
  const isPredspev = bookType === 'predspevy';
  const maxNumber = isPredspev ? 12 : isAntiphon ? 89 : 700;
  const maxDigits = isPredspev ? 2 : isAntiphon ? 2 : 3;
  const currentMap = isPredspev ? predspevyById : isAntiphon ? antiphonsById : songsById;
  const itemLabel = isPredspev ? 'Predspev' : isAntiphon ? 'Antifóna' : 'Pieseň';

  const parsedNum = digits ? parseInt(digits, 10) : null;
  const matchedItem = parsedNum ? currentMap.get(parsedNum) ?? null : null;
  const isOutOfRange = parsedNum !== null && (parsedNum < 1 || parsedNum > maxNumber);

  // Clear digits when switching book
  const handleSwitchBook = (newBook: BookType) => {
    if (newBook !== bookType) {
      setDigits('');
      onSelectBookType(newBook);
    }
  };

  const appendDigit = (d: string) => {
    setDigits((prev) => {
      if (prev === '' && d === '0') return '';
      if (prev.length >= maxDigits) return prev;
      return prev + d;
    });
  };

  const backspace = () => {
    setDigits((prev) => prev.slice(0, -1));
  };

  const clear = () => {
    setDigits('');
  };

  const handleOpen = () => {
    if (matchedItem) {
      onOpenSong(matchedItem.id, bookType);
      setDigits('');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (/^[0-9]$/.test(e.key)) {
        appendDigit(e.key);
      } else if (e.key === 'Backspace') {
        backspace();
      } else if (e.key === 'Escape') {
        clear();
      } else if (e.key === 'Enter' && matchedItem) {
        handleOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div
      className={`w-full mx-auto px-4 ${
        isCompactLandscape
          ? 'max-w-2xl py-2 grid grid-cols-2 gap-5 items-center'
          : 'max-w-sm py-4 flex flex-col gap-4'
      }`}
    >
      {/* Top Book Selector within Keypad */}
      <div className={`${isCompactLandscape ? 'col-span-2' : ''} w-full`}>
        <div
          role="tablist"
          aria-label="Výber knihy v číselníku"
          className="grid grid-cols-3 p-1 rounded-xl bg-[#EAE4D7] dark:bg-[#1A2232]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={bookType === 'piesne'}
            onClick={() => handleSwitchBook('piesne')}
            className={`min-h-[36px] px-2 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap tabular-nums text-center ${
              bookType === 'piesne'
                ? 'bg-white dark:bg-[#263147] text-[#1A2232] dark:text-[#FAF7F0] shadow-xs'
                : 'text-[#5C6475] dark:text-[#9CA3AF] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
            }`}
          >
            Piesne (1–700)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={bookType === 'antifony'}
            onClick={() => handleSwitchBook('antifony')}
            className={`min-h-[36px] px-2 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap tabular-nums text-center ${
              bookType === 'antifony'
                ? 'bg-white dark:bg-[#263147] text-[#1A2232] dark:text-[#FAF7F0] shadow-xs'
                : 'text-[#5C6475] dark:text-[#9CA3AF] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
            }`}
          >
            Antifóny (1–89)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={bookType === 'predspevy'}
            onClick={() => handleSwitchBook('predspevy')}
            className={`min-h-[36px] px-2 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap tabular-nums text-center ${
              bookType === 'predspevy'
                ? 'bg-white dark:bg-[#263147] text-[#1A2232] dark:text-[#FAF7F0] shadow-xs'
                : 'text-[#5C6475] dark:text-[#9CA3AF] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
            }`}
          >
            Predspevy (1–12)
          </button>
        </div>
      </div>

      {/* Left column (in landscape) / Top (in portrait): Preview + Open CTA */}
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl bg-white dark:bg-[#1A2232] border border-[#E7E2D8] dark:border-[#2A3447] p-4 min-h-[104px] flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                Zadajte číslo {isPredspev ? 'predspevu (1–12)' : isAntiphon ? 'antifóny (1–89)' : 'piesne (1–700)'}
              </p>
              <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-[#1A2232] dark:text-[#F3EFE6]">
                {digits ? `č. ${digits}` : 'č. —'}
              </div>
            </div>

            {matchedItem && (
              <button
                type="button"
                onClick={() => onToggleFavorite(matchedItem.id, bookType)}
                aria-pressed={favoritesSet.has(matchedItem.id)}
                aria-label={
                  favoritesSet.has(matchedItem.id)
                    ? `Odstrániť ${itemLabel.toLowerCase()} ${matchedItem.id} z obľúbených`
                    : `Pridať ${itemLabel.toLowerCase()} ${matchedItem.id} do obľúbených`
                }
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition ${
                  favoritesSet.has(matchedItem.id)
                    ? 'text-[#C78F28] dark:text-[#E0AE4E] bg-[#D4A34B]/10'
                    : 'text-[#9CA3AF] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Star
                  className={`w-5 h-5 ${favoritesSet.has(matchedItem.id) ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-[#F0ECE2] dark:border-[#253045]">
            {matchedItem ? (
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1A2232] dark:text-[#F3EFE6] truncate">
                  {matchedItem.title}
                </p>
                <p className="text-xs text-[#8C6D32] dark:text-[#D4A34B] truncate">
                  {matchedItem.category}
                </p>
              </div>
            ) : isOutOfRange ? (
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {isPredspev
                  ? 'Predspevy obsahujú čísla od 1 do 12.'
                  : isAntiphon
                  ? 'Kniha obsahuje antifóny od 1 do 89.'
                  : 'Spevník obsahuje piesne od 1 do 700.'}
              </p>
            ) : (
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                Ťuknite na číslice a prejdite priamo na text.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpen}
          disabled={!matchedItem}
          className={`w-full ${
            isCompactLandscape ? 'min-h-[44px] py-2.5' : 'min-h-[48px] py-3'
          } px-5 rounded-2xl bg-[#1A2232] text-[#FAF7F0] dark:bg-[#D4A34B] dark:text-[#111622] text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-90 disabled:opacity-35 active:scale-[0.98] transition`}
        >
          <span>
            {matchedItem
              ? `Otvoriť ${itemLabel.toLowerCase()} č. ${matchedItem.id}`
              : `Zadajte číslo ${itemLabel.toLowerCase()}`}
          </span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Right column (in landscape) / Bottom (in portrait): Numeric Keypad Grid */}
      <div className={`grid grid-cols-3 ${isCompactLandscape ? 'gap-2' : 'gap-2.5'}`}>
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => appendDigit(k)}
            className={`${
              isCompactLandscape ? 'h-11 text-lg' : 'h-14 text-xl'
            } rounded-2xl bg-white dark:bg-[#1A2232] border border-[#E7E2D8] dark:border-[#2A3447] font-semibold tabular-nums text-[#1A2232] dark:text-[#F3EFE6] hover:bg-[#F3EFE6] dark:hover:bg-[#232D42] active:scale-[0.97] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A34B]`}
          >
            {k}
          </button>
        ))}

        <button
          type="button"
          onClick={clear}
          disabled={!digits}
          className={`${
            isCompactLandscape ? 'h-11' : 'h-14'
          } rounded-2xl bg-[#F0ECE2] dark:bg-[#161D2B] text-xs font-semibold text-[#525A6B] dark:text-[#A3AAB8] hover:bg-[#E7E2D8] dark:hover:bg-[#222C40] disabled:opacity-40 active:scale-[0.97] transition`}
        >
          Zmazať
        </button>

        <button
          type="button"
          onClick={() => appendDigit('0')}
          className={`${
            isCompactLandscape ? 'h-11 text-lg' : 'h-14 text-xl'
          } rounded-2xl bg-white dark:bg-[#1A2232] border border-[#E7E2D8] dark:border-[#2A3447] font-semibold tabular-nums text-[#1A2232] dark:text-[#F3EFE6] hover:bg-[#F3EFE6] dark:hover:bg-[#232D42] active:scale-[0.97] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A34B]`}
        >
          0
        </button>

        <button
          type="button"
          onClick={backspace}
          disabled={!digits}
          aria-label="Vymazať poslednú číslicu"
          className={`${
            isCompactLandscape ? 'h-11' : 'h-14'
          } rounded-2xl bg-[#F0ECE2] dark:bg-[#161D2B] flex items-center justify-center text-[#525A6B] dark:text-[#A3AAB8] hover:bg-[#E7E2D8] dark:hover:bg-[#222C40] disabled:opacity-40 active:scale-[0.97] transition`}
        >
          <Delete className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
