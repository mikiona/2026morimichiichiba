'use client';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'morimichi:favorites';
const CHANGE_EVENT = 'favorites-changed';

function parse(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

// 生の localStorage 文字列をスナップショットにする（文字列はObject.isで安定比較できる）
function getSnapshot(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(STORAGE_KEY) ?? '';
}
function getServerSnapshot(): string {
  return '';
}

// サーバーでは false、クライアントのハイドレーション後に true を返す
const subscribeNoop = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}

function writeStore(names: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch {
    /* ストレージ無効時は無視 */
  }
  // 同一タブ内の他コンポーネントへ通知（storage イベントは他タブにしか飛ばないため）
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * お気に入りアーティスト（artist.name をキーに使用）を localStorage で管理する hook。
 * artist.id は重複があるため name を一意キーとする。
 */
export function useFavorites() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useHydrated();

  const favorites = useMemo(() => new Set(parse(raw)), [raw]);

  const toggle = useCallback((name: string) => {
    const next = new Set(parse(getSnapshot()));
    if (next.has(name)) next.delete(name);
    else next.add(name);
    writeStore([...next]);
  }, []);

  const isFavorite = useCallback((name: string) => favorites.has(name), [favorites]);

  return { favorites, isFavorite, toggle, count: favorites.size, hydrated };
}
