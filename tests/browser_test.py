from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).parent.parent
previews=root/'previews'
previews.mkdir(exist_ok=True)
src=(root/'downloads'/'System_Dynamics_Lab_Standalone.html').read_text(encoding='utf8')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height,name in [(1440,900,'desktop'),(390,844,'mobile')]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(src,wait_until='load')
  page.wait_for_timeout(250)
  print(name,'ERRORS',errors,'KPI',page.locator('#kpiRow').inner_text()[:110],'MODEL NODES',page.locator('.node').count())
  assert not errors
  assert page.locator('.node').count()==13
  assert page.locator('.diagram-edge').count()==14
  assert page.locator('.diagram-edge[data-from="Demand To Supply Ratio"][data-to="Effect"]').count()==1
  assert page.locator('[data-node="Demand To Supply Ratio"] .node-label').text_content()=='Demand To Supply Ratio'
  assert page.locator('.diagram-edge[data-from="F"][data-to="Effect"]').count()==1
  assert page.locator('.diagram-edge[data-from="Demand To Supply Ratio"][data-to="F"]').count()==0
  assert page.locator('.brand-text').inner_text().startswith('SYSTEM DYNAMICS LAB')
  assert page.title().startswith('System Dynamics Lab')
  assert page.locator('.flow-pipe').count()==2
  for node in page.locator('.node:not(.node-kind-flow)').all():
   name_y=float(node.locator('.node-label').get_attribute('y'))
   type_y=float(node.locator('.node-kicker').get_attribute('y'))
   assert name_y < type_y
  for flow in page.locator('.node-kind-flow').all():
   name_y=float(flow.locator('.flow-pill-label').get_attribute('y'))
   type_y=float(flow.locator('.flow-pill-kicker').get_attribute('y'))
   assert name_y < type_y
  assert page.locator('.portfolio-link').count()==0
  assert page.get_by_text('Portfolio', exact=True).count()==0
  assert page.locator('a[href*="fmehrabi.github.io/FARHAD"]').count()==0
  assert page.locator('#method').count()==0
  assert page.locator('a[href="#method"]').count()==0
  assert page.locator('#structureDiagram').get_attribute('viewBox')=='0 0 1120 650'
  assert page.locator('.control-item').count()==5
  assert page.locator('.model-nav').count()==0
  assert page.locator('.chart-sticky').count()==1
  if name=='desktop':
   page.evaluate('window.scrollTo(0,900)');page.wait_for_timeout(70)
   assert abs(page.locator('.topnav').bounding_box()['y']) < 2
   assert 220 < page.locator('#pricePlot').bounding_box()['y'] < 470
   page.evaluate('document.documentElement.style.scrollBehavior="auto";window.scrollTo(0,0)');page.wait_for_timeout(100)
  assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
  page.screenshot(path=str(previews/(name+'-preview.png')),full_page=True)
  if name=='desktop':
   before=page.locator('#kpiRow').inner_text()
   page.locator('[data-range="supplySlope"]').fill('60')
   page.wait_for_timeout(120)
   print('SLIDER changed',page.locator('[data-input="supplySlope"]').input_value(),'KPI',page.locator('#kpiRow').inner_text()[:100])
   assert before!=page.locator('#kpiRow').inner_text()
   page.locator('[data-node="Demand"]').click()
   assert 'Read-only' in page.locator('#inspector').inner_text()
   page.locator('[data-node="Delay"]').click()
   assert 'Edit parameter' in page.locator('#inspector').inner_text()
   page.locator('[data-input="initialCapacity"]').fill('240')
   page.locator('[data-input="initialCapacity"]').press('Tab')
   assert page.locator('[data-range="initialCapacity"]').input_value()=='240'
   page.locator('[data-ptinput="2"]').fill('0.2')
   page.locator('[data-ptinput="2"]').press('Tab')
   assert page.locator('[data-ptinput="2"]').input_value() == '0.2'
   page.locator('#saveRun').click();assert page.locator('.scenario-row').count()==2
   page.locator('#themeToggle').click();assert page.locator('html').get_attribute('data-theme')=='dark'
   page.screenshot(path=str(previews/'desktop-dark-preview.png'),full_page=False)
   page.locator('#resetParams').click();assert page.locator('[data-input="supplySlope"]').input_value()=='30'
  page.close()
 browser.close()
print('PASS: desktop/mobile rendering, slider, lookup, stock initial value, inspector, scenarios, theme, reset.')
