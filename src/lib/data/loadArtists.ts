import type { Artist } from '@/types';
import artistsJson from '@/data/artists.json';

export function loadArtists(): Artist[] {
  return artistsJson as Artist[];
}
