const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({viewport:{width:430,height:740},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(300);
const r=await p.evaluate(()=>{
  const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  document.getElementById('authShell').style.display='none';
  // 古い旅行（その他だけ）→ 定番カテゴリが足される
  applyDataObject({members:['あやか','みさき','みゆ','みかこ'],categories:['その他'],expenses:[
    {id:'e1',name:'ホテル',amount:80000,currency:'JPY',category:'その他',date:'2026-10-05',paidBy:0,participants:[0,1,2,3]},
    {id:'e2',name:'夕食',amount:200,currency:'USD',category:'その他',date:'2026-10-05',paidBy:1,participants:[0,1,2,3]}]});
  ok('old trip gets default cats: '+_cats.join(','),_cats.length===6&&_cats.includes('🍽 食事')&&_cats[5]==='その他');
  ok('custom cats kept',normalizeCats(['A','その他']).join()==='A,その他');
  localStorage.setItem('warikanMe_local','みゆ');
  initAppViews();_showPaid=true;showTab('settle');
  const sumTxt=document.getElementById('settSummary').innerText;
  ok('summary for me: '+sumTxt.replace(/\n/g,' / '),sumTxt.includes('みゆさんの精算')&&sumTxt.includes('あやか に ¥20,000 払う')&&sumTxt.includes('みさき に $50.00'));
  ok('progress 0/6',document.querySelector('.sett-progress').textContent.includes('0 / 6'));
  // 済にする
  document.querySelector('#settlementList .sett-done-btn').click();
  ok('marked done',document.querySelector('.sett-progress').textContent.includes('1 / 6')&&document.querySelector('.settlement-item.done'));
  ok('saved in data',Object.keys(getDataObject().settled).length===1);
  ok('sync view has settled',Object.keys(toSyncView(getDataObject()).settled).length===1);
  const k=Object.keys(settled)[0];
  // 金額が変わる（カードの確定額で修正）→ 済はそのまま、差額が新しい行で出る
  const ce=expenses.find(e=>normCurrency(e.currency)===k.split('>')[2]),orig=ce.amount;ce.amount=orig*1.2;updateDisplay();
  const sameKey=getSettlementTx().filter(t=>settleKey(t)===k);
  ok('paid stays, diff row added '+sameKey.map(t=>t.amount+(t.paid?'済':'')).join(','),sameKey.length===2&&sameKey.some(t=>t.paid)&&sameKey.some(t=>!t.paid));
  // 差額も済に
  document.querySelector('.settlement-item:not(.done)[data-key="'+k+'"] .sett-done-btn').click();
  ok('diff paid, merged',getSettlementTx().filter(t=>settleKey(t)===k).length===1&&getSettlementTx().find(t=>settleKey(t)===k).paid);
  // 取り消し
  document.querySelector('.settlement-item.done[data-key="'+k+'"] .sett-done-btn').click();
  ok('unmarked',document.querySelector('.sett-progress').textContent.includes('0 / 6'));ce.amount=orig;expenses[0].amount=84000;updateDisplay();
  // 自分の分を済に → 打ち消し線
  const mineBtn=[...document.querySelectorAll('.settlement-item')].find(x=>{const t=x.querySelector('.settlement-text').textContent;return t.indexOf('みゆ')>-1&&t.indexOf('みゆ')<t.indexOf('→')&&t.includes('あやか');}).querySelector('.sett-done-btn');mineBtn.click();
  ok('my line struck through',document.querySelector('#settSummary .sett-line.done')?.textContent.includes('あやか'));
  ok('me bar shows remaining: '+document.getElementById('meText').textContent,document.getElementById('meText').textContent.includes('$50.00 払う')&&!document.getElementById('meText').textContent.includes('¥21,000'));
  // 1人あたり
  ok('per person: '+document.getElementById('perPersonTotal').textContent,document.getElementById('perPersonTotal').textContent==='¥28,500');
  // 正規化: 範囲外の番号は捨てる
  ok('normalize drops bad keys',Object.keys(normalizeData({members:['a','b'],settled:{'0>1>JPY':5,'0>5>JPY':3,'x':1}}).settled).join()==='0>1>JPY');
  return o;});
console.log(r.join('\n'));console.log('cat visible',await p.evaluate(()=>{showTab('add');const pk=document.getElementById('catPicker'),a=pk.querySelector('.active');return a.offsetLeft-pk.offsetLeft+a.offsetWidth<=pk.scrollLeft+pk.clientWidth+1;}));
await p.screenshot({path:process.argv[3]+'/st-settle.png',fullPage:true});
await p.evaluate(()=>showTab('add'));
console.log('btn bottom',await p.evaluate(()=>Math.round(document.getElementById('expenseSubmitBtn').getBoundingClientRect().bottom)),'tabbar top',await p.evaluate(()=>Math.round(document.getElementById('footerBar').getBoundingClientRect().top)));
await p.screenshot({path:process.argv[3]+'/st-add.png'});
await b.close();})();
