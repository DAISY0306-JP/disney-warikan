const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1500);
const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);const t=ms=>new Promise(r=>setTimeout(r,ms||60));
  localStorage.clear();
  document.getElementById('authShell').style.display='none';
  trips=[{id:'t1',name:'ソウル旅行🇰🇷',updated_at:'2026-10-05'}];currentTripId='t1';
  applyDataObject({members:['みゆ','あやか','みさき'],tripMeta:{from:'TYO',to:'SEL',start:'2026-11-27',end:'2026-11-30'},expenses:[
    {id:'e1',name:'タクシー',amount:12000,currency:'KRW',category:'🚃 交通',date:'2026-11-27',paidBy:0,participants:[0,1]},
    {id:'e2',name:'夕食',amount:60000,currency:'KRW',category:'🍽 食事',date:'2026-11-28',paidBy:1,participants:[0,1,2]},
    {id:'e3',name:'タクシー',amount:8000,currency:'KRW',category:'🚃 交通',date:'2026-11-28',paidBy:2,participants:[0,1]}]});
  localStorage.setItem('warikanMe_t1','みゆ');renderTripSelect();initAppViews();showTab('add');
  // 3 quick
  const chips=[...document.querySelectorAll('#quickRow .quick-chip')].map(c=>c.textContent);
  ok('quick chips '+chips.join(','),chips[0]==='タクシー'&&chips.includes('夕食')&&chips.length===6&&!chips.slice(2).includes('タクシー'));
  setCurrency('JPY');applyQuick(0);
  const parts=members.map((_,i)=>document.getElementById('participant'+i).checked);
  ok('quick fill',document.getElementById('expenseName').value==='タクシー'&&currentCurrency==='KRW'&&_currentCat==='🚃 交通'&&parts.join()==='true,true,false'&&document.activeElement.id==='expenseAmount');
  const pi=[...document.querySelectorAll('#quickRow .quick-chip')].findIndex(c=>c.textContent==='カフェ');applyQuick(pi);
  ok('preset fill '+_currentCat,document.getElementById('expenseName').value==='カフェ'&&_currentCat==='🍽 食事');
  ok('item icons',itemIconKey('カフェ','🍽 食事')==='cafe'&&itemIconKey('タクシー','🚃 交通')==='car'&&itemIconKey('夕食','🍽 食事')==='meal'&&itemIconKey('謎の出費','🛍 買い物')==='bag');
  const cafeChip=[...document.querySelectorAll('#quickRow .quick-chip')].find(c=>c.textContent==='カフェ');ok('cafe chip icon',cafeChip.querySelector('svg').innerHTML===(()=>{const d=document.createElement('div');d.innerHTML=iconSvgByKey('cafe');return d.firstChild.innerHTML;})());
  startEditExpense(0);ok('quick hidden while editing',document.getElementById('quickRow').style.display==='none');clearExpenseForm();
  // 4 fresh: 初回は全部既読
  let f=refreshFresh();ok('first open no fresh',f.length===0&&_fresh.size===0);
  // 他の人が追加・変更
  _syncBase=toSyncView(getDataObject());
  const v=toSyncView(getDataObject());v.expenses=v.expenses.map(e=>e.id==='e2'?{...e,amount:65000}:e);v.expenses.push({id:'e9',name:'カフェ',amount:9000,currency:'KRW',category:'🍽 食事',date:'2026-11-28',paidBy:2,participants:[0,1,2]});
  applyRemoteView(v);
  ok('badge 2',document.getElementById('listBadge').textContent==='2'&&document.getElementById('listBadge').classList.contains('show'));
  ok('announce fresh: '+document.getElementById('announceMsg').textContent,document.getElementById('announce').classList.contains('show')&&document.getElementById('announceMsg').textContent.includes('「カフェ」'));
  // 自分の追加は新着にならない
  document.getElementById('expenseName').value='水';document.getElementById('expenseAmount').value='1000';submitExpense();
  ok('own add not fresh',_fresh.size===2);
  showTab('list');
  ok('list highlights',document.querySelectorAll('#expenseList .is-fresh').length===2&&document.querySelector('.fresh-tag').textContent.length>0&&!document.getElementById('listBadge').classList.contains('show'));
  showTab('add');ok('cleared after leaving',_fresh.size===0&&!document.querySelector('#expenseList .is-fresh'));
  ok('stays seen',refreshFresh().length===0&&_fresh.size===0);
  // 6 clock
  const lt=localTimeInfo('ICN',new Date('2026-11-27T03:00:00Z'));ok('seoul time '+JSON.stringify(lt),lt.time==='12:00'&&lt.diff==='時差なし');
  const ny=localTimeInfo('JFK',new Date('2026-11-27T03:00:00Z'));ok('ny '+JSON.stringify(ny),ny.time==='22:00'&&ny.diff==='日本−14h');
  const bk=localTimeInfo('BKK',new Date('2026-11-27T03:00:00Z'));ok('bkk '+bk.diff,bk.diff==='日本−2h');
  ok('clock shown',document.getElementById('tripPass').classList.contains('has-clock')&&document.getElementById('passClock').textContent.includes('ICN'));
  tripMeta.to='OKA';renderPassRoute();ok('domestic no clock',!document.getElementById('tripPass').classList.contains('has-clock'));tripMeta.to='ICN';renderPassRoute();
  // 7 seat
  ok('seats '+[0,1,2].map(seatNo).join(','),/^\d\dA$/.test(seatNo(0))&&seatNo(1).endsWith('B')&&seatNo(0).slice(0,-1)===seatNo(2).slice(0,-1));
  ok('seat in me bar & members',document.querySelector('#meText .seat-tag')&&document.querySelectorAll('#memberList .seat-tag').length===3);
  // 9 countdown
  ok('cd 3days',tripCountdownText('2026-11-24').includes('あと3日'));
  ok('cd today',tripCountdownText('2026-11-27').includes('本日出発'));
  ok('cd day2',tripCountdownText('2026-11-28').includes('Day 2'));
  ok('cd back',tripCountdownText('2026-12-02').includes('おかえりなさい'));
  ok('cd far',tripCountdownText('2026-08-01')==='');
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{hideAnnounce();_annQueue=[];showTab('add');document.querySelector('.container').scrollTop=0;});await p.waitForTimeout(800);await p.screenshot({path:D+'/ft-add.png'});
await p.evaluate(()=>{showTab('settings');const v=toSyncView(getDataObject());_syncBase=toSyncView(getDataObject());v.expenses.push({id:'e10',name:'マッサージ',amount:50000,currency:'KRW',category:'🛍 買い物',date:'2026-11-29',paidBy:1,participants:[0,1,2]});applyRemoteView(v);});await p.waitForTimeout(900);await p.screenshot({path:D+'/ft-announce.png'});
await p.evaluate(()=>{hideAnnounce();_annQueue=[];showTab('list');});await p.waitForTimeout(500);await p.screenshot({path:D+'/ft-list.png'});
await p.evaluate(()=>{showTab('settings');document.querySelector('.container').scrollTop=0;});await p.waitForTimeout(300);await p.screenshot({path:D+'/ft-settings.png'});
await b.close();})();
