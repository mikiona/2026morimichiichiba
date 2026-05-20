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
    id: 'morimichi-coffee',
    name: 'MORIMICHI COFFEE',
    area: 'マーケット', areaId: 'market',
    categories: ['コーヒー・カフェ'],
    menuItems: [], priceRange: '¥500〜¥1,000', allergenTags: [],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/market/',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: 'morimichi-brewery',
    name: 'MORIMICHI BREWING',
    area: 'マーケット', areaId: 'market',
    categories: ['お酒・ワイン・ビール'],
    menuItems: [], priceRange: '¥500〜¥1,000', allergenTags: [],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/market/',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: 'nagashi-biryani',
    name: '流しのビリヤニ',
    area: 'マーケット', areaId: 'market',
    categories: ['カレー・インド料理'],
    menuItems: [], priceRange: '¥500〜¥1,000', allergenTags: [],
    days: ['05-22', '05-23', '05-24'],
    sourceUrl: 'https://morimichiichiba.jp/market/586',
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
