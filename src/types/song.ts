export type BookType = 'piesne' | 'antifony' | 'predspevy';

export interface Stanza {
  label?: string;
  isRefrain?: boolean;
  isSubheader?: boolean;
  lines: string[];
}

export interface Song {
  id: number;
  title: string;
  category: string;
  stanzaCount: number;
  stanzas: Stanza[];
  searchNorm: string;
  book?: BookType;
}

export type MainViewTab = 'all' | 'favorites' | 'keypad';

export type FavoritesSortOrder = 'number' | 'recent';
