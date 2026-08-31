
/* =========================================================================
   ENGINE
   ========================================================================= */
let S = null, SC = null;

/* ---- 유틸 ---- */
function rnd(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function JP(n,pair){ const p=pair.split("/"), s=String(n), c=s.charCodeAt(s.length-1);
  return ((c>=0xAC00&&c<=0xD7A3)&&((c-0xAC00)%28!==0)) ? p[0] : p[1]; }
function J(n,pair){ return n + JP(n,pair); }
function alives(){ return S.survivors.filter(s=>s.alive); }
function randAlive(){ const a=alives(); return a.length?a[rnd(0,a.length-1)]:null; }
function moodAll(d){ for(const s of alives()) s.mental=clamp(s.mental+d,0,100); }
function fatigueAll(d){ for(const s of alives()) s.fatigue=clamp(s.fatigue+d,0,100); }
function hurt(s,n){ s.health=clamp(s.health-n,0,100); s.injured=true; if(s.health<=0) kill(s); }
function kill(s){ if(!s.alive) return; s.alive=false; s.health=0;
  log(`${J(s.name,"이/가")} 숨을 거두었다.`,"bad"); snd.beat();
  notice("💀", s.name, "돌아오지 못했다", "bad");
  S.choiceLog.push({day:S.day,tags:{},card:`${S.day}일차 · ${J(s.name,"이/가")} 이 집에서 숨을 거두었다.`});
  if(alives().length===0) S.allDead=true; }
function addTags(t){ if(!t) return; for(const k in t) S.tags[k]=(S.tags[k]||0)+t[k]; }
function addSus(o){ if(!o||!S.sus) return;
  for(const k in o) S.sus[k]=clamp((S.sus[k]||0)+o[k],0,100); }

function log(msg,cls){ S.logLines.unshift({msg,cls:cls||""});
  if(S.logLines.length>40) S.logLines.pop(); paintLog(); }
function paintLog(){ document.getElementById("log").innerHTML =
  S.logLines.slice(0,12).map(l=>`<div class="e ${l.cls}"><b>·</b> ${l.msg}</div>`).join(""); }
let toastT=null;
function toast(msg,cls){ const t=document.getElementById("toast");
  t.textContent=msg; t.className=cls||""; t.style.opacity="1";
  clearTimeout(toastT); toastT=setTimeout(()=>{t.style.opacity="0";},1900); }

/* =========================================================================
   SOUND — 파일 없이 Web Audio로 합성
   ========================================================================= */
const snd = (function(){
  let ctx=null, on=true;
  function ac(){ if(!ctx){ try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ on=false; } }
    if(ctx&&ctx.state==="suspended") ctx.resume(); return ctx; }
  function noise(dur){ const c=ac(); if(!c) return null;
    const n=Math.floor(c.sampleRate*dur), b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
    const src=c.createBufferSource(); src.buffer=b; return src; }
  function env(node,g0,dur){ const c=ac(); const g=c.createGain();
    g.gain.setValueAtTime(g0,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+dur);
    node.connect(g); g.connect(c.destination); return g; }
  return {
    get enabled(){ return on; },
    toggle(){ on=!on; if(on) ac(); return on; },
    boom(far){ if(!on) return; const c=ac(); if(!c) return;
      const s=noise(far?1.4:0.9); if(!s) return;
      const f=c.createBiquadFilter(); f.type="lowpass"; f.frequency.value=far?110:200;
      s.connect(f); env(f, far?0.20:0.45, far?1.4:0.9); s.start(); },
    knock(){ if(!on) return; const c=ac(); if(!c) return;
      [0,0.19,0.38].forEach(t=>{ const o=c.createOscillator(); o.type="sine"; o.frequency.value=70;
        const g=c.createGain(); g.gain.setValueAtTime(0.0001,c.currentTime+t);
        g.gain.linearRampToValueAtTime(0.35,c.currentTime+t+0.01);
        g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+t+0.16);
        o.connect(g); g.connect(c.destination); o.start(c.currentTime+t); o.stop(c.currentTime+t+0.2); }); },
    beat(){ if(!on) return; const c=ac(); if(!c) return;
      [0,0.30].forEach((t,i)=>{ const o=c.createOscillator(); o.type="sine";
        o.frequency.setValueAtTime(64,c.currentTime+t);
        o.frequency.exponentialRampToValueAtTime(38,c.currentTime+t+0.13);
        const g=c.createGain(); g.gain.setValueAtTime(i?0.22:0.34,c.currentTime+t);
        g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+t+0.22);
        o.connect(g); g.connect(c.destination); o.start(c.currentTime+t); o.stop(c.currentTime+t+0.25); }); },
    click(){ if(!on) return; const c=ac(); if(!c) return;
      const o=c.createOscillator(); o.type="triangle"; o.frequency.value=760;
      env(o,0.05,0.06); o.start(); o.stop(c.currentTime+0.07); },
    chime(){ if(!on) return; const c=ac(); if(!c) return;
      [660,880].forEach((f,i)=>{ const o=c.createOscillator(); o.type="sine"; o.frequency.value=f;
        const g=c.createGain(); g.gain.setValueAtTime(0.0001,c.currentTime+i*0.09);
        g.gain.linearRampToValueAtTime(0.14,c.currentTime+i*0.09+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+i*0.09+0.5);
        o.connect(g); g.connect(c.destination); o.start(c.currentTime+i*0.09); o.stop(c.currentTime+i*0.09+0.55); }); },
    wind(){ if(!on) return; const c=ac(); if(!c) return; const s=noise(2.2); if(!s) return;
      const f=c.createBiquadFilter(); f.type="bandpass"; f.frequency.value=520; f.Q.value=0.7;
      s.connect(f); env(f,0.10,2.2); s.start(); },
  };
})();

/* =========================================================================
   배경음악 — 시나리오마다 다른 곡. 없으면 버튼이 숨는다.
   ========================================================================= */
let bgm=null, bgmOn=true, bgmKey=null;
/* 큰 mp3 는 data: URL 로 두면 크롬이 디코딩을 끝내지 못한다.
   영상과 같은 이유로 Blob 으로 바꿔 쓴다. 한 번 만든 것은 재사용한다. */
const _bgmUrl = {};
function bgmBlobUrl(scn){
  if(_bgmUrl[scn]) return Promise.resolve(_bgmUrl[scn]);
  const src = BGM[scn];
  return fetch(src).then(r=>r.blob())
    .then(b=>{ _bgmUrl[scn] = URL.createObjectURL(b); return _bgmUrl[scn]; })
    .catch(()=>src);
}
function setBgm(scn){
  const src = (typeof BGM!=="undefined") && BGM[scn];
  const btn = document.getElementById("btnMusic");
  if(!src){ if(bgm) bgm.pause(); bgmKey=null; if(btn) btn.style.display="none"; return; }
  if(btn) btn.style.display="";
  if(bgmKey===scn && bgm){ if(bgmOn) bgm.play().catch(()=>{}); return; }
  if(bgm) bgm.pause();
  bgmKey = scn;
  bgmBlobUrl(scn).then(u=>{
    if(bgmKey !== scn) return;          /* 그새 시나리오가 바뀌었다 */
    bgm = new Audio(u); bgm.loop=true; bgm.volume=0.40;
    bgm.addEventListener("canplay", ()=>{ if(bgmOn) bgm.play().catch(()=>{}); });
    if(bgmOn) bgm.play().catch(()=>{});
  });
}
function setBgmOn(on){ bgmOn=on;
  if(!bgm) return; if(on) bgm.play().catch(()=>{}); else bgm.pause(); }
/* 브라우저 자동재생 정책 — 첫 상호작용에서 재생을 건다 */
function _audioKick(){ if(bgm&&bgmOn) bgm.play().catch(()=>{});
  if(narrOn && "speechSynthesis" in window){ try{ speechSynthesis.resume(); }catch(err){} }
  window.removeEventListener("pointerdown",_audioKick);
  window.removeEventListener("keydown",_audioKick); }
window.addEventListener("pointerdown",_audioKick);
window.addEventListener("keydown",_audioKick);

/* =========================================================================
   FX — 물결 / 수치 플로터 / 대형 알림 / 화면 흔들림
   ========================================================================= */
