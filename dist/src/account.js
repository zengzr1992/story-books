import {readingEvents} from './reading-session.js';
import {readingSnapshot} from './reading-store.js';
import {currentLanguage} from './i18n.js';

// Local reading is always available. Cloud accounts are an optional adapter,
// initialized separately so a slow connection cannot block opening the book.
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = new URL('./local-account.css', import.meta.url).href;
document.head.append(style);
const COPY = {
  en: {
    account: 'Parent account', eyebrow: 'STORYCOMET · PARENT ACCOUNT', title: 'Your reading account',
    intro: 'A little reading space for your family. Your progress, readers, stars and pins are saved automatically.',
    local: 'Saved on this device · Ready to read',
    cloudIntro: 'Sign in to keep your family’s reading journey across devices, or keep reading on this device.',
    identity: 'Signed in as {email}', readers: 'Little readers', stars: 'Reading stars', pins: 'Pins found', quiz: 'Quiz answers',
    profiles: 'Manage readers', journey: 'Your reading journey', back: 'Back to the story',
    email: 'Email address', emailPlaceholder: 'you@example.com', send: 'Email me a sign-in link',
    sent: 'Check your email for a sign-in link or a code. You can keep reading while you wait.',
    code: 'Sign-in code', codeHint: 'If your email includes a code, enter it here.', verify: 'Sign in', change: 'Use a different email',
    signOut: 'Sign out', signedOut: 'Signed out. This device’s guest reading space is ready.',
    loading: 'Connecting your reading account…', syncing: 'Saving your reading journey…', synced: 'Reading journey synced',
    error: 'Cloud sync is unavailable. Your reading stays saved on this device.',
    export: 'Save a reading backup', exported: 'Your reading backup is ready.',
    privacy: 'No sign-in needed to read. Download a backup before clearing browser data. Each parent account has its own reading space.',
    close: 'Close account', waiting: 'Please wait…', emailRequired: 'Enter a valid email address.', codeRequired: 'Enter the code from your email.',
  },
  zh: {
    account: '家长账户', eyebrow: 'STORYCOMET · 家长账户', title: '你的阅读账户',
    intro: '给全家一个小小的阅读空间。阅读进度、读者档案、星星和徽章都会自动保存。',
    local: '已保存在此设备 · 随时开始阅读', cloudIntro: '登录后可在不同设备间同步全家的阅读旅程，也可以直接在此设备上继续阅读。',
    identity: '已登录：{email}', readers: '小读者', stars: '阅读星星', pins: '找到的徽章', quiz: '答对的题',
    profiles: '管理读者', journey: '你的阅读旅程', back: '回到故事',
    email: '邮箱地址', emailPlaceholder: 'you@example.com', send: '发送登录邮件',
    sent: '请检查邮箱中的登录链接或验证码。等待邮件时可以继续阅读。',
    code: '登录验证码', codeHint: '如果邮件包含验证码，可以在这里输入。', verify: '登录', change: '使用其他邮箱',
    signOut: '退出登录', signedOut: '已退出登录，可以继续使用此设备上的访客阅读空间。',
    loading: '正在连接阅读账户…', syncing: '正在保存阅读旅程…', synced: '阅读旅程已同步',
    error: '暂时无法同步云端，阅读记录仍保存在此设备上。',
    export: '下载阅读备份', exported: '阅读备份已准备好。',
    privacy: '无需登录即可阅读。清理浏览器数据前可以下载备份。每个家长账户都有独立的阅读空间。',
    close: '关闭账户', waiting: '请稍候…', emailRequired: '请输入有效的邮箱地址。', codeRequired: '请输入邮件中的验证码。',
  },
};
const text = () => COPY[currentLanguage() === 'zh' ? 'zh' : 'en'];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const dialog = document.getElementById('account-dialog');
const open = document.getElementById('account-open');
let cloud = null, cloudState = {configured: false, ready: false, user: null, status: 'local', error: null};
let busy = false, sent = false, email = '', code = '', statusKey = '', statusError = '';

