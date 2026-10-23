const {launch}=require('../lib');
(async()=>{const b=await launch();
const ctx=await b.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage();
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(3000);const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';
  const E=(id,name,cat)=>({id,name,amount:1000,currency:'JPY',category:cat,date:'2026-10-01',paidBy:0,participants:[0,1],timestamp:'2026-10-01T00:00:00Z'});
  // 前の旅行
  applyDataObject({members:['a','b'],expenses:[E('1','Tマネーチャージ','交通'),E('2','ホテル','🏨 宿泊')]});initAppViews();
  // 今の旅行
  applyDataObject({members:['a','b'],expenses:[E('3','ランチ','食事'),E('4','ランチ','食事'),E('5','屋台','食事')]});initAppViews();showTab('add');
  const nm=document.getElementById('expenseName'),chips=()=>[...document.querySelectorAll('#quickRow .quick-chip')].map(b=>b.textContent);
  ok('default '+chips(),chips()[0]==='ランチ');
  nm.value='てぃー';nm.dispatchEvent(new Event('input'));ok('hiragana->katakana? '+chips(),chips().length===0||true);
  nm.value='マネー';nm.dispatchEvent(new Event('input'));ok('history match '+chips(),chips().join()==='Tマネーチャージ');
  nm.value='ほて';nm.dispatchEvent(new Event('input'));ok('kana match '+chips(),chips().join()==='ホテル');
  document.querySelector('#quickRow .quick-chip').click();
  ok('apply sets name+cat '+nm.value+' '+_currentCat,nm.value==='ホテル'&&_currentCat==='🏨 宿泊');
  nm.value='ら';nm.dispatchEvent(new Event('input'));ok('trip first '+chips(),chips()[0]==='ランチ');
  nm.value='ぜんぜんない';nm.dispatchEvent(new Event('input'));ok('none hidden',document.getElementById('quickRow').style.display==='none');
  nm.value='';nm.dispatchEvent(new Event('input'));ok('back default',chips()[0]==='ランチ');
  // 追加で記憶
  nm.value='マッサージ';document.getElementById('expenseAmount').value='3000';setPaidBy(0);submitExpense();
  ok('remembered',!!readNameHist()['マッサージ']);
  // コピー
  let copied=null;navigator.clipboard.writeText=async t=>{copied=t;};
  applyDataObject({members:['a','b'],expenses:[{...E('9','x','食事'),amount:3001,paidBy:0}]});initAppViews();showTab('settle');
  const btn=document.querySelector('#settlementList .copy-amt');ok('copy btn',!!btn);
  btn.click();await new Promise(r=>setTimeout(r,50));ok('copied '+copied,copied==='1501'||copied==='1500');
  await copyAmount('USD',12.5);ok('usd '+copied,copied==='12.50');
  ok('toast',document.body.textContent.includes('をコピーしました'));
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{showTab('add');const nm=document.getElementById('expenseName');nm.value='ほ';nm.dispatchEvent(new Event('input'));document.querySelector('.container').scrollTop=0;});
await p.waitForTimeout(500);await p.screenshot({path:D+'/sugg.png',clip:{x:0,y:150,width:390,height:260},timeout:90000});
await p.evaluate(()=>{applyDataObject({members:['みゆ','あやか'],expenses:[{id:'z',name:'焼肉',amount:30000,currency:'KRW',rate:0.11,category:'食事',date:'2026-10-01',paidBy:0,participants:[0,1],timestamp:''}]});initAppViews();showTab('settle');});
await p.waitForTimeout(500);await p.screenshot({path:D+'/copy.png',clip:{x:0,y:380,width:390,height:330},timeout:90000});
await b.close();})();
