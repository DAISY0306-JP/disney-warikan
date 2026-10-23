const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(3000);const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';trips=[{id:'t1',name:'ソウル'}];
  applyDataObject({members:['みゆ','あやか','みさき'],tripMeta:{from:'HND',to:'GMP',start:'2026-11-27',end:'2026-11-30'},wallet:{on:true,ins:[]},expenses:[
   {id:'a',name:'アシアナ航空(往復)',amount:181410,currency:'JPY',category:'✈️航空券',date:'2026-10-05',paidBy:0,participants:[0,1,2]},
   {id:'b',name:'ホテル',amount:420,currency:'USD',category:'🏨 宿泊',date:'2026-10-06',paidBy:2,participants:[0,1,2]},
   {id:'c',name:'屋台',amount:9000,currency:'KRW',category:'その他',date:'2026-10-06',paidBy:0,participants:[0,1,2],wallet:true}]});
  localStorage.setItem('warikanMe_t1','みゆ');initAppViews();showTab('settle');
  ok('open button shown',document.getElementById('preOpenBtn').style.display==='flex');
  openPreSheet();const items=document.querySelectorAll('#preSheetBody .pre-item');
  ok('list excludes wallet ('+items.length+')',items.length===2);
  openPreSheet('a');const rows=document.querySelectorAll('#preSheetBody .pre-row');
  ok('detail rows',rows.length===2&&rows[0].textContent.includes('¥60,470'));
  togglePreKey('a','1>0>JPY');
  ok('one person settled',Math.round(settled['1>0>JPY'])===60470&&expenses[0].pre&&Object.keys(expenses[0].pre.s).length===1&&document.querySelectorAll('#preSheetBody .pre-row.done').length===1);
  showTab('list');ok('list chip partial',document.querySelector('.expense-meta-chip.pre')?.textContent==='先に精算 1/2人');showTab('settle');
  togglePreKey('a','2>0>JPY');ok('all settled chip',preProgress(expenses[0]).done===2);
  ok('settlement rows paid',getSettlementTx().filter(t=>t.paid).length===2);
  togglePreKey('a','1>0>JPY');ok('undo one',!settled['1>0>JPY']&&Object.keys(expenses[0].pre.s).length===1);
  closePreSheet();ok('back to list',document.getElementById('preSheetTitle').textContent.includes('どの支払い'));
  closePreSheet();ok('closed',!document.getElementById('preSheet').classList.contains('active'));
  showTab('add');startEditExpense(0);ok('no card in edit',document.getElementById('presettleBtn').style.display==='none');clearExpenseForm();
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{showTab('settle');document.querySelector('.container').scrollTop=0;});await p.waitForTimeout(800);await p.screenshot({path:D+'/pre-tab.png',timeout:90000});
await p.evaluate(()=>{openPreSheet();});await p.waitForTimeout(600);await p.screenshot({path:D+'/pre-list.png',timeout:90000});
await p.evaluate(()=>{openPreSheet('a');});await p.waitForTimeout(600);await p.screenshot({path:D+'/pre-detail.png',timeout:90000});
await b.close();})();
