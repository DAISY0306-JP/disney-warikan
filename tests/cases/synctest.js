const {launch}=require('../lib');
const MOCK=`
window.__row={id:'t1',name:'テスト旅行',data_json:null};
function mkQuery(){
  const st={op:'select',filters:[],payload:null,cols:null};
  const run=()=>{
    const row=window.__row;
    const get=(path)=>{ if(path==='id')return row.id; const m=path.match(/^data_json->>?(\\w+)$/); if(m){const v=row.data_json?row.data_json[m[1]]:undefined; return path.includes('->>')?(v==null?null:String(v)):(v===undefined?null:v);} return row[path]; };
    const ok=st.filters.every(([k,col,val])=>k==='eq'?get(col)===val:get(col)===null);
    if(st.op==='update'){ if(!ok)return {data:[],error:null}; Object.assign(row,JSON.parse(JSON.stringify(st.payload))); window.__writes=(window.__writes||0)+1; return {data:[{id:row.id}],error:null}; }
    if(!ok)return {data:null,error:{message:'not found'}};
    if(st.cols==='rev:data_json->rev')return {data:{rev:row.data_json?.rev??null},error:null};
    return {data:JSON.parse(JSON.stringify(row)),error:null};
  };
  const q={
    select(c){ if(st.op!=='update')st.cols=c; return q; },
    update(p){st.op='update';st.payload=p;return q;},
    eq(c,v){st.filters.push(['eq',c,v]);return q;},
    is(c,v){st.filters.push(['is',c,v]);return q;},
    order(){return q;},
    single(){return Promise.resolve(run());},
    then(res,rej){return Promise.resolve(run()).then(res,rej);},
  };
  return q;
}
window.__mockSb={from:()=>mkQuery()};
`;
(async()=>{
  const b=await launch();
  const p=await b.newPage({viewport:{width:390,height:844}});
  p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
  await p.goto('file://'+process.argv[2],{waitUntil:'load'});
  await p.addScriptTag({content:MOCK});
  const log=await p.evaluate(async()=>{
    const out=[];const ok=(name,cond)=>out.push((cond?'PASS ':'FAIL ')+name);
    // 古い形式のデータ（rev / id / date なし）
    __row.data_json={members:['A','B','C'],expenses:[
      {name:'old1',amount:3000,currency:'JPY',category:'その他',paidBy:0,participants:[0,1,2],timestamp:'2026-10-01T03:00:00.000Z'},
      {name:'old2',amount:900,currency:'JPY',category:'その他',paidBy:1,participants:[0,1,2],timestamp:'2026-10-02T03:00:00.000Z'}],exchangeRate:150};
    sb=__mockSb;currentUser={email:'a@x'};
    document.getElementById('authShell').style.display='none';
    await selectTrip('t1');
    ok('legacy load has ids & dates',expenses.every(e=>e.id&&e.date)&&expenses[0].date==='2026-10-01');
    ok('legacy rev is null',_syncRev===null);

    // 自分: old2 を削除 + new-local 追加。その前に他の人が new-remote を追加して保存済み
    const other=JSON.parse(JSON.stringify(__row.data_json));
    other.expenses.push({id:'eremote1',name:'new-remote',amount:500,currency:'KRW',category:'その他',date:'2026-10-03',paidBy:2,participants:[1,2]});
    other.rev=1;__row.data_json=other;
    expenses.splice(1,1);
    document.getElementById('expenseName').value='new-local';document.getElementById('expenseAmount').value='1200';document.getElementById('paidBy').value='0';
    addExpense();
    await saveTripDataNow(false);
    const names=__row.data_json.expenses.map(e=>e.name).sort().join(',');
    ok('merge keeps remote add, local add, local delete -> '+names,names==='new-local,new-remote,old1');
    ok('server rev bumped to 2',__row.data_json.rev===2);
    ok('local view matches server',sameJSON(toSyncView(getDataObject()),toSyncView(__row.data_json)));

    // 他の人が金額を変更 → ポーリングで取り込み
    const o2=JSON.parse(JSON.stringify(__row.data_json));
    o2.expenses.find(e=>e.name==='old1').amount=6000;o2.rev=3;__row.data_json=o2;
    document.activeElement&&document.activeElement.blur();
    await pollRemote();
    ok('poll pulled remote edit',expenses.find(e=>e.name==='old1').amount===6000);

    // 同じ支払いを両方が編集 → 自分の版が勝つ / 他の項目は相手の版
    const o3=JSON.parse(JSON.stringify(__row.data_json));
    o3.expenses.find(e=>e.name==='new-remote').amount=999;o3.exchangeRate=140;o3.rev=4;__row.data_json=o3;
    const idx=expenses.findIndex(e=>e.name==='old1');startEditExpense(idx);
    document.getElementById('expenseAmount').value='7000';updateExpense();
    await saveTripDataNow(false);
    const srv=__row.data_json;
    ok('own edit kept',srv.expenses.find(e=>e.name==='old1').amount===7000);
    ok('remote edit of other item kept',srv.expenses.find(e=>e.name==='new-remote').amount===999);
    ok('remote rate change kept',srv.exchangeRate===140&&exchangeRate===140);

    // ② メンバー削除ブロック
    updateMemberList();
    await removeMember(1);
    ok('member with expenses not removed',members.length===3&&document.getElementById('infoOverlay').classList.contains('active'));
    closeInfoPopup();

    // ③ レート取得（fetch をモック）
    const realFetch=window.fetch;
    window.fetch=async(url)=>({ok:true,json:async()=>({date:'2026-10-05',rates:{USD:0.0068,KRW:9.4}})});
    await fetchLatestRates();
    window.fetch=realFetch;
    ok('rates fetched '+exchangeRate+' / '+krwRate,exchangeRate===147.06&&krwRate===10.64);

    // ④ 日付表示
    showTab('list');setListMode('date');
    const labels=[...document.querySelectorAll('#expenseList .cat-group-label')].map(x=>x.textContent);
    ok('date groups newest first: '+labels.join(' | '),labels[0].startsWith(shortDay(todayStr()))||labels[0].startsWith('10/5'));
    return out;
  });
  console.log(log.join('\n'));
  await p.evaluate(()=>{showTab('list');});await p.screenshot({path:process.argv[3]+'/imp-list.png'});
  await p.evaluate(()=>{showTab('add');});await p.screenshot({path:process.argv[3]+'/imp-add.png'});
  await b.close();
})();
