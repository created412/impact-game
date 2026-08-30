
/* =========================================================================
   밤 — 시네마틱
   ========================================================================= */
const SCN_PFX = {leningrad:"ln", korea:"kr", vietnam:"vn"};
/* 장소마다 그려둔 그림 — 선택 카드와 밤 배경에 같은 그림을 쓴다 */
function locArt(loc){
  const p = SCN_PFX[S.scn] || "ln";
  return (typeof LOC_ART !== "undefined" && LOC_ART[p + "_" + loc.id])
      || EVIMG[p + "12"] || EVIMG.ln12;
}
function nightBg(){ const p = SCN_PFX[S.scn] || "ln"; return EVIMG[p + "12"] || EVIMG.ln12; }
/* 위험도 표시 */
const RISK_W = {1:["낮음","#6fae6f"], 2:["보통","#d2a04a"], 3:["높음","#d2503a"]};

const NIGHT_BEATS = {
 leningrad:[
  {tx:"눈 위에 발자국이 어지럽다. 누군가 먼저 다녀간 자리다.",
   ch:[{x:"발자국을 따라간다", risk:14, loot:1.35, note:"먼저 간 사람이 못 본 것이 남아 있었다."},
       {x:"반대쪽으로 돌아간다", risk:-8, loot:0.85, note:"조용한 쪽으로 돌았다."}]},
  {tx:"멀리서 포성이 울린다. 소리가 점점 가까워진다.",
   ch:[{x:"벽에 붙어 지나가길 기다린다", risk:-12, loot:0.8, note:"한참을 벽에 붙어 서 있었다."},
       {x:"소리를 무시하고 서둘러 뒤진다", risk:20, loot:1.35, note:"손이 떨렸지만 멈추지 않았다."}]},
  {tx:"같은 것을 찾으러 온 사람과 마주쳤다. 서로 아무 말도 하지 않는다.",
   ch:[{x:"반씩 나누자고 한다", risk:-6, loot:0.85, sol:2, note:"반으로 나눴다. 둘 다 살아 돌아갔다."},
       {x:"먼저 챙겨 자리를 뜬다", risk:8, loot:1.2, sil:2, note:"먼저 챙겨 나왔다. 뒤는 보지 않았다."}]},
  {tx:"순찰대의 손전등이 벽을 훑고 지나간다.",
   ch:[{x:"납작 엎드린다", risk:-14, loot:0.75, note:"눈 속에 얼굴을 묻었다."},
       {x:"어둠 속으로 달린다", risk:16, loot:1.15, note:"단숨에 달렸다. 폐가 얼어붙는 것 같았다."}]},
 ],
 korea:[
  {tx:"길 위에 피란민 행렬이 끝없이 이어진다. 남쪽으로 내려가는 사람들이다.",
   ch:[{x:"행렬에 섞여 걷는다", risk:-10, loot:0.8, sol:2, note:"사람들 틈에 섞였다. 혼자일 때보다 눈에 덜 띄었다."},
       {x:"행렬을 피해 논둑으로 돌아간다", risk:12, loot:1.25, note:"길을 버리고 논둑을 탔다. 진창에 발이 빠졌다."}]},
  {tx:"먼 집 굴뚝에서 연기가 오른다. 아직 사람이 사는 집이다.",
   ch:[{x:"그 집에 들러 사정을 묻는다", risk:8, loot:1.2, sol:2, note:"주먹밥 한 덩이를 얻었다. 대신 우리 마을 소식을 남기고 왔다."},
       {x:"연기를 피해 멀리 돈다", risk:-10, loot:0.85, sil:2, note:"불빛도 사람도 피했다. 아무도 우리를 보지 못했다."}]},
  {tx:"검문이다. 손전등이 얼굴을 비춘다. 어느 쪽 군인인지 어둠 속에서는 알 수 없다.",
   ch:[{x:"묻는 대로 이름을 댄다", risk:-8, loot:0.9, sus:{gov:6},
        note:"이름을 댔다. 수첩에 무언가 적히는 소리가 났다. 그것이 무슨 명부인지는 묻지 못했다."},
       {x:"끝내 입을 열지 않는다", risk:18, loot:1.1, sil:2,
        note:"이름을 대지 않았다. 개머리판이 어깨를 밀쳤지만, 적히지도 않았다."}]},
  {tx:"불탄 집터에 사람 그림자가 웅크리고 있다. 우리를 보고도 달아나지 않는다.",
   ch:[{x:"가진 것을 나눈다", risk:6, loot:0.85, sol:3, note:"반을 떼어 주었다. 이름은 서로 묻지 않았다."},
       {x:"못 본 척 지나친다", risk:-4, loot:1.0, sil:2, note:"지나쳤다. 뒤에서는 아무 소리도 나지 않았다."}]},
 ],
 vietnam:[
  {tx:"논둑 너머에서 손전등 불빛이 흔들린다. 순찰이다.",
   ch:[{x:"물속에 몸을 담그고 기다린다", risk:-14, loot:0.78, note:"목까지 물에 잠긴 채 숨을 죽였다."},
       {x:"논을 가로질러 달린다", risk:18, loot:1.2, note:"진흙을 튀기며 달렸다."}]},
  {tx:"길가에 무언가 반쯤 묻혀 있다. 건드리면 안 되는 것일 수도 있다.",
   ch:[{x:"돌아서 간다", risk:-10, loot:0.85, note:"멀리 돌아갔다. 시간이 오래 걸렸다."},
       {x:"조심스럽게 살펴본다", risk:22, loot:1.4, note:"불발탄이었다. 고철은 값이 나간다."}]},
  {tx:"어둠 속에서 낮은 목소리가 이름을 부른다. 아는 목소리다.",
   ch:[{x:"대답하고 함께 간다", risk:6, loot:1.15, sol:2, note:"같은 마을 사람이었다. 길을 알려주었다."},
       {x:"못 들은 척 지나간다", risk:-4, loot:0.9, sil:2, note:"대답하지 않았다. 모르는 편이 안전하다."}]},
  {tx:"헬기 소리가 낮게 깔린다. 조명탄이 논 위에 떠오른다.",
   ch:[{x:"불빛이 꺼질 때까지 엎드린다", risk:-12, loot:0.8, note:"조명탄이 다 탈 때까지 엎드려 있었다."},
       {x:"그림자를 따라 움직인다", risk:14, loot:1.25, note:"그늘만 밟으며 움직였다."}]},
 ],
};

