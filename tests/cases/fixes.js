const {launch}=require('../lib');
(async()=>{const b=await launch();
const ctx=await b.newContext({ignoreHTTPSErrors:true,timezoneId:'Europe/Paris'});const p=await ctx.newPage();
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  localStorage.clear();document.getElementById('authShell').style.display='none';
  // 1. settled のマージ
  const base={...toSyncView({members:['A','B','C']}),settled:{}};
  const local={...base,settled:{'2>1>JPY':100}},server={...base,settled:{'0>1>JPY':200}};
  const m=mergeSync(base,local,server);
  ok('settled merged both '+JSON.stringify(m.settled),m.settled['0>1>JPY']===200&&m.settled['2>1>JPY']===100);
  const m2=mergeSync({...base,settled:{'0>1>JPY':200}},{...base,settled:{}},{...base,settled:{'0>1>JPY':200,'2>1>JPY':5}});
  ok('local undo kept, server add kept '+JSON.stringify(m2.settled),!('0>1>JPY' in m2.settled)&&m2.settled['2>1>JPY']===5);
  currentTripId='t1';
  // 3. selectTrip 失敗で元に戻る
  trips=[{id:'t1',name:'旅A'},{id:'t2',name:'旅B'}];currentTripId='t1';_syncBase=toSyncView(getDataObject());_syncRev=3;
  sb={from:()=>({select:()=>({eq:()=>({single:async()=>({data:null,error:{message:'offline'}})})})})};
  await selectTrip('t2');
  ok('restored after failure',currentTripId==='t1'&&_syncBase&&_syncRev===3&&document.getElementById('tripNameBtn').textContent==='旅A');
  sb=null;
  // 4. メンバーを消しても「更新」にならない
  applyDataObject({members:['A','B','C'],expenses:[{id:'x',name:'n',amount:10,currency:'JPY',category:'その他',date:'2026-10-01',paidBy:2,participants:[0,2]}]});
  localStorage.removeItem(seenKey());refreshFresh();
  members.splice(1,1);expenses[0].paidBy=1;expenses[0].participants=[0,1];
  ok('no fresh after member removal',refreshFresh().length===0&&_fresh.size===0);
  // 6. 変なコード
  ok('bad codes rejected',normalizeTripMeta({to:'constructor',from:'toString'}).to===''&&normalizeTripMeta({from:'__proto__'}).from==='HND');
  return o;});
console.log(r.join('\n'));await b.close();})();
