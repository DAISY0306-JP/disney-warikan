/* ===== 定数 ===== */
const MAX_MEMBERS=10,MAX_EXPENSES=100,MAX_DEPOSITS=100,MAX_FILE_SIZE=1024*1024,MAX_STRING_LEN=200;

/* ===== 状態 ===== */
let members=[],expenses=[],deposits=[];
// 共有財布 { on: 使うか, ins: [{id, by: 入れた人, amount, currency, note, date}], carry: [{name, currency, amount}] }
let wallet={on:false,ins:[],carry:[]};
let currentCurrency='JPY',currentDepositCurrency='JPY';
let settled={};
let catIcons={};
let tripMeta={from:'HND',to:'',start:'',end:''}; // 出発地・行き先（空港コード）と日程
let completedAt=''; // 全員の精算が終わった日 // カテゴリごとに選んだアイコン { カテゴリ名: アイコン名 } // 精算済みの送金: { 'from>to>通貨': 済にしたときの金額 }
let exchangeRate=150,krwRate=11,settlementMode='direct'; // exchangeRate: $1あたりの円 / krwRate: ₩100あたりの円
const CURRENCIES=[
  {code:'JPY',label:'円',sym:'¥',dec:0},
  {code:'USD',label:'ドル',sym:'$',dec:2},
  {code:'KRW',label:'ウォン',sym:'₩',dec:0},
];
const CUR=Object.fromEntries(CURRENCIES.map(c=>[c.code,c]));
const normCurrency=c=>CUR[c]?c:'JPY';
let editingExpenseIdx=-1,editingDepositIdx=-1;
const DEFAULT_TRIP_NAME='NEW_TRIP';
const FALLBACK_CAT='その他';
const DEFAULT_CATEGORIES=['🍽 食事','🚃 交通','🏨 宿泊','🎟 チケット','🛍 買い物',FALLBACK_CAT];
let currentCategory=FALLBACK_CAT;
// カテゴリ一覧を整える（「その他」だけの古い旅行には定番カテゴリを足す）
// コーラルレッドに合わせた、くっきりしたカテゴリ色 [背景, 文字]
const CAT_COLORS=[
  ['食事','#fff1e6','#f26b0f'],['交通','#e9f1ff','#2f6fed'],['宿泊','#e4f7ef','#109a63'],
  ['チケット','#ffe9f2','#f0397f'],['買い物','#fff6d6','#c98a00'],['その他','#f1f2f5','#5f6675'],
];
const CAT_PALETTE=[['#f1ebff','#7c4dff'],['#e3f8f8','#00a3a3'],['#fff0e8','#e8590c'],['#eef8e3','#5a9e1b'],['#fdeaf7','#c2259e']];
function catColor(cat){
  const hit=CAT_COLORS.find(([k])=>String(cat).includes(k));
  if(hit)return{bg:hit[1],fg:hit[2]};
  let h=0;for(const ch of String(cat))h=(h*31+ch.charCodeAt(0))>>>0;
  const [bg,fg]=CAT_PALETTE[h%CAT_PALETTE.length];return{bg,fg};
}
const catStyle=cat=>{const c=catColor(cat);return`--cb:${c.bg};--cf:${c.fg}`;};
// カテゴリのアイコン（絵文字の代わりに、アプリと同じ線のアイコン。色はカテゴリの色）
const CAT_ICON_PATHS={
  meal:'<path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 0-3.5 2.5-3.5 6s1.5 4 3.5 4"/>',
  train:'<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l2-4M15 21l-2-4"/><path d="M9 14h.01M15 14h.01" stroke-width="2.6"/>',
  bed:'<path d="M3 18V7M21 18v-5a3 3 0 0 0-3-3h-8v6M3 15h18"/><circle cx="7" cy="12" r="1.8"/>',
  ticket:'<path d="M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
  bag:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  plane:'<path d="M12 2.5c.9 0 1.5 1 1.5 2.2V9l7.5 4.5v2L13.5 13v4.6l2.3 1.8V21L12 20l-3.8 1v-1.6l2.3-1.8V13L3 15.5v-2L10.5 9V4.7c0-1.2.6-2.2 1.5-2.2z"/>',
  cafe:'<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3"/>',
  gift:'<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9c-1.5-3-5-3.5-5-1.2C7 9 12 9 12 9s5 0 5-1.2C17 5.5 13.5 6 12 9"/>',
  car:'<path d="M5 16V11l2-5h10l2 5v5M5 16h14M5 16v2M19 16v2M3 11h18"/><path d="M8 13.5h.01M16 13.5h.01" stroke-width="2.6"/>',
  park:'<path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.3L12 15.5 7.1 18l.9-5.3-4-3.9 5.5-.8z"/>',
  other:'<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><path d="M7.5 7.5h.01" stroke-width="2.8"/>',
  bus:'<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M7 21v-3M17 21v-3"/><path d="M8 14.5h.01M16 14.5h.01" stroke-width="2.6"/>',
  ship:'<path d="M3 15l2 5h14l2-5-9-3z"/><path d="M6 13V8h12v5M12 8V4"/>',
  bike:'<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8h-2M12 16l3-8"/>',
  pin:'<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
  camera:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.5-3h5L16 7"/><circle cx="12" cy="13.5" r="3.5"/>',
  drink:'<path d="M6 3h12l-1.5 7a4.5 4.5 0 0 1-9 0z"/><path d="M12 14.5V20M8.5 20h7"/>',
  sweets:'<path d="M8 11l4 10 4-10"/><path d="M7 11a5 5 0 0 1 10 0z"/>',
  onsen:'<path d="M4 15c0 3.3 3.6 5 8 5s8-1.7 8-5"/><path d="M4 15h16"/><path d="M8.5 11c-1-1.5 1-2.5 0-4M12 11c-1-1.5 1-2.5 0-4M15.5 11c-1-1.5 1-2.5 0-4"/>',
  mountain:'<path d="M2 20l7-12 4 6 3-4 6 10z"/><path d="M7.5 10.5l1.5 1.5 1.5-1.5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  umbrella:'<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 0 4 0M12 3V2"/>',
  medical:'<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M9 6V4h6v2M12 10v6M9 13h6"/>',
  wifi:'<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><path d="M12 19.5h.01" stroke-width="3"/>',
  cart:'<path d="M3 4h2.5l2.2 11h10.3l2-8H6.5"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
  shirt:'<path d="M8 3l-5 3 2 4 3-1.5V21h8V8.5l3 1.5 2-4-5-3a4 4 0 0 1-8 0z"/>',
  cosme:'<rect x="8" y="12" width="8" height="9" rx="1.5"/><path d="M9.5 12V7l5-3v8"/>',
  music:'<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M8.5 7.5l3.5 5 3.5-5M12 12.5V17M9 12.5h6M9 15h6"/>',
};
// 選べるアイコンの並び（30個）
const CAT_ICON_KEYS=['meal','cafe','drink','sweets','bag','cart','gift','shirt','cosme',
  'plane','train','bus','car','ship','bike','bed','onsen','ticket','park','music','camera','pin',
  'mountain','sun','umbrella','medical','wifi','coin','tag','other'];
const CAT_ICON_RULES=[
  [/食|ランチ|ディナー|朝ご|昼ご|夕ご|ご飯|ごはん|レストラン|飲/,'meal'],[/航空|飛行|フライト|空港/,'plane'],
  [/交通|電車|鉄道|バス|地下鉄|タクシー|移動/,'train'],[/レンタカー|車|ガソリン|駐車|高速/,'car'],
  [/宿|ホテル|旅館|民泊|泊/,'bed'],[/チケット|入場|パス|ツアー/,'ticket'],[/パーク|遊園|テーマ|アトラクション/,'park'],
  [/カフェ|コーヒー|お茶|スイーツ/,'cafe'],[/お土産|土産|ギフト|プレゼント/,'gift'],[/買い物|ショッピング|服|雑貨/,'bag'],[/その他/,'other'],
];
// 先頭の絵文字を外した表示名
const catText=cat=>String(cat).replace(/^[\p{Extended_Pictographic}️‍\s]+/u,'').trim()||String(cat);
// カテゴリ名から自動で選ぶアイコン
function autoIconKey(cat){const hit=CAT_ICON_RULES.find(([re])=>re.test(catText(cat)));return hit?hit[1]:'tag';}
// 自分で選んだアイコン（catIcons）があればそれ、なければ自動
const catIconKey=cat=>{const k=(typeof catIcons==='object'&&catIcons)?catIcons[cat]:null;return CAT_ICON_PATHS[k]?k:autoIconKey(cat);};
const iconSvgByKey=k=>`<svg class="ci" viewBox="0 0 24 24" aria-hidden="true">${CAT_ICON_PATHS[k]||CAT_ICON_PATHS.tag}</svg>`;
function catIconSvg(cat){return iconSvgByKey(catIconKey(cat));}
const catLabelHTML=cat=>`${catIconSvg(cat)}${safe(catText(cat))}`;
/* ===== 旅の情報（空港・日程） ===== */
// [空港コード, 都市, 空港名, 国旗, タイムゾーン]（地域ごと）
const AIRPORT_GROUPS=[
  ['日本',[
    ['HND','東京','羽田','🇯🇵','Asia/Tokyo'],['NRT','東京','成田','🇯🇵','Asia/Tokyo'],
    ['KIX','大阪','関西','🇯🇵','Asia/Tokyo'],['ITM','大阪','伊丹','🇯🇵','Asia/Tokyo'],['NGO','名古屋','中部','🇯🇵','Asia/Tokyo'],
    ['FUK','福岡','福岡','🇯🇵','Asia/Tokyo'],['CTS','札幌','新千歳','🇯🇵','Asia/Tokyo'],['OKA','沖縄','那覇','🇯🇵','Asia/Tokyo']]],
  ['韓国・台湾・中国',[
    ['ICN','ソウル','仁川','🇰🇷','Asia/Seoul'],['GMP','ソウル','金浦','🇰🇷','Asia/Seoul'],['PUS','釜山','金海','🇰🇷','Asia/Seoul'],['CJU','済州','済州','🇰🇷','Asia/Seoul'],
    ['TPE','台北','桃園','🇹🇼','Asia/Taipei'],['TSA','台北','松山','🇹🇼','Asia/Taipei'],['KHH','高雄','高雄','🇹🇼','Asia/Taipei'],
    ['HKG','香港','香港','🇭🇰','Asia/Hong_Kong'],['MFM','マカオ','マカオ','🇲🇴','Asia/Macau'],
    ['PVG','上海','浦東','🇨🇳','Asia/Shanghai'],['SHA','上海','虹橋','🇨🇳','Asia/Shanghai']]],
  ['東南アジア',[
    ['BKK','バンコク','スワンナプーム','🇹🇭','Asia/Bangkok'],['DMK','バンコク','ドンムアン','🇹🇭','Asia/Bangkok'],
    ['SGN','ホーチミン','タンソンニャット','🇻🇳','Asia/Ho_Chi_Minh'],['HAN','ハノイ','ノイバイ','🇻🇳','Asia/Ho_Chi_Minh'],['DAD','ダナン','ダナン','🇻🇳','Asia/Ho_Chi_Minh'],
    ['MNL','マニラ','ニノイ・アキノ','🇵🇭','Asia/Manila'],['CEB','セブ','マクタン・セブ','🇵🇭','Asia/Manila'],
    ['SIN','シンガポール','チャンギ','🇸🇬','Asia/Singapore'],['KUL','クアラルンプール','クアラルンプール','🇲🇾','Asia/Kuala_Lumpur'],
    ['DPS','バリ','ングラ・ライ','🇮🇩','Asia/Makassar']]],
  ['ハワイ・グアム',[
    ['HNL','ホノルル','ダニエル・K・イノウエ','🇺🇸','Pacific/Honolulu'],['GUM','グアム','グアム','🇺🇸','Pacific/Guam']]],
  ['アメリカ',[
    ['LAX','ロサンゼルス','ロサンゼルス','🇺🇸','America/Los_Angeles'],['SFO','サンフランシスコ','サンフランシスコ','🇺🇸','America/Los_Angeles'],
    ['LAS','ラスベガス','ハリー・リード','🇺🇸','America/Los_Angeles'],['SEA','シアトル','シアトル・タコマ','🇺🇸','America/Los_Angeles'],
    ['MCO','オーランド','オーランド','🇺🇸','America/New_York'],['JFK','ニューヨーク','JFK','🇺🇸','America/New_York'],['EWR','ニューヨーク','ニューアーク','🇺🇸','America/New_York']]],
  ['ヨーロッパ',[
    ['CDG','パリ','シャルル・ド・ゴール','🇫🇷','Europe/Paris'],['LHR','ロンドン','ヒースロー','🇬🇧','Europe/London'],
    ['FCO','ローマ','フィウミチーノ','🇮🇹','Europe/Rome'],['BCN','バルセロナ','エル・プラット','🇪🇸','Europe/Madrid'],
    ['FRA','フランクフルト','フランクフルト','🇩🇪','Europe/Berlin'],['HEL','ヘルシンキ','ヘルシンキ','🇫🇮','Europe/Helsinki']]],
  ['オセアニア',[
    ['SYD','シドニー','シドニー','🇦🇺','Australia/Sydney'],['OOL','ゴールドコースト','ゴールドコースト','🇦🇺','Australia/Brisbane']]],
];
const AIRPORTS=AIRPORT_GROUPS.flatMap(g=>g[1]);
const AIRPORT=Object.fromEntries(AIRPORTS.map(a=>[a[0],{code:a[0],city:a[1],name:a[2],flag:a[3]}]));
const AIRPORT_TZ=Object.fromEntries(AIRPORTS.map(a=>[a[0],a[4]]));
// 以前の都市コードは、代表の空港に読み替える
const LEGACY_AIRPORT={TYO:'HND',OSA:'KIX',SPK:'CTS',SEL:'ICN',NYC:'JFK',PAR:'CDG',LON:'LHR',ROM:'FCO'};
// そのタイムゾーンの UTC からのずれ（分）
function tzOffsetMin(tz,date=new Date()){
  try{
    const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
      .formatToParts(date).map(x=>[x.type,x.value]));
    const asUtc=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute);
    return Math.round((asUtc-Math.floor(date.getTime()/60000)*60000)/60000);
  }catch(e){return null;}
}
// 現地時刻と、日本との時差
function localTimeInfo(code,date=new Date()){
  const tz=AIRPORT_TZ[code];if(!tz)return null;
  const off=tzOffsetMin(tz,date),jst=tzOffsetMin('Asia/Tokyo',date);if(off==null||jst==null)return null;
  const time=new Intl.DateTimeFormat('ja-JP',{timeZone:tz,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date);
  const d=(off-jst)/60;
  const diff=d===0?'時差なし':`日本${d>0?'+':'−'}${Math.abs(d)%1?Math.abs(d).toFixed(1):Math.abs(d)}h`;
  return{time,diff,hours:d};
}
function renderPassClock(){
  const el=document.getElementById('passClock');if(!el)return;
  const t=AIRPORT[tripMeta.to];
  const info=t&&t.flag!=='🇯🇵'?localTimeInfo(t.code):null;
  const pass=document.getElementById('tripPass');
  if(!info){el.innerHTML='';if(pass)pass.classList.remove('has-clock');return;}
  el.innerHTML=`<span class="pc-time">${t.code} ${info.time}</span><span class="pc-diff">${info.diff}</span>`;
  if(pass)pass.classList.add('has-clock');
}
setInterval(()=>{renderPassClock();renderPassProgress();},30000);
// 7. 座席番号（旅行ごとに列が決まり、メンバーの順に A, B, C…）
const SEAT_LETTERS='ABCDEFGHJK';
function seatNo(i){
  let h=0;for(const ch of String(currentTripId||'trip'))h=(h*31+ch.charCodeAt(0))>>>0;
  return`${10+h%30+Math.floor(i/SEAT_LETTERS.length)}${SEAT_LETTERS[i%SEAT_LETTERS.length]}`;
}
const seatTag=i=>`<span class="seat-tag">${seatNo(i)}</span>`;
function normalizeTripMeta(m){
  m=(m&&typeof m==='object')?m:{};
  const has=(o,c)=>typeof c==='string'&&Object.prototype.hasOwnProperty.call(o,c);
  const code=c=>has(AIRPORT,c)?c:has(LEGACY_AIRPORT,c)?LEGACY_AIRPORT[c]:'';
  const out={from:code(m.from)||'HND',to:code(m.to),start:isDateStr(m.start)?m.start:'',end:isDateStr(m.end)?m.end:''};
  if(out.start&&out.end&&out.end<out.start)out.end=out.start;
  return out;
}
const shortDay=d=>{if(!isDateStr(d))return'';const[,m,dd]=d.split('-').map(Number);return`${m}/${dd}`;};
function flightNoOf(start,id){
  if(isDateStr(start)){const[,m,d]=start.split('-');return`WT ${m}${d}`;}
  let h=0;for(const ch of String(id||'trip'))h=(h*31+ch.charCodeAt(0))>>>0;return`WT ${String(100+h%900)}`;
}
const flightNo=meta=>flightNoOf(meta.start,currentTripId);
// 旅の状態（出発前・旅行中・帰国後・精算完了）
function tripPhase(meta,done,today=todayStr()){
  if(done)return{key:'done',en:'ARRIVED',ja:'精算完了'};
  if(!meta||!meta.start)return{key:'none',en:'',ja:'日程未定'};
  const end=meta.end||meta.start;
  if(today<meta.start)return{key:'checkin',en:'BOARDING',ja:'搭乗手続き中'};
  if(today<=end)return{key:'flight',en:'IN FLIGHT',ja:'飛行中'};
  return{key:'arrived',en:'ARRIVED',ja:'到着'};
}
// 1. 搭乗券の点線を、旅の進み具合にする
function renderPassProgress(now=new Date()){
  const el=document.getElementById('passPerf'),st=document.getElementById('pfStatus');if(!el||!st)return;
  if(!tripMeta.start){el.classList.remove('on');return;}
  const day=d=>new Date(d+'T00:00:00');
  const start=day(tripMeta.start),endD=day(tripMeta.end||tripMeta.start);
  const total=Math.round((endD-start)/86400000)+1,today=todayStr();
  const ph=tripPhase(tripMeta,completedAt,today);
  let pf=0,label=ph.en;
  if(ph.key==='checkin'){const n=Math.round((start-day(today))/86400000);label=`BOARDING · あと${n}日`;}
  else if(ph.key==='flight'){pf=Math.min(1,Math.max(0,(now-start)/(total*86400000)));label=`IN FLIGHT · Day ${Math.round((day(today)-start)/86400000)+1}/${total}`;}
  else pf=1;
  el.style.setProperty('--pf',pf.toFixed(3));
  el.classList.add('on');el.dataset.phase=ph.key;
  st.textContent=label;
}
function tripDatesText(meta){
  if(!meta.start)return'';
  if(!meta.end||meta.end===meta.start)return shortDay(meta.start);
  return`${shortDay(meta.start)}–${shortDay(meta.end)}`;
}
// 旅行の何日目か（出発日が Day 1）
function dayLabel(date){
  if(!isDateStr(date))return fmtDay(date);
  if(!tripMeta.start)return fmtDay(date);
  const diff=Math.round((new Date(date+'T00:00:00')-new Date(tripMeta.start+'T00:00:00'))/86400000);
  if(diff<0)return`出発前 · ${fmtDay(date)}`;
  if(tripMeta.end&&date>tripMeta.end)return`帰国後 · ${fmtDay(date)}`;
  return`Day ${diff+1} · ${fmtDay(date)}`;
}
function renderPassRoute(){
  renderPassClock();renderPassProgress();renderBarcode();
  const el=document.getElementById('passRoute');if(!el)return;
  const f=AIRPORT[tripMeta.from],t=AIRPORT[tripMeta.to];
  if(!t){el.innerHTML='<span class="pr-set">✈\ufe0e 行き先と日程を設定</span>';return;}
  el.innerHTML=`<span class="pr-codes">${f?f.code:'---'}<i>✈\ufe0e</i>${t.code}</span><span class="pr-meta">${flightNo(tripMeta)}${tripDatesText(tripMeta)?' · '+tripDatesText(tripMeta):''}</span>`;
}
// 旅行ごとに決まった模様のバーコード（飾り）
function barcodeSVG(seed,w,h,vertical){
  let x=0,hash=0,out='';for(const ch of String(seed||'trip'))hash=(hash*131+ch.charCodeAt(0))>>>0;
  const len=vertical?h:w;
  while(x<len){
    hash=(hash*1103515245+12345)>>>0;
    const bw=1+(hash>>>8)%3,gap=1+(hash>>>12)%2;
    if(x+bw>len)break;
    out+=vertical?`<rect x="0" y="${x}" width="${w}" height="${bw}"/>`:`<rect x="${x}" y="0" width="${bw}" height="${h}"/>`;
    x+=bw+gap;
  }
  return`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${out}</svg>`;
}
function renderBarcode(){const b=document.getElementById('passBarcode');if(b)b.innerHTML=barcodeSVG(currentTripId,26,44,true);}
// QR コードのライブラリは、搭乗券を開いたときに読み込む
let _qrLoading=null;
function loadQrLib(){
  if(window.qrcode)return Promise.resolve(true);
  if(_qrLoading)return _qrLoading;
  _qrLoading=new Promise(res=>{const sc=document.createElement('script');sc.src='vendor/qrcode.js';sc.onload=()=>res(!!window.qrcode);sc.onerror=()=>{_qrLoading=null;res(false);};document.head.appendChild(sc);});
  return _qrLoading;
}
function qrSVG(text){
  const q=qrcode(0,'M');q.addData(text);q.make();
  const n=q.getModuleCount(),m=2;let d='';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c+m} ${r+m}h1v1h-1z`;
  return`<svg viewBox="0 0 ${n+m*2} ${n+m*2}" shape-rendering="crispEdges" aria-label="招待用のQRコード"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#2e2a3d"/></svg>`;
}
// ゲート番号は旅行ごとにランダム（同じ旅行ではいつも同じ番号）
function gateNo(){let h=7;for(const ch of String(currentTripId||'trip'))h=(h*37+ch.charCodeAt(0))>>>0;return String(3+h%146);}
async function openBoardingPass(){
  const card=document.getElementById('bpCard');
  const f=AIRPORT[tripMeta.from],t=AIRPORT[tripMeta.to];
  const trip=trips.find(x=>x.id===currentTripId),me=getMeIdx();
  const cell=(l,v)=>`<div class="bp-cell"><span>${l}</span><b>${v}</b></div>`;
  const ap=a=>a?`<div class="bp-ap"><b>${a.code}</b><span>${esc(a.city)}${a.name&&a.name!==a.city?'・'+esc(a.name):''}</span></div>`:`<div class="bp-ap"><b>---</b><span>未設定</span></div>`;
  card.innerHTML=`
    <div class="bp-head"><span>BOARDING PASS</span><span>搭乗券</span></div>
    <div class="bp-route">${ap(f)}<span class="bp-plane"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.6v-1.2l-8-4.6V3.6a1.4 1.4 0 0 0-2.8 0v3.2l-8 4.6v1.2l8-2.3v4.9l-2.2 1.6v1.1l3.6-.9 3.6.9v-1.1L13 15.2v-4.9z"/></svg></span>${ap(t)}</div>
    <div class="bp-trip">${esc(trip?.name||'旅行')}</div>
    <div class="bp-grid">
      ${cell('FLIGHT',flightNo(tripMeta))}${cell('DATE',tripDatesText(tripMeta)||'未定')}
      ${cell('GATE',gateNo())}${cell('SEAT',me>=0?seatNo(me):'—')}
    </div>
    <div class="bp-pax">${members.map((m,i)=>`<span>${avatar(i)}${memberName(i)}<em>${seatNo(i)}</em></span>`).join('')}</div>
    <div class="bp-perf"></div>
    <div class="bp-qr" id="bpQr"><div class="bp-qr-box">読み込み中…</div></div>
    <p class="bp-note">このQRコードを友達に読み取ってもらうと、この旅行に参加できます<span class="bp-code" id="bpCode">${_shareCode?'共有コード '+esc(_shareCode):''}</span></p>
    <div class="bp-actions"><button class="btn btn-primary" onclick="shareInviteLink()">招待リンクを送る</button><button class="bp-close" onclick="closeBoardingPass()">閉じる</button></div>
    <div class="bp-barcode">${barcodeSVG(currentTripId,300,34,false)}</div>`;
  document.getElementById('bpOverlay').classList.add('active');
  const box=document.getElementById('bpQr');
  if(!sb||!currentUser||!currentTripId){box.innerHTML='<div class="bp-qr-box">ログインすると、招待用のQRコードが出ます</div>';return;}
  const [code,ok]=await Promise.all([getShareCode(),loadQrLib()]);
  if(!document.getElementById('bpOverlay').classList.contains('active'))return;
  if(!code){box.innerHTML='<div class="bp-qr-box">共有コードを作れませんでした</div>';return;}
  const cd=document.getElementById('bpCode');if(cd)cd.textContent='共有コード '+code;
  box.innerHTML=ok?qrSVG(inviteUrl(code)):'<div class="bp-qr-box">QRコードを表示できませんでした</div>';
}
function closeBoardingPass(){document.getElementById('bpOverlay').classList.remove('active');}
function openTripInfo(){
  const opts=sel=>AIRPORT_GROUPS.map(([g,list])=>`<optgroup label="${g}">${list.map(([c,city,name,flag])=>`<option value="${c}"${c===sel?' selected':''}>${flag} ${c} ${name===city?city:city+'・'+name}</option>`).join('')}</optgroup>`).join('');
  document.getElementById('tiFrom').innerHTML=opts(tripMeta.from);
  document.getElementById('tiTo').innerHTML='<option value="">選んでください</option>'+opts(tripMeta.to);
  document.getElementById('tiStart').value=tripMeta.start||'';
  document.getElementById('tiEnd').value=tripMeta.end||'';
  document.getElementById('tripInfoOverlay').classList.add('active');
}
function closeTripInfo(){document.getElementById('tripInfoOverlay').classList.remove('active');}
function saveTripInfo(){
  tripMeta=normalizeTripMeta({from:document.getElementById('tiFrom').value,to:document.getElementById('tiTo').value,
    start:document.getElementById('tiStart').value,end:document.getElementById('tiEnd').value});
  closeTripInfo();saveData();renderPassRoute();updateDisplay();showToast('旅の情報を保存しました');
}
function normalizeCatIcons(o){
  const out={};
  if(o&&typeof o==='object')Object.keys(o).sort().forEach(k=>{const v=o[k];const name=sanitize(k);if(name&&typeof v==='string'&&CAT_ICON_PATHS[v])out[name]=v;});
  return out;
}
function normalizeCats(arr){
  let c=Array.isArray(arr)?arr.map(x=>sanitize(x)).filter(Boolean):[];
  if(!c.length||(c.length===1&&c[0]===FALLBACK_CAT))c=[...DEFAULT_CATEGORIES];
  return c;
}
let _lastDepositRefunds=null;


