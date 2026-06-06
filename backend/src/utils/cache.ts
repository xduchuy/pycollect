interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SimpleCache {
  private store = new Map<string, CacheEntry<any>>();

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value;
  }

  public set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  public exists(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }

  public notExpired(key: string): boolean {
    return this.exists(key);
  }

  public clear(): void {
    this.store.clear();
  }
}

export const cache = new SimpleCache();
