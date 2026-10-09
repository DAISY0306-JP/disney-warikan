#!/usr/bin/env python3
"""style.css・app.js を直したら実行する。
index.html の ?v= を、ファイルの中身から作った番号に書き換える。
（番号が変わると、ブラウザとオフライン用の保存が新しいファイルを取りに行く）

    python3 tools/bump-version.py
"""
import hashlib, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
index = root / 'index.html'
html = index.read_text(encoding='utf-8')
for name in ('style.css', 'app.js'):
    v = hashlib.sha1((root / name).read_bytes()).hexdigest()[:8]
    html = re.sub(re.escape(name) + r'\?v=[0-9a-f]+', f'{name}?v={v}', html)
    print(f'{name}?v={v}')
index.write_text(html, encoding='utf-8')
