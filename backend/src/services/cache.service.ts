/**
 * Cache Service — Module 27
 *
 * Implements a fast, in-memory LRU cache to reduce database load
 * for frequently accessed, slow-changing data (like academic config)
 * and high-volume reads (like active QR sessions).
 */

import { LRUCache } from 'lru-cache';
import { increment } from './metrics.service';

// Main application cache (max 1000 items, default 5 min TTL)
const appCache = new LRUCache<string, any>({
  max: 1000,
  ttl: 5 * 60 * 1000,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

export const cacheService = {
  
  /** Get an item from cache, or fetch it and cache the result */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = appCache.get(key);
    if (cached !== undefined) {
      increment('cache.hit');
      return cached as T;
    }

    increment('cache.miss');
    const result = await fetcher();
    
    // Don't cache null/undefined values to prevent caching failures
    if (result !== null && result !== undefined) {
      appCache.set(key, result, { ttl: ttlMs });
    }
    
    return result;
  },

  /** Get an item if it exists */
  get<T>(key: string): T | undefined {
    return appCache.get(key) as T | undefined;
  },

  /** Set an item manually */
  set(key: string, value: any, ttlMs?: number) {
    appCache.set(key, value, { ttl: ttlMs });
  },

  /** Delete an item (used for invalidation) */
  invalidate(key: string) {
    appCache.delete(key);
  },

  /** Invalidate all keys matching a prefix */
  invalidatePrefix(prefix: string) {
    for (const key of appCache.keys()) {
      if (key.startsWith(prefix)) {
        appCache.delete(key);
      }
    }
  },

  /** Clear entire cache (useful for tests or full resets) */
  clear() {
    appCache.clear();
  }
};
