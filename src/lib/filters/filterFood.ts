import type { FoodVendor, FoodFilterState } from '@/types';

export function filterFood(
  vendors: FoodVendor[],
  filter: FoodFilterState
): FoodVendor[] {
  return vendors.filter((v) => {
    if (filter.query) {
      const q = filter.query.toLowerCase();
      const nameMatch = v.name.toLowerCase().includes(q);
      const menuMatch = v.menuItems.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.description?.toLowerCase().includes(q) ?? false)
      );
      if (!nameMatch && !menuMatch) return false;
    }

    // OR: at least one category matches
    if (filter.categories.length > 0) {
      if (!filter.categories.some((c) => v.categories.includes(c))) return false;
    }

    // AND: all selected allergen tags must be present
    if (filter.allergens.length > 0) {
      if (!filter.allergens.every((a) => v.allergenTags.includes(a))) return false;
    }

    if (filter.priceRange !== null) {
      if (v.priceRange !== filter.priceRange) return false;
    }

    if (filter.areas.length > 0) {
      if (!filter.areas.includes(v.areaId)) return false;
    }

    return true;
  });
}