const NIGHT = document.getElementById("night");
const NW = document.getElementById("nightWrap");
let _nt = null;   /* 밤 진행 상태 */

function nightShow(bgUrl, loc, txt, choicesHtml, showRisk){
  const risk=_nt?clamp(_nt.risk,0,100):0;
  NIGHT.style.display="flex";
  NW.innerHTML=`
    <div class="nbg" style="background-image:url('${bgUrl}')"></div>
    <div class="nveil"></div>
    ${(showRisk&&risk>55)?'<div class="scanline"></div>':""}
    ${showRisk?`<div class="nrisk">위험 <span class="rb"><i style="width:${risk}%"></i></span></div>`:""}
    <div class="npanel"><div class="ninner">
      <div class="nloc">${loc||"밤"}</div>
      <p class="ntxt">${txt}</p>
      <div class="nchoices">${choicesHtml}</div>
    </div></div>`;
}
function nightHide(){ NIGHT.style.display="none"; NW.innerHTML=""; narrStop(); }

window.openNight=function(){
  if(S.over) return; snd.wind();
  const avail=SC.locations.filter(l=>S.day>=l.minDay);
  const btns=avail.map(l=>{
    const [rw,rc]=RISK_W[l.risk]||RISK_W[1];
    return `<button class="loccard" onclick="nightPickLoc('${l.id}')">
      <span class="lcart" style="background-image:url('${locArt(l)}')"></span>
      <span class="lcsh"></span>
      <span class="lcrisk" style="color:${rc};border-color:${rc}55">위험 ${rw}<i>${"●".repeat(l.risk)}</i></span>
      <span class="lctx"><b>${l.name}</b><em>${l.note}</em></span>
    </button>`;}).join("");
  const gname=(S.guard>=0&&S.survivors[S.guard]&&S.survivors[S.guard].alive)?S.survivors[S.guard].name:"없음";
  _nt={risk:0};
  nightShow(nightBg(), "밤이 왔다",
    `한 사람을 밖으로 내보낸다. 나머지는 집에 남는다.<br>
     <span style="font-size:13px;color:var(--ink-dim)">집을 지키는 사람: <b style="color:var(--warn)">${gname}</b></span>`,
    btns + `<button class="nback" onclick="nightCancel()">아직 낮이다 — 돌아가기</button>`,
    false);
};
window.nightCancel=function(){ nightHide(); _nt=null; };
window.nightPickLoc=function(id){
  const loc=SC.locations.find(l=>l.id===id); snd.click();
  _nt={loc, risk:loc.risk*16};
  const btns=S.survivors.map((s,i)=>{ if(!s.alive) return "";
    const bad=s.health<45||s.fatigue<30;
    const hc=s.health<45?"#d2503a":"#6fae6f", fc=s.fatigue<30?"#d2503a":"#d2a04a";
    return `<button class="scard" onclick="nightPickScout(${i})">
      <span class="scpit">${scoutPortrait(s.sk,104)}</span>
      <span class="sctx">
        <b>${s.name}</b><span class="sctr">${s.trait||""}</span>
        <span class="scbar"><em>체력</em><span class="pb"><i style="width:${Math.round(s.health)}%;background:${hc}"></i></span></span>
        <span class="scbar"><em>피로</em><span class="pb"><i style="width:${Math.round(s.fatigue)}%;background:${fc}"></i></span></span>
        ${bad?'<span class="scwarn">위험한 상태로 나선다</span>':''}
      </span></button>`; }).join("");
  nightShow(locArt(loc), loc.name, "누구를 보낼 것인가?", btns, true);
};
window.nightPickScout=function(i){
  const s=S.survivors[i]; _nt.scout=s; snd.click();
  if(s.health<45) _nt.risk+=12;
  if(s.fatigue<30) _nt.risk+=8;
  const beats=NIGHT_BEATS[S.scn]||NIGHT_BEATS.vietnam, b=beats[rnd(0,beats.length-1)];
  _nt.beat=b; _nt.mult=1;
  const bi = beats.indexOf(b);
  const np = (typeof SCN_PFX!=="undefined" && SCN_PFX[S.scn]) || "ln";
  const btns=b.ch.map((c,k)=>{
    const u=(typeof CH_IMG!=="undefined" && CH_IMG[`${np}_b${bi}_${k}`])||"";
    return `<button class="bcard ${u?'haspic':''}" onclick="nightBeat(${k})">
      ${u?`<span class="bcpic" style="background-image:url('${u}')"></span>`:""}
      <span class="bcx">${c.x}</span><span class="bcar">▸</span></button>`;}).join("");
  nightShow(locArt(_nt.loc), _nt.loc.name,
    `<b>${s.name}</b>${JP(s.name,"이/가")} 어둠 속으로 나섰다.<br><br>${b.tx}`, btns, true);
};
window.nightBeat=function(k){
  const c=_nt.beat.ch[k]; snd.click();
  _nt.before=snapState();
  _nt.risk=clamp(_nt.risk+c.risk,0,100); _nt.mult=c.loot;
  if(c.sol) addTags({sol:c.sol}); if(c.sil) addTags({sil:c.sil});
  if(c.sus) for(const k in c.sus) S.sus[k]=clamp((S.sus[k]||0)+c.sus[k],0,100);
  _nt.beatNote=c.note;
  nightShow(locArt(_nt.loc), _nt.loc.name, c.note+"<br><br>이제 돌아갈 시간이다.",
    `<button class="btn-go" onclick="nightResolve()">집으로 돌아간다 ▸</button>`, true);
};
window.nightResolve=function(){
  const {loc,scout,risk,mult}=_nt;
  const scale=(SC.lootScale?SC.lootScale[phaseOf(S.day).id]:1)*(mult||1);
  const found={};
  for(const [k,mn,mx] of loc.loot){ const n=Math.round(rnd(mn,mx)*scale); if(n>0) found[k]=(found[k]||0)+n; }
  _nt.found=found;
  /* 유물 */
  if(Math.random()<0.35){ const R=(SC.relics||[]); if(R.length){
    const pool=R.filter(r=>!S.relics.some(x=>x.id===r.id));
    if(pool.length){ const r=pool[rnd(0,pool.length-1)]; S.relics.push(r); _nt.relic=r; addTags({rec:2}); } } }
  /* 부상 판정 */
  let dead=false, attacked=false;
  if(Math.random()<risk/100*0.85){ attacked=true;
    hurt(scout, rnd(12,20)+loc.risk*7); if(!scout.alive) dead=true; }
  scout.fatigue=clamp(scout.fatigue-CONFIG.scoutFatigue,0,100);
  _nt.attacked=attacked; _nt.dead=dead;
  const total=Object.values(found).reduce((a,b)=>a+b,0);
  if(total>CONFIG.bagCap){ _nt.take={...found}; nightHide(); paintBackpack(); }
  else { for(const k in found) S.res[k]+=found[k]; nightHide(); afterScavenge(); }
  if(_nt && _nt.before) setTimeout(()=>showOutcome("그 밤이 남긴 것", _nt.before), 300);
};

