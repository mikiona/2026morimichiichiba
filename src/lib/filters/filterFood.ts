import type { FoodVendor, FoodFilterState } from '@/types';

export function filterFood(
  vendors: FoodVendor[],
  filter: FoodFilterState
): FoodVendor[] {
  return vendors.filter((v) => {
    if (filter.query) {
      const q = filter.query.toLowerCase();
      // かな読み（description "よみ: ..." に格納）も検索対象
      const kana = v.description?.replace(/^よみ:\s*/, '') ?? '';
      if (
        !v.name.toLowerCase().includes(q) &&
        !kana.includes(q)
      ) return false;
    }

    if (filter.categories.length > 0) {
      if (!filter.categories.some((c) => v.categories.includes(c))) return false;
    }

    if (filter.areas.length > 0) {
      if (!filter.areas.includes(v.areaId)) return false;
    }

    return true;
  });
}
