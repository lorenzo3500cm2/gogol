'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const ui=Object.fromEntries(['score','score2','green1','green2','time','level','best','overlay','title','message','objective','start','pause','announcement'].map(id=>[id,document.getElementById(id)]));
const W=900,H=540,keys=new Set(),touch=new Map();
let girl={x:250,y:270},girl2={x:650,y:270},score2=0,winner=0,mouse={x:660,y:270,angle:0},score=0,remaining=60,running=false,paused=false,last=0,turn=0,flash=0,best=0,deadline=0;
try{best=Number(localStorage.getItem('catch-mouse-best'))||0;}catch{}
ui.best.textContent=best;
const holes=[...Array.from({length:4},(_,i)=>({x:12,y:80+i*125})),...Array.from({length:4},(_,i)=>({x:W-12,y:80+i*125})),{x:300,y:12},{x:600,y:12},{x:300,y:H-12},{x:600,y:H-12}];
let mice=Array.from({length:5},(_,i)=>({x:420+i*65,y:150+i*50,angle:i,turn:0}));
let memoryCards=[],revealed=[],memoryTurn=1,memoryLock=0;
let stage=1,items=[],traps=[],animals=[],progress=[0,0];
let green1=0,green2=0,grayCaught=0,pendingGreen=0;
let hunters=[{x:450,y:80,speed:165,kind:"cat"},{x:450,y:460,speed:145,kind:"dog"}];
let mushrooms=[],nextMushroom=10,elapsed=0,notice='',noticeUntil=0;
const mushroomTypes=[{color:'#9255c7',effect:'fast',label:'velocità'},{color:'#e34c47',effect:'big',label:'gigante'},{color:'#34343f',effect:'slow',label:'lentezza'},{color:'#efc744',effect:'small',label:'piccola'}];
function size(p){return p.effectUntil>elapsed?(p.effect==='big'?1.6:p.effect==='small'?.65:1):1;}
function playerSpeed(p){return p.effectUntil>elapsed?(p.effect==='fast'?365:p.effect==='slow'?140:250):250;}
function spawnMushrooms(){mushrooms=Array.from({length:12},(_,i)=>mushroomTypes[i%4]).map(type=>({...type,x:60+Math.random()*(W-120),y:60+Math.random()*(H-120)}));}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function respawn(m){for(let n=0;n<100;n++){m.x=50+Math.random()*(W-100);m.y=50+Math.random()*(H-100);if([girl,girl2].every(p=>Math.hypot(m.x-p.x,m.y-p.y)>=160))break;}m.angle=Math.random()*Math.PI*2;m.turn=0;delete m.effect;delete m.effectUntil;}
function activeHoles(){return stage===1?[holes[1],holes[2],holes[5],holes[6]]:holes;}
function tunnel(p){if((p.holeUntil||0)>elapsed)return;const exits=activeHoles();const i=exits.findIndex(h=>Math.hypot(p.x-h.x,p.y-h.y)<30);if(i<0)return;const out=exits[(i+Math.floor(exits.length/2))%exits.length];p.x=out.x<30?48:out.x>W-30?W-48:out.x;p.y=out.y<30?48:out.y>H-30?H-48:out.y;p.holeUntil=elapsed+1.5;}
function eat(p,label){const item=mushrooms.find(m=>Math.hypot(m.x-p.x,m.y-p.y)<(label==='Topo'?12:20)*size(p)+12);if(!item)return;p.effect=item.effect;p.effectUntil=elapsed+6;mushrooms.splice(mushrooms.indexOf(item),1);notice=label+': '+item.label+' per 6 secondi!';noticeUntil=elapsed+2;ui.announcement.textContent=notice;}
function catchMouse(m,player){if(m.green){if(player===1||player===0)green1++;if(player===2||player===0)green2++;m.green=false;}else{grayCaught++;if(grayCaught%20===0)pendingGreen++;if(player===1||player===0)score+=10;if(player===2||player===0)score2+=10;}winner=player;flash=.65;respawn(m);if(pendingGreen>0){m.green=true;pendingGreen--;}if(green1||green2)enterStage(2);}
const goals=['','Cattura un topo verde','Raccogli 3 ossi','Evita le botole e raccogli 3 gelati','Prendi l’uovo d’oro','Memory: trova due carte uguali'];
function placeItem(item){for(let i=0;i<200;i++){item.x=70+Math.random()*(W-140);item.y=70+Math.random()*(H-140);if(traps.every(t=>Math.hypot(t.x-item.x,t.y-item.y)>75)&&[girl,girl2].every(p=>Math.hypot(p.x-item.x,p.y-item.y)>80))return;}}
function enterStage(n){stage=n;document.getElementById('memory').hidden=n!==5;progress=[0,0];clearInput();girl={x:100,y:270};girl2={x:800,y:270};mice=n===1?mice:[];hunters=n===1?hunters:[];mushrooms=[];traps=[];animals=[];items=[];if(n===2){animals=['#dc6b89','#6b9fdb','#aa80d3','#dfad45'].map((color,i)=>({x:250+i*130,y:100,speed:120+i*12,color,kind:'dog',angle:0}));}
if(n===3)traps=[{x:240,y:150},{x:450,y:170},{x:660,y:150},{x:240,y:390},{x:450,y:370},{x:660,y:390}];
if(n===4)animals=Array.from({length:6},(_,i)=>({x:150+i*115,y:100+i*60,speed:i<3?45:210,kind:i<3?'rabbit':'turtle',angle:Math.random()*6.28}));
if(n===5){setupMemory();notice='Livello 5 — Memory!';noticeUntil=elapsed+4;hud();return;}
items=Array.from({length:n===4?1:6},()=>({kind:n===2?'bone':n===3?'ice':'egg'}));items.forEach(placeItem);notice='Livello '+n+' — '+goals[n];noticeUntil=elapsed+4;ui.announcement.textContent=notice;hud();}
function setupMemory(){memoryCards=['🍓','🍓','🌻','🌻','🐭','🐭','🍦','🍦','🐢','🐢','🦴','🦴'];for(let i=memoryCards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[memoryCards[i],memoryCards[j]]=[memoryCards[j],memoryCards[i]];}revealed=[];memoryTurn=1;memoryLock=0;renderMemory();}
function renderMemory(){const board=document.getElementById('memory');board.replaceChildren();const title=document.createElement('p');title.textContent='Memory — turno della ragazza '+(memoryTurn===1?'rossa':'blu');board.appendChild(title);const grid=document.createElement('div');grid.className='memory-grid';memoryCards.forEach((symbol,i)=>{const button=document.createElement('button');button.textContent=revealed.includes(i)?symbol:'?';button.setAttribute('aria-label',revealed.includes(i)?symbol:'Carta '+(i+1));button.disabled=paused||!running||!!memoryLock||revealed.includes(i);button.addEventListener('click',()=>flipCard(i));grid.appendChild(button);});board.appendChild(grid);}
function flipCard(i){if(stage!==5||paused||!running||memoryLock||revealed.includes(i)||i<0||i>=memoryCards.length)return;revealed.push(i);if(revealed.length===2){if(memoryCards[revealed[0]]===memoryCards[revealed[1]]){winner=memoryTurn;progress[memoryTurn-1]=1;finish();}else memoryLock=elapsed+1;}renderMemory();}
function hud(){ui.green1.textContent=progress[0]+'/'+(stage===1||stage>=4?1:3);ui.green2.textContent=progress[1]+'/'+(stage===1||stage>=4?1:3);ui.score.textContent=score;ui.score2.textContent=score2;ui.time.textContent=stage===1?20-grayCaught%20:'—';ui.level.textContent=stage;ui.best.textContent=best;ui.objective.textContent=goals[stage];}
function collect(item,who){if(who===0){progress[0]++;progress[1]++;}else progress[who-1]++;if(who===0||who===1)score+=10;if(who===0||who===2)score2+=10;winner=who;flash=.65;if(stage===4){enterStage(5);return;}if(Math.max(...progress)>=3){enterStage(stage+1);return;}placeItem(item);}
function updateStage(dt){if(stage===5){if(memoryLock&&elapsed>=memoryLock){revealed=[];memoryLock=0;memoryTurn=memoryTurn===1?2:1;renderMemory();}return;}if(stage===3)for(const p of [girl,girl2]){if(traps.some(t=>Math.hypot(p.x-t.x,p.y-t.y)<29+12*size(p))){p.x=p===girl?100:800;p.y=270;p.effect='slow';p.effectUntil=elapsed+2;notice='Botola! Riparti dal bordo, rallentata per 2 secondi.';noticeUntil=elapsed+2;}}
for(const item of items){const d1=Math.hypot(item.x-girl.x,item.y-girl.y),d2=Math.hypot(item.x-girl2.x,item.y-girl2.y);const c1=d1<18+17*size(girl),c2=d2<18+17*size(girl2);if(c1||c2){const old=stage;collect(item,c1&&c2&&Math.abs(d1-d2)<.001?0:c1&&(!c2||d1<d2)?1:2);if(stage!==old||!running)return;}}
for(const a of animals){if(stage===2){const target=items.reduce((x,y)=>Math.hypot(a.x-x.x,a.y-x.y)<Math.hypot(a.x-y.x,a.y-y.y)?x:y);a.angle=Math.atan2(target.y-a.y,target.x-a.x);if(Math.hypot(target.x-a.x,target.y-a.y)<25)placeItem(target);}else if(Math.random()<dt*.8)a.angle+=(Math.random()-.5)*2;
a.x+=Math.cos(a.angle)*a.speed*dt;a.y+=Math.sin(a.angle)*a.speed*dt;if(a.x<25||a.x>W-25)a.angle=Math.PI-a.angle;if(a.y<25||a.y>H-25)a.angle=-a.angle;a.x=clamp(a.x,25,W-25);a.y=clamp(a.y,25,H-25);}
hud();}
function clearInput(){keys.clear();touch.clear();}
function start(){clearInput();girl={x:250,y:270};girl2={x:650,y:270};score=0;score2=0;winner=0;stage=1;document.getElementById('memory').hidden=true;memoryCards=[];revealed=[];memoryLock=0;memoryTurn=1;items=[];traps=[];animals=[];progress=[0,0];green1=0;green2=0;grayCaught=0;pendingGreen=0;hunters=[{x:450,y:80,speed:165,kind:'cat'},{x:450,y:460,speed:145,kind:'dog'}];mushrooms=[];nextMushroom=10;elapsed=0;notice="";noticeUntil=0;remaining=60;flash=0;mice=Array.from({length:5},()=>({}));mice.forEach(respawn);spawnMushrooms();running=true;paused=false;deadline=performance.now()+60000;ui.overlay.hidden=true;ui.pause.disabled=false;ui.pause.textContent='Pausa';hud();canvas.focus();}
function pause(){if(!running)return;paused=!paused;clearInput();if(paused){ui.title.textContent='Una piccola pausa';ui.message.textContent='Riprendi quando sei pronta.';ui.start.textContent='Riprendi →';ui.overlay.hidden=false;}else{ui.overlay.hidden=true;canvas.focus();}ui.pause.textContent=paused?'Riprendi':'Pausa';if(stage===5)renderMemory();}
function finish(){running=false;clearInput();remaining=0;best=Math.max(best,score,score2);try{localStorage.setItem('catch-mouse-best',best);}catch{}hud();ui.title.textContent=winner===0?'Vittoria insieme!':winner===1?'Vince la ragazza rossa!':'Vince la ragazza blu!';ui.message.textContent='Coppia trovata! Avete completato i cinque livelli.';ui.start.textContent='Gioca ancora →';ui.overlay.hidden=false;ui.pause.disabled=true;ui.announcement.textContent=ui.message.textContent;}
ui.start.addEventListener('click',()=>paused&&running?pause():start());ui.pause.addEventListener('click',pause);
const allowed=['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'];
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(allowed.includes(k)&&running){e.preventDefault();if(!paused)keys.add(k);}if(k==='escape'&&!e.repeat)pause();});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{clearInput();if(running&&!paused)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused)pause();});
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(running&&!paused)touch.set(e.pointerId,b.dataset.key);});['pointerup','pointercancel','lostpointercapture'].forEach(type=>b.addEventListener(type,e=>touch.delete(e.pointerId)));});
function update(dt,now){elapsed+=dt;
if(stage===1&&elapsed>=nextMushroom){spawnMushrooms();nextMushroom=(Math.floor(elapsed/10)+1)*10;}
const down=k=>keys.has(k)||[...touch.values()].includes(k);
function move(p,right,left,up,downKey){let dx=Number(down(right))-Number(down(left)),dy=Number(down(downKey))-Number(down(up)),len=Math.hypot(dx,dy)||1;p.x=clamp(p.x+dx/len*playerSpeed(p)*dt,12,W-12);p.y=clamp(p.y+dy/len*playerSpeed(p)*dt,12,H-12);}
move(girl,'d','a','w','s');move(girl2,'arrowright','arrowleft','arrowup','arrowdown');
if(stage!==3&&stage!==5){tunnel(girl);tunnel(girl2);}if(stage!==1){updateStage(dt);flash=Math.max(0,flash-dt);return;}eat(girl,'Rossa');eat(girl2,'Blu');
for(const h of hunters){const target=mice.reduce((a,b)=>Math.hypot(h.x-a.x,h.y-a.y)<Math.hypot(h.x-b.x,h.y-b.y)?a:b);const a=Math.atan2(target.y-h.y,target.x-h.x);h.x=clamp(h.x+Math.cos(a)*h.speed*dt,25,W-25);h.y=clamp(h.y+Math.sin(a)*h.speed*dt,25,H-25);}
for(const mouse of mice){mouse.turn-=dt;const nearest=[girl,girl2,...hunters].reduce((a,b)=>Math.hypot(mouse.x-a.x,mouse.y-a.y)<Math.hypot(mouse.x-b.x,mouse.y-b.y)?a:b);
const distance=Math.hypot(mouse.x-nearest.x,mouse.y-nearest.y);
if(mouse.turn<=0){const exit=activeHoles().reduce((a,b)=>Math.hypot(mouse.x-a.x,mouse.y-a.y)<Math.hypot(mouse.x-b.x,mouse.y-b.y)?a:b);
mouse.angle=distance<230&&Math.hypot(mouse.x-exit.x,mouse.y-exit.y)<150?Math.atan2(exit.y-mouse.y,exit.x-mouse.x):distance<230?Math.atan2(mouse.y-nearest.y,mouse.x-nearest.x)+(Math.random()-.5)*.65:mouse.angle+(Math.random()-.5)*1.8;mouse.turn=.18+Math.random()*.3;}
const base=Math.min(145,75+(score+score2)/10*3+Math.min(60,elapsed)*.2);const speed=base*(mouse.effectUntil>elapsed?(mouse.effect==='fast'?1.5:mouse.effect==='slow'?.55:1):1);
mouse.x+=Math.cos(mouse.angle)*speed*dt;mouse.y+=Math.sin(mouse.angle)*speed*dt;
if(activeHoles().some(h=>Math.hypot(mouse.x-h.x,mouse.y-h.y)<23)){notice='Il topo è scappato nel buco! Eccone un altro.';noticeUntil=elapsed+2;ui.announcement.textContent=notice;respawn(mouse);continue;}
if(mouse.x<20||mouse.x>W-20){mouse.angle=Math.PI-mouse.angle;mouse.x=clamp(mouse.x,20,W-20);}
if(mouse.y<20||mouse.y>H-20){mouse.angle=-mouse.angle;mouse.y=clamp(mouse.y,20,H-20);}
eat(mouse,'Topo');
const d1=Math.hypot(mouse.x-girl.x,mouse.y-girl.y),d2=Math.hypot(mouse.x-girl2.x,mouse.y-girl2.y);
const c1=d1<12*size(mouse)+17*size(girl),c2=d2<12*size(mouse)+17*size(girl2);if(c1||c2){catchMouse(mouse,c1&&c2&&Math.abs(d1-d2)<.001?0:c1&&(!c2||d1<d2)?1:2);if(!running||stage!==1)return;continue;}
if(hunters.some(h=>Math.hypot(h.x-mouse.x,h.y-mouse.y)<18+12*size(mouse))){notice='Un animale ha mangiato un topo!';noticeUntil=elapsed+2;respawn(mouse);}
}flash=Math.max(0,flash-dt);hud();}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function draw(now){ctx.clearRect(0,0,W,H);ctx.fillStyle='#dce9bf';ctx.fillRect(0,0,W,H);
ctx.strokeStyle='#c8d9a7';ctx.lineWidth=1;for(let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
for(let i=0;i<28;i++){let x=(i*137+35)%W,y=(i*79+25)%H;ellipse(x,y,3,2,'#b8ce91');if(i%3===0){ellipse(x+5,y-6,4,4,'#fff7db');ellipse(x+5,y-6,1.5,1.5,'#e8b860');}}
ctx.strokeStyle='#97b877';ctx.lineWidth=5;ctx.strokeRect(10,10,W-20,H-20);
for(const h of (stage===3||stage===5?[]:activeHoles())){ellipse(h.x,h.y,18,27,'#805e42');ellipse(h.x,h.y,12,21,'#302c2a');}
for(const m of mushrooms){ctx.fillStyle='#fff4dd';ctx.fillRect(m.x-4,m.y,8,15);ctx.fillStyle=m.color;ctx.beginPath();ctx.ellipse(m.x,m.y,17,14,0,Math.PI,Math.PI*2);ctx.closePath();ctx.fill();ellipse(m.x-7,m.y-5,3,3,'#fff4dd');ellipse(m.x+5,m.y-8,3,3,'#fff4dd');}
if(noticeUntil>elapsed){ctx.fillStyle='#294f43';ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.fillText(notice,W/2,38);}

ellipse(girl.x,girl.y+22,19,7,'#293d3820');ellipse(girl2.x,girl2.y+22,19,7,'#293d3820');for(const m of mice)ellipse(m.x,m.y+9,16*size(m),5,'#293d3820');
for(const [character,color,label] of [[girl,'#e96c58','1'],[girl2,'#508ec8','2']]){ctx.save();ctx.translate(character.x,character.y);ctx.scale(size(character),size(character));let bob=running&&!paused&&(keys.size||touch.size)?Math.sin(now/65)*3:0;
ellipse(-8,18+bob,7,10,'#42688a');ellipse(8,18-bob,7,10,'#42688a');ellipse(-9,26+bob,7,4,'#fff9e8');ellipse(9,26-bob,7,4,'#fff9e8');
ellipse(-17,4-bob,5,10,'#edb78f');ellipse(17,4+bob,5,10,'#edb78f');ellipse(0,5,15,18,color);ellipse(11,-24,9,14,'#654334');ellipse(0,-15,17,20,'#654334');ellipse(0,-12,13,15,'#f4c39c');ellipse(-4,-25,12,6,'#654334');ellipse(-5,-12,1.7,2.2,'#253f39');ellipse(5,-12,1.7,2.2,'#253f39');ctx.strokeStyle='#aa6557';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-9,4,0,Math.PI);ctx.stroke();ellipse(14,-25,4,3,color);ctx.fillStyle='white';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText(label,0,9);ctx.restore();}
for(const mouse of mice){ctx.save();ctx.translate(mouse.x,mouse.y);ctx.rotate(mouse.angle);ctx.scale(size(mouse),size(mouse));ctx.strokeStyle='#c58c96';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-13,0);ctx.bezierCurveTo(-30,-15,-34,15,-42,3);ctx.stroke();ellipse(0,0,17,11,mouse.green?'#41b966':'#89929a');ellipse(10,0,11,8,mouse.green?'#82dc8a':'#a5adb4');ellipse(5,-9,7,7,mouse.green?'#41b966':'#89929a');ellipse(5,-9,4,4,'#ddb0b6');ellipse(16,0,3,3,'#e5b5bd');ellipse(11,-4,2,2,'#253f39');ctx.restore();}
for(const h of [...hunters,...animals.filter(a=>a.kind==='dog')]){ctx.save();ctx.translate(h.x,h.y);const color=h.color||(h.kind==='cat'?'#e4a454':'#956d4e');ellipse(0,6,20,13,color);ellipse(0,-10,15,14,color);if(h.kind==='cat'){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-14,-14);ctx.lineTo(-13,-31);ctx.lineTo(-2,-20);ctx.fill();ctx.beginPath();ctx.moveTo(14,-14);ctx.lineTo(13,-31);ctx.lineTo(2,-20);ctx.fill();}else{ellipse(-15,-10,6,15,'#65432d');ellipse(15,-10,6,15,'#65432d');}ellipse(-5,-12,2,2,'#253f39');ellipse(5,-12,2,2,'#253f39');ellipse(0,-5,3,2,'#253f39');ctx.fillStyle='#253f39';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(h.kind==='cat'?'GATTO':'CANE',0,35);ctx.restore();}
for(const t of traps){ctx.fillStyle='#755c48';ctx.fillRect(t.x-35,t.y-30,70,60);ctx.fillStyle='#252924';ctx.fillRect(t.x-27,t.y-23,54,46);ctx.strokeStyle='#e7b44e';ctx.lineWidth=4;ctx.strokeRect(t.x-35,t.y-30,70,60);}
for(const item of items){ctx.save();ctx.translate(item.x,item.y);if(item.kind==='bone'){ctx.fillStyle='#fff7df';ctx.fillRect(-13,-5,26,10);for(const x of [-14,14])for(const y of [-5,5])ellipse(x,y,7,7,'#fff7df');}else if(item.kind==='ice'){ctx.fillStyle='#c98d4c';ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.lineTo(0,28);ctx.fill();ellipse(0,-5,15,14,'#ed8ab2');ellipse(0,-15,10,8,'#fff5d7');}else{ellipse(0,0,18,25,'#dda922');ellipse(-5,-7,5,12,'#fff1a0');}ctx.restore();}
for(const a of animals.filter(a=>a.kind!=='dog')){ctx.save();ctx.translate(a.x,a.y);if(a.kind==='rabbit'){ellipse(0,5,17,13,'#eee6db');ellipse(0,-10,12,12,'#f9f3e9');ellipse(-6,-27,4,16,'#f9f3e9');ellipse(6,-27,4,16,'#f9f3e9');ellipse(-6,-27,2,11,'#edbac5');ellipse(6,-27,2,11,'#edbac5');ellipse(0,-6,2,2,'#d58b9a');}else{for(const x of [-17,17])for(const y of [-10,10])ellipse(x,y,6,5,'#83a465');ellipse(0,-20,8,9,'#83a465');ellipse(0,0,18,21,'#477558');ctx.strokeStyle='#b7cb84';ctx.lineWidth=2;ctx.strokeRect(-7,-9,14,18);}ellipse(-4,-13,1.5,2,'#253f39');ellipse(4,-13,1.5,2,'#253f39');ctx.restore();}
if(flash>0){ctx.fillStyle='#294f43';ctx.font='bold 26px system-ui';ctx.textAlign='center';for(const [i,p] of [[1,girl],[2,girl2]])if(winner===0||winner===i)ctx.fillText('Preso! ✨',p.x,p.y-45-(.65-flash)*25);}}
function frame(now){const dt=Math.min((now-last)/1000||0,.035);last=now;if(running&&!paused)update(dt,now);draw(now);requestAnimationFrame(frame);}hud();requestAnimationFrame(frame);

