// テスト共通: Chromium の起動
// - playwright はこのリポジトリの node_modules、なければグローバルのものを使う
// - HTTPS_PROXY があればプロキシ経由（Claude の作業環境用）
// - 本番の Supabase には通信しない（テストのデータが本番に行かないように）
const path=require('path');
function loadPlaywright(){
  try{return require('playwright');}catch(e){}
  const g=require('child_process').execSync('npm root -g').toString().trim();
  return require(path.join(g,'playwright'));
}
const {chromium}=loadPlaywright();
const blockBackend=t=>t.route(/supabase\.co/,r=>r.abort());
async function launch(opts={}){
  const o={};
  if(process.env.HTTPS_PROXY&&!opts.noProxy)o.proxy={server:process.env.HTTPS_PROXY};
  if(opts.noProxy)o.args=['--no-proxy-server'];
  if(process.env.CHROMIUM_PATH)o.executablePath=process.env.CHROMIUM_PATH;
  const b=await chromium.launch(o);
  const newPage=b.newPage.bind(b),newContext=b.newContext.bind(b);
  b.newPage=async(...a)=>{const p=await newPage(...a);await blockBackend(p);return p;};
  b.newContext=async(...a)=>{const c=await newContext(...a);await blockBackend(c);return c;};
  return b;
}
module.exports={launch,chromium};
