import { openDB } from 'idb';

const DATABASE_NAME = 'tellmy';
const DATABASE_VERSION = 2;


// Object stores
const STORES = {
  SAVED_STORIES: 'saved-stories',
  CACHED_STORIES: 'cached-stories',
  USER_PREFERENCES: 'user-preferences',
  OFFLINE_QUEUE: 'offline-queue'
};

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade: (database, oldVersion, newVersion) => {
    console.log('Upgrading database from version', oldVersion, 'to', newVersion);

    // Saved stories (bookmarks)
    if (!database.objectStoreNames.contains(STORES.SAVED_STORIES)) {
      const savedStoriesStore = database.createObjectStore(STORES.SAVED_STORIES, {
        keyPath: 'id',
      });
      savedStoriesStore.createIndex('createdAt', 'createdAt');
    }

    // Cached stories for offline viewing
    if (!database.objectStoreNames.contains(STORES.CACHED_STORIES)) {
      const cachedStoriesStore = database.createObjectStore(STORES.CACHED_STORIES, {
        keyPath: 'id',
      });
      cachedStoriesStore.createIndex('cachedAt', 'cachedAt');
      cachedStoriesStore.createIndex('category', 'category');
    }

    // User preferences
    if (!database.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
      database.createObjectStore(STORES.USER_PREFERENCES, {
        keyPath: 'key',
      });
    }

    // Offline queue for failed requests
    if (!database.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
      const offlineQueueStore = database.createObjectStore(STORES.OFFLINE_QUEUE, {
        keyPath: 'id',
        autoIncrement: true,
      });
      offlineQueueStore.createIndex('timestamp', 'timestamp');
      offlineQueueStore.createIndex('type', 'type');
    }
  },
});

const Database = {
  // Saved Stories (Bookmarks)
  async putSavedStory(story) {
    if (!Object.hasOwn(story, 'id')) {
      throw new Error('`id` is required to save.');
    }
    const storyWithTimestamp = {
      ...story,
      savedAt: new Date().toISOString()
    };
    return (await dbPromise).put(STORES.SAVED_STORIES, storyWithTimestamp);
  },

  async getAllSavedStories() {
    return (await dbPromise).getAll(STORES.SAVED_STORIES);
  },

  async deleteSavedStory(id) {
    return (await dbPromise).delete(STORES.SAVED_STORIES, id);
  },

  async isSavedStory(id) {
    const story = await (await dbPromise).get(STORES.SAVED_STORIES, id);
    return !!story;
  },

  // Cached Stories for offline viewing
  async putCachedStory(story) {
    if (!Object.hasOwn(story, 'id')) {
      throw new Error('`id` is required to cache.');
    }
    const storyWithCache = {
      ...story,
      cachedAt: new Date().toISOString()
    };
    return (await dbPromise).put(STORES.CACHED_STORIES, storyWithCache);
  },

  async getAllCachedStories() {
    return (await dbPromise).getAll(STORES.CACHED_STORIES);
  },

  async getCachedStory(id) {
    return (await dbPromise).get(STORES.CACHED_STORIES, id);
  },

  async deleteCachedStory(id) {
    return (await dbPromise).delete(STORES.CACHED_STORIES, id);
  },

  async clearOldCachedStories(maxAge = 7 * 24 * 60 * 60 * 1000) { 
    const db = await dbPromise;
    const tx = db.transaction(STORES.CACHED_STORIES, 'readwrite');
    const store = tx.objectStore(STORES.CACHED_STORIES);
    const index = store.index('cachedAt');
    
    const cutoffDate = new Date(Date.now() - maxAge).toISOString();
    const oldEntries = await index.getAll(IDBKeyRange.upperBound(cutoffDate));
    
    for (const entry of oldEntries) {
      await store.delete(entry.id);
    }
    
    await tx.complete;
    console.log(`Cleared ${oldEntries.length} old cached stories`);
  },

  // User Preferences
  async setPreference(key, value) {
    return (await dbPromise).put(STORES.USER_PREFERENCES, { key, value });
  },

  async getPreference(key) {
    const result = await (await dbPromise).get(STORES.USER_PREFERENCES, key);
    return result ? result.value : null;
  },

  async deletePreference(key) {
    return (await dbPromise).delete(STORES.USER_PREFERENCES, key);
  },

  // Offline Queue
  async addToOfflineQueue(type, data, url) {
    const queueItem = {
      type,
      data,
      url,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    return (await dbPromise).add(STORES.OFFLINE_QUEUE, queueItem);
  },

  async getOfflineQueue() {
    return (await dbPromise).getAll(STORES.OFFLINE_QUEUE);
  },

  async removeFromOfflineQueue(id) {
    return (await dbPromise).delete(STORES.OFFLINE_QUEUE, id);
  },

  async updateOfflineQueueItem(id, updates) {
    const db = await dbPromise;
    const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.OFFLINE_QUEUE);
    const item = await store.get(id);
    
    if (item) {
      const updatedItem = { ...item, ...updates };
      await store.put(updatedItem);
    }
    
    await tx.complete;
  },

  // Utility methods
  async getStorageInfo() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage,
        available: estimate.quota,
        usedPercent: Math.round((estimate.usage / estimate.quota) * 100)
      };
    }
    return null;
  },

  async clearAllData() {
    const db = await dbPromise;
    const storeNames = [STORES.SAVED_STORIES, STORES.CACHED_STORIES, STORES.USER_PREFERENCES, STORES.OFFLINE_QUEUE];
    
    for (const storeName of storeNames) {
      const tx = db.transaction(storeName, 'readwrite');
      await tx.objectStore(storeName).clear();
      await tx.complete;
    }
    
    console.log('All IndexedDB data cleared');
  },

  // Sync methods for online/offline handling
  async syncOfflineData() {
    const queueItems = await this.getOfflineQueue();
    const results = [];
    
    for (const item of queueItems) {
      try {
        let response;
        const requestOptions = {
          method: item.type === 'DELETE' ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        };
        
        if (item.data) {
          requestOptions.body = JSON.stringify(item.data);
        }
        
        response = await fetch(item.url, requestOptions);
        
        if (response.ok) {
          await this.removeFromOfflineQueue(item.id);
          results.push({ success: true, item });
        } else {
          await this.updateOfflineQueueItem(item.id, { 
            retryCount: item.retryCount + 1,
            lastError: `HTTP ${response.status}: ${response.statusText}`
          });
          results.push({ success: false, item, error: response.statusText });
        }
      } catch (error) {
        await this.updateOfflineQueueItem(item.id, { 
          retryCount: item.retryCount + 1,
          lastError: error.message
        });
        results.push({ success: false, item, error: error.message });
      }
    }
    
    return results;
  },

  // Check if app is running offline
  async isOffline() {
    return !navigator.onLine;
  }
};

// Auto-cleanup old cached data on startup
dbPromise.then(async () => {
  try {
    await Database.clearOldCachedStories();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
});

export default Database;