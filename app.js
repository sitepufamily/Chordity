/* Chordity — inti: tab, geser antar tab, metronom, tuner, timer */
const $=id=>document.getElementById(id);
let onChange=()=>{};
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}onChange(k)}};
let ctx;
function audio(){if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx}
function beep(t,f,len,vol){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+len);o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+len+.02)}

/* Tab */
const tabs=['metronom','tuner','timer','perpustakaan','tambah','chord','scale','acara'];
let curTab=null,swT=0;
function movePill(n,instant){const b=document.querySelector('nav button[data-t="'+n+'"]'),p=$('pill'),nv=b&&b.parentElement;if(!b)return;if(instant)p.classList.add('nt');p.style.width=b.offsetWidth+'px';p.style.transform='translateX('+b.offsetLeft+'px)';if(instant){p.offsetWidth;p.classList.remove('nt')}try{nv.scrollTo({left:b.offsetLeft-(nv.clientWidth-b.offsetWidth)/2,behavior:instant?'auto':'smooth'})}catch(e){}}
function swap(n){const first=curTab===null,from=curTab,rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
if(first||from===n||rm){tabs.forEach(t=>$(t).classList.remove('out'));tabs.forEach(t=>$(t).classList.toggle('on',t===n));curTab=n;window.lifeTab&&lifeTab(tabs.indexOf(n));return}
const dir=tabs.indexOf(n)>tabs.indexOf(from)?1:-1,el=$(n),old=$(from);
tabs.forEach(t=>{if(t!==n&&t!==from)$(t).classList.remove('on','out')});
curTab=n;window.lifeTab&&lifeTab(tabs.indexOf(n));
clearTimeout(old._t);el.style.setProperty('--dir',dir);old.style.setProperty('--dir',dir);
el.scrollTop=0;old.classList.remove('on');old.classList.add('out');
el.classList.remove('out','on');void el.offsetWidth;el.classList.add('on');
old._t=setTimeout(()=>{old.classList.remove('out');old.style.removeProperty('--ox')},320)}
function show(n){if(!tabs.includes(n))n='metronom';const was=curTab===null;swap(n);document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===n));movePill(n,was);if(n!=='tuner')stopTuner();if(n==='acara')renderEv();if(n==='scale')renderScale()}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{location.hash=b.dataset.t});
addEventListener('hashchange',()=>{const h=location.hash.slice(1),n=tabs.includes(h)?h:'metronom';if(n!==curTab)show(n)});
/* Geser jari: kartu mengikuti jari, lalu lanjut atau memantul balik */
(function(){const deck=$('deck'),skip='input,textarea,select,.fbscroll,[data-noswipe]';let x0=0,y0=0,t0=0,dx=0,mode=-1,cur=null;
deck.addEventListener('touchstart',e=>{if(e.touches.length!==1||e.target.closest(skip)){mode=-1;return}const t=e.touches[0];x0=t.clientX;y0=t.clientY;t0=performance.now();dx=0;mode=0;cur=$(curTab)},{passive:true});
deck.addEventListener('touchmove',e=>{if(mode<0||!cur)return;const t=e.touches[0],mx=t.clientX-x0,my=t.clientY-y0;
if(mode===0){if(Math.abs(mx)>12&&Math.abs(mx)>Math.abs(my)*1.4){mode=1;cur.style.transition='none';cur.style.animation='none'}else if(Math.abs(my)>12){mode=-1;return}else return}
dx=mx;const i=tabs.indexOf(curTab),edge=(dx>0&&i===0)||(dx<0&&i===tabs.length-1),x=edge?dx*.22:dx*.85;
cur.style.transform='translate3d('+x.toFixed(1)+'px,0,0) scale('+(1-Math.min(Math.abs(x)/1400,.04)).toFixed(3)+')';cur.style.opacity=(1-Math.min(Math.abs(x)/460,.55)).toFixed(2)},{passive:true});
function end(){if(mode!==1||!cur){mode=-1;return}const el=cur,i=tabs.indexOf(curTab),v=dx/Math.max(performance.now()-t0,1),edge=(dx>0&&i===0)||(dx<0&&i===tabs.length-1),go=!edge&&(Math.abs(dx)>deck.clientWidth*.2||Math.abs(v)>.5);
if(go){const nx=dx<0?i+1:i-1,ox=dx*.85,oo=parseFloat(el.style.opacity)||1;el.style.setProperty('--ox',ox+'px');el.style.setProperty('--oo',oo);el.style.transition='';el.style.transform='';el.style.opacity='';el.style.animation='';show(tabs[nx]);location.hash=tabs[nx]}
else{el.style.animation='';el.style.transition='transform .5s cubic-bezier(.34,1.45,.5,1),opacity .3s';el.style.transform='';el.style.opacity='';setTimeout(()=>{el.style.transition=''},520)}
mode=-1;cur=null;dx=0}
deck.addEventListener('touchend',end,{passive:true});deck.addEventListener('touchcancel',end,{passive:true});
addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;const t=e.target;if(t.closest&&t.closest('input,textarea,select,[contenteditable]'))return;if(!$('auth').hidden||!$('pv').hidden)return;const i=tabs.indexOf(curTab);if(e.key==='ArrowRight'&&i<tabs.length-1)location.hash=tabs[i+1];else if(e.key==='ArrowLeft'&&i>0)location.hash=tabs[i-1]})})();addEventListener('resize',()=>movePill(curTab,true));addEventListener('load',()=>movePill(curTab,true));if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>movePill(curTab,true));

