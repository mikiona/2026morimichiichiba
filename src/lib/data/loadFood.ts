import type { FoodVendor } from '@/types';
import foodJson from '@/data/food.json';

export function loadFood(): FoodVendor[] {
  return foodJson as FoodVendor[];
}
