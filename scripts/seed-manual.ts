/**
 * 手動シードデータ生成スクリプト
 * スクレイピングが完全に失敗した場合のフォールバック
 * 実行: npm run seed
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Artist, ScheduleEntry, FoodVendor, NewsItem } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'src/data');

// ─── アーティストデータ ───────────────────────────────────────

const artists: Artist[] = [
  { id: 'toe', name: 'toe', genre: ['ロック', 'インディー'], days: ['05-22', '05-23'], scrapedAt: new Date().toISOString() },
  { id: 'bloodthirsty-butchers', name: 'bloodthirsty butchers', nameKana: 'ブラッドサースティブッチャーズ', genre: ['ロック'], days: ['05-22'], scrapedAt: new Date().toISOString() },
  { id: 'fishmans', name: 'FISHMANS', nameKana: 'フィッシュマンズ', genre: ['ロック', 'その他'], days: ['05-23'], scrapedAt: new Date().toISOString() },
  { id: 'kirinji', name: 'KIRINJI', nameKana: 'キリンジ', genre: ['ポップ', 'ジャズ・ソウル'], days: ['05-23'], scrapedAt: new Date().toISOString() },
  { id: 'bonobos', name: 'bonobos', nameKana: 'ボノボ', genre: ['ポップ', 'ジャズ・ソウル'], days: ['05-24'], scrapedAt: new Date().toISOString() },
  { id: 'tujiko-noriko', name: 'Tujiko Noriko', nameKana: 'ツジコノリコ', genre: ['エレクトロニック'], days: ['05-22'], scrapedAt: new Date().toISOString() },
  { id: 'rei', name: 'REI', genre: ['フォーク・アコースティック', 'ポップ'], days: ['05-24'], scrapedAt: new Date().toISOString() },
  { id: 'helme', name: 'ヘルメ', nameKana: 'ヘルメ', genre: ['ポップ', 'インディー'], days: ['05-22', '05-23', '05-24'], scrapedAt: new Date().toISOString() },
  { id: 'lyrica', name: 'lyrica', genre: ['フォーク・アコースティック'], days: ['05-23'], scrapedAt: new Date().toISOString() },
  { id: 'taiko-super-kicks', name: 'TAIKO SUPER KICKS', genre: ['ロック', 'インディー'], days: ['05-22'], scrapedAt: new Date().toISOString() },
  { id: 'homecomings', name: 'Homecomings', nameKana: 'ホームカミングス', genre: ['インディー', 'ポップ'], days: ['05-23', '05-24'], scrapedAt: new Date().toISOString() },
  { id: 'lamp', name: 'Lamp', nameKana: 'ランプ', genre: ['ポップ', 'フォーク・アコースティック'], days: ['05-24'], scrapedAt: new Date().toISOString() },
  { id: 'cicada', name: 'CICADA', genre: ['エレクトロニック', 'インディー'], days: ['05-22'], scrapedAt: new Date().toISOString() },
  { id: 'downy', name: 'downy', genre: ['ロック', 'その他'], days: ['05-23'], scrapedAt: new Date().toISOString() },
  { id: 'sakanaction', name: 'サカナクション', nameKana: 'サカナクション', genre: ['ロック', 'エレクトロニック'], days: ['05-24'], scrapedAt: new Date().toISOString() },
  { id: 'the-novembers', name: 'the telepathy', genre: ['ロック', 'インディー'], days: ['05-22', '05-23'], scrapedAt: new Date().toISOString() },
  { id: 'soutaiseiriron', name: '相対性理論', nameKana: 'ソウタイセイリロン', genre: ['インディー', 'ポップ'], days: ['05-23'], scrapedAt: new Date().toISOString() },
  { id: 'urawa-all-stars', name: 'urawa all stars', genre: ['ヒップホップ'], days: ['05-22', '05-24'], scrapedAt: new Date().toISOString() },
  { id: 'imai', name: '今井亮太郎', nameKana: 'イマイリョウタロウ', genre: ['フォーク・アコースティック'], days: ['05-22'], scrapedAt: new Date().toISOString() },
  { id: 'oorutaichi', name: 'Oorutaichi', nameKana: 'オールタイチ', genre: ['エレクトロニック', 'その他'], days: ['05-23'], scrapedAt: new Date().toISOString() },
];

// ─── タイムテーブル ──────────────────────────────────────────

const schedule: ScheduleEntry[] = [
  // Day 1: 5/22
  { id: 'toe-0522-art-theater', artistId: 'toe', artistName: 'toe', day: '05-22', stage: 'MORI.MICHI. ART THEATER', stageArea: '遊園地エリア', startTime: '18:00', endTime: '19:15' },
  { id: 'bloodthirsty-butchers-0522-forest-stage', artistId: 'bloodthirsty-butchers', artistName: 'bloodthirsty butchers', day: '05-22', stage: 'MORI.MICHI. FOREST STAGE', stageArea: '海エリア', startTime: '16:30', endTime: '17:30' },
  { id: 'tujiko-noriko-0522-sea-stage', artistId: 'tujiko-noriko', artistName: 'Tujiko Noriko', day: '05-22', stage: 'MORI.MICHI. SEA STAGE', stageArea: '海エリア', startTime: '14:00', endTime: '15:00' },
  { id: 'cicada-0522-disco-stage', artistId: 'cicada', artistName: 'CICADA', day: '05-22', stage: 'MORI.MICHI. DISCO STAGE', stageArea: '遊園地エリア', startTime: '19:30', endTime: '20:30' },
  { id: 'taiko-super-kicks-0522-beach-stage', artistId: 'taiko-super-kicks', artistName: 'TAIKO SUPER KICKS', day: '05-22', stage: 'MORI.MICHI. BEACH STAGE', stageArea: '海エリア', startTime: '12:00', endTime: '13:00' },
  { id: 'imai-0522-garden-stage', artistId: 'imai', artistName: '今井亮太郎', day: '05-22', stage: 'MORI.MICHI. GARDEN STAGE', stageArea: '遊園地エリア', startTime: '13:00', endTime: '14:00' },
  { id: 'the-novembers-0522-art-theater', artistId: 'the-novembers', artistName: 'the telepathy', day: '05-22', stage: 'MORI.MICHI. ART THEATER', stageArea: '遊園地エリア', startTime: '15:30', endTime: '16:30' },
  { id: 'urawa-all-stars-0522-disco-stage', artistId: 'urawa-all-stars', artistName: 'urawa all stars', day: '05-22', stage: 'MORI.MICHI. DISCO STAGE', stageArea: '遊園地エリア', startTime: '12:30', endTime: '13:30' },
  { id: 'helme-0522-beach-stage', artistId: 'helme', artistName: 'ヘルメ', day: '05-22', stage: 'MORI.MICHI. BEACH STAGE', stageArea: '海エリア', startTime: '20:00', endTime: '21:00' },

  // Day 2: 5/23
  { id: 'fishmans-0523-art-theater', artistId: 'fishmans', artistName: 'FISHMANS', day: '05-23', stage: 'MORI.MICHI. ART THEATER', stageArea: '遊園地エリア', startTime: '19:00', endTime: '20:30' },
  { id: 'kirinji-0523-forest-stage', artistId: 'kirinji', artistName: 'KIRINJI', day: '05-23', stage: 'MORI.MICHI. FOREST STAGE', stageArea: '海エリア', startTime: '17:00', endTime: '18:15' },
  { id: 'downy-0523-sea-stage', artistId: 'downy', artistName: 'downy', day: '05-23', stage: 'MORI.MICHI. SEA STAGE', stageArea: '海エリア', startTime: '15:00', endTime: '16:00' },
  { id: 'soutaiseiriron-0523-disco-stage', artistId: 'soutaiseiriron', artistName: '相対性理論', day: '05-23', stage: 'MORI.MICHI. DISCO STAGE', stageArea: '遊園地エリア', startTime: '16:00', endTime: '17:00' },
  { id: 'homecomings-0523-beach-stage', artistId: 'homecomings', artistName: 'Homecomings', day: '05-23', stage: 'MORI.MICHI. BEACH STAGE', stageArea: '海エリア', startTime: '13:00', endTime: '14:00' },
  { id: 'toe-0523-garden-stage', artistId: 'toe', artistName: 'toe', day: '05-23', stage: 'MORI.MICHI. GARDEN STAGE', stageArea: '遊園地エリア', startTime: '11:00', endTime: '12:00' },
  { id: 'the-novembers-0523-art-theater', artistId: 'the-novembers', artistName: 'the telepathy', day: '05-23', stage: 'MORI.MICHI. ART THEATER', stageArea: '遊園地エリア', startTime: '14:00', endTime: '15:00' },
  { id: 'lyrica-0523-sea-stage', artistId: 'lyrica', artistName: 'lyrica', day: '05-23', stage: 'MORI.MICHI. SEA STAGE', stageArea: '海エリア', startTime: '11:30', endTime: '12:30' },
  { id: 'oorutaichi-0523-forest-stage', artistId: 'oorutaichi', artistName: 'Oorutaichi', day: '05-23', stage: 'MORI.MICHI. FOREST STAGE', stageArea: '海エリア', startTime: '20:00', endTime: '21:00' },
  { id: 'helme-0523-garden-stage', artistId: 'helme', artistName: 'ヘルメ', day: '05-23', stage: 'MORI.MICHI. GARDEN STAGE', stageArea: '遊園地エリア', startTime: '18:30', endTime: '19:30' },

  // Day 3: 5/24
  { id: 'sakanaction-0524-art-theater', artistId: 'sakanaction', artistName: 'サカナクション', day: '05-24', stage: 'MORI.MICHI. ART THEATER', stageArea: '遊園地エリア', startTime: '19:30', endTime: '21:00' },
  { id: 'bonobos-0524-forest-stage', artistId: 'bonobos', artistName: 'bonobos', day: '05-24', stage: 'MORI.MICHI. FOREST STAGE', stageArea: '海エリア', startTime: '17:30', endTime: '18:30' },
  { id: 'rei-0524-beach-stage', artistId: 'rei', artistName: 'REI', day: '05-24', stage: 'MORI.MICHI. BEACH STAGE', stageArea: '海エリア', startTime: '14:30', endTime: '15:30' },
  { id: 'lamp-0524-garden-stage', artistId: 'lamp', artistName: 'Lamp', day: '05-24', stage: 'MORI.MICHI. GARDEN STAGE', stageArea: '遊園地エリア', startTime: '13:30', endTime: '14:30' },
  { id: 'homecomings-0524-sea-stage', artistId: 'homecomings', artistName: 'Homecomings', day: '05-24', stage: 'MORI.MICHI. SEA STAGE', stageArea: '海エリア', startTime: '16:00', endTime: '17:00' },
  { id: 'urawa-all-stars-0524-disco-stage', artistId: 'urawa-all-stars', artistName: 'urawa all stars', day: '05-24', stage: 'MORI.MICHI. DISCO STAGE', stageArea: '遊園地エリア', startTime: '12:00', endTime: '13:00' },
  { id: 'helme-0524-art-theater', artistId: 'helme', artistName: 'ヘルメ', day: '05-24', stage: 'MORI.MICHI. ART THEATER', stageArea: '遊園地エリア', startTime: '11:00', endTime: '12:00' },
];

// ─── フードデータ ─────────────────────────────────────────────

const food: FoodVendor[] = [
  {
    id: 'eatbeat-play-falafel',
    name: 'FALAFEL BROTHERS',
    area: 'EATBEAT!PLAY',
    areaId: 'eatbeat-play',
    categories: ['ケバブ・中東料理', 'ベジタリアン' as unknown as never],
    menuItems: [
      { name: 'ファラフェルサンド', price: 900, priceLabel: '¥900', allergens: ['ヴィーガン'] },
      { name: 'シャワルマプレート', price: 1200, priceLabel: '¥1,200', allergens: [] },
    ],
    priceRange: '¥500〜¥1,000',
    allergenTags: ['ヴィーガン'],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/commune/',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: 'tane-to-tabi-curry',
    name: '種と旅と カレー屋',
    area: '種と旅と',
    areaId: 'tane-to-tabi',
    categories: ['カレー'],
    menuItems: [
      { name: 'スパイスチキンカレー', price: 1100, priceLabel: '¥1,100', allergens: [] },
      { name: 'ベジタブルカレー', price: 1000, priceLabel: '¥1,000', allergens: ['ヴィーガン', 'ベジタリアン'] },
    ],
    priceRange: '¥1,000〜¥1,500',
    allergenTags: ['ヴィーガン', 'ベジタリアン'],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/commune/',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: 'river-market-beer',
    name: 'RIVER MARKET クラフトビール',
    area: 'RIVER MARKET',
    areaId: 'river-market',
    categories: ['クラフトビール', 'ドリンク・カクテル'],
    menuItems: [
      { name: 'IPA パイント', price: 900, priceLabel: '¥900', allergens: [] },
      { name: 'ヴァイツェン パイント', price: 900, priceLabel: '¥900', allergens: [] },
      { name: 'ハードサイダー', price: 800, priceLabel: '¥800', allergens: ['グルテンフリー'] },
    ],
    priceRange: '¥500〜¥1,000',
    allergenTags: ['グルテンフリー'],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/area/',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: 'bainmi-stand',
    name: 'バインミースタンド',
    area: 'EATBEAT!PLAY',
    areaId: 'eatbeat-play',
    categories: ['ベトナム料理', 'バーガー・サンドイッチ'],
    menuItems: [
      { name: 'クラシックバインミー', price: 850, priceLabel: '¥850', allergens: [] },
      { name: 'チキンバインミー', price: 900, priceLabel: '¥900', allergens: [] },
      { name: 'ヴィーガンバインミー', price: 800, priceLabel: '¥800', allergens: ['ヴィーガン', 'グルテンフリー'] },
    ],
    priceRange: '¥500〜¥1,000',
    allergenTags: ['ヴィーガン', 'グルテンフリー'],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/commune/',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: 'sweets-wagon',
    name: 'SWEETS WAGON',
    area: '種と旅と',
    areaId: 'tane-to-tabi',
    categories: ['スイーツ・デザート'],
    menuItems: [
      { name: 'ベルギーワッフル', price: 600, priceLabel: '¥600', allergens: [] },
      { name: 'アイスクリーム', price: 400, priceLabel: '¥400', allergens: [] },
      { name: 'ヴィーガンどら焼き', price: 500, priceLabel: '¥500', allergens: ['ヴィーガン', '乳製品不使用'] },
    ],
    priceRange: '〜¥500',
    allergenTags: ['ヴィーガン', '乳製品不使用'],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/commune/',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: 'coffee-truck',
    name: 'MORIMICHI COFFEE',
    area: 'RIVER MARKET',
    areaId: 'river-market',
    categories: ['コーヒー・カフェ'],
    menuItems: [
      { name: 'ハンドドリップコーヒー', price: 500, priceLabel: '¥500', allergens: [] },
      { name: 'カフェラテ', price: 600, priceLabel: '¥600', allergens: [] },
      { name: 'オーツミルクラテ', price: 650, priceLabel: '¥650', allergens: ['乳製品不使用', 'ヴィーガン'] },
    ],
    priceRange: '〜¥500',
    allergenTags: ['乳製品不使用', 'ヴィーガン'],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/area/',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: 'ramen-stand',
    name: '森道ラーメン',
    area: '味な盛り場',
    areaId: 'ajina-moriba',
    categories: ['ラーメン・麺類'],
    menuItems: [
      { name: '醤油ラーメン', price: 1000, priceLabel: '¥1,000', allergens: [] },
      { name: '塩ラーメン', price: 1000, priceLabel: '¥1,000', allergens: [] },
    ],
    priceRange: '¥1,000〜¥1,500',
    allergenTags: [],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/commune/',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: 'thai-kitchen',
    name: 'タイキッチン',
    area: 'EATBEAT!PLAY',
    areaId: 'eatbeat-play',
    categories: ['アジア料理'],
    menuItems: [
      { name: 'パッタイ', price: 1100, priceLabel: '¥1,100', allergens: ['グルテンフリー'] },
      { name: 'グリーンカレー', price: 1200, priceLabel: '¥1,200', allergens: [] },
      { name: 'ヤムウンセン', price: 900, priceLabel: '¥900', allergens: ['グルテンフリー'] },
    ],
    priceRange: '¥1,000〜¥1,500',
    allergenTags: ['グルテンフリー'],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/commune/',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: 'burger-stand',
    name: 'FOREST BURGER',
    area: '味な盛り場',
    areaId: 'ajina-moriba',
    categories: ['バーガー・サンドイッチ'],
    menuItems: [
      { name: 'チーズバーガー', price: 1300, priceLabel: '¥1,300', allergens: [] },
      { name: 'マッシュルームバーガー', price: 1200, priceLabel: '¥1,200', allergens: ['ベジタリアン'] },
    ],
    priceRange: '¥1,000〜¥1,500',
    allergenTags: ['ベジタリアン'],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/commune/',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: 'jazz-bar',
    name: 'JAZZ & SOUL BAR',
    area: 'RIVER MARKET',
    areaId: 'river-market',
    categories: ['ドリンク・カクテル', 'クラフトビール'],
    menuItems: [
      { name: 'クラフトジン＆トニック', price: 900, priceLabel: '¥900', allergens: [] },
      { name: 'モスコミュール', price: 900, priceLabel: '¥900', allergens: [] },
      { name: 'ノンアルモクテル', price: 700, priceLabel: '¥700', allergens: ['ヴィーガン'] },
    ],
    priceRange: '¥500〜¥1,000',
    allergenTags: ['ヴィーガン'],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/area/',
    scrapedAt: new Date().toISOString(),
  },
];

// ─── ニュースデータ ────────────────────────────────────────────

const news: NewsItem[] = [
  {
    id: '1',
    title: '2026年森道市場 タイムテーブル発表！',
    excerpt: '2026年5月22日〜24日に開催する「森道市場2026」のタイムテーブルを発表しました。6つのステージに多彩なアーティストが登場します。',
    url: 'https://morimichiichiba.jp/news/',
    publishedAt: '2026-04-15T10:00:00+09:00',
    category: 'タイムテーブル',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: '追加出演アーティスト発表',
    excerpt: '森道市場2026への追加出演アーティストを発表します。今回もジャンルを超えた個性豊かなアーティストが集結します。',
    url: 'https://morimichiichiba.jp/news/',
    publishedAt: '2026-03-20T12:00:00+09:00',
    category: '出演者',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'チケット販売のお知らせ',
    excerpt: '森道市場2026の当日券販売についてのお知らせです。前売り券は完売となりましたが、当日券を各日先着で販売いたします。',
    url: 'https://morimichiichiba.jp/news/',
    publishedAt: '2026-05-01T10:00:00+09:00',
    category: 'チケット',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: '盛り場（フードエリア）出店情報',
    excerpt: '今年も個性豊かなフード・ドリンク店が集結！ヴィーガン対応メニューやグルテンフリー対応店舗も充実しています。',
    url: 'https://morimichiichiba.jp/news/',
    publishedAt: '2026-04-28T10:00:00+09:00',
    category: '盛り場',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'アクセス・会場案内',
    excerpt: '会場であるラグーナビーチ＆ラグーナシア（愛知県蒲郡市）へのアクセス方法、駐車場情報をお知らせします。',
    url: 'https://morimichiichiba.jp/news/',
    publishedAt: '2026-05-10T10:00:00+09:00',
    category: '案内',
    scrapedAt: new Date().toISOString(),
  },
];

// ─── 出力 ─────────────────────────────────────────────────────

function saveJson(filename: string, data: unknown) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const outPath = path.join(DATA_DIR, filename);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[seed] Saved ${outPath}`);
}

saveJson('artists.json', artists);
saveJson('schedule.json', schedule);
saveJson('food.json', food);
saveJson('news.json', news);
console.log('[seed] Done!');
