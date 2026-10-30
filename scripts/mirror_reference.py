"""Acquire the publicly served modules and the first free book's assets."""
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import urljoin, urlsplit
from concurrent.futures import ThreadPoolExecutor, as_completed
import json, re, time

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
REF = ROOT / 'reference'
BASE = 'https://storycomet.app/'
REV = '9bc5b0df92549966413e16fa'

def get(url):
    for attempt in range(3):
        try:
            return urlopen(Request(url, headers={'User-Agent':'Mozilla/5.0'}), timeout=45).read()
        except Exception:
            if attempt == 2: raise
            time.sleep(1)

def download(path, url=None):
    target = DIST / path
    if target.exists(): return target.read_bytes()
    data = get(url or urljoin(BASE,path))
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes(data)
    return data

def main():
    DIST.mkdir(exist_ok=True)
    pending = {'index.html','src/main.js','books/otto-shy-moon/scenes.js',
               'books/otto-shy-moon/story.json','books/index.json','public/fonts/fonts.css'}
    seen = set()
    # Recursively retain relative ESM imports, stylesheets, and font URLs.
    while pending:
        batch = pending - seen
        if not batch: break
        pending = set()
        with ThreadPoolExecutor(max_workers=10) as pool:
            jobs = {pool.submit(download,p):p for p in batch}
            for job in as_completed(jobs):
                p = jobs[job]; seen.add(p)
                try: content = job.result().decode('utf-8')
                except UnicodeDecodeError: continue
                except Exception as e: print('SOURCE ERROR',p,str(e),flush=True); continue
                if not p.endswith(('.js','.css','.html')): continue
                refs = re.findall(r'(?:from\s*|import\s*)[\'\"]([^\'\"]+)[\'\"]',content)
                refs += re.findall(r'(?:src|href)=[\'\"]([^\'\"]+)[\'\"]',content) if p.endswith('.html') else []
                refs += re.findall(r'url\([\'\"]?([^\)\'\"]+)',content) if p.endswith('.css') else []
                for ref in refs:
                    if ref.startswith(('http:','https:','data:','#')) or ref in ('three','@supabase/supabase-js'): continue
                    if ref.startswith('three/'): continue
                    resolved = urlsplit(urljoin(BASE+p,ref)).path.lstrip('/')
                    if resolved.endswith(('.js','.css','.woff2','.woff','.ttf','.png','.webp','.jpg','.svg')):
                        pending.add(resolved)
        print('Source modules:',len(seen),flush=True)

    catalogs = []
    for scope, lang in [('shared','en'),('shelf','en'),('shelf','zh'),('book','en'),('book','zh')]:
        url = f'{BASE}api/assets?scope={scope}&lang={lang}&v={REV}'
        if scope == 'book': url += '&book=otto-shy-moon'
        catalog = json.loads(get(url))
        (REF/f'{scope}-{lang}-assets.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
        catalogs.append(catalog)
    all_assets = {}
    for c in catalogs: all_assets.update(c['assets'])
    # Only the first book, only en/zh. Shared decorative toys stay intact.
    assets = {p:u for p,u in all_assets.items() if
        (not p.startswith('books/') or p.startswith('books/otto-shy-moon/')) and
        not re.search(r'(?:/lang/|/titles/|/quiz/)(fr|es|ja)(?:/|\.)',p) and
        not re.search(r'\.(fr|es|ja)\.',p) and
        not re.search(r'/flags/(fr|es|ja)\.',p) and
        (not p.startswith('public/textures/walls/') or re.search(r'/(default|otto-shy-moon)(-normal)?\.jpg$',p))}
    errors=[]
    with ThreadPoolExecutor(max_workers=12) as pool:
        jobs = {pool.submit(download,p,u):p for p,u in assets.items()}
        for i,job in enumerate(as_completed(jobs)):
            try: job.result()
            except Exception as e: errors.append([jobs[job],str(e)])
            if (i+1)%40 == 0: print(f'Assets: {i+1}/{len(jobs)}',flush=True)
    (REF/'asset-downloads.json').write_text(json.dumps({'files':len(assets),'errors':errors},indent=2),encoding='utf-8')
    print('DONE',len(assets),'assets; errors:',errors,flush=True)

if __name__=='__main__': main()
