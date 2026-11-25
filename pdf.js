/* Chordity — unduh acara sebagai PDF.
   Tanpa library: PDF ditulis langsung memakai font bawaan PDF (Courier untuk chord,
   Helvetica untuk judul), jadi tetap jalan offline dan hasilnya selalu rapi sejajar. */
(function(){
const PW=595,PH=842,MX=44,MT=48,MB=54,CW=PW-2*MX,GUT=22,CONTH=18,CWC=(CW-GUT)/2,AF=PH-MB-MT;
const COL={k:'0 0 0',c:'0.20 0.12 0.72',m:'0.42 0.42 0.48',r:'0.78 0.78 0.84',h:'0.30 0.30 0.36'};

/* ---- teks → byte WinAnsi (cp1252) ---- */
const W1252={8364:128,8218:130,402:131,8222:132,8230:133,8224:134,8225:135,710:136,8240:137,352:138,8249:139,338:140,381:142,8216:145,8217:146,8220:147,8221:148,8226:149,8211:150,8212:151,732:152,8482:153,353:154,8250:155,339:156,382:158,376:159};
const SUB={8594:'->',8592:'<-',9837:'b',9839:'#',9838:'',9834:'',9835:'',8203:'',8204:'',8205:'',65279:'',65039:''};
function enc(s){let o='';for(const ch of String(s==null?'':s)){const c=ch.codePointAt(0);
if(SUB[c]!==undefined){o+=SUB[c];continue}
if(c===9){o+='    ';continue}
if(c<32)continue;
if(c<127||(c>=160&&c<=255))o+=String.fromCharCode(c);
else if(W1252[c])o+=String.fromCharCode(W1252[c]);
else o+='?'}
return o}
const pe=s=>s.replace(/[\\()]/g,'\\$&');

/* ---- operasi gambar ---- */
function T(P,x,y,f,sz,col,s){if(!s)return;P.push('BT /'+f+' '+sz.toFixed(2)+' Tf '+col+' rg '+x.toFixed(2)+' '+(PH-y).toFixed(2)+' Td ('+pe(s)+') Tj ET')}
function R(P,x1,y,x2,col,w){P.push(col+' RG '+(w||.6)+' w '+x1.toFixed(2)+' '+(PH-y).toFixed(2)+' m '+x2.toFixed(2)+' '+(PH-y).toFixed(2)+' l S')}
const hw=(s,sz,b)=>s.length*sz*(b?.58:.52);
function wrapH(s,sz,b,w){const L=[];let c='';s.split(' ').forEach(x=>{const n=c?c+' '+x:x;if(c&&hw(n,sz,b)>w){L.push(c);c=x}else c=n});if(c)L.push(c);return L.length?L:['']}
function cut(s,sz,b,w){if(hw(s,sz,b)<=w)return s;let n=Math.max(1,Math.floor(w/(sz*(b?.58:.52)))-3);return s.slice(0,n).trimEnd()+'...'}
function wrapM(t,cols){const o=[];while(t.length>cols){let i=t.lastIndexOf(' ',cols);if(i<cols*.4)i=cols;o.push(t.slice(0,i).replace(/\s+$/,''));t=t.slice(i).replace(/^\s+/,'')}o.push(t);return o}

/* ---- blok-blok halaman. head:1 = ikut dipindah bersama blok sesudahnya ---- */
function eCover(name,date){const L=wrapH(name,24,1,CW),n=L.length;
return{k:'cv',head:1,h:n*30+(date?20:4)+14,draw(P,y){L.forEach((l,i)=>T(P,MX,y+24+i*30,'F4',24,COL.k,l));if(date)T(P,MX,y+n*30+14,'F3',11,COL.m,date);R(P,MX,y+n*30+(date?24:8),PW-MX,COL.c,1.6)}}}
function eRowHead(){return{k:'rh',head:1,h:22,draw(P,y){T(P,MX,y+14,'F4',8.5,COL.m,'URUTAN LAGU');T(P,MX+372,y+14,'F4',8.5,COL.m,'NADA');T(P,MX+440,y+14,'F4',8.5,COL.m,'BPM')}}}
function eRow(i,t,k,b){return{k:'r',h:16.5,draw(P,y){T(P,MX,y+11,'F3',10.5,COL.m,String(i)+'.');T(P,MX+24,y+11,'F3',10.5,COL.k,cut(t,10.5,0,338));T(P,MX+372,y+11,'F4',10.5,COL.c,k);T(P,MX+440,y+11,'F3',10.5,COL.k,b?String(b):'')}}}
function eSp(h){return{k:'g',h,draw(){}}}
function eTitle(t,sub){const L=wrapH(t,15,1,CW),n=L.length;
return{k:'t',head:1,h:n*19+(sub?17:6),draw(P,y){L.forEach((l,i)=>T(P,MX,y+14+i*19,'F4',15,COL.k,l));if(sub)T(P,MX,y+n*19+8,'F3',9,COL.m,sub);R(P,MX,y+n*19+(sub?13:1),PW-MX,COL.r)}}}
function ePart(t,note){return{k:'p',head:1,h:24,draw(P,y,x,w){x=x==null?MX:x;w=w||CW;const s=cut(t,11.5,1,w-(note?hw(note,8.5,0)+14:0));T(P,x,y+16,'F4',11.5,COL.c,s);if(note)T(P,x+hw(s,11.5,1)+8,y+16,'F3',8.5,COL.m,note)}}}
function eH(t,fs,lead){return{k:'h',head:1,h:lead+fs*.5,draw(P,y,x){T(P,x==null?MX:x,y+fs*1.2,'F2',fs,COL.h,t)}}}
function eU(lines,fs,lead){return{k:'u',h:lines.length*lead+fs*.4,draw(P,y,x0){lines.forEach((x,i)=>T(P,x0==null?MX:x0,y+fs*.95+i*lead,x.ch?'F2':'F1',fs,x.ch?COL.c:COL.k,x.t))}}}
function eBlk(L){const h=L.reduce((a,e)=>a+e.h,0);return{k:'b',h,draw(P,y,x,w){let yy=y;L.forEach(e=>{e.draw(P,yy,x,w);yy+=e.h})}}}
function eNote(t){return{k:'n',h:18,draw(P,y,x){T(P,x==null?MX:x,y+12,'F5',9.5,COL.m,t)}}}

/* bungkus satu unit: baris chord dan liriknya dipotong di posisi yang sama supaya tetap sejajar */
function wrapUnit(L,cols){const out=[];
for(let i=0;i<L.length;i++){const a=L[i];
if(a.ch&&L[i+1]&&!L[i+1].ch){const b=L[++i];let c=a.t,l=b.t;
while(c.length>cols||l.length>cols){let br=-1;const lo=Math.floor(cols*.4);
for(let j=cols;j>=lo;j--)if((l[j]===undefined||l[j]===' ')&&(c[j]===undefined||c[j]===' ')){br=j;break}
if(br<0)for(let j=cols;j>=lo;j--)if(l[j]===undefined||l[j]===' '){br=j;break}
if(br<0)br=cols;
const c1=c.slice(0,br).replace(/\s+$/,''),l1=l.slice(0,br).replace(/\s+$/,'');
if(c1)out.push({t:c1,ch:1});if(l1)out.push({t:l1});
c=c.slice(br);l=l.slice(br);const st=Math.min(c.match(/^ */)[0].length,l.match(/^ */)[0].length);c=c.slice(st);l=l.slice(st)}
if(c.trim())out.push({t:c,ch:1});if(l.trim())out.push({t:l})}
else wrapM(a.t,cols).forEach(t=>out.push({t,ch:a.ch}))}
return out}

/* ---- isi lagu: pakai aturan pengelompokan yang sama dengan layar (chord + liriknya satu unit) ---- */
function songUnits(s,d){const U=[],bk=baseKey(s),f0=flat;let c=null,st=0,si=-1,sd=0;
const fl=()=>{if(c&&c.length)U.push({k:'u',l:c});c=null;st=0};
(s.x||'').split('\n').forEach(raw=>{const r=raw.replace(/\r$/,''),t0=r.trim();
if(t0&&SEC.test(t0)){fl();si++;sd=secMod(s,si,t0);const cu=(bk+d+sd+1200)%12;flat=sd?FLATK.includes(cu):f0;
U.push({k:'h',t:enc(t0)+(sd?'   [modulasi '+(sd>0?'+':'')+sd+': '+KL[(bk+d+1200)%12]+' -> '+KL[cu]+']':'')});return}
const l=enc(tline(r,d+sd)).replace(/\s+$/,''),t=l.trim();
if(!t){fl();U.push({k:'g'});return}
if(st===2||(c&&c.length>=6))fl();if(!c)c=[];
if(isCh(l)){st=1;c.push({t:l,ch:1})}else{if(st>=1)st=2;c.push({t:l})}});
fl();flat=f0;return U}
function body(s,d,kf,W){W=W||CW;const two=W<CW;const f0=flat;flat=kf;let U;try{U=songUnits(s,d)}finally{flat=f0}
if(!U.some(u=>u.k==='u'))return[eNote('(belum ada chord untuk lagu ini)')];
let mx=1;U.forEach(u=>{(u.l||[]).forEach(x=>mx=Math.max(mx,x.t.length));if(u.t)mx=Math.max(mx,u.t.length)});
const fs=Math.floor(Math.max(two?8:9,Math.min(two?10:11,W/(.6*mx)))*2)/2,cols=Math.floor(W/(.6*fs)),lead=fs*1.28,out=[];
U.forEach(u=>{const p=out[out.length-1];
if(u.k==='g'){if(p&&p.k!=='g'&&p.k!=='h')out.push(eSp(fs*.7));return}
if(u.k==='h'){if(p&&p.k!=='g')out.push(eSp(fs*.5));out.push(eH(u.t,fs,lead));return}
out.push(eU(wrapUnit(u.l,cols),fs,lead))});
while(out.length&&out[out.length-1].k==='g')out.pop();
return out}

/* ---- tata letak halaman ---- */
function layout(parts,footL){
const D={pages:[[]],y:MT};
const np=()=>{D.pages.push([]);D.y=MT},P=()=>D.pages[D.pages.length-1];
const nd=(E,i)=>E[i].h+(E[i].head&&E[i+1]?nd(E,i+1):0);
/* simulasi isi kolom: limit tinggi kolom di halaman pertama L1, halaman berikutnya AF */
const sim=(B,L1)=>{let c=0,y=0,fresh=false;const pos=[],cont={};
B.forEach((e,i)=>{if(e.k==='g'&&y===0){pos.push(null);return}
let lim=c<2?L1:AF;
if(y>0&&nd(B,i)>lim-y){c++;y=0;fresh=true;if(e.k==='g'){pos.push(null);return}}
if(fresh){fresh=false;if(e.sg&&e.k!=='p'){cont[i]=e.sg;y=CONTH}}
pos.push({c,y});y+=e.h});
return{c,pos,cont}};
const placeCols=E=>{const TT=E[0],B=E.slice(1),sum=B.reduce((a,e)=>a+e.h,0);
const fit=y0=>{const A1=PH-MB-(y0+TT.h);for(let L=Math.ceil(sum/2);L<=A1;L+=4){const r=sim(B,L);if(r.c<=1)return{L,r}}return null};
let f=fit(D.y);
if(!f&&D.y>MT){const f2=fit(MT);if(f2){np();f=f2}}
if(!f){if(nd(E,0)>PH-MB-D.y&&D.y>MT)np();const L1=PH-MB-(D.y+TT.h);f={L:L1,r:sim(B,L1)}}
const pg0=D.pages.length-1;TT.draw(P(),D.y,MX,CW);const top=D.y+TT.h,last=Math.floor(f.r.c/2),end={};
while(D.pages.length-1<pg0+last)D.pages.push([]);
f.r.pos.forEach((p,i)=>{if(!p)return;const pg=Math.floor(p.c/2),side=p.c%2,b=pg?MT:top,y=b+p.y;
if(f.r.cont[i])T(D.pages[pg0+pg],MX+side*(CWC+GUT),y-CONTH+12,'F4',9.5,COL.c,cut(f.r.cont[i]+' (lanjutan)',9.5,1,CWC));
B[i].draw(D.pages[pg0+pg],y,MX+side*(CWC+GUT),CWC);
const o=end[pg]||(end[pg]={b,y:b,two:0});o.y=Math.max(o.y,y+B[i].h);if(side)o.two=1});
Object.keys(end).forEach(k=>{const o=end[k];if(o.two){const P2=D.pages[pg0+ +k],x=MX+CWC+GUT/2;P2.push(COL.r+' RG .5 w '+x.toFixed(2)+' '+(PH-o.b).toFixed(2)+' m '+x.toFixed(2)+' '+(PH-o.y+4).toFixed(2)+' l S')}});
D.y=end[last]?end[last].y:top};
let brk=0;
parts.forEach(pt=>{const E=pt.e;
/* medley berdiri sendiri: mulai di halaman baru, dan lagu sesudahnya juga pindah ke halaman baru */
if((brk||pt.own)&&D.y>MT)np();
brk=pt.own?1:0;
if(pt.song&&D.y>MT)D.y+=18;
if(pt.cols){placeCols(E);return}
const tot=E.reduce((a,e)=>a+e.h,0);
if(pt.song&&tot<=PH-MT-MB&&tot>PH-MB-D.y)np();
E.forEach((e,i)=>{if(e.k==='g'&&D.y===MT)return;
if(nd(E,i)>PH-MB-D.y&&D.y>MT)np();
e.draw(P(),D.y,MX,CW);D.y+=e.h})});
const N=D.pages.length;
return D.pages.map((ops,i)=>{const P=ops;R(P,MX,PH-MB+14,PW-MX,COL.r,.5);
T(P,MX,PH-MB+27,'F3',8,COL.m,cut(footL,8,0,CW-90));
const r='Hal. '+(i+1)+' / '+N;T(P,PW-MX-hw(r,8,0),PH-MB+27,'F3',8,COL.m,r);
return P.join('\n')})}

/* ---- tulis berkas PDF ---- */
function build(contents,title){
const O=[];const add=s=>(O.push(s),O.length);
add('<</Type/Catalog/Pages 2 0 R>>');add('');
['Courier','Courier-Bold','Helvetica','Helvetica-Bold','Helvetica-Oblique'].forEach(f=>add('<</Type/Font/Subtype/Type1/BaseFont/'+f+'/Encoding/WinAnsiEncoding>>'));
const kids=[];
contents.forEach(c=>{const ci=add('<</Length '+c.length+'>>\nstream\n'+c+'\nendstream');
kids.push(add('<</Type/Page/Parent 2 0 R/MediaBox[0 0 '+PW+' '+PH+']/Resources<</Font<</F1 3 0 R/F2 4 0 R/F3 5 0 R/F4 6 0 R/F5 7 0 R>>>>/Contents '+ci+' 0 R>>')+' 0 R')});
O[1]='<</Type/Pages/Count '+kids.length+'/Kids['+kids.join(' ')+']>>';
const inf=add('<</Title('+pe(enc(title))+')/Producer(Chordity)/Creator(Chordity)>>');
let out='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';const off=[];
O.forEach((o,i)=>{off.push(out.length);out+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});
const x=out.length;
out+='xref\n0 '+(O.length+1)+'\n0000000000 65535 f \n'+off.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<</Size '+(O.length+1)+'/Root 1 0 R/Info '+inf+' 0 R>>\nstartxref\n'+x+'\n%%EOF\n';
const u=new Uint8Array(out.length);for(let i=0;i<out.length;i++)u[i]=out.charCodeAt(i)&255;
return new Blob([u],{type:'application/pdf'})}

/* label nada: ditulis sama seperti ejaan chord di lembar (D# → Eb pada nada flat) */
function keyLbl(s){const m=(s.k||'').match(/^([A-G][#b]?)(.*)$/);if(!m)return KL[baseKey(s)];const i=SH.indexOf(FL[m[1]]||m[1]);return i<0?s.k:KL[i]+m[2]}

/* ---- rangkai satu acara ---- */
function evPdf(e){
const items=e.s.map(x=>{if(isMed(x)){const ss=x.s.map(id=>songs.find(y=>y.id===id)).filter(Boolean);return ss.length?{med:x,ss}:null}
const s=songs.find(y=>y.id===x);return s?{s}:null}).filter(Boolean);
if(!items.length)return null;
let date='';if(e.d){const m=String(e.d).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m){try{date=new Date(+m[1],+m[2]-1,+m[3]).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}catch(_){date=e.d}}else date=e.d}
const name=enc(e.n||'Acara'),parts=[];
const head=[eCover(name,enc(date)),eRowHead()];
items.forEach((it,i)=>{if(it.med)head.push(eRow(i+1,'Medley: '+enc(medName(it.med)),KL[it.med.k],''));
else head.push(eRow(i+1,enc(it.s.t),enc(keyLbl(it.s)),it.s.b))});
parts.push({e:head});
items.forEach(it=>{
if(it.med){const m=it.med,E=[eTitle(enc(medName(m)),'Medley · nada dasar '+KL[m.k])];
it.ss.forEach((s,j)=>{const d=medShift(s,m.k),tt=enc((j+1)+'. '+s.t),L=[ePart(tt,''),...body(s,d,FLATK.includes(m.k),CWC)];
L.forEach(e=>e.sg=tt);if(j)E.push(eSp(12));E.push(...L)});
parts.push({e:E,song:1,cols:1,own:1})}
else{const s=it.s,sub=[('Nada dasar: '+keyLbl(s)),s.b?s.b+' BPM':'',s.c||''].filter(Boolean).join(' · ');
const kf=FLATK.includes(baseKey(s));parts.push({e:[eTitle(enc(s.t),enc(sub)),...body(s,0,kf,CW)],song:1})}});
const pages=layout(parts,name+' · Chordity');
const fn=((e.n||'Acara').replace(/[\\/:*?"<>|\x00-\x1f]+/g,' ').replace(/\s+/g,' ').trim()||'Acara')+(e.d?' '+e.d:'')+'.pdf';
return{blob:build(pages,e.n||'Acara'),name:fn,pages:pages.length}}

/* ---- tombol ---- */
function note(t){const el=$('evsum');el.textContent=t;clearTimeout(note.t);note.t=setTimeout(renderEv,2600)}
function make(){const e=cur();if(!e||!e.s.length){note('Draf masih kosong. Tambahkan lagu dulu.');return null}
try{return evPdf(e)}catch(err){console.error(err);note('Gagal membuat PDF.');return null}}
function dl(r){const u=URL.createObjectURL(r.blob),a=document.createElement('a');a.href=u;a.download=r.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000)}
$('evpdf').onclick=()=>{const r=make();if(!r)return;dl(r);note('PDF diunduh · '+r.pages+' halaman')};
const sh=$('evsh');
try{if(navigator.canShare&&navigator.canShare({files:[new File(['x'],'a.pdf',{type:'application/pdf'})]}))sh.hidden=false}catch(_){}
sh.onclick=async()=>{const r=make();if(!r)return;
try{await navigator.share({files:[new File([r.blob],r.name,{type:'application/pdf'})],title:r.name.replace(/\.pdf$/,'')})}
catch(err){if(err&&err.name==='AbortError')return;dl(r);note('PDF diunduh · '+r.pages+' halaman')}};
window.ChordityPDF={evPdf};
})();
