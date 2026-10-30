import config from './cloud-config.js';
import {readingStoreEvents, readingSnapshot, replaceReadingStore, getReadingStoreAccount, isReadingKey} from './reading-store.js';
import {readingEvents, setReadingUser, setSavedProgress} from './reading-session.js';

// Optional cloud storage. Guest reading remains available when the network is
// unavailable, and accounts never share the browser's local reading namespace.
export const cloudEvents = new EventTarget();
const state = {configured: Boolean(config.url && config.publishableKey), ready: false, user: null, status: 'local', error: null};
const META_KEY = 'storycomet-cloud-pending:v1:';
const MIGRATED_KEY = 'storycomet-cloud-guest-owner:v1';
let client, initialization, accountLoad, desiredId = null, generation = 0;
let timer, flushing = false, retryCount = 0;
const pendingByUser = new Map();
let guestOwner;
const clean = data => Object.fromEntries(Object.entries(data && typeof data === 'object' && !Array.isArray(data) ? data : {})
  .filter(([key, value]) => isReadingKey(key) && typeof value === 'string'));
const errorOf = error => error instanceof Error ? error : new Error(error?.message || String(error || 'Cloud request failed.'));
export function getCloudState() {return {...state, user: state.user ? {...state.user} : null};}
function emit(type = 'status') {cloudEvents.dispatchEvent(new CustomEvent(type, {detail: getCloudState()}));}
function status(value, error = null) {state.status = value; state.error = error ? errorOf(error).message : null; emit();}
function storageGet(key) {try {return localStorage.getItem(key);} catch {return null;}}
function storageSet(key, value) {try {localStorage.setItem(key, value);} catch { /* Reading is still available without persistent storage. */ }}
function pending(userId) {
  if (!pendingByUser.has(userId)) {
    let source;
    try {source = JSON.parse(storageGet(META_KEY + userId) || 'null');} catch {source = null;}
    pendingByUser.set(userId, {patch: clean(source?.patch), removed: new Set((Array.isArray(source?.removed) ? source.removed : []).filter(isReadingKey))});
  }
  return pendingByUser.get(userId);
}
function persistPending(userId) {
  const record = pending(userId);
  storageSet(META_KEY + userId, JSON.stringify({patch: record.patch, removed: [...record.removed]}));
}
function hasPending(userId) {const p = pending(userId); return Object.keys(p.patch).length > 0 || p.removed.size > 0;}
function applyPending(data, userId) {
  const result = {...clean(data), ...pending(userId).patch};
  for (const key of pending(userId).removed) delete result[key];
  return result;
}
function notePending(userId, patch, removed = []) {
  const p = pending(userId);
  for (const [key, value] of Object.entries(clean(patch))) {p.patch[key] = value; p.removed.delete(key);}
  for (const key of removed.filter(isReadingKey)) {delete p.patch[key]; p.removed.add(key);}
  persistPending(userId);
}
function refreshReader() {
  setSavedProgress({});
  readingEvents.dispatchEvent(new Event('profile-state-ready'));
}
function switchStore(user, data) {
  replaceReadingStore(user?.id || null, data);
  setReadingUser(user);
  refreshReader();
}
const requestSignal = () => AbortSignal.timeout(10000);
async function cloudFetch(input, init = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) abort();
  else init.signal?.addEventListener('abort', abort, {once: true});
  const timeout = setTimeout(abort, 10000);
  try {return await fetch(input, {...init, signal: controller.signal});}
  finally {clearTimeout(timeout); init.signal?.removeEventListener('abort', abort);}
}
async function readRemote(userId) {
  const {data, error} = await client.from(config.table).select('data,updated_at').eq('user_id', userId).maybeSingle().abortSignal(requestSignal());
  if (error) throw errorOf(error);
  return data;
}
function schedule(delay = 900) {
  clearTimeout(timer);
  if (!state.user || !client) return;
  timer = setTimeout(() => {void flush();}, delay);
}
async function flush() {
  const userId = state.user?.id;
  if (!userId || !client || flushing || getReadingStoreAccount() !== userId || !hasPending(userId)) return;
  flushing = true;
  const stamp = generation;
  const snapshot = {patch: {...pending(userId).patch}, removed: [...pending(userId).removed]};
  status('syncing');
  try {
    // Merge only changed top-level reading keys into the latest cloud row. This
    // preserves other children's data edited by another device in the meantime.
    const remote = await readRemote(userId);
    if (stamp !== generation || state.user?.id !== userId) return;
    const merged = {...clean(remote?.data), ...snapshot.patch};
    for (const key of snapshot.removed) delete merged[key];
    const {error} = await client.from(config.table).upsert({user_id: userId, data: merged, updated_at: new Date().toISOString()}, {onConflict: 'user_id'}).abortSignal(requestSignal());
    if (error) throw errorOf(error);
    if (stamp !== generation || state.user?.id !== userId) return;
    const p = pending(userId);
    for (const [key, value] of Object.entries(snapshot.patch)) if (p.patch[key] === value) delete p.patch[key];
    for (const key of snapshot.removed) p.removed.delete(key);
    persistPending(userId);
    retryCount = 0;
    status(hasPending(userId) ? 'syncing' : 'synced');
  } catch (error) {
    if (stamp === generation) {status('error', error); retryCount++;}
  } finally {
    flushing = false;
    if (state.user && hasPending(state.user.id)) schedule(Math.min(30000, 1500 * (2 ** Math.min(retryCount, 4))));
  }
}
async function loadAccount(user) {
  const id = user?.id || null;
  if (accountLoad && id === desiredId) return accountLoad;
  desiredId = id;
  const stamp = ++generation;
  clearTimeout(timer);
  const task = (async () => {
    state.user = user ? {id: user.id, email: user.email || ''} : null;
    state.ready = true;
    if (!user) {
      if (getReadingStoreAccount() !== 'local-reader') switchStore(null);
      status('local'); emit('change'); return;
    }
    status('loading'); emit('change');
    try {
      const remote = await readRemote(id);
      if (stamp !== generation) return;
      let data = remote ? clean(remote.data) : readingSnapshot(id);
      // A visitor's first account may adopt its local books. Once assigned,
      // the same visitor snapshot is never silently copied to a second parent.
      guestOwner ??= storageGet(MIGRATED_KEY) || '';
      if (!remote && Object.keys(data).length === 0 && !guestOwner) {
        data = readingSnapshot(null);
        if (Object.keys(data).length) {guestOwner = id; storageSet(MIGRATED_KEY, id);}
      }
      if (!remote && Object.keys(data).length) notePending(id, data);
      switchStore(user, applyPending(data, id));
      retryCount = 0;
      status(hasPending(id) ? 'syncing' : 'synced'); emit('change');
      if (hasPending(id)) schedule(100);
    } catch (error) {
      if (stamp !== generation) return;
      const cached = readingSnapshot(id);
      // Never create an empty cloud account over an unread remote row. A
      // first-time offline login stays in the guest reader until it can load.
      if (Object.keys(cached).length) switchStore(user, applyPending(cached, id));
      status('error', error); emit('change');
    }
  })();
  accountLoad = task;
  try {await task;} finally {if (accountLoad === task) accountLoad = null;}
}