/* ===== Supabase設定 =====
   Supabaseの Project URL と anon public key を入れてください。
   anon keyはブラウザに置いてOKな公開キーです。RLSでデータを守ります。 */
const SUPABASE_URL='https://kfmcjbxwwafvzltchpfb.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWNqYnh3d2FmdnpsdGNocGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NDg4NTEsImV4cCI6MjA5NzQyNDg1MX0.29e39nDUgOd7H91n5ZaddqSsjOI3SDWTfA-FbyR5rck';
let sb=null,currentUser=null,trips=[],currentTripId=null,_saveTimer=null,_isApplyingRemote=false;



/* ===== Supabase/Auth/旅行管理 ===== */
function isSupabaseConfigured(){
  return SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('YOUR_') && !SUPABASE_ANON_KEY.includes('YOUR_');
}
function setAuthMsg(msg){const el=document.getElementById('authMsg');if(el)el.textContent=msg||'';}
function openInfoPopup(title,msg){
  const titleEl=document.getElementById('infoTitle');
  const msgEl=document.getElementById('infoMsg');
  const overlay=document.getElementById('infoOverlay');
  if(!titleEl||!msgEl||!overlay){
    alert((title||'お知らせ')+'\n\n'+(msg||''));
    return;
  }
  titleEl.textContent=title||'お知らせ';
  msgEl.textContent=msg||'';
  overlay.classList.add('active');
}
function closeInfoPopup(){
  const overlay=document.getElementById('infoOverlay');
  if(overlay)overlay.classList.remove('active');
}
function setSyncStatus(msg){const el=document.getElementById('syncStatus');if(el)el.textContent=splitIcon(msg||'').text;}
function showLoggedOut(msg='ログインしてください'){
  const auth=document.getElementById('authShell');if(auth)auth.style.display='block';
  const app=document.getElementById('appShell');if(app)app.style.display='none';
  const footer=document.getElementById('footerBar');if(footer)footer.style.display='none';
  setAuthMsg(msg);
}
async function initSupabaseApp(){
  if(!isSupabaseConfigured()){
    showLoggedOut('先に Supabase の URL と anon key をHTMLに設定してください。');
    return;
  }
  sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  sb.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY'){
      if(session?.user)currentUser=session.user;
      setTimeout(()=>askNewPassword('新しいパスワードを設定'),300);
    }
  });
  const {data,error}=await sb.auth.getSession();
  if(data?.session){currentUser=data.session.user;await showLoggedIn();return;}
  // 電波がないときは、前回の内容で開く
  if(navigator.onLine===false&&readTripCache()){currentUser=null;await showLoggedIn();return;}
  if(error){showLoggedOut('セッション確認に失敗しました: '+error.message);return;}
  showLoggedOut('ログインしてください。');
}
async function signUp(){
  if(!sb){await initSupabaseApp();if(!sb)return;}
  const email=document.getElementById('authEmail').value.trim();
  const password=document.getElementById('authPassword').value;
  if(!email||!password){setAuthMsg('メールアドレスとパスワードを入力してください。');return;}
  const {data,error}=await sb.auth.signUp({
    email,
    password,
    options:{
      emailRedirectTo: window.location.origin + window.location.pathname
    }
  });
  if(error){setAuthMsg('登録に失敗しました: '+error.message);return;}
  if(data.session){currentUser=data.session.user;await showLoggedIn();}
  else{
    setAuthMsg('');
    openInfoPopup('登録メールを確認してください','確認メールのリンクを押すと、ログインできるようになります。');
  }
}
async function signIn(){
  if(!sb){await initSupabaseApp();if(!sb)return;}
  const email=document.getElementById('authEmail').value.trim();
  const password=document.getElementById('authPassword').value;
  if(!email||!password){setAuthMsg('メールアドレスとパスワードを入力してください。');return;}
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error){setAuthMsg('ログインに失敗しました: '+error.message);return;}
  currentUser=data.user;await showLoggedIn();
}
/* ===== アカウント ===== */
const appUrl=()=>window.location.origin+window.location.pathname;
function openPolicy(){document.getElementById('policyOverlay').classList.add('active');}
function closePolicy(){document.getElementById('policyOverlay').classList.remove('active');}
// パスワード再設定のメールを送る（ログイン画面）
async function sendPasswordReset(){
  if(!sb){await initSupabaseApp();if(!sb)return;}
  let email=document.getElementById('authEmail').value.trim();
  if(!email){
    email=(await appPrompt('パスワードの再設定',{message:'登録したメールアドレスを入力してください。再設定用のリンクを送ります。',placeholder:'example@email.com',okText:'送信',inputType:'email'})||'').trim();
    if(!email)return;
  }
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:appUrl()});
  if(error){openInfoPopup('送信できませんでした',error.message);return;}
  openInfoPopup('メールを送りました',`${email} に再設定用のリンクを送りました。\nメールのリンクを開くと、新しいパスワードを設定できます。`);
}
// 新しいパスワードを決める（再設定リンクから戻ったとき・設定タブから）
async function askNewPassword(title){
  const pw=await appPrompt(title,{message:'新しいパスワードを入力してください（6文字以上）',placeholder:'新しいパスワード',okText:'変更',inputType:'password'});
  if(pw===null)return false;
  if(String(pw).length<6){openInfoPopup('変更できませんでした','パスワードは6文字以上にしてください。');return false;}
  const {error}=await sb.auth.updateUser({password:pw});
  if(error){openInfoPopup('変更できませんでした',error.message);return false;}
  showToast('パスワードを変更しました');
  return true;
}
async function changePassword(){if(sb&&currentUser)await askNewPassword('パスワードを変更');}
// アカウントを削除（Supabase に delete_my_account 関数が必要）
async function deleteMyAccount(){
  if(!sb||!currentUser)return;
  const ok=await openConfirm('アカウントを削除','アカウントを削除すると、ログインできなくなり、元に戻せません。\n共有している旅行のデータは、ほかのメンバーのために残ります。');
  if(!ok)return;
  const typed=await appPrompt('最終確認',{message:'削除する場合は「削除」と入力してください',placeholder:'削除',okText:'アカウントを削除'});
  if((typed||'').trim()!=='削除'){if(typed!==null)showToast('入力が一致しないため、削除をやめました');return;}
  const {error}=await sb.rpc('delete_my_account');
  if(error){
    console.error(error);
    openInfoPopup('削除できませんでした',/delete_my_account|PGRST202|Could not find/.test(error.message||'')
      ?'サーバー側の準備（削除用の関数）がまだできていません。運営者に連絡してください。'
      :error.message);
    return;
  }
  clearTimeout(_saveTimer);_saveTimer=null;
  try{['currentTripId','warikanTab','pendingJoin','warikanMembers','warikanExpenses','warikanDeposits','warikanTripCache'].forEach(k=>localStorage.removeItem(k));Object.keys(localStorage).filter(k=>k.startsWith('warikanMe_')).forEach(k=>localStorage.removeItem(k));}catch(e){}
  try{await sb.auth.signOut();}catch(e){}
  currentUser=null;currentTripId=null;trips=[];
  showLoggedOut('アカウントを削除しました。ご利用ありがとうございました。');
}
async function signOut(){
  if(_saveTimer){clearTimeout(_saveTimer);await saveTripDataNow(false);}
  if(sb)await sb.auth.signOut();
  try{localStorage.removeItem(CACHE_KEY);}catch(e){}
  currentUser=null;currentTripId=null;trips=[];
  showLoggedOut('ログアウトしました。');
}
async function showLoggedIn(){
  const auth=document.getElementById('authShell');
  if(auth)auth.style.display='none';

  // 旅行データの取得に失敗しても画面が真っ白にならないよう、先に本体を表示する
  const app=document.getElementById('appShell');
  if(app)app.style.display='block';
  const footer=document.getElementById('footerBar');
  if(footer)footer.style.display='flex';
  restoreTab();

  const loginText=document.getElementById('loginUserText');
  if(loginText)loginText.textContent=currentUser?.email||'-';
  const accEmail=document.getElementById('accountEmail');if(accEmail)accEmail.textContent=currentUser?.email||'-';

  initAppViews();
  await loadTrips();
  await joinPendingInvite();
  startRemotePolling();
}
function getDataObject(){
  return {members,expenses,deposits,exchangeRate,krwRate,settlementMode,settled,catIcons,tripMeta,completedAt,wallet,categories:_cats,updatedAt:new Date().toISOString()};
}
function getBlankTripData(){
  return {
    members:[''],
    expenses:[],
    deposits:[],
    wallet:{on:false,ins:[],carry:[]},
    exchangeRate:150,
    krwRate:11,
    settled:{},
    settlementMode:'direct',
    categories:[...DEFAULT_CATEGORIES],
    catIcons:{},
    tripMeta:{from:'HND',to:'',start:'',end:''},
    completedAt:'',
    updatedAt:new Date().toISOString()
  };
}
function applyDataObject(raw){
  raw=raw||{};
  const nd=normalizeData(raw);
  members=nd.members;expenses=nd.expenses;deposits=nd.deposits;exchangeRate=nd.exchangeRate;krwRate=nd.krwRate;settled=nd.settled;wallet=nd.wallet;
  if(raw.settlementMode==='min'||raw.settlementMode==='direct')settlementMode=raw.settlementMode;
  _cats=normalizeCats(raw.categories);
  catIcons=normalizeCatIcons(raw.catIcons);
  tripMeta=normalizeTripMeta(raw.tripMeta);
  completedAt=isDateStr(raw.completedAt)?raw.completedAt:'';
  if(!_cats.includes(_currentCat))_currentCat=_cats.includes(FALLBACK_CAT)?FALLBACK_CAT:_cats[0];
}
async function loadTrips(){
  if(!currentUser&&openFromCache())return;
  if(!sb||!currentUser)return;
  setSyncStatus('☁️ 旅行一覧を確認中...');
  if(navigator.onLine===false&&openFromCache())return;
  const {data,error}=await sb.from('trips').select('id,name,updated_at').order('updated_at',{ascending:false});
  if(error){
    console.error(error);
    if(openFromCache())return;
    setSyncStatus('⚠ 旅行一覧の取得に失敗しました: '+error.message);
    showToast('⚠ 旅行一覧の取得に失敗しました');
    return;
  }
  trips=data||[];
  if(!trips.length){
    // 初回は個人端末のlocalStorageを引き継がず、完全に空の旅行を作成する。
    // 既存データを使いたい場合は、ログイン後にJSON読込から手動で復元する。
    await createTrip(DEFAULT_TRIP_NAME,getBlankTripData(),true);
    return;
  }
  renderTripSelect();
  const saved=localStorage.getItem('currentTripId');
  const initial=(saved&&trips.some(t=>t.id===saved))?saved:trips[0].id;
  await selectTrip(initial);
}
function renderTripSelect(){
  const sel=document.getElementById('tripSelect');if(!sel)return;
  sel.innerHTML='';
  trips.forEach(t=>{const opt=document.createElement('option');opt.value=t.id;opt.textContent=t.name;sel.appendChild(opt);});
  if(currentTripId)sel.value=currentTripId;
  renderTripName();
}
/* ===== 旅行を選ぶシート（搭乗券を並べる） ===== */
function renderTripName(){
  const btn=document.getElementById('tripNameBtn'),sel=document.getElementById('tripSelect');if(!btn)return;
  const t=trips.find(x=>x.id===currentTripId);
  btn.textContent=t?.name||sel?.selectedOptions?.[0]?.text||'旅行を選択';
}
function fmtUpdated(ts){const d=ts?new Date(ts):null;return d&&!isNaN(d)?`${d.getMonth()+1}/${d.getDate()} 更新`:'';}
function openTripSheet(){
  const list=document.getElementById('tripSheetList');
  list.innerHTML=trips.length?trips.map(t=>`
    <button class="mini-pass${t.id===currentTripId?' current':''}" onclick="pickTrip('${esc(t.id)}')">
      <span class="mini-pass-main"><span class="pass-lbl">✈︎ TRIP</span><span class="mini-pass-name">${esc(t.name)}</span></span>
      <span class="mini-pass-stub">${t.id===currentTripId?'<b>表示中</b>':''}<small>${fmtUpdated(t.updated_at)}</small></span>
    </button>`).join(''):'<p class="small" style="text-align:center;padding:12px;">旅行がまだありません</p>';
  document.getElementById('tripSheet').classList.add('active');
}
function closeTripSheet(){document.getElementById('tripSheet').classList.remove('active');}
async function pickTrip(id){closeTripSheet();if(id!==currentTripId)await selectTrip(id);}
/* ===== 旅のパスポート ===== */
const STAMP_COLORS=['#ff5a5f','#2f7bff','#12a26a','#8b5cf6','#ff8a1f','#00a3a3'];
async function openPassport(){
  closeTripSheet();
  const ov=document.getElementById('passportOverlay'),grid=document.getElementById('passportGrid');
  grid.innerHTML='<p class="small" style="grid-column:1/-1;text-align:center;padding:16px;">読み込み中…</p>';
  ov.classList.add('active');
  let rows=[];
  if(sb&&currentUser){
    const {data,error}=await sb.from('trips').select('id,name,updated_at,meta:data_json->tripMeta,done:data_json->>completedAt').order('updated_at',{ascending:false});
    if(!error&&Array.isArray(data))rows=data;
  }
  if(!rows.length)rows=trips.map(t=>({id:t.id,name:t.name}));
  if(!rows.some(r=>r.id===currentTripId)&&currentTripId)rows.unshift({id:currentTripId,name:trips.find(t=>t.id===currentTripId)?.name||'この旅行'});
  // 表示中の旅行は手元の最新を使う
  rows=rows.map(r=>r.id===currentTripId?{...r,meta:tripMeta,done:completedAt}:r);
  const done=rows.filter(r=>isDateStr(r.done)).length;
  document.getElementById('passportCount').textContent=`${done} / ${rows.length} 旅 精算完了`;
  grid.innerHTML=rows.map((r,i)=>{
    const m=normalizeTripMeta(r.meta),dest=AIRPORT[m.to],ok=isDateStr(r.done);
    const color=STAMP_COLORS[i%STAMP_COLORS.length],rot=((i*37)%17)-8;
    const date=ok?r.done.replace(/-/g,'.'):(m.start?m.start.replace(/-/g,'.'):'');
    return`<div class="stamp${ok?'':' pending'}" style="--sc:${color};transform:rotate(${rot}deg)">
      <div class="st-ring">
        <div class="st-flag">${dest?dest.flag:'✈\ufe0e'}</div>
        <div class="st-code">${dest?dest.code:'TRIP'}</div>
        <div class="st-city">${esc(dest?dest.city:(r.name||'旅行'))}</div>
        <div class="st-date">${date||'----.--.--'}</div>
        <div class="st-label">${ok?'精算完了':'旅の途中'}</div>
      </div>
      <div class="st-name">${esc(r.name||'')}</div>
    </div>`;}).join('')||'<p class="small" style="grid-column:1/-1;text-align:center;">旅行がまだありません</p>';
}
function closePassport(){document.getElementById('passportOverlay').classList.remove('active');}

