from pathlib import Path
import json
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'assets' / 'library.css').read_text(encoding='utf-8')
js = (root / 'assets' / 'library.js').read_text(encoding='utf-8')
registry = json.loads((root / 'models' / 'registry.json').read_text(encoding='utf-8'))
html = html.replace('<link rel="stylesheet" href="./assets/library.css">', '<style>' + css + '</style>')
html = html.replace('<script defer src="./assets/library.js"></script>', '')
mock = '<script>window.fetch=async()=>({ok:true,json:async()=>(' + json.dumps(registry) + ')});</script>'
html = html.replace('</head>', mock + '</head>')
html = html.replace('</body>', '<script>' + js + '</script></body>')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content(html, wait_until='load')
    page.wait_for_selector('.model-card')
    assert page.title() == 'System Dynamics Lab | Model Library'
    assert page.locator('.model-card').count() == 1
    assert '01' in page.locator('#modelCount').inner_text()
    assert page.locator('.model-card').first.get_attribute('href') == './models/demand-supply-delay/'
    page.locator('#modelSearch').fill('demand')
    assert page.locator('.model-card').count() == 1
    page.locator('#modelSearch').fill('does-not-exist')
    assert page.locator('.model-card').count() == 0
    assert not page.locator('#emptyState').is_hidden()
    assert not errors, errors
    browser.close()
print('PASS: registry rendering, model count, search and empty state.')