const FX = document.getElementById("fx");
function ripple(x,y,act){ const d=document.createElement("div");
  d.className="ripple"+(act?" act":""); d.style.left=x+"px"; d.style.top=y+"px";
  FX.appendChild(d); setTimeout(()=>d.remove(),620); }
function floater(x,y,text,cls){ const d=document.createElement("div");
  d.className="floater"+(cls?" "+cls:""); d.textContent=text;
  d.style.left=x+"px"; d.style.top=y+"px";
  FX.appendChild(d); setTimeout(()=>d.remove(),1200); }
function notice(icon,title,sub,kind){
  const n=document.getElementById("notice");
  const c=document.createElement("div");
  c.className="ncard"+(kind?" "+kind:"");
  c.innerHTML=`<div class="ring"></div><div class="ni">${icon}</div>
    <div class="nt">${title}</div>${sub?`<div class="ns">${sub}</div>`:""}`;
  if(kind==="good"){ for(let i=0;i<14;i++){ const f=document.createElement("i");
      f.className="conf"; f.style.background=["#e0a23a","#6fae6f","#c9a25f","#d7d2c4"][i%4];
      f.style.setProperty("--dx",(rnd(-150,150))+"px");
      f.style.setProperty("--dy",(rnd(60,190))+"px");
      f.style.animationDelay=(i*0.018)+"s"; c.appendChild(f); } }
  n.innerHTML=""; n.appendChild(c);
  setTimeout(()=>{ if(n.firstChild===c) n.innerHTML=""; },2400);
}
function noticeImg(src,title,sub,kind){
  if(!src) return notice("\uD83D\uDD28",title,sub,kind);
  const n=document.getElementById("notice");
  const c=document.createElement("div");
  c.className="ncard"+(kind?" "+kind:"");
  c.innerHTML=`<div class="ring"></div>
    <img src="${src}" alt="" style="width:132px;height:132px;object-fit:contain;
      filter:drop-shadow(0 6px 14px rgba(0,0,0,.6))">
    <div class="nt">${title}</div>${sub?`<div class="ns">${sub}</div>`:""}`;
  for(let i=0;i<14;i++){ const f=document.createElement("i");
    f.className="conf"; f.style.background=["#e0a23a","#6fae6f","#c9a25f","#d7d2c4"][i%4];
    f.style.setProperty("--dx",(rnd(-150,150))+"px");
    f.style.setProperty("--dy",(rnd(60,190))+"px");
    f.style.animationDelay=(i*0.018)+"s"; c.appendChild(f); }
  n.innerHTML=""; n.appendChild(c);
  setTimeout(()=>{ if(n.firstChild===c) n.innerHTML=""; },2600);
}
function shake(){ const st=document.getElementById("stage");
  st.classList.remove("shake"); void st.offsetWidth; st.classList.add("shake");
  setTimeout(()=>st.classList.remove("shake"),500); }

/* =========================================================================
   CANVAS
   ========================================================================= */
const cv=document.getElementById("cv"), ctx=cv.getContext("2d");
let W=0,H=0;
const bgImgs={};
function loadBG(key,src){ const im=new Image(); im.onload=()=>{ bgImgs[key]={img:im,ok:true}; bgSig=""; };
  bgImgs[key]={img:im,ok:false}; im.src=src; }
loadBG("LN", BG_LN); loadBG("KR", BG_KR); loadBG("VN", BG_VN);

function resize(){ const st=document.getElementById("stage");
  const w=st.clientWidth, h=st.clientHeight;
  if(w<2||h<2) return;                       /* 화면이 숨겨져 있으면 이전 크기 유지 */
  W=cv.width=w; H=cv.height=h; bgSig=""; relayoutAll(); }
function rrect(id){ const f=(SC.rect[id])||[0.4,0.4,0.2,0.2];
  return {x:f[0]*W,y:f[1]*H,w:f[2]*W,h:f[3]*H}; }
function roomFootY(id){ const q=rrect(id); return q.y+q.h*0.93; }
function slotX(id,i,n){ const q=rrect(id), cx=q.x+q.w/2;
  if(n<=1) return cx; const gap=Math.min(q.w*0.40,(q.w*0.58)/(n-1)); return cx+(i-(n-1)/2)*gap; }
function relayoutRoom(id){ const occ=S.survivors.filter(s=>s.alive&&s.room===id);
  occ.forEach((s,i)=>{ s.tx=slotX(id,i,occ.length); s.ty=roomFootY(id);
    if((!s.path||!s.path.length) && (Math.abs(s.tx-s.x)>1||Math.abs(s.ty-s.y)>1)) pathTo(s); }); }
function relayoutAll(){ if(!S) return;
  [...new Set(S.survivors.map(s=>s.room))].forEach(relayoutRoom);
  for(const s of S.survivors) if(!s.x){ s.x=s.tx; s.y=s.ty; } }
/* 층이 다르면 가로로 간 뒤 세로로 오르내린다 — 벽을 뚫고 대각선으로 가지 않게 */
function pathTo(s){
  if(Math.abs(s.ty-s.y) > H*0.04) s.path=[{x:s.tx,y:s.y},{x:s.tx,y:s.ty}];
  else s.path=[{x:s.tx,y:s.ty}];
}
function snapAll(){ for(const s of S.survivors){ s.x=s.tx; s.y=s.ty; s.path=[]; s.moving=false; } }
function roomById(id){ return SC.rooms.find(r=>r.id===id)||SC.rooms[0]; }

/* ---- 배경 ---- */
const bgc=document.createElement("canvas"), bgx=bgc.getContext("2d");
let bgSig="";
function curSig(){ return [W,H,S.scn,S.day,S.heated,S.build.barricade,S.build.bed,S.build.stove,S.build.rain,S.build.hide,
  (bgImgs[SC.bgKey]&&bgImgs[SC.bgKey].ok)].join("|"); }
function buildBackground(){
  bgc.width=W; bgc.height=H; const c=bgx; c.clearRect(0,0,W,H);
  const b=bgImgs[SC.bgKey];
  if(b&&b.ok) c.drawImage(b.img,0,0,W,H); else { c.fillStyle="#20242a"; c.fillRect(0,0,W,H); }
  const ph=phaseOf(S.day);
  c.save(); c.globalCompositeOperation="multiply";
  c.fillStyle = ph.id===1 ? "rgba(210,200,170,0.10)"
              : ph.id===2 ? "rgba(120,160,210,0.24)" : "rgba(160,120,105,0.22)";
  c.fillRect(0,0,W,H); c.restore();
  if(SC.bgDim){ c.save(); c.fillStyle="rgba(10,12,14,"+SC.bgDim+")"; c.fillRect(0,0,W,H); c.restore(); }
  /* 행동 배지 */
  c.save(); const fs=Math.max(10,Math.round(H*0.019));
  c.font=`700 ${fs}px system-ui`; c.textAlign="center";
  for(const r of SC.rooms){
    const label=KIND_ACT[r.kind]; if(!label||label==="휴식") continue;
    const q=rrect(r.id), col=ACT_COLOR[label]||"#9a968a";
    const tw=c.measureText(label).width+14, th=fs*1.7;
    const bx=q.x+q.w-tw-5, by=q.y+5;
    c.fillStyle="rgba(12,14,16,0.84)";
    c.beginPath(); c.roundRect(bx,by,tw,th,th/2); c.fill();
    c.strokeStyle=col+"aa"; c.lineWidth=1; c.stroke();
    c.fillStyle=col; c.fillText(label,bx+tw/2,by+th*0.68);
  }
  c.restore();
  drawBuilt(c); drawExtraBarricade(c);
  if(S.heated){ const q=rrect(4); c.save();
    const g=c.createRadialGradient(q.x+q.w/2,q.y+q.h*0.7,2,q.x+q.w/2,q.y+q.h*0.7,q.w);
    g.addColorStop(0,"rgba(255,170,60,0.28)"); g.addColorStop(1,"rgba(255,170,60,0)");
    c.fillStyle=g; c.fillRect(q.x-q.w,q.y-q.h,q.w*3,q.h*3); c.restore(); }
}

