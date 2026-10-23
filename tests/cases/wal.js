const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(2500);
const D=process.argv[3];
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);const t=ms=>new Promise(r=>setTimeout(r,ms||80));
  localStorage.clear();document.getElementById('authShell').style.display='none';currentTripId='t1';trips=[{id:'t1',name:'ソウル'}];
  applyDataObject({members:['みゆ','あやか','みさき']});localStorage.setItem('warikanMe_t1','みゆ');initAppViews();
  showTab('settings');
  ok('wallet off intro',document.getElementById('walletBody').textContent.includes('共有財布を使う'));
  setWalletOn(true);
  // 前回の残り ₩90,000 を全員で均等
  document.getElementById('walBy').value='all';document.getElementById('walCur').value='KRW';document.getElementById('walAmt').value='90000';document.getElementById('walNote').value='前回の残り';addWalletIn();
  ok('ins equal',wallet.ins.length===3&&wallet.ins.every(x=>x.amount===30000&&x.currency==='KRW'&&x.note==='前回の残り'));
  // みゆが ₩50,000 追加
  document.getElementById('walBy').value='0';document.getElementById('walAmt').value='50000';document.getElementById('walNote').value='';addWalletIn();
  ok('balance 140000',walletBalance().KRW===140000&&document.querySelector('.wal-bal b').textContent.includes('140,000'));
  // 財布から払う
  showTab('add');
  ok('wallet chip',!!document.querySelector('#paidByChips .chip-wallet'));
  document.getElementById('expenseName').value='屋台';document.getElementById('expenseAmount').value='60000';setCurrency('KRW');setPaidBy('W');submitExpense();
  ok('expense wallet',expenses[0].wallet===true);
  // カードで みさき が ¥9,000（全員）
  document.getElementById('expenseName').value='ホテル';document.getElementById('expenseAmount').value='9000';setCurrency('JPY');setPaidBy(2);submitExpense();
  ok('balance after',walletBalance().KRW===80000);
  const tx=getSettlementTx().map(x=>`${pname(x.from)}>${pname(x.to)}:${x.code}${Math.round(x.amount)}`);
  ok('settle '+tx.join(' '),tx.includes('共有財布>みゆ:KRW60000')&&tx.includes('共有財布>あやか:KRW10000')&&tx.includes('共有財布>みさき:KRW10000')&&tx.some(x=>x.startsWith('みゆ>みさき:JPY3000'))&&tx.some(x=>x.startsWith('あやか>みさき:JPY3000')));
  setSettlementMode('min');
  const kr=getSettlementTx().filter(x=>x.code==='KRW').reduce((s,x)=>s+(isWallet(x.from)?x.amount:0),0);
  ok('min: wallet pays out 80000',Math.round(kr)===80000);
  setSettlementMode('direct');showTab('settle');
  ok('wallet rows rendered',document.querySelector('.settlement-item .av-wallet')&&document.querySelector('.wal-note'));
  // 済にする（W キー）
  const wt=getSettlementTx().find(x=>isWallet(x.from));toggleSettled(settleKey(wt),wt.amount,null,false);
  ok('settled W key '+Object.keys(settled)[0],/^W>\d>KRW$/.test(Object.keys(settled)[0])&&getSettlementTx().find(x=>x.paid&&isWallet(x.from)));
  // メンバーを足しても W はずれない
  members.push('ゆい');updateMemberSelects();updateDisplay();
  ok('W stays after member add',getSettlementTx().some(x=>x.paid&&isWallet(x.from)));
  members.pop();updateMemberSelects();updateDisplay();
  // 正規化・同期
  const v=toSyncView(getDataObject());ok('sync view wallet',v.wallet.on&&v.wallet.ins.length===4&&v.expenses[0].wallet===true&&Object.keys(v.settled)[0].startsWith('W>'));
  const base=toSyncView(getDataObject()),loc=JSON.parse(JSON.stringify(base)),srv=JSON.parse(JSON.stringify(base));
  loc.wallet.ins.push({id:'wa',by:1,amount:1000,currency:'KRW',note:'',date:''});srv.wallet.ins.push({id:'wb',by:2,amount:2000,currency:'KRW',note:'',date:''});
  const mg=mergeSync(base,loc,srv);ok('merge ins both',mg.wallet.ins.some(x=>x.id==='wa')&&mg.wallet.ins.some(x=>x.id==='wb'));
  // 持ち越し
  settled={};updateDisplay();
  const pc=carryOver();await t();document.getElementById('confirmOkBtn').click();await pc;
  ok('carry recorded '+JSON.stringify(wallet.carry),wallet.carry.length===3&&wallet.carry.find(c=>c.name==='みゆ').amount===60000&&getSettlementTx().filter(x=>isWallet(x.from)).every(x=>x.paid));
  // 先に精算ボタンは財布払いでは出ない
  showTab('add');startEditExpense(0);ok('no presettle for wallet',document.getElementById('presettleBtn').style.display==='none'&&document.getElementById('paidBy').value==='W');clearExpenseForm();
  // 一覧
  showTab('list');ok('list chip',document.querySelector('.expense-meta-chip.wal')?.textContent.includes('共有財布 から'));
  // 削除できないメンバー
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{showTab('settings');openSetSheet('wallet');});await p.waitForTimeout(400);await p.screenshot({path:D+'/wal-card.png',timeout:90000});
await p.evaluate(()=>{settled={};updateDisplay();showTab('settle');document.querySelector('.container').scrollTop=0;});await p.waitForTimeout(400);await p.screenshot({path:D+'/wal-settle.png',fullPage:false});
await p.evaluate(()=>{showTab('add');setPaidBy('W');document.querySelector('.container').scrollTop=300;});await p.waitForTimeout(300);await p.screenshot({path:D+'/wal-add.png'});
await b.close();})();
