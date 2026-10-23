const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(3000);const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';
  applyDataObject({members:['みゆ','あやか'],krwRate:11,exchangeRate:150});initAppViews();showTab('add');
  setCurrency('KRW');document.getElementById('expenseName').value='焼肉';document.getElementById('expenseAmount').value='10000';refreshFormHelpers();
  ok('rate note '+document.getElementById('rateNote').textContent,document.getElementById('rateNote').textContent.includes('≈¥1,100')&&document.getElementById('rateNote').textContent.includes('₩100=¥11.00'));
  setPaidBy(0);submitExpense();ok('rate saved',expenses[0].rate===0.11);
  const tot0=document.getElementById('footerTotal').textContent;
  krwRate=12;showRateDisplay();updateDisplay();
  ok('total fixed after rate change '+tot0+' / '+document.getElementById('footerTotal').textContent,document.getElementById('footerTotal').textContent===tot0);
  showTab('list');ok('list approx fixed',document.querySelector('.expense-amount').textContent.includes('≈¥1,100'));
  // 同じ通貨で直してもレートは元のまま
  startEditExpense(0);ok('edit shows fixed rate',document.getElementById('rateNote').textContent.includes('₩100=¥11.00'));
  document.getElementById('expenseAmount').value='20000';submitExpense();ok('rate kept on edit',expenses[0].rate===0.11);
  // 新しい支払いは新しいレート
  setCurrency('KRW');document.getElementById('expenseName').value='カフェ';document.getElementById('expenseAmount').value='5000';setPaidBy(0);submitExpense();
  ok('new uses new rate',expenses[1].rate===0.12);
  // 古い記録（rateなし）は今のレート
  const nd=normalizeData({members:['a'],expenses:[{id:'x',name:'n',amount:100,currency:'KRW',paidBy:0,participants:[0]}]});
  ok('legacy no rate',nd.expenses[0].rate===undefined&&Math.abs(expRate(nd.expenses[0])-0.12)<1e-9);
  ok('sync keeps rate',toSyncView(getDataObject()).expenses[0].rate===0.11);
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{showTab('add');clearExpenseForm();setCurrency('KRW');document.getElementById('expenseAmount').value='12000';refreshFormHelpers();document.querySelector('.container').scrollTop=150;});
await p.waitForTimeout(600);await p.screenshot({path:D+'/rate-note.png',clip:{x:0,y:250,width:390,height:330},timeout:90000});
await b.close();})();