/* ===== 精算結果を画像でシェア ===== */
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function buildShareCanvas(){
  const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const P=getComputedStyle(document.documentElement).getPropertyValue('--p').trim()||'#ff5a5f';
  const RF="'M PLUS Rounded 1c',-apple-system,'Hiragino Sans',sans-serif",SF="-apple-system,'Hiragino Sans','Noto Sans JP',sans-serif";
  x.fillStyle='#ffffff';x.fillRect(0,0,W,H);
  // 搭乗券
  const bx=60,by=70,bw=W-120,bh=560;
  x.fillStyle='#fff1f1';roundRect(x,bx,by,bw,bh,48);x.fill();
  x.fillStyle='#ffffff';[[bx,by+250],[bx+bw,by+250]].forEach(([cx,cy])=>{x.beginPath();x.arc(cx,cy,26,0,Math.PI*2);x.fill();});
  x.strokeStyle=P;x.globalAlpha=.4;x.lineWidth=5;x.setLineDash([18,14]);x.beginPath();x.moveTo(bx+40,by+250);x.lineTo(bx+bw-40,by+250);x.stroke();x.setLineDash([]);x.globalAlpha=1;
  const f=AIRPORT[tripMeta.from],t=AIRPORT[tripMeta.to];
  x.fillStyle=P;x.font=`800 112px ${RF}`;x.textBaseline='alphabetic';
  x.fillText(`${f?f.code:'---'} ✈︎ ${t?t.code:'---'}`,bx+56,by+150);
  x.font=`700 34px ${SF}`;x.globalAlpha=.75;x.fillText(`${flightNo(tripMeta)}${tripDatesText(tripMeta)?'  ·  '+tripDatesText(tripMeta):''}`,bx+60,by+205);x.globalAlpha=1;
  const name=(trips.find(z=>z.id===currentTripId)?.name)||'旅行';
  x.fillStyle='#2e2a3d';x.font=`800 50px ${RF}`;x.fillText(name.length>16?name.slice(0,16)+'…':name,bx+56,by+330);
  let yen=0;expenses.forEach(e=>{yen+=expYen(e);});
  const n=members.filter(Boolean).length;
  const cells=[['合計（円換算）',fmtPlain('JPY',yen)],['1人あたり',n>1?fmtPlain('JPY',yen/n):'-'],['メンバー',`${n}人`]];
  cells.forEach(([l,v],i)=>{const cx=bx+56+i*330;x.fillStyle=P;x.globalAlpha=.7;x.font=`700 28px ${SF}`;x.fillText(l,cx,by+420);x.globalAlpha=1;x.fillStyle=i===0?P:'#2e2a3d';x.font=`800 ${i===0?60:46}px ${RF}`;x.fillText(v,cx,by+490);});
  // 精算一覧
  const txs=getSettlementTx();x.fillStyle='#8a8594';x.font=`700 32px ${SF}`;x.fillText('精算',80,720);
  let y=760;
  const MAXR=4;
  txs.slice(0,MAXR).forEach(tx=>{
    const done=settleState(tx)==='done';
    x.fillStyle=done?'#f1f1f4':'#f7f7f9';roundRect(x,60,y,W-120,96,28);x.fill();
    x.fillStyle=done?'#a19db3':'#2e2a3d';x.font=`700 38px ${SF}`;
    const nm=pname;
    x.fillText(`${nm(tx.from)} → ${nm(tx.to)}`,100,y+62);
    x.textAlign='right';x.font=`800 42px ${RF}`;x.fillText((done?'✓ ':'')+fmtPlain(tx.code,tx.amount),W-100,y+64);x.textAlign='left';
    y+=112;
  });
  if(txs.length>MAXR){x.fillStyle='#8a8594';x.font=`600 30px ${SF}`;x.fillText(`ほか ${txs.length-MAXR} 件`,90,y+34);}
  if(!txs.length){x.fillStyle='#8a8594';x.font=`600 34px ${SF}`;x.fillText('精算はありません',90,y+40);}
  // 精算完了スタンプ
  if(txs.length&&txs.every(tx=>settleState(tx)==='done')){
    x.save();x.translate(W-205,by+150);x.rotate(-.22);x.strokeStyle=P;x.lineWidth=7;roundRect(x,-135,-50,270,100,20);x.stroke();
    x.lineWidth=3;roundRect(x,-123,-38,246,76,14);x.stroke();x.fillStyle=P;x.font=`900 46px ${RF}`;x.textAlign='center';x.fillText('精算完了',0,16);x.restore();x.textAlign='left';
  }
  x.fillStyle=P;x.font=`800 38px ${RF}`;x.textAlign='center';x.fillText('WARITABI',W/2,H-56);x.fillStyle='#b0aebb';x.font=`600 24px ${SF}`;x.fillText('旅の割り勘アプリ',W/2,H-24);x.textAlign='left';
  return c;
}
async function shareTripImage(){
  const c=buildShareCanvas();
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));
  const file=new File([blob],'waritabi.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:'WARITABI'});return;}catch(e){if(e&&e.name==='AbortError')return;}
  }
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='waritabi.png';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
  showToast('画像を保存しました');
}
/* ===== 旅のふりかえり ===== */
// 円換算（記録したときのレート）で、合計・カテゴリ・日ごと・大きかった支払い・メンバーごとの負担をまとめる
function tripReview(){
  const S=tripMeta.start,E=tripMeta.end||tripMeta.start;
  const r={yen:0,count:expenses.length,cats:[],days:[],top:[],mem:[],tripDays:0,inYen:0};
  const cat={},day={},mem={};
  expenses.forEach((e,idx)=>{
    const y=expYen(e);r.yen+=y;
    const c=e.category||'その他';cat[c]=(cat[c]||0)+y;
    let k=isDateStr(e.date)?e.date:'none';
    if(S&&k!=='none'){if(k<S)k='pre';else if(k>E)k='post';}
    day[k]=(day[k]||0)+y;
    if(S?(k!=='pre'&&k!=='post'&&k!=='none'):k!=='none')r.inYen+=y;
    sharesOf(e).forEach(([i,v])=>{mem[i]=(mem[i]||0)+v*expRate(e);});
  });
  r.cats=Object.entries(cat).map(([c,y])=>({cat:c,yen:y})).sort((a,b)=>b.yen-a.yen);
  // 日ごと: 出発前・帰国後はまとめる。旅行中は記録がない日も0で並べる
  const keys=[];
  if(S){
    const d0=new Date(S+'T00:00:00'),n=Math.round((new Date(E+'T00:00:00')-d0)/86400000)+1;r.tripDays=n;
    if(day.pre)keys.push('pre');
    if(n<=31)for(let i=0;i<n;i++){const d=new Date(d0);d.setDate(d.getDate()+i);keys.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));}
    else Object.keys(day).filter(isDateStr).sort().forEach(k=>keys.push(k));
    if(day.post)keys.push('post');
  }else{
    Object.keys(day).filter(isDateStr).sort().forEach(k=>keys.push(k));
    r.tripDays=keys.length;
  }
  if(day.none)keys.push('none');
  r.days=keys.map(k=>{
    let label,out=false;
    if(k==='pre'){label='出発前';out=true;}else if(k==='post'){label='帰国後';out=true;}else if(k==='none'){label='日付なし';out=true;}
    else if(S)label=`${Math.round((new Date(k+'T00:00:00')-new Date(S+'T00:00:00'))/86400000)+1}日目`;
    else{const [,m,d]=k.split('-').map(Number);label=`${m}/${d}`;}
    return{key:k,label,yen:day[k]||0,out};
  });
  r.top=expenses.map(e=>({e,yen:expYen(e)})).filter(x=>x.yen>0).sort((a,b)=>b.yen-a.yen).slice(0,3);
  r.mem=members.map((m,i)=>({i,name:m,yen:mem[i]||0})).filter(x=>x.name);
  return r;
}
const yenShort=n=>n>=10000?(Math.round(n/1000)/10).toLocaleString()+'万':Math.round(n).toLocaleString();
function renderReviewOpen(){
  const b=document.getElementById('reviewOpenBtn');if(!b)return;
  b.hidden=!expenses.length;
}
function openReview(){renderReview();document.getElementById('reviewSheet').classList.add('active');}
function closeReview(){document.getElementById('reviewSheet').classList.remove('active');}
function renderReview(){
  const el=document.getElementById('reviewBody');if(!el)return;
  if(!expenses.length){el.innerHTML='<p class="small" style="text-align:center;padding:16px 0;">まだ記録がありません</p>';return;}
  const r=tripReview(),f=AIRPORT[tripMeta.from],t=AIRPORT[tripMeta.to];
  const name=(trips.find(z=>z.id===currentTripId)?.name)||'旅行';
  const route=t?`${f?f.code:'---'} ✈︎ ${t.code}`:'';
  const me=getMeIdx(),n=r.mem.length;
  const avg=r.tripDays?r.inYen/r.tripDays:0;
  const third=me>=0?['自分の分',fmtPlain('JPY',r.mem.find(x=>x.i===me)?.yen||0)]:['1人あたり',n>1?fmtPlain('JPY',r.yen/n):'-'];
  let h=`<div class="rv-hero">
    ${route?`<div class="rv-route">${route}${tripDatesText(tripMeta)?' · '+esc(tripDatesText(tripMeta)):''}</div>`:''}
    <div class="rv-name">${esc(name)}</div>
    <div class="rv-total">${symSmall(fmtPlain('JPY',r.yen))}<small>旅の合計（円換算）</small></div>
    <div class="rv-stats">
      <div><small>${r.tripDays?`${r.tripDays}日間`:'日数'}</small><b>${r.count}件</b></div>
      <div><small>1日あたり${tripMeta.start?'（旅行中）':''}</small><b>${r.tripDays?symSmall(fmtPlain('JPY',avg)):'-'}</b></div>
      <div><small>${third[0]}</small><b>${symSmall(third[1])}</b></div>
    </div>
  </div>`;
  // カテゴリ
  h+='<div class="rv-sec">カテゴリ別</div>';
  r.cats.forEach(c=>{const pct=r.yen>0?c.yen/r.yen*100:0;
    h+=`<div class="rv-cat" style="${catStyle(c.cat)}"><span class="rv-cn">${catLabelHTML(c.cat)}</span><span class="rv-ca">${symSmall(fmtPlain('JPY',c.yen))}<small>${Math.round(pct)}%</small></span><div class="rv-bar"><i style="width:${Math.max(2,pct).toFixed(1)}%"></i></div></div>`;});
  // 日ごと
  const mx=Math.max(...r.days.map(d=>d.yen),1),inMax=Math.max(...r.days.filter(d=>!d.out).map(d=>d.yen),0);
  h+='<div class="rv-sec">日ごと</div><div class="rv-days">';
  r.days.forEach(d=>{h+=`<div class="rv-day${d.out?' out':''}${!d.out&&d.yen>0&&d.yen===inMax?' max':''}"><em>${d.yen>0?yenShort(d.yen):''}</em><i style="height:${d.yen>0?Math.max(3,d.yen/mx*100).toFixed(1):0}%"></i><span>${esc(d.label)}</span></div>`;});
  h+='</div>';
  // 大きかった支払い
  if(r.top.length){
    h+='<div class="rv-sec">大きかった支払い</div>';
    r.top.forEach((x,k)=>{const e=x.e;h+=`<div class="rv-top"><span class="rv-rank">${k+1}</span><span class="pre-main"><b>${esc(e.name||'(無題)')}</b><small>${esc(fmtDay(e.date))} · ${esc(catText(e.category||'その他'))}</small></span><span class="rv-ta">${symSmall(fmtPlain(e.currency,e.amount))}</span></div>`;});
  }
  // メンバーごと
  if(n>1){
    const mm=Math.max(...r.mem.map(x=>x.yen),1);
    h+='<div class="rv-sec">メンバーごとの負担</div>';
    r.mem.forEach(x=>{h+=`<div class="rv-mem"><span class="rv-mn">${avatar(x.i)}<span>${esc(x.name)}${x.i===me?'（自分）':''}</span></span><div class="rv-bar"><i style="width:${Math.max(2,x.yen/mm*100).toFixed(1)}%"></i></div><span class="rv-ma">${symSmall(fmtPlain('JPY',x.yen))}</span></div>`;});
  }
  h+=`<p class="rv-note">外貨は記録したときのレートで円に換算しています${r.days.some(d=>d.key==='pre'||d.key==='post')?'<br>1日あたりは旅行中の日だけで計算しています':''}</p>`;
  h+=`<button type="button" class="rv-save" onclick="shareReviewImage()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>画像で保存</button>`;
  el.innerHTML=h;
}
function buildReviewCanvas(){
  const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const P=getComputedStyle(document.documentElement).getPropertyValue('--p').trim()||'#ff5a5f';
  const RF="'M PLUS Rounded 1c',-apple-system,'Hiragino Sans',sans-serif",SF="-apple-system,'Hiragino Sans','Noto Sans JP',sans-serif";
  const r=tripReview(),f=AIRPORT[tripMeta.from],t=AIRPORT[tripMeta.to];
  x.fillStyle='#ffffff';x.fillRect(0,0,W,H);
  // 上: 合計
  const bx=60,by=56,bw=W-120,bh=360;
  x.fillStyle='#fff1f1';roundRect(x,bx,by,bw,bh,44);x.fill();
  x.fillStyle=P;x.font=`800 40px ${RF}`;x.fillText(t?`${f?f.code:'---'} ✈︎ ${t.code}`:'TRIP REVIEW',bx+50,by+70);
  x.globalAlpha=.7;x.font=`700 28px ${SF}`;x.textAlign='right';x.fillText(tripDatesText(tripMeta)||'',bx+bw-50,by+68);x.textAlign='left';x.globalAlpha=1;
  const name=(trips.find(z=>z.id===currentTripId)?.name)||'旅行';
  x.fillStyle='#2e2a3d';x.font=`800 44px ${RF}`;x.fillText(name.length>18?name.slice(0,18)+'…':name,bx+50,by+136);
  x.fillStyle='#8a8594';x.font=`700 26px ${SF}`;x.fillText('旅の合計（円換算）',bx+50,by+186);
  x.fillStyle=P;x.font=`800 88px ${RF}`;x.fillText(fmtPlain('JPY',r.yen),bx+46,by+268);
  const n=r.mem.length,avg=r.tripDays?r.inYen/r.tripDays:0;
  const cells=[[r.tripDays?`${r.tripDays}日間`:'記録',`${r.count}件`],['1日あたり',r.tripDays?fmtPlain('JPY',avg):'-'],['1人あたり',n>1?fmtPlain('JPY',r.yen/n):'-']];
  cells.forEach(([l,v],i)=>{const cx=bx+50+i*320;x.fillStyle='#8a8594';x.font=`700 24px ${SF}`;x.fillText(l,cx,by+306);x.fillStyle='#2e2a3d';x.font=`800 36px ${RF}`;x.fillText(v,cx,by+342);});
  // カテゴリ（上位5）
  let y=480;x.fillStyle='#8a8594';x.font=`700 30px ${SF}`;x.fillText('カテゴリ別',70,y);y+=18;
  const cats=r.cats.slice(0,5);
  cats.forEach(cc=>{const col=catColor(cc.cat),pct=r.yen>0?cc.yen/r.yen:0;
    x.fillStyle='#2e2a3d';x.font=`700 30px ${SF}`;x.fillText(catText(cc.cat).slice(0,10),70,y+36);
    x.textAlign='right';x.font=`800 32px ${RF}`;x.fillText(`${fmtPlain('JPY',cc.yen)}`,W-150,y+36);x.fillStyle='#8a8594';x.font=`700 24px ${SF}`;x.fillText(`${Math.round(pct*100)}%`,W-70,y+36);x.textAlign='left';
    x.fillStyle='#f1f1f4';roundRect(x,70,y+52,W-140,14,7);x.fill();
    x.fillStyle=col.fg;roundRect(x,70,y+52,Math.max(14,(W-140)*pct),14,7);x.fill();
    y+=74;});
  if(r.cats.length>5){x.fillStyle='#8a8594';x.font=`600 24px ${SF}`;x.fillText(`ほか ${r.cats.length-5} カテゴリ`,70,y+20);}
  y=Math.max(y,498+74*3);
  // 日ごと
  y=Math.min(y,498+74*5)+56;x.fillStyle='#8a8594';x.font=`700 30px ${SF}`;x.fillText('日ごと',70,y);
  const days=r.days.slice(0,14),top=y+20,bottom=H-150,ch=bottom-top;
  const mx=Math.max(...days.map(d=>d.yen),1),gw=(W-140)/Math.max(days.length,1),bwid=Math.min(56,gw*.6);
  days.forEach((d,i)=>{const cx=70+gw*i+gw/2,hh=d.yen>0?Math.max(6,d.yen/mx*(ch-34)):0;
    x.globalAlpha=d.out?.35:1;x.fillStyle=P;if(hh){roundRect(x,cx-bwid/2,bottom-hh,bwid,hh,Math.min(10,bwid/2,hh/2));x.fill();}x.globalAlpha=1;
    x.textAlign='center';x.fillStyle='#6b6778';x.font=`800 ${gw<80?18:22}px ${RF}`;if(d.yen>0)x.fillText(yenShort(d.yen),cx,bottom-hh-10);
    x.fillStyle='#8a8594';x.font=`700 ${gw<80?18:22}px ${SF}`;x.fillText(d.label,cx,bottom+30);x.textAlign='left';});
  x.fillStyle=P;x.font=`800 38px ${RF}`;x.textAlign='center';x.fillText('WARITABI',W/2,H-50);x.fillStyle='#b0aebb';x.font=`600 24px ${SF}`;x.fillText('旅のふりかえり',W/2,H-20);x.textAlign='left';
  return c;
}
async function shareReviewImage(){
  const c=buildReviewCanvas();
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));
  const file=new File([blob],'waritabi-review.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:'旅のふりかえり'});return;}catch(e){if(e&&e.name==='AbortError')return;}
  }
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='waritabi-review.png';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
  showToast('画像を保存しました');
}
async function createTripPrompt(){
  const name=await appPrompt('新しい旅行',{message:'旅行名を入力してください',placeholder:'例: ソウル旅行',okText:'作成'});
  if(!name||!name.trim())return;
  await createTrip(name.trim(),getBlankTripData(),true);
  openTripInfo();
}
async function renameCurrentTripPrompt(){
  if(!currentTripId){
    showToast('⚠ 旅行を選択してください');
    return;
  }
  const current=trips.find(t=>t.id===currentTripId);
  const oldName=current?.name||'';
  const input=await appPrompt('旅行名を変更',{value:oldName,okText:'変更'});
  const newName=(input||'').trim();
  if(!newName||newName===oldName)return;
  setSyncStatus('☁️ 旅行名を変更中...');
  const {data,error}=await sb.from('trips')
    .update({name:newName,updated_at:new Date().toISOString()})
    .eq('id',currentTripId)
    .select('id,name,updated_at')
    .single();
  if(error){
    console.error(error);
    setSyncStatus('⚠ 旅行名の変更に失敗しました: '+error.message);
    openInfoPopup('旅行名の変更に失敗しました',error.message||'Supabaseの設定を確認してください。');
    return;
  }
  trips=trips.map(t=>t.id===currentTripId?{...t,name:data?.name||newName,updated_at:data?.updated_at||new Date().toISOString()}:t);
  renderTripSelect();
  const sel=document.getElementById('tripSelect');
  if(sel)sel.value=currentTripId;
  setSyncStatus(`旅行名を「${newName}」に変更しました。変更は自動保存されます。`);
  showToast('✏️ 旅行名を変更しました');
}
function normalizeShareCode(raw){
  return String(raw||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
}
function makeShareCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s='';
  const cryptoObj=window.crypto||window.msCrypto;
  if(cryptoObj&&cryptoObj.getRandomValues){
    const arr=new Uint32Array(8);
    cryptoObj.getRandomValues(arr);
    for(let i=0;i<8;i++)s+=chars[arr[i]%chars.length];
  }else{
    for(let i=0;i<8;i++)s+=chars[Math.floor(Math.random()*chars.length)];
  }
  return s;
}
async function ensureShareCode(){
  if(!currentTripId||!sb){
    showToast('⚠ 旅行を選択してください');
    return null;
  }
  const {data:existing,error:fetchError}=await sb.from('trips').select('id,name,share_code').eq('id',currentTripId).single();
  if(fetchError){
    console.error(fetchError);
    openInfoPopup('共有コードの取得に失敗しました',fetchError.message||'Supabaseの設定を確認してください。');
    return null;
  }
  if(existing?.share_code)return existing.share_code;
  for(let i=0;i<5;i++){
    const code=makeShareCode();
    const {data,error}=await sb.from('trips')
      .update({share_code:code,updated_at:new Date().toISOString()})
      .eq('id',currentTripId)
      .select('share_code')
      .single();
    if(!error&&data?.share_code)return data.share_code;
    console.error(error);
    // 共有コード重複などは作り直して再試行
  }
  openInfoPopup('共有コードの作成に失敗しました','時間をおいてもう一度試してください。');
  return null;
}
// 招待リンク: アプリのURLに ?join=コード を付けたもの
let _shareCode=null;
function inviteUrl(code){return`${location.origin}${location.pathname}?join=${encodeURIComponent(code)}`;}
function renderShareArea(){
  const el=document.getElementById('shareCodeArea');if(!el)return;
  el.innerHTML=_shareCode
    ?`<div class="share-code-box"><div class="lbl">共有コード</div><div class="code">${esc(_shareCode)}</div></div>`
    :'';
}
async function getShareCode(){
  if(_shareCode)return _shareCode;
  await saveTripDataNow(false);
  const code=await ensureShareCode();
  if(code){_shareCode=code;renderShareArea();}
  return code;
}
async function copyText(text,doneMsg){
  try{
    if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);showToast(doneMsg);return true;}
  }catch(e){}
  openInfoPopup('コピーしてください',text);
  return false;
}
async function shareInviteLink(){
  const code=await getShareCode();if(!code)return;
  const trip=trips.find(t=>t.id===currentTripId);
  const url=inviteUrl(code);
  const text=`WARITABI で「${trip?.name||'旅行'}」の割り勘に参加してね！\nリンクを開いてログインすると参加できます。\n（共有コード: ${code}）`;
  if(navigator.share){
    try{await navigator.share({title:'WARITABI への招待',text,url});return;}
    catch(e){if(e&&e.name==='AbortError')return;}
  }
  await copyText(`${text}\n${url}`,'📋 招待メッセージをコピーしました');
}
async function copyInviteLink(){
  const code=await getShareCode();if(!code)return;
  await copyText(inviteUrl(code),'📋 招待リンクをコピーしました');
}
async function copyShareCode(){
  const code=await getShareCode();if(!code)return;
  await copyText(code,'📋 共有コードをコピーしました');
}
async function joinTripByCodePrompt(){
  if(!sb||!currentUser){showToast('⚠ ログインしてください');return;}
  const raw=await appPrompt('コードで参加',{message:'友達から届いた共有コードを入力してください',placeholder:'例: AB12CD34',okText:'参加'});
  if(!raw)return;
  await joinTripByCode(raw);
}
async function joinTripByCode(raw){
  const code=normalizeShareCode(raw);
  if(!code){showToast('⚠ 共有コードを入力してください');return false;}
  setSyncStatus('☁️ 共有旅行に参加中...');
  const {data,error}=await sb.rpc('join_trip_by_code',{p_share_code:code});
  if(error){
    console.error(error);
    setSyncStatus('⚠ 共有旅行への参加に失敗しました: '+error.message);
    openInfoPopup('共有旅行への参加に失敗しました',error.message||'共有コードを確認してください。');
    return false;
  }
  const joined=Array.isArray(data)?data[0]:data;
  await loadTrips();
  if(joined?.id)await selectTrip(joined.id);
  openInfoPopup('共有旅行に参加しました',`「${joined?.name||'共有旅行'}」に参加しました。\n上の旅行名から切り替えられます。`);
  return true;
}
// URLの ?join= を読み取って保存（ログイン後に参加する）
function capturePendingJoin(){
  try{
    const params=new URLSearchParams(location.search);
    const code=normalizeShareCode(params.get('join'));
    if(code){
      localStorage.setItem('pendingJoin',code);
      params.delete('join');
      const q=params.toString();
      history.replaceState(null,'',location.pathname+(q?`?${q}`:'')+location.hash);
    }
    const note=document.getElementById('inviteNote');
    if(note)note.style.display=localStorage.getItem('pendingJoin')?'block':'none';
  }catch(e){}
}
async function joinPendingInvite(){
  let code=null;try{code=localStorage.getItem('pendingJoin');}catch(e){}
  if(!code)return;
  try{localStorage.removeItem('pendingJoin');}catch(e){}
  const note=document.getElementById('inviteNote');if(note)note.style.display='none';
  await joinTripByCode(code);
}

async function createTrip(name,dataJson,selectAfter=true){
  if(!sb||!currentUser){
    showToast('⚠ ログイン情報が確認できません');
    return;
  }
  setSyncStatus('☁️ 旅行データを作成中...');

  // 直接 trips に insert せず、Supabase側のRPCで作成する。
  // RLSのinsert判定で端末ごとに詰まるのを避けるため。
  const {data,error}=await sb.rpc('create_trip_for_current_user',{
    p_name:name,
    p_data_json:dataJson||{}
  });

  if(error){
    console.error(error);
    setSyncStatus('⚠ 旅行作成に失敗しました: '+error.message);
    openInfoPopup('旅行作成に失敗しました',error.message || 'SupabaseのRPC/RLS設定を確認してください。');
    return;
  }

  const created=Array.isArray(data)?data[0]:data;
  if(!created||!created.id){
    setSyncStatus('⚠ 旅行作成に失敗しました: 作成結果が取得できませんでした');
    openInfoPopup('旅行作成に失敗しました','作成結果が取得できませんでした。SQL関数 create_trip_for_current_user を確認してください。');
    return;
  }

  trips=[created,...trips.filter(t=>t.id!==created.id)];
  renderTripSelect();
  if(selectAfter)await selectTrip(created.id);
}
async function selectTrip(id){
  if(!id||!sb)return;
  if(_saveTimer){clearTimeout(_saveTimer);_saveTimer=null;await saveTripDataNow(false);}
  const prev={id:currentTripId,base:_syncBase,rev:_syncRev,share:_shareCode};
  hideUndo();
  _syncBase=null;_syncRev=null;
  currentTripId=id;localStorage.setItem('currentTripId',id);
  const sel=document.getElementById('tripSelect');if(sel)sel.value=id;
  renderTripName();
  _shareCode=null;renderShareArea();
  const {data,error}=await sb.from('trips').select('id,name,data_json,share_code').eq('id',id).single();
  if(error){
    console.error(error);
    // 取得できなかったら、前の旅行に戻す（前の旅行のデータが別の旅行名で表示され、保存もされない状態を防ぐ）
    if(currentTripId===id&&prev.id){
      currentTripId=prev.id;_syncBase=prev.base;_syncRev=prev.rev;_shareCode=prev.share;
      try{localStorage.setItem('currentTripId',prev.id);}catch(e){}
      if(sel)sel.value=prev.id;
      renderTripName();renderShareArea();
    }
    setSyncStatus('⚠ 旅行データ取得に失敗しました: '+error.message);
    showToast('⚠ 旅行を開けませんでした。電波の良いところでもう一度お試しください');
    return;
  }
  _isApplyingRemote=true;
  applyDataObject(data.data_json||{});
  _isApplyingRemote=false;
  setSyncBase(data.data_json||{});
  if(id===currentTripId){_shareCode=data.share_code||null;renderShareArea();}
  initAppViews();
  _fresh=new Map();
  const found=refreshFresh();displayExpenses();
  announceOnOpen(found);
  setSyncStatus(`「${data.name}」を読み込みました。変更は自動保存されます。`);
}
/* ===== 同期（複数人での同時編集） =====
 * data_json.rev を版番号として使い、保存時に「自分が最後に読んだ版」のときだけ上書きする。
 * 他の人が先に保存していた場合は、最新を取り直して支払い1件ごとにマージしてから保存し直す。
 */
const SYNC_KEYS=['members','expenses','deposits','exchangeRate','krwRate','settlementMode','settled','catIcons','tripMeta','completedAt','wallet','categories'];
let _syncBase=null,_syncRev=null,_saving=false,_saveAgain=false,_pollTimer=null;
const sameJSON=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const revOf=raw=>Number.isFinite(raw?.rev)?raw.rev:null;
// 比較用に、保存データを applyDataObject と同じ規則で整えたもの
function toSyncView(raw){
  raw=raw||{};
  const nd=normalizeData(raw);
  const cats=normalizeCats(raw.categories);
  const sm=(raw.settlementMode==='min'||raw.settlementMode==='direct')?raw.settlementMode:settlementMode;
  return{members:nd.members,expenses:nd.expenses,deposits:nd.deposits,exchangeRate:nd.exchangeRate,krwRate:nd.krwRate,settlementMode:sm,settled:nd.settled,wallet:nd.wallet,catIcons:normalizeCatIcons(raw.catIcons),tripMeta:normalizeTripMeta(raw.tripMeta),completedAt:isDateStr(raw.completedAt)?raw.completedAt:'',categories:cats};
}
function setSyncBase(raw){_syncBase=toSyncView(raw);_syncRev=revOf(raw);writeTripCache({server:raw,local:null,localRev:null});}
// 電波がないときに開けるよう、最後に開いた旅行をこの端末に残す
const CACHE_KEY='warikanTripCache';
function readTripCache(){try{const c=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');return c&&typeof c==='object'?c:null;}catch(e){return null;}}
function writeTripCache(part){
  if(!currentUser||!currentTripId)return;
  try{
    let c=readTripCache();
    if(!c||c.uid!==currentUser.id||c.id!==currentTripId)c={uid:currentUser.id,email:currentUser.email||'',id:currentTripId};
    Object.assign(c,part,{trips:trips.map(t=>({id:t.id,name:t.name,updated_at:t.updated_at}))});
    localStorage.setItem(CACHE_KEY,JSON.stringify(c));
  }catch(e){}
}
// 電波がなく旅行を読み込めないとき、前回の内容で開く
function openFromCache(){
  const c=readTripCache();
  if(!c||!c.id||!c.server||(currentUser&&c.uid!==currentUser.id))return false;
  if(!currentUser)currentUser={id:c.uid,email:c.email};
  trips=Array.isArray(c.trips)&&c.trips.length?c.trips:[{id:c.id,name:'旅行'}];
  currentTripId=c.id;
  hideUndo();
  // 自分の変更は、同じ版のサーバーの内容に対するものだけ使う（古い変更で新しい内容を上書きしないように）
  const useLocal=c.local&&c.localRev===revOf(c.server);
  _isApplyingRemote=true;applyDataObject(useLocal?c.local:c.server);_isApplyingRemote=false;
  _syncBase=toSyncView(c.server);_syncRev=revOf(c.server);
  renderTripSelect();initAppViews();
  setSyncStatus('機内モード中：前回の内容を表示しています。電波が戻ったら同期します');
  return true;
}
// base: 最後にサーバーと一致していた状態 / local: 自分の今の状態 / server: サーバーの最新
function mergeSync(base,local,server){
  const out={};
  SYNC_KEYS.filter(k=>k!=='expenses'&&k!=='settled'&&k!=='wallet').forEach(k=>{out[k]=sameJSON(local[k],base[k])?server[k]:local[k];});
  // 共有財布：オン・持ち越しは丸ごと、入れた記録は1件ずつ
  {
    const bw=base.wallet||{},lw=local.wallet||{},sw=server.wallet||{};
    const pick=k=>sameJSON(lw[k],bw[k])?sw[k]:lw[k];
    const B=new Map((bw.ins||[]).map(x=>[x.id,x])),L=new Map((lw.ins||[]).map(x=>[x.id,x])),S=new Map((sw.ins||[]).map(x=>[x.id,x]));
    const ins=[];
    (sw.ins||[]).forEach(x=>{const b=B.get(x.id),l=L.get(x.id);if(l)ins.push(b&&sameJSON(l,b)?x:l);else if(!b||!sameJSON(x,b))ins.push(x);});
    (lw.ins||[]).forEach(l=>{if(!S.has(l.id)&&!B.has(l.id))ins.push(l);});
    out.wallet={on:!!(pick('on')||ins.length),ins,carry:pick('carry')||[]};
  }
  // 済の印は送金ごとにマージ（同時に別々の送金を済にしても、両方残す）
  const sb_=base.settled||{},sl=local.settled||{},ss=server.settled||{},st={...ss};
  new Set([...Object.keys(sb_),...Object.keys(sl)]).forEach(k=>{
    if(sl[k]===sb_[k])return;           // 自分は変えていない → サーバーのまま
    if(sl[k]==null)delete st[k];else st[k]=sl[k]; // 自分が済にした・取り消した
  });
  out.settled=st;
  const byId=a=>new Map(a.map(e=>[e.id,e]));
  const B=byId(base.expenses),L=byId(local.expenses),S=byId(server.expenses);
  const res=[];
  server.expenses.forEach(sv=>{
    const b=B.get(sv.id),l=L.get(sv.id);
    if(l)res.push(b&&sameJSON(l,b)?sv:l);   // 自分が変更していれば自分の版
    else if(b){if(!sameJSON(sv,b))res.push(sv);} // 自分が削除（相手が変更していたら相手の版を残す）
    else res.push(sv);                         // 相手が追加
  });
  local.expenses.forEach(l=>{
    const b=B.get(l.id);
    if(!S.has(l.id)&&(!b||!sameJSON(l,b)))res.push(l); // 自分が追加 / 相手が削除したが自分が変更
  });
  out.expenses=res;
  return out;
}
function applyRemoteView(view){
  const prevMembers=JSON.stringify(members),prevDone=completedAt;
  const editId=editingExpenseIdx>=0?expenses[editingExpenseIdx]?.id:null;
  _isApplyingRemote=true;applyDataObject(view);_isApplyingRemote=false;
  if(editId){
    const ni=expenses.findIndex(e=>e.id===editId);
    if(ni<0){clearExpenseForm();showToast('編集中の支払いは他の人が削除しました');}
    else editingExpenseIdx=ni;
  }
  if(JSON.stringify(members)!==prevMembers){updateMemberSelects();updateMemberDisplay();updateFocusMemberSelect();}
  const found=refreshFresh();
  showRateDisplay();renderCatPicker();renderPassRoute();updateDisplay();
  if(found.length)announce(freshAnnounceText(found));
  if(!prevDone&&completedAt)announce('ただいま、全員の精算が完了しました。ご搭乗ありがとうございました');
}
// サーバーの最新を取り込み、自分の未保存の変更とマージする
async function pullAndMerge(){
  const tripId=currentTripId;
  const {data,error}=await sb.from('trips').select('data_json').eq('id',tripId).single();
  if(error){console.error(error);setSyncStatus('⚠ 最新データの取得に失敗しました: '+error.message);return false;}
  if(tripId!==currentTripId)return false;
  const raw=data?.data_json||{};
  const server=toSyncView(raw),local=toSyncView(getDataObject());
  const base=_syncBase||local;
  if(!sameJSON(server,base))applyRemoteView(sameJSON(local,base)?server:mergeSync(base,local,server));
  _syncBase=server;_syncRev=revOf(raw);writeTripCache({server:raw,local:null,localRev:null});
  return true;
}
async function saveTripDataNow(showDone=false){
  clearTimeout(_saveTimer);_saveTimer=null;
  if(!sb||!currentTripId||!currentUser||!_syncBase)return;
  if(_saving){_saveAgain=true;return;}
  _saving=true;
  try{
    for(let attempt=0;attempt<4;attempt++){
      const tripId=currentTripId,nextRev=(_syncRev||0)+1;
      const payload={...getDataObject(),rev:nextRev};
      let q=sb.from('trips').update({data_json:payload,updated_at:new Date().toISOString()}).eq('id',tripId);
      q=_syncRev===null?q.is('data_json->rev',null):q.eq('data_json->>rev',String(_syncRev));
      const {data,error}=await q.select('id');
      if(error){
        setSyncStatus('⚠ 同期に失敗しました: '+error.message);console.error(error);
        // 一時的な失敗なら、20秒後にもう一度保存する（電波がないときは、戻ったときに保存する）
        if(navigator.onLine!==false&&!_saveTimer)_saveTimer=setTimeout(()=>{_saveTimer=null;saveTripDataNow(false);},20000);
        return;
      }
      if(tripId!==currentTripId)return;
      if(data&&data.length){
        setSyncBase(payload);
        setSyncStatus('☁️ 同期済み: '+new Date().toLocaleTimeString());
        if(showDone)showToast('☁️ 同期しました');
        return;
      }
      // 他の人が先に保存していた → 最新とマージして保存し直す
      if(!await pullAndMerge())return;
      showToast('🔄 他の人の変更と合わせて保存しました');
    }
    setSyncStatus('⚠ 同期が混み合っています。少し待ってから「同期」を押してください');
  }finally{
    _saving=false;
    if(_saveAgain){_saveAgain=false;saveTripDataNow(false);}
  }
}
// 他の人の変更を定期的に取り込む（入力中・保存待ちのときは見送る）
async function pollRemote(){
  if(!sb||!currentTripId||!currentUser||!_syncBase||_saving||_saveTimer||document.hidden)return;
  const a=document.activeElement;if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))return;
  const tripId=currentTripId;
  const {data,error}=await sb.from('trips').select('rev:data_json->rev').eq('id',tripId).single();
  if(error||tripId!==currentTripId||_saving||_saveTimer)return;
  const rev=Number.isFinite(data?.rev)?data.rev:null;
  if(rev===_syncRev)return;
  if(!await pullAndMerge())return;
  if(!sameJSON(toSyncView(getDataObject()),_syncBase))saveData();
  else setSyncStatus('🔄 他の人の変更を反映しました: '+new Date().toLocaleTimeString());
}
/* ===== 機内モード（電波がないとき） ===== */
function renderOffline(){
  const off=navigator.onLine===false;
  document.getElementById('offlineBar')?.classList.toggle('show',off);
  document.body.classList.toggle('is-offline',off);
}
window.addEventListener('offline',()=>{renderOffline();setSyncStatus('機内モード中：電波が戻ったら同期します');});
window.addEventListener('online',()=>{
  renderOffline();
  if(!sb||!currentTripId||!_syncBase)return;
  showToast('☁️ 電波が戻りました。同期します');
  sb.auth.getSession().then(({data})=>{
    if(data?.session)currentUser=data.session.user;
    else{showLoggedOut('ログインの期限が切れました。もう一度ログインしてください（入力した内容はこの端末に残っています）');return;}
    if(!sameJSON(toSyncView(getDataObject()),_syncBase))saveTripDataNow(false);else pollRemote();
  }).catch(()=>{});
});
document.addEventListener('DOMContentLoaded',renderOffline);
function startRemotePolling(){
  if(_pollTimer)return;
  _pollTimer=setInterval(pollRemote,15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)pollRemote();});
}

