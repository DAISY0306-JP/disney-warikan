const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(3000);
const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);const t=ms=>new Promise(r=>setTimeout(r,ms||80));
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';trips=[{id:'t1',name:'ソウル'}];currentUser={id:'u',email:'miyu@example.com'};
  applyDataObject({members:['みゆ','あやか','みさき'],tripMeta:{from:'HND',to:'GMP',start:'2026-11-27',end:'2026-11-30'},wallet:{on:true,ins:[{id:'w1',by:0,amount:30000,currency:'KRW',note:'前回の残り'}]}});initAppViews();showTab('settings');
  document.getElementById('loginUserText').textContent=currentUser.email;
  const panel=document.querySelector('.tab-panel[data-tab="settings"]');
  ok('height '+panel.scrollHeight,panel.scrollHeight<1250); // 表示・使い方の2行を足したぶん少し増えた
  ok('summary route '+document.getElementById('sv-route').textContent,document.getElementById('sv-route').textContent.startsWith('HND → GMP'));
  ok('summary members',document.getElementById('sv-members').textContent==='みゆ・あやか・みさき');
  ok('summary wallet '+document.getElementById('sv-wallet').textContent,document.getElementById('sv-wallet').textContent.includes('30,000'));
  // メンバーのシート
  openSetSheet('member');
  ok('member sheet',document.getElementById('setSheet').classList.contains('active')&&document.getElementById('setSheetTitle').textContent==='メンバー'&&document.querySelectorAll('#setSheetBody .member-chip').length===3);
  toggleMemberEdit();ok('member edit',document.getElementById('memberEdit').style.display==='block');
  document.querySelector('#memberList input').value='みゆう';document.querySelector('#memberList input').dispatchEvent(new Event('change'));saveMemberEdit();
  closeSetSheet();ok('member saved + summary',members[0]==='みゆう'&&document.getElementById('sv-members').textContent.startsWith('みゆう')&&document.getElementById('setStore').contains(document.getElementById('memberList')));
  // 財布
  openSetSheet('wallet');ok('wallet sheet',!!document.querySelector('#setSheetBody .wal-head'));
  document.getElementById('walBy').value='all';document.getElementById('walCur').value='KRW';document.getElementById('walAmt').value='30000';addWalletIn();
  closeSetSheet();ok('wallet summary '+document.getElementById('sv-wallet').textContent,document.getElementById('sv-wallet').textContent.includes('60,000'));
  // レート
  openSetSheet('rate');ok('rate sheet (KRW only for Seoul)',!!document.querySelector('#setSheetBody #rateText-KRW .flap')&&!document.querySelector('#setSheetBody #rateText-USD'));
  toggleRateEdit('KRW');document.getElementById('rateInput').value='12';applyRate();closeSetSheet();
  ok('rate summary '+document.getElementById('sv-rate').textContent,document.getElementById('sv-rate').textContent.includes('₩100=¥12.00'));
  // 共有・同期・アカウント
  openSetSheet('share');ok('share sheet',!!document.querySelector('#setSheetBody .share-actions'));
  openSetSheet('sync');ok('switch sheet',!!document.querySelector('#setSheetBody #syncStatus')&&!document.querySelector('#setSheetBody .share-actions'));
  openSetSheet('account');ok('account sheet',!!document.querySelector('#setSheetBody .account-delete'));closeSetSheet();
  // セットアップ案内から
  applyDataObject({members:['']});initAppViews();goToMemberSetup();
  ok('goToMemberSetup',document.getElementById('setSheet').classList.contains('active')&&document.getElementById('memberEdit').style.display==='block');
  closeSetSheet();
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{applyDataObject({members:['みゆ','あやか','みさき'],tripMeta:{from:'HND',to:'GMP',start:'2026-11-27',end:'2026-11-30'},wallet:{on:true,ins:[{id:'w1',by:0,amount:30000,currency:'KRW',note:'前回の残り'}]}});initAppViews();showTab('settings');document.getElementById('loginUserText').textContent='miyu@example.com';});
await p.waitForTimeout(1500);await p.screenshot({path:D+'/set-new.png',timeout:90000});
await p.evaluate(()=>{document.querySelector('.container').scrollTop=9999;});await p.waitForTimeout(300);await p.screenshot({path:D+'/set-new2.png',timeout:90000});
await p.evaluate(()=>openSetSheet('rate'));await p.waitForTimeout(600);await p.screenshot({path:D+'/set-sheet.png',timeout:90000});
await b.close();})();
