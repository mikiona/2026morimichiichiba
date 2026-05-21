export function normalizeShopName(name: string): string {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[［\[【].*?[］\]】]/g, '')
    .replace(/[／/]影響亜細亜.*$/g, '')
    .replace(/[／/]モリミチ喫茶室.*$/g, '')
    .replace(/[\s　・･,、,.。'"'"()（）/／\-－—+＋×]/g, '')
    .trim();
}