/* ===== ユーティリティ ===== */
const sanitize=s=>String(s??'').substring(0,MAX_STRING_LEN);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>esc(sanitize(s));
const validateNum=(n,min=0,max=10000000)=>{const v=parseFloat(n);return!isNaN(v)&&v>=min&&v<=max?v:null;};
function clampInt(n,min,max){const v=Number.isFinite(n)?Math.trunc(n):parseInt(n,10);if(!Number.isFinite(v))return null;if(v<min||v>max)return null;return v;}

/* ===== フォーマット ===== */
// 円換算レート（1単位あたりの円）
function yenPer(code){
  if(code==='USD')return exchangeRate;
  if(code==='KRW')return krwRate/100;
  return 1;
}
// 金額を通貨記号付きで表示（換算なし）
function fmtPlain(code,n){
  const c=CUR[normCurrency(code)],num=Number(n||0),abs=Math.abs(num),sign=num<0?'-':'';
  const v=c.dec?abs.toLocaleString('en-US',{minimumFractionDigits:c.dec,maximumFractionDigits:c.dec}):Math.round(abs).toLocaleString();
  return`${sign}${c.sym}${v}`;
}
// 外貨は円換算の目安を添えて表示
// 画面表示用: 先頭の通貨記号を小さくする
const symSmall=str=>String(str).replace(/^(-?)([¥$₩])/,'$1<span class="cur">$2</span>');
// 支払いごとの円換算のレート（記録したときのレートで固定。古い記録は今のレート）
function expRate(e){const c=normCurrency(e.currency);if(c==='JPY')return 1;const r=Number(e.rate);return r>0&&isFinite(r)?r:yenPer(c);}
const expYen=e=>Number(e.amount||0)*expRate(e);
const rateNow=c=>c==='JPY'?undefined:Math.round(yenPer(c)*10000)/10000;
function fmtMoney(code,n,rate){
  code=normCurrency(code);
  const s=symSmall(fmtPlain(code,n));
  if(code==='JPY')return s;
  const r=rate||yenPer(code);
  if(!r||!isFinite(r)||r<=0)return s;
  return`${s}<span class="estimate">(≈${fmtPlain('JPY',Number(n||0)*r)})</span>`;
}
const roundCur=(code,n)=>{const f=10**CUR[normCurrency(code)].dec;return Math.round(n*f)/f;};
// 支払いに使われている通貨（なければ円）
function usedCurrencies(){
  const set=new Set((expenses||[]).map(e=>normCurrency(e.currency)));
  const list=CURRENCIES.filter(c=>set.has(c.code));
  return list.length?list:[CUR.JPY];
}

/* ===== トースト ===== */
// 先頭の絵文字 → アイコン
const TOAST_ICONS={
  ok:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  warn:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5h.01"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  cloud:'<path d="M7 18a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.5A3.8 3.8 0 0 1 17.5 18z"/>',
  sync:'<path d="M20 11a8 8 0 0 0-14.3-4.3L4 9M4 4v5h5M4 13a8 8 0 0 0 14.3 4.3L20 15M20 20v-5h-5"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
  party:'<path d="M4 20l5-14 9 9z"/><path d="M14 4v2M19 9h2M17 6l1.5-1.5"/>',
};
const EMOJI_ICON=[[/^✅\s*/,'ok'],[/^⚠️?\s*/,'warn'],[/^🗑️?\s*/,'trash'],[/^✏️?\s*/,'edit'],[/^☁️?\s*/,'cloud'],[/^🔄\s*/,'sync'],[/^📋\s*/,'copy'],[/^🎉\s*/,'party']];
const iconSvg=(k,cls='ti')=>`<svg class="${cls} ${k}" viewBox="0 0 24 24" aria-hidden="true">${TOAST_ICONS[k]}</svg>`;
function splitIcon(msg){
  msg=String(msg??'');
  for(const[re,k]of EMOJI_ICON)if(re.test(msg))return{k,text:msg.replace(re,'')};
  return{k:null,text:msg};
}
function showToast(msg='OK'){
  const t=document.getElementById('toast'),{k,text}=splitIcon(msg);
  t.innerHTML=(k?iconSvg(k):'')+`<span>${esc(text)}</span>`;t.classList.add('show');
  clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.remove('show'),1600);
}

/* ===== アプリ風ダイアログ（prompt の代わり） ===== */
let _dlgResolve=null;
function _openDlg({title,message='',input=false,value='',placeholder='',choices=null,current=null,okText='OK',inputType='text',list=false}){
  return new Promise(resolve=>{
    if(_dlgResolve)_dlgResolve(null);
    _dlgResolve=resolve;
    const $=id=>document.getElementById(id);
    $('dlgTitle').textContent=title||'';
    $('dlgMsg').textContent=message;$('dlgMsg').style.display=message?'block':'none';
    const inp=$('dlgInput');inp.style.display=input?'block':'none';inp.type=inputType;inp.value=value;inp.placeholder=placeholder;
    const ch=$('dlgChoices');ch.innerHTML='';ch.style.display=choices?'grid':'none';ch.classList.toggle('list',!!list);
    let picked=current;
    (choices||[]).forEach((label,i)=>{
      const b=document.createElement('button');b.type='button';
      // 「見出し\n説明」の形なら、説明を小さく出す
      const [head,...rest]=String(label).split('\n');
      if(rest.length){b.innerHTML=`<b>${esc(head)}</b><small>${esc(rest.join(' '))}</small>`;}else b.textContent=label;
      if(i===current)b.classList.add('active');
      b.onclick=()=>{picked=i;finish(i);};
      ch.appendChild(b);
    });
    const ok=$('dlgOk');ok.textContent=okText;ok.style.display=choices?'none':'block';
    const finish=v=>{$('dlgOverlay').classList.remove('active');inp.onkeydown=null;const r=_dlgResolve;_dlgResolve=null;if(r)r(v);};
    ok.onclick=()=>finish(input?inp.value:true);
    $('dlgCancel').onclick=()=>finish(null);
    inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();finish(inp.value);}};
    $('dlgOverlay').classList.add('active');
    if(input)setTimeout(()=>{inp.focus();inp.select();},50);
  });
}
const appPrompt=(title,opts={})=>_openDlg({...opts,title,input:true});
const appChoose=(title,choices,opts={})=>_openDlg({...opts,title,choices});

/* ===== 確認ダイアログ ===== */
let _confirmResolve=null;
function openConfirm(title,msg,opts={}){
  return new Promise(resolve=>{
    _confirmResolve=resolve;
    document.getElementById('confirmTitle').textContent=title;
    document.getElementById('confirmMsg').textContent=msg;
    const okb=document.getElementById('confirmOkBtn');okb.textContent=opts.okText||'削除';okb.classList.toggle('safe',!!opts.safe);
    document.getElementById('confirmOkBtn').onclick=()=>{
      document.getElementById('confirmOverlay').classList.remove('active');
      _confirmResolve=null;
      resolve(true);
    };
    document.getElementById('confirmOverlay').classList.add('active');
  });
}
function closeConfirm(){
  document.getElementById('confirmOverlay').classList.remove('active');
  if(_confirmResolve){_confirmResolve(false);_confirmResolve=null;}
}

/* ===== 為替レート ===== */
let _rateEditCode='USD';
function toggleRateEdit(code){
  code=code==='KRW'?'KRW':'USD';
  const row=document.getElementById('rateEditRow'),inp=document.getElementById('rateInput');
  if(row.classList.contains('visible')&&_rateEditCode===code){cancelRateEdit();return;}
  _rateEditCode=code;
  document.getElementById('rateEditLabel').textContent=code==='KRW'?'₩100 = ¥':'$1 = ¥';
  inp.placeholder=code==='KRW'?'例: 11':'例: 150';
  inp.value=code==='KRW'?krwRate:exchangeRate;row.classList.add('visible');inp.focus();inp.select();
}
function cancelRateEdit(){document.getElementById('rateEditRow').classList.remove('visible');}
function applyRate(){
  const min=_rateEditCode==='KRW'?0.01:1;
  const v=validateNum(document.getElementById('rateInput').value,min,1000);
  if(!v){showToast(`⚠ ${min}〜1000 の数値を入力してください`);return;}
  if(_rateEditCode==='KRW')krwRate=v;else exchangeRate=v;
  localStorage.setItem('rateUpdatedAt',new Date().toISOString());saveData();showRateDisplay(true);cancelRateEdit();updateDisplay();showToast('為替レートを更新しました');
}
// 無料の為替API（APIキー不要）。1つ目が失敗したら2つ目を試す
const RATE_SOURCES=[
  {url:'https://api.frankfurter.dev/v1/latest?base=JPY&symbols=USD,KRW',pick:j=>({rates:j.rates,date:j.date})},
  {url:'https://open.er-api.com/v6/latest/JPY',pick:j=>({rates:j.rates,date:j.time_last_update_unix?localDateStr(new Date(j.time_last_update_unix*1000)):''})},
];
// レートは平日に1日1回発表されるので、発表日を曜日つきで示す
function rateDateNote(date){
  if(!isDateStr(date))return'最新レートを取得しました';
  const when=date===todayStr()?'今日':fmtDay(date);
  return`${when}発表の最新レートです（平日に1日1回更新。土日・祝日や今日の発表前は、直前の平日の分になります）`;
}
async function fetchLatestRates(){
  const btn=document.getElementById('rateFetchBtn');
  if(btn){btn.disabled=true;btn.textContent='取得中...';}
  try{
    for(const src of RATE_SOURCES){
      try{
        const res=await fetch(src.url,{cache:'no-store'});
        if(!res.ok)continue;
        const {rates,date}=src.pick(await res.json());
        const usd=Number(rates?.USD),krw=Number(rates?.KRW);
        if(!(usd>0)||!(krw>0))continue;
        // APIは「1円 = 何ドル/何ウォン」なので逆数にする
        const newUsd=Math.round(100/usd)/100,newKrw=Math.round(10000/krw)/100;
        if(!validateNum(newUsd,1,1000)||!validateNum(newKrw,0.01,1000))continue;
        exchangeRate=newUsd;krwRate=newKrw;
        const stamp=new Date().toISOString();
        try{localStorage.setItem('rateUpdatedAt',stamp);}catch(e){}
        saveData();showRateDisplay(true);cancelRateEdit();updateDisplay();
        const t=document.getElementById('rateUpdatedText');if(t)t.textContent=rateDateNote(date);
        showToast('最新レートに更新しました');
        return;
      }catch(e){console.warn('rate fetch failed',src.url,e);}
    }
    showToast('⚠ レートを取得できませんでした');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='最新レートを取得';}
  }
}
// 空港の発着掲示板のような、1文字ずつの板で数字を表示する
function flapHTML(text,animate){
  return`<span class="flaps">${[...String(text)].map((ch,i)=>`<span class="flap${animate?' flip':''}"${animate?` style="animation-delay:${i*45}ms"`:''}>${esc(ch)}</span>`).join('')}</span>`;
}
function showRateDisplay(animate){
  const u=document.getElementById('rateText-USD');if(u)u.innerHTML=`<span class="rate-flag">USD</span><span class="rate-eq">$1 =</span>${flapHTML('¥'+exchangeRate.toFixed(2),animate)}`;
  const k=document.getElementById('rateText-KRW');if(k)k.innerHTML=`<span class="rate-flag">KRW</span><span class="rate-eq">₩100 =</span>${flapHTML('¥'+krwRate.toFixed(2),animate)}`;
}

/* ===== 日付・ID ===== */
const isDateStr=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
function localDateStr(d){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
const todayStr=()=>localDateStr(new Date());
function dateFromTimestamp(ts){const d=ts?new Date(ts):null;return d&&!isNaN(d)?localDateStr(d):'';}
function fmtDay(date){
  if(!isDateStr(date))return'日付なし';
  const [y,m,d]=date.split('-').map(Number),wd='日月火水木金土'[new Date(y,m-1,d).getDay()];
  return`${m}/${d}（${wd}）`;
}
function newExpenseId(){return'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
// IDのない古い支払いには、内容から決まるIDを振る（どの端末でも同じIDになるように）
function legacyExpenseId(e){
  const src=JSON.stringify([e.timestamp||'',e.name||'',e.amount,e.paidBy,e.currency||'']);
  let h=5381;for(let i=0;i<src.length;i++)h=((h*33)^src.charCodeAt(i))>>>0;
  return'x'+h.toString(36);
}

/* ===== データ正規化 ===== */
function normalizeData(input){
  const out={members:[''],expenses:[],deposits:[],exchangeRate,krwRate,settled:{},wallet:{on:false,ins:[],carry:[]}};
  if(!input||typeof input!=='object')return out;
  if(Array.isArray(input.members)){const m=input.members.slice(0,MAX_MEMBERS).map(x=>sanitize(x));out.members=m.length?m:[''];}
  const mLen=out.members.length;
  if(Array.isArray(input.expenses)){
    const seenIds=new Set();
    out.expenses=input.expenses.slice(0,MAX_EXPENSES).filter(e=>e&&typeof e==='object').map(e=>{
      const name=sanitize(e.name).trim(),amount=validateNum(e.amount),currency=normCurrency(e.currency);
      const paidBy=clampInt(e.paidBy,0,mLen-1);
      const participants=Array.isArray(e.participants)?[...new Set(e.participants.map(p=>clampInt(p,0,mLen-1)).filter(p=>p!==null))]:[];
      if(!name||amount===null||paidBy===null||participants.length===0)return null;
      const category=sanitize(e.category||'その他').trim()||'その他';
      const timestamp=typeof e.timestamp==='string'?e.timestamp:'';
      const date=isDateStr(e.date)?e.date:dateFromTimestamp(timestamp);
      let id=(typeof e.id==='string'&&/^[\w-]{1,40}$/.test(e.id))?e.id:legacyExpenseId(e);
      if(seenIds.has(id)){let n=2;while(seenIds.has(`${id}_${n}`))n++;id=`${id}_${n}`;}
      seenIds.add(id);
      const out_={id,name,amount,currency,category,date,paidBy,participants,timestamp};
      // 割り方（比率・金額指定）
      if(e.split&&typeof e.split==='object'&&(e.split.m==='ratio'||e.split.m==='amount')&&e.split.v&&typeof e.split.v==='object'){
        const v={};participants.forEach(p=>{const x=Number(e.split.v[p]);if(e.split.v[p]!=null&&e.split.v[p]!==''&&isFinite(x)&&x>=0&&x<=10000000)v[p]=x;});
        if(Object.keys(v).length)out_.split={m:e.split.m,v};
      }
      if(e.est===true)out_.est=true; // 概算（あとで確定額に直す）
      {const r=Number(e.rate);if(currency!=='JPY'&&isFinite(r)&&r>0&&r<100000)out_.rate=r;} // 記録したときの円換算レート
      if(e.wallet===true)out_.wallet=true; // 共有財布から払った
      // 先に精算した記録（その支払いだけ先に済にした送金）
      if(e.pre&&typeof e.pre==='object'&&e.pre.s&&typeof e.pre.s==='object'){
        const ps={};
        Object.keys(e.pre.s).forEach(k=>{const m=/^(\d+)>(\d+)>(JPY|USD|KRW)$/.exec(k),v=Number(e.pre.s[k]);if(m&&+m[1]<mLen&&+m[2]<mLen&&m[1]!==m[2]&&isFinite(v)&&v>0)ps[k]=v;});
        if(Object.keys(ps).length)out_.pre={d:isDateStr(e.pre.d)?e.pre.d:'',s:ps};
      }
      return out_;
    }).filter(Boolean);
  }
  // 共有財布
  if(input.wallet&&typeof input.wallet==='object'){
    const w=input.wallet,ids=new Set();
    out.wallet.on=w.on===true;
    if(Array.isArray(w.ins))out.wallet.ins=w.ins.slice(0,200).filter(x=>x&&typeof x==='object').map(x=>{
      const by=clampInt(x.by,0,mLen-1),amount=validateNum(x.amount);if(by===null||amount===null||amount<=0)return null;
      let id=typeof x.id==='string'&&/^[\w-]{1,40}$/.test(x.id)?x.id:'w'+Math.random().toString(36).slice(2,10);if(ids.has(id))return null;ids.add(id);
      return{id,by,amount,currency:normCurrency(x.currency),note:sanitize(x.note||'').trim().slice(0,40),date:isDateStr(x.date)?x.date:''};
    }).filter(Boolean);
    if(Array.isArray(w.carry))out.wallet.carry=w.carry.slice(0,50).filter(x=>x&&typeof x==='object'&&validateNum(x.amount)>0).map(x=>({name:sanitize(x.name||'').trim(),currency:normCurrency(x.currency),amount:validateNum(x.amount)}));
    if(out.wallet.ins.length||expensesUseWallet(out.expenses))out.wallet.on=true;
  }
  if(expensesUseWallet(out.expenses))out.wallet.on=true;
  if(Array.isArray(input.deposits)){
    out.deposits=input.deposits.slice(0,MAX_DEPOSITS).filter(d=>d&&typeof d==='object').map(d=>{
      const holder=clampInt(d.holder,0,mLen-1),from=clampInt(d.from,0,mLen-1),amount=validateNum(d.amount),currency=normCurrency(d.currency);
      if(holder===null||from===null||holder===from||!amount)return null;
      return{holder,from,amount,currency,timestamp:typeof d.timestamp==='string'?d.timestamp:''};
    }).filter(Boolean);
  }
  const r=validateNum(input.exchangeRate,1,1000);if(r)out.exchangeRate=r;
  const rk=validateNum(input.krwRate,0.01,1000);if(rk)out.krwRate=rk;
  if(input.settled&&typeof input.settled==='object'){
    Object.keys(input.settled).sort().forEach(k=>{
      const m=/^(\d+|W)>(\d+|W)>(JPY|USD|KRW)$/.exec(k),v=Number(input.settled[k]);
      const okI=x=>x==='W'||Number(x)<mLen;
      if(m&&m[1]!==m[2]&&okI(m[1])&&okI(m[2])&&isFinite(v)&&v>0)out.settled[k]=v;
    });
  }
  return out;
}

/* ===== 初期化 ===== */
if('serviceWorker' in navigator&&location.protocol==='https:'){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(e=>console.warn('sw',e));});
}
window.onload=async()=>{
  capturePendingJoin();
  loadCats();
  await initSupabaseApp();
};

function initAppViews(){
  if(!members.length)members=[''];
  renderPassRoute();
  renderTripName();
  ['expenseName','expenseAmount'].forEach(id=>{const el=document.getElementById(id);if(el&&!el.dataset.bound){el.dataset.bound='1';el.addEventListener('input',()=>{el.classList.remove('invalid');refreshFormHelpers();});}});
  const dateInput=document.getElementById('expenseDate');if(dateInput&&!dateInput.value)dateInput.value=todayStr();
  updateMemberSelects();updateMemberDisplay();updateFocusMemberSelect();showRateDisplay();
  updateSettCards();
  renderCatPicker();
  updateDisplay();
  const app=document.getElementById('appShell');if(app)app.style.display='block';
  const footer=document.getElementById('footerBar');if(footer)footer.style.display='flex';
}

