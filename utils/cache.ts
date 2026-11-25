type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export function readCache<T>(key: string): T | undefined {
  const now = Date.now();
  const existing = store.get(key) as CacheEntry<T> | undefined;
  if (existing===null || existing===undefined) return undefined;

  if (existing.expiresAt <= now) {
    store.delete(key);
    return undefined;
  }

  console.log(`Found Cached: ${key}`, existing.value);
  return existing.value;
}

export function writeCache<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  console.log(`Written: ${key}`);
}

export async function getCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = readCache<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) {
    console.log(`Inflight: ${key}`);
    return pending;
  }

  const promise = fetcher()
    .then((result) => {
      writeCache(key, result, ttlMs);
      return result;
    })
    .finally(() => {
      inflight.delete(key);
    });

  console.log(`Fetching: ${key}`);
  inflight.set(key, promise);
  return promise;
}

export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

export function clearAllCache(): void {
  store.clear();
  inflight.clear();
}