/* ---- 배낭(넘칠 때만) ---- */
function bagTotal(t){ let n=0; for(const k in t) n+=t[k]; return n; }
function paintBackpack(){
  const total=bagTotal(_nt.take), cap=CONFIG.bagCap;
  let h=`<div class="pad"><p><b>${_nt.scout.name}</b>${JP(_nt.scout.name,"이/가")} ${_nt.loc.name}에서 찾은 것들.
    한 번에 들 수 있는 건 <b style="color:var(--orange)">${cap}개</b>다.</p>
    <div class="capbar"><i style="width:${Math.min(100,total/cap*100)}%;${total>cap?'background:var(--danger)':''}"></i></div>
    <div class="hint" style="margin:0 0 10px">가져갈 양 <b style="color:${total>cap?'var(--danger)':'var(--ok)'}">${total} / ${cap}</b></div>
    <div class="lootlist">`;
  for(const k of Object.keys(_nt.found))
    h+=`<div class="loot">${resIcon(k,26)}<span class="nm">${RES[k][0]}</span>
      <button onclick="bagAdj('${k}',-1)">−</button>
      <span class="ct">${_nt.take[k]} / ${_nt.found[k]}</span>
      <button onclick="bagAdj('${k}',1)">+</button></div>`;
  h+=`</div><div class="rowbtns"><button class="btn-go" ${total>cap?'disabled':''}
      onclick="bagDone()">${total>cap?'다 들 수 없다':'집으로 ▸'}</button></div></div>`;
  showModal("무엇을 두고 갈 것인가",h);
}
window.bagAdj=function(k,d){ _nt.take[k]=clamp((_nt.take[k]||0)+d,0,_nt.found[k]); paintBackpack(); };
window.bagDone=function(){ for(const k in _nt.take) S.res[k]+=_nt.take[k];
  _nt.found=_nt.take; closeModal(); afterScavenge(); };

