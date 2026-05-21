// ─── フェスティバル共通 ───────────────────────────────────────

export type FestivalDay = '05-22' | '05-23' | '05-24';

export const FESTIVAL_DAYS: FestivalDay[] = ['05-22', '05-23', '05-24'];

export const DAY_LABELS: Record<FestivalDay, string> = {
  '05-22': '5/22 (金)',
  '05-23': '5/23 (土)',
  '05-24': '5/24 (日)',
};

export type StageName =
  | 'GRASS STAGE'
  | 'SAND STAGE'
  | 'HILL STAGE'
  | '影響亜細亜 STAGE'
  | 'EATBEAT! STAGE'
  | '遊園地 STAGE'
  | 'MORI.MICHI. DISCO.STAGE'
  | 'MORI.MICHI. ART THEATER'
  | 'LVRRY X BLH STAGE';

export type StageArea = '遊園地エリア' | '海エリア';

export interface Stage {
  id: string;
  name: StageName;
  area: StageArea;
}

// ─── アーティスト ──────────────────────────────────────────────

export type ArtistGenre =
  | 'ロック'
  | 'ポップ'
  | 'インディー'
  | 'ヒップホップ'
  | 'エレクトロニック'
  | 'ジャズ・ソウル'
  | 'フォーク・アコースティック'
  | 'その他';

export interface Artist {
  id: string;
  name: string;
  nameKana?: string;
  genre: ArtistGenre[];
  imageUrl?: string;
  officialUrl?: string;
  sourceUrl?: string;
  days: FestivalDay[];
  description?: string;
  scrapedAt: string;
}

// ─── タイムテーブル ──────────────────────────────────────────

export interface ScheduleEntry {
  id: string;
  artistId: string;
  artistName: string;
  day: FestivalDay;
  stage: StageName;
  stageArea: StageArea;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

// ─── フードベンダー ────────────────────────────────────────────

export type FoodCategory =
  | 'コーヒー・カフェ'
  | 'お酒・ワイン・ビール'
  | 'パン・スイーツ'
  | 'カレー・インド料理'
  | 'アジア料理'
  | '和食・定食'
  | 'ドリンク'
  | 'クラフト・工芸'
  | 'ファッション'
  | '本・音楽・アート'
  | '雑貨・生活用品'
  | '古着・ヴィンテージ'
  | 'フラワー・グリーン'
  | 'その他';

export type AllergenTag =
  | 'グルテンフリー'
  | 'ヴィーガン'
  | 'ベジタリアン'
  | '乳製品不使用'
  | '卵不使用'
  | 'ハラール';

export type PriceRange = '〜¥500' | '¥500〜¥1,000' | '¥1,000〜¥1,500' | '¥1,500〜';

export interface MenuItem {
  name: string;
  price?: number;
  priceLabel?: string;
  allergens: AllergenTag[];
  description?: string;
}

export interface FoodVendor {
  id: string;
  name: string;
  area: string;
  areaId: string;
  areaSlot?: number;
  categories: FoodCategory[];
  menuItems: MenuItem[];
  priceRange: PriceRange;
  allergenTags: AllergenTag[];
  imageUrl?: string;
  days: FestivalDay[];
  description?: string;
  sourceUrl: string;
  scrapedAt: string;
}

// ─── ニュース ──────────────────────────────────────────────────

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  publishedAt: string;
  category?: string;
  imageUrl?: string;
  scrapedAt: string;
}

// ─── フィルタ状態 ────────────────────────────────────────────

export interface ArtistFilterState {
  query: string;
  genres: ArtistGenre[];
  stages: StageName[];
  days: FestivalDay[];
}

export interface FoodFilterState {
  query: string;
  categories: FoodCategory[];
  areas: string[];
}

export type PlayingStatus = 'now-playing' | 'upcoming-soon' | 'ended' | 'future';
