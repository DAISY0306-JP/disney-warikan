const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(3000);const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';trips=[{id:'t1',name:'ソウル'}];
  applyDataObject({members:['みゆ','あやか','みさき'],exchangeRate:150,krwRate:11,expenses:[
   {id:'a',name:'航空券',amount:180000,currency:'JPY',category:'その他',date:'2026-10-05',paidBy:0,participants:[0,1,2]},
   {id:'b',name:'ホテル',amount:420,currency:'USD',category:'その他',date:'2026-10-05',paidBy:2,participants:[0,1,2]},
   {id:'c',name:'焼肉',amount:9000,currency:'KRW',category:'その他',date:'2026-10-06',paidBy:1,participants:[1,2],split:{m:'ratio',v:{1:2}}}],settled:{'1>0>JPY':60000}});
  initAppViews();showTab('list');setListMode('date');
  const tots=[...document.querySelectorAll('.cat-group-total')].map(x=>x.textContent);
  ok('day totals '+tots.join(' | '),tots.includes('≈¥243,000')&&tots.includes('₩9,000'));
  showTab('settle');
  const items=[...document.querySelectorAll('#settlementList .settlement-item')];
  ok('paid hidden',items.every(x=>!x.classList.contains('done'))&&document.querySelector('.paid-toggle').textContent.includes('済 1件を表示'));
  document.querySelector('.paid-toggle').click();
  const items2=[...document.querySelectorAll('#settlementList .settlement-item')];
  ok('paid shown at bottom',items2[items2.length-1].classList.contains('done')&&document.querySelector('.paid-toggle').textContent.includes('たたむ'));
  ok('per person w/o me',document.getElementById('perPersonTotal').textContent.includes('81,330')&&document.getElementById('perPersonTotal').previousElementSibling.textContent==='1人あたり');
  localStorage.setItem('warikanMe_t1','あやか');updateDisplay();
  // あやか: 60000 + 140*150=21000 + 6000*0.11=660 → 81,660
  ok('my share '+document.getElementById('perPersonTotal').textContent,document.getElementById('perPersonTotal').textContent.includes('81,660')&&document.getElementById('perPersonTotal').previousElementSibling.textContent==='自分の分');
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{showTab('settle');document.querySelector('.container').scrollTop=300;});await p.waitForTimeout(700);await p.screenshot({path:D+'/three-settle.png',timeout:90000});
await p.evaluate(()=>{showTab('list');document.querySelector('.container').scrollTop=0;});await p.waitForTimeout(700);await p.screenshot({path:D+'/three-list.png',timeout:90000});
await b.close();})();