export function initializeCloud() {
  if (initialization) return initialization;
  initialization = (async () => {
    if (!state.configured) {state.ready = true; emit('change'); return getCloudState();}
    try {
      const {createClient} = await import('../vendor/supabase-2.118.0.js');
      client = createClient(config.url, config.publishableKey, {global: {fetch: cloudFetch}, auth: {
        storageKey: 'storycomet-cloud-auth-v1', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true,
      }});
      client.auth.onAuthStateChange((event, session) => {
        // Supabase's auth lock must be released before any database call.
        setTimeout(() => {
          const next = session?.user || null;
          if (event === 'TOKEN_REFRESHED' && state.user?.id === next?.id) {if (next && hasPending(next.id)) schedule(100); return;}
          if (state.ready && state.user?.id === next?.id && getReadingStoreAccount() === (next?.id || 'local-reader')) return;
          void loadAccount(next);
        }, 0);
      });
      const {data, error} = await client.auth.getSession();
      if (error) throw error;
      await loadAccount(data.session?.user || null);
    } catch (error) {state.ready = true; status('error', error); emit('change');}
    return getCloudState();
  })();
  return initialization;
}

function emailValue(email) {
  const value = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254) throw new Error('Please enter a valid email address.');
  return value;
}
export async function sendLoginEmail(email) {
  try {
    const value = emailValue(email);
    await initializeCloud();
    if (!client) throw new Error('Cloud sign-in is unavailable. You can keep reading locally.');
    return await client.auth.signInWithOtp({email: value, options: {emailRedirectTo: new URL('/', location.href).href}});
  } catch (error) {return {error: errorOf(error)};}
}
export async function verifyLoginCode(email, token) {
  try {
    const value = emailValue(email), code = String(token || '').trim();
    if (!/^\d{6,8}$/.test(code)) throw new Error('Enter the code from your sign-in email.');
    await initializeCloud();
    if (!client) throw new Error('Cloud sign-in is unavailable. You can keep reading locally.');
    const result = await client.auth.verifyOtp({email: value, token: code, type: 'email'});
    if (!result.error && result.data?.user) await loadAccount(result.data.user);
    return result;
  } catch (error) {return {error: errorOf(error)};}
}
export async function signOutCloud() {
  try {
    await initializeCloud();
    if (state.user && hasPending(state.user.id)) await flush();
    const result = client ? await client.auth.signOut({scope: 'local'}) : {error: null};
    if (!result.error) await loadAccount(null);
    return result;
  } catch (error) {return {error: errorOf(error)};}
}

readingStoreEvents.addEventListener('change', ({detail}) => {
  if (!state.user || detail?.account !== state.user.id) return;
  notePending(state.user.id, detail.patch || {}, detail.removed || []);
  status('syncing'); schedule();
});
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (!state.user) return;
    if (getReadingStoreAccount() !== state.user.id) void loadAccount(state.user);
    else if (hasPending(state.user.id)) schedule(100);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.user && hasPending(state.user.id)) schedule(100);
  });
}
