const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1500);
const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);const t=ms=>new Promise(r=>setTimeout(r,ms||60));
  document.getElementById('authShell').style.display='none';
  trips=[{id:'t1',name:'ソウル旅行🇰🇷',updated_at:'2026-10-05'},{id:'t2',name:'フロリダディズニー',updated_at:'2026-06-19'}];currentTripId='t1';
  applyDataObject({members:['みゆ','あやか','みさき'],expenses:[
    {id:'e1',name:'飛行機',amount:181410,currency:'JPY',category:'✈️航空券',date:'2026-11-27',paidBy:0,participants:[0,1,2]},
    {id:'e2',name:'夕食',amount:60000,currency:'KRW',category:'🍽 食事',date:'2026-11-28',paidBy:1,participants:[0,1,2]},
    {id:'e3',name:'前日の買い物',amount:3000,currency:'JPY',category:'🛍 買い物',date:'2026-11-26',paidBy:2,participants:[0,1,2]}]});
  localStorage.setItem('warikanMe_t1','みゆ');renderTripSelect();initAppViews();_showPaid=true;
  ok('route prompt when no dest',document.getElementById('passRoute').textContent.includes('行き先と日程を設定'));
  // 1. 旅の情報
  openTripInfo();document.getElementById('tiTo').value='ICN';document.getElementById('tiStart').value='2026-11-27';document.getElementById('tiEnd').value='2026-11-30';saveTripInfo();
  const rt=document.getElementById('passRoute').textContent;
  ok('route: '+rt,rt.includes('HND')&&rt.includes('ICN')&&rt.includes('WT 1127')&&rt.includes('11/27–11/30'));
  ok('meta saved & synced',getDataObject().tripMeta.to==='ICN'&&toSyncView(getDataObject()).tripMeta.start==='2026-11-27');
  ok('normalize drops bad code',normalizeTripMeta({from:'XXX',to:'ZZZ',start:'bad'}).from==='HND'&&normalizeTripMeta({from:'TYO',to:'SEL'}).to==='ICN'&&normalizeTripMeta({to:'ZZZ'}).to==='');
  // 2. Day
  showTab('list');setListMode('date');
  const labels=[...document.querySelectorAll('#expenseList .cat-group-label')].map(x=>x.textContent);
  ok('day labels: '+labels.join(' | '),labels.includes('Day 2 · 11/28（土）')&&labels.includes('Day 1 · 11/27（金）')&&labels.some(l=>l.startsWith('出発前')));
  // 3. flaps
  showRateDisplay(true);
  ok('flaps',document.querySelectorAll('#rateText-KRW .flap').length>=5&&document.querySelector('#rateText-KRW .flap.flip'));
  // 7. receipt
  showTab('add');document.getElementById('expenseName').value='タクシー';document.getElementById('expenseAmount').value='12000';setCurrency('KRW');submitExpense();
  ok('receipt slip',!!document.querySelector('.receipt-slip')&&document.querySelector('.receipt-slip').textContent.includes('タクシー'));
  tripMeta.start='2026-09-01';tripMeta.end='2026-09-04'; // 帰国後の旅行として精算
  // 8 + completedAt
  showTab('settle');
  const btns=()=>[...document.querySelectorAll('.settlement-item .sett-done-btn')].filter(b=>!b.closest('.settlement-item').classList.contains('done'));
  while(btns().length){btns()[0].click();await t(10);}
  ok('completedAt set',completedAt===todayStr()&&getDataObject().completedAt===todayStr());
  ok('landing shown: '+document.getElementById('landingDest').textContent,document.getElementById('landingOverlay').classList.contains('active')&&document.getElementById('landingDest').textContent.includes('ソウル'));
  closeLanding();
  // 4. passport
  await openPassport();
  const stamps=document.querySelectorAll('#passportGrid .stamp');
  ok('passport stamps '+stamps.length+' '+document.getElementById('passportCount').textContent,stamps.length===2&&!stamps[0].classList.contains('pending')&&stamps[0].textContent.includes('ICN')&&stamps[1].classList.contains('pending'));
  // 5. share image
  const c=buildShareCanvas();ok('canvas',c.width===1080&&c.height===1350);
  window.__dl=null;const oc=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.__dl=this.download;};
  await shareTripImage();HTMLAnchorElement.prototype.click=oc;
  ok('image download fallback',window.__dl==='waritabi.png');
  // 取り消すと completedAt が消える
  closePassport();document.querySelector('.settlement-item.done .sett-done-btn').click();await t();
  ok('completedAt cleared',completedAt==='');
  tripMeta.start='2026-11-27';tripMeta.end='2026-11-30';
  ok('after return '+dayLabel('2026-12-01')+' / '+dayLabel('2026-11-30'),dayLabel('2026-12-01')==='帰国後 · 12/1（火）'&&dayLabel('2026-11-30').startsWith('Day 4'));
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{document.querySelectorAll('.receipt-slip').forEach(e=>e.remove());showTab('add');document.querySelector('.container').scrollTop=0;});await p.waitForTimeout(1500);await p.screenshot({path:D+'/tr-add.png'});
await p.evaluate(()=>{showTab('list');});await p.waitForTimeout(300);await p.screenshot({path:D+'/tr-list.png'});
await p.evaluate(()=>{showTab('settings');const c=document.querySelector('.container');c.scrollTop=document.getElementById('rateDisplay').getBoundingClientRect().top-300;showRateDisplay(false);});await p.waitForTimeout(300);await p.screenshot({path:D+'/tr-rate.png'});
await p.evaluate(()=>openTripInfo());await p.waitForTimeout(400);await p.screenshot({path:D+'/tr-info.png'});await p.evaluate(()=>closeTripInfo());
await p.evaluate(async()=>{showTab('settle');document.querySelectorAll('.settlement-item .sett-done-btn').forEach(b=>{if(!b.closest('.settlement-item').classList.contains('done'))b.click();});closeLanding();await openPassport();});await p.waitForTimeout(500);await p.screenshot({path:D+'/tr-passport.png'});
await p.evaluate(()=>{closePassport();closeLanding();playLanding();});await p.waitForTimeout(2600);await p.screenshot({path:D+'/tr-landing.png'});
await p.evaluate(()=>{closeLanding();});
// 画像
const png=await p.evaluate(()=>buildShareCanvas().toDataURL('image/png'));require('fs').writeFileSync(D+'/tr-share.png',Buffer.from(png.split(',')[1],'base64'));
// receipt mid-animation
await p.evaluate(()=>{showTab('add');document.getElementById('expenseName').value='ランチ';document.getElementById('expenseAmount').value='3200';setCurrency('JPY');submitExpense();});await p.waitForTimeout(800);await p.screenshot({path:D+'/tr-receipt.png'});
await b.close();})();
