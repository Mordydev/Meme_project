/**
 * Mock Redis Implementation
 * 
 * Provides an in-memory Redis implementation for testing
 */

// In-memory store for Redis data
interface RedisStore {
  values: Map<string, string>;
  expirations: Map<string, number>;
  lists: Map<string, string[]>;
  sets: Map<string, Set<string>>;
  sortedSets: Map<string, Map<string, number>>;
  hashes: Map<string, Map<string, string>>;
}

/**
 * Create a mock Redis client for testing
 */
export function createMockRedis() {
  // In-memory store
  const store: RedisStore = {
    values: new Map(),
    expirations: new Map(),
    lists: new Map(),
    sets: new Map(),
    sortedSets: new Map(),
    hashes: new Map(),
  };
  
  // Command log for inspection
  const commandLog: { command: string; args: any[]; timestamp: Date }[] = [];
  
  // Mock Redis client
  const mockRedis = {
    /**
     * Log a command
     */
    logCommand(command: string, ...args: any[]): void {
      commandLog.push({
        command,
        args,
        timestamp: new Date(),
      });
    },
    
    /**
     * Check if a key exists
     */
    async exists(key: string): Promise<number> {
      this.logCommand('exists', key);
      return this.hasKey(key) ? 1 : 0;
    },
    
    /**
     * Check if a key exists (internal method)
     */
    hasKey(key: string): boolean {
      return (
        store.values.has(key) ||
        store.lists.has(key) ||
        store.sets.has(key) ||
        store.sortedSets.has(key) ||
        store.hashes.has(key)
      );
    },
    
    /**
     * Get a value
     */
    async get(key: string): Promise<string | null> {
      this.logCommand('get', key);
      return store.values.get(key) || null;
    },
    
    /**
     * Set a value
     */
    async set(key: string, value: string, ...args: any[]): Promise<string> {
      this.logCommand('set', key, value, ...args);
      
      store.values.set(key, value);
      
      // Handle expiration (EX seconds)
      if (args.includes('EX') && args.length > args.indexOf('EX') + 1) {
        const exIndex = args.indexOf('EX');
        const exSeconds = parseInt(args[exIndex + 1], 10);
        
        if (!isNaN(exSeconds)) {
          const expirationTime = Date.now() + exSeconds * 1000;
          store.expirations.set(key, expirationTime);
        }
      }
      
      return 'OK';
    },
    
    /**
     * Delete a key
     */
    async del(key: string | string[]): Promise<number> {
      const keys = Array.isArray(key) ? key : [key];
      this.logCommand('del', ...keys);
      
      let deleted = 0;
      
      for (const k of keys) {
        if (store.values.delete(k)) deleted++;
        if (store.lists.delete(k)) deleted++;
        if (store.sets.delete(k)) deleted++;
        if (store.sortedSets.delete(k)) deleted++;
        if (store.hashes.delete(k)) deleted++;
        store.expirations.delete(k);
      }
      
      return deleted;
    },
    
    /**
     * Increment a value
     */
    async incr(key: string): Promise<number> {
      this.logCommand('incr', key);
      
      const currentValue = store.values.get(key);
      const newValue = currentValue ? parseInt(currentValue, 10) + 1 : 1;
      
      if (isNaN(newValue)) {
        throw new Error('value is not an integer');
      }
      
      store.values.set(key, newValue.toString());
      return newValue;
    },
    
    /**
     * Increment a value by a specified amount
     */
    async incrby(key: string, increment: number): Promise<number> {
      this.logCommand('incrby', key, increment);
      
      const currentValue = store.values.get(key);
      const newValue = currentValue ? parseInt(currentValue, 10) + increment : increment;
      
      if (isNaN(newValue)) {
        throw new Error('value is not an integer');
      }
      
      store.values.set(key, newValue.toString());
      return newValue;
    },
    
    /**
     * Set a key's time to live in seconds
     */
    async expire(key: string, seconds: number): Promise<number> {
      this.logCommand('expire', key, seconds);
      
      if (!this.hasKey(key)) {
        return 0;
      }
      
      const expirationTime = Date.now() + seconds * 1000;
      store.expirations.set(key, expirationTime);
      return 1;
    },
    
    /**
     * Set a key's time to live with a timestamp
     */
    async expireat(key: string, timestamp: number): Promise<number> {
      this.logCommand('expireat', key, timestamp);
      
      if (!this.hasKey(key)) {
        return 0;
      }
      
      store.expirations.set(key, timestamp * 1000);
      return 1;
    },
    
    /**
     * Get a hash field
     */
    async hget(key: string, field: string): Promise<string | null> {
      this.logCommand('hget', key, field);
      
      const hash = store.hashes.get(key);
      return hash ? hash.get(field) || null : null;
    },
    
    /**
     * Set a hash field
     */
    async hset(key: string, field: string, value: string): Promise<number> {
      this.logCommand('hset', key, field, value);
      
      if (!store.hashes.has(key)) {
        store.hashes.set(key, new Map());
      }
      
      const hash = store.hashes.get(key)!;
      const isNew = !hash.has(field);
      hash.set(field, value);
      
      return isNew ? 1 : 0;
    },
    
    /**
     * Get all hash fields and values
     */
    async hgetall(key: string): Promise<Record<string, string>> {
      this.logCommand('hgetall', key);
      
      const hash = store.hashes.get(key);
      if (!hash) {
        return {};
      }
      
      const result: Record<string, string> = {};
      hash.forEach((value, field) => {
        result[field] = value;
      });
      
      return result;
    },
    
    /**
     * Push an element to a list
     */
    async lpush(key: string, ...values: string[]): Promise<number> {
      this.logCommand('lpush', key, ...values);
      
      if (!store.lists.has(key)) {
        store.lists.set(key, []);
      }
      
      const list = store.lists.get(key)!;
      for (const value of values) {
        list.unshift(value);
      }
      
      return list.length;
    },
    
    /**
     * Get a range of elements from a list
     */
    async lrange(key: string, start: number, stop: number): Promise<string[]> {
      this.logCommand('lrange', key, start, stop);
      
      const list = store.lists.get(key);
      if (!list) {
        return [];
      }
      
      // Handle negative indices
      const actualStart = start < 0 ? Math.max(list.length + start, 0) : start;
      const actualStop = stop < 0 ? list.length + stop : stop;
      
      return list.slice(actualStart, actualStop + 1);
    },
    
    /**
     * Add a member to a sorted set
     */
    async zadd(key: string, score: number, member: string): Promise<number> {
      this.logCommand('zadd', key, score, member);
      
      if (!store.sortedSets.has(key)) {
        store.sortedSets.set(key, new Map());
      }
      
      const sortedSet = store.sortedSets.get(key)!;
      const isNew = !sortedSet.has(member);
      sortedSet.set(member, score);
      
      return isNew ? 1 : 0;
    },
    
    /**
     * Get a range of members from a sorted set
     */
    async zrange(key: string, start: number, stop: number, withScores?: string): Promise<string[]> {
      this.logCommand('zrange', key, start, stop, withScores);
      
      const sortedSet = store.sortedSets.get(key);
      if (!sortedSet) {
        return [];
      }
      
      // Sort members by score
      const members = Array.from(sortedSet.entries())
        .sort((a, b) => a[1] - b[1])
        .map(([member, score]) => member);
      
      // Handle negative indices
      const actualStart = start < 0 ? Math.max(members.length + start, 0) : start;
      const actualStop = stop < 0 ? members.length + stop : stop;
      
      const result = members.slice(actualStart, actualStop + 1);
      
      if (withScores === 'WITHSCORES') {
        const resultWithScores: string[] = [];
        for (const member of result) {
          resultWithScores.push(member);
          resultWithScores.push(sortedSet.get(member)!.toString());
        }
        return resultWithScores;
      }
      
      return result;
    },
    
    /**
     * Add a member to a set
     */
    async sadd(key: string, ...members: string[]): Promise<number> {
      this.logCommand('sadd', key, ...members);
      
      if (!store.sets.has(key)) {
        store.sets.set(key, new Set());
      }
      
      const set = store.sets.get(key)!;
      let added = 0;
      
      for (const member of members) {
        if (!set.has(member)) {
          set.add(member);
          added++;
        }
      }
      
      return added;
    },
    
    /**
     * Get all members of a set
     */
    async smembers(key: string): Promise<string[]> {
      this.logCommand('smembers', key);
      
      const set = store.sets.get(key);
      if (!set) {
        return [];
      }
      
      return Array.from(set);
    },
    
    /**
     * Ping the Redis server
     */
    async ping(): Promise<string> {
      this.logCommand('ping');
      return 'PONG';
    },
    
    /**
     * Publish a message to a channel
     */
    async publish(channel: string, message: string): Promise<number> {
      this.logCommand('publish', channel, message);
      // In a real implementation, this would return the number of subscribers
      // For the mock, we just return 0
      return 0;
    },
    
    /**
     * Get the command log
     */
    getCommandLog(): typeof commandLog {
      return commandLog;
    },
    
    /**
     * Reset the Redis store
     */
    reset(): void {
      store.values.clear();
      store.expirations.clear();
      store.lists.clear();
      store.sets.clear();
      store.sortedSets.clear();
      store.hashes.clear();
      commandLog.length = 0;
    },
  };
  
  // Create duplicate client (used for subscribers)
  mockRedis.duplicate = () => createMockRedis();
  
  return mockRedis;
}
