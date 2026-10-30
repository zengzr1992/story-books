"""Exercise the local edition in installed Edge; no email is sent."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json,sys
sys.stdout.reconfigure(encoding="utf-8")

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'
OUT.mkdir(exist_ok=True)

def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
        context=browser.new_context(viewport={'width':1280,'height':720},locale='en-US',reduced_motion='reduce')
        page=context.new_page()
        errors=[]; bad=[]; original=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('response',lambda r:bad.append([r.status,r.url]) if r.status>=400 else None)
        page.on('request',lambda r:original.append(r.url) if 'storycomet.app' in r.url else None)
        try:
            page.goto('http://localhost:4173')
            page.locator('#shelf-strip').wait_for(state='visible',timeout=60000)
            expect(page.locator('.shelf-books [data-book]')).to_have_count(1)
            page.wait_for_timeout(1600)
            page.screenshot(path=str(OUT/'shelf-en.png'))
            page.locator('#btn-language').click()
            expect(page.locator('#language-menu [data-lang]')).to_have_count(2)
            page.locator('[data-lang="zh"]').click()
            expect(page.locator('html')).to_have_attribute('lang','zh')
            page.locator('.shelf-books [data-book]').click()
            page.locator('#btn-open').wait_for(state='visible',timeout=60000)
            page.screenshot(path=str(OUT/'cover-zh.png'))
            page.locator('#btn-open').click()
            page.locator('#text-panel').wait_for(state='visible',timeout=15000)
            page.locator('#mode-self').click()
            expect(page.locator('#page-heading')).to_contain_text('窗')
            page.wait_for_timeout(1500)
            page.screenshot(path=str(OUT/'reading-zh.png'))
            page.locator('#read-done').click()
            page.locator('#btn-next').click()
            expect(page.locator('#page-eyebrow')).to_contain_text('2')
            # Navigation and collecting a page star work without authentication.
            page.locator('#btn-language').click();page.locator('[data-lang="en"]').click()
            expect(page.locator('html')).to_have_attribute('lang','en')
            page.locator('#mode-self').click()
            page.screenshot(path=str(OUT/'reading-en.png'))
            # Every spread must build successfully and display its own story text.
            story=json.loads((ROOT/'dist/books/otto-shy-moon/story.json').read_text(encoding='utf-8'))
            for index,spread in enumerate(story['pages']):
                page.locator('#dots [role=button]').nth(index).click()
                expect(page.locator('#page-heading')).to_have_text(spread['heading'],timeout=15000)
                page.wait_for_timeout(650)
                print('Spread passed:',index+1,flush=True)
            # Jump to the end and exercise a real quiz answer.
            page.locator('#dots [role=button]').last.click()
            page.locator('#btn-quiz').wait_for(state='visible')
            page.locator('#btn-quiz').click()
            page.locator('.quiz-options button').first.wait_for(state='visible')
            page.screenshot(path=str(OUT/'quiz-en.png'))
            for index,question in enumerate(story['quiz']['questions']):
                expect(page.locator('.quiz-eyebrow')).to_have_text(f'Question {index+1} of 5',timeout=20000)
                page.locator(f'.quiz-options button[data-index="{question["answer"]}"]').click()
                if index+1<len(story['quiz']['questions']):
                    expect(page.locator('.quiz-eyebrow')).to_have_text(f'Question {index+2} of 5',timeout=20000)
                print('Quiz answer passed:',index+1,flush=True)
            page.locator('.quiz-done').wait_for(state='visible',timeout=20000)
            expect(page.locator('.quiz-score')).to_contain_text('Every star')
            page.screenshot(path=str(OUT/'quiz-finished.png'))
            page.locator('.quiz-close').click()
            page.locator('#btn-settings').click()
            page.locator('#set-language').wait_for(state='visible')
            expect(page.locator('#set-language option')).to_have_count(2)
            page.wait_for_timeout(1000)
            page.screenshot(path=str(OUT/'settings-en.png'))
            # Local reading storage survives a new document.
            stored=page.evaluate("Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('storycomet-reading-store'))) ")
            assert stored,'No persisted reading snapshot'
            page.reload();page.locator('#shelf-strip').wait_for(state='visible',timeout=60000)
            assert page.evaluate("Object.keys(localStorage).some(k=>k.startsWith('storycomet-reading-store'))")
            # The parent dialog is local and uses the same illustrated folio language.
            page.locator('#btn-account').click()
            page.locator('.profile-card').first.wait_for(state='visible')
            page.screenshot(path=str(OUT/'profiles-en.png'))
            mobile=context.new_page();mobile.set_viewport_size({'width':390,'height':844})
            mobile.goto('http://localhost:4173');mobile.locator('#shelf-strip').wait_for(state='visible',timeout=60000)
            mobile.wait_for_timeout(1800)
            mobile.screenshot(path=str(OUT/'mobile-shelf.png'))
            assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth'),'Mobile overflows horizontally'
            assert not original,f'Original-site requests: {original}'
            assert not errors,f'Page errors: {errors}'
            assert not bad,f'HTTP errors: {bad}'
            report={'passed':True,'checks':['single book','two languages','Chinese reading','page navigation','guest page stars','English switch','quiz interaction','settings','persistence','profiles','390px responsive layout','no original-site requests','no HTTP/page errors'],'errors':errors,'http_errors':bad}
            (OUT/'qa-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
            print(json.dumps(report,ensure_ascii=False))
        except Exception:
            page.screenshot(path=str(OUT/'failure.png'))
            print('PAGE:',page.locator('body').inner_text()[:1800])
            print('ERRORS:',errors,'HTTP:',bad,'ORIGINAL:',original)
            raise
        finally: browser.close()

if __name__=='__main__':main()
