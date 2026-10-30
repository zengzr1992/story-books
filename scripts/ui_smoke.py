from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import sys
sys.stdout.reconfigure(encoding='utf-8')
out=Path(__file__).resolve().parents[1]/'artifacts'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
    page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://localhost:4173')
    page.locator('#shelf-strip').wait_for(state='visible',timeout=60000)
    page.wait_for_timeout(1600)
    card=page.locator('.shelf-book').bounding_box()
    assert abs(card['x']+card['width']/2-195)<2
    page.screenshot(path=str(out/'mobile-shelf.png'))
    page.locator('#btn-language').click();page.locator('[data-lang="zh"]').click()
    page.locator('.shelf-book').click();page.locator('#btn-open').wait_for(state='visible',timeout=60000);page.locator('#btn-open').click()
    page.locator('#text-panel').wait_for(state='visible',timeout=20000)
    page.wait_for_timeout(1600)
    expect(page.locator('#page-heading')).to_contain_text('窗')
    page.screenshot(path=str(out/'mobile-reading-zh.png'))
    page.set_viewport_size({'width':1280,'height':720})
    page.locator('#btn-settings').click();page.locator('#set-language').wait_for(state='visible');page.wait_for_timeout(1200)
    page.screenshot(path=str(out/'settings-zh.png'))
    page.locator('#set-close').click();page.locator('#btn-account').click();page.locator('.profile-card').first.wait_for(state='visible')
    page.evaluate("document.getElementById('account-open').click()")
    page.locator('#account-dialog[open]').wait_for(state='visible');page.wait_for_timeout(1000)
    expect(page.locator('#account-title')).to_have_text('你的阅读账户')
    page.screenshot(path=str(out/'account-zh.png'))
    assert not errors,errors
    print('PASS: centered mobile shelf, Chinese mobile reading, translated settings, empty-shell account rendering; no page errors.')
    browser.close()