/* ===== メンバー ===== */
/* ===== 設定タブ：一覧の行から開くシート ===== */
let _setOpen=null;
function openSetSheet(name){
  closeSetSheet(true);
  const blk=document.getElementById('setBlock-'+name);if(!blk)return;
  document.getElementById('setSheetTitle').textContent=blk.dataset.title||'';
  document.getElementById('setSheetBody').appendChild(blk);
  _setOpen=name;
  if(name==='wallet')renderWalletCard();
  if(name==='rate')showRateDisplay(true);
  if(name==='member')updateMemberDisplay();
  document.getElementById('setSheet').classList.add('active');
}
function closeSetSheet(silent){
  const body=document.getElementById('setSheetBody'),store=document.getElementById('setStore');
  if(body&&store)[...body.children].forEach(c=>store.appendChild(c));
  if(_setOpen==='member'&&document.getElementById('memberEdit').style.display!=='none')toggleMemberEdit();
  _setOpen=null;
  document.getElementById('setSheet')?.classList.remove('active');
  if(!silent)renderSettingsSummary();
}
// 一覧の右側に出す、今の状態
function renderSettingsSummary(){
  const set=(id,t)=>{const el=document.getElementById(id);if(el)el.textContent=t;};
  const f=AIRPORT[tripMeta.from],t=AIRPORT[tripMeta.to];
  set('sv-route',t?`${f?f.code:'---'} → ${t.code}${tripDatesText(tripMeta)?' · '+tripDatesText(tripMeta):''}`:'未設定');
  const names=members.filter(m=>String(m||'').trim());
  set('sv-members',names.length?names.join('・'):'未設定');
  const bal=walletBalance(),codes=CURRENCIES.filter(c=>bal[c.code]!=null);
  set('sv-wallet',!wallet.on?'使わない':codes.length?codes.map(c=>fmtPlain(c.code,bal[c.code])).join(' · '):'0');
  set('sv-rate',`$1=¥${Number(exchangeRate).toFixed(0)} · ₩100=¥${Number(krwRate).toFixed(1)}`);
  const tr=trips.find(x=>x.id===currentTripId);set('sv-name',tr?tr.name:'');
}
function toggleMemberEdit(){
  const edit=document.getElementById('memberEdit'),display=document.getElementById('memberDisplay'),btn=document.getElementById('toggleMemberBtn');
  // カードが閉じていたら開く
  const body=document.getElementById('cardMember');
  const header=body.previousElementSibling;
  if(header&&body.classList.contains('collapsed')){
    body.classList.remove('collapsed');
    const chev=header.querySelector('.card-chevron');
    if(chev)chev.classList.add('open');
  }
  if(edit.style.display==='none'){edit.style.display='block';display.style.display='none';btn.textContent='キャンセル';}
  else{edit.style.display='none';display.style.display='block';btn.textContent='編集';updateMemberDisplay();}
}
function saveMemberEdit(){
  document.getElementById('memberEdit').style.display='none';document.getElementById('memberDisplay').style.display='block';document.getElementById('toggleMemberBtn').textContent='編集';
  updateMemberDisplay();updateFocusMemberSelect();saveData();updateDisplay();
}
function updateMemberDisplay(){
  const d=document.getElementById('memberDisplay');
  if(members.every(m=>!m)){d.innerHTML='<p style="color:var(--muted);">メンバーを設定してください</p>';return;}
  d.innerHTML='';
  members.forEach((m,i)=>{if(m){const s=document.createElement('span');s.className='member-chip';s.innerHTML=avatar(i)+esc(m);d.appendChild(s);}});
}
function addMember(){if(members.length>=MAX_MEMBERS){showToast(`⚠ 最大${MAX_MEMBERS}人まで`);return;}members.push('');updateMemberList();updateMemberSelects();updateFocusMemberSelect();saveData();}
async function removeMember(i){
  if(members.length<=1){showToast('⚠ 最低1人必要です');return;}
  const used=expenses.filter(e=>(!e.wallet&&e.paidBy===i)||e.participants.includes(i)).length+(wallet.ins||[]).filter(x=>x.by===i).length;
  if(used){
    openInfoPopup('このメンバーは削除できません',`「${members[i]||`メンバー${i+1}`}」は支払い記録${used}件に含まれています。\n先に一覧タブで、その支払いを編集するか削除してください。`);
    return;
  }
  const ok=await openConfirm('メンバー削除',`「${members[i]||`メンバー${i+1}`}」を削除しますか？`);if(!ok)return;
  members.splice(i,1);
  expenses=(expenses||[]).map(e=>{
    if(!e||typeof e!=='object')return null;let paidBy=Number(e.paidBy);if(Number.isNaN(paidBy))paidBy=0;
    if(paidBy===i)paidBy=0;else if(paidBy>i)paidBy-=1;
    let pts=Array.isArray(e.participants)?e.participants.slice():[];
    pts=pts.map(p=>Number(p)).filter(p=>!Number.isNaN(p)&&p!==i).map(p=>p>i?p-1:p);
    pts=[...new Set(pts)].filter(p=>p>=0&&p<members.length);
    if(pts.length===0){if(paidBy>=0&&paidBy<members.length)pts=[paidBy];else return null;}
    paidBy=clampInt(paidBy,0,members.length-1)??0;
    let pre=e.pre;
    if(pre&&pre.s){const ps={};Object.keys(pre.s).forEach(k=>{const[f,t,c]=k.split('>');let a=+f,b=+t;if(a===i||b===i)return;if(a>i)a--;if(b>i)b--;ps[`${a}>${b}>${c}`]=pre.s[k];});pre=Object.keys(ps).length?{...pre,s:ps}:undefined;}
    const ne={...e,paidBy,participants:pts};if(pre)ne.pre=pre;else delete ne.pre;
    if(e.split&&e.split.v){const v={};Object.keys(e.split.v).forEach(k=>{let a=+k;if(a===i)return;if(a>i)a--;if(pts.includes(a))v[a]=e.split.v[k];});if(Object.keys(v).length)ne.split={...e.split,v};else delete ne.split;}
    return ne;
  }).filter(Boolean);
  deposits=(deposits||[]).map(d=>{
    if(!d||typeof d!=='object')return null;let holder=Number(d.holder),from=Number(d.from);
    if(Number.isNaN(holder)||Number.isNaN(from))return null;if(holder===i||from===i)return null;
    if(holder>i)holder-=1;if(from>i)from-=1;
    holder=clampInt(holder,0,members.length-1);from=clampInt(from,0,members.length-1);
    if(holder===null||from===null||holder===from)return null;return{...d,holder,from};
  }).filter(Boolean);
  const shifted={};
  Object.keys(settled).forEach(k=>{
    const [f,t,c]=k.split('>');
    const mv=x=>x==='W'?'W':(+x>i?String(+x-1):x);
    if(f===String(i)||t===String(i))return;
    shifted[`${mv(f)}>${mv(t)}>${c}`]=settled[k];
  });
  wallet={...wallet,ins:(wallet.ins||[]).filter(x=>x.by!==i).map(x=>x.by>i?{...x,by:x.by-1}:x)};
  settled=shifted;
  updateMemberList();updateMemberSelects();updateFocusMemberSelect();saveData();updateDisplay();
}
function updateMemberName(i,v){members[i]=sanitize(v);updateMemberSelects();updateFocusMemberSelect();saveData();updateDisplay();}
function updateMemberList(){
  const d=document.getElementById('memberList');d.innerHTML='';
  members.forEach((m,i)=>{
    const div=document.createElement('div');div.className='member-item';
    const seat=document.createElement('span');seat.className='seat-tag';seat.textContent=seatNo(i);div.appendChild(seat);
    const inp=document.createElement('input');inp.type='text';inp.value=m;inp.placeholder=`メンバー${i+1}`;inp.maxLength=50;inp.onchange=e=>updateMemberName(i,e.target.value);div.appendChild(inp);
    if(members.length>1){const btn=document.createElement('button');btn.textContent='削除';btn.onclick=()=>removeMember(i);div.appendChild(btn);}
    d.appendChild(div);
  });
}
function updateMemberSelects(){
  const prevPayer=document.getElementById('paidBy').value;
  const opts=[{v:'',t:'選択'},...members.map((m,i)=>({v:i,t:m||`メンバー${i+1}`})),{v:'W',t:'共有財布'}];
  ['paidBy'].forEach(id=>{
    const s=document.getElementById(id);s.innerHTML='';
    opts.forEach(o=>{const opt=document.createElement('option');opt.value=o.v;opt.textContent=sanitize(o.t);s.appendChild(opt);});
  });
  const pc=document.getElementById('participantsCheckbox');pc.innerHTML='';
  members.forEach((m,i)=>{
    const div=document.createElement('div');div.className='checkbox-item';
    const cb=document.createElement('input');cb.type='checkbox';cb.id=`participant${i}`;cb.value=i;cb.checked=true;
    const lbl=document.createElement('label');lbl.htmlFor=`participant${i}`;lbl.innerHTML=avatar(i)+esc(sanitize(m||`メンバー${i+1}`));
    cb.onchange=()=>refreshFormHelpers();
    div.onclick=e=>{if(e.target===div){cb.checked=!cb.checked;refreshFormHelpers();}};
    div.style.position='relative';
    div.appendChild(cb);div.appendChild(lbl);pc.appendChild(div);
  });
  const sel=document.getElementById('paidBy');
  sel.value=prevPayer==='W'&&wallet.on?'W':(prevPayer!==''&&Number(prevPayer)<members.length)?prevPayer:String(defaultPayer());
  refreshFormHelpers();
}

/* ===== 着陸の演出（全員の精算が終わったとき） ===== */
function playLanding(){
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ov=document.getElementById('landingOverlay');
  if(reduce||!ov){showToast('🎉 全員の精算が終わりました！');return;}
  const dest=AIRPORT[tripMeta.to];
  document.getElementById('landingDest').textContent=dest?`${dest.city}（${dest.code}）に着陸しました`:'無事に着陸しました';
  ov.classList.remove('play');void ov.offsetWidth;ov.classList.add('active','play');
  clearTimeout(window.__landT);window.__landT=setTimeout(()=>ov.classList.remove('active','play'),3200);
}
function closeLanding(){const ov=document.getElementById('landingOverlay');ov.classList.remove('active','play');}

/* ===== レシートが出てくる演出（支払いを追加したとき） ===== */
function printReceipt(name,amountHTML){
  try{
    if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const btn=document.getElementById('expenseSubmitBtn');const r=btn.getBoundingClientRect();
    const slip=document.createElement('div');slip.className='receipt-slip';
    slip.innerHTML=`<div class="rs-head">RECEIPT</div><div class="rs-row"><span>${esc(name)}</span><b>${amountHTML}</b></div><div class="rs-foot">${dayLabel(getFormDate())}</div>`;
    slip.style.left=(r.left+r.width/2)+'px';slip.style.top=(r.top+r.height-6)+'px';
    document.body.appendChild(slip);setTimeout(()=>slip.remove(),1900);
  }catch(e){}
}

/* ===== はじける星 ===== */
function sparkBurst(el,count=10,spread=60){
  try{
    if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    const primary=getComputedStyle(document.documentElement).getPropertyValue('--p').trim()||'#ff5a5f';
    const colors=[primary,'#e48aa8','#f2b84b','#9cb4cf','#5fb08e'];
    for(let k=0;k<count;k++){
      const sp=document.createElement('span');sp.className='spark';sp.textContent=k%3?'✦':'●';
      const ang=(Math.PI*2*k)/count+Math.random()*.5,dist=spread*(.6+Math.random()*.6);
      sp.style.cssText=`left:${cx}px;top:${cy}px;color:${colors[k%colors.length]};font-size:${k%3?14:7}px;--dx:${Math.cos(ang)*dist}px;--dy:${Math.sin(ang)*dist}px;--r:${Math.round(Math.random()*180)}deg`;
      document.body.appendChild(sp);setTimeout(()=>sp.remove(),800);
    }
  }catch(e){}
}

/* ===== 記録フォームの補助 ===== */
let _lastPayer=null;
// 支払った人の初期値: 自分 → 前回払った人
function defaultPayer(){
  const me=getMeIdx();
  if(me>=0)return me;
  if(_lastPayer!==null&&_lastPayer<members.length)return _lastPayer;
  return '';
}
function setPaidBy(v){
  document.getElementById('paidBy').value=String(v);
  document.getElementById('paidByChips').classList.remove('invalid');
  refreshFormHelpers();
}
function toggleAllParticipants(){
  const boxes=members.map((_,i)=>document.getElementById(`participant${i}`)).filter(Boolean);
  const allOn=boxes.every(b=>b.checked);
  boxes.forEach(b=>b.checked=!allOn);
  refreshFormHelpers();
}
function refreshFormHelpers(){
  renderDateChip();renderCurBtn();renderRateNote();
  // 支払った人チップ
  const chips=document.getElementById('paidByChips');
  if(chips){
    const cur=document.getElementById('paidBy').value;
    chips.innerHTML='';
    members.forEach((m,i)=>{
      const b=document.createElement('button');b.type='button';
      b.className='chip'+(cur===String(i)?' active':'');
      b.innerHTML=avatar(i)+esc(sanitize(m||`メンバー${i+1}`));
      b.onclick=()=>setPaidBy(i);
      chips.appendChild(b);
    });
    if(wallet.on){
      const b=document.createElement('button');b.type='button';
      b.className='chip chip-wallet'+(cur==='W'?' active':'');
      b.innerHTML=avatar(walletIdx())+'財布';b.setAttribute('aria-label','共有財布');
      b.onclick=()=>setPaidBy('W');
      chips.appendChild(b);
    }
  }
  // 参加者チップの見た目・全員ボタン
  const boxes=members.map((_,i)=>document.getElementById(`participant${i}`)).filter(Boolean);
  boxes.forEach(b=>b.parentElement.classList.toggle('on',b.checked));
  const n=boxes.filter(b=>b.checked).length;
  if(n)document.getElementById('participantsCheckbox').classList.remove('invalid');
  const tBtn=document.getElementById('toggleAllBtn');if(tBtn)tBtn.textContent=n===boxes.length?'全員を外す':'全員を選択';
  // 割り方と1人あたりの金額
  renderSplitInputs();
  updateSplitPreview();
  // メンバー未登録の案内
  const hint=document.getElementById('setupHint');
  if(hint)hint.classList.toggle('show',members.every(m=>!m));
}
/* ===== 共有財布 ===== */
function expensesUseWallet(list){return(list||[]).some(e=>e&&e.wallet===true);}
const walletIdx=()=>members.length;           // 計算のときだけ使う「財布」の番号（メンバーの次）
const isWallet=i=>i===members.length;
const payerOf=e=>e.wallet?walletIdx():e.paidBy;
// 名前（財布にも対応）
const pname=i=>isWallet(i)?'共有財布':(String(members[i]||'').trim()||`メンバー${i+1}`);
// 送金のキーでは、財布を W と書く（メンバーが増えても番号がずれないように）
const encIdx=i=>isWallet(i)?'W':String(i);
const decIdx=x=>x==='W'?walletIdx():Number(x);
// 財布の残高（通貨ごと）＝入れたお金 − 財布から払ったお金
function walletBalance(){
  const b={};
  (wallet.ins||[]).forEach(x=>{b[x.currency]=(b[x.currency]||0)+x.amount;});
  expenses.filter(e=>e.wallet).forEach(e=>{const c=normCurrency(e.currency);b[c]=(b[c]||0)-e.amount;});
  return b;
}
function renderWalletCard(){
  const box=document.getElementById('walletBody');if(!box)return;
  if(!wallet.on){
    box.innerHTML=`<p class="small wal-intro">現金をみんなで出し合う「共有財布」を使うときにオンにします。財布から払った支払いも、財布の残りを誰にいくら返すかも、自動で計算します。</p>
      <button class="btn btn-primary" onclick="setWalletOn(true)">共有財布を使う</button>`;
    return;
  }
  const bal=walletBalance(),codes=CURRENCIES.filter(c=>bal[c.code]!=null);
  const balHTML=codes.length?codes.map(c=>`<div class="wal-bal${bal[c.code]<0?' neg':''}"><span>${c.label}</span><b>${fmtMoney(c.code,bal[c.code])}</b></div>`).join(''):'<div class="small">まだお金が入っていません</div>';
  const ins=(wallet.ins||[]).map(x=>`<div class="wal-in">${avatar(x.by)}<span class="wal-in-name">${memberName(x.by)}${x.note?`<small>${safe(x.note)}</small>`:''}</span><b>${fmtPlain(x.currency,x.amount)}</b><button onclick="removeWalletIn('${esc(x.id)}')" aria-label="削除">×</button></div>`).join('');
  const memOpts=members.map((m,i)=>`<option value="${i}">${memberName(i)}</option>`).join('');
  const curOpts=CURRENCIES.map(c=>`<option value="${c.code}"${c.code===(codes[0]?.code||'KRW')?' selected':''}>${c.label}</option>`).join('');
  box.innerHTML=`
    <div class="wal-head"><span class="wal-ic">${avatar(walletIdx())}</span><div class="wal-bals">${balHTML}</div></div>
    <div class="wal-sub">財布に入れたお金</div>
    <div class="wal-ins">${ins||'<div class="small" style="padding:4px 2px;">まだありません</div>'}</div>
    <div class="wal-form">
      <div class="wal-row"><select id="walBy"><option value="all">全員で均等に</option>${memOpts}</select><select id="walCur">${curOpts}</select></div>
      <div class="wal-row"><input type="number" id="walAmt" inputmode="decimal" min="0" step="any" placeholder="金額（全員の合計）"><input type="text" id="walNote" maxlength="40" placeholder="メモ（例: 前回の残り）"></div>
      <button class="btn btn-primary" onclick="addWalletIn()">財布に入れる</button>
    </div>
    <div class="action-buttons settings-grid wal-actions">
      <button class="btn-export" onclick="importCarry()">前の旅行の残りを引き継ぐ</button>
      <button class="btn-export" onclick="carryOver()">残りを次の旅行に持ち越す</button>
    </div>
    <p class="small wal-help">記録タブの「支払った人」で「共有財布」を選ぶと、財布から払った支払いになります。</p>
    ${expensesUseWallet(expenses)||(wallet.ins||[]).length?'':'<button class="wal-off" onclick="setWalletOn(false)">共有財布を使わない</button>'}`;
  const by=document.getElementById('walBy'),amt=document.getElementById('walAmt');
  by.onchange=()=>{amt.placeholder=by.value==='all'?'金額（全員の合計）':'金額';};
}
function setWalletOn(on){
  if(!on&&(expensesUseWallet(expenses)||(wallet.ins||[]).length)){showToast('⚠ 財布の記録があるので、オフにできません');return;}
  wallet={...wallet,on:!!on};saveData();updateDisplay();renderWalletCard();
}
function addWalletIn(){
  const by=document.getElementById('walBy').value,cur=normCurrency(document.getElementById('walCur').value);
  const amt=validateNum(document.getElementById('walAmt').value),note=sanitize(document.getElementById('walNote').value).trim().slice(0,40);
  if(!amt||amt<=0){showToast('⚠ 金額を入れてください');return;}
  const who=by==='all'?members.map((_,i)=>i).filter(i=>String(members[i]||'').trim()):[clampInt(Number(by),0,members.length-1)];
  if(!who.length||who[0]===null){showToast('⚠ メンバーを登録してください');return;}
  const each=amt/who.length,date=todayStr();
  wallet={...wallet,on:true,ins:[...(wallet.ins||[]),...who.map(i=>({id:'w'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),by:i,amount:each,currency:cur,note,date}))]};
  saveData();updateDisplay();renderWalletCard();
  showToast(`✅ 財布に ${fmtPlain(cur,amt)} 入れました`);
}
async function removeWalletIn(id){
  const x=(wallet.ins||[]).find(v=>v.id===id);if(!x)return;
  const ok=await openConfirm('財布の記録を削除',`${pname(x.by)} の ${fmtPlain(x.currency,x.amount)} を削除しますか？`);if(!ok)return;
  wallet={...wallet,ins:wallet.ins.filter(v=>v.id!==id)};saveData();updateDisplay();renderWalletCard();
}
// 財布の残りを次の旅行に持ち越す：財布から返す分を「済」にし、誰の分がいくらかを記録する
async function carryOver(){
  const rows=getSettlementTx().filter(t=>!t.paid&&isWallet(t.from));
  if(!rows.length){showToast('持ち越す残りはありません');return;}
  const lines=rows.map(t=>`${pname(t.to)}  ${fmtPlain(t.code,t.amount)}`).join('\n');
  const ok=await openConfirm('残りを次の旅行に持ち越す',`財布の残りを、取り出さずに次の旅行へ持ち越します。\n\n${lines}\n\n精算タブの「共有財布 → 人」の行は「済」になります。次の旅行の共有財布で「前の旅行の残りを引き継ぐ」を押すと、この金額がそのまま入ります。`,{okText:'持ち越す',safe:true});
  if(!ok)return;
  rows.forEach(t=>{const k=settleKey(t);settled[k]=(Number(settled[k])||0)+t.amount;});
  wallet={...wallet,carry:rows.map(t=>({name:pname(t.to),currency:t.code,amount:t.amount}))};
  saveData();updateDisplay();renderWalletCard();showToast('✅ 残りを持ち越しにしました');
}
// 前の旅行で持ち越した残りを、この旅行の財布に入れる
async function importCarry(){
  let rows=[];
  if(sb&&currentUser){
    const {data,error}=await sb.from('trips').select('id,name,updated_at,carry:data_json->wallet->carry').order('updated_at',{ascending:false});
    if(!error&&Array.isArray(data))rows=data.filter(r=>r.id!==currentTripId&&Array.isArray(r.carry)&&r.carry.length);
  }
  if(!rows.length){
    openInfoPopup('引き継げる残りがありません','前の旅行の設定タブで「残りを次の旅行に持ち越す」を押すと、ここで引き継げます。\n前の旅行がこのアプリにない場合は、「財布に入れる」で「前回の残り」と入れてください（全員で均等に入れることもできます）。');
    return;
  }
  const k=await appChoose('どの旅行の残りを引き継ぎますか？',rows.map(r=>r.name));
  const r=k==null?null:rows[k];if(!r)return;
  const tag=`${r.name}の残り`.slice(0,40);
  if((wallet.ins||[]).some(x=>x.note===tag)){showToast(`⚠ 「${r.name}」の残りはもう引き継いでいます`);return;}
  const ins=[],miss=[];
  r.carry.forEach(c=>{
    const i=members.findIndex(m=>String(m||'').trim()===String(c.name||'').trim());
    const amount=validateNum(c.amount);if(!amount)return;
    if(i<0){miss.push(c.name);return;}
    ins.push({id:'w'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),by:i,amount,currency:normCurrency(c.currency),note:tag,date:todayStr()});
  });
  if(!ins.length){showToast('⚠ 同じ名前のメンバーがいません');return;}
  wallet={...wallet,on:true,ins:[...(wallet.ins||[]),...ins]};
  saveData();updateDisplay();renderWalletCard();
  showToast(`✅ 「${r.name}」の残りを引き継ぎました`);
  if(miss.length)openInfoPopup('一部のメンバーが見つかりませんでした',`${miss.join('、')} の分は入れていません。メンバー名をそろえてから、もう一度試すか、手で入れてください。`);
}
/* ===== 割り方（均等・比率・金額指定） ===== */
let _splitMode='equal',_splitVals={},_splitSig='';
function checkedParticipants(){return members.map((_,i)=>i).filter(i=>document.getElementById(`participant${i}`)?.checked);}
function setSplitMode(m){_splitMode=m;_splitSig='';renderSplitInputs();updateSplitPreview();}
const SPLIT_LABEL={equal:'均等',ratio:'比率',amount:'金額を指定'};
async function chooseSplitMode(){
  const keys=['equal','ratio','amount'];
  const k=await appChoose('割り方',['均等に割る\nみんな同じ金額','比率で割る\n例: 2：1：1 のように倍率で','金額を指定する\n入れた人はその額、空欄の人は残りを均等に'],{current:keys.indexOf(_splitMode),list:true});
  if(k!=null)setSplitMode(keys[k]);
}
function renderSplitInputs(){
  document.querySelectorAll('#splitMode button').forEach(b=>b.classList.toggle('active',b.dataset.m===_splitMode));
  const sl=document.getElementById('splitLink');if(sl){sl.textContent=`${SPLIT_LABEL[_splitMode]} ▾`;sl.classList.toggle('on',_splitMode!=='equal');}
  const box=document.getElementById('splitInputs');if(!box)return;
  const ps=checkedParticipants(),sig=_splitMode+'|'+ps.join(',')+'|'+currentCurrency;
  if(sig===_splitSig)return;_splitSig=sig;
  if(_splitMode==='equal'||!ps.length){box.innerHTML='';box.style.display='none';return;}
  box.style.display='grid';
  const unit=_splitMode==='ratio'?'×':CUR[currentCurrency]?.sym||'';
  box.innerHTML=ps.map(i=>`<label class="si-row">${avatar(i)}<span class="si-name">${memberName(i)}</span>
    <span class="si-unit">${esc(unit)}</span><input type="number" inputmode="decimal" min="0" step="any" data-i="${i}" value="${esc(_splitVals[i]??'')}" placeholder="${_splitMode==='ratio'?'1':'残りを均等'}" oninput="_splitVals[this.dataset.i]=this.value;updateSplitPreview()"></label>`).join('');
}
// 入力中の割り方（均等なら null）
function formSplit(){
  if(_splitMode==='equal')return null;
  const v={};checkedParticipants().forEach(i=>{const raw=_splitVals[i];if(raw==null||raw==='')return;const x=Number(raw);if(isFinite(x)&&x>=0)v[i]=x;});
  return Object.keys(v).length?{m:_splitMode,v}:null;
}
function updateSplitPreview(){
  const pv=document.getElementById('splitPreview');if(!pv)return;
  const ps=checkedParticipants(),n=ps.length,amt=validateNum(document.getElementById('expenseAmount').value);
  pv.classList.remove('bad');
  if(!n){pv.innerHTML='割り勘する人を選んでください';return;}
  const sp=formSplit();
  if(!sp){pv.innerHTML=amt?`${n}人で割り勘 → 1人あたり <b>${fmtMoney(currentCurrency,amt/n)}</b>`:`${n}人で割り勘`;return;}
  if(!amt){pv.innerHTML=_splitMode==='ratio'?'比率で割ります（空欄は1）':'金額を入れた人はその額、空欄の人は残りを均等に割ります';return;}
  const err=splitError({amount:amt,participants:ps,split:sp});
  if(err){pv.classList.add('bad');pv.innerHTML=err;return;}
  pv.innerHTML=sharesOf({amount:amt,participants:ps,split:sp}).map(([i,v])=>`${memberName(i)} <b>${fmtMoney(currentCurrency,v)}</b>`).join('　');
}
function splitError(e){
  if(!e.split)return'';
  if(e.split.m==='ratio'){const W=e.participants.reduce((a,p)=>a+(e.split.v[p]??1),0);return W>0?'':'比率の合計が0です';}
  const fixed=e.participants.filter(p=>e.split.v[p]!=null),fsum=fixed.reduce((a,p)=>a+e.split.v[p],0);
  if(fsum>e.amount+0.005)return`指定した金額の合計（${fmtPlain(currentCurrency,fsum)}）が支払額を超えています`;
  if(fixed.length===e.participants.length&&Math.abs(fsum-e.amount)>0.005)return`全員の金額の合計（${fmtPlain(currentCurrency,fsum)}）が支払額と合っていません`;
  return'';
}
/* ===== 概算（カード払いで金額があとで変わるもの） ===== */
let _estOn=false;
function toggleEst(on){_estOn=on===undefined?!_estOn:!!on;const b=document.getElementById('estToggle');if(b){b.classList.toggle('on',_estOn);b.setAttribute('aria-pressed',String(_estOn));b.textContent=_estOn?'概算 ✓':'概算';}}
// 入力漏れの欄を光らせて知らせる
function validateExpenseForm(){
  const nameEl=document.getElementById('expenseName'),amtEl=document.getElementById('expenseAmount');
  const checks=[
    [!sanitize(nameEl.value).trim(),nameEl,'項目名を入力してください'],
    [validateNum(amtEl.value)===null,amtEl,'金額を入力してください'],
    [document.getElementById('paidBy').value!=='W'&&isNaN(parseInt(document.getElementById('paidBy').value)),document.getElementById('paidByChips'),'支払った人を選んでください'],
    [!members.some((_,i)=>document.getElementById(`participant${i}`)?.checked),document.getElementById('participantsCheckbox'),'割り勘する人を選んでください'],
  ];
  checks.forEach(([bad,el])=>el.classList.toggle('invalid',bad));
  const first=checks.find(c=>c[0]);
  if(first){
    showToast('⚠ '+first[2]);
    if(first[1].tagName==='INPUT')first[1].focus();
    else first[1].scrollIntoView({behavior:'smooth',block:'center'});
    return false;
  }
  return true;
}
function goToMemberSetup(){
  showTab('settings');openSetSheet('member');
  if(document.getElementById('memberEdit').style.display==='none')toggleMemberEdit();
  const first=document.querySelector('#memberList input');if(first)first.focus();
}
// 現在の選択状態を保持
let _focusMemberIdx = 0;

