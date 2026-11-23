// The learner's word book: terms they have earned, kept in this browser only
// (IndexedDB, no accounts). Falls back to memory when storage is blocked.

export type Entry = { word: string; stage: number; at: number };

const DB = "llm-wordbook";
const STORE = "words";
const memory = new Map<string, Entry>();

function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "word" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function unlock(words: string[], stage: number): Promise<void> {
  const at = Date.now();
  const entries = words.map((word) => ({ word, stage, at }));
  entries.forEach((e) => memory.set(e.word, e));
  const db = await open();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    entries.forEach((e) => tx.objectStore(STORE).put(e));
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function list(): Promise<Entry[]> {
  const db = await open();
  if (!db) return [...memory.values()];
  return new Promise((resolve) => {
    const req = db.transaction(STORE).objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as Entry[]).sort((a, b) => a.stage - b.stage || a.at - b.at));
    req.onerror = () => resolve([...memory.values()]);
  });
}

export async function has(word: string): Promise<boolean> {
  return (await list()).some((e) => e.word === word);
}

export async function clear(): Promise<void> {
  memory.clear();
  const db = await open();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