function parse(value, fallback = {}) {
  try { return JSON.parse(value || 'null') || fallback; } catch { return fallback; }
}
function counts() {
  const snapshot = readingSnapshot(), list = parse(snapshot['storylight-profiles']).list;
  const readers = Array.isArray(list) ? list.length : 0;
  let stars = 0, pins = 0, quiz = 0;
  for (const [key, value] of Object.entries(snapshot)) {
    if (!key.startsWith('storylight-souvenirs:')) continue;
    const data = parse(value);
    stars += Array.isArray(data.stars?.['otto-shy-moon']) ? data.stars['otto-shy-moon'].length : 0;
    pins += Array.isArray(data.pins?.['otto-shy-moon']) ? data.pins['otto-shy-moon'].length : 0;
    quiz += Number(data.quiz?.['otto-shy-moon']?.best) || 0;
  }
  return {readers, stars, pins, quiz};
}
function showFeature(feature) {
  dialog.close();
  readingEvents.dispatchEvent(new CustomEvent('feature', {detail: feature}));
}
function preserveInput() {
  email = dialog?.querySelector('#account-email')?.value ?? email;
  code = dialog?.querySelector('#account-code')?.value ?? code;
}
function identity() {
  const copy = text();
  if (cloudState.user) return copy.identity.replace('{email}', cloudState.user.email || cloudState.user.id);
  return copy.local;
}
function setStatus(key = '', error = '') {
  statusKey = key; statusError = error;
  const output = dialog?.querySelector('#account-status');
  if (output) output.textContent = error || text()[key] || '';
}
async function run(operation, successKey = '') {
  if (busy) return;
  preserveInput(); busy = true; setStatus('waiting');
  dialog?.querySelectorAll('button[type="submit"],#account-sign-out').forEach(button => button.disabled = true);
  try {
    const result = await operation();
    if (result?.error) throw result.error;
    setStatus(successKey);
  } catch (error) { setStatus('', error?.message || text().error); }
  finally { busy = false; render(); }
}
function render() {
  if (!dialog) return;
  preserveInput();
  const copy = text(), stats = counts(), user = cloudState.user;
  const cloudStatus = cloudState.status === 'synced' ? copy.synced
    : cloudState.status === 'syncing' ? copy.syncing
    : cloudState.status === 'loading' ? copy.loading
    : cloudState.status === 'error' ? copy.error : '';
  dialog.classList.add('local-reading-account');
  dialog.innerHTML = `
    <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
    <button id="account-close" class="account-close folio-close" aria-label="${copy.close}">×</button>
    <header class="folio-head">
      <div class="portrait medallion" aria-hidden="true"><i class="icon icon-account"></i></div>
      <div><span class="eyebrow account-eyebrow">${copy.eyebrow}</span>
        <h2 id="account-title">${copy.title}</h2>
        <p id="account-intro" class="panel-description">${copy.intro}</p>
      </div>
    </header>
    <div class="folio-rule"><i class="icon icon-star"></i></div>
    <p id="account-identity" class="local-reading-state"><i class="icon icon-book" aria-hidden="true"></i><span>${esc(identity())}</span></p>
    ${cloudStatus ? `<p class="local-cloud-status" role="status">${cloudStatus}</p>` : ''}
    <div class="local-reading-stats">
      ${[['readers', 'moon', stats.readers], ['stars', 'star', stats.stars], ['pins', 'hand', stats.pins], ['quiz', 'magic', stats.quiz]]
        .map(([key, icon, n]) => `<div><i class="icon icon-${icon}" aria-hidden="true"></i><strong>${esc(n)}</strong><span>${copy[key]}</span></div>`).join('')}
    </div>
    <div class="panel-actions local-reading-actions">
      <button id="account-readers" class="account-primary pill-button small"><i class="icon icon-account"></i><span>${copy.profiles}</span></button>
      <button id="account-journey" class="account-primary pill-button small"><i class="icon icon-book"></i><span>${copy.journey}</span></button>
    </div>
    ${cloudState.configured ? `<div class="folio-rule"><i class="icon icon-star"></i></div>
      ${user ? `<div class="panel-actions"><button id="account-sign-out" class="pill-button small" ${busy ? 'disabled' : ''}><i class="icon icon-home"></i><span>${copy.signOut}</span></button></div>`
        : `<p class="local-reading-note">${copy.cloudIntro}</p>
          <form id="account-email-form" class="folio-form local-cloud-form" ${sent ? 'hidden' : ''}>
            <label for="account-email">${copy.email}</label>
            <input id="account-email" name="email" type="email" required autocomplete="email" maxlength="254" placeholder="${copy.emailPlaceholder}" value="${esc(email)}" />
            <div class="panel-actions"><button class="account-primary pill-button tall" type="submit" ${busy ? 'disabled' : ''}><i class="icon icon-magic"></i><span>${copy.send}</span></button></div>
          </form>
          <form id="account-code-form" class="folio-form local-cloud-form" ${sent ? '' : 'hidden'}>
            <p class="local-reading-note">${copy.sent}</p>
            <label for="account-code">${copy.code}</label>
            <input id="account-code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" minlength="6" maxlength="8" required aria-describedby="account-code-hint" value="${esc(code)}" />
            <small id="account-code-hint">${copy.codeHint}</small>
            <div class="panel-actions"><button class="account-primary pill-button tall" type="submit" ${busy ? 'disabled' : ''}><i class="icon icon-star"></i><span>${copy.verify}</span></button></div>
            <button id="account-change-email" type="button" class="account-text-button">${copy.change}</button>
          </form>`}` : ''}
    <div class="folio-rule"><i class="icon icon-star"></i></div>
    <p class="local-reading-note">${copy.privacy}</p>
    <div class="panel-actions local-reading-actions">
      <button id="account-export" class="pill-button small"><i class="icon icon-magic"></i><span>${copy.export}</span></button>
      <button id="account-back" class="pill-button small"><i class="icon icon-home"></i><span>${copy.back}</span></button>
    </div>
    <p id="account-status" class="status-line" role="status" aria-live="polite">${esc(statusError || copy[statusKey] || '')}</p>`;
  dialog.querySelector('#account-close').onclick = () => dialog.close();
  dialog.querySelector('#account-back').onclick = () => dialog.close();
  dialog.querySelector('#account-readers').onclick = () => showFeature('kids');
  dialog.querySelector('#account-journey').onclick = () => showFeature('progress');
  dialog.querySelector('#account-email-form')?.addEventListener('submit', event => {
    event.preventDefault();
    if (!cloud || busy) return;
    email = dialog.querySelector('#account-email').value.trim();
    if (!dialog.querySelector('#account-email').checkValidity()) { setStatus('emailRequired'); return; }
    void run(async () => {
      const result = await cloud.sendLoginEmail(email);
      if (!result?.error) sent = true;
      return result;
    }, 'sent');
  });
  dialog.querySelector('#account-code-form')?.addEventListener('submit', event => {
    event.preventDefault();
    if (!cloud || busy) return;
    code = dialog.querySelector('#account-code').value.trim();
    if (!/^[0-9]{6,8}$/.test(code)) { setStatus('codeRequired'); return; }
    void run(() => cloud.verifyLoginCode(email, code));
  });
  const changeEmail = dialog.querySelector('#account-change-email');
  if (changeEmail) changeEmail.onclick = () => { preserveInput(); sent = false; code = ''; setStatus(); render(); dialog.querySelector('#account-email')?.focus(); };
  const signOut = dialog.querySelector('#account-sign-out');
  if (signOut) signOut.onclick = () => { if (cloud) void run(() => cloud.signOutCloud(), 'signedOut'); };
  dialog.querySelector('#account-export').onclick = () => {
    const contents = JSON.stringify({version: 1, exportedAt: new Date().toISOString(), values: readingSnapshot()}, null, 2);
    const url = URL.createObjectURL(new Blob([contents], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = url; link.download = 'storycomet-reading-backup.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('exported');
  };
  if (open) open.textContent = copy.account;
}
function acceptCloudState(next) {
  const previousId = cloudState.user?.id;
  cloudState = next;
  if (previousId !== next.user?.id) { sent = false; code = ''; setStatus(); }
  if (previousId && !next.user) email = '';
  // Do not replace a focused login field for routine background sync events.
  const focusedInput = dialog?.contains(document.activeElement) && ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
  if (!focusedInput || previousId !== next.user?.id) render();
}
if (dialog && open) {
  render();
  open.addEventListener('click', () => {
    readingEvents.dispatchEvent(new Event('pause-reading'));
    render();
    for (const other of document.querySelectorAll('dialog[open]')) if (other !== dialog) other.close();
    if (!dialog.open) dialog.showModal();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  new MutationObserver(() => render()).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  void import('./cloud-sync.js').then(async adapter => {
    cloud = adapter;
    for (const name of ['change', 'status']) adapter.cloudEvents.addEventListener(name, event => acceptCloudState(event.detail || adapter.getCloudState()));
    acceptCloudState(adapter.getCloudState());
    await adapter.initializeCloud();
    acceptCloudState(adapter.getCloudState());
  }).catch(() => { cloud = null; cloudState = {...cloudState, configured: false, ready: true, status: 'local'}; render(); });
}
