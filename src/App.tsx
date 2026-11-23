import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BellOff,
  BookOpen,
  Hash,
  Moon,
  Music,
  Scroll,
  Search,
  Star,
  Sun,
  X,
} from 'lucide-react';
import songsRaw from './data/songs.json';
import antiphonsRaw from './data/antiphons.json';
import predspevyRaw from './data/predspevy.json';
import { ChurchSilenceModal } from './components/ChurchSilenceModal';
import { HymnReader } from './components/HymnReader';
import { NumberKeypad } from './components/NumberKeypad';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SongListItem } from './components/SongListItem';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useOrientation } from './hooks/useOrientation';
import type { BookType, FavoritesSortOrder, MainViewTab, Song } from './types/song';
import { normalizeQuery } from './utils/search';

const ALL_SONGS = songsRaw as Song[];
const ALL_ANTIPHONS = antiphonsRaw as Song[];
const ALL_PREDSPEVY = predspevyRaw as Song[];

const CATEGORIES_PIESNE = [
  'Všetky',
  'Advent',
  'Vianoce',
  'Nový rok',
  'Pôst',
  'Veľká noc',
  'Vstúpenie',
  'Svätodušné',
  'Svätá Trojica',
  'Služby Božie',
  'Chvály a modlitby',
  'Kresťanský život',
  'Cirkev a príležitosti',
  'Kánony a žalmy',
  'Nádej večnosti',
];

const CATEGORIES_ANTIFONY = [
  'Všetky',
  'Adventné',
  'Vianočné',
  'Na rozhraní rokov',
  'Pôstne',
  'Veľkonočné',
  'Vstúpenie Krista Pána',
  'Zoslanie Ducha Svätého',
  'Trojjediný Boh',
  'Nedele potrojičné',
  'Cirkev a jej pôsobenie',
  'Sviatosti',
  'Posvätenie chrámu',
  'Poďakovanie za úrody',
  'Kajúce dni',
  'Pamiatka zosnulých',
  'Iné',
];

const CATEGORIES_PREDSPEVY = [
  'Všetky',
  'Advent',
  'Vianoce',
  'Pôst',
  'Veľká noc',
  'Slávnosti',
  'Svätodušné',
  'Poďakovanie',
  'Vstupné verše',
  'Trojjediný Boh',
];