/* ---- 인물 렌더 ---- */
function drawSurvivor(s,i){
  const q = rrect(s.room);
  const h = q.h*0.92;
  const t = performance.now();
  const weak = (s.health<40 || s.mental<30);
  const pose = (s.anim==="sleep") ? "sleep"
             : s.moving ? (s.climb ? "climb" : "walk")
             : (S.guard===i ? "guard" : (s.anim==="work" ? "work" : "idle"));
  const phase = (pose==="walk"||pose==="climb") ? s.walkPhase : t*0.0016;


  ctx.save(); ctx.globalAlpha=0.36; ctx.fillStyle="#000";
  ctx.beginPath(); ctx.ellipse(s.x, s.y, h*0.19, h*0.048, 0,0,7); ctx.fill(); ctx.restore();

  if(S.selected===i){ ctx.save();
    const p=0.5+0.5*Math.sin(t*0.005);
    ctx.strokeStyle="rgba(224,162,58,"+(0.55+0.4*p)+")"; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.ellipse(s.x, s.y, h*0.25, h*0.068, 0,0,7); ctx.stroke(); ctx.restore(); }

  const frame = (pose==="sleep") ? "sleep"
              : (pose==="walk"||pose==="climb") ? walkFrame(s.walkPhase) : "idle";
  drawPersonSprite(ctx, s.x, s.y, h, s.sk, frame, s.dir||1, weak);

  ctx.save();
  const fs=Math.max(10,Math.round(H*0.018));
  ctx.font="600 "+fs+"px system-ui"; ctx.textAlign="center";
  const tw=ctx.measureText(s.name).width+12, th=fs*1.55, by=s.y-h-th-6;
  ctx.fillStyle= S.selected===i ? "rgba(70,56,26,0.92)" : "rgba(12,14,16,0.78)";
  ctx.beginPath(); ctx.roundRect(s.x-tw/2, by, tw, th, th/2); ctx.fill();
  ctx.strokeStyle= S.selected===i ? "rgba(224,162,58,0.9)" : "rgba(120,126,132,0.5)";
  ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle= S.selected===i ? "#ffd98a" : "#d7d2c4";
  ctx.fillText(s.name, s.x, by+th*0.7); ctx.restore();

  let warn="";
  if(s.health<30) warn="\u271A"; else if(s.hunger<25) warn="\uD83C\uDF5A";
  else if(s.fatigue<25) warn="\uD83D\uDCA4"; else if(s.mental<25) warn="\uD83D\uDCA7";
  if(warn){ ctx.save(); ctx.font=Math.round(h*0.20)+"px system-ui"; ctx.textAlign="center";
    ctx.fillText(warn, s.x+h*0.26, s.y-h*0.90); ctx.restore(); }

  if(s.say && s.sayT>t) drawBubble(s,h);
}
function drawBubble(s,h){
  const fs=Math.max(11,Math.round(H*0.020));
  ctx.save(); ctx.font=fs+"px system-ui";
  const pad=11, tw=ctx.measureText(s.say).width+pad*2, th=fs*2.0;
  let bx=s.x-tw/2, by=s.y-h-th-34;
  bx=clamp(bx,6,W-tw-6); by=Math.max(4,by);
  ctx.globalAlpha=clamp((s.sayT-performance.now())/400,0,1);
  ctx.fillStyle="rgba(233,227,212,0.96)";
  ctx.beginPath(); ctx.roundRect(bx,by,tw,th,7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(s.x-6,by+th); ctx.lineTo(s.x+6,by+th); ctx.lineTo(s.x,by+th+9); ctx.fill();
  ctx.fillStyle="#2a2620"; ctx.textAlign="center";
  ctx.fillText(s.say,bx+tw/2,by+th*0.66);
  ctx.restore();
}
function say(s,text,ms){ s.say=text; s.sayT=performance.now()+(ms||2600); }

/* ---- 이동: 가로로 걷고, 층이 다르면 세로로 오르내린다 ---- */
function stepMove(s,dt){
  if(!s.path||!s.path.length){ s.moving=false; s.climb=false; return; }
  const t=s.path[0], dx=t.x-s.x, dy=t.y-s.y, d=Math.hypot(dx,dy);
  const vert=Math.abs(dy)>Math.abs(dx)*1.2;
  const spd=(vert? H*0.34 : H*0.46)*dt;
  if(d<=spd||d<0.8){ s.x=t.x; s.y=t.y; s.path.shift();
    if(!s.path.length){ s.moving=false; s.climb=false; } return; }
  s.x+=dx/d*spd; s.y+=dy/d*spd; s.moving=true; s.climb=vert;
  if(!vert&&Math.abs(dx)>0.4) s.dir=dx>0?1:-1;
  s.walkPhase += (vert?7.0:9.5)*dt;
}

/* ---- 분위기 오버레이 ---- */
let _snow=null;
function drawWeather(){
  const cold=S.temp<2;
  if(cold){
    const sev=clamp((2-S.temp)/34,0,1);
    ctx.save(); ctx.globalCompositeOperation="multiply";
    ctx.fillStyle=`rgba(120,160,210,${(S.heated?0.05:0.13)+sev*0.15})`; ctx.fillRect(0,0,W,H); ctx.restore();
    const n=Math.round(40+sev*90);
    if(!_snow||_snow.length<n){ _snow=_snow||[]; while(_snow.length<n)
      _snow.push({x:Math.random(),y:Math.random(),s:0.4+Math.random(),d:Math.random()*6.28}); }
    const t=performance.now(); ctx.save(); ctx.fillStyle="rgba(228,240,252,0.72)";
    for(let i=0;i<n;i++){ const f=_snow[i];
      const y=((f.y+(t*0.00004*(0.5+f.s)))%1)*H;
      const x=(f.x*W+Math.sin(t*0.0008+f.d)*12*f.s+W)%W;
      ctx.globalAlpha=0.3+f.s*0.4; ctx.beginPath(); ctx.arc(x,y,0.8+f.s*1.5,0,7); ctx.fill(); }
    ctx.restore();
  } else if(S.scn==="vietnam" && phaseOf(S.day).id===3){
    /* 우기 — 빗줄기 */
    const t=performance.now(); ctx.save(); ctx.strokeStyle="rgba(190,205,215,0.18)"; ctx.lineWidth=1;
    for(let i=0;i<70;i++){
      const x=((i*137+t*0.35)%(W+60))-30, y=((i*211+t*0.9)%(H+60))-30;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-5,y+16); ctx.stroke(); }
    ctx.restore();
  }
}
function drawDanger(){
  if(!alives().some(s=>s.health<25)) return;
  const p=0.5+0.5*Math.sin(performance.now()*0.005);
  ctx.save(); const g=ctx.createRadialGradient(W/2,H/2,H*0.45,W/2,H/2,H*0.95);
  g.addColorStop(0,"rgba(150,30,25,0)"); g.addColorStop(1,`rgba(150,30,25,${0.10+0.13*p})`);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H); ctx.restore();
}
let hoverRoom=-1;
function drawHover(){ if(hoverRoom<0||S.selected<0) return; const q=rrect(hoverRoom);
  ctx.save(); ctx.strokeStyle="rgba(201,162,95,0.6)"; ctx.lineWidth=2;
  ctx.strokeRect(q.x+3,q.y+3,q.w-6,q.h-6);
  ctx.fillStyle="rgba(201,162,95,0.07)"; ctx.fillRect(q.x+3,q.y+3,q.w-6,q.h-6); ctx.restore(); }

/* ---- 야간 침입 시네마틱 ---- */
const RAID_TYPES={
  hungry:{label:"굶주린 이웃",n:1,arm:false,col:"rgba(80,88,100,",
    intro:"문을 두드리는 소리. 굶주린 이웃이 먹을 것을 구걸하러 왔다."},
  looter:{label:"약탈자",n:2,arm:true,col:"rgba(100,62,56,",
    intro:"어둠 속에서 낯선 자들이 집으로 다가온다."},
  troops:{label:"무장 병력",n:3,arm:true,col:"rgba(118,46,40,",
    intro:"군화 소리. 무장한 병력이 집을 덮친다."},
};
function pickRaid(){ const d=S.day, r=Math.random();
  if(d>=9) return r<0.6?"troops":"looter";
  if(d>=5) return r<0.5?"looter":(r<0.85?"hungry":"troops");
  return r<0.7?"hungry":"looter"; }