/* ---- 귀가 후: 침입 시네마틱 → 보고 ---- */
function afterScavenge(){
  const guardOk=S.guard>=0&&S.survivors[S.guard]&&S.survivors[S.guard].alive&&S.survivors[S.guard]!==_nt.scout;
  let raidP=0.14+S.day*0.025-S.build.barricade*0.14;
  if(S.scn==="vietnam") raidP += (S.sus.gov+S.sus.nlf)/500;
  if(Math.random()<raidP){
    const type=pickRaid(); const T=RAID_TYPES[type];
    let repelled=false, lost=[], deadName=null;
    if(guardOk){ repelled=Math.random()<(0.55+S.build.barricade*0.18);
      const g=S.survivors[S.guard];
      if(!repelled||Math.random()<0.4){ hurt(g,rnd(10,22)); if(!g.alive) deadName=g.name; } }
    if(!repelled){ const pool=Object.keys(RES).filter(k=>S.res[k]>0);
      for(let i=0;i<2&&pool.length;i++){ const k=pool.splice(rnd(0,pool.length-1),1)[0];
        const n=Math.min(S.res[k],rnd(1,3)); S.res[k]-=n; lost.push(`${RES[k][0]} ${n}`); } }
    _nt.raid={type,repelled,lost,guarded:guardOk,dead:deadName};
    S.choiceLog.push({day:S.day,tags:{},
      card:`${S.day}일차 · 밤에 ${T.label}${JP(T.label,"이/가")} 집에 들이닥쳤다.${repelled?" 막아냈다.":lost.length?" 물건을 빼앗겼다.":""}`});
    snd.knock(); shake();
    S.raid={type,phase:"approach",t0:performance.now(),repelled,lost,guarded:guardOk,dead:deadName};
    setTimeout(()=>{ if(S.raid){ S.raid.phase="clash"; snd.boom(false); shake(); } },1500);
    setTimeout(()=>{ if(S.raid) S.raid.phase="after"; },2900);
    setTimeout(()=>{ const r=S.raid; S.raid=null; showRaidResult(r); },4800);
  } else { nightReport(); }
}

