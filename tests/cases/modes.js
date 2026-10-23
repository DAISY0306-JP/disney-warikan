const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:393,height:852},deviceScaleFactor:2});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';
  // A が 300 払い(全員)、B が 600 払い(全員) → A:0, B:+300, C:-300 ... direct では C→A 100, C→B 200, A→B 200
  applyDataObject({members:['A','B','C'],expenses:[
    {id:'e1',name:'x',amount:300,currency:'JPY',category:'その他',date:'2026-10-01',paidBy:0,participants:[0,1,2]},
    {id:'e2',name:'y',amount:600,currency:'JPY',category:'その他',date:'2026-10-01',paidBy:1,participants:[0,1,2]}]});
  initAppViews();_showPaid=true;showTab('settle');setSettlementMode('direct');
  const rows=()=>getSettlementTx().map(t=>`${t.from}>${t.to}:${Math.round(t.amount)}${t.paid?'済':''}`).join(' ');
  ok('direct '+rows(),rows()==='0>1:100 2>0:100 2>1:200');
  // A→B 200 を済に
  toggleSettled('0>1>JPY',100,null,false);
  ok('paid direct '+rows(),rows()==='0>1:100済 2>0:100 2>1:200');
  setSettlementMode('min');
  ok('min keeps paid '+rows(),rows().includes('0>1:100済')&&getSettlementTx().filter(t=>!t.paid).reduce((s,t)=>s+t.amount,0)===300);
  const bal={0:0,1:0,2:0};getSettlementTx().forEach(t=>{bal[t.from]-=t.amount;bal[t.to]+=t.amount;});
  ok('min balances settle '+JSON.stringify(bal),Math.round(bal[0])===0&&Math.round(bal[1])===300&&Math.round(bal[2])===-300);
  ok('ui done rows',document.querySelectorAll('.settlement-item.done').length===1);
  // 全部済 → 方式を変えても全部済のまま
  getSettlementTx().filter(t=>!t.paid).forEach(t=>toggleSettled(settleKey(t),t.amount,null,false));
  ok('all paid min',getSettlementTx().every(t=>t.paid)&&completedAt!=='');
  setSettlementMode('direct');
  ok('all paid direct '+rows(),getSettlementTx().every(t=>t.paid)&&completedAt!=='');
  // 取り消し
  toggleSettled('0>1>JPY',100,null,true);
  ok('undo '+rows(),!rows().includes('0>1:100済')&&getSettlementTx().some(t=>!t.paid)&&completedAt==='');
  // 支払いが後から増えたら、差額が新しい行として出る
  setSettlementMode('min');getSettlementTx().filter(t=>!t.paid).forEach(t=>toggleSettled(settleKey(t),t.amount,null,false));
  expenses.push({id:'e3',name:'z',amount:90,currency:'JPY',category:'その他',date:'2026-10-02',paidBy:1,participants:[0,1,2]});updateDisplay();
  ok('new expense adds open row '+rows(),getSettlementTx().filter(t=>!t.paid).reduce((s,t)=>s+t.amount,0)===60);
  // 4人: 方式で送金先が変わるケース
  settled={};applyDataObject({members:['A','B','C','D'],expenses:[
    {id:'f1',name:'x',amount:400,currency:'JPY',category:'その他',date:'2026-10-01',paidBy:0,participants:[0,1,2,3]},
    {id:'f2',name:'y',amount:400,currency:'JPY',category:'その他',date:'2026-10-01',paidBy:1,participants:[0,1,2,3]}]});
  settled={};setSettlementMode('min');
  ok('4p min '+rows(),getSettlementTx().length===2);
  getSettlementTx().forEach(t=>toggleSettled(settleKey(t),t.amount,null,false));
  setSettlementMode('direct');
  ok('4p paid in min -> direct all paid '+rows(),getSettlementTx().every(t=>t.paid));
  settled={};updateDisplay();
  ok('4p direct '+rows(),getSettlementTx().length===4);
  toggleSettled('2>0>JPY',100,null,false);setSettlementMode('min');
  ok('4p partial -> min '+rows(),rows().includes('2>0:100済')&&Math.round(getSettlementTx().filter(t=>!t.paid).reduce((s,t)=>s+t.amount,0))===300);
  return o;});
console.log(r.join('\n'));await b.close();})();