function raidKey(type, pose){
  const p = (typeof SCN_PFX!=="undefined" && SCN_PFX[S.scn]) || "ln";
  return p + "_" + type + "_" + pose;
}
/* 손전등·등불이 문에서 쏟아지는 빛 */
function drawDoorLight(cx, cy, r, hue, a){
  ctx.save();
  const g = ctx.createRadialGradient(cx, cy, r*0.06, cx, cy, r);
  g.addColorStop(0, `rgba(${hue},${a})`); g.addColorStop(0.45, `rgba(${hue},${a*0.35})`);
  g.addColorStop(1, `rgba(${hue},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  ctx.restore();
}
/* 시간만으로 결정되는 먼지 — 상태를 두지 않는다 */
function drawRaidDust(t, baseY, span, n, drift){
  ctx.save(); ctx.fillStyle = "rgba(220,210,190,0.5)";
  for(let i=0;i<n;i++){
    const seed = i*127.1, sx = (Math.sin(seed)*0.5+0.5)*span;
    const life = ((t*0.00016 + Math.sin(seed*1.7)*0.5+0.5) % 1);
    const y = baseY - life*baseY*0.55;
    const x = sx + Math.sin(t*0.0009 + seed)*drift;
    ctx.globalAlpha = 0.42*(1-life)*(1-life);
    const r = 1 + (Math.sin(seed*3.3)*0.5+0.5)*1.8;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function drawRaid(){
  const R=S.raid, T=RAID_TYPES[R.type], t=performance.now()-R.t0, now=performance.now();

  /* 어둠 */
  ctx.save(); ctx.fillStyle="rgba(6,6,9,0.82)"; ctx.fillRect(0,0,W,H); ctx.restore();

  const gid=SC.rooms.find(r=>r.kind==="guard").id, q=rrect(gid);
  const floorY=q.y+q.h*0.97, hgt=q.h*1.02, doorX=q.x+q.w*0.5;

  /* 문에서 새어드는 빛 — 굶주린 이웃은 등불, 나머지는 손전등 */
  const warm = R.type==="hungry";
  const puls = 0.5+0.5*Math.sin(now*(warm?0.004:0.011));
  drawDoorLight(doorX+q.w*0.62, floorY-hgt*0.62, hgt*(warm?1.5:2.3),
                warm?"228,176,96":"236,226,198", (warm?0.16:0.13)+0.08*puls);

  /* 위험을 알리는 붉은 기운 — 무장한 쪽일 때만 */
  if(T.arm){
    ctx.save();
    const g=ctx.createRadialGradient(W/2,H/2,H*0.28,W/2,H/2,H*0.98);
    g.addColorStop(0,"rgba(150,30,25,0)");
    g.addColorStop(1,`rgba(150,30,25,${0.16+0.14*puls})`);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H); ctx.restore();
  }

  const prog = R.phase==="approach" ? Math.min(1,t/1500) : 1;
  const ease  = 1-Math.pow(1-prog,2);

  /* 집을 지키는 사람 — 문 안쪽에서 마주 선다 */
  if(R.guarded){
    const gx=doorX-q.w*0.42;
    const gs=(S.guard>=0&&S.survivors[S.guard])?S.survivors[S.guard]:null;
    if(!(gs && drawPersonSprite(ctx, gx, floorY, hgt*0.96, gs.sk, "idle", 1, false)))
      drawRaidSprite(ctx, gx, floorY, hgt*0.96, raidKey("hungry","walk"), 1, 0.9);
  }

  /* 침입자 — 오른쪽에서 걸어 들어온다(왼쪽을 본다) */
  const pose = (R.phase==="approach") ? "walk" : "lunge";
  const key  = raidKey(R.type, pose);
  for(let i=0;i<T.n;i++){
    const tx = doorX+q.w*0.30+i*hgt*0.40;
    const x  = W*1.06+(tx-W*1.06)*ease;
    let a=1;
    if(R.phase==="after"&&R.repelled) a=Math.max(0,1-(t-2900)/700);
    const bob = R.phase==="approach" ? Math.sin(now*0.011+i*1.3)*hgt*0.012 : 0;
    /* 발밑 그림자 */
    ctx.save(); ctx.globalAlpha=0.34*a; ctx.fillStyle="#000";
    ctx.beginPath(); ctx.ellipse(x,floorY,hgt*0.20,hgt*0.030,0,0,7); ctx.fill(); ctx.restore();
    if(!drawRaidSprite(ctx, x, floorY+bob, hgt, key, -1, a)){
      ctx.save(); ctx.globalAlpha=a; ctx.fillStyle=T.col+"0.96)";
      ctx.beginPath(); ctx.ellipse(x,floorY-hgt*0.45,hgt*0.17,hgt*0.32,0,0,7); ctx.fill(); ctx.restore();
    }
  }

  drawRaidDust(now, floorY, W, 46, hgt*0.10);

  /* 부딪히는 순간 */
  if(R.phase==="clash"){
    const k=Math.min(1,(t-1500)/900), fl=Math.max(0,1-k*1.6);
    ctx.save();
    ctx.globalAlpha=0.55*fl; ctx.fillStyle="rgba(255,246,224,1)";
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=0.75*(1-k);
    ctx.strokeStyle="rgba(255,236,200,1)"; ctx.lineWidth=Math.max(2,hgt*0.05*(1-k));
    ctx.beginPath(); ctx.arc(doorX+q.w*0.16, floorY-hgt*0.52, hgt*(0.12+1.5*k), 0, 7); ctx.stroke();
    ctx.restore();
  }

  /* 빼앗긴 것 — 실제 아이콘이 떠오른다 */
  if(!R.repelled&&(R.phase==="clash"||R.phase==="after")&&R.lost&&R.lost.length){
    ctx.save();
    R.lost.forEach((it,i)=>{
      const ph=((now*0.00085)+i*0.28)%1;
      const im=_lootIcon(it);
      const sz=hgt*0.20, x=doorX+q.w*0.10+i*sz*1.15, y=floorY-hgt*0.42-ph*hgt*1.05;
      ctx.globalAlpha=Math.max(0,1-ph);
      if(im&&im.complete&&im.naturalWidth) ctx.drawImage(im,x-sz/2,y-sz/2,sz,sz);
      else { ctx.fillStyle="rgba(236,230,214,1)"; ctx.font=Math.round(sz*0.8)+"px system-ui";
             ctx.textAlign="center"; ctx.fillText(it,x,y); }
    });
    ctx.restore();
  }

  /* 글자 */
  ctx.save(); ctx.textAlign="center"; ctx.shadowColor="rgba(0,0,0,.95)"; ctx.shadowBlur=12;
  ctx.fillStyle="#e0635a"; ctx.font="800 "+Math.round(H*0.048)+"px system-ui";
  ctx.fillText("야간 침입 — "+T.label,W/2,H*0.17);
  ctx.fillStyle="rgba(236,230,214,0.96)"; ctx.font="600 "+Math.round(H*0.027)+"px system-ui";
  let msg=T.intro;
  if(R.phase==="after"){ msg = R.dead ? `${J(R.dead,"이/가")} 끝내 돌아오지 못했다…`
    : R.repelled ? "막아냈다. 그러나 상처가 남았다."
    : `막을 사람이 없었다 — ${R.lost.join(", ")}${JP(R.lost.join(", "),"을/를")} 빼앗겼다.`; }
  ctx.fillText(msg,W/2,H*0.235); ctx.restore();
}
/* 빼앗긴 자원 이름 → 아이콘 이미지 */
const _lootImgCache={};
function _lootIcon(name){
  for(const k in RES){ if(RES[k][0]===name){
    if(!_lootImgCache[k] && typeof ICON_IMG!=="undefined" && ICON_IMG[k]){
      const im=new Image(); im.src=ICON_IMG[k]; _lootImgCache[k]=im; }
    return _lootImgCache[k]; } }
  return null;
}

let renderOn=true, lastFrame=performance.now();
function render(){
  if(!renderOn) return;
  if(!S){ requestAnimationFrame(render); return; }
  if(W<2||H<2){ requestAnimationFrame(render); return; }
  const sig=curSig(); if(sig!==bgSig){ buildBackground(); bgSig=sig; }
  if(bgc.width<2||bgc.height<2){ requestAnimationFrame(render); return; }
  ctx.clearRect(0,0,W,H); ctx.drawImage(bgc,0,0);
  drawHover();
  const _now=performance.now();
  const dt=Math.min(0.05,(_now-lastFrame)/1000); lastFrame=_now;
  for(const s of S.survivors){ if(s.alive) stepMove(s,dt); }
  S.survivors.forEach((s,i)=>{ if(s.alive) drawSurvivor(s,i); });
  drawWeather(); drawDanger();
  if(S.raid) drawRaid();
  requestAnimationFrame(render);
}

/* =========================================================================
   상태
   ========================================================================= */
function phaseOf(d){ return SC.phases.find(p=>d>=p.from&&d<=p.to)||SC.phases[SC.phases.length-1]; }
function mkSurv(p){ return {name:p.n,trait:p.t,bio:p.bio,sk:p.sk,room:p.room,
  hunger:90,fatigue:85,health:100,mental:85,alive:true,injured:false,
  x:0,y:0,tx:0,ty:0,dir:1,path:[],moving:false,climb:false,walkPhase:0,
  anim:"idle",say:"",sayT:0}; }
function newGame(scnId){
  SC = SCENARIOS[scnId];
  S = { scn:scnId, day:1, temp:SC.phases[0].temp[1], heated:false,
    actions:CONFIG.actionsPerDay, res:{...SC.startRes},
    build:{stove:false,bed:1,rain:false,barricade:0,hide:false,tunnelLink:false},
    survivors:SC.survivors.map(mkSurv), selected:0,
    tags:{sol:0,rec:0,sur:0,sil:0}, sus:{gov:0,nlf:0,smoke:0},
    npc:{}, relics:[], choiceLog:[], sourcesRead:[], docLog:[], evPick:{}, evidence:null,
    guard:-1, hidden:false, logLines:[], over:false, allDead:false, raid:null,
    act2:{submitted:[],withheld:[],score:0,blameOrder:[],memorial:null} };
  (SC.npc||[]).forEach(n=>{ S.npc[n.id]={bond:0,alive:true}; });
  try{ localStorage.removeItem("shelterSave"); }catch(e){}
  log(SC.title+" — "+SC.sub,"sys");
}

/* =========================================================================
   인물 카드 바
   ========================================================================= */
const MOODLINE = {
  hurt:["상처가 자꾸 벌어져.","약이 있으면 좋겠는데…"],
  hungry:["배가 고파.","오늘도 못 먹었어."],
  tired:["잠을 못 잤어.","다리가 안 움직여."],
  sad:["우리 이렇게 얼마나 더 버텨야 해?","아무 소식도 없었어."],
  ok:["오늘은 조용하네.","아직은 견딜 만해."],
};
function moodOf(s){
  if(!s.alive) return null;
  if(s.health<40) return "hurt";
  if(s.hunger<35) return "hungry";
  if(s.fatigue<30) return "tired";
  if(s.mental<35) return "sad";
  return "ok";
}
function pbar(label,v,color){
  return `<div class="plbl"><span>${label}</span><b>${Math.round(v)}</b></div>
    <div class="pbar"><i style="width:${clamp(v,0,100)}%;background:${color}"></i></div>`;
}
function refreshCrew(){
  document.getElementById("crew").innerHTML = S.survivors.map((s,i)=>{
    if(!s.alive) return `<div class="pcard dead"><div class="pn">${s.name}</div>
      <div class="pmood">— 세상을 떠났다 —</div></div>`;
    const m=moodOf(s);
    const flag = s.health<30?"✚" : s.hunger<25?"🍚" : s.fatigue<25?"💤" : s.mental<25?"💧" : "";
    return `<div class="pcard ${S.selected===i?'sel':''}" onclick="selectSurv(${i})">
      ${flag?`<span class="pflag">${flag}</span>`:""}
      <div class="pn">${s.name} <i>${s.trait}</i></div>
      <div class="pmood">${MOODLINE[m][0]}</div>
      ${pbar("허기",s.hunger,"#8fc46a")}${pbar("피로",s.fatigue,"#6fa3ae")}
      ${pbar("체력",s.health,s.health<30?"#d2503a":"#c9a25f")}${pbar("정신",s.mental,"#b08ac9")}
    </div>`;
  }).join("");
}
window.selectSurv=function(i){ if(!S.survivors[i].alive) return;
  S.selected=i; snd.click(); refreshCrew(); updateCoach();
  const s=S.survivors[i]; const m=moodOf(s);
  say(s, MOODLINE[m][rnd(0,MOODLINE[m].length-1)], 2400); };

/* =========================================================================
   입력
   ========================================================================= */
function pointAt(ev){ const r=cv.getBoundingClientRect();
  const p=ev.touches?ev.touches[0]:ev;
  return {x:(p.clientX-r.left)*(cv.width/r.width), y:(p.clientY-r.top)*(cv.height/r.height),
          sx:p.clientX-r.left, sy:p.clientY-r.top}; }
function roomAt(x,y){ for(const r of SC.rooms){ const q=rrect(r.id);
    if(x>=q.x&&x<=q.x+q.w&&y>=q.y&&y<=q.y+q.h) return r.id; } return -1; }
function survivorAt(x,y){ for(let i=S.survivors.length-1;i>=0;i--){ const s=S.survivors[i];
    if(!s.alive) continue; const q=rrect(s.room), h=q.h*0.80;
    if(x>s.x-h*0.24&&x<s.x+h*0.24&&y>s.y-h&&y<s.y+h*0.08) return i; } return -1; }
cv.addEventListener("mousemove",e=>{ const p=pointAt(e); hoverRoom=S.selected>=0?roomAt(p.x,p.y):-1; });
cv.addEventListener("mouseleave",()=>{hoverRoom=-1;});
cv.addEventListener("click",e=>{ if(!S||S.over||S.raid) return; const p=pointAt(e);
  const si=survivorAt(p.x,p.y);
  if(si>=0){ ripple(p.sx,p.sy); selectSurv(si); return; }
  const ri=roomAt(p.x,p.y);
  if(ri>=0&&S.selected>=0){ ripple(p.sx,p.sy,true); doRoomAction(S.survivors[S.selected],ri,p); }
});

/* =========================================================================
   낮 행동
   ========================================================================= */
function screenOf(s){ const r=cv.getBoundingClientRect();
  return {x:s.x*(r.width/cv.width), y:(s.y)*(r.height/cv.height)}; }
function moveTo(s,room){ const old=s.room; s.room=room;
  relayoutRoom(room); if(old!==room) relayoutRoom(old);
  pathTo(s); }
function spend(){ S.actions--; refreshAll(); }
function gainFX(s,text,cls){ const p=screenOf(s); floater(p.x,p.y-40,text,cls); }

function doRoomAction(s,roomId,pt){
  if(!s||!s.alive) return;
  const r=roomById(roomId);
  if(r.kind==="craft"){ moveTo(s,roomId); openCraft(); return; }
  if(r.kind==="guard"){ S.guard=S.survivors.indexOf(s); moveTo(s,roomId); s.anim="idle";
    say(s,"오늘 밤은 내가 지킬게.",2600); snd.click();
    notice("👁","야간 경계",`${s.name} 배치`,""); refreshAll(); return; }
  if(r.kind==="hide"){ if(!S.build.hide){ toast("아직 땅굴이 없다. 광에서 만들 수 있다.","bad"); return; }
    moveTo(s,roomId); s.anim="idle"; say(s,"여기가 제일 안전해.",2400);
    S.hideReady=true; toast("낮 수색에 대비해 땅굴에 자리를 잡았다.","good"); refreshAll(); return; }
  if(S.actions<=0){ toast("오늘의 행동을 모두 썼다.","bad"); return; }
  if(r.kind==="eat"){
    if(S.res.food<1||S.res.water<1){ toast("먹을 것이나 물이 없다.","bad"); snd.click(); return; }
    S.res.food--; S.res.water--;
    if(S.scn==="korea"){ addSus({smoke:S.build.stove?7:13});   /* 굴뚝 연기가 오른다 */
      if(S.sus.smoke>=55) toast("굴뚝에서 연기가 오래 오른다…","bad"); }
    const gain=CONFIG.eatHunger+(s.trait==="요리"?12:0);
    s.hunger=clamp(s.hunger+gain,0,100); s.mental=clamp(s.mental+4,0,100);
    moveTo(s,roomId); s.anim="idle"; snd.chime();
    gainFX(s,`허기 +${gain}`,""); say(s,"조금 살 것 같아.",2200); spend(); return; }
  if(r.kind==="sleep"){
    const gain=CONFIG.sleepBase+(S.build.bed>0?CONFIG.sleepBed:0);
    s.fatigue=clamp(s.fatigue+gain,0,100); s.mental=clamp(s.mental+3,0,100);
    moveTo(s,roomId); s.anim="sleep"; snd.chime();
    gainFX(s,`피로 +${gain}`,""); spend(); return; }
  if(r.kind==="heal"){
    if(S.res.meds<1){ toast("약이 없다.","bad"); snd.click(); return; }
    if(s.health>=100){ toast(`${J(s.name,"은/는")} 치료가 필요 없다.`); return; }
    S.res.meds--; s.health=clamp(s.health+CONFIG.healAmount,0,100); s.injured=false;
    moveTo(s,roomId); s.anim="idle"; snd.chime();
    gainFX(s,`체력 +${CONFIG.healAmount}`,""); say(s,"이제 좀 낫네.",2200); spend(); return; }
  moveTo(s,roomId); s.anim="idle";
  s.mental=clamp(s.mental+9,0,100); s.fatigue=clamp(s.fatigue+6,0,100);
  snd.click(); gainFX(s,"정신 +9","info"); spend();
}

/* ---- 제작 ---- */
function recipes(){
  const base=[
    {id:"bed",name:"잠자리",cost:{parts:2},limit:()=>S.build.bed<2,
     desc:"수면 회복량이 크게 늘어난다. (최대 2)"},
    {id:"barricade",name:"문 보강",cost:{parts:2},limit:()=>S.build.barricade<2,
     desc:"야간 침입을 막아낼 확률이 오른다. (최대 2단계)"},
    {id:"medkit",name:"약 만들기",cost:{parts:1,valuables:1},desc:"약 +2."},
  ];
  if(S.scn==="leningrad"){
    base.unshift({id:"stove",name:"부르주이카 난로",cost:{parts:3},once:"stove",
      desc:"밤마다 연료를 태워 추위 피해를 막는다. 겨울 전에 반드시 필요하다."});
    base.push({id:"rain",name:"물통·썰매",cost:{parts:3},once:"rain",desc:"매일 아침 물 +3."});
  } else if(S.scn==="korea"){
    base.unshift({id:"hide",name:"방공호 파기",cost:{parts:3},once:"hide",
      desc:"폭격과 수색을 피해 숨을 수 있다. 굴뚝 연기가 부른 비행기도 이걸로 견딘다."});
    base.unshift({id:"stove",name:"아궁이 손보기",cost:{parts:2},once:"stove",
      desc:"불길을 줄여 연기를 덜 낸다. 밥을 지어도 굴뚝 연기가 천천히 오른다."});
    base.push({id:"rain",name:"장독대 물독",cost:{parts:3},once:"rain",desc:"매일 아침 물 +3."});
  } else {
    base.unshift({id:"hide",name:"땅굴 파기",cost:{parts:3},once:"hide",
      desc:"낮 수색을 피해 숨을 수 있다. 다만 발각되면 그 자체가 의심을 산다."});
    base.push({id:"rain",name:"빗물 항아리",cost:{parts:3},once:"rain",desc:"매일 아침 물 +3."});
  }
  return base;
}
function applyRecipe(r){
  if(r.id==="stove") S.build.stove=true;
  else if(r.id==="hide") S.build.hide=true;
  else if(r.id==="bed") S.build.bed++;
  else if(r.id==="rain") S.build.rain=true;
  else if(r.id==="barricade") S.build.barricade++;
  else if(r.id==="medkit") S.res.meds+=2;
}
function canAfford(c){ for(const k in c) if(S.res[k]<c[k]) return false; return true; }
function openCraft(){
  let h=`<div class="pad"><p class="hint" style="margin:0 0 10px">제작에는 <b style="color:var(--warn)">행동 1회</b>가 듭니다. 남은 행동 ${S.actions}회.</p><div class="craftgrid">`;
  for(const r of recipes()){
    const built=r.once&&S.build[r.once], limited=r.limit&&!r.limit();
    const ok=canAfford(r.cost)&&!built&&!limited&&S.actions>0;
    const cost=Object.keys(r.cost).map(k=>
      `<span class="c ${S.res[k]<r.cost[k]?'miss':''}">${resIcon(k,17)} ${RES[k][0]} ${r.cost[k]}</span>`).join("");
    const P=OBJ_PLACE[S.scn]||{}, pl=P[r.id], pic=pl&&OBJ_IMG[pl.key];
    h+=`<div class="card ${ok?'':'locked'}">
      ${pic?`<div style="height:88px;display:flex;align-items:center;justify-content:center;
        background:#1c2024;border:1px solid var(--line);border-radius:4px;margin:-2px 0 4px">
        <img src="${pic}" alt="" style="max-width:86%;max-height:78px;object-fit:contain"></div>`:""}
      <h5>${r.name}</h5><div class="desc">${r.desc}</div>
      <div class="cost">${cost}</div>
      <button ${ok?'':'disabled'} onclick="doCraft('${r.id}')">${built?"완료됨":limited?"최대치":"만든다"}</button></div>`;
  }
  h+=`</div><div class="rowbtns"><button onclick="closeModal()">닫기</button></div></div>`;
  showModal("만들기",h);
}
window.openCraft=openCraft;
window.doCraft=function(id){ const r=recipes().find(x=>x.id===id);
  if(!r||S.actions<=0||!canAfford(r.cost)) return;
  for(const k in r.cost) S.res[k]-=r.cost[k];
  applyRecipe(r); snd.chime();
  const P=OBJ_PLACE[S.scn]||{}, place=P[r.id]||(r.id==="bed"&&S.build.bed>1?P.bed2:null);
  const img=place&&OBJ_IMG[place.key];
  noticeImg(img, r.name, place?"집에 자리를 잡았다":"완성했다", "good");
  log(`${r.name}${JP(r.name,"을/를")} 만들었다.`,"good"); spend(); bgSig=""; closeModal(); };

/* ---- 모달 ---- */

/* =========================================================================
   낭독 — 브라우저 내장 음성. 파일 크기를 늘리지 않고 세 시나리오 본문에 다 걸린다.
   ========================================================================= */
let narrOn = true, _koVoice = null;   /* 기본으로 켜 둔다 */
function _pickKoVoice(){
  if(!("speechSynthesis" in window)) return null;
  const vs = speechSynthesis.getVoices() || [];
  const ko = vs.filter(v=>/^ko([-_]|$)/i.test(v.lang) || /korean|한국/i.test(v.name));
  /* 남성 음성이 깔려 있으면 그것을 먼저 쓴다(윈도우 InJoon 등).
     없으면 오프라인에서도 되는 로컬 음성을 쓴다 — 수업은 인터넷 없이 돌아가야 한다. */
  return ko.find(v=>/injoon|인준|male|남/i.test(v.name))
      || ko.find(v=>v.localService)
      || ko[0] || null;
}
if("speechSynthesis" in window){
  _koVoice = _pickKoVoice();
  speechSynthesis.onvoiceschanged = ()=>{ _koVoice = _pickKoVoice(); };
}
function stripTags(html){
  return String(html==null?"":html)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h1|h2|h3)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g," ").replace(/&amp;/g,"&")
    .replace(/&lt;/g,"<").replace(/&gt;/g,">")
    .replace(/\s+/g, " ").trim();
}
function narrStop(){ if("speechSynthesis" in window){ try{ speechSynthesis.cancel(); }catch(err){} } }
function narrate(html, rate){
  if(!narrOn || !("speechSynthesis" in window)) return;
  const t = stripTags(html);
  if(!t) return;
  narrStop();
  /* 긴 글은 문장으로 잘라 넣어야 크롬이 중간에 끊지 않는다 */
  const parts = t.match(/[^.!?。]+[.!?。]?\s*/g) || [t];
  let chunk = "", queue = [];
  for(const p of parts){
    if((chunk+p).length > 170){ if(chunk) queue.push(chunk); chunk = p; }
    else chunk += p;
  }
  if(chunk) queue.push(chunk);
  for(const q of queue){
    const u = new SpeechSynthesisUtterance(q);
    if(_koVoice) u.voice = _koVoice;
    /* 한국어 남성 음성이 없는 환경이 대부분이라, 음높이를 크게 낮춰
       어둡고 가라앉은 목소리로 만든다. 남성 음성을 찾았으면 덜 낮춘다. */
    const male = _koVoice && /injoon|인준|male|남/i.test(_koVoice.name);
    u.lang = "ko-KR"; u.rate = rate || 0.82;
    u.pitch = male ? 0.72 : 0.28; u.volume = 1;
    speechSynthesis.speak(u);
  }
}
window.narrate = narrate; window.narrStop = narrStop;
window.setNarrOn = function(on){ narrOn = on; if(!on) narrStop(); };


function showModal(title,html){
  document.getElementById("mTitle").innerHTML=title;
  document.getElementById("mBody").innerHTML=html;
  document.getElementById("overlay").style.display="flex";
  document.getElementById("modal").scrollTop=0;
}
function closeModal(){ document.getElementById("overlay").style.display="none"; narrStop(); }
window.closeModal=closeModal;

/* =========================================================================
   사건 — 삽화 + 증언 + 사료
   ========================================================================= */
let _ev=null,_srcOpen=false,_docOpen={},_docPick=null;
/* 하루에 사건이 둘 있으면 그중 하나가 나온다 — 판마다 겪는 역사가 달라진다 */
function eventOfDay(d){
  const a = SC.events.find(e=>e.day===d);
  const b = SC.events2 && SC.events2.find(e=>e.day===d);
  if(!b) return a;
  if(!a) return b;
  if(S.evPick && S.evPick[d]) return S.evPick[d]==="b" ? b : a;
  const use = Math.random()<0.5 ? "a" : "b";
  if(S.evPick) S.evPick[d]=use;      /* 같은 날엔 늘 같은 사건이 나오게 고정 */
  return use==="b" ? b : a;
}
/* 대체 사건의 선택지 그림 키는 kr01b_0 꼴 */
function evSuffix(e){ return (SC.events2 && SC.events2.indexOf(e)>=0) ? "b" : ""; }
function runEvent(){ const e=eventOfDay(S.day); if(!e){ updateCoach(); return; }
  _ev=e; _srcOpen=false; _docOpen={}; _docPick=null; _stStep=0; _stBeats=[];
  paintEvent(); if(e.img) snd.wind(); }

/* 선택지 그림 — 키는 ln01_0 꼴(시나리오·일차·선택 번호) */
function chKey(day, i, sfx){
  const p = (typeof SCN_PFX!=="undefined" && SCN_PFX[S.scn]) || "ln";
  return p + String(day).padStart(2,"0") + (sfx||"") + "_" + i;
}
function chImg(day, i, sfx){
  return (typeof CH_IMG!=="undefined" && CH_IMG[chKey(day,i,sfx)]) || "";
}
/* =========================================================================
   무대 — 인물이 배경 위에 서서 말하고, 선택지는 한 판에 들어온다
   ========================================================================= */
const STAGE = document.getElementById("scene");
let _stStep = 0, _stBeats = [];

/* 사건 하나를 '말하는 토막'들로 나눈다 */
function stageBeats(ev){
  const out = [];
  if(ev.quote) out.push({say:ev.quote.tx, by:ev.quote.by, quote:true});
  String(ev.b || "").split(/<br\s*\/?>/i).forEach(t=>{
    t = t.trim(); if(t) out.push({say:t});
  });
  return out.length ? out : [{say:ev.t}];
}
/* 무대에 세울 사람들 — 살아 있는 식구 */
function stageCast(speakIdx, tight){
  const alive = S.survivors.filter(s=>s.alive);
  if(!alive.length) return "";
  /* 선택지가 뜬 판에서는 배우를 낮춰 화면 하나에 다 들어가게 한다 */
  const vh = window.innerHeight;
  const h = tight
    ? Math.round(Math.max(66,  Math.min(124, vh*0.155)))
    : Math.round(Math.max(120, Math.min(230, vh*0.30)));
  return alive.map((s,i)=>{
    const f = (typeof SPRITE_FR!=="undefined") &&
      (SPRITE_FR[s.sk+"_idle"] || SPRITE_FR[s.sk+"_walk1"]);
    const SW = sheetImg.naturalWidth, SH = sheetImg.naturalHeight;
    let fig = "";
    if(f && SW){
      const sc = h / f[3];
      fig = `<span class="fig" style="width:${Math.round(f[2]*sc)}px;height:${h}px;
        background-size:${Math.round(SW*sc)}px ${Math.round(SH*sc)}px;
        background-position:${-Math.round(f[0]*sc)}px ${-Math.round(f[1]*sc)}px"></span>`;
    }
    const on = (speakIdx===i);
    return `<div class="stactor ${on?'speak':(speakIdx>=0?'dim':'')}">
      ${fig}<span class="nm">${s.name}</span></div>`;
  }).join("");
}
function stageShow(html){ STAGE.innerHTML = html; STAGE.classList.add("on"); }
function stageHide(){ STAGE.classList.remove("on"); STAGE.innerHTML = ""; narrStop(); }
window.stageHide = stageHide;

