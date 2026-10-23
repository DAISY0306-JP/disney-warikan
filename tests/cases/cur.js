const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(3000);const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';
  window.fetch=async()=>({ok:false}); // 自動取得はさせない
  applyDataObject({members:['みゆ','あやか'],krwRate:11,exchangeRate:150,tripMeta:{from:'HND',to:'CDG',start:'2026-11-01',end:'2026-11-05'}});initAppViews();showTab('add');
  ok('active paris '+activeCurrencies().map(c=>c.code),activeCurrencies().map(c=>c.code).join()==='JPY,EUR');
  setCurrency('JPY');cycleCurrency();ok('cycle to EUR',currentCurrency==='EUR');cycleCurrency();ok('cycle back JPY',currentCurrency==='JPY');
  setCurrency('EUR');document.getElementById('expenseName').value='カフェ';document.getElementById('expenseAmount').value='12.5';refreshFormHelpers();
  ok('rate note '+document.getElementById('rateNote').textContent,document.getElementById('rateNote').textContent.includes('€1=¥170.0'));
  setPaidBy(0);submitExpense();ok('saved EUR',expenses[0].currency==='EUR'&&expenses[0].rate===170);
  showTab('list');ok('list shows € '+document.querySelector('.expense-amount').textContent,document.querySelector('.expense-amount').textContent.includes('€12.50')&&document.querySelector('.expense-amount').textContent.includes('≈¥2,125'));
  // 精算
  showTab('settle');const tx=getSettlementTx();ok('settle EUR '+JSON.stringify(tx),tx.length===1&&tx[0].code==='EUR'&&Math.abs(tx[0].amount-6.25)<1e-9);
  toggleSettled(settleKey(tx[0]),tx[0].amount,null,false);ok('settled key kept by normalize',Object.keys(normalizeData(getDataObject()).settled).some(k=>k.endsWith('>EUR')));
  // レートの変更
  toggleRateEdit('EUR');document.getElementById('rateInput').value='160';applyRate();ok('rates EUR',rates.EUR===160&&yenPer('EUR')===160);
  ok('rate rows',document.getElementById('rateRows').textContent.includes('EUR')&&!document.getElementById('rateRows').textContent.includes('KRW'));
  ok('sync rates',toSyncView(getDataObject()).rates.EUR===160);
  // 行き先を変えると、使っている通貨（EUR）は残る
  tripMeta={...tripMeta,to:'ICN'};updateDisplay();ok('ICN keeps EUR '+activeCurrencies().map(c=>c.code),activeCurrencies().map(c=>c.code).join()==='JPY,KRW,EUR');
  // ベトナム（単位1000）
  applyDataObject({members:['a','b'],tripMeta:{from:'HND',to:'SGN',start:'',end:''},expenses:[]});initAppViews();showTab('add');
  ok('vnd '+rateLabel('VND'),rateLabel('VND')==='₫1,000=¥5.80');
  setCurrency('VND');document.getElementById('expenseName').value='フォー';document.getElementById('expenseAmount').value='15000000';refreshFormHelpers();setPaidBy(0);submitExpense();
  ok('big VND saved',expenses.length===1&&expenses[0].amount===15000000);
  ok('sym small multi',symSmall('NT$1,000').startsWith('<span class="cur">NT$</span>')&&symSmall('$5').startsWith('<span class="cur">$</span>'));
  // 行き先なし → 円・ドル・ウォン
  applyDataObject({members:['a'],expenses:[]});initAppViews();ok('no dest',activeCurrencies().map(c=>c.code).join()==='JPY,USD,KRW');
  // fitCurrency: 行き先を台北にすると選択が TWD に
  setCurrency('KRW');tripMeta={...tripMeta,to:'TPE'};updateDisplay();ok('fit to TWD '+currentCurrency,currentCurrency==='TWD');
  // 取得: 1つ目のAPIにない通貨は2つ目から
  window.fetch=async u=>({ok:true,json:async()=>/frankfurter/.test(u)?{date:'2026-10-19',rates:{USD:0.0066,KRW:9.1,EUR:0.0058}}:{time_last_update_unix:0,rates:{USD:0.007,TWD:0.21,VND:170}}});
  await fetchLatestRates();ok('fetched '+exchangeRate+' '+rates.EUR+' '+rates.TWD+' '+rates.VND,Math.abs(exchangeRate-151.52)<0.01&&Math.abs(rates.EUR-172.414)<0.01&&Math.abs(rates.TWD-4.7619)<0.001&&Math.abs(rates.VND-0.00588235)<1e-7);
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{applyDataObject({members:['みゆ','あやか'],tripMeta:{from:'HND',to:'CDG',start:'',end:''},rates:{EUR:172.4}});initAppViews();showTab('add');setCurrency('EUR');document.getElementById('expenseAmount').value='12.5';refreshFormHelpers();});
await p.waitForTimeout(500);await p.screenshot({path:D+'/cur-add.png',clip:{x:0,y:220,width:390,height:330},timeout:90000});
await p.evaluate(()=>{showTab('settings');openSetSheet('rate');});await p.waitForTimeout(800);
await p.screenshot({path:D+'/cur-rate.png',timeout:90000});
await b.close();})();
