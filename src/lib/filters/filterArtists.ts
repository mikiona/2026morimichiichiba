import type { Artist, ScheduleEntry, ArtistFilterState } from '@/types';

export function filterArtists(
  artists: Artist[],
  schedule: ScheduleEntry[],
  filter: ArtistFilterState
): Artist[] {
  return artists.filter((a) => {
    if (filter.query) {
      const q = filter.query.toLowerCase();
      const match =
        a.name.toLowerCase().includes(q) ||
        (a.nameKana?.toLowerCase().includes(q) ?? false);
      if (!match) return false;
    }

    if (filter.genres.length > 0) {
      if (!filter.genres.some((g) => a.genre.includes(g))) return false;
    }

    if (filter.days.length > 0) {
      if (!filter.days.some((d) => a.days.includes(d))) return false;
    }

    if (filter.stages.length > 0) {
      const artistSchedule = schedule.filter((s) => s.artistId === a.id || s.artistName === a.name);
      if (!artistSchedule.some((s) => filter.stages.includes(s.stage))) return false;
    }

    return true;
  });
}
