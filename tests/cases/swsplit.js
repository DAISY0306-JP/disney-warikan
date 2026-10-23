// 分割後: http で開いて SW を登録 → オフラインで再読み込みしても見た目と動きが出るか
const {launch}=require('../lib');
const {spawn}=require('child_process');
(async()=>{
const srv=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{cwd:require('path').dirname(process.argv[2]),stdio:'ignore'});
await new Promise(r=>setTimeout(r,1500));
const b=await launch({noProxy:true});
const ctx=await b.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844}});
const p=await ctx.newPage();const errs=[];
p.on('pageerror',e=>{if(!/supabase/.test(e.message))errs.push(e.message)});
const o=[];const ok=(n,c)=>o.push((c?'PASS ':'FAIL ')+n);
await p.goto('http://127.0.0.1:8765/index.html');await p.waitForTimeout(2500);
ok('functions global',await p.evaluate(()=>typeof showTab==='function'&&typeof openReview==='function'));
ok('css applied',await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--p').trim()!==''));
await p.evaluate(async()=>{await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;});
await p.waitForTimeout(1500);
const keys=await p.evaluate(async()=>{const c=await caches.open('waritabi-v3');return (await c.keys()).map(k=>new URL(k.url).pathname+new URL(k.url).search);});
ok('precached '+keys.join(' '),keys.some(k=>/app\.js\?v=/.test(k))&&keys.some(k=>/style\.css\?v=/.test(k))&&keys.some(k=>/dark\.css\?v=/.test(k)));
srv.kill();await ctx.setOffline(true);
await p.reload();await p.waitForTimeout(2500);
ok('offline functions',await p.evaluate(()=>typeof showTab==='function'));
ok('offline css',await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--p').trim()!==''));
ok('no errors '+errs.join('|'),!errs.length);
console.log(o.join('\n'));await b.close();process.exit(0);})();
