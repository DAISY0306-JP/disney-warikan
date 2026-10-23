// 使い方（初回だけ）と、旅の準備のチェックリスト
const {launch}=require('../lib');
(async()=>{const b=await launch();
for(const scheme of ['light','dark']){
const ctx=await b.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,colorScheme:scheme});
const p=await ctx.newPage();
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(2500);const D=process.argv[3];
const r=await p.evaluate(async scheme=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+scheme+' '+n);
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';trips=[{id:'t1',name:'新しい旅行'}];
  applyDataObject({members:['']});initAppViews();showTab('add');
  const card=()=>document.querySelector('#setupCard .setup-card');
  ok('setup shown',!!card()&&card().textContent.includes('0 / 3'));
  members=['みゆ','あやか'];updateDisplay();ok('members done',card().textContent.includes('1 / 3')&&card().querySelectorAll('.setup-step.done').length===1);
  tripMeta={...tripMeta,to:'ICN'};updateDisplay();ok('dest done',card().textContent.includes('2 / 3'));
  markInvited();updateDisplay();ok('all done hides',!card());
  localStorage.removeItem('warikanInvited_t1');updateDisplay();ok('back',!!card());
  expenses=[{id:'x',name:'n',amount:1,currency:'JPY',category:'その他',date:'2026-10-01',paidBy:0,participants:[0,1],timestamp:''}];updateDisplay();ok('hidden with expenses',!card());
  expenses=[];updateDisplay();hideSetup();ok('dismiss',!card());
  // 使い方は1回だけ
  maybeShowGuide();await new Promise(r=>setTimeout(r,600));ok('guide shown',document.getElementById('guideSheet').classList.contains('active'));
  closeGuide();ok('guide closed',!document.getElementById('guideSheet').classList.contains('active'));
  maybeShowGuide();await new Promise(r=>setTimeout(r,600));ok('guide once',!document.getElementById('guideSheet').classList.contains('active'));
  // 撮影用
  localStorage.removeItem('warikanSetupHide_t1');members=['みゆ'];tripMeta={...tripMeta,to:''};updateDisplay();
  return o;},scheme);
console.log(r.join('\n'));
await p.waitForTimeout(400);await p.screenshot({path:D+`/setup-${scheme}.png`,clip:{x:0,y:190,width:390,height:300},timeout:90000});
await p.evaluate(()=>openGuide());await p.waitForTimeout(500);await p.screenshot({path:D+`/guide-${scheme}.png`,timeout:90000});
await ctx.close();}
await b.close();})();
