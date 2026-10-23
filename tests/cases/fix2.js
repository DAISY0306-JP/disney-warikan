const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:390,height:844}});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(2000);
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);const t=ms=>new Promise(r=>setTimeout(r,ms||80));
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';trips=[{id:'t1',name:'旅A'}];currentUser={id:'u1',email:'a@b'};
  const ex=(id,n,amt,pb)=>({id,name:n,amount:amt,currency:'JPY',category:'その他',date:'2026-10-08',paidBy:pb,participants:[0,1,2]});
  applyDataObject({members:['A','B','C'],expenses:[ex('e1','1',300,0),ex('e2','2',300,0),ex('e3','3',300,1),ex('e4','4',300,1),ex('e5','5',300,2)]});initAppViews();
  // 1. キャッシュ
  setSyncBase({...getDataObject(),rev:1});saveData();
  let c=readTripCache();ok('local saved with rev',c.local&&c.localRev===1);
  const srv={...getDataObject(),expenses:[...getDataObject().expenses,ex('x','X',100,2)],rev:2};
  setSyncBase(srv);c=readTripCache();ok('server write drops old local',c.local===null&&c.server.rev===2);
  applyDataObject({members:['z']});currentUser=null;openFromCache();ok('open from cache uses server',expenses.some(e=>e.id==='x'));
  // 古い版の local は使わない
  localStorage.setItem(CACHE_KEY,JSON.stringify({...readTripCache(),local:{...srv,expenses:[]},localRev:1}));openFromCache();ok('stale local ignored',expenses.length===6);
  localStorage.setItem(CACHE_KEY,JSON.stringify({...readTripCache(),local:{...srv,expenses:[]},localRev:2}));openFromCache();ok('fresh local used',expenses.length===0);
  // 2. 元に戻すと編集中の番号
  currentUser={id:'u1',email:'a@b'};applyDataObject({members:['A','B','C'],expenses:[ex('e1','1',300,0),ex('e2','2',300,0),ex('e3','3',300,1),ex('e4','4',300,1),ex('e5','5',300,2)]});initAppViews();
  startEditExpense(4);const pd=deleteExpense(1);await t();document.getElementById('confirmOkBtn').click();await pd;
  ok('editing idx shifted down',editingExpenseIdx===3&&expenses[3].id==='e5');
  doUndo();ok('editing idx restored',editingExpenseIdx===4&&expenses[4].id==='e5');clearExpenseForm();
  // 3. 旅行を切り替えたら元に戻せない
  const pd2=deleteExpense(0);await t();document.getElementById('confirmOkBtn').click();await pd2;
  const n=expenses.length;currentTripId='t2';doUndo();ok('undo ignored after trip switch',expenses.length===n);currentTripId='t1';
  // 財布の選択が残る
  wallet={on:true,ins:[],carry:[]};updateDisplay();showTab('add');setPaidBy('W');members.push('D');updateMemberSelects();
  ok('wallet payer kept',document.getElementById('paidBy').value==='W');members.pop();updateMemberSelects();
  // 済の取り消しで先に精算も外れる
  clearExpenseForm();startEditExpense(0);const pp=togglePresettle();await t();document.getElementById('confirmOkBtn').click();await pp;
  const key=Object.keys(expenses[0].pre.s)[0];clearExpenseForm();
  toggleSettled(key,settled[key],null,true);ok('unsettle clears pre key',!expenses[0].pre||!(key in expenses[0].pre.s));
  // 先に精算した支払いを編集
  startEditExpense(1);const pp2=togglePresettle();await t();document.getElementById('confirmOkBtn').click();await pp2;
  document.getElementById('expenseAmount').value='600';submitExpense();
  ok('edit recomputes pre '+JSON.stringify(expenses[1].pre.s),Math.round(Object.values(expenses[1].pre.s)[0])===200&&Math.round(settled[Object.keys(expenses[1].pre.s)[0]])===200);
  // 財布フラグ
  const nd=normalizeData({members:['a','b'],expenses:[{id:'q',name:'n',amount:10,currency:'JPY',paidBy:0,participants:[0,1],wallet:true}]});
  ok('wallet on from expenses',nd.wallet.on===true);
  // ログアウトで消える
  sb={auth:{signOut:async()=>{}}};await signOut();ok('signOut clears cache',!localStorage.getItem(CACHE_KEY));sb=null;
  return o;});
console.log(r.join('\n'));await b.close();})();
