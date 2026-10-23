#!/usr/bin/env node
// すべてのテストを順に実行する
//   node tests/run.js            … 全部
//   node tests/run.js cur sugg   … 名前を指定して一部だけ
// 各テストは「PASS …」「FAIL …」を1行ずつ出す。FAIL・ページのエラー・異常終了が1つでもあれば失敗。
// スクリーンショットは tests/out/ に保存する。
const {spawnSync}=require('child_process');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),index=path.join(root,'index.html');
const out=path.join(__dirname,'out');fs.mkdirSync(out,{recursive:true});
const all=fs.readdirSync(path.join(__dirname,'cases')).filter(f=>f.endsWith('.js')).map(f=>f.slice(0,-3)).sort();
const pick=process.argv.slice(2);
const names=pick.length?pick:all;
let pass=0,fail=0;const failed=[];
for(const n of names){
  const t0=Date.now();
  const r=spawnSync(process.execPath,[path.join(__dirname,'cases',n+'.js'),index,out],{encoding:'utf8',timeout:300000,maxBuffer:1<<26});
  const text=(r.stdout||'')+(r.stderr||'');
  const lines=text.split('\n');
  const p=lines.filter(l=>l.startsWith('PASS')).length;
  const bad=lines.filter(l=>/^(FAIL|ERR\b|pageerror:|console:)/.test(l));
  const crashed=r.status!==0||r.error;
  const ok=!bad.length&&!crashed&&(p>0||lines.includes('NO ERRORS'));
  pass+=p;
  console.log(`${ok?'✓':'✗'} ${n}  (${p} PASS, ${((Date.now()-t0)/1000).toFixed(0)}s)`);
  if(!ok){
    fail++;failed.push(n);
    bad.forEach(l=>console.log('    '+l));
    if(crashed)console.log('    '+(r.error?r.error.message:`exit ${r.status}`)+'\n'+text.split('\n').slice(-15).map(l=>'    '+l).join('\n'));
    else if(!bad.length)console.log('    (PASS が1つもありません)');
  }
}
console.log(`\n${names.length} 本中 ${names.length-fail} 本成功（PASS ${pass} 件）`);
if(fail){console.log('失敗: '+failed.join(', '));process.exit(1);}
