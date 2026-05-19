import type { FoodCategory } from '../../src/types';

const RULES: Array<[FoodCategory, RegExp]> = [
  ['コーヒー・カフェ',  /coffee|café|カフェ|珈琲|コーヒー|喫茶|roast(?:ery)?/i],
  ['クラフトビール',   /brew(?:ing|ery)?|beer|ビール|hazy|craft.?beer/i],
  ['パン・スイーツ',   /boulangerie|ブーランジェリー|bake(?:ry)?|パン|patisserie|パティスリー|sweets|muffin|アイスクリーム|ice.?cream|菓子|おやつ|wagashi|nut.?butter|ナッツ/i],
  ['カレー・インド料理', /ビリヤニ|biryani|chapati|チャパティ|curry|カレー|インド/i],
  ['アジア料理',      /ベトナム|タイ|ラオス|中東|エスニック|ethnic|sabaisabai|サバイサバイ/i],
  ['和食・定食',      /食堂|定食|丼|おにぎり|ごはん|玄米|発酵|和食|酒場|居酒屋|炊き|お?餅|もち米|そば|うどん|ラーメン|麺/i],
  ['ドリンク',       /chai|チャイ|latte|milk.?tea|ミルクティー|juice|ジュース|tea(?!m)|rum.?chai/i],
  ['クラフト・工芸',   /pottery|ceramics|陶|工房|工芸|手仕事|テキスタイル|textile|weav/i],
  ['ファッション',    /supply|ranch|apparel|clothing|hat|帽子/i],
  ['本・音楽・アート', /book|zine|record|music|本屋|画廊|art(?!isan)|gallery|photo|写真/i],
];

export function guessCategory(text: string): FoodCategory[] {
  const result: FoodCategory[] = [];
  for (const [cat, re] of RULES) {
    if (re.test(text)) result.push(cat);
  }
  return result.length ? result : ['その他'];
}