/* 침입이 끝난 자리 — 무슨 일이 있었는지 그림으로 보여준다 */
function showRaidResult(r){
  if(!r){ nightReport(); return; }
  const key = r.dead ? "dead" : (r.repelled ? "repel" : "loot");
  const pic = (typeof RESULT_IMG!=="undefined" && RESULT_IMG[key]) || "";
  const head = r.dead ? "사람을 잃었다"
             : r.repelled ? "막아냈다 — 그러나 상처가 남았다"
             : "막을 사람이 없었다";
  const body = r.dead
      ? `${J(r.dead,"은/는")} 그 밤에 돌아오지 못했다. 문은 다시 닫혔지만, 이 집의 사람 수가 하나 줄었다.`
      : r.repelled
      ? `문은 버텼다. 널빤지가 몇 장 떨어져 나갔고 <b>다친 사람이 생겼다</b>.
         빼앗긴 것은 없다. 오늘 밤은 그것으로 됐다.`
      : `${r.lost&&r.lost.length ? `<b>${r.lost.join(", ")}</b>${JP(r.lost.join(", "),"을/를")} 빼앗겼다.` : "가진 것을 빼앗겼다."}
         현관에 사람을 세워 두었더라면 달랐을지도 모른다.`;
  const cls = r.dead ? "bad" : (r.repelled ? "ok" : "warn");
  showModal(`${S.day}일차 — 야간 침입`, `
    <div class="raidres ${cls}">
      ${pic?`<span class="rrpic" style="background-image:url('${pic}')"></span>`:""}
      <span class="rrveil"></span>
      <span class="rrhead">${head}</span>
    </div>
    <div class="pad"><p>${body}</p>
      <div class="rowbtns"><button class="btn-go" onclick="closeModal();nightReport()">계속 ▸</button></div>
    </div>`);
}
function nightReport(){
  const {loc,scout,found,attacked,dead,relic,raid}=_nt;
  const items=Object.keys(found||{}).filter(k=>found[k]>0).map(k=>
    `<span style="padding:4px 10px;border-radius:3px;background:#1a1d20;border:1px solid var(--line);
      display:inline-flex;align-items:center;gap:5px;margin:0 6px 6px 0">${resIcon(k,22)} ${RES[k][0]} ${found[k]}</span>`).join("");
  let head,body;
  if(dead){ head=`${J(scout.name,"이/가")} 돌아오지 못했다.`;
    body=`${loc.name}에서 무슨 일이 있었는지 아무도 모른다.`; }
  else if(attacked){ head="위험한 밤이었다.";
    body=`${J(scout.name,"이/가")} ${loc.name}에서 크게 다쳤다. 간신히 돌아왔다.`; }
  else { head="무사히 돌아왔다."; body=`${J(scout.name,"이/가")} ${loc.name}에서 돌아왔다.`; }
  let relicHtml="";
  if(relic){ relicHtml=`<div class="srcbox" style="border-left-color:var(--ok)">
    <span class="lbl">주 워 온 것 — ${relic.name}</span>${relic.tx}
    <span class="cite">— ${relic.cite}</span></div>`;
    notice("📜",relic.name,"기억 상자에 담았다","good"); }
  let raidHtml="";
  if(raid){ raidHtml = raid.repelled
    ? `<p style="color:var(--ok);border-top:1px solid var(--line);padding-top:10px">침입자를 막아냈다.</p>`
    : raid.lost.length
      ? `<p style="color:var(--danger);border-top:1px solid var(--line);padding-top:10px">
         지킬 사람이 없었다 — <b>${raid.lost.join(", ")}</b>${JP(raid.lost.join(", "),"을/를")} 빼앗겼다.</p>`
      : `<p style="color:var(--warn);border-top:1px solid var(--line);padding-top:10px">누군가 문을 흔들다 돌아갔다.</p>`; }
  showModal(`${S.day}일차 밤`, `<div class="pad">
    <p style="color:var(--orange);font-size:16px;font-weight:700;margin-bottom:10px">${head}</p>
    <div style="font-size:12px;color:var(--ink-dim);margin-bottom:6px">가지고 온 것</div>
    <div style="margin-bottom:12px">${items||'<span style="opacity:.5">없음</span>'}</div>
    <p>${body}</p>${relicHtml}${raidHtml}
    <div class="rowbtns"><button class="btn-go" onclick="closeModal();advanceDay()">날이 밝는다 ▸</button></div></div>`);
  _nt=null; refreshAll();
}

/* =========================================================================
   하루 진행
   ========================================================================= */
