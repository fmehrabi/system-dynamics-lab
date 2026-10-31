import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
registry = json.loads((root / 'models' / 'registry.json').read_text(encoding='utf-8'))
assert registry.get('schemaVersion') == 1
assert isinstance(registry.get('models'), list) and registry['models']
seen = set()
for item in registry['models']:
    mid = item['id']
    assert mid not in seen, f'duplicate model id: {mid}'
    seen.add(mid)
    assert item['path'].startswith('./models/')
    model_dir = root / item['path'].removeprefix('./')
    assert (model_dir / 'index.html').is_file(), f'missing model page: {mid}'
    manifest_path = root / item['manifest'].removeprefix('./')
    assert manifest_path.is_file(), f'missing manifest: {mid}'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    assert manifest['id'] == mid
    source = model_dir / manifest['sourceFile']
    assert source.is_file(), f'missing source MDL: {mid}'
    assert (model_dir / 'engine.js').is_file()
    assert (model_dir / 'app.js').is_file()
    assert (model_dir / 'preview.png').is_file() or (root / item['thumbnail'].removeprefix('./')).is_file()
print(f'PASS: {len(registry["models"])} registered model package(s), paths and manifests valid.')
