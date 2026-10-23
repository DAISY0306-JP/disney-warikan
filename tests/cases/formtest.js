const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({viewport:{width:430,height:740},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(300);
// 1) メンバー未登録
await p.evaluate(()=>{document.getElementById('authShell').style.display='none';members=[''];expenses=[];initAppViews();showTab('add');});
console.log((await p.evaluate(()=>document.getElementById('setupHint').classList.contains('show')))?'PASS setup hint shown':'FAIL setup hint');
await p.screenshot({path:process.argv[3]+'/f-empty.png'});
await p.evaluate(()=>goToMemberSetup());
console.log((await p.evaluate(()=>document.querySelector('.tab-panel.active').dataset.tab==='settings'&&document.getElementById('memberEdit').style.display!=='none'))?'PASS go to member setup':'FAIL member setup');
// 2) メンバーあり
const r=await p.evaluate(async()=>{
  const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
  members=['あやか','みさき','みゆ','みかこ'];expenses=[];localStorage.setItem('warikanMe_local','みさき');
  updateMemberSelects();updateMemberDisplay();initAppViews();showTab('add');
  ok('payer defaults to me',document.getElementById('paidBy').value==='1'&&document.querySelectorAll('#paidByChips .chip.active').length===1);
  // 空で追加 → 項目名が赤
  document.getElementById('paidBy').value='';refreshFormHelpers();
  submitExpense();
  ok('empty name highlighted',document.getElementById('expenseName').classList.contains('invalid'));
  document.getElementById('expenseName').value='ランチ';document.getElementById('expenseName').dispatchEvent(new Event('input'));
  ok('typing clears highlight',!document.getElementById('expenseName').classList.contains('invalid'));
  document.getElementById('expenseAmount').value='4000';document.getElementById('expenseAmount').dispatchEvent(new Event('input'));
  ok('preview: '+document.getElementById('splitPreview').textContent,document.getElementById('splitPreview').textContent.includes('4人で割り勘')&&document.getElementById('splitPreview').textContent.includes('¥1,000'));
  submitExpense();
  ok('missing payer highlighted',document.getElementById('paidByChips').classList.contains('invalid'));
  document.querySelectorAll('#paidByChips .chip')[2].click();
  ok('chip selects payer',document.getElementById('paidBy').value==='2'&&!document.getElementById('paidByChips').classList.contains('invalid'));
  toggleAllParticipants();
  ok('toggle all off',document.getElementById('toggleAllBtn').textContent==='全員を選択'&&document.getElementById('splitPreview').textContent.includes('選んで'));
  document.getElementById('participant0').click();document.getElementById('participant2').click();
  ok('2 people preview',document.getElementById('splitPreview').textContent.includes('2人')&&document.getElementById('splitPreview').textContent.includes('¥2,000'));
  submitExpense();
  ok('added',expenses.length===1&&expenses[0].paidBy===2&&expenses[0].participants.join()==='0,2');
  ok('form reset: payer back to me, all on',document.getElementById('paidBy').value==='1'&&members.every((_,i)=>document.getElementById('participant'+i).checked));
  setCurrency('USD');document.getElementById('expenseAmount').value='40';refreshFormHelpers();
  ok('usd preview: '+document.getElementById('splitPreview').textContent,document.getElementById('splitPreview').textContent.includes('$10.00'));
  // 一覧のカードをタップで編集
  showTab('list');document.querySelector('#expenseList .expense-body').click();
  ok('tap card edits',editingExpenseIdx===0&&document.querySelector('.tab-panel.active').dataset.tab==='add'&&document.getElementById('paidBy').value==='2'&&!document.getElementById('participant1').checked);
  cancelEditExpense();
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{document.getElementById('expenseName').value='ランチ';document.getElementById('expenseAmount').value='4000';setCurrency('JPY');refreshFormHelpers();});
console.log('classes',await p.evaluate(()=>[document.getElementById('expenseName').className,document.getElementById('expenseAmount').className,getComputedStyle(document.getElementById('expenseName')).borderColor]));console.log('btn bottom',await p.evaluate(()=>Math.round(document.getElementById('expenseSubmitBtn').getBoundingClientRect().bottom)),'tabbar top',await p.evaluate(()=>Math.round(document.getElementById('footerBar').getBoundingClientRect().top)));
await p.screenshot({path:process.argv[3]+'/f-add.png'});
await b.close();})();
