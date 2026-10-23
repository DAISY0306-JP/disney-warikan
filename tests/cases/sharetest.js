const {launch}=require('../lib');
const MOCK=`
window.__row={id:'t1',name:'テスト旅行',data_json:null};
function mkQuery(){
  const st={op:'select',filters:[],payload:null,cols:null};
  const run=()=>{
    const row=window.__row;
    const get=(path)=>{ if(path==='id')return row.id; const m=path.match(/^data_json->>?(\\w+)$/); if(m){const v=row.data_json?row.data_json[m[1]]:undefined; return path.includes('->>')?(v==null?null:String(v)):(v===undefined?null:v);} return row[path]; };
    const ok=st.filters.every(([k,col,val])=>k==='eq'?get(col)===val:get(col)===null);
    if(st.op==='update'){ if(!ok)return {data:[],error:null}; Object.assign(row,JSON.parse(JSON.stringify(st.payload))); window.__writes=(window.__writes||0)+1; return {data:[JSON.parse(JSON.stringify(row))],error:null}; }
    if(!ok)return {data:null,error:{message:'not found'}};
    if(st.cols==='rev:data_json->rev')return {data:{rev:row.data_json?.rev??null},error:null};
    if(st.list)return {data:[{id:row.id,name:row.name}],error:null};
    return {data:JSON.parse(JSON.stringify(row)),error:null};
  };
  const q={
    select(c){ if(st.op!=='update')st.cols=c; return q; },
    update(p){st.op='update';st.payload=p;return q;},
    eq(c,v){st.filters.push(['eq',c,v]);return q;},
    is(c,v){st.filters.push(['is',c,v]);return q;},
    order(){st.list=true;return q;},
    single(){const r=run();if(Array.isArray(r.data))r.data=r.data[0]||null;return Promise.resolve(r);},
    then(res,rej){return Promise.resolve(run()).then(res,rej);},
  };
  return q;
}
window.__mockSb={from:()=>mkQuery()};
`;
(async()=>{
  const b=await launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
  const p=await ctx.newPage();
  p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
  await p.goto('file://'+process.argv[2]+'?join=ab12-cd34',{waitUntil:'load'});
  await p.addScriptTag({content:MOCK});
  console.log('url after capture:',await p.evaluate(()=>location.search||'(none)'),'pending:',await p.evaluate(()=>localStorage.getItem('pendingJoin')),'note visible:',await p.evaluate(()=>document.getElementById('inviteNote').style.display));
  await p.screenshot({path:process.argv[3]+'/sh-login.png'});
  const out=await p.evaluate(async()=>{
    const r=[];const ok=(n,c)=>r.push((c?'PASS ':'FAIL ')+n);
    __row.data_json={members:['ゆき','たろう','はな'],expenses:[
      {id:'e1',name:'チケット',amount:30000,currency:'JPY',category:'その他',date:'2026-10-05',paidBy:0,participants:[0,1,2]},
      {id:'e2',name:'夕食',amount:60000,currency:'KRW',category:'その他',date:'2026-10-05',paidBy:1,participants:[0,1,2]}],rev:1};
    __row.share_code=null;
    let joined=null;
    __mockSb.rpc=async(fn,args)=>{joined=args.p_share_code;return {data:{id:'t1',name:'テスト旅行'},error:null};};
    sb=__mockSb;currentUser={email:'a@x'};
    await showLoggedIn();
    ok('joined with code from link: '+joined,joined==='AB12CD34');
    ok('pending cleared',!localStorage.getItem('pendingJoin'));
    closeInfoPopup();
    // 自分の精算額
    ok('me bar default',document.getElementById('meText').textContent.includes('自分を選ぶ'));
    const pr=chooseMe();
    document.querySelectorAll('#dlgChoices button')[0].click();await pr;
    const t=document.getElementById('meText').textContent;
    ok('me bar: '+t,t.includes('ゆき')&&t.includes('¥20,000 受け取る')&&t.includes('₩20,000 払う'));
    // 共有コード作成 → コピー
    window.isSecureContextOverride=true;
    let copied=null;Object.defineProperty(navigator,'clipboard',{value:{writeText:async x=>{copied=x;}},configurable:true});
    await copyInviteLink();
    ok('share code saved on server: '+__row.share_code,!!__row.share_code);
    ok('invite link copied or shown: '+(copied||document.getElementById('infoMsg').textContent),(copied||document.getElementById('infoMsg').textContent).includes('?join='+__row.share_code));
    closeInfoPopup();
    ok('code displayed',document.querySelector('#shareCodeArea .code')?.textContent===__row.share_code);
    // 旅行名変更ダイアログ
    trips=[{id:'t1',name:'テスト旅行'}];
    const rp=renameCurrentTripPrompt();
    await new Promise(r=>setTimeout(r,80));
    ok('rename dialog open with value',document.getElementById('dlgOverlay').classList.contains('active')&&document.getElementById('dlgInput').value==='テスト旅行');
    document.getElementById('dlgInput').value='ソウル旅行';document.getElementById('dlgOk').click();await rp;
    ok('renamed on server: '+__row.name,__row.name==='ソウル旅行');
    // キャンセルで何も起きない
    const cp=createTripPrompt();await new Promise(r=>setTimeout(r,50));document.getElementById('dlgCancel').click();await cp;
    ok('cancel closes dialog',!document.getElementById('dlgOverlay').classList.contains('active'));
    return r;
  });
  console.log(out.join('\n'));
  await p.evaluate(()=>{showTab('settings');});await p.screenshot({path:process.argv[3]+'/sh-settings.png'});
  await p.evaluate(()=>{showTab('add');});await p.screenshot({path:process.argv[3]+'/sh-add.png'});
  await p.evaluate(()=>{chooseMe();});await p.waitForTimeout(100);await p.screenshot({path:process.argv[3]+'/sh-choose.png'});
  await b.close();
})();