function paintEvent(){
  const e = _ev;
  if(!_stBeats.length) _stBeats = stageBeats(e);
  const last = _stStep >= _stBeats.length - 1;
  const bt = _stBeats[Math.min(_stStep, _stBeats.length-1)];
  const bg = (e.img && EVIMG[e.img]) || "";
  /* 말하는 사람 — 인용은 바깥 목소리라 아무도 비추지 않는다 */
  const spk = bt.quote ? -1 : (_stStep % Math.max(1, S.survivors.filter(s=>s.alive).length));

  const needDoc = !!(e.docs && e.docs.length && _docPick===null);
  const tools =
    `<div class="sttools">
      <button class="${_srcOpen?'done':''}" onclick="openSource()">🕯 ${_srcOpen?"사료를 떠올렸다":"그때 들은 이야기"}</button>
      ${e.docs&&e.docs.length ? `<button class="${needDoc?'need':'done'}" onclick="openDocs()">
        📜 남은 자료 ${e.docs.length}${needDoc?" — 근거를 고르세요":" · "+e.docs[_docPick].label}</button>` : ""}
    </div>`;

  let body;
  if(!last){
    body = `<div class="stbox">
      ${bt.quote?`<div class="stquote">— ${bt.by}</div>`:""}
      <div class="stline">${bt.quote?"<em>“"+bt.say+"”</em>":bt.say}</div>
      <div class="stnext">${tools}<span class="stgo">눌러서 계속 ▸</span></div>
    </div>`;
  } else {
    const cards = e.ch.map((c,i)=>{
      if(c.unlock && !_srcOpen) return "";
      if(c.need && !S.build[c.need]) return "";
      const u = chImg(e.day, i, evSuffix(e));
      return `<button class="stcard ${c.unlock?'unlocked':''}" ${needDoc?'disabled':''}
          onclick="pickEvent(${i})">
        ${u?`<span class="cp" style="background-image:url('${u}')"></span>`:""}
        <span class="ct">${c.x}${c.unlock?'<i>떠올린 덕에 열린 길</i>':''}</span></button>`;
    }).join("");
    body = `<div class="stbox">
        <div class="stline">${bt.quote?"<em>“"+bt.say+"”</em>":bt.say}</div>
        <div class="stnext">${tools}${needDoc?'<span class="stgo" style="color:var(--danger)">근거를 골라야 결정할 수 있습니다</span>':""}</div>
      </div>
      <div class="stchoices">${cards}</div>`;
  }

  STAGE.classList.toggle("picking", last);
  stageShow(`
    <div class="stbg" style="${bg?`background-image:url('${bg}')`:""}"></div>
    <div class="stveil"></div>
    <div class="sthead"><span class="stday">${e.day}일차</span><h2 class="sttitle">${e.t}</h2></div>
    <div class="stcast" ${last?'':'onclick="stageNext()"'}>${stageCast(spk, last)}</div>
    ${body}
    <div class="stpanel" id="stPanel"></div>`);
  if(!last) STAGE.querySelector(".stbox").onclick = (ev)=>{
    if(ev.target.closest("button")) return; stageNext();
  };
  narrate((bt.quote?"":"") + bt.say);
}
window.stageNext = function(){
  if(_stStep < _stBeats.length-1){ _stStep++; snd.click(); paintEvent(); }
};
/* 덧창 — 사료와 자료는 무대를 늘리지 않고 위에 덮는다 */
function stagePanel(html){
  const p = document.getElementById("stPanel");
  if(!p) return;
  p.innerHTML = `<div class="pw">${html}</div>`;
  p.classList.add("on");
}
window.closePanel = function(){
  const p = document.getElementById("stPanel");
  if(p){ p.classList.remove("on"); p.innerHTML=""; }
};
window.openDocs = function(){
  const e=_ev; snd.click();
  const cards = e.docs.map((d,i)=>{
    const open=!!_docOpen[i], pick=(_docPick===i);
    return `<div class="doccard ${open?'open':''} ${pick?'picked':''}">
      <button class="dtop" onclick="openDoc(${i})">
        <span class="dkind">${d.kind||"자료"}</span><b>${d.label}</b>
        ${open?"":`<i class="dmore">열어 본다 ▾</i>`}</button>
      ${open?`<div class="dbody">${d.tx}<span class="cite">— ${d.cite}</span>
        <button class="dpick ${pick?'on':''}" onclick="pickDoc(${i})">
          ${pick?"◉ 이 자료를 근거로 삼았다":"○ 이것을 근거로 삼는다"}</button></div>`:""}
    </div>`; }).join("");
  stagePanel(`<div class="ph"><b>남 아 있 는 자 료</b>
      <button class="pclose" onclick="closePanel()">닫기 ✕</button></div>
    <p class="ohint bad" style="margin:0 0 12px">서로 맞지 않습니다. 열어 보고 무엇을 근거로 삼을지 정하세요.</p>
    <div class="docgrid">${cards}</div>
    <div class="docask">${e.docAsk||"무엇을 근거로 결정하시겠습니까?"}</div>
    ${_docPick===null?`<div class="docwarn">▸ 근거를 하나 골라야 결정할 수 있습니다.</div>`
      :`<div class="docok">▸ <b>${e.docs[_docPick].label}</b>${JP(e.docs[_docPick].label,"을/를")} 근거로 삼았습니다.</div>`}`);
};
window.openDoc=function(i){ _docOpen[i]=!_docOpen[i]; snd.click();
  if(_docOpen[i]) addTags({rec:1});
  paintEvent(); openDocs(); };
