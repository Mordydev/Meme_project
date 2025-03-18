'use client';

/**
 * IndexedDB interface for offline data storage
 * Provides a simple API for storing and retrieving data for offline use
 */

// Database name and version
const DB_NAME = 'success-kid-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
  CONTENT: 'content',
  POSTS: 'posts',
  COMMENTS: 'comments',
  QUEUED_ACTIONS: 'queuedActions',
  USER_DATA: 'userData',
  APP_STATE: 'appState',
};

/**
 * Initialize the IndexedDB database
 * Sets up the object stores and indexes
 */
export async function initDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Check for IndexedDB support
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }

    // Open the database
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    // Create object stores on database upgrade
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Content store for cached content items
      if (!db.objectStoreNames.contains(STORES.CONTENT)) {
        const contentStore = db.createObjectStore(STORES.CONTENT, { keyPath: 'id' });
        contentStore.createIndex('timestamp', 'timestamp', { unique: false });
        contentStore.createIndex('type', 'type', { unique: false });
      }

      // Posts store for offline created posts
      if (!db.objectStoreNames.contains(STORES.POSTS)) {
        const postsStore = db.createObjectStore(STORES.POSTS, { keyPath: 'localId' });
        postsStore.createIndex('timestamp', 'timestamp', { unique: false });
        postsStore.createIndex('status', 'status', { unique: false });
      }

      // Comments store for offline created comments
      if (!db.objectStoreNames.contains(STORES.COMMENTS)) {
        const commentsStore = db.createObjectStore(STORES.COMMENTS, { keyPath: 'localId' });
        commentsStore.createIndex('contentId', 'contentId', { unique: false });
        commentsStore.createIndex('timestamp', 'timestamp', { unique: false });
        commentsStore.createIndex('status', 'status', { unique: false });
      }

      // Queued actions store for offline actions
      if (!db.objectStoreNames.contains(STORES.QUEUED_ACTIONS)) {
        const queuedActionsStore = db.createObjectStore(STORES.QUEUED_ACTIONS, { keyPath: 'id', autoIncrement: true });
        queuedActionsStore.createIndex('type', 'type', { unique: false });
        queuedActionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        queuedActionsStore.createIndex('status', 'status', { unique: false });
      }

      // User data store for offline user data
      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
      }

      // App state store for offline app state
      if (!db.objectStoreNames.contains(STORES.APP_STATE)) {
        db.createObjectStore(STORES.APP_STATE, { keyPath: 'key' });
      }
    };

    // Handle success
    request.onsuccess = (event: Event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    // Handle error
    request.onerror = (event: Event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Generic function to store data in a specific object store
 */
export async function storeData<T>(storeName: string, data: T): Promise<T> {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    
    request.onsuccess = () => {
      resolve(data);
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Generic function to retrieve data from a specific object store by key
 */
export async function getData<T>(storeName: string, key: string | number): Promise<T | null> {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    
    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result as T;
      resolve(result || null);
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Generic function to retrieve all data from a specific object store
 */
export async function getAllData<T>(storeName: string): Promise<T[]> {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result as T[];
      resolve(result || []);
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Generic function to delete data from a specific object store by key
 */
export async function deleteData(storeName: string, key: string | number): Promise<void> {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Generic function to clear all data from a specific object store
 */
export async function clearStore(storeName: string): Promise<void> {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Query data in a store using an index
 */
export async function queryByIndex<T>(
  storeName: string, 
  indexName: string, 
  value: any
): Promise<T[]> {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    
    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result as T[];
      resolve(result || []);
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Queue an action for when the device comes online
 */
export async function queueOfflineAction(action: {
  type: string;
  payload: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'failed';
}): Promise<number> {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.QUEUED_ACTIONS, 'readwrite');
    const store = transaction.objectStore(STORES.QUEUED_ACTIONS);
    const request = store.add({
      ...action,
      timestamp: action.timestamp || Date.now(),
      status: action.status || 'pending'
    });
    
    request.onsuccess = (event) => {
      const id = (event.target as IDBRequest).result as number;
      resolve(id);
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
    
    transaction.oncomplete = () => {
      db.close();
      
      // If we're online, try to process the action immediately
      if (navigator.onLine) {
        // This would need to be implemented elsewhere
        // processOfflineActions();
      }
    };
  });
}

/**
 * Store user-specific data for offline access
 */
export async function storeUserData(key: string, data: any): Promise<void> {
  return storeData(STORES.USER_DATA, { key, value: data });
}

/**
 * Retrieve user-specific data
 */
export async function getUserData<T>(key: string): Promise<T | null> {
  const result = await getData<{ key: string; value: T }>(STORES.USER_DATA, key);
  return result ? result.value : null;
}

/**
 * Store application state for offline access
 */
export async function storeAppState(key: string, state: any): Promise<void> {
  return storeData(STORES.APP_STATE, { key, value: state });
}

/**
 * Retrieve application state
 */
export async function getAppState<T>(key: string): Promise<T | null> {
  const result = await getData<{ key: string; value: T }>(STORES.APP_STATE, key);
  return result ? result.value : null;
}
