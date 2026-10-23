const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  document.getElementById('authShell').style.display='none';
  applyDataObject({members:['みゆ','あやか'],categories:['🍽 食事','✈️航空券','その他'],expenses:[{id:'e1',name:'x',amount:100,currency:'JPY',category:'✈️航空券',date:'2026-11-27',paidBy:0,participants:[0,1]}]});
  initAppViews();openCatManager();
  ok('30 icons',CAT_ICON_KEYS.length===30&&CAT_ICON_KEYS.every(k=>CAT_ICON_PATHS[k]));
  document.querySelectorAll('.cat-manage-item .cat-manage-ic')[1].click();
  ok('picker open w/ 30',document.getElementById('iconPickOverlay').classList.contains('active')&&document.querySelectorAll('.icon-pick').length===30);
  ok('current is plane',[...document.querySelectorAll('.icon-pick')].indexOf(document.querySelector('.icon-pick.active'))===CAT_ICON_KEYS.indexOf('plane'));
  chooseIcon('camera');
  ok('saved choice',catIcons['✈️航空券']==='camera'&&getDataObject().catIcons['✈️航空券']==='camera');
  ok('sync view has it',toSyncView(getDataObject()).catIcons['✈️航空券']==='camera');
  // rename keeps icon
  const inp=document.querySelectorAll('.cat-manage-item input')[1];inp.value='写真';inp.dispatchEvent(new Event('change'));
  ok('rename moves icon',catIcons['写真']==='camera'&&!catIcons['✈️航空券']);
  // add with chosen icon
  document.getElementById('catAddInput').value='ナイトマーケット';renderNewCatIcon();pickNewCatIcon();chooseIcon('music');addCatFromModal();
  ok('new cat icon',catIcons['ナイトマーケット']==='music'&&_cats.includes('ナイトマーケット'));
  ok('normalize drops bad',Object.keys(normalizeCatIcons({a:'camera',b:'nope'})).join()==='a');
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{document.querySelectorAll('.cat-manage-item .cat-manage-ic')[0].click();});await p.waitForTimeout(400);
await p.screenshot({path:process.argv[3]+'/iconpick.png'});
await p.evaluate(()=>closeIconPicker());await p.waitForTimeout(200);await p.screenshot({path:process.argv[3]+'/catmgr2.png'});
await b.close();})();
