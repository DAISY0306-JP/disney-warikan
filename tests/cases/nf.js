const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(2500);
const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);const t=ms=>new Promise(r=>setTimeout(r,ms||80));
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';trips=[{id:'t1',name:'ソウル'}];
  applyDataObject({members:['みゆ','あやか','みさき']});localStorage.setItem('warikanMe_t1','みゆ');initAppViews();showTab('add');
  const fill=(n,a)=>{document.getElementById('expenseName').value=n;document.getElementById('expenseAmount').value=a;};
  // 1. 比率
  fill('焼肉',9000);setSplitMode('ratio');
  ok('ratio inputs',document.querySelectorAll('#splitInputs input').length===3);
  const inp=[...document.querySelectorAll('#splitInputs input')];inp[0].value='2';inp[0].dispatchEvent(new Event('input'));
  ok('ratio preview '+document.getElementById('splitPreview').textContent,document.getElementById('splitPreview').textContent.includes('¥4,500')&&document.getElementById('splitPreview').textContent.includes('¥2,250'));
  submitExpense();
  ok('ratio saved',expenses[0].split&&expenses[0].split.m==='ratio'&&expenses[0].split.v[0]===2);
  const bal=calculateExpenseBalances().JPY.map(Math.round);
  ok('ratio balances '+bal,bal.slice(0,3).join()==='4500,-2250,-2250');
  ok('form reset to equal',_splitMode==='equal'&&document.getElementById('splitInputs').style.display==='none');
  // 金額指定
  fill('居酒屋',10000);setSplitMode('amount');
  const ai=[...document.querySelectorAll('#splitInputs input')];ai[2].value='2000';ai[2].dispatchEvent(new Event('input'));
  ok('amount preview '+document.getElementById('splitPreview').textContent,document.getElementById('splitPreview').textContent.includes('¥4,000')&&document.getElementById('splitPreview').textContent.includes('¥2,000'));
  ai[0].value='9000';ai[0].dispatchEvent(new Event('input'));
  ok('amount over error',document.getElementById('splitPreview').classList.contains('bad'));
  const before=expenses.length;submitExpense();ok('blocked when invalid',expenses.length===before);
  ai[0].value='';ai[0].dispatchEvent(new Event('input'));submitExpense();
  ok('amount saved',expenses[1].split.m==='amount'&&sharesOf(expenses[1]).map(x=>Math.round(x[1])).join()==='4000,4000,2000');
  // direct matrix uses shares
  const mat=buildDirectMatrix(false).JPY;ok('direct uses shares',Math.round(mat[1][0])===2250+4000-0&&Math.round(mat[2][0])===2250+2000);
  // 編集で読み込み
  startEditExpense(1);ok('edit loads split',_splitMode==='amount'&&document.querySelectorAll('#splitInputs input')[2].value==='2000');
  setSplitMode('equal');submitExpense();ok('back to equal removes split',!expenses[1].split);
  // 先に精算も比率に従う
  ok('preShares by ratio',Math.round(preShares(expenses[0])['1>0>JPY'])===2250);
  // 正規化
  const nd=normalizeData({members:['a','b'],expenses:[{id:'x',name:'n',amount:100,currency:'JPY',paidBy:0,participants:[0,1],split:{m:'ratio',v:{0:2,5:3,1:'x'}},est:true}]});
  ok('normalize split/est '+JSON.stringify(nd.expenses[0].split),nd.expenses[0].split.v[0]===2&&!('5' in nd.expenses[0].split.v)&&!('1' in nd.expenses[0].split.v)&&nd.expenses[0].est===true);
  // 2. 概算
  fill('ホテル',30000);toggleEst(true);submitExpense();
  ok('est saved',expenses[2].est===true&&!_estOn);
  showTab('list');
  ok('est bar',document.querySelector('.est-bar')?.textContent.includes('確定待ち 1件')&&document.querySelector('.expense-meta-chip.est'));
  toggleEstOnly();ok('est filter',document.querySelectorAll('#expenseList .expense-item').length===1);toggleEstOnly();
  showTab('settle');ok('settle est note',!!document.querySelector('.est-note'));
  startEditExpense(2);ok('edit loads est',_estOn);toggleEst(false);submitExpense();ok('est cleared',!expenses[2].est&&!document.querySelector('.est-note'));
  // 6. 元に戻す
  const n0=expenses.length,id=expenses[0].id;
  const pd=deleteExpense(0);await t();document.getElementById('confirmOkBtn').click();await pd;
  ok('deleted + undo bar',expenses.length===n0-1&&document.getElementById('undoBar').classList.contains('show'));
  doUndo();ok('undo restores',expenses.length===n0&&expenses[0].id===id&&!document.getElementById('undoBar').classList.contains('show'));
  // 7. キャッシュから開く
  currentUser={id:'u1',email:'a@b'};trips=[{id:'t1',name:'ソウル'}];
  setSyncBase({...getDataObject(),rev:5});saveData();
  const cache=readTripCache();ok('cache written',cache&&cache.uid==='u1'&&cache.server.rev===5&&cache.local.expenses.length===n0);
  // 別の状態にしてから開き直す
  applyDataObject({members:['x']});currentUser=null;trips=[];currentTripId=null;_syncBase=null;
  ok('open from cache',openFromCache()&&currentTripId==='t1'&&expenses.length===n0&&_syncRev===5&&currentUser.id==='u1'&&trips.length===1);
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{showTab('add');clearExpenseForm();document.getElementById('expenseName').value='居酒屋';document.getElementById('expenseAmount').value='12000';setSplitMode('amount');const ai=[...document.querySelectorAll('#splitInputs input')];ai[2].value='2000';ai[2].dispatchEvent(new Event('input'));toggleEst(true);document.querySelector('.container').scrollTop=9999;});
await p.waitForTimeout(400);await p.screenshot({path:D+'/nf-add.png'});
await p.evaluate(()=>{submitExpense();showTab('list');document.querySelector('.container').scrollTop=0;});await p.waitForTimeout(400);await p.screenshot({path:D+'/nf-list.png'});
await p.evaluate(()=>document.querySelectorAll('.receipt-slip').forEach(x=>x.remove()));await p.evaluate(async()=>{const pd=deleteExpense(0);await new Promise(r=>setTimeout(r,80));document.getElementById('confirmOkBtn').click();await pd;});await p.waitForTimeout(400);await p.screenshot({path:D+'/nf-undo.png'});
await b.close();})();
