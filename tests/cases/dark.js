// ダークモード: 各画面を撮影し、白っぽい大きな面が残っていないかを見る
const {launch}=require('../lib');
(async()=>{const b=await launch();
const ctx=await b.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,colorScheme:'dark'});
const p=await ctx.newPage();
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(2500);const D=process.argv[3];
const setup=()=>{localStorage.clear();localStorage.setItem('warikanMe_t1','みゆ');document.getElementById('authShell').style.display='none';currentTripId='t1';trips=[{id:'t1',name:'ソウル旅行'}];
  const E=(id,name,amount,currency,category,date,paidBy,x={})=>({id,name,amount,currency,category,date,paidBy,participants:[0,1,2],timestamp:'',...(currency!=='JPY'?{rate:0.11}:{}),...x});
  applyDataObject({members:['みゆ','あやか','みさき'],tripMeta:{from:'HND',to:'ICN',start:'2026-11-01',end:'2026-11-04'},wallet:{on:true,ins:[{id:'w1',by:0,amount:30000,currency:'KRW',note:'',date:''}]},
    expenses:[E('a','航空券',90000,'JPY','🚃 交通','2026-09-01',0),E('b','焼肉',120000,'KRW','🍽 食事','2026-11-01',1),E('c','カフェ',18000,'KRW','カフェ','2026-11-02',2),E('d','タクシー',15000,'KRW','🚃 交通','2026-11-02',0,{wallet:true})]});
  initAppViews();};
const r=await p.evaluate(setup=>{eval('('+setup+')')();const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  ok('theme attr',document.documentElement.getAttribute('data-theme')==='dark');
  ok('body dark',getComputedStyle(document.body).backgroundColor!=='rgb(255, 255, 255)');
  localStorage.setItem('warikanTheme','light');applyTheme();ok('force light',document.documentElement.getAttribute('data-theme')==='light');
  localStorage.setItem('warikanTheme','dark');applyTheme();ok('force dark',document.documentElement.getAttribute('data-theme')==='dark');
  localStorage.removeItem('warikanTheme');applyTheme();
  ok('summary',document.getElementById('sv-theme')!==null);
  return o;},setup.toString());
console.log(r.join('\n'));
// 明るい面の検出（白に近い背景で、大きい要素）
const bright=async tab=>p.evaluate(tab=>{const out=[];document.querySelectorAll('body *').forEach(el=>{const r=el.getBoundingClientRect();if(r.width<40||r.height<16||r.bottom<0||r.top>844)return;const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')return;const m=/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?/.exec(cs.backgroundColor);if(!m)return;const a=m[4]===undefined?1:+m[4];if(a<.5)return;const L=(+m[1]+ +m[2]+ +m[3])/3;if(L>200)out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').join('.')}#${el.id} ${cs.backgroundColor}`);});return out.slice(0,12);},tab);
for(const t of ['add','list','settle','settings']){
  await p.evaluate(t=>{showTab(t);document.querySelector('.container').scrollTop=0;},t);await p.waitForTimeout(500);
  const bl=await bright(t);if(bl.length)console.log('FAIL bright on '+t+': '+bl.join(' | '));else console.log('PASS no bright on '+t);
  await p.screenshot({path:D+'/dark-'+t+'.png',timeout:90000});
}
await p.evaluate(()=>{showTab('list');openReview();});await p.waitForTimeout(500);await p.screenshot({path:D+'/dark-review.png',timeout:90000});
await p.evaluate(()=>{closeReview();showTab('settings');openSetSheet('wallet');});await p.waitForTimeout(500);await p.screenshot({path:D+'/dark-wallet.png',timeout:90000});
await p.evaluate(()=>{closeSetSheet();chooseTheme();});await p.waitForTimeout(500);await p.screenshot({path:D+'/dark-choose.png',timeout:90000});
await p.evaluate(()=>{document.querySelectorAll('.active').forEach(e=>{if(/overlay/i.test(e.className))e.classList.remove('active');});openPassport();});await p.waitForTimeout(500);await p.screenshot({path:D+'/dark-passport.png',timeout:90000});
await p.evaluate(()=>{closePassport();document.getElementById('authShell').style.display='';});await p.waitForTimeout(500);await p.screenshot({path:D+'/dark-auth.png',timeout:90000});
await b.close();})();
