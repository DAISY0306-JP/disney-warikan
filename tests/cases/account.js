const {launch}=require('../lib');
(async()=>{const b=await launch();
const p=await b.newPage({ignoreHTTPSErrors:true,viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>{if(!/supabase is not defined/.test(e.message))console.log('ERR',e.message)});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1500);
const tick=()=>new Promise(r=>setTimeout(r,60));
const r=await p.evaluate(async()=>{const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);const t=()=>new Promise(r=>setTimeout(r,60));
  const calls=[];
  sb={auth:{resetPasswordForEmail:async(e,o)=>{calls.push(['reset',e,o.redirectTo]);return{error:null};},updateUser:async(u)=>{calls.push(['update',u.password]);return{error:null};},signOut:async()=>{calls.push(['signout']);}},
      rpc:async(fn)=>{calls.push(['rpc',fn]);return{error:null};}};
  // パスワード再設定（ログイン画面）
  document.getElementById('authEmail').value='a@x.jp';await sendPasswordReset();
  ok('reset mail sent with redirect',calls[0][0]==='reset'&&calls[0][1]==='a@x.jp'&&calls[0][2].endsWith('index.html'));
  closeInfoPopup();
  // パスワード変更: 短すぎる
  currentUser={email:'a@x.jp'};
  let pr=changePassword();await t();document.getElementById('dlgInput').value='123';document.getElementById('dlgOk').click();await pr;
  ok('short password rejected',!calls.some(c=>c[0]==='update')&&document.getElementById('infoOverlay').classList.contains('active'));
  closeInfoPopup();
  ok('password input type',document.getElementById('dlgInput').type==='password');
  pr=changePassword();await t();document.getElementById('dlgInput').value='newpass99';document.getElementById('dlgOk').click();await pr;
  ok('password updated',calls.some(c=>c[0]==='update'&&c[1]==='newpass99'));
  // アカウント削除: 入力が違うと削除しない
  pr=deleteMyAccount();await t();document.getElementById('confirmOkBtn').click();await t();document.getElementById('dlgInput').value='けす';document.getElementById('dlgOk').click();await pr;
  ok('wrong word cancels',!calls.some(c=>c[0]==='rpc'));
  document.getElementById('authShell').style.display='none';document.getElementById('appShell').style.display='block';
  pr=deleteMyAccount();await t();document.getElementById('confirmOkBtn').click();await t();document.getElementById('dlgInput').value='削除';document.getElementById('dlgOk').click();await pr;
  ok('account deleted & signed out',calls.some(c=>c[0]==='rpc'&&c[1]==='delete_my_account')&&calls.some(c=>c[0]==='signout')&&currentUser===null&&document.getElementById('authShell').style.display==='block');
  // RPC がない場合
  sb.rpc=async()=>({error:{message:'Could not find the function public.delete_my_account'}});currentUser={email:'a@x.jp'};
  pr=deleteMyAccount();await t();document.getElementById('confirmOkBtn').click();await t();document.getElementById('dlgInput').value='削除';document.getElementById('dlgOk').click();await pr;
  ok('missing rpc message',document.getElementById('infoMsg').textContent.includes('準備'));
  closeInfoPopup();
  return o;});
console.log(r.join('\n'));
await p.evaluate(()=>{document.getElementById('authShell').style.display='block';document.getElementById('appShell').style.display='none';document.getElementById('authMsg').textContent='ログインしてください。';});
await p.waitForTimeout(300);await p.screenshot({path:process.argv[3]+'/acc-login.png'});
await p.evaluate(()=>{document.getElementById('authShell').style.display='none';applyDataObject({members:['みゆ','あやか'],expenses:[]});currentUser={email:'rxp@example.com'};initAppViews();document.getElementById('accountEmail').textContent='rxp@example.com';showTab('settings');openSetSheet('account');const c=document.querySelector('.container');c.scrollTop=document.getElementById('setStore').parentElement.getBoundingClientRect().top-200;});
await p.waitForTimeout(300);await p.screenshot({path:process.argv[3]+'/acc-settings.png'});
await p.evaluate(()=>openPolicy());await p.waitForTimeout(400);await p.screenshot({path:process.argv[3]+'/acc-policy.png'});
await b.close();})();
