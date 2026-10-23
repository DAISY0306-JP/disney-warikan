const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(3000);
const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';trips=[{id:'t1',name:'ソウル'}];
  applyDataObject({members:['みゆ','あやか','みさき'],wallet:{on:true,ins:[{id:'w1',by:0,amount:30000,currency:'KRW'},{id:'w2',by:1,amount:30000,currency:'KRW'},{id:'w3',by:2,amount:30000,currency:'KRW'}]},expenses:[
    {id:'a',name:'航空券',amount:181410,currency:'JPY',category:'その他',date:'2026-10-08',paidBy:0,participants:[0,1,2]},
    {id:'b',name:'焼肉',amount:60000,currency:'KRW',category:'その他',date:'2026-10-08',paidBy:0,participants:[0,1,2],wallet:true},
    {id:'c',name:'カフェ',amount:9000,currency:'KRW',category:'その他',date:'2026-10-08',paidBy:1,participants:[1,2],split:{m:'ratio',v:{1:2}}}]});
  localStorage.setItem('warikanMe_t1','みゆ');initAppViews();showTab('settle');
  const body=document.getElementById('cardPersonal');if(body.classList.contains('collapsed'))toggleCard('cardPersonal',body.previousElementSibling);
  const tables=document.querySelectorAll('#personalSummary .pt');
  ok('2 currency tables',tables.length===2);
  const jp=[...tables[0].querySelectorAll('.pt-row')].map(r=>r.textContent.replace(/\s+/g,''));
  ok('jpy rows '+jp.join(' | '),jp[0].includes('¥181,410')&&jp[0].includes('¥60,470')&&jp[0].includes('+¥120,940')&&jp[1].includes('−¥60,470'));
  const kr=[...tables[1].querySelectorAll('.pt-row')].map(r=>r.textContent.replace(/\s+/g,''));
  ok('krw rows '+kr.join(' | '),kr[1].includes('₩39,000')&&kr[1].includes('₩26,000'));
  ok('wallet note',tables[1].querySelector('.pt-note').textContent.includes('₩30,000'));
  // 差引の合計＝財布の残り分だけマイナス（財布に返ってくる）
  const t=memberTotals('KRW');const sum=t.paid.reduce((a,b)=>a+b,0)-t.share.reduce((a,b)=>a+b,0);
  ok('krw net sum equals wallet leftover '+sum,Math.round(sum)===30000);
  setSettlementMode('min');
  const txt=memberDetailText(0);ok('detail text uses current mode',txt.includes('【割り勘明細】みゆ（ソウル）')&&txt.includes('立て替えた ¥181,410')&&getSettlementTx().filter(x=>x.from===0||x.to===0).every(x=>txt.includes(pname(x.from)+' → '+pname(x.to))));
  let copied='';window.copyText=async(t)=>{copied=t;};const ns=navigator.share;Object.defineProperty(navigator,'share',{value:undefined,configurable:true});
  await sendMemberDetail(1);ok('send copies',copied.startsWith('【割り勘明細】あやか'));
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{const c=document.querySelector('.container');c.scrollTop=document.getElementById('personalSummary').getBoundingClientRect().top+c.scrollTop-160;});
await p.waitForTimeout(800);await p.screenshot({path:D+'/pt.png',timeout:90000});
await b.close();})();
