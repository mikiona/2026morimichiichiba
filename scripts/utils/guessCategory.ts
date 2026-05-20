import type { FoodCategory } from '../../src/types';

const RULES: Array<[FoodCategory, RegExp]> = [
  ['コーヒー・カフェ',  /coffee|café|カフェ|珈琲|コーヒー|喫茶|roast(?:ery)?/i],
  ['お酒・ワイン・ビール', /brew(?:ing|ery)?|beer|ビール|hazy|craft.?beer|wine|ワイン|日本酒|sake(?! of)|ウイスキー|whisky|whiskey|gin(?!ger)|(?<!マガ|エン|チャン|ジャー)ジン(?!ジャ|ガー|グ)|焼酎|蒸留|distill(?:ery)?|梅酒|rum(?!.?chai)|ラム酒|シードル|cider|mead/i],
  ['パン・スイーツ',   /boulangerie|ブーランジェリー|bake(?:ry)?|パン|patisserie|パティスリー|sweets|muffin|アイスクリーム|ice.?cream|菓子|おやつ|wagashi|nut.?butter|ナッツ|ケーキ|cake|チョコレート|chocolate|マカロン|タルト|クッキー|cookie|プリン|どら焼き|あんこ/i],
  ['カレー・インド料理', /ビリヤニ|biryani|chapati|チャパティ|curry|カレー|インド/i],
  ['アジア料理',      /ベトナム|タイ|ラオス|中東|エスニック|ethnic|sabaisabai|サバイサバイ|ケバブ|kebab|ピタ|pita|ガパオ|トムヤム|パクチー/i],
  ['和食・定食',      /食堂|定食|丼|おにぎり|おむすび|ごはん|玄米|発酵|和食|酒場|居酒屋|炊き|お?餅|もち米|そば|うどん|ラーメン|麺|肉(?!食)|焼肉|ステーキ|steak|ハンバーガー|burger|焼き鳥|yakitori|寿司|sushi|天ぷら|から揚げ|唐揚げ|たこ焼き|ちゃんぽん|餃子|お好み焼き|牛すじ|焼きそば/i],
  ['ドリンク',       /chai|チャイ|latte|milk.?tea|ミルクティー|juice|ジュース|tea(?!m)|rum.?chai/i],
  ['クラフト・工芸',   /pottery|ceramics|陶|工房|工芸|手仕事|テキスタイル|textile|weav/i],
  ['ファッション',    /supply|ranch|apparel|アパレル|clothing|帽子|アクセサリー|ジュエリー|jewelry|jewel|バッグ|bag|レザー|leather|革(?!命)|指輪|ネックレス|ブレスレット|アクセ|Tシャツ|T.?shirt|靴下|ソックス|sock|サンダル|スニーカー|footwear|フットウェア|シューズ|バックパック|リュック|ウェア(?!ハウス)/i],
  ['本・音楽・アート', /book|zine|record|music|本屋|画廊|art(?!isan)|gallery|photo|写真|アート|絵(?!本)|似顔絵|ポートレート|portrait|イラスト|illustration/i],
  ['古着・ヴィンテージ', /古着|ヴィンテージ|ビンテージ|vintage|アンティーク|antique|古物|レトロ|retro|骨董|蚤の市|thrift/i],
  ['フラワー・グリーン', /花(?:器|束|屋|卉|植物|ドライ)|flower|植物(?!油)|botanical|観葉|フラワー|ドライフラワー|多肉|草花|floral/i],
  ['雑貨・生活用品',  /雑貨|zakka|インテリア|キャンドル|candle|蜜蝋|アロマ|aroma|お?香(?:り|水|$)|石鹸|soap|巾着|日用品|生活用品|ホームウェア|homeware|家具|照明|ランプ|ライト|プランター|線香/i],
];

export function guessCategory(text: string): FoodCategory[] {
  const result: FoodCategory[] = [];
  for (const [cat, re] of RULES) {
    if (re.test(text)) result.push(cat);
  }
  return result.length ? result : ['その他'];
}