window.pickDoc=function(i){ _docPick=i; snd.click(); paintEvent(); openDocs(); };
window.openSource=function(){ const e=_ev; snd.click();
  if(!_srcOpen){ _srcOpen=true;
    if(!S.sourcesRead.includes(e.day)) S.sourcesRead.push(e.day);
    addTags({rec:1}); }
  paintEvent();
  stagePanel(`<div class="ph"><b>사 료</b>
      <button class="pclose" onclick="closePanel()">닫기 ✕</button></div>
    <div class="srcbox">${e.src.tx}<span class="cite">— ${e.src.cite}</span></div>
    ${e.ch.some(c=>c.unlock)?`<div class="unlocknote">▸ 새로운 선택지가 열렸습니다.</div>`:""}`); };

/* =========================================================================
   선택의 결과를 눈에 보이게 — 고르기 전후를 견주어 바뀐 것만 띄운다
   ========================================================================= */
function snapState(){
  const alive = S.survivors.filter(s=>s.alive);
  const avg = k => alive.length ? alive.reduce((a,s)=>a+s[k],0)/alive.length : 0;
  return { res:{...S.res}, sus:{...(S.sus||{})},
           mental:avg("mental"), health:avg("health"), fatigue:avg("fatigue"),
           alive:alive.length };
}
const OUTCOME_STAT = [
  ["mental","마음","#8b7bb8"], ["health","몸","#6fae6f"], ["fatigue","기운","#d2a04a"],
];
function diffChips(before){
  const a = snapState(), out = [];
  for(const k in RES){
    const d = a.res[k]-before.res[k];
    if(d) out.push(`<span class="ochip ${d>0?'up':'dn'}">${resIcon(k,18)}
      ${RES[k][0]} <b>${d>0?"+":""}${d}</b></span>`);
  }
  for(const [k,label,col] of OUTCOME_STAT){
    const d = Math.round(a[k]-before[k]);
    if(Math.abs(d)>=2) out.push(`<span class="ochip ${d>0?'up':'dn'}">
      <i style="background:${col}"></i>${label} <b>${d>0?"+":""}${d}</b></span>`);
  }
  if(SC.meters) for(const m of SC.meters){
    const d = Math.round((a.sus[m.key]||0)-(before.sus[m.key]||0));
    if(d) out.push(`<span class="ochip ${d>0?'dn':'up'}">
      <i style="background:${m.color}"></i>${m.label} <b>${d>0?"+":""}${d}</b></span>`);
  }
  if(a.alive < before.alive)
    out.push(`<span class="ochip dn"><b>식구를 잃었다</b></span>`);
  return out;
}
/* 바뀐 계기판을 잠깐 반짝인다 */
function flashMeters(before){
  if(!SC.meters) return;
  const a = snapState();
  SC.meters.forEach((m,i)=>{
    if(Math.round((a.sus[m.key]||0)-(before.sus[m.key]||0))===0) return;
    const el = document.querySelectorAll("#hMeters > div")[i];
    if(el){ el.classList.remove("mflash"); void el.offsetWidth; el.classList.add("mflash"); }
  });
}
let _outT=null;
/* 고른 그림을 그대로 크게 띄우고, 그 아래에 바뀐 것을 붙인다 */
function showOutcome(title, before, opt){
  opt = opt || {};
  const chips = diffChips(before);
  const box = document.getElementById("outcome");
  if(!chips.length && !opt.pic && !opt.line){ box.classList.remove("on"); return; }
  box.innerHTML =
    (opt.pic ? `<span class="opic" style="background-image:url('${opt.pic}')"></span>` : "") +
    `<span class="obody">
       <span class="olbl">${title}</span>
       ${opt.line?`<span class="oline">${opt.line}</span>`:""}
       <span class="ochips">${chips.join("")}</span>
     </span>`;
  box.className = "on" + (opt.pic ? " haspic" : "");
  void box.offsetWidth;
  clearTimeout(_outT);
  _outT = setTimeout(()=>box.classList.remove("on"), opt.hold || 5200);
  flashMeters(before);
}
window.showOutcome = showOutcome;


