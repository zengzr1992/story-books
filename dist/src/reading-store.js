// The guest and each cloud account own separate browser snapshots. Reading is
// available offline; the original change-event API remains available for sync.
export const readingStoreEvents = new EventTarget();
const LOCAL_ACCOUNT = 'local-reader';
const prefix = 'storycomet-reading-store:v1:';
export const isReadingKey = key => typeof key === 'string' && /^storylight-(?:profiles|(?:progress|souvenirs)(?::[a-zA-Z0-9-]{1,64})?)$/.test(key);
const clean = data => Object.fromEntries(Object.entries(data && typeof data === 'object' ? data : {})
  .filter(([key, value]) => isReadingKey(key) && typeof value === 'string'));
const storageKey = id => prefix + encodeURIComponent(id || LOCAL_ACCOUNT);
let account = LOCAL_ACCOUNT;
const memory = new Map();

function load(id) {
  if (memory.has(id)) return {...memory.get(id)};
  try {
    const source = JSON.parse(localStorage.getItem(storageKey(id)) || 'null');
    if (source?.version === 1) return clean(source.values);
    if (id === LOCAL_ACCOUNT) {
      const legacy = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (isReadingKey(key)) legacy[key] = localStorage.getItem(key);
      }
      return legacy;
    }
  } catch { /* Keep an in-memory reader when browser storage is unavailable. */ }
  return {};
}
let values = load(account);
function persist() {
  memory.set(account, {...values});
  try { localStorage.setItem(storageKey(account), JSON.stringify({version: 1, values})); }
  catch { /* Reading continues when browser storage is unavailable or full. */ }
}
function notify(patch, removed = []) {
  readingStoreEvents.dispatchEvent(new CustomEvent('change', {detail: {account, patch, removed}}));
}
export function getReadingStoreAccount() { return account; }
export function restoreReadingStore(userId) { replaceReadingStore(userId); }
export function replaceReadingStore(userId, data) {
  persist();
  account = userId || LOCAL_ACCOUNT;
  values = data === undefined ? load(account) : clean(data);
  persist();
  readingStoreEvents.dispatchEvent(new CustomEvent('replace', {detail: {account}}));
}
export function readingSnapshot(userId) { return {...(userId === undefined || userId === account ? values : load(userId || LOCAL_ACCOUNT))}; }
export const readingStore = {
  getItem(key) { return isReadingKey(key) ? values[key] ?? null : null; },
  setItem(key, value) {
    if (!isReadingKey(key)) return;
    values[key] = String(value);
    persist();
    notify({[key]: String(value)});
  },
  removeItem(key) {
    if (!isReadingKey(key)) return;
    delete values[key];
    persist();
    notify({}, [key]);
  },
};
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key !== storageKey(account) || !event.newValue) return;
  try {
    const saved = JSON.parse(event.newValue);
    if (saved.version !== 1) return;
    values = clean(saved.values);
    memory.set(account, {...values});
    readingStoreEvents.dispatchEvent(new CustomEvent('replace', {detail: {account}}));
  } catch { /* Ignore malformed updates from another tab. */ }
});
