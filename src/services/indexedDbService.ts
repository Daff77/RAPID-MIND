import { AssessmentRecord, SurvivorProfile } from '../types/assessment';

const DB_NAME = 'RAPIDMIND_INDEXED_DB';
const DB_VERSION = 1;

export const STORES = {
  ASSESSMENTS: 'assessments',
  SURVIVORS: 'survivors',
  OFFLINE_QUEUE: 'offline_queue',
} as const;

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * Checks if browser natively supports IndexedDB.
 */
export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Opens and initializes the IndexedDB database instance with standard stores and indexes.
 */
export function openIndexedDB(): Promise<IDBDatabase> {
  if (!isIndexedDBSupported()) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Store: assessments (Riwayat penapisan triase klinis)
        if (!db.objectStoreNames.contains(STORES.ASSESSMENTS)) {
          const assessStore = db.createObjectStore(STORES.ASSESSMENTS, { keyPath: 'recordId' });
          assessStore.createIndex('rmCode', 'rmCode', { unique: false });
          assessStore.createIndex('survivorId', 'survivorId', { unique: false });
          assessStore.createIndex('victimId', 'victimId', { unique: false });
          assessStore.createIndex('triageTier', 'triageTier', { unique: false });
          assessStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          assessStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 2. Store: survivors (Registri profil penyintas & NIK/posko)
        if (!db.objectStoreNames.contains(STORES.SURVIVORS)) {
          const survivorStore = db.createObjectStore(STORES.SURVIVORS, { keyPath: 'id' });
          survivorStore.createIndex('nik', 'nik', { unique: false });
          survivorStore.createIndex('name', 'name', { unique: false });
          survivorStore.createIndex('posko', 'posko', { unique: false });
        }

        // 3. Store: offline_queue (Antrean sinkronisasi saat blank spot)
        if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'recordId' });
          queueStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    } catch (err) {
      reject(err);
    }
  });

  return dbInitPromise;
}

// ==========================================
// ASSESSMENTS OBJECT STORE CRUD
// ==========================================

export async function idbSaveAssessment(record: AssessmentRecord): Promise<void> {
  if (!isIndexedDBSupported()) return;
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.ASSESSMENTS, 'readwrite');
      const store = tx.objectStore(STORES.ASSESSMENTS);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbSaveAssessment fallback/error:', err);
  }
}

export async function idbBulkSaveAssessments(records: AssessmentRecord[]): Promise<void> {
  if (!isIndexedDBSupported() || records.length === 0) return;
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.ASSESSMENTS, 'readwrite');
      const store = tx.objectStore(STORES.ASSESSMENTS);
      records.forEach((r) => store.put(r));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('idbBulkSaveAssessments fallback/error:', err);
  }
}

export async function idbGetAssessments(): Promise<AssessmentRecord[]> {
  if (!isIndexedDBSupported()) return [];
  try {
    const db = await openIndexedDB();
    return await new Promise<AssessmentRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORES.ASSESSMENTS, 'readonly');
      const store = tx.objectStore(STORES.ASSESSMENTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbGetAssessments fallback/error:', err);
    return [];
  }
}

export async function idbRemoveAssessment(recordId: string): Promise<void> {
  if (!isIndexedDBSupported()) return;
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.ASSESSMENTS, 'readwrite');
      const store = tx.objectStore(STORES.ASSESSMENTS);
      const req = store.delete(recordId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbRemoveAssessment fallback/error:', err);
  }
}

// ==========================================
// OFFLINE QUEUE OBJECT STORE CRUD
// ==========================================

export async function idbSaveQueueItem(record: AssessmentRecord): Promise<void> {
  if (!isIndexedDBSupported()) return;
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.OFFLINE_QUEUE);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbSaveQueueItem fallback/error:', err);
  }
}

export async function idbGetQueue(): Promise<AssessmentRecord[]> {
  if (!isIndexedDBSupported()) return [];
  try {
    const db = await openIndexedDB();
    return await new Promise<AssessmentRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.OFFLINE_QUEUE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbGetQueue fallback/error:', err);
    return [];
  }
}

export async function idbRemoveQueueItem(recordId: string): Promise<void> {
  if (!isIndexedDBSupported()) return;
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.OFFLINE_QUEUE);
      const req = store.delete(recordId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbRemoveQueueItem fallback/error:', err);
  }
}

export async function idbClearQueue(): Promise<void> {
  if (!isIndexedDBSupported()) return;
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.OFFLINE_QUEUE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbClearQueue fallback/error:', err);
  }
}

// ==========================================
// SURVIVORS OBJECT STORE CRUD
// ==========================================

export async function idbSaveSurvivor(survivor: SurvivorProfile): Promise<void> {
  if (!isIndexedDBSupported()) return;
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SURVIVORS, 'readwrite');
      const store = tx.objectStore(STORES.SURVIVORS);
      const req = store.put(survivor);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbSaveSurvivor fallback/error:', err);
  }
}

export async function idbBulkSaveSurvivors(survivors: SurvivorProfile[]): Promise<void> {
  if (!isIndexedDBSupported() || survivors.length === 0) return;
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SURVIVORS, 'readwrite');
      const store = tx.objectStore(STORES.SURVIVORS);
      survivors.forEach((s) => store.put(s));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('idbBulkSaveSurvivors fallback/error:', err);
  }
}

export async function idbGetSurvivors(): Promise<SurvivorProfile[]> {
  if (!isIndexedDBSupported()) return [];
  try {
    const db = await openIndexedDB();
    return await new Promise<SurvivorProfile[]>((resolve, reject) => {
      const tx = db.transaction(STORES.SURVIVORS, 'readonly');
      const store = tx.objectStore(STORES.SURVIVORS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbGetSurvivors fallback/error:', err);
    return [];
  }
}

// ==========================================
// STORAGE DIAGNOSTICS & METRICS
// ==========================================

export interface IDBStorageStats {
  isSupported: boolean;
  isReady: boolean;
  databaseName: string;
  version: number;
  assessmentCount: number;
  survivorCount: number;
  queueCount: number;
}

export async function getIndexedDBStats(): Promise<IDBStorageStats> {
  if (!isIndexedDBSupported()) {
    return {
      isSupported: false,
      isReady: false,
      databaseName: DB_NAME,
      version: DB_VERSION,
      assessmentCount: 0,
      survivorCount: 0,
      queueCount: 0,
    };
  }

  try {
    const db = await openIndexedDB();
    const countStore = (storeName: string): Promise<number> => {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(0);
        } catch {
          resolve(0);
        }
      });
    };

    const [assessmentCount, survivorCount, queueCount] = await Promise.all([
      countStore(STORES.ASSESSMENTS),
      countStore(STORES.SURVIVORS),
      countStore(STORES.OFFLINE_QUEUE),
    ]);

    return {
      isSupported: true,
      isReady: true,
      databaseName: DB_NAME,
      version: DB_VERSION,
      assessmentCount,
      survivorCount,
      queueCount,
    };
  } catch {
    return {
      isSupported: true,
      isReady: false,
      databaseName: DB_NAME,
      version: DB_VERSION,
      assessmentCount: 0,
      survivorCount: 0,
      queueCount: 0,
    };
  }
}