function showBanner(cb){
  const ph=phaseOf(S.day), b=document.getElementById("dayBanner");
  b.querySelector(".ddate").textContent=SC.dates[S.day-1]||"";
  b.querySelector(".dnum").textContent=S.day+"일차";
  b.querySelector(".dph").textContent=ph.name;
  const note=(SC.dayNotes||[])[S.day-1]||"";
  b.querySelector(".dnote").textContent=note;
  b.querySelector(".dnote").style.display=note?"block":"none";
  b.style.display="flex"; requestAnimationFrame(()=>b.classList.add("show"));
  setTimeout(()=>{ b.classList.remove("show");
    setTimeout(()=>{ b.style.display="none"; cb&&cb(); },430); }, note?2200:1500);
}
function startDay(){ showBanner(morningTick); }
window.advanceDay=function(){
  if(S.allDead){ endAct1(); return; }
  S.day++; if(S.day>CONFIG.totalDays){ endAct1(); return; }
  startDay();
};
function morningTick(){
  const ph=phaseOf(S.day);
  S.temp=rnd(ph.temp[0],ph.temp[1]);
  if(S.build.rain){ S.res.water+=3; }
  S.heated=false;
  if(S.scn==="leningrad"){
    const need=S.temp<=-20?2:1;
    if(S.temp<2&&S.build.stove&&S.res.fuel>=need){ S.res.fuel-=need; S.heated=true; }
  } else { S.heated=true; }
  const cold=(S.scn==="leningrad"&&S.temp<0&&!S.heated);
  if(cold){ log(`영하 ${Math.abs(S.temp)}도. 난방이 없다.`,"bad"); snd.wind(); }
  const hDrain = ph.id===1?26:33;
  for(const s of S.survivors){ if(!s.alive) continue;
    s.hunger=clamp(s.hunger-hDrain,0,100);
    s.fatigue=clamp(s.fatigue-22,0,100);
    if(s.hunger<=0){ s.health=clamp(s.health-CONFIG.starveHealth,0,100);
      log(`${J(s.name,"이/가")} 굶고 있다.`,"bad"); }
    if(s.fatigue<=0) s.mental=clamp(s.mental-CONFIG.exhaustMental,0,100);
    if(cold){ const r=s.trait==="체력"?0.6:1;
      s.health=clamp(s.health-8*r,0,100); s.mental=clamp(s.mental-5,0,100); }
    if(s.health<=0) kill(s);
    if(s.anim==="sleep") s.anim="idle";
  }
  S.actions=CONFIG.actionsPerDay; S.guard=-1; S.hideReady=false;
  if(S.allDead){ refreshAll(); setTimeout(endAct1,900); return; }
  /* NPC 생사 — 수색이 나도 건너뛰지 않도록 먼저 판정한다 */
  if(S.day===10) npcOutcome();
  /* 굴뚝 연기가 쌓이면 폭격이 온다 (6·25) */
  if(S.scn==="korea"){
    S.sus.smoke = clamp(S.sus.smoke-5,0,100);
    if(S.day>=3 && S.sus.smoke>=48){ refreshAll(); return smokeStrike(); }
  }
  /* 의심이 높으면 낮 수색이 온다 */
  if(SC.sweep && S.day>=3 && (S.sus.gov>=40||S.sus.nlf>=40)){
    refreshAll(); return daySweep();
  }
  refreshAll(); runEvent();
}
function daySweep(){
  const gov=S.sus.gov>=S.sus.nlf;
  const who=gov?SC.sweep.gov:SC.sweep.nlf;
  const safe=S.build.hide;
  snd.knock(); shake();
  let h=`<div class="evimg"><img src="${EVIMG[gov?SC.sweep.imgGov:SC.sweep.imgNlf]}" alt="">
    <div class="quote">“어느 쪽에도 완전히 속하지 못하면, 양쪽 모두에게 의심받는다.”<small>— 베트남 농촌 주민 증언</small></div></div>
    <div class="pad"><p><b style="color:var(--danger)">${who}${JP(who,"이/가")} 다시 찾아왔다.</b><br>
    지난번 대답을 기억하고 있다. 이번에는 그냥 넘어가지 않을 기세다.</p>
    <div class="choices">`;
  if(safe) h+=`<button onclick="sweepPick('hide')">땅굴로 내려가 숨는다</button>`;
  h+=`<button onclick="sweepPick('face')">마당에 나가 마주한다</button>
      <button onclick="sweepPick('give')">가진 것을 내주고 무마한다</button>
    </div></div>`;
  showModal(`${S.day}일차 — 의심`,h);
}
window.sweepPick=function(k){
  const _b=snapState();
  if(k==="hide"){ S.sus.gov=clamp(S.sus.gov+10,0,100);
    log("땅굴에 숨어 넘겼다. 집이 뒤집혔다.","bad");
    for(const key in RES){ if(S.res[key]>0&&Math.random()<0.4) S.res[key]=Math.max(0,S.res[key]-1); } }
  else if(k==="face"){ const s=randAlive(); if(s&&Math.random()<0.55){ hurt(s,rnd(14,26));
      log(`${J(s.name,"이/가")} 끌려나가 맞았다.`,"bad"); }
    S.sus.gov=clamp(S.sus.gov-25,0,100); S.sus.nlf=clamp(S.sus.nlf-10,0,100); }
  else { S.res.food=Math.max(0,S.res.food-3); S.res.valuables=Math.max(0,S.res.valuables-1);
    S.sus.gov=clamp(S.sus.gov-30,0,100); S.sus.nlf=clamp(S.sus.nlf-20,0,100);
    log("가진 것을 내주고 넘겼다.","bad"); }
  S.choiceLog.push({day:S.day,tags:{sur:1},card:`${S.day}일차 · 의심을 받아 집이 수색당했다.`});
  closeModal(); refreshAll(); showOutcome("수색이 남긴 것", _b); runEvent();
};
/* 굴뚝 연기를 보고 비행기가 왔다 — 교과서 증언에서 온 장면 */
function smokeStrike(){
  snd.boom(false); shake();
  const inShelter = S.build.hide;
  const s = randAlive();
  if(s) hurt(s, inShelter ? rnd(4,10) : rnd(14,28));
  let lost=[];
  for(const k in RES){ if(S.res[k]>0 && Math.random()<(inShelter?0.25:0.5)){
    S.res[k]=Math.max(0,S.res[k]-1); lost.push(RES[k][0]); } }
  S.sus.smoke = clamp(S.sus.smoke-50,0,100);
  S.choiceLog.push({day:S.day,tags:{},card:`${S.day}일차 · 굴뚝 연기를 보고 비행기가 왔다.`});
  showModal(`${S.day}일차 — 폭격`, `<div class="evimg"><img src="${EVIMG.kr05}" alt="">
    <div class="quote">“굴뚝에서 연기가 날 때마다 폭격하는 것 같더라.”<small>— 교과서 자료 · 폭격의 트라우마</small></div></div>
    <div class="pad"><p><b style="color:var(--danger)">비행기가 낮게 지나갔다.</b><br>
    폭탄은 강 건너 다리가 아니라 마을 뒤편에 떨어졌다.
    ${inShelter?"방공호로 뛰어든 덕에 크게 다친 사람은 없었다.":"미처 피하지 못했다."}
    ${lost.length?`<br>${lost.join(", ")}${JP(lost.join(", "),"을/를")} 잃었다.`:""}</p>
    <div class="srcbox"><span class="lbl">사 료</span>
      미 공군은 특정 지역을 '초토화'하는 정책으로 전환한 뒤 마을과 민가를 사실상 군사 목표로 간주했다.
      연기가 오르는 집은 사람이 있는 집이었고, 사람이 있는 집은 표적이 되었다.
      <span class="cite">— 교과서 주제 02 「초토화 작전」</span></div>
    <div class="rowbtns"><button class="btn-go" onclick="closeModal();runEvent()">계속 ▸</button></div></div>`);
  refreshAll();
}
function npcOutcome(){
  (SC.npc||[]).forEach(n=>{
    const st=S.npc[n.id]; if(!st) return;
    if(st.bond>=4){ st.alive=true;
      S.choiceLog.push({day:S.day,tags:{sol:1},card:`10일차 · ${J(n.name,"은/는")} 아직 살아 있다. 우리가 나눈 것이 헛되지 않았다.`}); }
    else { st.alive=false;
      S.choiceLog.push({day:S.day,tags:{sil:1},card:`10일차 · ${n.died}`});
      log(n.died,"bad"); }
  });
  const dead=(SC.npc||[]).filter(n=>!S.npc[n.id].alive);
  if(dead.length) notice("🕯", dead.map(n=>n.name).join(", "), "더는 보이지 않는다", "bad");
}

