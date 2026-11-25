/* Chordity — latar hidup & efek sentuh */
(function(){
const $=id=>document.getElementById(id),life=$('life'),cv=$('lifefx'),cx=cv.getContext('2d'),bgw=life.querySelector('.bgw'),spot=life.querySelector('.spot'),beat=life.querySelector('.beat'),rmq=matchMedia('(prefers-reduced-motion:reduce)'),root=document.documentElement;
let W=0,H=0,P=[],mx=.5,my=.5,sx=.5,sy=.5,tx=0,ttx=0,px=-999,py=-999,last=0,ema=16.7,fr=0,dead=false;
// glow digambar sekali ke sprite, lalu cuma di-copy tiap frame (jauh lebih murah)
function sprite(c){const s=document.createElement('canvas'),n=64,g=s.getContext('2d');s.width=s.height=n;const r=g.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);r.addColorStop(0,'rgba('+c+',.95)');r.addColorStop(.25,'rgba('+c+',.3)');r.addColorStop(1,'rgba('+c+',0)');g.fillStyle=r;g.fillRect(0,0,n,n);return s}
const SP=[sprite('255,206,140'),sprite('190,220,255')];
function mk(){return{x:Math.random()*W,y:Math.random()*H,r:Math.random()*10+7,vx:(Math.random()-.5)*.1,vy:-Math.random()*.16-.03,ph:Math.random()*6.28,sp:Math.random()*.02+.01,c:Math.random()<.18?1:0}}
function size(){W=innerWidth;H=innerHeight;cv.width=W;cv.height=H;P=Array.from({length:Math.round(Math.min(24,W*H/42000))},mk)}
size();addEventListener('resize',size);
function ptr(e){const t=e.touches?e.touches[0]:e;mx=t.clientX/W;my=t.clientY/H;px=t.clientX;py=t.clientY;spot.style.opacity=1}
addEventListener('pointermove',ptr,{passive:true});addEventListener('touchmove',ptr,{passive:true});
const off=()=>{spot.style.opacity=0;px=py=-999};addEventListener('pointerleave',off);addEventListener('touchend',off);
function lite(){dead=true;root.classList.add('lite');cx.clearRect(0,0,W,H)}
function loop(t){if(dead)return;requestAnimationFrame(loop);if(document.hidden||rmq.matches){last=0;return}
const dt=last?Math.min(t-last,100):16.7;last=t;const k=dt/16.7;
// jaga performa: kalau perangkat tidak sanggup, efek berat dimatikan otomatis
if(dt<100){ema=ema*.93+dt*.07;fr++;if(fr>100&&ema>27){lite();return}}
// parallax: satu transform langsung, tanpa CSS variable
const dx=mx-sx,dy=my-sy,dtx=ttx-tx;
if(Math.abs(dx)>.0004||Math.abs(dy)>.0004||Math.abs(dtx)>.05){sx+=dx*.05*k;sy+=dy*.05*k;tx+=dtx*.07*k;bgw.style.transform='translate3d('+(-(sx-.5)*28+tx).toFixed(1)+'px,'+(-(sy-.5)*16).toFixed(1)+'px,0)'}
if(px>-900)spot.style.transform='translate3d('+px.toFixed(0)+'px,'+py.toFixed(0)+'px,0)';
cx.clearRect(0,0,W,H);
for(const p of P){p.ph+=p.sp*k;p.x+=(p.vx+Math.sin(p.ph*1.3)*.2)*k;p.y+=(p.vy+Math.cos(p.ph)*.1)*k;
const ex=px-p.x,ey=py-p.y;if(ex*ex+ey*ey<28000){p.x+=ex*.0016*k;p.y+=ey*.0016*k}
if(p.y<-20)p.y=H+20;if(p.x<-20)p.x=W+20;if(p.x>W+20)p.x=-20;
cx.globalAlpha=.25+.75*Math.pow((Math.sin(p.ph*2.2)+1)/2,2);const R=p.r*2;cx.drawImage(SP[p.c],p.x-R/2,p.y-R/2,R,R)}
cx.globalAlpha=1}
requestAnimationFrame(loop);
window.lifeTab=i=>{ttx=(i-3.5)*-14;if(rmq.matches||dead)bgw.style.transform='translate3d('+ttx+'px,0,0)'};
window.lifePulse=acc=>{if(rmq.matches)return;beat.animate([{opacity:acc?.95:.5},{opacity:0}],{duration:acc?700:480,easing:'cubic-bezier(.2,.7,.3,1)'});const bv=document.getElementById('bpmv');if(bv)bv.animate([{transform:'scale('+(acc?1.09:1.045)+')'},{transform:'scale(1)'}],{duration:acc?300:200,easing:'cubic-bezier(.2,.7,.3,1)'})};
// waktu: sapaan + warna suasana
const h=new Date().getHours(),part=h<4?'malam':h<11?'pagi':h<15?'siang':h<18?'sore':'malam',em={pagi:'🌅',siang:'☀️',sore:'🌇',malam:'🌙'}[part];
const sh=h>=19||h<4?[.46,.72]:h<11?[.18,.42]:h<18?[.26,.5]:[.34,.6];life.style.setProperty('--s1',sh[0]);life.style.setProperty('--s2',sh[1]);
const L=['Siap berlatih hari ini?','Satu nada, satu langkah.','Rasakan temponya pelan-pelan.','Ikuti irama ombaknya.','Konsisten lebih penting.','Mainkan lagu favoritmu.'],g=$('greet').firstChild;let n=Math.floor(Math.random()*L.length);
function say(){g.classList.add('o');setTimeout(()=>{g.innerHTML='<b>Selamat '+part+'</b> '+em+' · '+L[n++%L.length];g.classList.remove('o')},rmq.matches?0:900)}
say();setInterval(say,8000);
// ripple
document.addEventListener('pointerdown',e=>{const t=e.target.closest&&e.target.closest('.btn,.key,nav button,.st');if(!t||rmq.matches)return;const r=t.getBoundingClientRect(),z=Math.max(r.width,r.height)*2.2,i=document.createElement('i');i.className='rip';i.style.cssText='width:'+z+'px;height:'+z+'px;left:'+(e.clientX-r.left-z/2)+'px;top:'+(e.clientY-r.top-z/2)+'px';t.appendChild(i);setTimeout(()=>i.remove(),700)},{passive:true});
})();
