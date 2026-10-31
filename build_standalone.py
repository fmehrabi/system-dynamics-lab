from pathlib import Path
import base64

ROOT = Path(__file__).parent
MODEL = ROOT / 'models' / 'demand-supply-delay'
html = (MODEL / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'shared' / 'style.css').read_text(encoding='utf-8')
engine = (MODEL / 'engine.js').read_text(encoding='utf-8')
app = (MODEL / 'app.js').read_text(encoding='utf-8')
source = (MODEL / 'source.mdl').read_bytes()

html = html.replace('<link rel="stylesheet" href="../../shared/style.css">', '<style>\n' + css + '\n</style>')
html = html.replace('href="../../index.html"', 'href="../index.html"')
html = html.replace('<script defer src="./engine.js"></script><script defer src="./app.js"></script>', '')
html = html.replace('href="./source.mdl" download', 'href="data:application/octet-stream;base64,' + base64.b64encode(source).decode('ascii') + '" download')
html = html.replace('</body>', '<script>\n' + engine + '\n</script>\n<script>\n' + app + '\n</script>\n</body>')

out = ROOT / 'downloads' / 'System_Dynamics_Lab_Standalone.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'Generated {out} ({out.stat().st_size:,} bytes)')
