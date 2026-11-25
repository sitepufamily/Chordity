/* Chordity — akun & sinkron Supabase (gabung per-item + penanda hapus) */
/* Akun & sinkron (Supabase) — v17: gabung per-item + penanda hapus, aman dipakai banyak perangkat */
const APPV='v23';
const CFG=window.RL_CONFIG||{};
const sbOn=!!(window.supabase&&/^https?:\/\//.test(CFG.url||'')&&CFG.key&&!/^GANTI/.test(CFG.key));
let sb=null,user=null,applying=false,dirty=false,syncP=null,again=false,amode='login',authBusy=false,chan=null,commitT=null,pushT=null,deferT=null,retryT=null,pollT=null,retryN=0,seenTs=0,lastErr='',lastOk=0;
const REC=/type=recovery/.test(location.hash);
const LSK=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const setSt=t=>{$('sst').textContent=t};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* JSON dengan urutan kunci tetap (jsonb di server mengacak urutan kunci) */
const sj=v=>JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.keys(x).sort().reduce((o,kk)=>(o[kk]=x[kk],o),{}):x);
const ser=x=>{const{u,...r}=x;return sj(r)};
const blankEv=e=>!!e&&e.n==='Acara pertama'&&!e.d&&!(e.s||[]).length;
const liveOf=a=>(Array.isArray(a)?a:[]).filter(e=>e&&e.id!=null&&!blankEv(e));
const liveEvs=()=>liveOf(evs);
function readPractice(){const p={};try{Object.keys(localStorage).filter(k=>k.startsWith('done-')).forEach(k=>p[k.slice(5)]=store.get(k,0))}catch(e){}return p}
let tomb=(()=>{const t=store.get('rl-tomb',null)||{};return{s:t.s||{},e:t.e||{}}})();
let base={s:new Map(),e:new Map()},basePr='{}';
function rebase(){base={s:new Map(),e:new Map()};songs.forEach(x=>{if(x&&x.id!=null)base.s.set(x.id,ser(x))});liveEvs().forEach(x=>base.e.set(x.id,ser(x)));basePr=sj(readPractice())}
/* Catat perubahan NYATA saja: beri cap waktu per item, dan catat item yang dihapus */
function commit(){const now=Date.now();let ch=false;
const one=(arr,b,tb)=>{const seen=new Set();
arr.forEach(x=>{if(!x||x.id==null)return;seen.add(x.id);if(b.get(x.id)!==ser(x)){x.u=Math.max(now,(x.u||0)+1);b.set(x.id,ser(x));if(tb[x.id]&&tb[x.id]<=x.u)delete tb[x.id];ch=true}});
[...b.keys()].forEach(id=>{if(!seen.has(id)){b.delete(id);tb[id]=now;ch=true}})};
one(songs,base.s,tomb.s);one(liveEvs(),base.e,tomb.e);
const p=sj(readPractice());if(p!==basePr){basePr=p;ch=true}
if(ch){applying=true;try{store.set('songs',songs);store.set('events',evs);store.set('rl-tomb',tomb)}finally{applying=false}}
return ch}
/* Penggabungan: item terbaru menang, penanda hapus mengalahkan item yang lebih lama */
function pick(a,b){const ua=a.u||0,ub=b.u||0;if(ua!==ub)return ua>ub?a:b;
const ra=a.x?String(a.x).length:0,rb=b.x?String(b.x).length:0;if(ra!==rb)return ra>rb?a:b;return ser(a)>=ser(b)?a:b}
function mergeList(la,lb,ta,tb){const t={...(ta||{})};Object.entries(tb||{}).forEach(([k,v])=>t[k]=Math.max(t[k]||0,v));
const cut=Date.now()-90*864e5;Object.keys(t).forEach(k=>{if(t[k]<cut)delete t[k]});
const m=new Map();[...(la||[]),...(lb||[])].forEach(x=>{if(!x||x.id==null)return;const o=m.get(x.id);m.set(x.id,o?pick(o,x):x)});
const out=[];m.forEach((x,id)=>{const d=t[id];if(!(d&&d>=(x.u||0)))out.push(x)});return{list:out,tomb:t}}
function mergeDoc(r,l){r=r||{};l=l||{};const S=mergeList(r.songs,l.songs,(r.tomb||{}).s,(l.tomb||{}).s),E=mergeList(liveOf(r.events),liveOf(l.events),(r.tomb||{}).e,(l.tomb||{}).e);
const pr={...(l.practice||{})};Object.entries(r.practice||{}).forEach(([k,v])=>pr[k]=Math.max(pr[k]||0,v));
S.list.sort((a,b)=>b.id-a.id);E.list.sort((a,b)=>a.id-b.id);
return{songs:S.list,events:E.list,practice:pr,tomb:{s:S.tomb,e:E.tomb}}}
function localDoc(){return{songs,events:liveEvs(),practice:readPractice(),tomb}}
function cloudForm(d){return sj({songs:d.songs||[],events:liveOf(d.events),practice:d.practice||{},tomb:{s:(d.tomb||{}).s||{},e:(d.tomb||{}).e||{}}})}
function applyDoc(d){if(cloudForm(d)===cloudForm(localDoc()))return;
applying=true;
try{songs=Array.isArray(d.songs)?d.songs:[];evs=Array.isArray(d.events)?d.events:[];
if(!evs.some(e=>e.id===curEv))curEv=evs.length?evs[0].id:0;
tomb={s:(d.tomb||{}).s||{},e:(d.tomb||{}).e||{}};
Object.entries(d.practice||{}).forEach(([k,v])=>store.set('done-'+k,v));
store.set('songs',songs);store.set('events',evs);store.set('curEv',curEv);store.set('rl-tomb',tomb);
if(openSong&&!songs.some(x=>x.id===openSong))openSong=0;
renderSongs();renderEv();showToday();rebase()}
finally{applying=false}}
function isPristine(){let ev=null;try{ev=JSON.parse(LSK('events')||'null')}catch(e){}
const evOk=!ev||!ev.length||(ev.length===1&&blankEv(ev[0]));
const noPr=!Object.keys(localStorage).some(k=>k.startsWith('done-'));
return(!LSK('songs')||LSK('songs')===SEED_JSON)&&evOk&&noPr}
function typing(){const a=document.activeElement;return !!a&&(a.id==='evname'||a.id==='ex'||(/^(INPUT|TEXTAREA)$/.test(a.tagName)&&!!a.closest&&!!a.closest('#f')))}
/* Penjelasan error yang bisa langsung ditindaklanjuti */
function hint(e){const c=String((e&&e.code)||''),m=String((e&&e.message)||e||'').toLowerCase();
if(c==='42P01'||c==='PGRST205'||m.includes('could not find the table')||(m.includes('relation')&&m.includes('does not exist')))return'Tabel user_data belum ada di Supabase. Buka Supabase > SQL Editor, jalankan seluruh isi file supabase.sql.';
if(c==='PGRST204'||c==='42703'||m.includes('column'))return'Kolom tabel user_data belum lengkap. Jalankan ulang seluruh isi file supabase.sql di SQL Editor.';
if(c==='42501'||m.includes('row-level security')||m.includes('permission denied'))return'Izin akses ditolak oleh Supabase. Jalankan ulang seluruh isi file supabase.sql (membuat policy dan izin).';
if(c==='PGRST301'||m.includes('jwt'))return'Sesi login kedaluwarsa. Keluar lalu masuk lagi.';
if(m.includes('invalid api key'))return'API key di config.js tidak valid.';
if(m.includes('failed to fetch')||m.includes('network')||m.includes('load failed'))return'Tidak bisa menjangkau server Supabase. Cek internet, VPN, atau pemblokir iklan.';
return''}
function syncErr(e){lastErr=(e&&typeof e==='object'?[e.code,e.message,e.details,e.hint].filter(Boolean).join(' | ')||String(e):String(e));
try{console.error('Chordity sync:',e)}catch(_){}
const h=hint(e);if(h)lastErr+='\n\nSaran: '+h;
setSt(navigator.onLine?'Gagal sinkron':'Offline');$('sst').title=lastErr;
if(/jwt|PGRST301/i.test(lastErr)){try{sb.auth.refreshSession()}catch(_){}}
retryN++;clearTimeout(retryT);retryT=setTimeout(()=>syncNow(),Math.min(60000,3000*Math.pow(2,retryN-1)))}
$('sst').style.cursor='pointer';
$('sst').onclick=()=>{if(/^Gagal/.test($('sst').textContent))alert('Detail error sinkron ('+APPV+'):\n\n'+(lastErr||'(tidak ada detail)'));retryN=0;syncNow(true)};
const schedule=ms=>{clearTimeout(pushT);pushT=setTimeout(()=>syncNow(),ms)};
/* Satu putaran sinkron: ambil → gabung → tulis dengan pengaman bentrok (client_ts sebagai nomor versi) */
function syncNow(force){if(!user)return Promise.resolve(false);if(syncP){again=true;return syncP}
syncP=doSync(force).finally(()=>{syncP=null;if(again){again=false;setTimeout(()=>syncNow(),250)}});return syncP}
async function doSync(force){
if(!force&&(editSong||typing())){clearTimeout(deferT);deferT=setTimeout(()=>syncNow(),2500);return false}
if(!navigator.onLine){setSt('Offline');return false}
try{commit();setSt(dirty?'Menyimpan…':'Menyinkronkan…');
let done=false;
for(let i=0;i<6&&!done;i++){
const{data:row,error}=await sb.from('user_data').select('data,client_ts').eq('user_id',user.id).maybeSingle();if(error)throw error;
commit();
const local=localDoc();
if(!row){const ts=Date.now();
const{error:e2}=await sb.from('user_data').insert({user_id:user.id,data:mergeDoc({},local),client_ts:ts,updated_at:new Date().toISOString()});
if(e2){if(e2.code==='23505')continue;throw e2}
seenTs=ts;done=true;break}
const remote=row.data||{},merged=mergeDoc(remote,isPristine()?{}:local);
if(cloudForm(merged)!==cloudForm(remote)){
const ts=Math.max(Date.now(),(Number(row.client_ts)||0)+1);
const{data:upd,error:e3}=await sb.from('user_data').update({data:merged,client_ts:ts,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('client_ts',row.client_ts).select('client_ts');
if(e3)throw e3;
if(!upd||!upd.length)continue;
seenTs=ts}else seenTs=Number(row.client_ts)||0;
applyDoc(merged);done=true}
if(!done)throw new Error('Bentrok dengan perangkat lain, mengulang…');
dirty=false;retryN=0;clearTimeout(retryT);lastErr='';lastOk=Date.now();
setSt('✓ Tersinkron');$('sst').title='Terakhir sinkron '+new Date(lastOk).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})+' · '+APPV;
return true}
catch(e){syncErr(e);return false}}
/* Perubahan dari pengguna → catat (setelah jeda singkat) → kirim */
function touch(k){if(!sb||applying||!store.get('rl-owner',''))return;
if(!(k==='songs'||k==='events'||k.startsWith('done-')))return;
clearTimeout(commitT);commitT=setTimeout(()=>{if(commit()){dirty=true;setSt(user?'Menyimpan…':'Offline');if(user)schedule(1200)}},250)}
function subscribe(){if(chan||!user)return;try{chan=sb.channel('ud-'+user.id).on('postgres_changes',{event:'*',schema:'public',table:'user_data',filter:'user_id=eq.'+user.id},p=>{const ts=p&&p.new&&Number(p.new.client_ts);if(ts&&ts===seenTs)return;schedule(300)}).subscribe()}catch(e){}}
/* Cadangan jika real-time tidak aktif: cek nomor versi tiap 20 detik */
function startPoll(){clearInterval(pollT);pollT=setInterval(async()=>{if(!user||document.hidden||!navigator.onLine||syncP)return;
try{const{data:r,error}=await sb.from('user_data').select('client_ts').eq('user_id',user.id).maybeSingle();
if(!error&&r&&Number(r.client_ts)!==seenTs)syncNow();else if(dirty)syncNow()}catch(e){}},20000)}
async function enter(u){const owner=store.get('rl-owner','');
if(owner&&owner!==u.id){wipeLocal();location.reload();return}
user=u;store.set('rl-owner',u.id);store.set('rl-email',u.email||'');
$('auth').hidden=true;document.body.style.overflow='';
$('acct').hidden=false;$('who').textContent=u.email||'';
setSt('Menyinkronkan…');await syncNow(true);subscribe();startPoll()}
function wipeLocal(){try{Object.keys(localStorage).filter(k=>k==='songs'||k==='events'||k==='curEv'||k.startsWith('done-')||k.startsWith('rl-')).forEach(k=>localStorage.removeItem(k))}catch(e){}}
async function logout(){if(!confirm('Keluar dari akun ini? Data di perangkat ini akan dibersihkan, data kamu tetap aman di cloud.'))return;
commit();if(dirty||syncP){const ok=await syncNow(true);if(!ok&&!confirm('Ada perubahan yang belum tersinkron dan akan hilang. Tetap keluar?'))return}
try{await sb.auth.signOut({scope:'local'})}catch(e){}
wipeLocal();location.reload()}
