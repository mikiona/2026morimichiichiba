// ─── フェスティバル共通 ───────────────────────────────────────

export type FestivalDay = '05-22' | '05-23' | '05-24';

export const FESTIVAL_DAYS: FestivalDay[] = ['05-22', '05-23', '05-24'];

export const DAY_LABELS: Record<FestivalDay, string> = {
  '05-22': '5/22 (金)',
  '05-23': '5/23 (土)',
  '05-24': '5/24 (日)',
};

export type StageName =
  | 'MORI.MICHI. ART THEATER'
  | 'MORI.MICHI. BEACH STAGE'
  | 'MORI.MICHI. GARDEN STAGE'
  | 'MORI.MICHI. FOREST STAGE'
  | 'MORI.MICHI. SEA STAGE'
  | 'MORI.MICHI. DISCO STAGE';

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
  | '和食'
  | '洋食'
  | 'アジア料理'
  | 'カレー'
  | 'ラーメン・麺類'
  | 'バーガー・サンドイッチ'
  | 'ケバブ・中東料理'
  | 'ベトナム料理'
  | 'スイーツ・デザート'
  | 'ドリンク・カクテル'
  | 'クラフトビール'
  | 'コーヒー・カフェ'
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
  allergens: AllergenTag[];
  priceRange: PriceRange | null;
  areas: string[];
}

export type PlayingStatus = 'now-playing' | 'upcoming-soon' | 'ended' | 'future';
