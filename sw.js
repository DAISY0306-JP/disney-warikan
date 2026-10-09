/* WARITABI の Service Worker
 * 電波がない場所でもアプリを開けるよう、画面と部品をこの端末に保存しておく。
 * - 画面（index.html）：まずネットから取り、取れなければ保存しておいたもの
 * - 部品（ライブラリ・アイコン・フォント）：保存しておいたものを使い、裏で新しいものに入れ替える
 * - Supabase のデータ（API）は保存しない（アプリ側で同期する）
 */
const CACHE='waritabi-v1';
const CORE=['./','./index.html','./vendor/qrcode.js','./apple-touch-icon-v2.png','./app-icon-512-v2.png'];
const LIB=['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'];

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    await c.addAll(CORE).catch(()=>{});
    await Promise.all(LIB.map(u=>fetch(u,{mode:'no-cors'}).then(r=>c.put(u,r)).catch(()=>{})));
    self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.hostname.endsWith('supabase.co')||url.hostname.includes('frankfurter')||url.hostname.includes('exchangerate'))return; // データ・レートは保存しない
  // 画面：ネット優先
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const r=await fetch(req);
        if(r&&r.ok){const c=await caches.open(CACHE);c.put('./index.html',r.clone());}
        return r;
      }catch(_){
        return (await caches.match('./index.html'))||(await caches.match('./'))||Response.error();
      }
    })());
    return;
  }
  // 部品：保存したものを先に使い、裏で更新
  const same=url.origin===self.location.origin;
  const lib=/cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.hostname);
  if(!same&&!lib)return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await c.match(req);
    const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r;}).catch(()=>null);
    return hit||(await net)||Response.error();
  })());
});