/* =========================================================================
   UI 갱신
   ========================================================================= */
function refreshAll(){ refreshHUD(); refreshCrew(); refreshRes(); updateCoach(); bgSig=""; }
function refreshHUD(){
  const ph=phaseOf(S.day);
  document.getElementById("hDay").textContent=S.day;
  document.getElementById("hDate").textContent=SC.dates[S.day-1]||"";
  const t=document.getElementById("hTemp");
  t.textContent=(S.temp>=0?"+":"")+S.temp+"°C";
  t.style.color=S.scn==="vietnam"?"#d2a04a":(S.heated?"#e0772a":(S.temp<2?"#5f8a93":"#c9a25f"));
  document.getElementById("hAct").textContent=S.actions;
  const p=document.getElementById("phasePill"); p.textContent=ph.name; p.className=ph.cls;
  /* 시나리오 계기판 */
  let m=document.getElementById("hMeters");
  if(!m){ m=document.createElement("div"); m.id="hMeters";
    m.style.cssText="display:flex;gap:14px;align-items:center;margin-left:6px;padding-left:14px;border-left:1px solid var(--line)";
    document.getElementById("phasePill").after(m); }
  if(SC.meters){
    m.innerHTML=SC.meters.map(x=>{
      const v=clamp(S.sus[x.key],0,100);
      return `<div style="display:flex;flex-direction:column;gap:3px">
        <span style="font-size:9.5px;letter-spacing:.5px;color:var(--ink-dim)">${x.label}</span>
        <span style="display:block;width:96px;height:7px;background:#22262a;border-radius:4px;overflow:hidden">
          <i style="display:block;height:100%;width:${v}%;background:${x.color};transition:width .4s"></i></span>
      </div>`; }).join("");
  } else {
    const g=SC.meter.series[S.day-1];
    m.innerHTML=`<div class="stat big"><span class="sic" style="background-image:url('${hudIcon("ration")}')"></span>
      <span class="stx"><b style="color:${g<=125?'var(--danger)':'#d2a04a'}">${g}g</b>
      <em>${SC.meter.label}</em></span></div>`;
  }
  paintBigStat();
}
function hudIcon(k){ return (typeof HUD_IMG!=="undefined" && HUD_IMG[k]) || ""; }
/* 기온·남은 행동을 늘 크게 띄운다 */
function paintBigStat(){
  let b=document.getElementById("bigStat");
  if(!b){ b=document.createElement("div"); b.id="bigStat";
    document.getElementById("hMeters").after(b); }
  const t=S.temp, cold=(S.scn==="leningrad"&&t<0);
  b.innerHTML=`
    <div class="stat"><span class="sic" style="background-image:url('${hudIcon("temp")}')"></span>
      <span class="stx"><b style="color:${cold?'#7fb3d5':'var(--ink)'}">${t>0?"+":""}${t}°C</b><em>기온</em></span></div>
    <div class="stat"><span class="sic" style="background-image:url('${hudIcon("act")}')"></span>
      <span class="stx"><b style="color:${S.actions<=0?'var(--danger)':'var(--warn)'}">${S.actions}</b><em>남은 행동</em></span>
      <span class="pips">${"●".repeat(Math.max(0,S.actions))+"○".repeat(Math.max(0,CONFIG.actionsPerDay-S.actions))}</span></div>`;
}
function refreshRes(){
  document.getElementById("res").innerHTML=Object.keys(RES).map(k=>
    `<div class="ritem ${S.res[k]<=1?'low':''}">${resIcon(k,30)}
      <span style="color:var(--ink-dim)">${RES[k][0]}</span> <b>${S.res[k]}</b></div>`).join("");
}
function updateCoach(){
  const m=document.querySelector("#coach .msg"), th=document.getElementById("tapHint");
  if(!m) return;
  if(S.over){ m.textContent="—"; return; }
  if(S.actions>0){
    const s=S.survivors[S.selected];
    m.innerHTML= (s&&s.alive)
      ? `<b>${s.name}</b> 선택됨 — 화면의 <b>방</b>을 클릭해 행동하세요. 남은 행동 <b>${S.actions}</b>회`
      : `아래 <b>인물 카드</b>를 눌러 사람을 고르세요.`;
  } else m.innerHTML=`오늘 할 일을 다 했습니다. 오른쪽 <b>밤이 온다</b>를 누르세요.`;
  if(th){ th.style.display=(S.day<=1&&S.actions===CONFIG.actionsPerDay)?"block":"none"; }
}