/* 게임의 결과 옆에 역사의 결과를 나란히 놓는다 */
function showAftermath(ev, c, i, doc){
  if(S.over) return;
  const pic = chImg(ev.day, i, evSuffix(ev));
  const judge = doc ? (doc.sound
      ? `<div class="dverdict ok">당신이 근거로 삼은 <b>${doc.label}</b>은(는) 사실에 가까웠습니다.</div>`
      : `<div class="dverdict bad">당신이 근거로 삼은 <b>${doc.label}</b>은(는) 그대로 믿을 수 있는 자료가 아니었습니다.</div>`) : "";
  showModal(`${ev.day}일차 — 그래서 어떻게 됐나`, `
    ${pic?`<div class="aftpic" style="background-image:url('${pic}')"><span></span>
      <b>${c.x}</b></div>`:""}
    <div class="pad">
      ${judge}
      <div class="srcbox real"><span class="lbl">실 제 로 는</span>${ev.real.tx}
        <span class="cite">— ${ev.real.cite}</span></div>
      ${ev.real.ask?`<div class="realask">${ev.real.ask}</div>`:""}
      <div class="rowbtns"><button class="btn-go" onclick="closeModal()">계속 ▸</button></div>
    </div>`);
}
window.pickEvent=function(i){
  const e=_ev,c=e.ch[i]; if(!c) return;
  const before=snapState();
  c.f&&c.f(); addTags(c.tags); addSus(c.sus);
  if(!_srcOpen) addTags({sil:1});
  if(c.evidence) S.evidence=c.evidence;
  if(c.npc&&S.npc[c.npc]) S.npc[c.npc].bond+=2;
  S.choiceLog.push({day:e.day,card:c.card,tags:c.tags||{}});
  const doc = (e.docs && _docPick!==null) ? e.docs[_docPick] : null;
  if(doc) S.docLog.push({day:e.day, label:doc.label, sound:!!doc.sound});
  closeModal(); stageHide(); refreshAll(); updateCoach();
  showOutcome("그 선택의 결과", before, {pic:chImg(e.day,i,evSuffix(e)), line:c.card});
  if(e.real) setTimeout(()=>showAftermath(e, c, i, doc), 900);
  if(S.allDead) setTimeout(endAct1,700);
};
