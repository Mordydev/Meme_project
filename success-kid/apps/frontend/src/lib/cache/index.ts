/**
 * Simple in-memory cache implementation
 * 
 * This provides a cache for data that doesn't need to be persisted
 * between page refreshes, but should avoid redundant API calls.
 */

interface CacheItem<T> {
  value: T;
  expiry: number | null; // Timestamp when the item expires
}

class Cache {
  private store: Map<string, CacheItem<any>>;
  
  constructor() {
    this.store = new Map();
  }
  
  /**
   * Set a value in the cache with optional expiration
   * 
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in milliseconds (optional)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = ttl ? Date.now() + ttl : null;
    this.store.set(key, { value, expiry });
  }
  
  /**
   * Get a value from the cache
   * 
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.store.get(key);
    
    // Check if item exists and is not expired
    if (item && (item.expiry === null || item.expiry > Date.now())) {
      return item.value as T;
    }
    
    // Remove expired items
    if (item && item.expiry !== null && item.expiry <= Date.now()) {
      this.store.delete(key);
    }
    
    return undefined;
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * 
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.store.get(key);
    return !!item && (item.expiry === null || item.expiry > Date.now());
  }
  
  /**
   * Remove a specific key from the cache
   * 
   * @param key Cache key
   */
  remove(key: string): void {
    this.store.delete(key);
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.store.clear();
  }
  
  /**
   * Get all non-expired keys in the cache
   * 
   * @returns Array of valid cache keys
   */
  keys(): string[] {
    const validKeys: string[] = [];
    const now = Date.now();
    
    this.store.forEach((item, key) => {
      if (item.expiry === null || item.expiry > now) {
        validKeys.push(key);
      }
    });
    
    return validKeys;
  }
  
  /**
   * Get cache size (count of non-expired items)
   * 
   * @returns Number of valid items in cache
   */
  size(): number {
    return this.keys().length;
  }
  
  /**
   * Remove all expired items from the cache
   */
  cleanup(): void {
    const now = Date.now();
    
    this.store.forEach((item, key) => {
      if (item.expiry !== null && item.expiry <= now) {
        this.store.delete(key);
      }
    });
  }
}

// Create singleton cache instance
export const cache = new Cache();

// Export the Cache class for testing or if multiple instances are needed
export default Cache;