function updateFocusMemberSelect(){
  const grid=document.getElementById('focusMemberBtns');
  if(!grid) return;
  grid.innerHTML='';
  // 「全員」ボタン

  // 各メンバーボタン
  members.forEach((m,i)=>{
    if(!m&&members.length===1) return;
    const btn=document.createElement('button');
    btn.className='member-btn' + (_focusMemberIdx===i?' active':'');
    btn.innerHTML=avatar(i)+esc(sanitize(m||`メンバー${i+1}`));
    btn.onclick=()=>{ _focusMemberIdx=i; updateFocusMemberSelect(); renderPersonalViews(); };
    grid.appendChild(btn);
  });
}

/* ===== 通貨 ===== */
// 外貨のとき、金額欄の下に円換算と使うレートを出す
function renderRateNote(){
  const el=document.getElementById('rateNote');if(!el)return;
  const c=currentCurrency;if(c==='JPY'){el.textContent='';el.style.display='none';return;}
  const ed=editingExpenseIdx>=0?expenses[editingExpenseIdx]:null;
  const r=ed&&normCurrency(ed.currency)===c&&Number(ed.rate)>0?Number(ed.rate):yenPer(c);
  const amt=validateNum(document.getElementById('expenseAmount').value);
  const unit=c==='KRW'?`₩100=¥${(r*100).toFixed(2)}`:`$1=¥${r.toFixed(2)}`;
  el.style.display='block';
  el.textContent=`${amt?`≈${fmtPlain('JPY',amt*r)}　`:''}${unit} で円換算（このレートで固定）`;
}
// 金額欄の通貨ボタン：押すたびに ¥ → ₩ → $ → ¥
const CUR_CYCLE=['JPY','KRW','USD'];
function cycleCurrency(){setCurrency(CUR_CYCLE[(CUR_CYCLE.indexOf(currentCurrency)+1)%CUR_CYCLE.length]);}
function renderCurBtn(){const b=document.getElementById('curBtn');if(b){const c=CUR[currentCurrency];b.innerHTML=`<b>${c.sym}</b><small>${c.label}</small>`;}}
// 日付のボタン：今日なら「今日」、ほかは「10/7（水）」
function renderDateChip(){
  const v=document.getElementById('expenseDate')?.value,t=document.getElementById('dateChipText');if(!t)return;
  t.textContent=!v||v===todayStr()?'今日':fmtDay(v);
  document.getElementById('dateChip').classList.toggle('on',!!v&&v!==todayStr());
}
function setCurrency(c){currentCurrency=normCurrency(c);renderCurBtn();document.querySelectorAll('#expenseCurrencyToggle .currency-btn').forEach(b=>b.classList.toggle('active',b.dataset.cur===currentCurrency));refreshFormHelpers();}


/* ===== カテゴリ ===== */
let _cats = [...DEFAULT_CATEGORIES];
let _currentCat = _cats[0];

function saveCats(){try{localStorage.setItem('warikanCats',JSON.stringify(_cats));}catch(e){}}
function loadCats(){
  // Supabase版では、初期カテゴリは旅行データ内の categories を優先する。
  // 端末に残った古いlocalStorageカテゴリは、新規旅行へ自動反映しない。
  _cats=[...DEFAULT_CATEGORIES];
  _currentCat=FALLBACK_CAT;
}

function renderCatPicker(){
  const picker=document.getElementById('catPicker');
  if(!picker)return;
  const prevScroll=picker.scrollLeft;
  picker.innerHTML='';
  _cats.forEach(cat=>{
    const btn=document.createElement('button');
    btn.type='button';btn.className='cat-btn'+(_currentCat===cat?' active':'');
    btn.innerHTML=catLabelHTML(cat);btn.dataset.cat=cat;btn.style.cssText=catStyle(cat);
    btn.onclick=()=>{_currentCat=cat;renderCatPicker();};
    picker.appendChild(btn);
  });
  picker.scrollLeft=prevScroll;
  const a=picker.querySelector('.cat-btn.active');
  if(a){
    const left=a.offsetLeft-picker.offsetLeft,right=left+a.offsetWidth;
    if(left<picker.scrollLeft||right>picker.scrollLeft+picker.clientWidth)picker.scrollLeft=Math.max(0,right-picker.clientWidth+8);
  }
}

function setCatPicker(cat){
  if(!_cats.includes(cat))_cats.push(cat);
  _currentCat=cat;renderCatPicker();
}
function resetCatPicker(){
  _currentCat=_cats[0]||'その他';renderCatPicker();
}

/* カテゴリ管理モーダル */
function openCatManager(){
  renderCatManageList();_newCatIcon=null;renderNewCatIcon();
  document.getElementById('catModalOverlay').classList.add('active');
}
function closeCatManager(){
  document.getElementById('catModalOverlay').classList.remove('active');
  saveCats();saveData();renderCatPicker();
}
function renderCatManageList(){
  const list=document.getElementById('catManageList');
  list.innerHTML='';
  _cats.forEach((cat,i)=>{
    const usedCount=expenses.filter(e=>(e.category||'その他')===cat).length;
    const div=document.createElement('div');div.className='cat-manage-item';
    // 上下ボタン
    const upBtn=document.createElement('button');upBtn.className='cat-manage-move';upBtn.innerHTML='<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>';upBtn.setAttribute('aria-label','上へ');upBtn.disabled=i===0;
    upBtn.onclick=()=>{[_cats[i-1],_cats[i]]=[_cats[i],_cats[i-1]];renderCatManageList();};
    const downBtn=document.createElement('button');downBtn.className='cat-manage-move';downBtn.innerHTML='<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';downBtn.setAttribute('aria-label','下へ');downBtn.disabled=i===_cats.length-1;
    downBtn.onclick=()=>{[_cats[i],_cats[i+1]]=[_cats[i+1],_cats[i]];renderCatManageList();};
    // 名前入力
    // カテゴリのアイコン（カテゴリの色の丸）
    const ic=document.createElement('button');ic.type='button';ic.className='cat-manage-ic';ic.setAttribute('aria-label','アイコンを選ぶ');ic.style.cssText=catStyle(cat);ic.innerHTML=catIconSvg(cat)+'<i class="cat-ic-edit"></i>';
    ic.onclick=()=>openIconPicker(_cats[i],k=>{catIcons[_cats[i]]=k;saveData();renderCatManageList();renderCatPicker();updateDisplay();});
    // 名前入力（先頭の絵文字は表示しない。名前を書き換えたときだけ保存し直す）
    const inp=document.createElement('input');inp.type='text';inp.value=catText(cat);inp.maxLength=30;
    inp.oninput=()=>{const v=inp.value.trim()||cat;ic.style.cssText=catStyle(v);ic.innerHTML=(catIcons[cat]?catIconSvg(cat):iconSvgByKey(autoIconKey(v)))+'<i class="cat-ic-edit"></i>';};
    inp.onchange=e=>{
      const newVal=e.target.value.trim();
      if(!newVal){showToast('⚠ 空にはできません');inp.value=catText(cat);return;}
      if(newVal===catText(cat))return;
      if(_cats.includes(newVal)){showToast('⚠ 同じ名前のカテゴリがあります');inp.value=catText(cat);return;}
      expenses.forEach(ex=>{if(ex.category===_cats[i])ex.category=newVal;});
      if(_currentCat===_cats[i])_currentCat=newVal;
      if(catIcons[_cats[i]]){catIcons[newVal]=catIcons[_cats[i]];delete catIcons[_cats[i]];}
      _cats[i]=newVal;saveData();
    };
    // 削除ボタン（使用中なら警告付き）
    const del=document.createElement('button');del.className='cat-manage-del';
    del.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'+(usedCount>0?`<span>${usedCount}件</span>`:'');del.setAttribute('aria-label','削除');
    del.onclick=async()=>{
      if(_cats.length<=1){showToast('⚠ 最低1つ必要です');return;}
      if(usedCount>0){
        const ok=await openConfirm('カテゴリを削除',`「${catText(cat)}」は${usedCount}件の支出で使用中です。削除すると「その他」に変更されます。`);
        if(!ok)return;
        expenses.forEach(ex=>{if(ex.category===cat)ex.category='その他';});
        if(!_cats.includes('その他')&&!_cats.filter((_,j)=>j!==i).includes('その他')){}
        saveData();
      }
      delete catIcons[cat];
      _cats.splice(i,1);
      if(_currentCat===cat)_currentCat=_cats[0];
      renderCatManageList();
    };
    div.appendChild(ic);div.appendChild(inp);div.appendChild(upBtn);div.appendChild(downBtn);div.appendChild(del);
    list.appendChild(div);
  });
}
let _newCatIcon=null;
function renderNewCatIcon(){
  const b=document.getElementById('catAddIcon');if(!b)return;
  const v=document.getElementById('catAddInput').value.trim()||'新しいカテゴリ';
  b.style.cssText=catStyle(v);
  b.innerHTML=iconSvgByKey(_newCatIcon||autoIconKey(v))+'<i class="cat-ic-edit"></i>';
}
function pickNewCatIcon(){
  const v=document.getElementById('catAddInput').value.trim()||'新しいカテゴリ';
  openIconPicker(v,k=>{_newCatIcon=k;renderNewCatIcon();},_newCatIcon||autoIconKey(v));
}
/* ===== アイコンを選ぶシート ===== */
let _iconPickCb=null;
function openIconPicker(cat,cb,current){
  _iconPickCb=cb;
  const cur=current||catIconKey(cat);
  document.getElementById('iconPickTitle').textContent=`「${catText(cat)}」のアイコン`;
  const grid=document.getElementById('iconPickGrid');grid.style.cssText=catStyle(cat);
  grid.innerHTML=CAT_ICON_KEYS.map(k=>`<button type="button" class="icon-pick${k===cur?' active':''}" onclick="chooseIcon('${k}')">${iconSvgByKey(k)}</button>`).join('');
  document.getElementById('iconPickOverlay').classList.add('active');
}
function chooseIcon(k){
  document.getElementById('iconPickOverlay').classList.remove('active');
  const cb=_iconPickCb;_iconPickCb=null;if(cb)cb(k);
}
function closeIconPicker(){document.getElementById('iconPickOverlay').classList.remove('active');_iconPickCb=null;}
function addCatFromModal(){
  const inp=document.getElementById('catAddInput');
  const val=inp.value.trim();
  if(!val){showToast('⚠ カテゴリ名を入力してください');return;}
  if(_cats.includes(val)){showToast('⚠ 既に存在します');return;}
  _cats.push(val);inp.value='';
  if(_newCatIcon)catIcons[val]=_newCatIcon;
  _newCatIcon=null;renderNewCatIcon();saveData();
  renderCatManageList();renderCatPicker();showToast(`✅ 「${val}」を追加しました`);
}

/* ===== 支出 CRUD ===== */
/* ===== 支出 CRUD ===== */
/* ===== よく使う項目 ===== */
// この旅行で何度も使った項目（回数→新しさの順）。少ないときは定番で埋める
// [項目名, 入れたいカテゴリのアイコン（前から順に探す）]
const QUICK_PRESETS=[['タクシー',['car','train']],['コンビニ',['cart','bag']],['カフェ',['cafe','meal']],['ランチ',['meal']],['夕食',['meal']],['地下鉄',['train']]];
// 項目名から選ぶアイコン（当てはまらなければカテゴリのアイコン）
const ITEM_ICON_RULES=[
  [/カフェ|コーヒー|珈琲|スタバ|ラテ|ティー|紅茶/,'cafe'],[/ケーキ|スイーツ|アイス|パン|ドーナツ|かき氷|ホットク|デザート/,'sweets'],
  [/ビール|酒|ワイン|バー|居酒屋|マッコリ|ソジュ|飲み会/,'drink'],
  [/朝食|朝ご|昼食|ランチ|夕食|夜ご|ディナー|ご飯|ごはん|焼肉|サムギョプサル|ラーメン|寿司|レストラン|食堂|弁当/,'meal'],
  [/タクシー|レンタカー|ガソリン|駐車|Uber|カカオT/i,'car'],[/バス|リムジン/,'bus'],[/電車|地下鉄|鉄道|新幹線|AREX|メトロ|T-?money|交通カード/i,'train'],
  [/飛行機|航空|フライト|空港/,'plane'],[/船|フェリー|クルーズ/,'ship'],[/自転車|サイクル/,'bike'],
  [/ホテル|宿|旅館|民泊|Airbnb/i,'bed'],[/温泉|サウナ|スパ|チムジルバン|マッサージ|エステ/,'onsen'],
  [/コンビニ|スーパー|マート|ドラッグ/,'cart'],[/お土産|土産|ギフト|プレゼント/,'gift'],[/服|洋服|靴|帽子/,'shirt'],
  [/コスメ|化粧|オリーブヤング|パック/,'cosme'],[/チケット|入場|ツアー|パス/,'ticket'],[/写真|プリクラ|カメラ|フォト/,'camera'],
  [/カラオケ|ライブ|コンサート|ミュージカル/,'music'],[/薬|病院|クリニック/,'medical'],[/Wi-?Fi|SIM|ワイファイ/i,'wifi'],
  [/両替|ATM|手数料/i,'coin'],[/傘/,'umbrella'],[/山|ハイキング|登山/,'mountain'],[/ビーチ|海/,'sun'],
];
function itemIconKey(name,cat){const n=String(name||'');const hit=ITEM_ICON_RULES.find(([re])=>re.test(n));return hit?hit[1]:catIconKey(cat||FALLBACK_CAT);}
const itemIconSvg=(name,cat)=>iconSvgByKey(itemIconKey(name,cat));
function quickItems(){
  const map=new Map();
  expenses.forEach((e,i)=>{
    const key=String(e.name||'').trim();if(!key)return;
    const cur=map.get(key)||{name:key,count:0,last:-1,e:null};
    cur.count++;cur.last=i;cur.e=e;map.set(key,cur);
  });
  const list=[...map.values()].sort((a,b)=>b.count-a.count||b.last-a.last).slice(0,8);
  for(const[name,icons]of QUICK_PRESETS){
    if(list.length>=6)break;
    if(map.has(name))continue;
    let cat=FALLBACK_CAT;
    for(const ic of icons){const c=_cats.find(c=>catIconKey(c)===ic);if(c){cat=c;break;}}
    list.push({name,count:0,e:null,cat});
  }
  return list;
}
function renderQuickRow(){
  const row=document.getElementById('quickRow');if(!row)return;
  if(editingExpenseIdx>=0||!members.some(m=>String(m||'').trim())){row.innerHTML='';row.style.display='none';return;}
  const items=quickItems();
  row.style.display=items.length?'flex':'none';
  row.innerHTML=items.map((q,k)=>`<button type="button" class="quick-chip${q.count?'':' preset'}" onclick="applyQuick(${k})">${itemIconSvg(q.name,q.e?q.e.category:q.cat)}${safe(q.name)}</button>`).join('');
  row._items=items;
}
// 金額以外（項目名・カテゴリ・通貨・割り勘する人）を前回と同じにする
function applyQuick(k){
  const q=(document.getElementById('quickRow')._items||[])[k];if(!q)return;
  document.getElementById('expenseName').value=q.name;
  document.getElementById('expenseName').classList.remove('invalid');
  if(q.e){
    const cat=q.e.category||FALLBACK_CAT;setCatPicker(_cats.includes(cat)?cat:FALLBACK_CAT);
    setCurrency(q.e.currency);
    const parts=new Set((q.e.participants||[]).filter(i=>i<members.length));
    members.forEach((_,i)=>{const cb=document.getElementById(`participant${i}`);if(cb)cb.checked=parts.size?parts.has(i):true;});
  }else setCatPicker(q.cat);
  refreshFormHelpers();
  const amt=document.getElementById('expenseAmount');amt.focus();
  document.querySelectorAll('#quickRow .quick-chip').forEach((b,i)=>b.classList.toggle('active',i===k));
}
/* ===== この支払いだけ先に精算 ===== */
// 先に精算できる支払い（財布払い以外で、支払った人のほかに参加者がいるもの）
const canPre=e=>!e.wallet&&e.participants.some(p=>p!==e.paidBy);
// その支払いで、先に精算した人数 / 対象の人数
function preProgress(e){const all=Object.keys(preShares(e)),done=all.filter(k=>e.pre&&e.pre.s&&k in e.pre.s);return{done:done.length,all:all.length};}
let _preId=null;
function openPreSheet(id){_preId=id||null;renderPreSheet();document.getElementById('preSheet').classList.add('active');}
function closePreSheet(){
  if(_preId){_preId=null;renderPreSheet();return;} // 詳しい画面からは一覧に戻る
  document.getElementById('preSheet').classList.remove('active');
}
function renderPreSheet(){
  const body=document.getElementById('preSheetBody'),title=document.getElementById('preSheetTitle'),back=document.getElementById('preSheetBack');
  if(!body)return;
  const e=_preId?expenses.find(x=>x.id===_preId):null;
  if(!e){
    _preId=null;title.textContent='どの支払いを先に精算しますか？';back.textContent='閉じる';
    const list=expenses.filter(canPre).slice().reverse();
    body.innerHTML=list.length?list.map(x=>{
      const pr=preProgress(x),st=pr.done===0?'':pr.done===pr.all?'<span class="pre-st done">先に精算済み</span>':`<span class="pre-st">${pr.done}/${pr.all}人 済</span>`;
      return`<button type="button" class="pre-item" onclick="openPreSheet('${esc(x.id)}')"><span class="item-ic">${itemIconSvg(x.name,x.category)}</span><span class="pre-main"><b>${safe(x.name)}</b><small>${memberName(x.paidBy)}が支払い · ${shortDay(x.date)}</small></span><span class="pre-amt">${fmtPlain(normCurrency(x.currency),x.amount)}${st}</span></button>`;
    }).join(''):'<p class="small" style="text-align:center;padding:16px;">先に精算できる支払いがありません</p>';
    return;
  }
  title.textContent=e.name;back.textContent='‹ 支払いの一覧に戻る';
  const c=normCurrency(e.currency),sh=preShares(e),keys=Object.keys(sh);
  const n=e.participants.length;
  body.innerHTML=`<div class="pre-head">${fmtPlain(c,e.amount)}<small>${memberName(e.paidBy)}が支払い · ${e.split?(e.split.m==='ratio'?'比率で':'金額指定で'):`${n}人で均等に`}割り勘</small></div>
    <p class="small pre-help">払い終わった人から「済にする」を押してください。精算タブの送金から差し引かれます。</p>
    ${keys.map(k=>{
      const [f,t]=k.split('>').map(Number),done=!!(e.pre&&e.pre.s&&k in e.pre.s);
      return`<div class="pre-row${done?' done':''}"><span class="pre-who">${avatar(f)}<b>${memberName(f)}</b><i>→</i>${avatar(t)}<b>${memberName(t)}</b></span><span class="pre-v">${fmtPlain(c,sh[k])}</span><button type="button" onclick="togglePreKey('${esc(e.id)}','${k}')">${done?'✓ 済':'済にする'}</button></div>`;
    }).join('')}`;
}
// 1人ずつ「済」にする・取り消す
function togglePreKey(id,k){
  const i=expenses.findIndex(x=>x.id===id);if(i<0)return;
  const e=expenses[i],sh=preShares(e);if(!(k in sh))return;
  const cur={...((e.pre&&e.pre.s)||{})},ne={...e};
  if(k in cur){addSettled({[k]:cur[k]},-1);delete cur[k];showToast('「済」を取り消しました');}
  else{cur[k]=sh[k];addSettled({[k]:sh[k]},1);showToast('✅ 済にしました');}
  if(Object.keys(cur).length)ne.pre={d:(e.pre&&e.pre.d)||todayStr(),s:cur};else delete ne.pre;
  expenses[i]=ne;markSeen(ne);
  saveData();updateDisplay();renderMeBar();renderPreSheet();
  if(!(k in (e.pre?.s||{})))afterSettleChange(true);
}
// 支払った人以外の各メンバーが、支払った人に自分の分を払う送金
function preShares(e){
  const c=normCurrency(e.currency),s={};
  sharesOf(e).forEach(([p,v])=>{if(p!==e.paidBy&&v>0)s[`${p}>${e.paidBy}>${c}`]=(s[`${p}>${e.paidBy}>${c}`]||0)+v;});
  return s;
}
function renderPresettleBtn(){
  const b=document.getElementById('presettleBtn');if(!b)return;
  const e=editingExpenseIdx>=0?expenses[editingExpenseIdx]:null;
  const can=false; // 先に精算は精算タブの「支払いごとに先に精算する」から
  b.style.display='none';
  if(!can)return;
  b.classList.toggle('on',!!e.pre);
  // どの送金になるかを1行で（例：あやか・みさき → みゆ 各¥60,470）
  const s=e.pre?e.pre.s:preShares(e),keys=Object.keys(s);
  const code=keys[0]?.split('>')[2]||normCurrency(e.currency);
  const froms=keys.map(k=>pname(Number(k.split('>')[0])));
  const vals=keys.map(k=>s[k]),same=vals.every(v=>roundCur(code,v)===roundCur(code,vals[0]));
  const flow=keys.length?(same?`${froms.join('・')} → ${pname(e.paidBy)}　${keys.length>1?'各':''}${fmtPlain(code,vals[0])}`
    :`${keys.map((k,j)=>`${froms[j]} ${fmtPlain(code,vals[j])}`).join('・')} → ${pname(e.paidBy)}`):'';
  b.innerHTML=e.pre
    ?`<span class="ps-ic">${iconSvg('ok')}</span><span class="ps-txt"><b>先に精算済み${e.pre.d?`（${shortDay(e.pre.d)}）`:''}</b><small>${esc(flow)}</small></span><span class="ps-act">取り消す</span>`
    :`<span class="ps-ic">${iconSvg('sync')}</span><span class="ps-txt"><b>この支払いだけ先に精算</b><small>${esc(flow)}</small></span><span class="ps-act">精算する ›</span>`;
}
function addSettled(map,sign){
  Object.keys(map).forEach(k=>{
    const v=(Number(settled[k])||0)+sign*map[k];
    if(v>0.005)settled[k]=v;else delete settled[k];
  });
}
async function togglePresettle(){
  const i=editingExpenseIdx,e=expenses[i];if(!e)return;
  if(e.pre){
    const ok=await openConfirm('先に精算を取り消す',`「${e.name}」の先に精算した分を、まだ払っていない状態に戻しますか？`,{okText:'取り消す'});if(!ok||expenses[i]!==e)return;
    addSettled(e.pre.s,-1);
    const ne={...expenses[i]};delete ne.pre;expenses[i]=ne;
    saveData();updateDisplay();renderMeBar();renderPresettleBtn();showToast('先に精算を取り消しました');
    return;
  }
  const s=preShares(e);
  const lines=Object.keys(s).map(k=>{const[f,t,c]=k.split('>');return`${members[+f]||`メンバー${+f+1}`} → ${members[+t]||`メンバー${+t+1}`}  ${fmtPlain(c,s[k])}`;}).join('\n');
  const ok=await openConfirm('この支払いだけ先に精算',`「${e.name}」の分を、次の送金で先に精算します。\n\n${lines}\n\nこの送金は精算タブで「済」になり、残りの精算から差し引かれます。`,{okText:'先に精算する',safe:true});
  if(!ok||expenses[i]!==e)return;
  addSettled(s,1);
  expenses[i]={...e,pre:{d:todayStr(),s}};
  markSeen(expenses[i]);
  saveData();updateDisplay();renderMeBar();renderPresettleBtn();
  showToast(`✅ 「${e.name}」を先に精算しました`);
  afterSettleChange(true);
}
function submitExpense(){editingExpenseIdx>=0?updateExpense():addExpense();}
function addExpense(){
  if(expenses.length>=MAX_EXPENSES){showToast(`⚠ 最大${MAX_EXPENSES}件まで`);return;}
  const name=sanitize(document.getElementById('expenseName').value).trim(),amt=validateNum(document.getElementById('expenseAmount').value),fromWallet=document.getElementById('paidBy').value==='W',paidBy=fromWallet?0:parseInt(document.getElementById('paidBy').value);
  if(!validateExpenseForm())return;
  const parts=[];members.forEach((_,i)=>{const cb=document.getElementById(`participant${i}`);if(cb&&cb.checked)parts.push(i);});
  if(!parts.length){showToast('⚠ 参加者を選択してください');return;}
  if(!fromWallet)_lastPayer=paidBy;
  const ne={id:newExpenseId(),name,amount:amt,currency:currentCurrency,category:_currentCat||'その他',date:getFormDate(),paidBy,participants:[...new Set(parts)],timestamp:new Date().toISOString()};
  const sp=formSplit();if(sp){ne.split=sp;const err=splitError(ne);if(err){showToast('⚠ '+err);return;}}
  if(_estOn)ne.est=true;
  if(fromWallet)ne.wallet=true;
  if(currentCurrency!=='JPY')ne.rate=rateNow(currentCurrency);
  expenses.push(ne);
  markSeen(expenses[expenses.length-1]);
  printReceipt(name,fmtMoney(currentCurrency,amt));
  clearExpenseForm();saveData();updateDisplay();showToast('✅ 支払いを追加しました');
}
function startEditExpense(i){
  const e=expenses[i];editingExpenseIdx=i;
  document.getElementById('expenseName').value=e.name;document.getElementById('expenseAmount').value=e.amount;document.getElementById('paidBy').value=(e.wallet?'W':String(e.paidBy));
  document.getElementById('expenseDate').value=e.date||'';
  setCurrency(e.currency);setCatPicker(e.category||FALLBACK_CAT);members.forEach((_,j)=>{const cb=document.getElementById(`participant${j}`);if(cb)cb.checked=e.participants.includes(j);});
  _splitMode=e.split?e.split.m:'equal';_splitVals=e.split?Object.fromEntries(Object.entries(e.split.v).map(([k,v])=>[k,String(v)])):{};_splitSig='';
  toggleEst(!!e.est);
  document.getElementById('expenseSubmitBtn').textContent='更新';document.getElementById('expenseEditBanner').classList.add('visible');
  renderPresettleBtn();
  refreshFormHelpers();renderQuickRow();
  showTab('add');showToast('✏️ 支払いを編集中');
}
function updateExpense(){
  const name=sanitize(document.getElementById('expenseName').value).trim(),amt=validateNum(document.getElementById('expenseAmount').value),fromWallet=document.getElementById('paidBy').value==='W',paidBy=fromWallet?0:parseInt(document.getElementById('paidBy').value);
  if(!validateExpenseForm())return;
  const parts=[];members.forEach((_,i)=>{const cb=document.getElementById(`participant${i}`);if(cb&&cb.checked)parts.push(i);});
  if(!parts.length){showToast('⚠ 参加者を選択してください');return;}
  const ue={...expenses[editingExpenseIdx],name,amount:amt,currency:currentCurrency,category:_currentCat||'その他',date:getFormDate(),paidBy,participants:[...new Set(parts)]};
  const sp=formSplit();if(sp){ue.split=sp;const err=splitError(ue);if(err){showToast('⚠ '+err);return;}}else delete ue.split;
  if(_estOn)ue.est=true;else delete ue.est;
  const old=expenses[editingExpenseIdx];
  if(currentCurrency==='JPY')delete ue.rate;
  else if(normCurrency(old.currency)!==currentCurrency||!(Number(old.rate)>0))ue.rate=rateNow(currentCurrency);
  if(fromWallet)ue.wallet=true;else delete ue.wallet;
  if(ue.pre){
    addSettled(ue.pre.s,-1);
    if(ue.wallet){delete ue.pre;showToast('財布から払った支払いにしたので、先に精算を取り消しました');}
    else{const s2=preShares(ue);if(Object.keys(s2).length){addSettled(s2,1);ue.pre={...ue.pre,s:s2};}else delete ue.pre;}
  }
  expenses[editingExpenseIdx]=ue;
  markSeen(expenses[editingExpenseIdx]);
  clearExpenseForm();saveData();updateDisplay();showToast('✅ 支払いを更新しました');
}
function getFormDate(){const v=document.getElementById('expenseDate').value;return isDateStr(v)?v:todayStr();}
function cancelEditExpense(){clearExpenseForm();showToast('編集をキャンセルしました');}
function clearExpenseForm(){
  // 編集が終わったら日付は今日に戻す（続けて追加するときは前回の日付のまま）
  if(editingExpenseIdx>=0)document.getElementById('expenseDate').value=todayStr();
  editingExpenseIdx=-1;document.getElementById('expenseName').value='';document.getElementById('expenseAmount').value='';document.getElementById('paidBy').value='';
  members.forEach((_,i)=>{const cb=document.getElementById(`participant${i}`);if(cb)cb.checked=true;});
  _splitMode='equal';_splitVals={};_splitSig='';toggleEst(false);
  document.getElementById('expenseSubmitBtn').textContent='追加';document.getElementById('expenseEditBanner').classList.remove('visible');
  renderPresettleBtn();resetCatPicker();setCatPicker(FALLBACK_CAT);
  document.querySelectorAll('#cardExpense .invalid').forEach(el=>el.classList.remove('invalid'));
  document.getElementById('paidBy').value=String(defaultPayer());
  refreshFormHelpers();renderQuickRow();
}
async function deleteExpense(i){
  const ok=await openConfirm('支払いを削除',`「${expenses[i].name}」を削除しますか？`);if(!ok)return;
  if(editingExpenseIdx===i)clearExpenseForm();else if(editingExpenseIdx>i)editingExpenseIdx--;
  const wasEditing=document.querySelector('.tab-panel.active')?.dataset.tab==='add';
  const removed=expenses[i];
  if(removed.pre)addSettled(removed.pre.s,-1);
  expenses.splice(i,1);saveData();updateDisplay();
  const undoTrip=currentTripId;
  showUndo(`「${removed.name}」を削除しました`,()=>{
    if(currentTripId!==undoTrip||expenses.some(x=>x.id===removed.id))return;
    const pos=Math.min(i,expenses.length);
    expenses.splice(pos,0,removed);
    if(editingExpenseIdx>=pos)editingExpenseIdx++;
    if(removed.pre)addSettled(removed.pre.s,1);
    markSeen(removed);saveData();updateDisplay();renderMeBar();showToast('✅ 元に戻しました');
  });
  if(wasEditing)showTab('list');
}
/* ===== 元に戻す（数秒だけ出るバー） ===== */
let _undoFn=null,_undoTimer=null;
function showUndo(msg,fn){
  const bar=document.getElementById('undoBar');if(!bar){fn=null;return;}
  _undoFn=fn;document.getElementById('undoMsg').textContent=msg;
  bar.classList.add('show');clearTimeout(_undoTimer);_undoTimer=setTimeout(hideUndo,6000);
}
function hideUndo(){clearTimeout(_undoTimer);_undoFn=null;document.getElementById('undoBar')?.classList.remove('show');}
function doUndo(){const f=_undoFn;hideUndo();if(f)f();}
let _listMode='date';
try{const m=localStorage.getItem('warikanListMode');if(m==='date'||m==='cat')_listMode=m;}catch(e){}
function setListMode(mode){
  _listMode=mode==='cat'?'cat':'date';
  try{localStorage.setItem('warikanListMode',_listMode);}catch(e){}
  displayExpenses();
}
let _estOnly=false;
function toggleEstOnly(){_estOnly=!_estOnly;displayExpenses();}
function displayExpenses(){
  document.querySelectorAll('#listModeToggle button').forEach(b=>b.classList.toggle('active',b.dataset.mode===_listMode));
  const l=document.getElementById('expenseList');
  if(!expenses.length){l.innerHTML='<div class="empty-state"><p>まだ記録がありません</p></div>';return;}
  const estN=expenses.filter(e=>e.est).length;
  if(!estN)_estOnly=false;
  const estBar=estN?`<button class="est-bar${_estOnly?' on':''}" onclick="toggleEstOnly()"><b>確定待ち ${estN}件</b><span>${_estOnly?'すべて表示に戻す':'カード払いの確定額を確認して直してください · 表示'}</span></button>`:'';
  const groupMap={},byDate=_listMode==='date';
  expenses.forEach((e,i)=>{
    if(_estOnly&&!e.est)return;
    const key=byDate?(e.date||''):(e.category||'その他');
    if(!groupMap[key])groupMap[key]={key,items:[]};
    groupMap[key].items.push({e,i});
  });
  let keys;
  if(byDate){
    // 新しい日付が上。日付なしは最後
    keys=Object.keys(groupMap).sort((a,b)=>!a?1:!b?-1:b.localeCompare(a));
  }else{
    // _catsの順番通りに並べ、未登録カテゴリは末尾に
    keys=[..._cats,...Object.keys(groupMap).filter(c=>!_cats.includes(c))].filter(c=>groupMap[c]);
  }
  let html='';
  keys.forEach((key,gi)=>{
    const g=groupMap[key];
    if(byDate)g.items.reverse(); // 同じ日の中では新しく追加したものが上
    const tot={};
    let yenTot=0;g.items.forEach(({e})=>{ const c=normCurrency(e.currency); tot[c]=(tot[c]||0)+e.amount; yenTot+=expYen(e); });
    const totParts=CURRENCIES.filter(c=>tot[c.code]>0).map(c=>fmtPlain(c.code,tot[c.code]));
    const totStr=totParts.length>1?`≈${fmtPlain('JPY',yenTot)}`:(totParts[0]||'¥0');
    const label=byDate?dayLabel(key):key;
    const gid=`catg_${gi}`;
    html+=`<div class="cat-group"><div class="cat-group-header" onclick="toggleCatGroup('${gid}',this)"><span style="display:flex;align-items:center;gap:8px;"><span class="cat-group-toggle open">▶</span><span class="cat-group-label"${byDate?'':` style="${catStyle(label)}"`}>${byDate?safe(label):catLabelHTML(label)}</span></span><span class="cat-group-total">${totStr}</span></div><div class="cat-group-body" id="${gid}">`;
    g.items.forEach(({e,i})=>{
      const nm=safe(e.name),paid=safe(pname(payerOf(e)));
      const parts=e.participants.map(idx=>safe(members[idx]||`メンバー${idx+1}`)).join(', ');
      const amt=fmtMoney(e.currency,e.amount,expRate(e));
      const sub=byDate?catLabelHTML(e.category||'その他'):fmtDay(e.date);
      const who=e.participants.length===members.length?`全員（${e.participants.length}人）`:parts;
      const isEd=editingExpenseIdx===i,fresh=_fresh.get(e.id);
      const freshTag=fresh?`<span class="fresh-tag">${fresh==='new'?'NEW':'更新'}</span>`:'';
      html+=`<div class="expense-item${isEd?' is-editing':''}${fresh?' is-fresh':''}"><div class="expense-color-bar"></div><div class="expense-body" onclick="startEditExpense(${i})"><div class="expense-header"><div class="expense-title">${freshTag}<span class="item-ic">${itemIconSvg(e.name,e.category)}</span>${nm}</div><div class="expense-amount">${amt}</div></div><div class="expense-meta"><span class="expense-meta-chip${e.wallet?' wal':''}"><b>${paid}</b> ${e.wallet?'から':'が支払い'}</span><span class="expense-meta-chip">${who}${e.split?(e.split.m==='ratio'?' · 比率':' · 金額指定'):''}</span>${e.est?'<span class="expense-meta-chip est">概算</span>':''}${e.pre?(()=>{const pr=preProgress(e);return`<span class="expense-meta-chip pre">${pr.done>=pr.all?'先に精算済み':`先に精算 ${pr.done}/${pr.all}人`}</span>`;})():''}<span class="expense-meta-chip${byDate?' cat':''}"${byDate?` style="${catStyle(e.category||'その他')}"`:''}>${sub}</span></div></div><div class="expense-actions"><button class="expense-action-edit" onclick="startEditExpense(${i})">編集</button><button class="expense-action-delete" onclick="deleteExpense(${i})">削除</button></div></div>`;
    });
    html+='</div></div>';
  });
  l.innerHTML=estBar+html+'<div class="list-hint">支払いをタップすると編集・削除できます</div>';
}
function calculateExpenseBalances(){
  const b={};CURRENCIES.forEach(c=>b[c.code]=Array(members.length+1).fill(0)); // 最後は共有財布
  expenses.forEach(e=>{const arr=b[normCurrency(e.currency)];arr[payerOf(e)]+=e.amount;sharesOf(e).forEach(([idx,v])=>arr[idx]-=v);});
  (wallet.ins||[]).forEach(x=>{const arr=b[x.currency];arr[x.by]+=x.amount;arr[walletIdx()]-=x.amount;});
  return b;
}

