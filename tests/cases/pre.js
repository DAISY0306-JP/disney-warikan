const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(2500);
const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);const t=ms=>new Promise(r=>setTimeout(r,ms||80));
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';trips=[{id:'t1',name:'ソウル'}];
  const t0=todayStr(),add=(d,n)=>{const x=new Date(d+'T00:00:00');x.setDate(x.getDate()+n);return`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;};
  applyDataObject({members:['みゆ','あやか','みさき'],tripMeta:{from:'HND',to:'GMP',start:add(t0,-1),end:add(t0,2)},expenses:[
    {id:'f',name:'アシアナ航空',amount:181410,currency:'JPY',category:'その他',date:add(t0,-1),paidBy:0,participants:[0,1,2]},
    {id:'d',name:'夕食',amount:60000,currency:'KRW',category:'その他',date:t0,paidBy:1,participants:[0,1,2]}]});
  localStorage.setItem('warikanMe_t1','みゆ');initAppViews();
  const confirmYes=async()=>{await t();document.getElementById('confirmOkBtn').click();await t();};
  // 先に精算
  startEditExpense(0);
  ok('edit card hidden (moved to settle tab)',document.getElementById('presettleBtn').style.display==='none');
  const pr=togglePresettle();
  ok('confirm text: '+document.getElementById('confirmMsg').textContent.replace(/\n/g,' / '),document.getElementById('confirmMsg').textContent.includes('あやか → みゆ')&&document.getElementById('confirmOkBtn').textContent==='先に精算する');
  await confirmYes();await pr;
  ok('settled shares '+JSON.stringify(settled),Math.round(settled['1>0>JPY'])===60470&&Math.round(settled['2>0>JPY'])===60470);
  ok('expense marked',!!expenses[0].pre&&preProgress(expenses[0]).done===2);
  ok('synced data keeps pre',!!toSyncView(getDataObject()).expenses.find(e=>e.id==='f').pre);
  const open=getSettlementTx().filter(x=>!x.paid);
  ok('remaining only KRW '+open.map(x=>x.code+Math.round(x.amount)).join(','),open.length===2&&open.every(x=>x.code==='KRW'));
  clearExpenseForm();showTab('list');
  ok('list chip',document.querySelector('.expense-meta-chip.pre')?.textContent==='先に精算済み');
  // 全部済 → 旅行中なので完了にしない
  showTab('settle');window.__landed=false;const pl=playLanding;window.playLanding=()=>{window.__landed=true;};
  getSettlementTx().filter(x=>!x.paid).forEach(x=>toggleSettled(settleKey(x),x.amount,document.body,false));
  ok('mid-trip not complete',completedAt===''&&!document.getElementById('tripPass').classList.contains('complete')&&document.querySelector('.mid-done')&&document.getElementById('announceMsg').textContent.includes('ここまでの精算'));
  // 取り消し
  hideAnnounce();showTab('add');startEditExpense(0);const pr2=togglePresettle();await confirmYes();await pr2;
  ok('undo presettle',!expenses[0].pre&&!settled['1>0>JPY']&&!settled['2>0>JPY']);
  // 削除でも戻る
  startEditExpense(0);const pr3=togglePresettle();await confirmYes();await pr3;clearExpenseForm();
  const pd=deleteExpense(0);await confirmYes();await pd;
  ok('delete reverts '+JSON.stringify(settled),!settled['1>0>JPY']&&!settled['2>0>JPY']);
  // 帰国後は完了になる
  tripMeta.start=add(t0,-5);tripMeta.end=add(t0,-2);updateDisplay();
  ok('after trip complete',getSettlementTx().every(x=>x.paid)&&completedAt!=='');
  return o;});
console.log(r.join('\n'));
await p.evaluate(async()=>{const t0=todayStr();tripMeta.start=t0;tripMeta.end=t0;expenses.push({id:'f2',name:'アシアナ航空',amount:181410,currency:'JPY',category:'その他',date:t0,paidBy:0,participants:[0,1,2]});updateDisplay();showTab('add');startEditExpense(expenses.length-1);document.querySelector('.container').scrollTop=9999;});
await p.waitForTimeout(400);await p.screenshot({path:D+'/pre-edit.png'});
await p.evaluate(async()=>{const pr=togglePresettle();});await p.waitForTimeout(400);await p.screenshot({path:D+'/pre-confirm.png'});
await p.evaluate(async()=>{document.getElementById('confirmOkBtn').click();await new Promise(r=>setTimeout(r,200));clearExpenseForm();showTab('settle');hideAnnounce();});await p.waitForTimeout(700);await p.screenshot({path:D+'/pre-settle.png'});
await p.evaluate(()=>{showTab('list');});await p.waitForTimeout(300);await p.screenshot({path:D+'/pre-list.png'});
await b.close();})();
