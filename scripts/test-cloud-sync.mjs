// Integration test of the real cloud-sync module with an in-memory Supabase
// fixture. It never sends email, creates a user, or contacts the live backend.
// Run: node scripts/test-cloud-sync.mjs (Node.js 22 or newer).
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const memory = new Map();
globalThis.localStorage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};
globalThis.location = {href: 'http://localhost:4173/'};
globalThis.window = new EventTarget();
globalThis.document = new EventTarget();

const readingStoreEvents = new EventTarget();
const readingEvents = new EventTarget();
const guest = {
  'storylight-profiles': JSON.stringify({active: 'guest1', list: [{id: 'guest1', name: 'Guest'}]}),
  'storylight-progress:guest1': JSON.stringify({'otto-shy-moon': {page: 2}}),
};
const accounts = new Map([['local-reader', {...guest}]]);
const rows = new Map();
const writes = [];
let account = 'local-reader';
let values = {...guest};
let nextUser = {id: 'parent-one', email: 'one@example.com'};
let clientCalls = 0;
let failRead = false;
const clean = data => Object.fromEntries(Object.entries(data || {}).filter(([, value]) => typeof value === 'string'));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

const fixture = {
  readingStoreEvents,
  readingEvents,
  isReadingKey: key => /^storylight-(profiles|progress:[a-zA-Z0-9-]+|souvenirs:[a-zA-Z0-9-]+)$/.test(key),
  readingSnapshot: id => ({...((id === undefined || id === account) ? values : accounts.get(id || 'local-reader') || {})}),
  replaceReadingStore: (id, data) => {
    accounts.set(account, {...values});
    account = id || 'local-reader';
    values = data === undefined ? {...accounts.get(account)} : clean(data);
    accounts.set(account, {...values});
  },
  getReadingStoreAccount: () => account,
  setReadingUser() {},
  setSavedProgress() {},
  config: {url: 'https://fixture.supabase.co', publishableKey: 'public-fixture', table: 'reading_state'},
  createClient: () => {
    clientCalls++;
    return {
      auth: {
        onAuthStateChange: () => ({data: {subscription: {unsubscribe() {}}}}),
        getSession: async () => ({data: {session: null}, error: null}),
        signInWithOtp: async options => ({data: options, error: null}),
        verifyOtp: async () => ({data: {user: nextUser}, error: null}),
        signOut: async () => ({error: null}),
      },
      from: table => {
        assert.equal(table, 'reading_state');
        return {
          select: () => ({
            eq: (field, id) => {
              assert.equal(field, 'user_id');
              return {maybeSingle: () => ({abortSignal: async () => {
                if (failRead) throw new Error('offline fixture');
                return {data: rows.get(id) || null, error: null};
              }})};
            },
          }),
          upsert: row => ({abortSignal: async () => {
            rows.set(row.user_id, structuredClone(row));
            writes.push(structuredClone(row));
            return {error: null};
          }}),
        };
      },
    };
  },
};
globalThis.__cloudTestContext = fixture;
// Exercise the actual module, substituting only its imports with fixture APIs.
let source = await fs.readFile(new URL('../dist/src/cloud-sync.js', import.meta.url), 'utf8');
source = source.replace(/^import .*;\r?\n/gm, '');
source = 'const {config,readingStoreEvents,readingSnapshot,replaceReadingStore,getReadingStoreAccount,isReadingKey,readingEvents,setReadingUser,setSavedProgress}=globalThis.__cloudTestContext;\n' + source;
const sdkImport = /await import\('\.\.\/vendor\/supabase-[\d.]+\.js'\)/;
assert.ok(sdkImport.test(source), 'The SDK import must be replaced before this test can run without network.');
source = source.replace(sdkImport, 'await Promise.resolve({createClient:globalThis.__cloudTestContext.createClient})');
const api = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

assert.equal(clientCalls, 0, 'Importing cloud-sync must not connect.');
await api.initializeCloud();
assert.equal(clientCalls, 1);
assert.equal(api.getCloudState().status, 'local');
assert.equal(account, 'local-reader');

const email = await api.sendLoginEmail('one@example.com');
assert.equal(email.error, null);
assert.equal(email.data.options.emailRedirectTo, 'http://localhost:4173/');
assert.ok((await api.sendLoginEmail('invalid')).error);
assert.ok((await api.verifyLoginCode('one@example.com', 'bad')).error);

await api.verifyLoginCode('one@example.com', '123456');
assert.equal(account, 'parent-one');
assert.equal(values['storylight-progress:guest1'], guest['storylight-progress:guest1']);
await pause(180);
assert.ok(rows.get('parent-one'));
assert.equal(api.getCloudState().status, 'synced');

await api.signOutCloud();
assert.equal(account, 'local-reader');
assert.equal(values['storylight-profiles'], guest['storylight-profiles']);

nextUser = {id: 'parent-two', email: 'two@example.com'};
rows.set('parent-two', {data: {'storylight-profiles': JSON.stringify({active: 'two', list: []})}, updated_at: new Date().toISOString()});
await api.verifyLoginCode('two@example.com', '123456');
assert.equal(account, 'parent-two');
assert.equal(values['storylight-progress:guest1'], undefined, 'The second parent must not inherit guest data.');

const changed = JSON.stringify({'otto-shy-moon': {page: 4}});
values['storylight-progress:two'] = changed;
failRead = true;
readingStoreEvents.dispatchEvent(new CustomEvent('change', {detail: {
  account, patch: {'storylight-progress:two': changed}, removed: [],
}}));
await pause(1000);
assert.equal(api.getCloudState().status, 'error');
assert.equal(values['storylight-progress:two'], changed);

failRead = false;
window.dispatchEvent(new Event('online'));
await pause(180);
assert.equal(rows.get('parent-two').data['storylight-progress:two'], changed);
assert.equal(rows.get('parent-one').data['storylight-progress:two'], undefined);
assert.equal(api.getCloudState().status, 'synced');

await api.signOutCloud();
assert.equal(account, 'local-reader');
nextUser = {id: 'parent-three', email: 'three@example.com'};
await api.verifyLoginCode('three@example.com', '123456');
assert.equal(account, 'parent-three');
assert.equal(values['storylight-progress:guest1'], undefined, 'A second new cloud account must not adopt the same visitor snapshot.');
assert.equal(rows.get('parent-three'), undefined);
await api.signOutCloud();
assert.equal(account, 'local-reader');
console.log(`PASS: lazy initialize; guest reading; email validation/redirect; first-account migration; existing/new account isolation; offline recovery; sign-out restores guest. Fixture writes: ${writes.length}.`);
