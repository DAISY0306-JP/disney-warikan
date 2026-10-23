# テスト

ブラウザ（Chromium）でアプリを開き、計算や画面の動きを自動で確かめます。

## 実行のしかた

```sh
npm install                          # 初回だけ（playwright を入れる）
npx playwright install chromium      # 初回だけ
npm test                             # すべて実行
node tests/run.js cur sugg           # 名前を指定して一部だけ
```

- `tests/cases/` の1ファイルが1本のテスト。`PASS …` / `FAIL …` を1行ずつ出します。
- スクリーンショットは `tests/out/` に保存されます（リポジトリには入りません）。
- 本番の Supabase には通信しません（`tests/lib.js` で止めています）。

## GitHub での自動実行

`.github/workflows/test.yml` で、main へのプッシュとプルリクエストのたびに全テストが走ります。
スクリーンショットは、実行結果の「Artifacts」から見られます。

## ファイルを直したとき

- `style.css` を直したら `python3 tools/gen-dark.py`（ダークモードの色を作り直す）
- `style.css`・`dark.css`・`app.js` を直したら `python3 tools/bump-version.py`（読み込みの番号を更新）
