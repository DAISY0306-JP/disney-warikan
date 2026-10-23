const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))errs.push('pageerror: '+e.message)});
p.on('console',m=>{if(m.type()==='error'&&!/supabase|fonts|ERR_|net::/.test(m.text()))errs.push('console: '+m.text())});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1500);
const steps=[
 ['empty state',()=>{localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId=null;applyDataObject({});initAppViews();['add','list','settle','settings'].forEach(showTab);openTripSheet();closeTripSheet();openBoardingPass();closeBoardingPass();openTripInfo();closeTripInfo();}],
 ['one member no expenses',()=>{currentTripId='t1';trips=[{id:'t1',name:'x'}];applyDataObject({members:['みゆ']});initAppViews();['add','list','settle','settings'].forEach(showTab);refreshFresh();renderQuickRow();renderPassProgress();}],
 ['full data',()=>{applyDataObject({members:['みゆ','あやか','みさき','ゆい'],tripMeta:{from:'TYO',to:'SEL',start:'2026-10-07',end:'2026-10-10'},
   expenses:[{id:'a',name:'タクシー',amount:12000,currency:'KRW',category:'🚃 交通',date:'2026-10-07',paidBy:0,participants:[0,1,2,3]},
   {id:'b',name:'ホテル',amount:80000,currency:'JPY',category:'🏨 宿泊',date:'2026-10-07',paidBy:1,participants:[0,1,2,3]},
   {id:'c',name:'夕食',amount:120,currency:'USD',category:'🍽 食事',date:'2026-10-08',paidBy:2,participants:[0,1,2]},
   {id:'d',name:'カフェ',amount:9000,currency:'KRW',category:'🍽 食事',date:'2026-10-11',paidBy:3,participants:[1,3]}],
   deposits:[],settled:{'0>1>JPY':20000}});localStorage.setItem('warikanMe_t1','みゆ');initAppViews();
   ['add','list','settle','settings'].forEach(showTab);setListMode('cat');setListMode('date');setSettlementMode('min');setSettlementMode('direct');}],
 ['settle all & landing',()=>{showTab('settle');getSettlementTx().filter(t=>!t.paid).forEach(t=>toggleSettled(settleKey(t),t.amount,null,false));playLanding();closeLanding();buildShareCanvas();}],
 ['remove member shifts settled',()=>{showTab('settings');members.push('一時');updateMemberList();updateMemberSelects();removeMember&&removeMember(4);}],
 ['edit/delete flows',()=>{startEditExpense(0);clearExpenseForm();applyQuick(0);submitExpense();}],
 ['passport/catmgr/policy',async()=>{await openPassport();closePassport();openCatManager&&openCatManager();closeCatManager&&closeCatManager();openPolicy();closePolicy();}],
 ['announce burst',()=>{for(let i=0;i<4;i++)announce('test '+i);hideAnnounce();hideAnnounce();}],
];
for(const [name,fn] of steps){
  try{await p.evaluate(`(${fn.toString()})()`);}catch(e){errs.push(name+': '+e.message.split('\n')[0]);}
  await p.waitForTimeout(400);
}
const st=await p.evaluate(()=>({sett:getSettlementTx().map(t=>`${t.from}>${t.to}${t.code}:${Math.round(t.amount)}${t.paid?'済':''}`).join(' '),done:completedAt,members:members.length,settled:JSON.stringify(settled)}));
console.log(JSON.stringify(st));
console.log(errs.length?errs.join('\n'):'NO ERRORS');
await b.close();})();
