/* Chordity — layar login, cadangan lagu, dan boot aplikasi */
/* UI login */
const aerr=(t,ok)=>{const e=$('aerr');e.textContent=t||'';e.classList.toggle('ok',!!ok)};
function emsg(e){const m=((e&&e.message)||'').toLowerCase();
if(m.includes('invalid login'))return'Email atau password salah.';
if(m.includes('not confirmed'))return'Email belum dikonfirmasi. Cek kotak masuk kamu.';
if(m.includes('already registered')||m.includes('already been registered'))return'Email ini sudah terdaftar. Silakan masuk.';
if(m.includes('at least')&&m.includes('character'))return'Password minimal 6 karakter.';
if(m.includes('same password'))return'Password baru harus berbeda dari yang lama.';
if(m.includes('rate limit')||m.includes('too many'))return'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.';
if(m.includes('fetch')||m.includes('network'))return'Tidak ada koneksi internet.';
return'Terjadi kesalahan, coba lagi.'}
function showAuth(m){amode=m;$('auth').hidden=false;document.body.style.overflow='hidden';
const rec=m==='recover',ld=m==='loading';
$('aform').hidden=ld;$('atabs').hidden=rec||ld;$('aload').hidden=!ld;$('aew').hidden=rec;
document.querySelectorAll('#atabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.m===m));
$('ap2w').classList.toggle('c',m==='login');
$('afor').classList.toggle('c',m!=='login');
$('abtn').textContent={login:'Masuk',register:'Daftar',recover:'Simpan password baru'}[m]||'Masuk';
$('aplb').textContent=rec?'Password baru':'Password';
$('ap').autocomplete=m==='login'?'current-password':'new-password';
$('asubt').textContent=rec?'Masukkan password baru untuk akunmu.':'Masuk untuk menyimpan lagu dan acara, tersinkron di semua perangkat.';
aerr('')}
function busy(b){authBusy=b;$('abtn').disabled=b;$('afor').disabled=b;document.querySelectorAll('#aform input').forEach(i=>i.disabled=b)}
$('atabs').onclick=e=>{const b=e.target.closest('button');if(b&&!authBusy)showAuth(b.dataset.m)};
$('ashow').onchange=e=>{$('ap').type=$('ap2').type=e.target.checked?'text':'password'};
$('aform').onsubmit=async e=>{e.preventDefault();if(authBusy||!sb)return;
const em=$('ae').value.trim(),pw=$('ap').value;aerr('');
if(amode!=='recover'&&!/^\S+@\S+\.\S+$/.test(em)){aerr('Masukkan email yang valid.');return}
if(pw.length<6){aerr('Password minimal 6 karakter.');return}
if(amode!=='login'&&pw!==$('ap2').value){aerr('Password dan ulangannya tidak sama.');return}
busy(true);
try{
if(amode==='login'){const{data,error}=await sb.auth.signInWithPassword({email:em,password:pw});if(error)throw error;await enter(data.user)}
else if(amode==='register'){const{data,error}=await sb.auth.signUp({email:em,password:pw});if(error)throw error;
if(data.user&&data.user.identities&&!data.user.identities.length)throw{message:'already registered'};
if(data.session)await enter(data.user);
else{showAuth('login');$('ae').value=em;aerr('Pendaftaran berhasil. Cek email kamu untuk konfirmasi, lalu masuk.',1)}}
else{const{error}=await sb.auth.updateUser({password:pw});if(error)throw error;
const{data:{session}}=await sb.auth.getSession();if(session)await enter(session.user);else showAuth('login')}
}catch(err){aerr(emsg(err))}
busy(false)};
$('afor').onclick=async()=>{if(authBusy||!sb)return;const em=$('ae').value.trim();
if(!/^\S+@\S+\.\S+$/.test(em)){aerr('Isi email dulu, lalu tekan Lupa password.');return}
busy(true);const{error}=await sb.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname});busy(false);
aerr(error?emsg(error):'Tautan reset password sudah dikirim ke email kamu.',!error)};
$('out').onclick=logout;
async function boot(){if(!sbOn)return;
if(!sb){sb=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
sb.auth.onAuthStateChange((ev)=>{if(ev==='PASSWORD_RECOVERY')showAuth('recover');else if(ev==='SIGNED_OUT'&&user){user=null;showAuth('login')}});
onChange=touch;rebase()}
showAuth('loading');
let session=null;try{session=(await sb.auth.getSession()).data.session}catch(e){}
if(REC&&session){showAuth('recover');return}
if(session)await enter(session.user);
else if(!navigator.onLine&&store.get('rl-owner','')){$('auth').hidden=true;document.body.style.overflow='';$('acct').hidden=false;$('who').textContent=store.get('rl-email','');setSt('Offline')}
else showAuth('login')}
addEventListener('online',()=>{if(sb)user?syncNow(true):boot()});
addEventListener('offline',()=>{if(user)setSt('Offline')});

/* Cadangan: unduh & pulihkan (gabung, tidak menghapus) */
(function(){const msg=(t,e)=>{const m=$('bmsg');m.textContent=t;m.classList.toggle('e',!!e)};
$('bdl').onclick=()=>{const d={app:'chordity',v:1,at:new Date().toISOString(),songs,events:evs,curEv},a=document.createElement('a');
a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,1)],{type:'application/json'}));a.download='chordity-cadangan-'+new Date().toISOString().slice(0,10)+'.json';
document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);msg('Cadangan diunduh: '+songs.length+' lagu, '+evs.length+' acara.')};
$('bup').onclick=()=>$('bfile').click();
$('bfile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
try{const d=JSON.parse(await f.text());if(!d||!Array.isArray(d.songs))throw 0;
let add=0,upd=0;const rich=x=>(x&&x.x?String(x.x).length:0);
d.songs.forEach(n=>{if(!n||typeof n.t!=='string'||n.id==null)return;const o=songs.find(x=>x.id===n.id);
if(!o){songs.push(n);add++}else if(rich(n)>rich(o)){Object.assign(o,n);upd++}});
let ae=0;if(Array.isArray(d.events))d.events.forEach(n=>{if(n&&n.id!=null&&!evs.some(x=>x.id===n.id)){evs.push(n);ae++}});
renderSongs();renderEv();msg('Dipulihkan: '+add+' lagu ditambah, '+upd+' dilengkapi, '+ae+' acara ditambah.')}
catch(err){msg('File tidak dikenali. Pakai file cadangan dari Chordity.',1)}}})();
document.addEventListener('visibilitychange',()=>{if(!user)return;if(document.visibilityState==='hidden'){commit();if(dirty)syncNow(true)}else syncNow()});
addEventListener('pagehide',()=>{if(user&&commit())syncNow(true)});

show(location.hash.slice(1));
boot();
