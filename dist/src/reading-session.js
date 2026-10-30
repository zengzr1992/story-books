// Ready immediately: local reading never waits for the optional cloud account.
const localUser = Object.freeze({id:'local-reader',isLocal:true});
export const readingSession = {user:localUser,membership:null,ready:true,progress:{},loading:Promise.resolve(),syncReady:true};
export const accountReady = Promise.resolve();
export const readingEvents = new EventTarget();
const emit = (name, detail) => readingEvents.dispatchEvent(new CustomEvent(name,{detail}));
export function setReadingUser(user) {
  const next=user?.id?{...user}:localUser;
  const changed=readingSession.user?.id!==next.id;
  readingSession.user=next;
  readingSession.ready = true;
  if(changed){setSavedProgress({});setReadingMembership(null);emit('reading-account-changed');}
}
export function setReadingMembership(value) {
  readingSession.membership=value;
  emit('membership-changed',value);
}
export function canReadBook(id) {return id==='otto-shy-moon';}
readingSession.authorizeBook=async id=>{if(!canReadBook(id))throw new Error('This edition contains Otto and the Shy Moon.');};
export function setSavedProgress(progress) {
  readingSession.progress = progress;
  emit('saved-progress',progress);
}
export async function waitForReadingProgress() {
  await accountReady;
  await readingSession.loading;
}
export function reportReadingProgress(detail) {
  if (!detail || !canReadBook(detail.bookId) || !Number.isInteger(detail.page) || detail.page<0 || detail.page>10) return;
  emit('reading-progress',detail);
}
export function showSignInReminder() {document.getElementById('account-open')?.click();}
export async function requestReadingFeature(feature) {
  await accountReady;
  await readingSession.loading;
  if(!['page-navigation','game-action','pin-action'].includes(feature))emit('feature',feature);
  return true;
}
export async function remindAfterFinish() {/* Progress is saved without a sign-in gate. */}

export function safeReadingReturn(value) {
  if (value === '/' || value==='/stories/otto-shy-moon/') return value;
  return '/';
}
