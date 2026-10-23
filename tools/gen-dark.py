#!/usr/bin/env python3
"""style.css の明るい色を読み取り、ダークモード用の上書き（dark.css）を作る。

    python3 tools/gen-dark.py

style.css で白や淡い灰色を使っている所を、暗い色に置き換えたルールを
html[data-theme="dark"] つきで書き出す。手で直したい所は dark.css の下の「手直し」に書く。
（style.css を直したら、このスクリプトを実行し直す）
"""
import pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
css = (root / 'style.css').read_text(encoding='utf-8')

# 明るい色 → 暗い色
BG = {  # 背景
    '#fff': '#1e1c24', '#ffffff': '#1e1c24',
    '#f4f2f7': '#131218', '#faf9f7': '#131218', '#fbfaf6': '#1b1a20',
    '#f7f7f9': '#25232c', '#f6f6f8': '#25232c', '#fbfaff': '#25232c', '#f9f8fc': '#25232c',
    '#f6f5fa': '#25232c', '#f6f4fb': '#25232c', '#fafafa': '#25232c', '#f6f3fd': '#25232c',
    '#f0f0f3': '#2c2a34', '#ececf0': '#2c2a34', '#efeff2': '#2c2a34', '#f1f1f4': '#2c2a34',
    '#eceef2': '#2c2a34', '#f3f3f5': '#2c2a34', '#f1f0f4': '#2c2a34', '#f1f2f5': '#2c2a34',
    '#e6e6ea': '#34313d', '#e4e0ef': '#34313d', '#dcdce2': '#3a3744', '#d8d6e0': '#3a3744',
    '#ebe7f4': '#2c2a34', '#d7d2e6': '#3a3744', '#efe9fb': '#1b1a22', '#cfd3dc': '#4a4756',
    '#d9dce4': '#3a3744', '#dfe0e6': '#3a3744', '#cfccd9': '#4a4756', '#d5d8df': '#4a4756',
    '#fff1f1': '#3a2326', '#fff5f5': '#332225', '#fdf0f0': '#332225', '#ffe9f2': '#3a2230',
    '#fff6dd': '#3a321e', '#fffaf0': '#332d1d', '#ecf7f1': '#1d3128', '#fff0e8': '#3a2a20',
    '#ffe1dc': '#43282a', '#f1ebff': '#2b2540', '#e9f1ff': '#1f2a40', '#e4f7ef': '#1d3128',
    '#efeafc': '#25232c', '#f3f1f8': '#25232c', '#f3f1ea': '#25232c', '#f3f3f6': '#2c2a34',
    '#f4f4f6': '#2c2a34', '#b9b3cc': '#4a4756',
}
LINE = {  # 線
    '#fff': '#1e1c24', '#ffffff': '#1e1c24',
    '#e6e6ea': '#36333f', '#e4e0ef': '#36333f', '#ececf0': '#33303c', '#f0f0f3': '#2f2c38',
    '#dcdce2': '#403d4a', '#d8d6e0': '#403d4a', '#d9dce4': '#403d4a', '#dfe0e6': '#403d4a',
    '#ebe7f4': '#33303c', '#d7d2e6': '#403d4a', '#cfd3dc': '#4a4756', '#f6f6f8': '#2c2a34',
    '#f7f7f9': '#2c2a34', '#efeff2': '#33303c', '#e8e8ec': '#36333f', '#efece8': '#33303c',
}
FG = {  # 文字
    '#2e2a3d': '#ecebf2', '#4e4a63': '#e2e0ea', '#333': '#ecebf2', '#333333': '#ecebf2',
    '#6b6676': '#b8b4c6', '#6b6778': '#b8b4c6', '#7a768f': '#a9a5b8', '#5f6675': '#b8b4c6',
    '#8a8594': '#9d99ad', '#a19db3': '#8d899c', '#b0aebb': '#7d7a8c',
    '#3a3440': '#ecebf2', '#4a4656': '#d6d3e0', '#9a96a6': '#9d99ad', '#b3afc2': '#8d899c',
    # 淡い色の上の濃い色文字 → 暗い背景の上で読める明るめの色
    '#3d6b5c': '#5fd3a3', '#4f8f78': '#5fd3a3', '#3d7a6a': '#5fd3a3', '#4a7a6a': '#5fd3a3',
    '#7a3535': '#ff9a9a', '#8a3535': '#ff9a9a', '#7a4040': '#ff9a9a', '#c06f6f': '#ff9a9a',
    '#8a6a2a': '#e2b75c', '#b0853a': '#e2b75c',
}

