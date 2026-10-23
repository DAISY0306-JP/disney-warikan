const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(3000);const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';
  applyDataObject({members:['みゆ','あやか'],krwRate:11,exchangeRate:150,expenses:[]});initAppViews();showTab('list');
  ok('hidden when empty',document.getElementById('reviewOpenBtn').hidden);
  const E=(id,name,amount,currency,category,date,extra={})=>({id,name,amount,currency,category,date,paidBy:0,participants:[0,1],timestamp:'2026-01-01T00:00:00Z',...extra});
  applyDataObject({members:['みゆ','あやか'],krwRate:11,exchangeRate:150,tripMeta:{from:'HND',to:'ICN',start:'2026-10-01',end:'2026-10-03'},
    expenses:[E('a','航空券',60000,'JPY','交通','2026-08-01'),E('b','焼肉',100000,'KRW','食事','2026-10-01',{rate:0.1}),E('c','ホテル',300000,'KRW','宿泊','2026-10-02',{rate:0.1}),
      E('d','カフェ',10000,'KRW','カフェ','2026-10-02',{rate:0.1,split:{m:'amount',v:{0:10000,1:0}}}),E('e','お土産',3000,'JPY','買い物','2026-10-05')]});
  initAppViews();showTab('list');
  ok('shown',!document.getElementById('reviewOpenBtn').hidden);
  const R=tripReview();
  ok('total '+R.yen,R.yen===60000+10000+30000+1000+3000);
  ok('days labels '+R.days.map(d=>d.label+':'+d.yen).join(','),R.days.map(d=>d.label).join()==='出発前,1日目,2日目,3日目,帰国後'&&R.days[3].yen===0);
  ok('tripDays/inYen',R.tripDays===3&&R.inYen===41000);
  ok('cat sorted',R.cats[0].cat==='交通'&&R.cats[1].cat==='宿泊');
  ok('mem shares '+R.mem.map(m=>m.yen).join(','),R.mem[0].yen===30000+5000+15000+1000+1500&&R.mem[1].yen===30000+5000+15000+0+1500);
  ok('top',R.top.map(x=>x.e.name).join()==='航空券,ホテル,焼肉');
  openReview();const body=document.getElementById('reviewBody').textContent;
  ok('sheet total',body.includes('¥104,000'));ok('avg',body.includes('¥13,667'));
  ok('note pre/post',body.includes('旅行中の日だけ'));
  const c=buildReviewCanvas();ok('canvas',c.width===1080);
  // no tripMeta
  applyDataObject({members:['a'],expenses:[E('x','n',100,'JPY','食事','2026-01-02'),E('y','m',100,'JPY','食事','')]});initAppViews();
  const R2=tripReview();ok('no meta days '+R2.days.map(d=>d.label).join(),R2.days.map(d=>d.label).join()==='1/1,1/2'&&R2.tripDays===2);
  closeReview();
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{const E=(id,name,amount,currency,category,date,extra={})=>({id,name,amount,currency,category,date,paidBy:0,participants:[0,1],timestamp:'2026-01-01T00:00:00Z',...extra});
  applyDataObject({members:['みゆ','あやか'],krwRate:11,exchangeRate:150,tripMeta:{from:'HND',to:'ICN',start:'2026-10-01',end:'2026-10-04'},
    expenses:[E('a','航空券',60000,'JPY','交通','2026-08-01'),E('b','焼肉',100000,'KRW','食事','2026-10-01',{rate:0.1}),E('c','ホテル',300000,'KRW','宿泊','2026-10-02',{rate:0.1}),
      E('d','カフェ',10000,'KRW','カフェ','2026-10-02',{rate:0.1}),E('f','明洞コスメ',150000,'KRW','買い物','2026-10-03',{rate:0.1}),E('g','タクシー',20000,'KRW','交通','2026-10-04',{rate:0.1}),E('e','お土産',3000,'JPY','買い物','2026-10-05')]});
  initAppViews();showTab('list');});
await p.waitForTimeout(500);await p.screenshot({path:D+'/rv-btn.png',clip:{x:0,y:0,width:390,height:844},timeout:90000});
await p.evaluate(()=>openReview());await p.waitForTimeout(600);
await p.screenshot({path:D+'/rv-sheet1.png',timeout:90000});
await p.evaluate(()=>{const s=document.querySelector('.rv-sheet');s.scrollTop=s.scrollHeight;});await p.waitForTimeout(300);
await p.screenshot({path:D+'/rv-sheet2.png',timeout:90000});
const data=await p.evaluate(()=>buildReviewCanvas().toDataURL('image/png'));
require('fs').writeFileSync(D+'/rv-image.png',Buffer.from(data.split(',')[1],'base64'));
await b.close();})();
