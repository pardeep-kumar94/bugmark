// IndexedDB storage shared by the service worker, popup and report pages.
const DB_NAME = 'bugmark';
const DB_VERSION = 2;

let dbPromise;
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('items')) {
        const s = db.createObjectStore('items', { keyPath: 'id' });
        s.createIndex('host', 'host');
        s.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      if (!db.objectStoreNames.contains('media')) db.createObjectStore('media'); // screen recordings (Blob) by id
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

const done = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
const txDone = (tx) => new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });

export async function addItem(item) {
  const db = await openDb();
  const tx = db.transaction(['items', 'meta'], 'readwrite');
  const meta = tx.objectStore('meta');
  const seq = ((await done(meta.get('seq'))) || 0) + 1;
  meta.put(seq, 'seq');
  const full = { id: crypto.randomUUID(), seq, status: 'open', createdAt: Date.now(), updatedAt: Date.now(), ...item };
  full.seq = seq;
  tx.objectStore('items').put(full);
  await txDone(tx);
  return full;
}

export async function putItems(items) {
  const db = await openDb();
  const tx = db.transaction(['items', 'meta'], 'readwrite');
  const store = tx.objectStore('items');
  const meta = tx.objectStore('meta');
  let seq = (await done(meta.get('seq'))) || 0;
  for (const it of items) { store.put(it); seq = Math.max(seq, it.seq || 0); }
  meta.put(seq, 'seq');
  await txDone(tx);
}

export async function getAll() {
  const db = await openDb();
  const items = await done(db.transaction('items').objectStore('items').getAll());
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getItem(id) {
  const db = await openDb();
  return done(db.transaction('items').objectStore('items').get(id));
}

export async function updateItem(id, patch) {
  const db = await openDb();
  const tx = db.transaction('items', 'readwrite');
  const store = tx.objectStore('items');
  const cur = await done(store.get(id));
  if (!cur) return null;
  const next = { ...cur, ...patch, updatedAt: Date.now() };
  store.put(next);
  await txDone(tx);
  return next;
}

export async function deleteItems(ids) {
  const db = await openDb();
  const items = await Promise.all(ids.map((id) => done(db.transaction('items').objectStore('items').get(id))));
  const tx = db.transaction(['items', 'media'], 'readwrite');
  ids.forEach((id) => tx.objectStore('items').delete(id));
  items.forEach((it) => { if (it?.video?.mediaId) tx.objectStore('media').delete(it.video.mediaId); });
  await txDone(tx);
}

// ---- media (recordings)
export async function putMedia(id, blob) {
  const db = await openDb();
  const tx = db.transaction('media', 'readwrite');
  tx.objectStore('media').put(blob, id);
  await txDone(tx);
}
export async function getMedia(id) {
  const db = await openDb();
  return done(db.transaction('media').objectStore('media').get(id));
}
export async function deleteMedia(id) {
  const db = await openDb();
  const tx = db.transaction('media', 'readwrite');
  tx.objectStore('media').delete(id);
  await txDone(tx);
}

export async function countByHost(host) {
  const db = await openDb();
  const store = db.transaction('items').objectStore('items');
  const [site, total] = await Promise.all([
    host ? done(store.index('host').count(host)) : 0,
    done(store.count()),
  ]);
  return { site, total };
}
