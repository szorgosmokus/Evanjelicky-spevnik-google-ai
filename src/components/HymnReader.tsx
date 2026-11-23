import React, { useEffect, useRef, useState } from 'react';
import {
  AlignJustify,
  ArrowLeftRight,
  Bell,
  BellOff,
  Check,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Copy,
  Eye,
  Minus,
  Moon,
  Plus,
  Settings,
  Share2,
  Star,
  Sun,
  X,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOrientation } from '../hooks/useOrientation';
import type { BookType, Song } from '../types/song';

interface HymnReaderProps {
  song: Song;
  bookType?: BookType;
  isFavorite: boolean;
  fontSize: number;
  isDark: boolean;
  isSilentActive?: boolean;
  onToggleTheme: () => void;
  onChangeFontSize: (next: number) => void;
  onToggleFavorite: (songId: number) => void;
  onNavigateSong: (songId: number) => void;
  onBack?: () => void;
  onSwitchBook?: (nextBook: BookType) => void;
  onOpenSilenceModal?: () => void;
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

function formatSongForShare(song: Song): string {
  const isPredspev = song.book === 'predspevy';
  const isAntiphon = song.book === 'antifony';
  const itemType = isPredspev ? 'Predspev' : isAntiphon ? 'Antifóna' : 'Pieseň';
  const header = `${itemType} č. ${song.id}: ${song.title} (${song.category})`;

  const body = song.stanzas
    .map((stanza) => {
      let text = '';
      if (stanza.label) text += `${stanza.label}. `;
      if (stanza.isRefrain) text += `[Refrén]\n`;
      text += stanza.lines.join('\n');
      return text;
    })
    .join('\n\n');

  return `${header}\n\n${body}\n\n— Evanjelický spevník`;
}

export const HymnReader: React.FC<HymnReaderProps> = ({
  song,
  bookType = 'piesne',
  isFavorite,
  fontSize,
  isDark,
  isSilentActive = false,
  onToggleTheme,
  onChangeFontSize,
  onToggleFavorite,
  onNavigateSong,
  onBack,
  onSwitchBook,
  onOpenSilenceModal,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [keepAwake, setKeepAwake] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [landscapeTwoCols, setLandscapeTwoCols] = useLocalStorage<boolean>(
    'spevnik:landscapeTwoCols',
    true
  );
  const { isCompactLandscape } = useOrientation();
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  const isPredspev = song.book === 'predspevy' || bookType === 'predspevy';
  const isAntiphon = !isPredspev && (song.book === 'antifony' || bookType === 'antifony');
  const maxItems = isPredspev ? 12 : isAntiphon ? 89 : 700;
  const itemLabel = isPredspev ? 'Predspev' : isAntiphon ? 'Antifóna' : 'Pieseň';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [song.id, isAntiphon, isPredspev]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [song.id, isAntiphon, isPredspev]);

  useEffect(() => {
    let cancelled = false;

    async function manageWakeLock() {
      const nav = navigator as unknown as {
        wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
      };
      if (!nav.wakeLock) return;

      if (keepAwake) {
        try {
          const lock = await nav.wakeLock.request('screen');
          if (cancelled) {
            await lock.release();
          } else {
            wakeLockRef.current = lock;
          }
        } catch {
          // Wake lock might be denied on unsupported browsers or battery saver
        }
      } else if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch {
          // Ignore release errors
        }
        wakeLockRef.current = null;
      }
    }

    manageWakeLock();
    return () => {
      cancelled = true;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [keepAwake]);

  const hasPrev = song.id > 1;
  const hasNext = song.id < maxItems;
  const useSpread = isCompactLandscape && landscapeTwoCols;

  const handleShare = async () => {
    const shareTitle = `${itemLabel} č. ${song.id}: ${song.title}`;
    const shareText = formatSongForShare(song);

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
        });
        setShareToast('Zdieľanie bolo otvorené');
        setTimeout(() => setShareToast(null), 3000);
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setShareToast('Text bol skopírovaný do schránky');
      setTimeout(() => setShareToast(null), 3000);
    } catch {
      setShareToast('Nepodarilo sa skopírovať text');
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F6F1] dark:bg-[#111622] relative">
      {/* Toast notification */}
      {shareToast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-[#1A2232] text-white dark:bg-[#F3EFE6] dark:text-[#111622] text-xs font-semibold shadow-lg flex items-center gap-2 animate-fadeIn"
        >
          <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Compact Sticky Reader Bar */}
      <div
        className={`sticky top-0 z-20 flex items-center justify-between gap-1 sm:gap-2 ${
          isCompactLandscape ? 'h-11' : 'h-14'
        } px-safe sm:px-5 bg-[#F8F6F1]/90 dark:bg-[#111622]/90 backdrop-blur-md border-b border-[#E7E2D8] dark:border-[#242D3F]`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label={`Späť na zoznam pre ${isPredspev ? 'predspevy' : isAntiphon ? 'antifóny' : 'piesne'}`}
              className="min-w-[40px] min-h-[40px] -ml-1 flex items-center justify-center rounded-xl text-[#1A2232] dark:text-[#F3EFE6] hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              <span className="font-semibold tabular-nums text-[#1A2232] dark:text-[#F3EFE6] whitespace-nowrap">
                {itemLabel} č. {song.id}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{song.category}</span>
            </div>
          </div>
        </div>

        {/* Reader Toolbar Controls */}
        <div ref={mobileMenuRef} className="relative flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Mobile phone portrait view: direct favorite star + gear menu icon */}
          <div className="flex sm:hidden items-center gap-1">
            {/* Direct Favorite Star */}
            <button
              type="button"
              onClick={() => onToggleFavorite(song.id)}
              aria-pressed={isFavorite}
              aria-label={
                isFavorite
                  ? `Odstrániť ${itemLabel.toLowerCase()} ${song.id} z obľúbených`
                  : `Pridať ${itemLabel.toLowerCase()} ${song.id} do obľúbených`
              }
              className={`min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl transition active:scale-90 ${
                isFavorite
                  ? 'text-[#C78F28] dark:text-[#E0AE4E] bg-[#D4A34B]/12'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Star
                className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
            </button>

            {/* Gear Settings Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-haspopup="true"
              aria-label="Nastavenia a možnosti zobrazenia"
              title="Nastavenia a možnosti"
              className={`min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl transition ${
                mobileMenuOpen
                  ? 'bg-[#1A2232] text-[#FAF7F0] dark:bg-[#D4A34B] dark:text-[#111622]'
                  : 'text-[#525A6B] dark:text-[#A3AAB8] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Settings className="w-5 h-5" aria-hidden="true" />
              )}
            </button>

            {/* Mobile Dropdown Popover */}
            {mobileMenuOpen && (
              <div
                role="menu"
                aria-label="Nastavenia a možnosti"
                className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-[#1A2232] border border-[#E7E2D8] dark:border-[#2A3447] shadow-2xl p-2 z-50 flex flex-col gap-1 animate-scaleUp text-[#1A2232] dark:text-[#F3EFE6]"
              >
                {/* Font Size Row */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8F6F1] dark:bg-[#111622]">
                  <span className="text-xs font-semibold text-[#525A6B] dark:text-[#A3AAB8]">
                    Veľkosť písma
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onChangeFontSize(Math.max(15, fontSize - 2))}
                      disabled={fontSize <= 15}
                      aria-label="Zmenšiť písmo"
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-white dark:bg-[#253045] border border-[#E7E2D8] dark:border-[#2A3447] text-[#1A2232] dark:text-[#F3EFE6] disabled:opacity-35"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold tabular-nums">
                      {fontSize}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChangeFontSize(Math.min(30, fontSize + 2))}
                      disabled={fontSize >= 30}
                      aria-label="Zväčšiť písmo"
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-white dark:bg-[#253045] border border-[#E7E2D8] dark:border-[#2A3447] text-[#1A2232] dark:text-[#F3EFE6] disabled:opacity-35"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick Book Switch */}
                {onSwitchBook && (
                  <div className="px-3 py-2 rounded-xl bg-[#F8F6F1] dark:bg-[#111622] space-y-1.5">
                    <span className="text-xs font-semibold text-[#525A6B] dark:text-[#A3AAB8]">
                      Prepnúť knihu
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchBook('piesne');
                          setMobileMenuOpen(false);
                        }}
                        className={`py-1.5 px-1 rounded-lg text-xs font-medium text-center transition ${
                          !isAntiphon && !isPredspev
                            ? 'bg-[#1A2232] text-white dark:bg-[#D4A34B] dark:text-[#111622] font-semibold'
                            : 'bg-white dark:bg-[#253045] hover:bg-[#EFECE4] text-[#1A2232] dark:text-[#F3EFE6]'
                        }`}
                      >
                        Piesne
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchBook('antifony');
                          setMobileMenuOpen(false);
                        }}
                        className={`py-1.5 px-1 rounded-lg text-xs font-medium text-center transition ${
                          isAntiphon
                            ? 'bg-[#1A2232] text-white dark:bg-[#D4A34B] dark:text-[#111622] font-semibold'
                            : 'bg-white dark:bg-[#253045] hover:bg-[#EFECE4] text-[#1A2232] dark:text-[#F3EFE6]'
                        }`}
                      >
                        Antifóny
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchBook('predspevy');
                          setMobileMenuOpen(false);
                        }}
                        className={`py-1.5 px-1 rounded-lg text-xs font-medium text-center transition ${
                          isPredspev
                            ? 'bg-[#1A2232] text-white dark:bg-[#D4A34B] dark:text-[#111622] font-semibold'
                            : 'bg-white dark:bg-[#253045] hover:bg-[#EFECE4] text-[#1A2232] dark:text-[#F3EFE6]'
                        }`}
                      >
                        Predspevy
                      </button>
                    </div>
                  </div>
                )}

                {/* Share Button */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    handleShare();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-3 hover:bg-[#F0ECE2] dark:hover:bg-[#222C40] transition text-left"
                >
                  <Share2 className="w-4 h-4 text-[#525A6B] dark:text-[#A3AAB8] shrink-0" />
                  <span className="flex-1 truncate">Zdieľať text cez správy</span>
                </button>

                {/* Church Silence Button */}
                {onOpenSilenceModal && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onOpenSilenceModal();
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-3 transition text-left ${
                      isSilentActive
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'hover:bg-[#F0ECE2] dark:hover:bg-[#222C40]'
                    }`}
                  >
                    {isSilentActive ? (
                      <BellOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Bell className="w-4 h-4 text-[#525A6B] dark:text-[#A3AAB8] shrink-0" />
                    )}
                    <span className="flex-1 truncate">
                      {isSilentActive ? 'Tichý režim (aktívny)' : 'Stíšiť telefón v chráme'}
                    </span>
                  </button>
                )}

                {/* Theme Switch */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-3 hover:bg-[#F0ECE2] dark:hover:bg-[#222C40] transition text-left"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-[#E0AE4E] shrink-0" />
                  ) : (
                    <Moon className="w-4 h-4 text-[#525A6B] shrink-0" />
                  )}
                  <span className="flex-1 truncate">
                    {isDark ? 'Prepnúť na svetlý režim' : 'Prepnúť na tmavý režim'}
                  </span>
                </button>

                {/* Keep Screen Awake */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setKeepAwake((v) => !v)}
                  className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-3 transition text-left ${
                    keepAwake
                      ? 'bg-[#D4A34B]/15 text-[#B8862D] dark:text-[#E0AE4E]'
                      : 'hover:bg-[#F0ECE2] dark:hover:bg-[#222C40]'
                  }`}
                >
                  <Eye className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">
                    {keepAwake ? 'Nezhasínať obrazovku (zapnuté)' : 'Zabrániť zhasnutiu obrazovky'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Desktop & Rotated Landscape expanded toolbar buttons */}
          <div className="hidden sm:flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Quick Book Switcher tabs right in reader */}
            {onSwitchBook && (
              <div
                role="tablist"
                aria-label="Rýchly výber knihy v čítačke"
                className="flex items-center p-0.5 rounded-xl bg-[#EAE4D7] dark:bg-[#1E2638] border border-[#DDD6C8] dark:border-[#29344A]"
              >
                <button
                  type="button"
                  onClick={() => onSwitchBook('piesne')}
                  title="Prepnúť na Piesne (700)"
                  className={`min-h-[30px] sm:min-h-[32px] px-2 rounded-lg text-xs font-semibold transition ${
                    !isAntiphon && !isPredspev
                      ? 'bg-white dark:bg-[#2A354C] text-[#1A2232] dark:text-[#FAF7F0] shadow-xs'
                      : 'text-[#5C6475] dark:text-[#9CA3AF] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
                  }`}
                >
                  Piesne
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchBook('antifony')}
                  title="Prepnúť na Antifóny (89)"
                  className={`min-h-[30px] sm:min-h-[32px] px-2 rounded-lg text-xs font-semibold transition ${
                    isAntiphon
                      ? 'bg-white dark:bg-[#2A354C] text-[#1A2232] dark:text-[#FAF7F0] shadow-xs'
                      : 'text-[#5C6475] dark:text-[#9CA3AF] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
                  }`}
                >
                  Antifóny
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchBook('predspevy')}
                  title="Prepnúť na Predspevy (12)"
                  className={`min-h-[30px] sm:min-h-[32px] px-2 rounded-lg text-xs font-semibold transition ${
                    isPredspev
                      ? 'bg-white dark:bg-[#2A354C] text-[#1A2232] dark:text-[#FAF7F0] shadow-xs'
                      : 'text-[#5C6475] dark:text-[#9CA3AF] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
                  }`}
                >
                  Predspevy
                </button>
              </div>
            )}

            {/* Share Button (Web Share API) */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Zdieľať text cez správy"
              title="Zdieľať text cez WhatsApp, správy alebo skopírovať"
              className="min-w-[36px] min-h-[36px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center rounded-xl text-[#525A6B] dark:text-[#A3AAB8] hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Church Silence / Mute button */}
            {onOpenSilenceModal && (
              <button
                type="button"
                onClick={onOpenSilenceModal}
                aria-label="Stíšiť telefón v chráme (Tichý režim)"
                title={isSilentActive ? 'Tichý režim v chráme je aktívny' : 'Stíšiť telefón v chráme'}
                className={`min-w-[36px] min-h-[36px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center rounded-xl transition ${
                  isSilentActive
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'text-[#525A6B] dark:text-[#A3AAB8] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {isSilentActive ? (
                  <BellOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Bell className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            )}

            {/* Font size controls */}
            <div className="flex items-center rounded-xl bg-[#EFECE4] dark:bg-[#1A2232] p-0.5">
              <button
                type="button"
                onClick={() => onChangeFontSize(Math.max(15, fontSize - 2))}
                disabled={fontSize <= 15}
                aria-label="Zmenšiť veľkosť písma"
                className="min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center rounded-lg text-[#1A2232] dark:text-[#F3EFE6] disabled:opacity-35 hover:bg-white/70 dark:hover:bg-[#253045] transition"
              >
                <Minus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <span className="px-1 text-xs font-semibold tabular-nums text-[#525A6B] dark:text-[#B4BAC6]">
                {fontSize}
              </span>
              <button
                type="button"
                onClick={() => onChangeFontSize(Math.min(30, fontSize + 2))}
                disabled={fontSize >= 30}
                aria-label="Zväčšiť veľkosť písma"
                className="min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center rounded-lg text-[#1A2232] dark:text-[#F3EFE6] disabled:opacity-35 hover:bg-white/70 dark:hover:bg-[#253045] transition"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* Toggle 2-column / 1-column layout in rotated landscape */}
            {isCompactLandscape && (
              <button
                type="button"
                onClick={() => setLandscapeTwoCols((v) => !v)}
                aria-pressed={landscapeTwoCols}
                title={landscapeTwoCols ? 'Prepnúť na jeden stĺpec' : 'Prepnúť na dva stĺpce'}
                aria-label={
                  landscapeTwoCols ? 'Zobraziť v jednom stĺpci' : 'Zobraziť v dvoch stĺpcoch'
                }
                className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl transition ${
                  landscapeTwoCols
                    ? 'bg-[#D4A34B]/15 text-[#B8862D] dark:text-[#E0AE4E]'
                    : 'text-[#525A6B] dark:text-[#A3AAB8] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {landscapeTwoCols ? (
                  <Columns2 className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <AlignJustify className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            )}

            {/* Keep Screen Awake */}
            <button
              type="button"
              onClick={() => setKeepAwake((v) => !v)}
              aria-pressed={keepAwake}
              title={
                keepAwake
                  ? 'Obrazovka ostáva zapnutá'
                  : 'Zabrániť zhasnutiu obrazovky počas bohoslužieb'
              }
              aria-label={
                keepAwake
                  ? 'Vypnúť udržiavanie zapnutej obrazovky'
                  : 'Zabrániť zhasnutiu obrazovky'
              }
              className={`min-w-[36px] min-h-[36px] hidden sm:flex items-center justify-center rounded-xl transition ${
                keepAwake
                  ? 'bg-[#D4A34B]/15 text-[#B8862D] dark:text-[#E0AE4E]'
                  : 'text-[#525A6B] dark:text-[#A3AAB8] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Prepnúť na svetlý režim' : 'Prepnúť na tmavý režim'}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-[#525A6B] dark:text-[#A3AAB8] hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#E0AE4E]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {/* Favorite Star Toggle */}
            <button
              type="button"
              onClick={() => onToggleFavorite(song.id)}
              aria-pressed={isFavorite}
              aria-label={
                isFavorite
                  ? `Odstrániť ${itemLabel.toLowerCase()} ${song.id} z obľúbených`
                  : `Pridať ${itemLabel.toLowerCase()} ${song.id} do obľúbených`
              }
              className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition active:scale-90 ${
                isFavorite
                  ? 'text-[#C78F28] dark:text-[#E0AE4E] bg-[#D4A34B]/12'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Star
                className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Lyrics Content */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto px-safe sm:px-10 ${
          isCompactLandscape ? 'py-4' : 'py-6 sm:py-10'
        }`}
      >
        <article className={`${useSpread ? 'max-w-4xl' : 'max-w-2xl'} mx-auto`}>
          <header
            className={`${
              isCompactLandscape ? 'pb-3' : 'pb-6'
            } border-b border-[#E7E2D8] dark:border-[#242D3F]`}
          >
            <div className="flex items-center gap-2 text-xs font-medium text-[#8C6D32] dark:text-[#D4A34B]">
              <span className="font-semibold uppercase tracking-wider">{itemLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{song.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatUnitCount(song)}</span>
            </div>
            <h1
              className={`mt-1 font-hymnal ${
                isCompactLandscape ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'
              } font-bold tracking-tight tabular-nums text-[#1A2232] dark:text-[#FAF7F0]`}
            >
              {song.id}
            </h1>
          </header>

          <div
            className={`${
              isCompactLandscape ? 'mt-4 space-y-4' : 'mt-7 space-y-6'
            } font-hymnal text-[#1A2232] dark:text-[#EFEAE0] ${
              useSpread ? 'hymn-landscape-spread' : ''
            }`}
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.65 }}
          >
            {song.stanzas.map((stanza, index) => {
              if (stanza.isSubheader) {
                return (
                  <h2
                    key={index}
                    className="break-after-avoid pt-3 pb-1 text-base font-sans font-semibold tracking-tight text-[#8C6D32] dark:text-[#D4A34B] border-b border-[#E7E2D8] dark:border-[#242D3F]"
                  >
                    {stanza.label}
                  </h2>
                );
              }

              if (stanza.isRefrain) {
                return (
                  <div
                    key={index}
                    className="break-inside-avoid rounded-2xl bg-[#EFECE4]/80 dark:bg-[#1A2232] px-5 py-4"
                  >
                    <p className="font-sans text-xs font-semibold uppercase tracking-wider text-[#8C6D32] dark:text-[#D4A34B] mb-1.5">
                      Refrén
                    </p>
                    <div className="italic space-y-0.5">
                      {stanza.lines.map((line, lIdx) => (
                        <p key={lIdx}>{line}</p>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className="break-inside-avoid flex gap-3.5 sm:gap-5 items-baseline"
                >
                  {stanza.label && (
                    <span className="font-sans text-sm font-bold tabular-nums text-[#8C6D32] dark:text-[#D4A34B] w-6 shrink-0 select-none">
                      {stanza.label}.
                    </span>
                  )}
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    {stanza.lines.map((line, lIdx) => {
                      const speakerMatch = line.match(/^(Liturg:|Zbor:|L\.:|Zb\.:|Kňaz:|L:|Zb:)\s*(.*)$/);
                      if (speakerMatch) {
                        const isLeader = /^(Liturg:|Kňaz:|L\.:|L:)/.test(speakerMatch[1]);
                        return (
                          <div
                            key={lIdx}
                            className={`p-3 rounded-xl ${
                              isLeader
                                ? 'bg-[#EAE4D7]/50 dark:bg-[#1A2232]/80 border-l-4 border-[#B8862D] dark:border-[#D4A34B]'
                                : 'bg-[#EFECE4]/30 dark:bg-[#161D2B]/60 border-l-4 border-[#525A6B] dark:border-[#6B7280]'
                            }`}
                          >
                            <span className="inline-block px-2 py-0.5 mb-1 rounded font-sans text-[11px] font-bold uppercase tracking-wider bg-[#8C6D32]/12 text-[#8C6D32] dark:bg-[#D4A34B]/20 dark:text-[#E0AE4E]">
                              {speakerMatch[1]}
                            </span>
                            <p className="leading-snug">{speakerMatch[2]}</p>
                          </div>
                        );
                      }
                      return <p key={lIdx}>{line}</p>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Previous / Next Footer Navigation */}
          <nav
            aria-label={`Susedné ${isPredspev ? 'predspevy' : isAntiphon ? 'antifóny' : 'piesne'}`}
            className={`${
              isCompactLandscape ? 'mt-6 pt-4 pb-4' : 'mt-12 pt-6 pb-8'
            } border-t border-[#E7E2D8] dark:border-[#242D3F] flex items-center justify-between gap-3`}
          >
            <button
              type="button"
              onClick={() => hasPrev && onNavigateSong(song.id - 1)}
              disabled={!hasPrev}
              className="inline-flex items-center gap-2 min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl bg-white dark:bg-[#1A2232] border border-[#E7E2D8] dark:border-[#2A3447] text-xs sm:text-sm font-medium text-[#1A2232] dark:text-[#F3EFE6] hover:bg-[#EFECE4] dark:hover:bg-[#232D42] disabled:opacity-35 transition"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span className="tabular-nums">
                {hasPrev ? `${itemLabel} ${song.id - 1}` : 'Začiatok'}
              </span>
            </button>

            {onSwitchBook && (
              <button
                type="button"
                onClick={() =>
                  onSwitchBook(isPredspev ? 'piesne' : isAntiphon ? 'predspevy' : 'antifony')
                }
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8C6D32] dark:text-[#D4A34B] hover:bg-[#B8862D]/10 transition"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>
                  Prepnúť knihu ({isPredspev ? 'Piesne' : isAntiphon ? 'Predspevy' : 'Antifóny'})
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => hasNext && onNavigateSong(song.id + 1)}
              disabled={!hasNext}
              className="inline-flex items-center gap-2 min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl bg-white dark:bg-[#1A2232] border border-[#E7E2D8] dark:border-[#2A3447] text-xs sm:text-sm font-medium text-[#1A2232] dark:text-[#F3EFE6] hover:bg-[#EFECE4] dark:hover:bg-[#232D42] disabled:opacity-35 transition"
            >
              <span className="tabular-nums">
                {hasNext ? `${itemLabel} ${song.id + 1}` : 'Koniec'}
              </span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </nav>
        </article>
      </div>
    </div>
  );
};