/* Metronom */
let bpm=100,beats=4,run=false,beat=0,next=0,iv=null,flip=false;
const names=[[60,'Largo'],[76,'Adagio'],[108,'Andante'],[120,'Moderato'],[156,'Allegro'],[200,'Vivace'],[999,'Presto']];
function drawDots(){$('dots').innerHTML=Array.from({length:beats},(_,i)=>'<i class="'+(i===0?'acc':'')+'"></i>').join('')}
function setBpm(v){bpm=Math.max(30,Math.min(240,Math.round(v)));$('bpm').value=bpm;$('bpmv').textContent=bpm;$('tempoName').textContent='BPM · '+names.find(n=>bpm<n[0])[1]}
function flash(b){try{window.lifePulse&&lifePulse(b===0)}catch(e){}const d=$('dots').children;for(const x of d)x.classList.remove('hit');if(d[b])d[b].classList.add('hit');flip=!flip;const a=$('arm');a.style.transitionDuration=(60/bpm)+'s';a.style.transform='rotate('+(flip?24:-24)+'deg)'}
function sched(){while(next<ctx.currentTime+.12){beep(next,beat===0?1400:900,.05,.6);const b=beat;setTimeout(()=>flash(b),Math.max(0,(next-ctx.currentTime)*1000));next+=60/bpm;beat=(beat+1)%beats}}
function mStart(){audio();run=true;beat=0;next=ctx.currentTime+.05;sched();iv=setInterval(sched,25);$('go').textContent='Berhenti'}
function mStop(){run=false;clearInterval(iv);$('go').textContent='Mulai'}
$('go').onclick=()=>run?mStop():mStart();
$('bpm').oninput=e=>setBpm(+e.target.value);
$('m10').onclick=()=>setBpm(bpm-5);$('m1').onclick=()=>setBpm(bpm-1);$('p1').onclick=()=>setBpm(bpm+1);$('p10').onclick=()=>setBpm(bpm+5);
$('beats').onchange=e=>{beats=+e.target.value;beat=0;drawDots()};
let taps=[];
$('tap').onclick=()=>{const n=performance.now();if(taps.length&&n-taps[taps.length-1]>2000)taps=[];taps.push(n);taps=taps.slice(-6);if(taps.length>1){setBpm(60000/((taps[taps.length-1]-taps[0])/(taps.length-1)))}};
drawDots();setBpm(100);