COLOR_PROPS = ('color', 'background', 'background-color', 'background-image', 'border', 'border-color',
               'border-top', 'border-bottom', 'border-left', 'border-right', 'border-top-color',
               'border-bottom-color', 'border-left-color', 'border-right-color', 'outline', 'outline-color')

def remap(prop, val):
    p = prop.strip().lower()
    if p == 'color':
        m = FG
    elif p.startswith('background'):
        m = BG
    elif p.startswith('border') or p.startswith('outline'):
        m = LINE
    else:
        return val
    return re.sub(r'#[0-9a-fA-F]{3,6}\b', lambda x: m.get(x.group(0).lower(), x.group(0)), val)

# :where() で囲むので、元のルールと同じ強さ（詳細度）になる。
# dark.css は style.css のあとに読むので、元のルールの順番どおりに色だけが上書きされる
def prefix(sel):
    out = []
    for s in sel.split(','):
        s = s.strip()
        if not s:
            continue
        if s.startswith(':root'):
            return None
        if s == 'html' or s.startswith('html'):
            out.append(':where(html[data-theme="dark"])' + s[4:])
        else:
            out.append(':where(html[data-theme="dark"]) ' + s)
    return ','.join(out)

# CSS を { } で読む（@media は中身も見る、@keyframes は飛ばす）
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
rules = []
i, n, stack = 0, len(css), []
buf = ''
def walk(text, media=None):
    pos = 0
    while pos < len(text):
        j = text.find('{', pos)
        if j < 0:
            break
        head = text[pos:j].strip()
        depth, k = 1, j + 1
        while depth and k < len(text):
            if text[k] == '{': depth += 1
            elif text[k] == '}': depth -= 1
            k += 1
        body = text[j + 1:k - 1]
        if head.startswith('@media'):
            walk(body, head)
        elif head.startswith('@'):
            pass
        else:
            decls, changed = [], False
            for d in body.split(';'):
                if ':' not in d:
                    continue
                prop, val = d.split(':', 1)
                p = prop.strip().lower()
                if p.startswith('--') or p not in COLOR_PROPS:
                    continue
                imp = '!important' in val
                val = val.replace('!important', '').strip()
                nv = remap(p, val)
                changed = changed or nv != val
                decls.append(f'{prop.strip()}:{nv}' + (' !important' if imp else ''))
            sel = prefix(head)
            # 色を変えたルールだけでなく、色の指定があるルールはすべて書き直す（上書きの順番を保つため）
            if decls and sel:
                rules.append((media, f'{sel}{{{";".join(decls)};}}'))
        pos = k
walk(css)

out = ['/* tools/gen-dark.py で自動生成。直接書き換えず、style.css を直してから実行し直す */']
for media, r in rules:
    out.append(f'{media}{{{r}}}' if media else r)
generated = '\n'.join(out) + '\n'
path = root / 'dark.css'
manual = ''
if path.exists():
    old = path.read_text(encoding='utf-8')
    mark = '/* ===== 手直し ===== */'
    if mark in old:
        manual = old[old.index(mark):]
if not manual:
    manual = '/* ===== 手直し ===== */\n'
path.write_text(generated + '\n' + manual, encoding='utf-8')
print(f'{len(rules)} rules')
