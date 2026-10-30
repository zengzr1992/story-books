"""Convert retained public resources into a self-contained bilingual edition."""
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup
import json, re

ROOT=Path(__file__).resolve().parents[1]
D=ROOT/'dist'
BASE='https://storycomet.app/'

def download(pair):
    path,url=pair
    dest=D/path
    if dest.exists(): return
    data=urlopen(url,timeout=40).read()
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(data)

def main():
    # Small JSON manifests are served by the original site rather than its asset API.
    for p in ['public/models/toys/manifest.json','public/audio/sfx/manifest.json']:
        download((p,BASE+p))
    # Vendor the exact original Three.js version and only its imported module closure.
    pending={'build/three.module.js'}
    for file in D.rglob('*.js'):
        if 'vendor' in file.parts: continue
        pending.update('examples/jsm/'+p for p in re.findall(r'[\'"]three/addons/([^\'"]+)',file.read_text(encoding='utf-8')))
    seen=set()
    while pending:
        batch=pending-seen
        if not batch: break
        list(ThreadPoolExecutor(max_workers=10).map(download,[(f'vendor/three/{p}',f'https://cdn.jsdelivr.net/npm/three@0.170.0/{p}') for p in batch]))
        pending=set()
        for p in batch:
            seen.add(p)
            code=(D/'vendor/three'/p).read_text(encoding='utf-8')
            for ref in re.findall(r'from\s*[\'"]([^\'"]+)[\'"]',code):
                if ref.startswith('.'):
                    pending.add(urljoin('https://vendor/'+p,ref).removeprefix('https://vendor/'))

    mappings={}
    for c in (ROOT/'reference').glob('*-assets.json'):
        data=json.loads(c.read_text(encoding='utf-8'))
        mappings.update({url:'/'+path for path,url in data.get('assets',{}).items() if (D/path).exists()})
    for f in D.rglob('*'):
        if f.suffix not in ('.css','.html','.js','.json') or 'vendor' in f.parts: continue
        if f.name in ('account.js','reading-session.js','reading-store.js'): continue
        text=f.read_text(encoding='utf-8')
        for old,new in mappings.items(): text=text.replace(old,new)
        f.write_text(text,encoding='utf-8')
    # Scope the library itself, so totals, shelf toys, and avatars follow the edition.
    p=D/'books/index.json'
    library=json.loads(p.read_text(encoding='utf-8'))
    library['books']=library['books'][:1]
    for b in library['books']:
        for k in ['titles','blurbs','art']:
            if k in b: b[k]={lang:v for lang,v in b[k].items() if lang=='zh'}
    p.write_text(json.dumps(library,ensure_ascii=False,indent=2),encoding='utf-8')
    (D/'src/runtime-config.js').write_text('export default {assetEndpoint:null,assetRevision:"local"};\n',encoding='utf-8')

    soup=BeautifulSoup((D/'index.html').read_text(encoding='utf-8'),'html.parser')
    for node in soup.select('#pricing-dialog, script[src="src/analytics.js"], noscript, .app-switch, .account-plans-link, .account-legal, link[rel="canonical"], script[type="application/ld+json"]'):
        node.decompose()
    for node in soup.select('[data-lang="fr"], [data-lang="es"], [data-lang="ja"]'): node.decompose()
    for node in soup.select('a[href="/stories/"]'): node['href']='#'
    for node in soup.select('link[rel="preconnect"]'): node.decompose()
    soup.select_one('script[type="importmap"]').string=json.dumps({'imports':{'three':'/vendor/three/build/three.module.js','three/addons/':'/vendor/three/examples/jsm/'}},indent=2)
    soup.title.string='StoryComet · Otto and the Shy Moon · 奥托和害羞的月亮'
    soup.select_one('meta[name="description"]')['content']='中英文立体互动绘本：奥托和害羞的月亮。朗读、探索、收藏和测验。'
    (D/'index.html').write_text(str(soup),encoding='utf-8')

    p=D/'src/ui.js'; code=p.read_text(encoding='utf-8')
    code=re.sub(r'  \{ code: "(?:fr|es|ja)",[^\n]+\n','',code)
    code=code.replace('return { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };','const settings = { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };\n    if (!["en", "zh"].includes(settings.language)) settings.language = "en";\n    if (!["auto", "bundled", "browser"].includes(settings.voice)) settings.voice = "bundled";\n    return settings;')
    code=code.replace('${option("openai", t("openaiLive"), s.voice)}','')
    code=code.replace('${row("moon", t("openaiVoice"), "gpt-4o-mini-tts", `','${false ? row("moon", t("openaiVoice"), "", `')
    # Keep the row absent while preserving surrounding template syntax.
    code=code.replace('</select>`)}\n        ${row("listen", t("browserVoiceShort")','</select>`) : ""}\n        ${row("listen", t("browserVoiceShort")')
    code=code.replace('panel.querySelector("#set-openai-voice").addEventListener','panel.querySelector("#set-openai-voice")?.addEventListener')
    code=code.replace('openai ? t("openaiConnected") : t("openaiMissing")','t("bundledNarrator")')
    p.write_text(code,encoding='utf-8')

    p=D/'src/narration.js';code=p.read_text(encoding='utf-8')
    start=code.index('  async checkServer() {'); end=code.index('\n  provider() {',start)
    code=code[:start]+'  async checkServer() {\n    this.server.checked = true;\n    this.server.openai = false;\n    return this.server;\n  }\n'+code[end:]
    p.write_text(code,encoding='utf-8')
    p=D/'src/i18n.js';code=p.read_text(encoding='utf-8')
    start=code.index('const fr ='); end=code.index('const zh =')
    code=code[:start]+code[end:]
    code=code.replace('export const STRINGS = { en, fr, es, ja, zh };','export const STRINGS = { en, zh };')
    p.write_text(code,encoding='utf-8')
    p=D/'src/shelf.js';code=p.read_text(encoding='utf-8').replace('(i - (PER_PAGE - 1) / 2) * SPACING','(i - (Math.min(books.length, PER_PAGE) - 1) / 2) * SPACING')
    p.write_text(code,encoding='utf-8')
    # These two optional original resources are unavailable even on the original.
    p=D/'src/main.js';code=p.read_text(encoding='utf-8')
    code=code.replace('textures.lockModel = (await new GLTFLoader().loadAsync("public/models/lock.glb")).scene;','textures.lockModel = null;')
    code=code.replace('sound.decode("public/audio/music.m4a").then','Promise.resolve(null).then')
    p.write_text(code,encoding='utf-8')
    print('Prepared standalone edition; Three modules:',len(seen))

if __name__=='__main__': main()
