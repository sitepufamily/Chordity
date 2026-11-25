/* Chordity — lagu, chord, scale, acara, auto scroll, presenter */
/* Perpustakaan */
const ST=['belajar','latihan','siap'];
let openSong=0,trans=0,editSong=0,fs=15,showC=true,showL=true,flat=false,asOn=false,asSpeed=4,asAcc=0,asLast=0,asRun=0,pvId=0,pvList=[],pvFs=18,wl=null,cols2=store.get('rl-cols',true);
const SH=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],FL={Db:'C#',Eb:'D#',Gb:'F#',Ab:'G#',Bb:'A#'};
const CK=/^[A-G][#b]?(maj|min|m|dim|aug|sus|add|M)?\d*(\/[A-G][#b]?)?$/;
const KL=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'],FLN=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'],FLATK=[1,3,5,8,10];
const SEC=/^\s*(\[[^\]]+\]|(intro|verse|chorus|bridge|outro|refrain|reff?|bait|interlude|pre-?chorus|ending|coda|tag)\s*\d*\s*:?)\s*$/i;
function tr1(n,d){n=FL[n]||n;const i=(SH.indexOf(n)+d+1200)%12;return flat?FLN[i]:SH[i]}
function isCh(l){const t=l.trim().split(/\s+/).map(w=>w.replace(/^\|+|\|+$/g,'')).filter(w=>w&&!/^([|•·.:–-]+|x\d)$/.test(w));return t.length>0&&t.every(w=>CK.test(w))}
function tline(l,d){return isCh(l)?l.replace(/[A-G][#b]?/g,m=>tr1(m,d)):l}
function baseKey(s){const m=(s.k||'').match(/^([A-G][#b]?)/);if(m)return SH.indexOf(FL[m[1]]||m[1]);for(const l of (s.x||'').split('\n'))if(isCh(l)){const r=l.match(/[A-G][#b]?/);if(r)return SH.indexOf(FL[r[0]]||r[0])}return 0}
/* Modulasi per bagian: s.md = {indeksBagian:{d:semiton,t:'teks penanda'}}.
   d relatif terhadap nada lagu yang sedang tampil; teks penanda dicocokkan agar aman setelah chord diedit. */
let showMod=false,ctlOpen=store.get('rl-ctl2',false),fitOn=store.get('rl-fit',true),colN=+store.get('rl-coln',0)||0;
const secList=s=>(s.x||'').split('\n').map(r=>r.trim()).filter(t=>t&&SEC.test(t));
const secMod=(s,i,t)=>{const m=s.md&&s.md[i];return m&&m.t===t?(m.d|0):0};
function setMod(s,i,t,d){d=((d%12)+12)%12;if(d>6)d-=12;const md=Object.assign({},s.md);if(d)md[i]={d,t};else delete md[i];if(Object.keys(md).length)s.md=md;else delete s.md}
const modCount=s=>secList(s).filter((t,i)=>secMod(s,i,t)).length;
function pruneMod(s){if(!s.md)return;const L=secList(s),md={};Object.keys(s.md).forEach(i=>{if(L[i]===s.md[i].t)md[i]=s.md[i]});if(Object.keys(md).length)s.md=md;else delete s.md}
/* Penanda bagian: label, lencana modulasi, dan (jika ctl) kontrol ubah nada bagian itu */
const secName=t=>t.replace(/^\[|\]$/g,'').replace(/\s*:\s*$/,'').trim();
function secHead(s,i,t,d,bk,ctl){const cu=(bk+trans+d+1200)%12,at=' data-id="'+s.id+'" data-i="'+i+'" data-t="'+esc(t)+'"',
b=(a,x,l,tx)=>'<button class="mb" type="button" data-a="'+a+'"'+at+(x||'')+' aria-label="'+l+'">'+tx+'</button>';
let h='<header class="sh"><i class="dot"></i><b>'+esc(secName(t))+'</b>';
if(d&&!ctl)h+='<span class="mbg">'+(d>0?'▲ ':'▼ ')+KL[cu]+' ('+(d>0?'+':'')+d+')</span>';
if(ctl)h+='<span class="mctl">'+b('smod',' data-d="-1"','Turunkan setengah nada','−')
+'<select class="msel" data-a="msel"'+at+' aria-label="Nada bagian '+esc(t)+'">'+KL.map((n,k)=>'<option value="'+k+'"'+(k===cu?' selected':'')+'>'+n+'</option>').join('')+'</select>'
+b('smod',' data-d="1"','Naikkan setengah nada','+')
+b('sfwd','','Samakan semua bagian sesudahnya dengan bagian ini','↧ Lanjut')
+(d?b('sclr','','Kembalikan ke nada lagu','✕'):'')+'</span>';
return h+'<span class="no">'+String(i+1).padStart(2,'0')+'</span></header>'}
/* Aksi tombol modulasi; true bila tombol itu milik modulasi */
function modAct(s,b){const a=b.dataset.a,i=+b.dataset.i,t=b.dataset.t;
if(a==='smod'){setMod(s,i,t,secMod(s,i,t)+ +b.dataset.d);return true}
if(a==='sclr'){setMod(s,i,t,0);return true}
if(a==='sfwd'){const d=secMod(s,i,t);secList(s).forEach((x,j)=>{if(j>i)setMod(s,j,x,d)});return true}
if(a==='mclr'){delete s.md;return true}
return false}
const modSel=el=>{const s=songs.find(x=>x.id===+el.dataset.id);if(s)setMod(s,+el.dataset.i,el.dataset.t,+el.value-(baseKey(s)+trans));return s};
function sheetHtml(s,ctl){const O=[],bk=baseKey(s),f0=flat;let c=null,st=0,si=-1,sd=0,hd='',bd=[];
const fl=()=>{if(c&&c.length)bd.push('<div class="u">'+c.join('\n')+'</div>');c=null;st=0},
cl=()=>{fl();if(hd||bd.length)O.push('<div class="sc'+(hd?(si===0&&ctl!==undefined?' on':''):' pre')+'"'+(hd?' data-si="'+si+'"':'')+'>'+hd+'<div class="sb">'+bd.join('')+'</div></div>');hd='';bd=[]};
(s.x||'').split('\n').forEach(raw=>{const t0=raw.trim();
if(t0&&SEC.test(t0)){cl();si++;sd=secMod(s,si,t0);flat=sd?FLATK.includes((bk+trans+sd+1200)%12):f0;hd=secHead(s,si,t0,sd,bk,ctl);return}
const l=tline(raw,trans+sd),t=l.trim();
if(!t){fl();bd.push('<div class="gp"></div>');return}
if(st===2||(c&&c.length>=6))fl();if(!c)c=[];
if(isCh(l)){st=1;if(showC)c.push('<span class="cl">'+esc(l)+'</span>')}
else{if(st>=1)st=2;if(showL)c.push(esc(l))}});
cl();flat=f0;return O.join('')}
/* Navigasi per bagian: pil di bawah, bagian aktif mengikuti gulir (atau ketukan pil) */
let secRaf=0,secLock=0;
function secNav(s,cap){const L=secList(s);if(L.length<2)return'';const at=i=>' data-id="'+s.id+'" data-i="'+i+'"';
return'<div class="sdock"><div class="snav"><button class="sn" type="button" data-a="sn" data-id="'+s.id+'" data-d="-1" aria-label="Bagian sebelumnya">‹</button><div class="spills">'
+L.map((t,i)=>'<button type="button" data-a="sj"'+at(i)+(i===0?' class="on"':'')+'>'+esc(secName(t))+'</button>').join('')
+'</div><button class="sn" type="button" data-a="sn" data-id="'+s.id+'" data-d="1" aria-label="Bagian berikutnya">›</button></div></div>'+(cap?'<div class="scap">Chordity · Per Section</div>':'')}
const chartRoot=()=>pvId?$('pvpre'):document.querySelector('#list .chartbox pre.chart');
function scroller(el){for(let p=el.parentElement;p;p=p.parentElement){const o=getComputedStyle(p).overflowY;if((o==='auto'||o==='scroll')&&p.scrollHeight>p.clientHeight)return p}return document.scrollingElement}
const secOff=()=>0;
const secCards=r=>[...r.querySelectorAll('.sc[data-si]')];
const secCur=r=>Math.max(0,secCards(r).findIndex(c=>c.classList.contains('on')));
let medInfo=[];
const medPills=j=>{const o=medInfo[j];return o?o.names.map((n,k)=>'<button type="button" data-a="sj" data-i="'+(o.off+k)+'">'+esc(n)+'</button>').join(''):''};
function medDock(j){if(medInfo.reduce((a,x)=>a+x.names.length,0)<2)return'';
return '<div class="sdock"><div class="snav" data-med="1" data-j="'+j+'"><button class="sn" type="button" data-a="sn" data-d="-1" aria-label="Bagian sebelumnya">\u2039</button><div class="spills">'+medPills(j)+'</div><button class="sn" type="button" data-a="sn" data-d="1" aria-label="Bagian berikutnya">\u203a</button></div></div>'}
function secMark(r,i){secCards(r).forEach((c,k)=>c.classList.toggle('on',k===i));
const box=pvId?$('pvnav'):r.closest('.chartbox'),nv=box&&box.querySelector('.snav');if(!nv)return;
let ps=nv.querySelectorAll('.spills button');const pl=nv.querySelector('.spills');let ix=i;
if(nv.dataset.med){let j=0;medInfo.forEach((o,q)=>{if(o.names.length&&i>=o.off)j=q});
if(+nv.dataset.j!==j){nv.dataset.j=j;pl.innerHTML=medPills(j);const tt=$('pvbar').querySelector('.ttl');if(tt){tt.querySelector('b').textContent=medInfo[j].t;tt.querySelector('small').textContent=medInfo[j].sub+' \u00b7 Medley'}ps=nv.querySelectorAll('.spills button')}
ix=[...ps].findIndex(q=>+q.dataset.i===i)}
ps.forEach((p,k)=>p.classList.toggle('on',k===ix));
const p=ps[ix];if(p)pl.scrollTo({left:p.offsetLeft-(pl.clientWidth-p.offsetWidth)/2,behavior:'smooth'})}
function secGo(b){const r=chartRoot();if(!r)return;const cs=secCards(r);if(!cs.length)return;
let i=+b.dataset.i;if(b.dataset.a==='sn')i=secCur(r)+ +b.dataset.d;i=Math.max(0,Math.min(cs.length-1,i));
if(r.classList.contains('fit')){secMark(r,i);return}
const sc=scroller(r),top=cs[i].getBoundingClientRect().top-sc.getBoundingClientRect().top+sc.scrollTop-secOff()-8;
secLock=Date.now()+700;sc.scrollTo({top,behavior:'smooth'});secMark(r,i)}
function secScan(){if(Date.now()<secLock)return;const r=chartRoot();if(!r||r.classList.contains('fit'))return;const cs=secCards(r);if(!cs.length)return;
const sc=scroller(r),b=sc.getBoundingClientRect(),ref=b.top+secOff()+24,tp=cs.map(c=>c.getBoundingClientRect().top);let k=0;
tp.forEach((t,i)=>{if(t<=ref)k=i});
const cur=secCur(r),row=tp.map((t,i)=>i).filter(i=>Math.abs(tp[i]-tp[k])<4),end=sc.scrollTop+sc.clientHeight>=sc.scrollHeight-2;
if(row.includes(cur))k=cur;else if(end&&tp[cur]>=ref-4)k=cur;else k=row[0];
if(k!==cur||!cs[k].classList.contains('on'))secMark(r,k)}
document.addEventListener('scroll',e=>{if(e.target&&e.target.closest&&e.target.closest('.snav'))return;if(secRaf)return;secRaf=requestAnimationFrame(()=>{secRaf=0;secScan()})},true);
function editBox(s){const id=' data-id="'+s.id+'"',M=['Intro','Verse','Chorus','Bridge','Outro','Interlude'];
return '<div class="chartbox edit"><div class="edtop"><button class="btn sm" data-a="cx"'+id+'>\u2039 Batal</button>'
+'<div class="ttl"><b>Edit chord</b><small>'+esc(s.t)+'</small></div>'
+'<button class="btn sm main" data-a="sv"'+id+'>Simpan</button></div>'
+'<div class="edtools"><span class="cgl">Sisipkan bagian</span>'+M.map(m=>'<button class="btn sm" data-a="ins" data-m="['+m+']"'+id+'>'+m+'</button>').join('')+'<span class="edhint">Baris chord di atas lirik. Penanda bagian di barisnya sendiri, mis. [Verse 1].</span></div>'
+'<textarea id="ex" wrap="off" spellcheck="false" aria-label="Edit chord">'+esc(s.x||'')+'</textarea></div>'}
function chartBox(s){if(editSong===s.id)return editBox(s);
const bk=baseKey(s),cu=(bk+trans+1200)%12,id=' data-id="'+s.id+'"',n=modCount(s),hasSec=secList(s).length>0;flat=FLATK.includes(cu);
const B=(a,t,x)=>'<button class="btn sm" data-a="'+a+'"'+id+(x||'')+'>'+t+'</button>',
P=(a,t,on)=>B(a,t,' aria-pressed="'+on+'"'),
G=(l,h,w)=>'<div class="cg'+(w?' wide':'')+'"><span class="cgl">'+l+'</span>'+h+'</div>',
keys=KL.map((k,i)=>'<button class="btn sm" data-a="key" data-k="'+i+'"'+id+' aria-pressed="'+(cu===i)+'">'+k+'</button>').join(''),
modHint=!showMod?'':!s.x?'':hasSec?'<p class="chint">Ketuk − / + atau pilih nada pada penanda bagian di bawah. “↧ Lanjut” menyamakan semua bagian sesudahnya.</p>':'<p class="chint">Belum ada penanda bagian. Tekan Edit lalu tulis penanda di barisnya sendiri, mis. [Verse], [Chorus], atau Bridge, agar tiap bagian bisa punya nada sendiri.</p>';
const ttl='<div class="ttl"><b>'+esc(s.t)+'</b><small>'+esc([s.c,s.k].filter(Boolean).join(', '))+'</small></div>';
return '<div class="chartbox"><div class="tools">'
+B('ch','\u2039 Daftar',' title="Kembali ke daftar lagu"').replace('btn sm','btn sm back')+ttl
+'<div class="tg" role="group" aria-label="Tampilan">'+(fitOn?'':B('fs','A\u2212',' data-d="-1"')+B('fs','A+',' data-d="1"'))+P('tc','Chord',showC)+P('tl','Lirik',showL)+P('fit','Muat layar',fitOn)+'</div>'
+'<div class="tg" role="group" aria-label="Auto scroll">'+P('as',asOn?'Stop':'Auto scroll',asOn)+'<input type="range" class="asr" min="1" max="12" value="'+asSpeed+'" aria-label="Kecepatan auto scroll" title="Kecepatan"></div>'
+'<button class="btn sm more" data-a="ctl"'+id+' aria-expanded="'+ctlOpen+'">Nada '+KL[cu]+(n?' \u00b7 '+n+' mod':'')+' '+(ctlOpen?'\u25b4':'\u25be')+'</button>'
+B('fsc','\u2922',' aria-label="Layar penuh" title="Layar penuh"')+'</div>'
+'<div class="chartctl drawer"'+(ctlOpen?'':' hidden')+'>'
+G('Nada dasar','<div class="kgrid">'+keys+'</div><div class="crow">'+B('tr','Lebih rendah',' data-d="-1"')+B('tr','Lebih tinggi',' data-d="1"')+(trans?B('perm','Simpan nada ini'):'')+'</div>',1)
+G('Kolom','<div class="crow">'+[0,1,2,3,4].map(k=>B('cn',k?k:'Otomatis',' data-n="'+k+'" aria-pressed="'+(colN===k)+'"')).join('')+'</div><p class="chint">'+(fitOn?'Muat layar aktif: font dibesarkan otomatis sampai seluruh lagu muat.':'Muat layar nonaktif: lagu menggulir ke bawah dalam kolom pilihan Anda.')+'</p>')
+G('Modulasi per bagian','<div class="crow">'+P('mod','Atur nada tiap bagian'+(n?' \u00b7 '+n:''),showMod)+(n?B('mclr','Hapus semua modulasi'):'')+'</div>'+modHint)
+G('Aksi','<div class="crow">'+B('ed','Edit')+B('pr','Cetak')+B('pv','Presenter view')+'</div>')
+G('Lagu','<div class="crow">'+(s.b?B('bpm',s.b+' BPM \u00b7 pakai di metronom'):'')+B('st','Status: '+(s.s||'belajar'))+B('del','Hapus lagu')+'</div>')
+'</div><div class="sheet"><pre class="chart'+(fitOn?' fit':'')+'" style="font-size:'+fs+'px">'+(s.x?sheetHtml(s,showMod):'Belum ada chord. Tekan Edit untuk menambahkan.')+'</pre></div>'+secNav(s)+'</div>'}
const SEEDS=[
{id:1,t:'Canon in D',c:'Pachelbel',k:'D',b:55,x:'D  A  Bm  F#m\nG  D  G  A',s:'latihan'},
{id:2,t:'Für Elise',c:'Beethoven',k:'A minor',b:120,s:'belajar'},
{id:3,t:'Greensleeves',c:'Tradisional',k:'E minor',b:90,s:'siap'}];
const SEED_JSON=JSON.stringify(SEEDS);
let songs=store.get('songs',SEEDS);
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function renderSongs(){store.set('songs',songs);$('list').innerHTML=songs.length?songs.map(s=>(openSong===s.id?'<div class="sx"><div class="song open">':'<div class="song">')+'<div class="t"><b>'+esc(s.t)+'</b><small>'+esc([s.c,s.k].filter(Boolean).join(', '))+'</small></div>'+
(s.b?'<button class="btn sm" data-a="bpm" data-id="'+s.id+'" title="Pakai tempo ini di metronom">'+s.b+' BPM</button>':'')+
'<button class="btn sm" data-a="ch" data-id="'+s.id+'">Chord</button>'+'<button class="st '+s.s+'" data-a="st" data-id="'+s.id+'">'+s.s+'</button><button class="btn sm" data-a="del" data-id="'+s.id+'" aria-label="Hapus">✕</button></div>'+(openSong===s.id?chartBox(s)+'</div>':'')).join(''):'<div class="empty">Belum ada lagu. Tambahkan lagu pertamamu di bawah.</div>';requestAnimationFrame(secScan)}
$('list').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=+b.dataset.id,s=songs.find(x=>x.id===id);if(!s)return;
if(b.dataset.a==='sn'||b.dataset.a==='sj'){secGo(b);return}
if(modAct(s,b)){renderSongs();return}
if(b.dataset.a==='mod'){showMod=!showMod;renderSongs();return}
if(b.dataset.a==='ins'){const t=$('ex');if(t){const a=t.selectionStart,e=t.selectionEnd,nl=a&&t.value[a-1]!=='\n'?'\n':'';t.setRangeText(nl+b.dataset.m+'\n',a,e,'end');t.focus()}return}
if(b.dataset.a==='cn'){colN=+b.dataset.n||0;store.set('rl-coln',colN);renderSongs();return}
if(b.dataset.a==='fit'){fitOn=!fitOn;store.set('rl-fit',fitOn);renderSongs();return}
if(b.dataset.a==='fsc'){const d=document;d.fullscreenElement?d.exitFullscreen():d.documentElement.requestFullscreen().catch(()=>{});return}
if(b.dataset.a==='ctl'){ctlOpen=!ctlOpen;store.set('rl-ctl2',ctlOpen);renderSongs();return}
if(b.dataset.a==='del')songs=songs.filter(x=>x.id!==id);
if(b.dataset.a==='st')s.s=ST[(ST.indexOf(s.s)+1)%3];
if(b.dataset.a==='ch'){openSong=openSong===id?0:id;trans=0;editSong=0;renderSongs();return}
if(b.dataset.a==='tr'){trans+=+b.dataset.d;renderSongs();return}
if(b.dataset.a==='ed'){editSong=id;renderSongs();return}
if(b.dataset.a==='cx'){editSong=0;renderSongs();return}
if(b.dataset.a==='fs'){fs=Math.max(10,Math.min(28,fs+2*(+b.dataset.d)));renderSongs();return}
if(b.dataset.a==='tc'){showC=!showC;renderSongs();return}
if(b.dataset.a==='tl'){showL=!showL;renderSongs();return}
if(b.dataset.a==='cols'){cols2=!cols2;store.set('rl-cols',cols2);renderSongs();return}
if(b.dataset.a==='pr'){window.print();return}
if(b.dataset.a==='as'){setAS(!asOn);return}
if(b.dataset.a==='pv'){openPv(id,[]);return}
if(b.dataset.a==='key'){let d=(+b.dataset.k-baseKey(s)+12)%12;if(d>6)d-=12;trans=d;renderSongs();return}
if(b.dataset.a==='sv'){s.x=$('ex').value;pruneMod(s);editSong=0;renderSongs();return}
if(b.dataset.a==='perm'){s.x=(s.x||'').split('\n').map(l=>tline(l,trans)).join('\n');if(/^[A-G][#b]?m?$/.test(s.k||''))s.k=tline(s.k,trans);trans=0;renderSongs();return}
if(b.dataset.a==='bpm'){setBpm(s.b);location.hash='metronom';return}
renderSongs()};
$('list').onchange=e=>{const el=e.target;if(el.dataset&&el.dataset.a==='msel'&&modSel(el))renderSongs()};
const F=id=>document.querySelector('#f #'+id);
$('fa').onclick=()=>{const t=F('ft').value.trim();if(!t){F('ft').focus();return}
songs.unshift({id:Date.now(),t,c:F('fc').value.trim(),k:F('fk').value.trim(),b:+F('fb').value||0,x:F('fx').value,s:'belajar'});
['ft','fc','fk','fb','fx'].forEach(i=>F(i).value='');renderSongs();location.hash='perpustakaan'};
renderSongs();

/* Chord */
const CT={'mayor':[0,4,7],'minor (m)':[0,3,7],'7':[0,4,7,10],'maj7':[0,4,7,11],'m7':[0,3,7,10],'sus4':[0,5,7],'dim':[0,3,6]};
const CS={'mayor':'','minor (m)':'m','7':'7','maj7':'maj7','m7':'m7','sus4':'sus4','dim':'dim'};
const SHP={C:'x32010',D:'xx0232',E:'022100',G:'320003',A:'x02220',F:'133211',Am:'x02210',Dm:'xx0231',Em:'022000',Bm:'x24432',C7:'x32310',D7:'xx0212',E7:'020100',G7:'320001',A7:'x02020',B7:'x21202',Cmaj7:'x32000',Fmaj7:'xx3210',Am7:'x02010',Dm7:'xx0211',Em7:'022030'};
function diag(sh){const f=sh.split('').map(c=>c==='x'?-1:+c),nz=f.filter(x=>x>0),base=nz.length&&Math.max(...nz)>4?Math.min(...nz):1;let s='';
for(let i=0;i<6;i++){const x=20+i*26;s+='<line x1="'+x+'" y1="30" x2="'+x+'" y2="170" stroke="currentColor" stroke-width="1.5"/>';
if(f[i]===-1)s+='<text x="'+x+'" y="22" text-anchor="middle" font-size="14" fill="currentColor">×</text>';else if(f[i]===0)s+='<circle cx="'+x+'" cy="17" r="5" fill="none" stroke="currentColor"/>';else s+='<circle cx="'+x+'" cy="'+(30+(f[i]-base+1)*28-14)+'" r="9" fill="var(--brass)"/>'}
for(let r=0;r<=5;r++)s+='<line x1="20" y1="'+(30+r*28)+'" x2="150" y2="'+(30+r*28)+'" stroke="currentColor" stroke-width="'+(r===0&&base===1?4:1)+'"/>';
if(base>1)s+='<text x="158" y="50" font-size="12" fill="currentColor">'+base+'</text>';return s}
function renderChord(){const r=+$('cr').value,t=$('ct').value,name=SH[r]+CS[t],sh=SHP[name];$('cn').textContent=name;$('cnotes').textContent='Nada: '+CT[t].map(i=>SH[(r+i)%12]).join(', ');$('cd').innerHTML=sh?diag(sh):'';$('cmsg').textContent=sh?'Gitar, senar 6 ke 1 (× = tidak dimainkan, ○ = senar kosong)':'Diagram tersedia untuk akor umum di posisi terbuka'}
SH.forEach((n,i)=>$('cr').add(new Option(n,i)));Object.keys(CT).forEach(k=>$('ct').add(new Option(k,k)));
$('cr').onchange=$('ct').onchange=renderChord;renderChord();
$('cplay').onclick=()=>{audio();const r=+$('cr').value;CT[$('ct').value].forEach((i,j)=>beep(ctx.currentTime+j*.06,440*Math.pow(2,(48+r+i-69)/12),1.6,.15))};

/* Scale: bentuk scale di fretboard bass & gitar */
const SC_R=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'],SC_DEG=['1','b2','2','b3','3','4','b5','5','b6','6','b7','7'],SC_LET='CDEFGAB',SC_NP=[0,2,4,5,7,9,11],SC_FR=17,
SC_T=[{k:'mayor',n:'Mayor',iv:[0,2,4,5,7,9,11]},{k:'minor',n:'Minor (natural)',iv:[0,2,3,5,7,8,10]},{k:'pmay',n:'Pentatonik Mayor',iv:[0,2,4,7,9]},{k:'pmin',n:'Pentatonik Minor',iv:[0,3,5,7,10]},{k:'blues',n:'Blues',iv:[0,3,5,6,7,10],pat:[0,3,5,7,10],ex:[6]},{k:'dor',n:'Dorian',iv:[0,2,3,5,7,9,10]},{k:'mix',n:'Mixolydian',iv:[0,2,4,5,7,9,10]},{k:'hmin',n:'Minor Harmonik',iv:[0,2,3,5,7,8,11]}],
SC_I=[{id:'bass',n:'Bass',s:[28,33,38,43],l:['E','A','D','G']},{id:'gitar',n:'Gitar',s:[40,45,50,55,59,64],l:['E','A','D','G','B','E']}];
let sc=Object.assign({r:0,k:'mayor',p:0,i:'both',m:'nada'},store.get('rl-sc',{}));
if(!(sc.r>=0&&sc.r<12))sc.r=0;if(!SC_T.some(t=>t.k===sc.k))sc.k='mayor';
function scSpell(r,iv){const t=(SC_LET.indexOf(SC_R[r][0])+ +SC_DEG[iv].slice(-1)-1)%7;let d=(((r+iv)%12-SC_NP[t])%12+12)%12;if(d>6)d-=12;return SC_LET[t]+(d>0?'#'.repeat(d):'b'.repeat(-d))}
function scPat(ins,r,T,j){const iv=T.pat||T.iv,per=iv.length===7?3:2,set=new Set(iv.map(x=>(r+x)%12)),low=ins.s[0],L=[];
for(let p=low;p<low+48;p++)if(set.has(p%12))L.push(p);
let ix=L.findIndex(p=>p%12===(r+iv[j])%12);const o=[];
ins.s.forEach((b,s)=>{for(let q=0;q<per;q++)o.push([s,L[ix++]-b])});
let best=null;[-12,0,12].forEach(sh=>{const f=o.map(x=>x[1]+sh);if(Math.min(...f)<0)return;const ov=f.filter(x=>x>SC_FR).length,mx=Math.max(...f);if(!best||ov<best.ov||(ov===best.ov&&mx<best.mx))best={sh,ov,mx}});
const sh=best?best.sh:12,P=o.map(x=>[x[0],x[1]+sh]).filter(x=>x[1]>=0&&x[1]<=SC_FR);
if(T.ex&&P.length){const mn=Math.min(...P.map(x=>x[1])),mx=Math.max(...P.map(x=>x[1]));ins.s.forEach((b,s)=>{for(let f=mn;f<=mx;f++)if(T.ex.includes(((b+f-r)%12+12)%12)&&!P.some(x=>x[0]===s&&x[1]===f))P.push([s,f])})}
return P}
function scSvg(ins,r,T,P){const ns=ins.s.length,G=28,top=20,W=760,x0=66,fw=(W-x0-8)/SC_FR,H=top+(ns-1)*G+44,y=s=>top+(ns-1-s)*G,xm=f=>f?x0+(f-.5)*fw:x0-20,
set=new Set(T.iv),ps=P&&new Set(P.map(x=>x[0]+':'+x[1])),y0=y(ns-1)-8,y1=y(0)+8,ym=(y(0)+y(ns-1))/2,dy=(ns-1)*G/4;
let o='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Fretboard '+ins.n+'">';
for(let f=1;f<=SC_FR;f++)o+='<line class="fbf" x1="'+(x0+f*fw)+'" y1="'+y0+'" x2="'+(x0+f*fw)+'" y2="'+y1+'"/>';
o+='<line class="fbn" x1="'+x0+'" y1="'+(y0-1)+'" x2="'+x0+'" y2="'+(y1+1)+'"/>';
[3,5,7,9,15,17].forEach(f=>o+='<circle class="fbi" cx="'+xm(f)+'" cy="'+ym+'" r="5"/>');
o+='<circle class="fbi" cx="'+xm(12)+'" cy="'+(ym-dy)+'" r="5"/><circle class="fbi" cx="'+xm(12)+'" cy="'+(ym+dy)+'" r="5"/>';
for(let s=0;s<ns;s++){o+='<line class="fbs" stroke-width="'+(2.8-s*.35).toFixed(2)+'" x1="'+(x0-36)+'" y1="'+y(s)+'" x2="'+(W-8)+'" y2="'+y(s)+'"/><text class="fbl" x="10" y="'+(y(s)+4)+'">'+ins.l[s]+'</text>'}
[3,5,7,9,12,15,17].forEach(f=>o+='<text class="fbt" x="'+xm(f)+'" y="'+(H-8)+'">'+f+'</text>');
for(let s=0;s<ns;s++)for(let f=0;f<=SC_FR;f++){const i=((ins.s[s]+f-r)%12+12)%12;if(!set.has(i))continue;
const on=!ps||ps.has(s+':'+f),rt=i===0,cx=xm(f),cy=y(s);
if(!on){o+='<circle class="fnn d" cx="'+cx+'" cy="'+cy+'" r="5"/>';continue}
o+='<circle class="fnn'+(rt?' r':'')+'" cx="'+cx+'" cy="'+cy+'" r="11"/><text class="fnt'+(rt?' r':'')+'" x="'+cx+'" y="'+(cy+4)+'">'+(sc.m==='nada'?scSpell(r,i):SC_DEG[i])+'</text>'}
return o+'</svg>'}
function renderScale(){const T=SC_T.find(t=>t.k===sc.k),pat=T.pat||T.iv;if(sc.p>pat.length)sc.p=0;
$('sr').value=sc.r;$('sk').value=sc.k;
$('snotes').textContent='Nada: '+T.iv.map(i=>scSpell(sc.r,i)).join(' ');
const chip=(a,v,t,on,x)=>'<button class="btn sm" type="button" data-'+a+'="'+v+'" aria-pressed="'+on+'"'+(x||'')+'>'+t+'</button>';
$('spos').innerHTML=chip('p',0,'Semua',sc.p===0)+pat.map((_,j)=>chip('p',j+1,j+1,sc.p===j+1,' aria-label="Posisi '+(j+1)+'"')).join('');
$('sins').innerHTML=[['both','Keduanya'],['bass','Bass'],['gitar','Gitar']].map(a=>chip('i',a[0],a[1],sc.i===a[0])).join('');
$('slab').innerHTML=[['nada','Nada'],['derajat','Derajat']].map(a=>chip('m',a[0],a[1],sc.m===a[0])).join('');
let h='';SC_I.forEach(ins=>{if(sc.i!=='both'&&sc.i!==ins.id)return;const P=sc.p?scPat(ins,sc.r,T,sc.p-1):null;
let cap='';if(P&&P.length){const f=P.map(x=>x[1]);cap=' · Fret '+Math.min(...f)+'–'+Math.max(...f)}
h+='<div class="fbh"><b>'+ins.n+'</b><span>'+ins.l.join(' ')+cap+'</span></div><div class="fbscroll"'+(P&&P.length?' data-f="'+Math.min(...P.map(x=>x[1]))+'"':'')+'>'+scSvg(ins,sc.r,T,P)+'</div>'});
$('sfb').innerHTML=h;
document.querySelectorAll('#sfb .fbscroll').forEach(e=>{const f=+e.dataset.f||0;e.scrollLeft=f>2?Math.max(0,(66+(f-1.6)*((760-74)/SC_FR))/760*e.scrollWidth-6):0});
$('shint').textContent=(sc.p?'Titik pudar = nada scale lain di luar bentuk. Posisi '+sc.p+' dimulai dari derajat ke-'+sc.p+' di senar terendah. ':'Pilih nomor posisi untuk melihat satu bentuk scale. ')+'Titik berwarna = nada dasar. Geser diagram ke samping jika layar sempit.';
store.set('rl-sc',sc)}
SC_R.forEach((n,i)=>$('sr').add(new Option(n,i)));SC_T.forEach(t=>$('sk').add(new Option(t.n,t.k)));
$('sr').onchange=()=>{sc.r=+$('sr').value;renderScale()};$('sk').onchange=()=>{sc.k=$('sk').value;renderScale()};
$('scale').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;if(d.p!==undefined)sc.p=+d.p;else if(d.i)sc.i=d.i;else if(d.m)sc.m=d.m;else return;renderScale()});
renderScale();

/* Acara */
let evs=store.get('events',[]),curEv=store.get('curEv',0);
/* Medley: gabungkan beberapa lagu dalam satu acara. Bank lagu tidak berubah; medley hanya tersimpan di acara. */
const isMed=x=>!!x&&typeof x==='object';
function evIds(e){const r=[];e.s.forEach(x=>{if(isMed(x))r.push(...x.s);else r.push(x)});return r}
function medOf(id){const e=cur();return e?e.s.find(x=>isMed(x)&&x.m===id)||null:null}
function medName(m){return m.s.map(id=>{const s=songs.find(x=>x.id===id);return s?s.t:''}).filter(Boolean).join(' → ')}
function medShift(s,k){let d=(k-baseKey(s)+12)%12;if(d>6)d-=12;return d}
function medHtml(m,ss){const out=ss.map((s,i)=>{const d=medShift(s,m.k);flat=FLATK.includes(m.k);trans=d;
return '<div class="medh" id="mh'+i+'"><span class="sec">'+(i+1)+'. '+esc(s.t)+'</span><small>'+KL[baseKey(s)]+' → '+KL[m.k]+(d?' ('+(d>0?'+':'')+d+')':'')+'</small></div>'+(s.x?sheetHtml(s):'Belum ada chord untuk lagu ini.')}).join('');trans=0;return out}
function renderPvMed(){const m=medOf(pvId),ss=m?m.s.map(id=>songs.find(x=>x.id===id)).filter(Boolean):[];if(!m||!ss.length){closePv();return}
const i=pvList.indexOf(pvId),B=(a,t,x)=>'<button class="btn sm" data-a="'+a+'"'+(x||'')+'>'+t+'</button>';
const keys=KL.map((n,k)=>'<button class="btn sm" data-a="mkey" data-k="'+k+'" aria-pressed="'+(m.k===k)+'">'+n+'</button>').join('');
let off=0;medInfo=ss.map((x,j)=>{const d=medShift(x,m.k),L=secList(x),o={t:(j+1)+'. '+x.t,sub:KL[baseKey(x)]+' \u2192 '+KL[m.k]+(d?' ('+(d>0?'+':'')+d+')':''),names:L.map(secName),off};off+=L.length;return o});
const jumps=ss.map((s,j)=>B('jump',(j+1)+'. '+esc(s.t),' data-i="'+j+'"')).join('');
const drm='<div class="cg wide"><span class="cgl">Nada dasar medley</span><div class="kgrid">'+keys+'</div></div>';
$('pvbar').innerHTML=pvBar(medInfo[0].t,medInfo[0].sub+' \u00b7 Medley',KL[m.k],drm);
$('pvpre').className='chart'+(fitOn?' fit':'');$('pvpre').style.fontSize=pvFs+'px';$('pvpre').innerHTML=medHtml(m,ss);$('pvnav').innerHTML=medDock(0);requestAnimationFrame(secScan)}
/* Popup medley: pilih lagu, nada dasar langsung ikut diatur */
let mdS=[],mdK=0,mdKt=false,mdEdit=null,mdQ='';
function openMd(m){const e=cur();if(!e)return;mdEdit=m?m.m:null;mdS=m?m.s.slice():[];mdK=m?m.k:0;mdKt=!!m;mdQ='';$('md').hidden=false;document.body.style.overflow='hidden';
$('mdbox').innerHTML='<div class="mdh"><b>'+(m?'Atur medley':'Buat medley')+'</b><button class="btn sm" data-a="mx">Tutup</button></div><div class="mdg"><div class="mdl"><input id="mdq" placeholder="Cari lagu…" aria-label="Cari lagu" autocomplete="off"><div id="mdlist"></div></div><div id="mdsel"></div></div>';mdList();mdSel()}
function closeMd(){$('md').hidden=true;document.body.style.overflow=pvId?'hidden':''}
function mdList(){const e=cur(),inDraft=new Set(e.s.filter(x=>!isMed(x))),other=new Set();e.s.forEach(x=>{if(isMed(x)&&x.m!==mdEdit)x.s.forEach(id=>other.add(id))});
const q=mdQ.trim().toLowerCase();const L=songs.filter(s=>!q||s.t.toLowerCase().includes(q)||(s.c||'').toLowerCase().includes(q));
L.sort((a,b)=>(inDraft.has(b.id)-inDraft.has(a.id))||a.t.localeCompare(b.t));
$('mdlist').innerHTML=L.length?L.map(s=>{const n=mdS.indexOf(s.id)+1,dis=other.has(s.id);return '<button class="mdi'+(n?' on':'')+'" data-a="mt" data-id="'+s.id+'"'+(dis?' disabled':'')+'><i>'+(n||'')+'</i><span><b>'+esc(s.t)+'</b><small>'+esc([s.k,inDraft.has(s.id)?'di draf':'',dis?'di medley lain':''].filter(Boolean).join(' · '))+'</small></span></button>'}).join(''):'<div class="empty">Lagu tidak ditemukan.</div>'}
function mdSel(){const ss=mdS.map(id=>songs.find(x=>x.id===id)).filter(Boolean);if(ss.length&&!mdKt)mdK=baseKey(ss[0]);
let h='';
if(ss.length<2)h+='<div class="sub" style="text-align:left">Ketuk minimal 2 lagu di daftar. Urutan ketukan menjadi urutan medley.</div>';
h+=ss.map((s,i)=>{const d=medShift(s,mdK);return '<div class="mdrow"><span>'+(i+1)+'.</span><div class="t"><b>'+esc(s.t)+'</b><small>'+(ss.length>1?KL[baseKey(s)]+' → '+KL[mdK]+(d?' ('+(d>0?'+':'')+d+')':' (tetap)'):'Nada asli '+KL[baseKey(s)])+'</small></div><button class="btn sm" data-a="mu" data-i="'+i+'" aria-label="Naik">▲</button><button class="btn sm" data-a="mdn" data-i="'+i+'" aria-label="Turun">▼</button><button class="btn sm" data-a="mr" data-i="'+i+'" aria-label="Keluarkan">✕</button></div>'}).join('');
if(ss.length>=2)h+='<div class="mdk">Nada dasar medley</div><div class="chips" style="justify-content:flex-start">'+KL.map((n,k)=>'<button class="btn sm" data-a="mk" data-k="'+k+'" aria-pressed="'+(mdK===k)+'">'+n+'</button>').join('')+'</div><div class="sub" style="text-align:left;margin-top:6px">Semua lagu otomatis disamakan ke nada ini. Lagu aslinya di bank tidak berubah.</div>';
h+='<div class="row" style="justify-content:flex-start;margin-top:12px"><button class="btn main" data-a="ms"'+(ss.length<2?' disabled':'')+'>Simpan medley</button>'+(mdEdit?'<button class="btn" data-a="mb">Bongkar medley</button>':'')+'</div>';
$('mdsel').innerHTML=h}
function mdSave(){const e=cur();if(!e||mdS.length<2)return;let m=mdEdit?e.s.find(x=>isMed(x)&&x.m===mdEdit):null;
if(m){m.s=mdS.slice();m.k=mdK}else{m={m:'m'+Date.now(),s:mdS.slice(),k:mdK};const pos=e.s.findIndex(x=>!isMed(x)&&mdS.includes(x));if(pos>=0)e.s.splice(pos,0,m);else e.s.push(m)}
e.s=e.s.filter(x=>isMed(x)||!mdS.includes(x));closeMd();renderEv()}
$('md').onclick=e=>{if(e.target===$('md')){closeMd();return}const b=e.target.closest('button');if(!b)return;const a=b.dataset.a,i=+b.dataset.i;
if(a==='mx'){closeMd();return}
if(a==='mt'){const id=+b.dataset.id,j=mdS.indexOf(id);if(j>=0)mdS.splice(j,1);else mdS.push(id);mdList();mdSel();return}
if(a==='mu'&&i>0)[mdS[i-1],mdS[i]]=[mdS[i],mdS[i-1]];
if(a==='mdn'&&i<mdS.length-1)[mdS[i+1],mdS[i]]=[mdS[i],mdS[i+1]];
if(a==='mr')mdS.splice(i,1);
if(a==='mk'){mdK=+b.dataset.k;mdKt=true}
if(a==='ms'){mdSave();return}
if(a==='mb'){const ev=cur(),j=ev.s.findIndex(x=>isMed(x)&&x.m===mdEdit);if(j>=0)ev.s.splice(j,1,...ev.s[j].s);closeMd();renderEv();return}
mdList();mdSel()};
$('md').oninput=e=>{if(e.target.id==='mdq'){mdQ=e.target.value;mdList()}};
function saveEv(){store.set('events',evs);store.set('curEv',curEv)}
function cur(){return evs.find(e=>e.id===curEv)}
function renderEv(){
if(!evs.length){evs=[{id:Date.now(),n:'Acara pertama',d:'',s:[]}];curEv=evs[0].id}
if(!cur())curEv=evs[0].id;
const e=cur();
$('ev').innerHTML=evs.map(x=>'<option value="'+x.id+'"'+(x.id===curEv?' selected':'')+'>'+esc(x.n||'Tanpa nama')+'</option>').join('');
$('evname').value=e.n;$('evdate').value=e.d;
e.s=e.s.filter(x=>isMed(x)?(x.s=x.s.filter(id=>songs.some(y=>y.id===id))).length>0:songs.some(y=>y.id===x));
const evBtn=i=>'<button class="btn sm" data-a="up" data-i="'+i+'" aria-label="Naik">▲</button><button class="btn sm" data-a="dn" data-i="'+i+'" aria-label="Turun">▼</button><button class="btn sm" data-a="rm" data-i="'+i+'" aria-label="Hapus dari draf">✕</button>';
$('evlist').innerHTML=e.s.length?e.s.map((x,i)=>{if(isMed(x))return '<div class="song med"><span>'+(i+1)+'.</span><div class="t"><b>'+esc(medName(x))+'</b><small>Medley · '+x.s.length+' lagu · nada dasar '+KL[x.k]+'</small></div><button class="btn sm" data-a="ch" data-m="'+x.m+'">Chord</button><button class="btn sm" data-a="atur" data-m="'+x.m+'">Atur</button>'+evBtn(i)+'</div>';const s=songs.find(y=>y.id===x);return '<div class="song"><span>'+(i+1)+'.</span><div class="t"><b>'+esc(s.t)+'</b><small>'+esc([s.k,s.b?s.b+' BPM':''].filter(Boolean).join(', '))+'</small></div><button class="btn sm" data-a="ch" data-id="'+x+'">Chord</button>'+evBtn(i)+'</div>'}).join(''):'<div class="empty">Draf masih kosong. Pilih lagu dari perpustakaan di bawah.</div>';
const rest=songs.filter(s=>!evIds(e).includes(s.id));
$('evadd').innerHTML=rest.length?rest.map(s=>'<option value="'+s.id+'">'+esc(s.t)+'</option>').join(''):'<option value="">Semua lagu sudah masuk</option>';
{const nm=e.s.filter(isMed).length;$('evsum').textContent=evIds(e).length+' lagu dalam draf'+(nm?' · '+nm+' medley':'')}
saveEv()}
$('evlist').onclick=e=>{const b=e.target.closest('button');if(!b)return;const ev=cur(),i=+b.dataset.i,a=b.dataset.a;
const lst=()=>ev.s.map(x=>isMed(x)?x.m:x);
if(a==='ch'){trans=0;openPv(b.dataset.m||+b.dataset.id,lst());return}
if(a==='atur'){const m=medOf(b.dataset.m);if(m)openMd(m);return}
if(a==='rm')ev.s.splice(i,1);
if(a==='up'&&i>0)[ev.s[i-1],ev.s[i]]=[ev.s[i],ev.s[i-1]];
if(a==='dn'&&i<ev.s.length-1)[ev.s[i+1],ev.s[i]]=[ev.s[i],ev.s[i+1]];
renderEv()};
$('ev').onchange=e=>{curEv=+e.target.value;renderEv()};
$('evn').onclick=()=>{const n={id:Date.now(),n:'Acara baru',d:'',s:[]};evs.push(n);curEv=n.id;renderEv();$('evname').select()};
$('evd').onclick=()=>{if(evs.length>1){evs=evs.filter(x=>x.id!==curEv);curEv=evs[0].id}else{cur().s=[];cur().n='Acara pertama';cur().d=''}renderEv()};
$('evname').oninput=e=>{cur().n=e.target.value;saveEv();const o=$('ev').selectedOptions[0];if(o)o.textContent=e.target.value||'Tanpa nama'};
$('evdate').onchange=e=>{cur().d=e.target.value;saveEv()};
$('evaddb').onclick=()=>{const v=+$('evadd').value;if(v){cur().s.push(v);renderEv()}};

/* Auto scroll & Presenter */
function setAS(on){asOn=on;asRun++;document.querySelectorAll('[data-a="as"]').forEach(b=>{b.setAttribute('aria-pressed',on);b.textContent=on?'Stop scroll':'Auto scroll'});if(on){asLast=performance.now();asAcc=0;const g=asRun;requestAnimationFrame(t=>asLoop(t,g))}}
function asLoop(t,g){if(!asOn||g!==asRun)return;asAcc+=asSpeed*8*(t-asLast)/1000;asLast=t;const px=Math.floor(asAcc);
if(px>0){asAcc-=px;if(pvId){const el=$('pvsheet');el.scrollTop+=px;if(el.scrollTop+el.clientHeight>=el.scrollHeight-2)return setAS(false)}else{const el=(curTab==='perpustakaan'&&document.querySelector('#list .sheet'))||$(curTab);el.scrollTop+=px;if(el.scrollTop+el.clientHeight>=el.scrollHeight-2)return setAS(false)}}
requestAnimationFrame(t2=>asLoop(t2,g))}
document.addEventListener('input',e=>{if(e.target.classList.contains('asr')){asSpeed=+e.target.value;document.querySelectorAll('.asr').forEach(x=>x.value=asSpeed)}});
let pvDr=false;
function pvBar(title,sub,keyLbl,dr){const i=pvList.indexOf(pvId),B=(a,t,x)=>'<button class="btn sm" data-a="'+a+'"'+(x||'')+'>'+t+'</button>',P=(a,t,on)=>B(a,t,' aria-pressed="'+on+'"'),
G=(l,h,w)=>'<div class="cg'+(w?' wide':'')+'"><span class="cgl">'+l+'</span>'+h+'</div>';
const nav=pvList.length>1?'<div class="tg pvn">'+B('pn','\u2039',' data-d="-1" aria-label="Sebelumnya"'+(i<1?' disabled':''))+'<span class="pvc">'+(i+1)+' / '+pvList.length+'</span>'+B('pn','\u203a',' data-d="1" aria-label="Berikutnya"'+(i>=pvList.length-1?' disabled':''))+'</div>':'';
const cols=G('Kolom','<div class="crow">'+[0,1,2,3,4].map(k=>B('cn',k?k:'Otomatis',' data-n="'+k+'" aria-pressed="'+(colN===k)+'"')).join('')+'</div><p class="chint">'+(fitOn?'Muat layar aktif: font dibesarkan otomatis sampai seluruh lagu muat.':'Muat layar nonaktif: lagu menggulir dalam kolom pilihan Anda.')+'</p>');
return '<div class="tools">'+B('x','\u2039 Tutup',' title="Tutup presenter (Esc)"').replace('btn sm','btn sm back')+'<div class="ttl"><b>'+esc(title)+'</b><small>'+esc(sub)+'</small></div>'+nav
+'<div class="tg" role="group" aria-label="Tampilan">'+(fitOn?'':B('fs','A\u2212',' data-d="-1"')+B('fs','A+',' data-d="1"'))+P('tc','Chord',showC)+P('tl','Lirik',showL)+P('fit','Muat layar',fitOn)+'</div>'
+'<div class="tg" role="group" aria-label="Auto scroll">'+P('as',asOn?'Stop scroll':'Auto scroll',asOn)+'<input type="range" class="asr" min="1" max="12" value="'+asSpeed+'" aria-label="Kecepatan auto scroll" title="Kecepatan"></div>'
+'<button class="btn sm more" data-a="dr" aria-expanded="'+pvDr+'">Nada '+keyLbl+' '+(pvDr?'\u25b4':'\u25be')+'</button>'+B('fsc','\u2922',' aria-label="Layar penuh" title="Layar penuh"')+'</div>'
+'<div class="chartctl drawer"'+(pvDr?'':' hidden')+'>'+dr+cols+'</div>'}
function renderPv(){if(typeof pvId==='string'){renderPvMed();return}const s=songs.find(x=>x.id===pvId);if(!s){closePv();return}
const cu=(baseKey(s)+trans+1200)%12;flat=FLATK.includes(cu);const i=pvList.indexOf(pvId),B=(a,t,x)=>'<button class="btn sm" data-a="'+a+'"'+(x||'')+'>'+t+'</button>';
const keys=KL.map((n,k)=>'<button class="btn sm" data-a="key" data-k="'+k+'" aria-pressed="'+(cu===k)+'">'+n+'</button>').join('');
const dr=(function(){const Bx=(a,t,x)=>'<button class="btn sm" data-a="'+a+'"'+(x||'')+'>'+t+'</button>';
return '<div class="cg wide"><span class="cgl">Nada dasar</span><div class="kgrid">'+keys+'</div><div class="crow">'+Bx('tr','Lebih rendah',' data-d="-1"')+Bx('tr','Lebih tinggi',' data-d="1"')+'</div></div><div class="cg"><span class="cgl">Modulasi per bagian</span><div class="crow">'+Bx('mod','Atur nada tiap bagian',' aria-pressed="'+showMod+'"')+'</div></div>'})();
$('pvbar').innerHTML=pvBar(s.t,[s.c,'nada asli '+KL[baseKey(s)]].filter(Boolean).join(' · '),KL[cu],dr);
$('pvpre').className='chart'+(fitOn?' fit':'');$('pvpre').style.fontSize=pvFs+'px';$('pvpre').innerHTML=s.x?sheetHtml(s,showMod):'Belum ada chord untuk lagu ini.';$('pvnav').innerHTML=s.x?secNav(s,1):'';requestAnimationFrame(secScan)}
function openPv(id,list){pvId=id;pvList=list&&list.length?list:[id];setAS(false);$('pv').hidden=false;document.body.style.overflow='hidden';renderPv();$('pvsheet').scrollTop=0;try{navigator.wakeLock&&navigator.wakeLock.request('screen').then(w=>wl=w).catch(()=>{})}catch(e){}}
function closePv(){pvId=0;$('pv').hidden=true;document.body.style.overflow='';setAS(false);try{wl&&wl.release();wl=null}catch(e){}renderSongs();renderEv()}
$('pv').onclick=e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a,med=typeof pvId==='string'?medOf(pvId):null,s=songs.find(x=>x.id===pvId);if(!s&&!med)return;
if(a==='x'){closePv();return}
if(a==='sn'||a==='sj'){secGo(b);return}
if(a==='as'){setAS(!asOn);return}
if(a==='jump'){const el=$('mh'+b.dataset.i),pv=$('pvsheet');if(el)pv.scrollTo({top:el.getBoundingClientRect().top-pv.getBoundingClientRect().top+pv.scrollTop-6,behavior:'smooth'});secLock=Date.now()+700;document.querySelectorAll('#pvnav .spills button').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('#pvpre .medh').forEach(x=>x.classList.toggle('on',x===el));return}
if(a==='mkey'&&med){med.k=+b.dataset.k;saveEv()}
if(a==='mod')showMod=!showMod;
if(s&&modAct(s,b))store.set('songs',songs);
if(a==='tr')trans+=+b.dataset.d;
if(a==='key'){let d=(+b.dataset.k-baseKey(s)+12)%12;if(d>6)d-=12;trans=d}
if(a==='fs')pvFs=Math.max(14,Math.min(60,pvFs+2*(+b.dataset.d)));
if(a==='tc')showC=!showC;
if(a==='tl')showL=!showL;
if(a==='cols'){cols2=!cols2;store.set('rl-cols',cols2)}
if(a==='fit'){fitOn=!fitOn;store.set('rl-fit',fitOn)}
if(a==='cn'){colN=+b.dataset.n||0;store.set('rl-coln',colN)}
if(a==='dr')pvDr=!pvDr;
if(a==='fsc'){const d=document;d.fullscreenElement?d.exitFullscreen():d.documentElement.requestFullscreen().catch(()=>{});return}
if(a==='pn'){const j=pvList.indexOf(pvId)+ +b.dataset.d;if(pvList[j]){pvId=pvList[j];trans=0;$('pvsheet').scrollTop=0}}
renderPv()};
$('pv').onchange=e=>{const el=e.target;if(el.dataset&&el.dataset.a==='msel'&&typeof pvId==='number'&&modSel(el)){store.set('songs',songs);renderPv()}};
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('md').hidden)closeMd();else if(pvId)closePv()});
$('evpv').onclick=()=>{const e=cur();if(!e||!e.s.length)return;trans=0;const l=e.s.map(x=>isMed(x)?x.m:x);openPv(l[0],l)};
$('evmd').onclick=()=>openMd(null);


/* ===== v29: Muat layar — font & jumlah kolom dihitung otomatis agar seluruh lagu muat tanpa scroll ===== */
let fitQ=0,wasFocus=false;
function fitOne(sh,pre,fsz,hi,lo){
const H=sh.clientHeight,W=sh.clientWidth;
const grid=()=>{const n=colN||(W>=(hi>22?900:640)?2:1);pre.classList.remove('fit','c2');pre.classList.toggle('cg',n>1);pre.style.setProperty('--cn',n);pre.style.height='';pre.style.columnCount='';pre.style.fontSize=fsz+'px';sh.classList.remove('fitted')};
if(!fitOn){grid();return}
if(!H||!W)return;
pre.classList.remove('cg','c2');pre.classList.add('fit');pre.style.height=H+'px';
const maxN=Math.max(1,Math.min(4,Math.floor(W/340))),list=colN?[colN]:Array.from({length:maxN},(_,i)=>i+1);let best=null;
for(const n of list){pre.style.columnCount=n;
const fits=f=>{pre.style.fontSize=f+'px';return pre.scrollWidth<=pre.clientWidth+1};
let a=lo,b=hi;if(!fits(a))continue;
while(a<b){const m=Math.ceil((a+b)/2);if(fits(m))a=m;else b=m-1}
if(!best||a>best.f)best={n,f:a}}
if(best){pre.style.columnCount=best.n;pre.style.fontSize=best.f+'px';sh.classList.add('fitted')}else grid()}
function fitSheet(){
const foc=!!document.querySelector('#list .sx');
if(wasFocus&&!foc&&typeof movePill==='function')requestAnimationFrame(()=>{try{movePill(curTab,true)}catch(e){}});
wasFocus=foc;
const sh=document.querySelector('#list .sheet'),pre=sh&&sh.firstElementChild;
if(pre&&pre.classList.contains('chart'))fitOne(sh,pre,fs,22,11);
if(!$('pv').hidden)fitOne($('pvsheet'),$('pvpre'),pvFs,40,12)}
function fitSoon(){if(fitQ)return;fitQ=requestAnimationFrame(()=>{fitQ=0;fitSheet()})}
new MutationObserver(()=>fitSheet()).observe($('list'),{childList:true});
new MutationObserver(()=>fitSheet()).observe($('pvpre'),{childList:true});
window.addEventListener('resize',fitSoon);
if(window.ResizeObserver){new ResizeObserver(fitSoon).observe($('perpustakaan'));new ResizeObserver(fitSoon).observe($('pv'))}
document.addEventListener('fullscreenchange',fitSoon);
fitSheet();