// 1人ずつの負担額 [[メンバー, 金額], ...]（比率・金額指定にも対応）
function sharesOf(e){
  const ps=e.participants,n=ps.length,sp=e.split;
  if(sp&&sp.m==='ratio'&&sp.v){
    const w=ps.map(p=>{const v=Number(sp.v[p]);return isFinite(v)&&v>=0?v:1;}),W=w.reduce((a,b)=>a+b,0);
    if(W>0)return ps.map((p,k)=>[p,e.amount*w[k]/W]);
  }
  if(sp&&sp.m==='amount'&&sp.v){
    const fixed=ps.filter(p=>sp.v[p]!=null&&isFinite(Number(sp.v[p])));
    const fsum=fixed.reduce((a,p)=>a+Number(sp.v[p]),0),rest=ps.filter(p=>!fixed.includes(p)),remain=e.amount-fsum;
    if(remain>-0.01&&(rest.length||Math.abs(remain)<0.01))return ps.map(p=>[p,fixed.includes(p)?Number(sp.v[p]):Math.max(0,remain)/rest.length]);
  }
  return ps.map(p=>[p,e.amount/n]);
}
function calculateSettlementTransactions(b){
  const t=[],c=[],d=[];
  b.forEach((bal,i)=>{if(bal>0.01)c.push({idx:i,amount:bal});else if(bal<-0.01)d.push({idx:i,amount:-bal});});
  let i=0,j=0;
  while(i<c.length&&j<d.length){const cr=c[i],db=d[j],a=Math.min(cr.amount,db.amount);t.push({from:db.idx,to:cr.idx,amount:a});cr.amount-=a;db.amount-=a;if(cr.amount<0.01)i++;if(db.amount<0.01)j++;}
  return t;
}
function buildDirectMatrix(includeDeposits){
  const n=members.length+1,m={}; // 最後は共有財布
  CURRENCIES.forEach(c=>m[c.code]=Array.from({length:n},()=>Array(n).fill(0)));
  expenses.forEach(e=>{const mat=m[normCurrency(e.currency)],pb=payerOf(e);sharesOf(e).forEach(([idx,v])=>{if(idx!==pb)mat[idx][pb]+=v;});});
  (wallet.ins||[]).forEach(x=>{m[x.currency][walletIdx()][x.by]+=x.amount;}); // 財布は入れた人に借りがある
  if(includeDeposits)deposits.forEach(d=>{const mat=m[normCurrency(d.currency)];if(d.holder!==d.from)mat[d.holder][d.from]+=d.amount;});
  return m;
}
function netMatrix(mat){
  const n=mat.length,tx=[];
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=mat[i][j]||0,b=mat[j][i]||0,diff=a-b;if(Math.abs(diff)<0.01)continue;diff>0?tx.push({from:i,to:j,amount:diff}):tx.push({from:j,to:i,amount:-diff});}
  return tx;
}
function txToPayRecv(tx){const n=members.length+1,pay=Array(n).fill(0),recv=Array(n).fill(0);tx.forEach(t=>{pay[t.from]+=t.amount;recv[t.to]+=t.amount;});return{pay,recv};}
function updateSettCards(){
  ['direct','min'].forEach(m=>{
    const el=document.getElementById(`settCard-${m}`);
    if(el) el.classList.toggle('active', m===settlementMode);
  });
}
function setSettlementMode(mode){
  settlementMode=mode==='min'?'min':'direct';try{localStorage.setItem('settlementMode',settlementMode);}catch(e){}
  updateSettCards();updateDisplay();
}

// 済にした送金（実際に払ったお金）
function paidTransfers(){
  const out=[];
  Object.keys(settled||{}).forEach(k=>{
    const m=/^(\d+|W)>(\d+|W)>(JPY|USD|KRW)$/.exec(k),v=Number(settled[k]);
    if(!m||!isFinite(v)||v<=0)return;
    const f=decIdx(m[1]),t=decIdx(m[2]);
    if(f!==t&&f<=walletIdx()&&t<=walletIdx())out.push({from:f,to:t,code:m[3],amount:v,paid:true});
  });
  return out;
}
// A→B→C→A のように一周する送金は、いちばん小さい額だけ全員分を減らして消す
function cancelCycles(tx){
  tx=tx.map(t=>({...t}));
  for(let guard=0;guard<100;guard++){
    const live=tx.filter(t=>t.amount>0.01);
    let cycle=null;
    const dfs=(node,path,seen)=>{
      for(const e of live.filter(t=>t.from===node)){
        const k=path.findIndex(p=>p.from===e.to);
        if(k>=0){cycle=[...path.slice(k),e];return true;}
        if(seen.has(e.to))continue;
        seen.add(e.to);
        if(dfs(e.to,[...path,e],seen))return true;
      }
      return false;
    };
    for(const t of live){if(dfs(t.from,[],new Set([t.from])))break;}
    if(!cycle)break;
    const m=Math.min(...cycle.map(e=>e.amount));
    cycle.forEach(e=>e.amount-=m);
  }
  return tx.filter(t=>t.amount>0.01);
}
// 送金リスト（通貨ごと）。済にした送金はそのまま「済」として残し、
// 残りの貸し借りだけを今の精算のしかたで計算する（しかたを変えても済は消えない）
function getSettlementTx(){
  const paid=paidTransfers();
  const mat=settlementMode==='direct'?buildDirectMatrix(false):null;
  const bal=mat?null:calculateExpenseBalances();
  paid.forEach(p=>{
    if(mat)mat[p.code][p.to][p.from]+=p.amount; // 払った分は、受け取った人から払った人への借りとして相殺
    else{bal[p.code][p.from]+=p.amount;bal[p.code][p.to]-=p.amount;}
  });
  const list=[...paid];
  CURRENCIES.forEach(c=>{
    const hasPaid=paid.some(p=>p.code===c.code);
    // 払った分を相殺すると、人をまたいでぐるっと回る送金ができることがあるので、その分を打ち消す
    (mat?(hasPaid?cancelCycles(netMatrix(mat[c.code])):netMatrix(mat[c.code])):calculateSettlementTransactions(bal[c.code]))
      .filter(t=>roundCur(c.code,t.amount)>0)
      .forEach(t=>list.push({...t,code:c.code,paid:false}));
  });
  // 人の順に並べる（済にしても行の位置があまり動かないように）
  const ci=c=>CURRENCIES.findIndex(x=>x.code===c);
  return list.sort((a,b)=>a.from-b.from||a.to-b.to||ci(a.code)-ci(b.code)||(b.paid-a.paid));
}
const settleKey=t=>`${encIdx(t.from)}>${encIdx(t.to)}>${t.code}`;
// done: 済 / open: まだ
const settleState=t=>t.paid?'done':'open';
// 旅行がまだ終わっていない（出発前・旅行中）
function tripNotOver(today=todayStr()){return!!tripMeta.start&&today<=(tripMeta.end||tripMeta.start);}
// 済が変わったあと：全部済になったら、旅行が終わっていれば着陸、途中なら控えめに知らせる
function afterSettleChange(byUser){
  const txs=getSettlementTx();
  if(!byUser||!txs.length||!txs.every(t=>settleState(t)==='done'))return;
  if(tripNotOver())announce('ここまでの精算が完了しました。旅の続きを楽しんでください');
  else playLanding();
}
/* ===== 済にしたとき、チケットの半券がパキッと切り離される ===== */
function prepareTear(btn){
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stub=btn.closest('.sett-stub'),item=btn.closest('.settlement-item');
  if(reduce||!stub||!item)return null;
  const ir=item.getBoundingClientRect(),sr=stub.getBoundingClientRect();
  // 半券の部分（点線から右端まで）を写し取る
  const piece=document.createElement('div');piece.className='tear-piece';
  const w=ir.right-sr.left;
  Object.assign(piece.style,{left:sr.left+'px',top:ir.top+'px',width:w+'px',height:ir.height+'px'});
  const b=btn.cloneNode(true);b.removeAttribute('onclick');b.className='sett-done-btn';
  piece.appendChild(b);
  // 左の辺をギザギザにする
  const n=Math.max(6,Math.round(ir.height/9)),pts=['100% 0','100% 100%'];
  for(let i=n;i>=0;i--)pts.push(`${i%2?3:0}px ${(i/n*100).toFixed(1)}%`);
  piece.style.clipPath=`polygon(${pts.join(',')})`;
  return piece;
}
function playTear(key,piece){
  const item=document.querySelector(`.settlement-item.done[data-key="${CSS.escape(key)}"]`);
  if(item){item.classList.add('tearing');setTimeout(()=>item.classList.remove('tearing'),950);}
  document.body.appendChild(piece);
  requestAnimationFrame(()=>piece.classList.add('go'));
  try{navigator.vibrate&&navigator.vibrate(12);}catch(e){}
  setTimeout(()=>piece.remove(),1000);
}
function toggleSettled(key,amount,btn,isPaid){
  let tear=null;
  if(isPaid){
    delete settled[key];showToast('「済」を取り消しました');
    expenses=expenses.map(e=>{
      if(!e.pre||!e.pre.s||!(key in e.pre.s))return e;
      const s2={...e.pre.s};delete s2[key];const ne={...e};
      if(Object.keys(s2).length)ne.pre={...e.pre,s:s2};else delete ne.pre;
      return ne;
    });
  }else{
    settled[key]=(Number(settled[key])||0)+amount;showToast('✅ 済にしました');
    tear=btn?prepareTear(btn):null;
  }
  saveData();updateDisplay();renderMeBar();
  if(tear)playTear(key,tear);
  afterSettleChange(!!btn);
}
const memberName=i=>safe(pname(i));
const AV_COLORS=['#8b5cf6','#ff4f9a','#2f7bff','#ff8a1f','#1fb57d','#c03fd1','#00b0b0','#f2b705','#4f5bd5','#7cbf3a'];
// 名前ごとに決まった色（ここに書いた人はどの旅行でも同じ色）
const FIXED_AV_COLORS={'あやか':'#1fb57d','みさき':'#2f7bff','みゆ':'#8b5cf6'};
// 固定色の人はその色、ほかの人は固定色とかぶらない色を順番に割り当てる
function memberColors(){
  const names=members.map(m=>String(m||'').trim());
  const taken=new Set(names.map(n=>FIXED_AV_COLORS[n]).filter(Boolean));
  const free=AV_COLORS.filter(c=>!taken.has(c));
  let k=0;
  return names.map(n=>FIXED_AV_COLORS[n]||free[(k++)%free.length]);
}
// 人の形のアイコン（人の区別は色で付ける）
// 人型は線で描き、丸の背景はその人の色の淡い色にする（カテゴリのアイコンと同じ見た目）
const PERSON_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="3.6"/><path d="M5.5 19.5c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5"/></svg>';
const hexToRgb=h=>{const m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h||'');return m?`${parseInt(m[1],16)} ${parseInt(m[2],16)} ${parseInt(m[3],16)}`:'138 133 148';};
function avatar(i){
  if(isWallet(i))return`<span class="av av-wallet"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M16 13.5h.01" stroke-width="2.6"/></svg></span>`;
  const c=memberColors()[i];
  return`<span class="av" style="--a:${c};--a-rgb:${hexToRgb(c)}">${PERSON_SVG}</span>`;
}
let _showPaid=false; // 済の行を表示するか
function calculateSettlement(){
  const txs=getSettlementTx();
  // あなたの精算（ふつうの文で）
  const me=getMeIdx(),sum=document.getElementById('settSummary');
  if(sum){
    if(me<0){
      sum.innerHTML=`<div class="sett-summary"><div class="sett-empty"><button class="mini-link" onclick="chooseMe()">自分を選ぶ</button> と、あなたが払う・受け取る金額がここに出ます</div></div>`;
    }else{
      const mine=txs.filter(t=>t.from===me||t.to===me);
      const lines=mine.map(t=>{
        const done=settleState(t)==='done';
        const amt=fmtMoney(t.code,t.amount);
        const text=t.from===me
          ?`<b>${memberName(t.to)}</b> に <span class="pay">${amt}</span> 払う`
          :`<b>${memberName(t.from)}</b> から <span class="recv">${amt}</span> 受け取る`;
        return`<div class="sett-line${done?' done':''}">${done?'✓ ':''}${text}</div>`;
      }).join('');
      sum.innerHTML=`<div class="sett-summary"><div class="sett-summary-title">${memberName(me)}さんの精算</div>${lines||'<div class="sett-empty">精算はありません</div>'}</div>`;
    }
  }
  // 全員の精算（済にできる）
  const doneCount=txs.filter(t=>settleState(t)==='done').length;
  const rowOf=t=>{
    const st=settleState(t),key=settleKey(t);
    return`<div class="settlement-item${st==='done'?' done':''}" data-key="${key}">
      <div class="settlement-text">${avatar(t.from)}${memberName(t.from)} → ${avatar(t.to)}${memberName(t.to)}</div>
      <div class="settlement-amount">${fmtMoney(t.code,t.amount)}</div>
      <span class="sett-stub"><button class="sett-done-btn" onclick="toggleSettled('${key}',${t.amount},this,${st==='done'})">${st==='done'?'✓ 済':'済にする'}</button></span>
    </div>`;
  };
  const openTx=txs.filter(t=>settleState(t)!=='done'),doneTx=txs.filter(t=>settleState(t)==='done');
  const rows=openTx.map(rowOf).join('')+(doneTx.length?`<button type="button" class="paid-toggle${_showPaid?' open':''}" onclick="_showPaid=!_showPaid;calculateSettlement()">済 ${doneTx.length}件${_showPaid?'をたたむ':'を表示'}<span>▾</span></button>${_showPaid?doneTx.map(rowOf).join(''):''}`:'');
  const pass=document.getElementById('tripPass');
  const allDone=txs.length>0&&doneCount===txs.length;
  // 旅行中に全部済にしても「精算完了」にはしない（途中精算）。帰国日を過ぎたら完了になる
  const complete=allDone&&!tripNotOver();
  if(pass)pass.classList.toggle('complete',complete);
  // 精算が全部終わった日を記録（パスポートのスタンプに使う）
  if(!_isApplyingRemote){
    if(complete&&!completedAt){completedAt=todayStr();saveData();}
    else if(!complete&&completedAt){completedAt='';saveData();}
  }
  renderPassProgress();
  const pb=document.getElementById('preOpenBtn');
  if(pb){const can=expenses.filter(canPre);pb.style.display=can.length?'flex':'none';
    const started=can.filter(x=>x.pre).length;document.getElementById('preOpenSub').textContent=started?`${started}件の支払いを先に精算しています`:'旅の途中で、1つの支払いだけ先に精算できます';}
  if(document.getElementById('preSheet')?.classList.contains('active'))renderPreSheet();
  const walNote=txs.some(t=>isWallet(t.from)||isWallet(t.to))?`<div class="wal-note">${avatar(walletIdx())}「共有財布 → 人」は財布から取り出して渡す、「人 → 共有財布」は財布にお金を入れる、という意味です</div>`:'';
  const estN=expenses.filter(e=>e.est).length;
  const estNote=estN?`<div class="est-note">${iconSvg('warn')}概算の支払いが ${estN}件あります。確定額に直してから精算すると安心です</div>`:'';
  document.getElementById('settlementList').innerHTML=estNote+(txs.length
    ?`<div class="sett-progress"><span>全員の精算${allDone&&!complete?'<em class="mid-done">途中精算済み</em>':''}</span><span>${doneCount} / ${txs.length} 件 済</span></div>${rows}`
    :`<div class="small" style="text-align:center;color:var(--muted);padding:8px;">精算はありません</div>`)+walNote;
  _lastDepositRefunds=null;
}