/* Tuner */
const NN=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
let stream,an,tiv,buf;
function pitch(b,sr){const n=b.length;let rms=0;for(let i=0;i<n;i++)rms+=b[i]*b[i];if(Math.sqrt(rms/n)<.012)return -1;
const L=Math.min(n>>1,Math.floor(sr/28)),sq=new Float64Array(n+1),ns=new Float32Array(L);
for(let i=0;i<n;i++)sq[i+1]=sq[i]+b[i]*b[i];
for(let t=0;t<L;t++){let a=0;for(let j=0;j<n-t;j++)a+=b[j]*b[j+t];const m=sq[n-t]+sq[n]-sq[t];ns[t]=m>0?2*a/m:0}
let d=0;while(d<L-1&&ns[d]>0)d++;while(d<L-1&&ns[d]<=0)d++;
let best=-1;const pk=[];for(let t=d+1;t<L-1;t++)if(ns[t]>ns[t-1]&&ns[t]>=ns[t+1]){pk.push(t);if(best<0||ns[t]>ns[best])best=t}
if(best<0||ns[best]<.9)return -1;
const T=pk.find(t=>ns[t]>=.9*ns[best]),x1=ns[T-1],x2=ns[T],x3=ns[T+1],a=(x1+x3-2*x2)/2,bb=(x3-x1)/2;let tt=T;if(a)tt-=bb/(2*a);return sr/tt}
function tick(){an.getFloatTimeDomainData(buf);const f0=pitch(buf,ctx.sampleRate);if(f0<28||f0>1200)return;
const now=performance.now();tH=tH.filter(x=>now-x[0]<900);if(tH.length&&Math.abs(1200*Math.log2(f0/tMed(tH.map(x=>x[1]))))>80)tH=[];tH.push([now,f0]);if(tH.length>5)tH.shift();const f=tMed(tH.map(x=>x[1]));
const a4=+$('a4').value||440,m=69+12*Math.log2(f/a4),r=Math.round(m),cf=(m-r)*100,c=Math.round(cf);
const nm=NN[((r%12)+12)%12],ok=tok=Math.abs(c)<=(tok?7:5);$('note').innerHTML=nm[0]+(nm[1]?'<i>♯</i>':'')+'<small>'+(Math.floor(r/12)-1)+'</small>';$('note').classList.toggle('ok',ok);$('freq').textContent=f.toFixed(1)+' Hz';
tC=cf;tLast=now;tKick();$('lf').classList.toggle('on',c<-5);$('lk').classList.toggle('on',ok);$('ls').classList.toggle('on',c>5);$('tneedle').classList.toggle('ok',ok);$('ttrail').setAttribute('class',ok?'k':c<0?'f':'s');
document.querySelectorAll('#strings .key').forEach(k=>k.classList.toggle('on',+k.dataset.m===r));
$('cents').textContent=Math.abs(c)<=5?'Pas':(c<0?'Terlalu rendah ('+c+' sen): kencangkan':'Terlalu tinggi (+'+c+' sen): kendurkan');$('cents').classList.toggle('ok',ok)}
async function startTuner(){$('terr').textContent='';try{audio();stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
const s=ctx.createMediaStreamSource(stream);an=ctx.createAnalyser();an.fftSize=4096;buf=new Float32Array(an.fftSize);s.connect(an);tiv=setInterval(tick,100);$('tgo').textContent='Berhenti'}
catch(e){$('terr').textContent='Mikrofon tidak bisa diakses. Izinkan akses mikrofon di browser, atau buka halaman ini di tab sendiri.'}}
function stopTuner(){clearInterval(tiv);tiv=null;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}$('tgo').textContent='Mulai';tH=[];tok=false;tC=0;tKick();['lf','lk','ls'].forEach(i=>$(i).classList.remove('on'));$('tneedle').classList.remove('ok');$('ttrail').setAttribute('class','');$('note').classList.remove('ok');$('cents').classList.remove('ok')}
$('tgo').onclick=()=>stream?stopTuner():startTuner();
/* gauge 3D + string referensi */
let tC=0,cC=0,tLast=0,traf=0,tok=false,tH=[],tins=store.get('rl-tins','bass');
const tMed=a=>{const s=[...a].sort((x,y)=>x-y);return s[s.length>>1]};
const TI={bass:[['E1',41.2],['A1',55],['D2',73.42],['G2',98]],gitar:[['E2',82.41],['A2',110],['D3',146.83],['G3',196],['B3',246.94],['E4',329.63]]};
if(!TI[tins])tins='bass';
function tPol(a,r){const t=a*Math.PI/180;return[200+r*Math.sin(t),200-r*Math.cos(t)]}
function tArc(a0,a1,r){const p=tPol(a0,r),q=tPol(a1,r);return 'M'+p[0].toFixed(1)+' '+p[1].toFixed(1)+'A'+r+' '+r+' 0 0 '+(a1>a0?1:0)+' '+q[0].toFixed(1)+' '+q[1].toFixed(1)}
(()=>{let h='';for(let c=-50;c<=50;c+=5){const M=c%25===0,len=M?20:c%10===0?14:8,p=tPol(c*1.2,134),q=tPol(c*1.2,134-len);h+='<line class="tt'+(c===0?' z':M?' M':'')+'" x1="'+p[0].toFixed(1)+'" y1="'+p[1].toFixed(1)+'" x2="'+q[0].toFixed(1)+'" y2="'+q[1].toFixed(1)+'"/>'}
[-50,-25,0,25,50].forEach(c=>{const p=tPol(c*1.2,174);h+='<text class="ttl" x="'+p[0].toFixed(1)+'" y="'+(p[1]+4).toFixed(1)+'">'+(c>0?'+':'')+c+'</text>'});$('tticks').innerHTML=h})();
function tDraw(c){const a=Math.max(-50,Math.min(50,c))*1.2;$('tneedle').style.transform='rotate('+a.toFixed(2)+'deg)';$('ttrail').setAttribute('d',Math.abs(a)<.5?'':tArc(0,a,150))}
function tLoop(){const rm=matchMedia('(prefers-reduced-motion:reduce)').matches;cC=rm?tC:cC+(tC-cC)*.2;tDraw(cC);$('note').classList.toggle('stale',!!tLast&&!!stream&&performance.now()-tLast>1800);
if(stream||Math.abs(tC-cC)>.05)traf=requestAnimationFrame(tLoop);else{traf=0;tDraw(tC);cC=tC}}
function tKick(){if(!traf)traf=requestAnimationFrame(tLoop)}
const tp=$('tplate');
tp.addEventListener('pointermove',e=>{if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const r=tp.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;tp.style.setProperty('--ry',(x*14).toFixed(1));tp.style.setProperty('--rx',(10-y*14).toFixed(1))});
tp.addEventListener('pointerleave',()=>{tp.style.removeProperty('--ry');tp.style.removeProperty('--rx')});
function renderStrings(){$('strings').innerHTML='';TI[tins].forEach(([n,f])=>{const b=document.createElement('button');b.className='key';b.type='button';b.textContent=n;b.dataset.m=Math.round(69+12*Math.log2(f/440));b.onclick=()=>{audio();beep(ctx.currentTime,f,1.6,.4)};$('strings').appendChild(b)});
$('tref').textContent='Nada acuan '+(tins==='bass'?'bass 4 senar':'gitar 6 senar')+' (standar)';
$('tins').innerHTML=[['bass','Bass'],['gitar','Gitar']].map(a=>'<button class="btn sm" type="button" data-ti="'+a[0]+'" aria-pressed="'+(tins===a[0])+'">'+a[1]+'</button>').join('')}
$('tins').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!b.dataset.ti)return;tins=b.dataset.ti;store.set('rl-tins',tins);renderStrings()});
renderStrings();

