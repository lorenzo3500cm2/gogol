'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const ui=Object.fromEntries(['score','score2','time','level','best','overlay','title','message','start','pause','announcement'].map(id=>[id,document.getElementById(id)]));
const W=900,H=540,keys=new Set(),touch=new Map();
let girl={x:250,y:270},girl2={x:650,y:270},score2=0,winner=0,mouse={x:660,y:270,angle:0},score=0,remaining=60,running=false,paused=false,last=0,turn=0,flash=0,best=0,deadline=0;
try{best=Number(localStorage.getItem('catch-mouse-best'))||0;}catch{}
ui.best.textContent=best;
const holes=[{x:10,y:135},{x:10,y:405},{x:W-10,y:135},{x:W-10,y:405}];
let mushrooms=[],nextMushroom=10,elapsed=0,notice='',noticeUntil=0;
const mushroomTypes=[{color:'#9255c7',effect:'fast',label:'velocità'},{color:'#e34c47',effect:'big',label:'gigante'},{color:'#34343f',effect:'slow',label:'lentezza'},{color:'#efc744',effect:'small',label:'piccola'}];
function size(p){return p.effectUntil>elapsed?(p.effect==='big'?1.6:p.effect==='small'?.65:1):1;}
function playerSpeed(p){return p.effectUntil>elapsed?(p.effect==='fast'?365:p.effect==='slow'?140:250):250;}
function spawnMushrooms(){mushrooms=mushroomTypes.map(type=>({...type,x:60+Math.random()*(W-120),y:60+Math.random()*(H-120)}));}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function respawn(){do{mouse.x=40+Math.random()*(W-80);mouse.y=40+Math.random()*(H-80);}while([girl,girl2].some(p=>Math.hypot(mouse.x-p.x,mouse.y-p.y)<160));mouse.angle=Math.random()*Math.PI*2;turn=0;}
function hud(){ui.score.textContent=score;ui.score2.textContent=score2;ui.time.textContent=Math.ceil(remaining);ui.level.textContent=1+(score+score2)/10;ui.best.textContent=best;}
function clearInput(){keys.clear();touch.clear();}
function start(){clearInput();girl={x:250,y:270};girl2={x:650,y:270};score=0;score2=0;winner=0;remaining=60;flash=0;respawn();running=true;paused=false;deadline=performance.now()+60000;ui.overlay.hidden=true;ui.pause.disabled=false;ui.pause.textContent='Pausa';hud();canvas.focus();}
function pause(){if(!running)return;paused=!paused;clearInput();if(paused){remaining=Math.max(0,(deadline-performance.now())/1000);ui.title.textContent='Una piccola pausa';ui.message.textContent='Riprendi quando sei pronta.';ui.start.textContent='Riprendi →';ui.overlay.hidden=false;}else{deadline=performance.now()+remaining*1000;ui.overlay.hidden=true;canvas.focus();}ui.pause.textContent=paused?'Riprendi':'Pausa';}
function finish(){running=false;clearInput();remaining=0;best=Math.max(best,score,score2);try{localStorage.setItem('catch-mouse-best',best);}catch{}hud();ui.title.textContent=score===score2?'Pareggio!':score>score2?'Vince la ragazza rossa!':'Vince la ragazza blu!';ui.message.textContent='Rossa: '+score+' punti · Blu: '+score2+' punti';ui.start.textContent='Gioca ancora →';ui.overlay.hidden=false;ui.pause.disabled=true;ui.announcement.textContent=ui.message.textContent;}
ui.start.addEventListener('click',()=>paused&&running?pause():start());ui.pause.addEventListener('click',pause);
const allowed=['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'];
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(allowed.includes(k)&&running){e.preventDefault();if(!paused)keys.add(k);}if(k==='escape'&&!e.repeat)pause();});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{clearInput();if(running&&!paused)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused)pause();});
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(running&&!paused)touch.set(e.pointerId,b.dataset.key);});['pointerup','pointercancel','lostpointercapture'].forEach(type=>b.addEventListener(type,e=>touch.delete(e.pointerId)));});
function update(dt,now){remaining=Math.max(0,(deadline-now)/1000);if(remaining<=0){finish();return;}
elapsed=60-remaining;
if(elapsed>=nextMushroom){spawnMushrooms();nextMushroom=(Math.floor(elapsed/10)+1)*10;}
const down=k=>keys.has(k)||[...touch.values()].includes(k);
function move(p,right,left,up,downKey){let dx=Number(down(right))-Number(down(left)),dy=Number(down(downKey))-Number(down(up)),len=Math.hypot(dx,dy)||1;p.x=clamp(p.x+dx/len*playerSpeed(p)*dt,24,W-24);p.y=clamp(p.y+dy/len*playerSpeed(p)*dt,34,H-24);}
move(girl,'d','a','w','s');move(girl2,'arrowright','arrowleft','arrowup','arrowdown');
for(const [i,p] of [[1,girl],[2,girl2]]){const item=mushrooms.find(m=>Math.hypot(m.x-p.x,m.y-p.y)<20*size(p)+12);if(item){p.effect=item.effect;p.effectUntil=elapsed+6;mushrooms.splice(mushrooms.indexOf(item),1);notice=(i===1?'Rossa':'Blu')+': '+item.label+' per 6 secondi!';noticeUntil=elapsed+2;ui.announcement.textContent=notice;}}
turn-=dt;const nearest=Math.hypot(mouse.x-girl.x,mouse.y-girl.y)<=Math.hypot(mouse.x-girl2.x,mouse.y-girl2.y)?girl:girl2;
const distance=Math.hypot(mouse.x-nearest.x,mouse.y-nearest.y);
if(turn<=0){const exit=holes.reduce((a,b)=>Math.hypot(mouse.x-a.x,mouse.y-a.y)<Math.hypot(mouse.x-b.x,mouse.y-b.y)?a:b);
mouse.angle=distance<230&&Math.hypot(mouse.x-exit.x,mouse.y-exit.y)<150?Math.atan2(exit.y-mouse.y,exit.x-mouse.x):distance<230?Math.atan2(mouse.y-nearest.y,mouse.x-nearest.x)+(Math.random()-.5)*.65:mouse.angle+(Math.random()-.5)*1.8;turn=.18+Math.random()*.3;}
const speed=Math.min(225,105+(score+score2)/10*9+(60-remaining)*.5);
mouse.x+=Math.cos(mouse.angle)*speed*dt;mouse.y+=Math.sin(mouse.angle)*speed*dt;
if(holes.some(h=>Math.hypot(mouse.x-h.x,mouse.y-h.y)<23)){notice='Il topo è scappato nel buco! Eccone un altro.';noticeUntil=elapsed+2;ui.announcement.textContent=notice;respawn();}
if(mouse.x<20||mouse.x>W-20){mouse.angle=Math.PI-mouse.angle;mouse.x=clamp(mouse.x,20,W-20);}
if(mouse.y<20||mouse.y>H-20){mouse.angle=-mouse.angle;mouse.y=clamp(mouse.y,20,H-20);}
const d1=Math.hypot(mouse.x-girl.x,mouse.y-girl.y),d2=Math.hypot(mouse.x-girl2.x,mouse.y-girl2.y);
const c1=d1<12+17*size(girl),c2=d2<12+17*size(girl2);if(c1||c2){if(c1&&c2&&Math.abs(d1-d2)<.001){score+=10;score2+=10;winner=0;}else if(c1&&(!c2||d1<d2)){score+=10;winner=1;}else{score2+=10;winner=2;}flash=.65;ui.announcement.textContent='Catturato! Rossa '+score+', blu '+score2+' punti.';respawn();}flash=Math.max(0,flash-dt);hud();}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function draw(now){ctx.clearRect(0,0,W,H);ctx.fillStyle='#dce9bf';ctx.fillRect(0,0,W,H);
ctx.strokeStyle='#c8d9a7';ctx.lineWidth=1;for(let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
for(let i=0;i<28;i++){let x=(i*137+35)%W,y=(i*79+25)%H;ellipse(x,y,3,2,'#b8ce91');if(i%3===0){ellipse(x+5,y-6,4,4,'#fff7db');ellipse(x+5,y-6,1.5,1.5,'#e8b860');}}
ctx.strokeStyle='#97b877';ctx.lineWidth=5;ctx.strokeRect(10,10,W-20,H-20);
for(const h of holes){ellipse(h.x,h.y,18,27,'#805e42');ellipse(h.x,h.y,12,21,'#302c2a');}
for(const m of mushrooms){ctx.fillStyle='#fff4dd';ctx.fillRect(m.x-4,m.y,8,15);ctx.fillStyle=m.color;ctx.beginPath();ctx.ellipse(m.x,m.y,17,14,0,Math.PI,Math.PI*2);ctx.closePath();ctx.fill();ellipse(m.x-7,m.y-5,3,3,'#fff4dd');ellipse(m.x+5,m.y-8,3,3,'#fff4dd');}
if(noticeUntil>elapsed){ctx.fillStyle='#294f43';ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.fillText(notice,W/2,38);}

ellipse(girl.x,girl.y+22,19,7,'#293d3820');ellipse(girl2.x,girl2.y+22,19,7,'#293d3820');ellipse(mouse.x,mouse.y+9,16,5,'#293d3820');
for(const [character,color,label] of [[girl,'#e96c58','1'],[girl2,'#508ec8','2']]){ctx.save();ctx.translate(character.x,character.y);ctx.scale(size(character),size(character));let bob=running&&!paused&&(keys.size||touch.size)?Math.sin(now/65)*3:0;
ellipse(-8,18+bob,7,10,'#42688a');ellipse(8,18-bob,7,10,'#42688a');ellipse(-9,26+bob,7,4,'#fff9e8');ellipse(9,26-bob,7,4,'#fff9e8');
ellipse(-17,4-bob,5,10,'#edb78f');ellipse(17,4+bob,5,10,'#edb78f');ellipse(0,5,15,18,color);ellipse(11,-24,9,14,'#654334');ellipse(0,-15,17,20,'#654334');ellipse(0,-12,13,15,'#f4c39c');ellipse(-4,-25,12,6,'#654334');ellipse(-5,-12,1.7,2.2,'#253f39');ellipse(5,-12,1.7,2.2,'#253f39');ctx.strokeStyle='#aa6557';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-9,4,0,Math.PI);ctx.stroke();ellipse(14,-25,4,3,color);ctx.fillStyle='white';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText(label,0,9);ctx.restore();}
ctx.save();ctx.translate(mouse.x,mouse.y);ctx.rotate(mouse.angle);ctx.strokeStyle='#c58c96';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-13,0);ctx.bezierCurveTo(-30,-15,-34,15,-42,3);ctx.stroke();ellipse(0,0,17,11,'#89929a');ellipse(10,0,11,8,'#a5adb4');ellipse(5,-9,7,7,'#89929a');ellipse(5,-9,4,4,'#ddb0b6');ellipse(16,0,3,3,'#e5b5bd');ellipse(11,-4,2,2,'#253f39');ctx.restore();
if(flash>0){ctx.fillStyle='#294f43';ctx.font='bold 26px system-ui';ctx.textAlign='center';for(const [i,p] of [[1,girl],[2,girl2]])if(winner===0||winner===i)ctx.fillText('+10 ✨',p.x,p.y-45-(.65-flash)*25);}}
function frame(now){const dt=Math.min((now-last)/1000||0,.035);last=now;if(running&&!paused)update(dt,now);draw(now);requestAnimationFrame(frame);}hud();requestAnimationFrame(frame);