/* ===== 個人別まとめ（★リデザイン） ===== */
// 通貨ごとの「立て替えた」「自分の分」（割り方・共有財布も反映）
function memberTotals(code){
  const n=members.length,paid=Array(n).fill(0),share=Array(n).fill(0);
  expenses.forEach(e=>{
    if(normCurrency(e.currency)!==code)return;
    if(!e.wallet)paid[e.paidBy]+=e.amount;
    sharesOf(e).forEach(([i,v])=>{if(i<n)share[i]+=v;});
  });
  (wallet.ins||[]).forEach(x=>{if(x.currency===code&&x.by<n)paid[x.by]+=x.amount;}); // 財布に入れたお金も立て替えた分
  return{paid,share};
}
function personalCurrencies(){
  const set=new Set([...(expenses||[]).map(e=>normCurrency(e.currency)),...(wallet.ins||[]).map(x=>x.currency)]);
  return CURRENCIES.filter(c=>set.has(c.code));
}
/* ===== くわしい内訳：誰がいくら立て替えて、いくら使ったか ===== */
function renderPersonalViews(){
  const wrap=document.getElementById('personalSummary');if(!wrap)return;
  const curs=personalCurrencies(),named=members.map((m,i)=>i).filter(i=>String(members[i]||'').trim());
  if(!curs.length||!named.length){wrap.innerHTML='<p class="small" style="text-align:center;padding:8px;">まだ支払いがありません</p>';return;}
  const signed=(code,n)=>{const r=roundCur(code,n);return r>0?`+${fmtPlain(code,r)}`:r<0?`−${fmtPlain(code,-r)}`:fmtPlain(code,0);};
  let html='';
  curs.forEach(c=>{
    const {paid,share}=memberTotals(c.code);
    const rows=named.filter(i=>roundCur(c.code,paid[i])||roundCur(c.code,share[i])).map(i=>{
      const net=paid[i]-share[i],cls=roundCur(c.code,net)>0?'plus':roundCur(c.code,net)<0?'minus':'zero';
      return`<div class="pt-row"><span class="pt-name">${avatar(i)}<b>${memberName(i)}</b></span><span>${fmtPlain(c.code,paid[i])}</span><span>${fmtPlain(c.code,share[i])}</span><span class="pt-net ${cls}">${signed(c.code,net)}</span></div>`;
    }).join('');
    if(!rows)return;
    const wb=wallet.on?walletBalance()[c.code]:undefined;
    const note=wb!=null?`<div class="pt-note">${avatar(walletIdx())}財布に入れたお金は「立て替えた」に含みます。財布の残り ${fmtPlain(c.code,wb)}</div>`:'';
    html+=`<div class="pt"><div class="pt-head"><span class="pt-cur">${c.label}</span><span>立て替えた</span><span>自分の分</span><span>差引</span></div>${rows}${note}</div>`;
  });
  html+=`<div class="pt-send"><span>明細を送る</span><div>${named.map(i=>`<button type="button" onclick="sendMemberDetail(${i})">${avatar(i)}${memberName(i)}</button>`).join('')}</div></div>`;
  wrap.innerHTML=html;
}
// その人の明細（今の精算のしかたに合わせる）
function memberDetailText(k){
  const trip=trips.find(t=>t.id===currentTripId);
  const lines=[`【割り勘明細】${pname(k)}${trip?`（${trip.name}）`:''}`,'─'.repeat(18)];
  personalCurrencies().forEach(c=>{
    const {paid,share}=memberTotals(c.code);
    if(!roundCur(c.code,paid[k])&&!roundCur(c.code,share[k]))return;
    const net=roundCur(c.code,paid[k]-share[k]);
    lines.push(`[${c.label}] 立て替えた ${fmtPlain(c.code,paid[k])} / 自分の分 ${fmtPlain(c.code,share[k])} / 差引 ${net>0?'+':net<0?'−':''}${fmtPlain(c.code,Math.abs(net))}`);
  });
  const txs=getSettlementTx().filter(t=>t.from===k||t.to===k);
  lines.push('','【精算】');
  if(!txs.length)lines.push('  精算はありません');
  txs.forEach(t=>lines.push(`  ${pname(t.from)} → ${pname(t.to)}：${fmtPlain(t.code,t.amount)}${t.paid?'（済）':''}`));
  lines.push('─'.repeat(18),'※ WARITABI より');
  return lines.join('\n');
}
async function sendMemberDetail(k){
  const text=memberDetailText(k);
  window._currentShareText=text;
  if(navigator.share){
    try{await navigator.share({title:'割り勘明細',text});return;}
    catch(e){if(e&&e.name==='AbortError')return;}
  }
  await copyText(text,'📋 コピーしました！LINEに貼り付けてね');
}

/* ===== 自分の精算額 =====
 * 「自分」は端末ごと・旅行ごとにメンバー名で覚える（並びが変わってもずれないように）
 */
const meKey=()=>`warikanMe_${currentTripId||'local'}`;
function getMeIdx(){
  let name=null;try{name=localStorage.getItem(meKey());}catch(e){}
  if(!name)return -1;
  return members.findIndex(m=>m===name);
}
async function chooseMe(){
  const named=members.map((m,i)=>({m,i})).filter(x=>x.m);
  if(!named.length){openInfoPopup('メンバーがいません','先に設定タブでメンバーを登録してください。');return;}
  const cur=named.findIndex(x=>x.i===getMeIdx());
  const picked=await appChoose('あなたはどのメンバー？',named.map(x=>x.m),{message:'この端末で選んだ人の精算額を上に表示します',current:cur<0?null:cur});
  if(picked===null||picked===undefined)return;
  try{localStorage.setItem(meKey(),named[picked].m);}catch(e){}
  if(editingExpenseIdx<0)setPaidBy(named[picked].i);
  renderMeBar();calculateSettlement();updateFooterTotal();
}
function openMySettlement(){
  const me=getMeIdx();
  if(me<0){chooseMe();return;}
  _focusMemberIdx=me;updateFocusMemberSelect();renderPersonalViews();
  const body=document.getElementById('cardPersonal');
  if(body&&body.classList.contains('collapsed'))toggleCard('cardPersonal',body.previousElementSibling);
  showTab('settle');
}
function renderMeBar(){
  const text=document.getElementById('meText'),btn=document.querySelector('#meBar .me-change');
  if(!text)return;
  const me=getMeIdx();
  if(me<0){
    document.getElementById('meBar').classList.remove('pay','recv','done');
    text.innerHTML='自分を選ぶと精算額を表示';
    if(btn)btn.textContent='自分を選ぶ';
    return;
  }
  if(btn)btn.textContent='変更';
  // 精算タブと同じ送金リストから、「済」にしていない分だけを合計する
  const mine=getSettlementTx().filter(t=>t.from===me||t.to===me);
  const pay={},recv={};
  mine.filter(t=>settleState(t)!=='done').forEach(t=>{const m=t.from===me?pay:recv;m[t.code]=(m[t.code]||0)+t.amount;});
  const fmtSum=m=>CURRENCIES.filter(c=>m[c.code]).map(c=>fmtPlain(c.code,m[c.code])).join(' + ');
  const parts=[];
  if(Object.keys(pay).length)parts.push(`<span class="me-pay">${fmtSum(pay)} 払う</span>`);
  if(Object.keys(recv).length)parts.push(`<span class="me-recv">${fmtSum(recv)} 受け取る</span>`);
  const status=parts.length?parts.join('・'):mine.length?`<span class="me-recv">✓ ${tripNotOver()?'ここまで精算済み':'精算完了'}</span>`:'精算なし';
  text.innerHTML=`<b>${safe(members[me])}</b>${seatTag(me)}　${status}`;
  const bar=document.getElementById('meBar');
  bar.classList.toggle('pay',Object.keys(pay).length>0);
  bar.classList.toggle('recv',!Object.keys(pay).length&&Object.keys(recv).length>0);
  bar.classList.toggle('done',!parts.length&&mine.length>0);
}

/* ===== フッター・メイン更新 ===== */
function updateFooterTotal(){
  let yen=0;(expenses||[]).forEach(e=>{yen+=expYen(e);});
  const ft=document.getElementById('footerTotal');if(ft)ft.innerHTML=symSmall(fmtPlain('JPY',yen));
  const n=members.filter(Boolean).length,pp=document.getElementById('perPersonTotal');
  const me=getMeIdx(),lbl=pp?.previousElementSibling;
  if(me>=0&&yen>0){
    // 自分が負担する分（割り方を反映、円換算）
    let mine=0;expenses.forEach(e=>{sharesOf(e).forEach(([i,v])=>{if(i===me)mine+=v*expRate(e);});});
    if(lbl)lbl.textContent='自分の分';
    if(pp)pp.innerHTML=symSmall(fmtPlain('JPY',mine));
  }else{
    if(lbl)lbl.textContent='1人あたり';
    if(pp)pp.innerHTML=n>1&&yen>0?symSmall(fmtPlain('JPY',yen/n)):'-';
  }
  const mc=document.getElementById('memberCount');if(mc)mc.textContent=n?`${n}人`:'-';
}
function renderCatSummary(){
  const el=document.getElementById('catSummaryContent');
  if(!el)return;
  if(!expenses.length){el.innerHTML='<p style="text-align:center;color:var(--muted);padding:8px;">まだ記録がありません</p>';return;}
  const BAR_COLORS={JPY:'var(--p)',USD:'rgb(var(--p-rgb) / .6)',KRW:'rgb(var(--p-rgb) / .35)'};
  const catMap={},totals={},counts={};
  expenses.forEach(e=>{
    const cat=e.category||'その他',c=normCurrency(e.currency);
    if(!catMap[cat])catMap[cat]={};
    catMap[cat][c]=(catMap[cat][c]||0)+e.amount;
    totals[c]=(totals[c]||0)+e.amount;
    counts[cat]=(counts[cat]||0)+1;
  });
  // _catsの順番通りに、未登録は末尾
  const catOrder=[..._cats,...Object.keys(catMap).filter(c=>!_cats.includes(c))].filter(c=>catMap[c]);
  let html='<div style="display:flex;flex-direction:column;gap:10px;">';
  catOrder.forEach(cat=>{
    html+=`<div style="background:var(--surface-2);border:1px solid var(--line);border-radius:14px;padding:12px 14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span class="catsum-name" style="${catStyle(cat)}">${catLabelHTML(cat)}</span>
        <span style="font-size:12px;font-weight:800;color:var(--accent-bluegray);">${counts[cat]}件</span>
      </div>`;
    CURRENCIES.forEach(c=>{
      const amt=catMap[cat][c.code]||0;if(amt<=0)return;
      const pct=totals[c.code]>0?Math.round(amt/totals[c.code]*100):0;
      html+=`<div style="margin-bottom:5px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:3px;font-weight:800;">
          <span>${c.code==='JPY'?'円':c.code}</span><span>${fmtPlain(c.code,amt)} (${pct}%)</span>
        </div>
        <div style="height:6px;background:var(--line);border-radius:999px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${BAR_COLORS[c.code]};border-radius:999px;transition:width .3s;"></div>
        </div>
      </div>`;
    });
    html+=`</div>`;
  });
  // 合計行
  html+=`<div style="background:rgb(var(--p-rgb) / .07);border-radius:14px;padding:12px 14px;">
    <div style="font-size:13px;font-weight:900;color:var(--text);margin-bottom:4px;">合計</div>`;
  CURRENCIES.forEach(c=>{if(totals[c.code]>0)html+=`<div style="font-family:var(--round);font-size:16px;font-weight:800;color:var(--p);">${fmtPlain(c.code,totals[c.code])}</div>`;});
  html+=`</div></div>`;
  el.innerHTML=html;
}
function updateDisplay(){
  renderQuickRow();renderWalletCard();renderSettingsSummary();
  updateSettCards();
  updateMemberList();displayExpenses();renderCatSummary();calculateSettlement();renderPersonalViews();updateFooterTotal();renderMeBar();refreshFormHelpers();
  renderReviewOpen();if(document.getElementById('reviewSheet')?.classList.contains("active"))renderReview();
}

/* ===== 保存・読込 ===== */
function saveData(){
  try{
    localStorage.setItem('warikanMembers',JSON.stringify(members));
    localStorage.setItem('warikanExpenses',JSON.stringify(expenses));
    localStorage.setItem('warikanDeposits',JSON.stringify(deposits));
    localStorage.setItem('exchangeRate',String(exchangeRate));
    localStorage.setItem('krwRate',String(krwRate));
    localStorage.setItem('settlementMode',settlementMode);
    localStorage.setItem('warikanCats',JSON.stringify(_cats));
  }catch(e){console.warn(e);}
  if(_isApplyingRemote)return;
  if(_syncBase)writeTripCache({local:getDataObject(),localRev:_syncRev}); // 旅行の読み込み中は残さない
  if(sb&&currentTripId&&currentUser){
    clearTimeout(_saveTimer);
    _saveTimer=setTimeout(()=>saveTripDataNow(false),700);
    setSyncStatus('保存待ち...');
  }
}
function loadData(){
  try{
    const sm=localStorage.getItem('warikanMembers'),se=localStorage.getItem('warikanExpenses'),sd=localStorage.getItem('warikanDeposits'),sr=localStorage.getItem('exchangeRate'),sk=localStorage.getItem('krwRate'),ss=localStorage.getItem('settlementMode'),sc=localStorage.getItem('warikanCats');
    const nd=normalizeData({members:sm?JSON.parse(sm):undefined,expenses:se?JSON.parse(se):undefined,deposits:sd?JSON.parse(sd):undefined,exchangeRate:sr?Number(sr):undefined,krwRate:sk?Number(sk):undefined});
    members=nd.members;expenses=nd.expenses;deposits=nd.deposits;exchangeRate=nd.exchangeRate;krwRate=nd.krwRate;if(ss==='min'||ss==='direct')settlementMode=ss;
    if(sc){const cats=JSON.parse(sc);if(Array.isArray(cats)&&cats.length)_cats=cats;}
  }catch(e){console.error(e);}
}

/* ===== エクスポート・インポート ===== */
function exportData(){
  const d={members,expenses,deposits,exchangeRate,krwRate,settlementMode,settled,catIcons,tripMeta,completedAt,wallet,categories:_cats,exportDate:new Date().toISOString()};
  const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');
  a.href=u;a.download='warikan_'+new Date().toISOString().split('T')[0]+'.json';a.click();URL.revokeObjectURL(u);
}
function importData(e){
  const f=e.target.files[0];if(!f)return;
  if(f.size>MAX_FILE_SIZE){showToast('⚠ ファイルが大きすぎます');e.target.value='';return;}
  const r=new FileReader();
  r.onload=ev=>{
    try{const raw=JSON.parse(ev.target.result);applyDataObject(raw);localStorage.setItem('rateUpdatedAt',new Date().toISOString());saveData();updateMemberSelects();updateMemberDisplay();updateFocusMemberSelect();showRateDisplay();renderCatPicker();updateDisplay();showToast('✅ 読み込み完了');}
    catch(err){showToast('⚠ 読み込みに失敗しました');console.error(err);}
  };
  r.readAsText(f);e.target.value='';
}

/* ===== 明細コピー・シェア ===== */
function copyDetailText(){
  const text=window._currentShareText;
  if(!text){showToast('⚠ メンバーを選んでください');return;}
  navigator.clipboard.writeText(text).then(()=>{
    showToast('📋 コピーしました！LINEに貼り付けてね');
  }).catch(()=>{
    // fallback
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
    showToast('📋 コピーしました！');
  });
}
function shareDetail(){
  const text=window._currentShareText;
  if(!text){showToast('⚠ メンバーを選んでください');return;}
  if(navigator.share){
    navigator.share({title:'割り勘明細',text}).catch(()=>{});
  } else {
    copyDetailText();
  }
}

/* ===== カテゴリグループ開閉 ===== */
function toggleCatGroup(id, headerEl){
  const body=document.getElementById(id);
  const tog=headerEl.querySelector('.cat-group-toggle');
  if(!body)return;
  const isOpen=!body.classList.contains('collapsed');
  body.classList.toggle('collapsed',isOpen);
  if(tog)tog.classList.toggle('open',!isOpen);
}

/* ===== カード開閉 ===== */
function toggleCard(bodyId, headerEl){
  const body=document.getElementById(bodyId);
  const chevron=headerEl.querySelector('.card-chevron');
  const isOpen=!body.classList.contains('collapsed');
  body.classList.toggle('collapsed', isOpen);
  if(chevron) chevron.classList.toggle('open', !isOpen);
}

/* ===== タブ ===== */
/* ===== 新着（前に一覧を見たときから増えた・変わった支払い） ===== */
let _fresh=new Map(); // id → 'new' | 'upd'
const expSig=e=>{const nm=i=>String(members[i]??i);const s=JSON.stringify([e.name,e.amount,e.currency,e.category,e.date,e.wallet?'W':nm(e.paidBy),(e.participants||[]).map(nm).sort()]);let h=5381;for(let i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;return h.toString(36);};
const seenKey=()=>`warikanSeen_${currentTripId||'local'}`;
function loadSeen(){try{const v=JSON.parse(localStorage.getItem(seenKey())||'null');return v&&typeof v==='object'?v:null;}catch(e){return null;}}
function saveSeen(map){try{localStorage.setItem(seenKey(),JSON.stringify(map));}catch(e){}}
const activeTab=()=>document.querySelector('.tab-panel.active')?.dataset.tab;
function seenAllNow(){const m={};expenses.forEach(e=>m[e.id]=expSig(e));saveSeen(m);}
// 自分で追加・変更したものは新着にしない
function markSeen(e){
  if(!e)return;
  const m=loadSeen();if(!m){seenAllNow();return;}
  m[e.id]=expSig(e);saveSeen(m);_fresh.delete(e.id);renderListBadge();
}
// 新着を数え直す。新しく見つかった支払いを返す
function refreshFresh(){
  const seen=loadSeen();
  if(!seen){seenAllNow();_fresh.clear();renderListBadge();return[];}
  const found=[];
  expenses.forEach(e=>{
    const kind=!(e.id in seen)?'new':seen[e.id]!==expSig(e)?'upd':null;
    if(kind&&_fresh.get(e.id)!==kind)found.push({e,kind});
  });
  const ids=new Set(expenses.map(e=>e.id));
  if(activeTab()==='list'){
    // 一覧を見ている → 光らせたまま、見たことにする
    found.forEach(({e,kind})=>_fresh.set(e.id,kind));
    seenAllNow();
  }else{
    _fresh=new Map();
    expenses.forEach(e=>{const kind=!(e.id in seen)?'new':seen[e.id]!==expSig(e)?'upd':null;if(kind)_fresh.set(e.id,kind);});
  }
  [..._fresh.keys()].forEach(id=>{if(!ids.has(id))_fresh.delete(id);});
  renderListBadge();
  return found;
}
function renderListBadge(){
  const b=document.getElementById('listBadge');if(!b)return;
  const n=activeTab()==='list'?0:_fresh.size;
  b.textContent=n>9?'9+':String(n);b.classList.toggle('show',n>0);
}
function freshAnnounceText(found){
  const names=found.slice(0,2).map(f=>`「${sanitize(f.e.name)}」`).join('');
  const more=found.length>2?`ほか${found.length-2}件`:'';
  const nNew=found.filter(f=>f.kind==='new').length;
  const head=nNew===found.length?'新しい支払いが届きました':nNew===0?'支払いが更新されました':`支払いの追加・変更が${found.length}件あります`;
  return`${head}　${names}${more}`;
}

/* ===== 機内アナウンス ===== */
let _annQueue=[],_annTimer=null;
function announce(msg){
  if(!msg)return;
  _annQueue.push(msg);
  if(!_annTimer)nextAnnounce();
}
function nextAnnounce(){
  const el=document.getElementById('announce');
  const msg=_annQueue.shift();
  if(!el||!msg){_annTimer=null;if(el)el.classList.remove('show');return;}
  document.getElementById('announceMsg').textContent=msg;
  el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
  _annTimer=setTimeout(()=>{el.classList.remove('show');_annTimer=setTimeout(nextAnnounce,350);},4200);
}
function hideAnnounce(){clearTimeout(_annTimer);const el=document.getElementById('announce');if(el)el.classList.remove('show');_annTimer=setTimeout(nextAnnounce,350);}
// 旅の日程に合わせたひとこと
function tripCountdownText(today=todayStr()){
  if(!tripMeta.start||completedAt)return'';
  const days=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000);
  const until=days(today,tripMeta.start),end=tripMeta.end||tripMeta.start,dest=AIRPORT[tripMeta.to]?.city;
  if(until>30)return'';
  if(until>1)return`まもなく出発です。${dest?dest+'への':''}出発まで、あと${until}日です`;
  if(until===1)return`明日は出発日です。${dest?dest+'への':''}ご準備はよろしいですか`;
  if(until===0)return`本日出発です。いってらっしゃいませ`;
  if(today<=end)return`旅の Day ${-until+1} です。本日も良い旅を`;
  if(days(end,today)<=30)return`おかえりなさい。精算のお手続きをお忘れなく`;
  return'';
}
// 旅行を開いたとき（1日1回）
function announceOnOpen(found){
  const key=`warikanAnn_${currentTripId}`,today=todayStr();
  let shown='';try{shown=localStorage.getItem(key)||'';}catch(e){}
  if(shown!==today){
    const msg=tripCountdownText(today);
    if(msg){announce(msg);try{localStorage.setItem(key,today);}catch(e){}}
  }
  if(found&&found.length)announce(freshAnnounceText(found));
}

function showTab(name){
  if(!document.querySelector(`.tab-panel[data-tab="${name}"]`))name='add';
  const prev=activeTab();
  document.querySelectorAll('.tab-panel').forEach(el=>el.classList.toggle('active',el.dataset.tab===name));
  document.querySelectorAll('.tab-btn').forEach(el=>el.classList.toggle('active',el.dataset.tab===name));
  const sc=document.querySelector('.container');if(sc)sc.scrollTop=0;
  if(name==='add')renderCatPicker(); // 選択中のカテゴリが見える位置にスクロール
  try{localStorage.setItem('warikanTab',name);}catch(e){}
  // 一覧を開いたら新着を見たことにし、離れたら光を消す
  if(name==='list'&&_fresh.size)seenAllNow();
  if(prev==='list'&&name!=='list'&&_fresh.size){_fresh.clear();displayExpenses();}
  renderListBadge();
}
// 下のタブの実際の高さ（ホームバー分を含む）を測り、中身の最後の余白に使う
function syncTabbarHeight(){
  const f=document.getElementById('footerBar');
  if(f&&f.offsetHeight)document.documentElement.style.setProperty('--tabbar-h',f.offsetHeight+'px');
}
window.addEventListener('resize',syncTabbarHeight);
function restoreTab(){
  requestAnimationFrame(syncTabbarHeight);
  let name='add';
  try{name=localStorage.getItem('warikanTab')||'add';}catch(e){}
  showTab(name);
}

