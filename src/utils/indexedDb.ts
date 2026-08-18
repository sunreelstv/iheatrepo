/**
 * IndexedDB storage utility for persistent local video & heavy media files.
 * Browser IndexedDB can store hundreds of megabytes per origin, preventing
 * QuotaExceededError in localStorage and surviving page reloads without
 * relying on transient blob: URLs that break on refresh.
 */

const DB_NAME = 'islandheat_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a Blob/File to IndexedDB with a unique ID
 * Returns an 'idb_video_<key>' string identifier
 */
export async function saveMediaBlob(id: string, blob: Blob): Promise<string> {
  try {
    const db = await openMediaDB();
    const key = `idb_video_${id}`;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, key);

      req.onsuccess = () => resolve(key);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB Save Error]', err);
    throw err;
  }
}

/**
 * Get a Blob from IndexedDB by key ('idb_video_...')
 */
export async function getMediaBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB Get Error]', err);
    return null;
  }
}

// In-memory cache for generated object URLs from IndexedDB keys
const objectUrlCache: Record<string, string> = {};

/**
 * Resolve any video URL string.
 * If url is an 'idb_video_...' key, retrieves the blob from IndexedDB and returns a fresh object URL.
 * If url is a dead 'blob:' URL from a previous session, attempts to fall back or return empty.
 * Otherwise returns the URL as-is.
 */
export async function resolveVideoUrl(url: string): Promise<string> {
  if (!url) return '';

  // 1. If it's an IndexedDB key
  if (url.startsWith('idb_video_')) {
    if (objectUrlCache[url]) {
      return objectUrlCache[url];
    }
    const blob = await getMediaBlob(url);
    if (blob) {
      const createdUrl = URL.createObjectURL(blob);
      objectUrlCache[url] = createdUrl;
      return createdUrl;
    }
    return '';
  }

  // 2. If it's a dead blob: URL from a previous session that failed
  if (url.startsWith('blob:')) {
    // Check if we stored a backup under that URL path
    const cleanId = url.split('/').pop() || '';
    if (cleanId) {
      const backupBlob = await getMediaBlob(`idb_video_${cleanId}`);
      if (backupBlob) {
        const createdUrl = URL.createObjectURL(backupBlob);
        objectUrlCache[url] = createdUrl;
        return createdUrl;
      }
    }
  }

  return url;
}

/**
 * Clean up stored object URLs on app unload
 */
export function revokeObjectUrlCache() {
  Object.values(objectUrlCache).forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  });
}