/* Timer */
let mins=15,left=900,tRun=false,end=0,tiv2=null;
const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const dayKey='done-'+new Date().toISOString().slice(0,10);
function showToday(){const m=store.get(dayKey,0);$('today').textContent=m?'Latihan selesai hari ini: '+m+' menit':'Belum ada sesi selesai hari ini'}
function setMins(m){mins=Math.max(1,Math.min(240,m|0));left=mins*60;$('cm').value=mins;$('tv').textContent=fmt(left);document.querySelectorAll('#chips .btn').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.m===mins))}
[5,10,15,25,45].forEach(m=>{const b=document.createElement('button');b.className='btn sm';b.dataset.m=m;b.textContent=m+' menit';b.onclick=()=>{tReset();setMins(m)};$('chips').appendChild(b)});
function tPause(){tRun=false;clearInterval(tiv2);$('ts').textContent='Lanjut';$('tsub').textContent='Dijeda'}
function tReset(){tRun=false;clearInterval(tiv2);$('ts').textContent='Mulai';$('tsub').textContent='Siap berlatih';left=mins*60;$('tv').textContent=fmt(left)}
function tStart(){audio();tRun=true;end=Date.now()+left*1000;$('ts').textContent='Jeda';$('tsub').textContent='Sedang berlatih';tiv2=setInterval(()=>{left=Math.max(0,Math.round((end-Date.now())/1000));$('tv').textContent=fmt(left);
if(left<=0){clearInterval(tiv2);tRun=false;[0,.35,.7].forEach(d=>beep(ctx.currentTime+d,880,.25,.5));store.set(dayKey,store.get(dayKey,0)+mins);showToday();$('ts').textContent='Mulai';$('tsub').textContent='Selesai. Kerja bagus!';left=mins*60}},250)}
$('ts').onclick=()=>tRun?tPause():tStart();$('tr').onclick=tReset;
$('cm').onchange=e=>{tReset();setMins(+e.target.value)};
setMins(15);showToday();