export default function App() {
  const [currentBook, setCurrentBook] = useLocalStorage<BookType>('spevnik:currentBook', 'piesne');
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('spevnik:theme', 'light');
  const [fontSize, setFontSize] = useLocalStorage<number>('spevnik:fontSize', 19);
  const [favoritesPiesne, setFavoritesPiesne] = useLocalStorage<number[]>('spevnik:favorites', []);
  const [favoritesAntifony, setFavoritesAntifony] = useLocalStorage<number[]>(
    'spevnik:favoritesAntifony',
    []
  );
  const [favoritesPredspevy, setFavoritesPredspevy] = useLocalStorage<number[]>(
    'spevnik:favoritesPredspevy',
    []
  );
  const [selectedSongId, setSelectedSongId] = useLocalStorage<number>('spevnik:lastSongId', 1);
  const [selectedAntiphonId, setSelectedAntiphonId] = useLocalStorage<number>(
    'spevnik:lastAntiphonId',
    1
  );
  const [selectedPredspevId, setSelectedPredspevId] = useLocalStorage<number>(
    'spevnik:lastPredspevId',
    1
  );
  const [activeTab, setActiveTab] = useState<MainViewTab>('all');
  const [favoritesSort, setFavoritesSort] = useLocalStorage<FavoritesSortOrder>(
    'spevnik:favSort',
    'number'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('Všetky');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowReader, setMobileShowReader] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(100);
  const [isSilentActive, setIsSilentActive] = useLocalStorage<boolean>(
    'spevnik:isSilentActive',
    false
  );
  const [showSilenceModal, setShowSilenceModal] = useState(false);

  const listScrollRef = useRef<HTMLDivElement>(null);
  const { isCompactLandscape } = useOrientation();

  const isDark = theme === 'dark';
  const isAntiphon = currentBook === 'antifony';
  const isPredspev = currentBook === 'predspevy';

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', isDark ? '#111622' : '#1A2232');
    }
  }, [isDark]);

  const songsById = useMemo(() => {
    const map = new Map<number, Song>();
    for (const s of ALL_SONGS) {
      map.set(s.id, s);
    }
    return map;
  }, []);

  const antiphonsById = useMemo(() => {
    const map = new Map<number, Song>();
    for (const a of ALL_ANTIPHONS) {
      map.set(a.id, a);
    }
    return map;
  }, []);

  const predspevyById = useMemo(() => {
    const map = new Map<number, Song>();
    for (const p of ALL_PREDSPEVY) {
      map.set(p.id, p);
    }
    return map;
  }, []);

  const currentItems = isPredspev
    ? ALL_PREDSPEVY
    : isAntiphon
    ? ALL_ANTIPHONS
    : ALL_SONGS;
  const currentCategories = isPredspev
    ? CATEGORIES_PREDSPEVY
    : isAntiphon
    ? CATEGORIES_ANTIFONY
    : CATEGORIES_PIESNE;
  const currentFavorites = isPredspev
    ? favoritesPredspevy
    : isAntiphon
    ? favoritesAntifony
    : favoritesPiesne;
  const currentMap = isPredspev
    ? predspevyById
    : isAntiphon
    ? antiphonsById
    : songsById;
  const favoritesSet = useMemo(() => new Set(currentFavorites), [currentFavorites]);

  const switchBook = (book: BookType) => {
    if (book !== currentBook) {
      setCurrentBook(book);
      setSelectedCategory('Všetky');
      setSearchQuery('');
    }
  };

  const toggleFavorite = (id: number, book: BookType = currentBook) => {
    if (book === 'piesne') {
      setFavoritesPiesne((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
      );
    } else if (book === 'antifony') {
      setFavoritesAntifony((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
      );
    } else {
      setFavoritesPredspevy((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
      );
    }
  };

  const openItem = (id: number, book: BookType = currentBook) => {
    if (book !== currentBook) {
      setCurrentBook(book);
    }
    if (book === 'piesne') {
      setSelectedSongId(id);
    } else if (book === 'antifony') {
      setSelectedAntiphonId(id);
    } else {
      setSelectedPredspevId(id);
    }
    setMobileShowReader(true);
  };

  const normalizedQuery = useMemo(() => normalizeQuery(searchQuery), [searchQuery]);

  const displayedItems = useMemo(() => {
    let base: Song[];
    if (activeTab === 'favorites') {
      const favList = currentFavorites
        .map((id) => currentMap.get(id))
        .filter((s): s is Song => Boolean(s));
      base =
        favoritesSort === 'number'
          ? [...favList].sort((a, b) => a.id - b.id)
          : favList;
    } else {
      base =
        selectedCategory === 'Všetky'
          ? currentItems
          : currentItems.filter((s) => s.category === selectedCategory);
    }

    if (!normalizedQuery) return base;

    const isNumericQuery = /^\d+$/.test(normalizedQuery);
    if (isNumericQuery) {
      const exactNum = parseInt(normalizedQuery, 10);
      const exactMatches = base.filter((s) => s.id === exactNum);
      const prefixMatches = base.filter(
        (s) => s.id !== exactNum && String(s.id).startsWith(normalizedQuery)
      );
      const textMatches = base.filter(
        (s) =>
          s.id !== exactNum &&
          !String(s.id).startsWith(normalizedQuery) &&
          s.searchNorm.includes(normalizedQuery)
      );
      return [...exactMatches, ...prefixMatches, ...textMatches];
    }

    return base.filter((s) => s.searchNorm.includes(normalizedQuery));
  }, [
    activeTab,
    currentBook,
    currentFavorites,
    currentItems,
    currentMap,
    favoritesSort,
    normalizedQuery,
    selectedCategory,
  ]);

  useEffect(() => {
    setVisibleLimit(100);
    listScrollRef.current?.scrollTo({ top: 0 });
  }, [activeTab, currentBook, selectedCategory, normalizedQuery]);

  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      visibleLimit < displayedItems.length &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - 400
    ) {
      setVisibleLimit((prev) => Math.min(displayedItems.length, prev + 100));
    }
  };

  const activeItem = isPredspev
    ? predspevyById.get(selectedPredspevId) ?? ALL_PREDSPEVY[0]
    : isAntiphon
    ? antiphonsById.get(selectedAntiphonId) ?? ALL_ANTIPHONS[0]
    : songsById.get(selectedSongId) ?? ALL_SONGS[0];

  const visibleItems = displayedItems.slice(0, visibleLimit);

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F8F6F1] dark:bg-[#111622] text-[#1A2232] dark:text-[#F3EFE6] overflow-hidden">
      {/* Top Bar — compact 44px in rotated phone landscape, 56px otherwise */}
      <header
        className={`${mobileShowReader ? 'hidden lg:flex' : 'flex'} items-center justify-between gap-2 sm:gap-6 ${
          isCompactLandscape ? 'h-11' : 'h-14'
        } px-safe sm:px-6 bg-[#F8F6F1] dark:bg-[#111622] border-b border-[#E7E2D8] dark:border-[#242D3F] shrink-0 z-30`}
      >
        {/* Zone 1: Single-line Brand Title & High-Visibility Book Switch */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setMobileShowReader(false);
            }}
            className="flex items-center gap-2 font-hymnal text-lg sm:text-xl font-bold tracking-tight text-[#1A2232] dark:text-[#FAF7F0] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4A34B]"
          >
            <img
              src="/pwa-192x192.png"
              alt="Lutherova ruža"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 shadow-xs"
            />
            <span className="hidden sm:inline">Spevník</span>
          </button>

          {/* Primary Book Selector (Piesne 700, Antifóny 89, Predspevy 12) — prominently placed in top bar */}
          <div
            role="tablist"
            aria-label="Výber knihy"
            className="flex items-center p-0.5 rounded-xl bg-[#EAE4D7] dark:bg-[#1E2638] border border-[#DDD6C8] dark:border-[#29344A]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={currentBook === 'piesne'}
              onClick={() => switchBook('piesne')}
              className={`min-h-[32px] sm:min-h-[34px] px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-semibold transition inline-flex items-center gap-1 whitespace-nowrap tabular-nums ${
                currentBook === 'piesne'
                  ? 'bg-white dark:bg-[#2A354C] text-[#1A2232] dark:text-[#FAF7F0] shadow-xs'
                  : 'text-[#5C6475] dark:text-[#9CA3AF] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 hidden md:inline" aria-hidden="true" />
              <span>Piesne</span>
              <span className="hidden xl:inline text-[10px] opacity-75 font-normal">(700)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentBook === 'antifony'}
              onClick={() => switchBook('antifony')}
              className={`min-h-[32px] sm:min-h-[34px] px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-semibold transition inline-flex items-center gap-1 whitespace-nowrap tabular-nums ${
                currentBook === 'antifony'
                  ? 'bg-white dark:bg-[#2A354C] text-[#1A2232] dark:text-[#FAF7F0] shadow-xs'
                  : 'text-[#5C6475] dark:text-[#9CA3AF] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
              }`}
            >
              <Scroll className="w-3.5 h-3.5 hidden md:inline" aria-hidden="true" />
              <span>Antifóny</span>
              <span className="hidden xl:inline text-[10px] opacity-75 font-normal">(89)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentBook === 'predspevy'}
              onClick={() => switchBook('predspevy')}
              className={`min-h-[32px] sm:min-h-[34px] px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-semibold transition inline-flex items-center gap-1 whitespace-nowrap tabular-nums ${
                currentBook === 'predspevy'
                  ? 'bg-white dark:bg-[#2A354C] text-[#1A2232] dark:text-[#FAF7F0] shadow-xs'
                  : 'text-[#5C6475] dark:text-[#9CA3AF] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
              }`}
            >
              <Music className="w-3.5 h-3.5 hidden md:inline" aria-hidden="true" />
              <span>Predspevy</span>
              <span className="hidden xl:inline text-[10px] opacity-75 font-normal">(12)</span>
            </button>
          </div>
        </div>

        {/* Zone 2: Desktop & Rotated Landscape Navigation Links */}
        <nav
          aria-label="Hlavná navigácia"
          className={`${
            isCompactLandscape ? 'flex' : 'hidden lg:flex'
          } items-center gap-5 sm:gap-7 text-sm font-medium`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'all'
                ? 'text-[#1A2232] dark:text-[#FAF7F0] border-[#B8862D] dark:border-[#D4A34B]'
                : 'text-[#5C6475] dark:text-[#9CA3AF] border-transparent hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
            }`}
          >
            {isPredspev ? 'Všetky predspevy' : isAntiphon ? 'Všetky antifóny' : 'Všetky piesne'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 tabular-nums ${
              activeTab === 'favorites'
                ? 'text-[#1A2232] dark:text-[#FAF7F0] border-[#B8862D] dark:border-[#D4A34B]'
                : 'text-[#5C6475] dark:text-[#9CA3AF] border-transparent hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
            }`}
          >
            Obľúbené{currentFavorites.length > 0 ? ` (${currentFavorites.length})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('keypad')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'keypad'
                ? 'text-[#1A2232] dark:text-[#FAF7F0] border-[#B8862D] dark:border-[#D4A34B]'
                : 'text-[#5C6475] dark:text-[#9CA3AF] border-transparent hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
            }`}
          >
            Číselník
          </button>
        </nav>

        {/* Zone 3: Church Silence Mode, Install & Theme Switch */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Church Silence Mode Button */}
          <button
            type="button"
            onClick={() => setShowSilenceModal(true)}
            aria-label="Tichý režim v chráme (Stíšiť telefón)"
            title={
              isSilentActive
                ? 'Tichý režim v chráme je zapnutý'
                : 'Stíšiť telefón v chráme'
            }
            className={`min-h-[38px] px-2.5 sm:px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              isSilentActive
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                : 'text-[#525A6B] dark:text-[#A3AAB8] hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
            }`}
          >
            {isSilentActive ? (
              <BellOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            ) : (
              <Bell className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {isSilentActive ? 'Tichý režim' : 'Stíšiť telefón'}
            </span>
          </button>

          <PWAInstallButton />

          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Prepnúť na svetlý režim' : 'Prepnúť na tmavý režim'}
            className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-[#525A6B] dark:text-[#A3AAB8] hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-[#E0AE4E]" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area: Desktop Master-Detail / Mobile Single-Pane */}
      <div className="flex-1 min-h-0 flex lg:grid lg:grid-cols-[410px_1fr]">
        {/* Left Navigation & Song Index Pane */}
        <aside
          className={`${
            mobileShowReader ? 'hidden lg:flex' : 'flex'
          } flex-col w-full h-full min-h-0 border-r border-[#E7E2D8] dark:border-[#242D3F] bg-[#F8F6F1] dark:bg-[#111622]`}
        >
          {/* Main Screen Quick Access: Search + All / Favorites Segmented Switch */}
          {activeTab !== 'keypad' && (
            <div
              className={`px-safe sm:px-4 ${
                isCompactLandscape ? 'pt-2 pb-2 space-y-2' : 'pt-3 pb-2.5 space-y-2.5'
              } shrink-0 border-b border-[#EAE5DC] dark:border-[#1E2636]`}
            >
              {/* On rotated phone landscape, search bar & All/Favorites tabs sit side-by-side to preserve vertical height */}
              <div
                className={`flex ${
                  isCompactLandscape ? 'flex-row items-center gap-2.5' : 'flex-col gap-2.5'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative flex-1 min-w-0">
                    <Search
                      className="w-4 h-4 text-[#6B7280] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        activeTab === 'favorites'
                          ? `Filtrovať obľúbené ${
                              isPredspev ? 'predspevy' : isAntiphon ? 'antifóny' : 'piesne'
                            }...`
                          : `Hľadať číslo (1–${isPredspev ? '12' : isAntiphon ? '89' : '700'}), názov alebo text...`
                      }
                      aria-label={`Hľadať v ${
                        isPredspev ? 'predspevoch' : isAntiphon ? 'antifónach' : 'piesňach'
                      }`}
                      className={`w-full ${
                        isCompactLandscape ? 'h-10' : 'h-11'
                      } pl-10 pr-9 rounded-xl bg-white dark:bg-[#1A2232] border border-[#E7E2D8] dark:border-[#2A3447] text-sm text-[#1A2232] dark:text-[#F3EFE6] placeholder:text-[#8E95A2] focus:outline-none focus:border-[#B8862D] dark:focus:border-[#D4A34B] transition`}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Vymazať vyhľadávanie"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('keypad')}
                    aria-label="Otvoriť číselník"
                    title={`Rýchly prechod podľa čísla (${
                      isPredspev ? '1–12' : isAntiphon ? '1–89' : '1–700'
                    })`}
                    className={`min-w-[44px] ${
                      isCompactLandscape ? 'h-10' : 'h-11'
                    } px-3 rounded-xl bg-white dark:bg-[#1A2232] border border-[#E7E2D8] dark:border-[#2A3447] flex items-center justify-center text-[#1A2232] dark:text-[#F3EFE6] hover:bg-[#EFECE4] dark:hover:bg-[#232D42] transition shrink-0`}
                  >
                    <Hash className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {/* Prominent Main-Screen List / Favorites Switch */}
                <div
                  role="tablist"
                  aria-label="Prepínač zoznamu"
                  className={`${
                    isCompactLandscape ? 'w-72 shrink-0' : 'w-full'
                  } grid grid-cols-2 p-1 rounded-xl bg-[#EAE4D7] dark:bg-[#1A2232]`}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'all'}
                    onClick={() => setActiveTab('all')}
                    className={`${
                      isCompactLandscape ? 'min-h-[32px]' : 'min-h-[36px]'
                    } px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap tabular-nums ${
                      activeTab === 'all'
                        ? 'bg-white dark:bg-[#263147] text-[#1A2232] dark:text-[#FAF7F0] shadow-xs'
                        : 'text-[#5C6475] dark:text-[#9CA3AF] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
                    }`}
                  >
                    {isPredspev ? 'Všetky (12)' : isAntiphon ? 'Všetky (89)' : 'Všetky (700)'}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'favorites'}
                    onClick={() => setActiveTab('favorites')}
                    className={`${
                      isCompactLandscape ? 'min-h-[32px]' : 'min-h-[36px]'
                    } px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap inline-flex items-center justify-center gap-1.5 tabular-nums ${
                      activeTab === 'favorites'
                        ? 'bg-white dark:bg-[#263147] text-[#1A2232] dark:text-[#FAF7F0] shadow-xs'
                        : 'text-[#5C6475] dark:text-[#9CA3AF] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        activeTab === 'favorites' || currentFavorites.length > 0
                          ? 'fill-[#C78F28] text-[#C78F28] dark:fill-[#E0AE4E] dark:text-[#E0AE4E]'
                          : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span>Obľúbené ({currentFavorites.length})</span>
                  </button>
                </div>
              </div>

              {/* Liturgical Category Filter Strip (All Items tab) */}
              {activeTab === 'all' && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {currentCategories.map((category) => {
                    const active = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`${
                          isCompactLandscape ? 'min-h-[30px] py-1' : 'min-h-[34px] py-1.5'
                        } px-3 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition ${
                          active
                            ? 'bg-[#1A2232] text-[#FAF7F0] dark:bg-[#D4A34B] dark:text-[#111622]'
                            : 'bg-[#EFECE4] dark:bg-[#1A2232] text-[#525A6B] dark:text-[#A3AAB8] hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Favorites Sort Controls (Favorites tab) */}
              {activeTab === 'favorites' && currentFavorites.length > 1 && (
                <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  <span>Uložené pre rýchly prístup</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFavoritesSort('number')}
                      className={`px-2 py-1 rounded-md font-medium transition ${
                        favoritesSort === 'number'
                          ? 'bg-[#EAE4D7] dark:bg-[#253045] text-[#1A2232] dark:text-[#F3EFE6]'
                          : 'hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
                      }`}
                    >
                      Podľa čísla
                    </button>
                    <button
                      type="button"
                      onClick={() => setFavoritesSort('recent')}
                      className={`px-2 py-1 rounded-md font-medium transition ${
                        favoritesSort === 'recent'
                          ? 'bg-[#EAE4D7] dark:bg-[#253045] text-[#1A2232] dark:text-[#F3EFE6]'
                          : 'hover:text-[#1A2232] dark:hover:text-[#F3EFE6]'
                      }`}
                    >
                      Naposledy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Body: Number Keypad OR Item List */}
          {activeTab === 'keypad' ? (
            <div
              className={`flex-1 overflow-y-auto px-safe ${
                isCompactLandscape ? 'pb-4' : 'pb-20 lg:pb-6'
              } flex flex-col`}
            >
              <div className="px-2 pt-2.5 flex items-center justify-between max-w-2xl w-full mx-auto">
                <h2 className="text-sm font-semibold text-[#1A2232] dark:text-[#F3EFE6]">
                  Rýchly výber podľa čísla
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="min-h-[36px] px-3 rounded-lg text-xs font-medium text-[#525A6B] dark:text-[#A3AAB8] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Zoznam {isPredspev ? 'predspevov' : isAntiphon ? 'antifón' : 'piesní'}
                </button>
              </div>
              <NumberKeypad
                bookType={currentBook}
                onSelectBookType={switchBook}
                songsById={songsById}
                antiphonsById={antiphonsById}
                predspevyById={predspevyById}
                favoritesSet={favoritesSet}
                onOpenSong={(id, book) => openItem(id, book)}
                onToggleFavorite={(id, book) => toggleFavorite(id, book)}
              />
            </div>
          ) : (
            <div
              ref={listScrollRef}
              onScroll={handleListScroll}
              className={`flex-1 overflow-y-auto px-safe sm:px-2.5 py-2 ${
                isCompactLandscape ? 'pb-4' : 'pb-20 lg:pb-4'
              } space-y-0.5`}
            >
              {activeTab === 'favorites' && currentFavorites.length === 0 ? (
                <div className="px-5 py-10 text-center max-w-xs mx-auto">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EFECE4] dark:bg-[#1A2232] flex items-center justify-center text-[#C78F28] dark:text-[#E0AE4E]">
                    <Star className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-[#1A2232] dark:text-[#F3EFE6]">
                    Zatiaľ nemáte obľúbené{' '}
                    {isPredspev ? 'predspevy' : isAntiphon ? 'antifóny' : 'piesne'}
                  </h2>
                  <p className="mt-1.5 text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                    Ťuknite na hviezdičku pri ľubovoľnom texte a uložte si ho pre rýchly prístup počas služieb Božích.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1A2232] dark:bg-[#D4A34B] text-[#FAF7F0] dark:text-[#111622] text-sm font-semibold hover:opacity-90 transition"
                  >
                    Prehliadať všetky{' '}
                    {isPredspev ? 'predspevy' : isAntiphon ? 'antifóny' : 'piesne'}
                  </button>
                </div>
              ) : displayedItems.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-medium text-[#1A2232] dark:text-[#F3EFE6]">
                    Žiadna položka nezodpovedá hľadaniu „{searchQuery}“
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    Skúste iné číslo (1–{isPredspev ? '12' : isAntiphon ? '89' : '700'}) alebo časť textu.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('Všetky');
                    }}
                    className="mt-4 min-h-[40px] px-4 py-2 rounded-xl bg-[#EFECE4] dark:bg-[#1A2232] text-xs font-semibold text-[#1A2232] dark:text-[#F3EFE6]"
                  >
                    Zrušiť filtre
                  </button>
                </div>
              ) : (
                <>
                  {visibleItems.map((item) => (
                    <SongListItem
                      key={`${item.book || currentBook}-${item.id}`}
                      song={item}
                      isSelected={item.id === activeItem.id}
                      isFavorite={favoritesSet.has(item.id)}
                      onSelect={(id) => openItem(id, currentBook)}
                      onToggleFavorite={(id) => toggleFavorite(id, currentBook)}
                    />
                  ))}
                  {visibleLimit < displayedItems.length && (
                    <div className="py-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleLimit((prev) => Math.min(displayedItems.length, prev + 150))
                        }
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-[#EFECE4] dark:bg-[#1A2232] text-xs font-semibold text-[#1A2232] dark:text-[#F3EFE6]"
                      >
                        Zobraziť ďalšie (zostáva {displayedItems.length - visibleLimit})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </aside>

        {/* Right Lyrics Reader Pane (Always visible on lg:, conditional full-screen on mobile) */}
        <main
          className={`${
            mobileShowReader ? 'flex' : 'hidden lg:flex'
          } flex-col flex-1 min-w-0 min-h-0`}
        >
          <HymnReader
            song={activeItem}
            bookType={currentBook}
            isFavorite={favoritesSet.has(activeItem.id)}
            fontSize={fontSize}
            isDark={isDark}
            isSilentActive={isSilentActive}
            onToggleTheme={() => setTheme(isDark ? 'light' : 'dark')}
            onChangeFontSize={setFontSize}
            onToggleFavorite={(id) => toggleFavorite(id, currentBook)}
            onNavigateSong={(id) => {
              if (isPredspev) {
                setSelectedPredspevId(id);
              } else if (isAntiphon) {
                setSelectedAntiphonId(id);
              } else {
                setSelectedSongId(id);
              }
            }}
            onBack={mobileShowReader ? () => setMobileShowReader(false) : undefined}
            onSwitchBook={switchBook}
            onOpenSilenceModal={() => setShowSilenceModal(true)}
          />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb Zone) — 5 clean tabs for instant book & tab switching */}
      {!mobileShowReader && !isCompactLandscape && (
        <nav
          aria-label="Mobilná navigácia"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#F8F6F1]/95 dark:bg-[#111622]/95 backdrop-blur-md border-t border-[#E7E2D8] dark:border-[#242D3F] pb-safe"
        >
          <div className="grid grid-cols-5 h-16">
            <button
              type="button"
              onClick={() => {
                switchBook('piesne');
                setActiveTab('all');
              }}
              className={`flex flex-col items-center justify-center gap-0.5 transition ${
                activeTab === 'all' && currentBook === 'piesne'
                  ? 'text-[#1A2232] dark:text-[#D4A34B]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF]'
              }`}
            >
              <BookOpen className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-semibold">Piesne</span>
            </button>

            <button
              type="button"
              onClick={() => {
                switchBook('antifony');
                setActiveTab('all');
              }}
              className={`flex flex-col items-center justify-center gap-0.5 transition ${
                activeTab === 'all' && currentBook === 'antifony'
                  ? 'text-[#1A2232] dark:text-[#D4A34B]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF]'
              }`}
            >
              <Scroll className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-semibold">Antifóny</span>
            </button>

            <button
              type="button"
              onClick={() => {
                switchBook('predspevy');
                setActiveTab('all');
              }}
              className={`flex flex-col items-center justify-center gap-0.5 transition ${
                activeTab === 'all' && currentBook === 'predspevy'
                  ? 'text-[#1A2232] dark:text-[#D4A34B]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF]'
              }`}
            >
              <Music className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-semibold">Predspevy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className={`flex flex-col items-center justify-center gap-0.5 transition ${
                activeTab === 'favorites'
                  ? 'text-[#C78F28] dark:text-[#D4A34B]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF]'
              }`}
            >
              <Star
                className={`w-5 h-5 ${activeTab === 'favorites' ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
              <span className="text-[10px] font-semibold tabular-nums">
                Obľúbené{currentFavorites.length > 0 ? ` (${currentFavorites.length})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('keypad')}
              className={`flex flex-col items-center justify-center gap-0.5 transition ${
                activeTab === 'keypad'
                  ? 'text-[#1A2232] dark:text-[#D4A34B]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF]'
              }`}
            >
              <Hash className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-semibold">Číselník</span>
            </button>
          </div>
        </nav>
      )}

      {/* Church Silence Guidance Modal */}
      <ChurchSilenceModal
        isOpen={showSilenceModal}
        isSilentActive={isSilentActive}
        onClose={() => setShowSilenceModal(false)}
        onToggleSilent={() => setIsSilentActive((prev) => !prev)}
      />

      <OfflineIndicator />
    </div>
  );
}
