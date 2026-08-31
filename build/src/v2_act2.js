
/* =========================================================================
   시나리오 보강 — 고갈 배수 · 유물 · 종료 카운터
   ========================================================================= */
LENINGRAD.lootScale={1:1.0,2:0.65,3:0.5};
VIETNAM.lootScale ={1:1.0,2:0.75,3:0.55};
LENINGRAD.counter={ big:872, unit:"일", lead:"레닌그라드 시민들은", tail:"을 버텼습니다." };
VIETNAM.counter  ={ big:3680, unit:"일", lead:"이 전쟁은", tail:"동안 이어졌습니다." };
LENINGRAD.relics=[
  {id:"card", name:"빵 배급표", tx:"한 달치 배급표. 잃어버리면 그달은 끝이다. 도둑맞거나 태워 없어진 배급표 때문에 목숨을 잃은 사람이 많았다.", cite:"레닌그라드 배급 제도"},
  {id:"note", name:"포격 경고 문구", tx:"거리 벽에 페인트로 쓰인 '포격 시 이쪽이 더 위험함' 표시. 일부는 오늘날까지 보존되어 있다.", cite:"상트페테르부르크 시내 보존 표지"},
  {id:"draw", name:"아이가 그린 그림", tx:"굶주린 아이들이 그린 그림에는 음식이 자주 등장했다. 그리지 못한 것을 그림으로 그렸다.", cite:"봉쇄 박물관 소장 자료"},
];
VIETNAM.relics=[
  {id:"leaflet", name:"하늘에서 뿌려진 전단", tx:"항복과 귀순을 권하는 전단이 수억 장 살포됐다. 글을 못 읽는 농민을 위해 그림으로 그려진 것도 많았다.", cite:"심리전 전단 살포"},
  {id:"can", name:"찌그러진 전투식량 깡통", tx:"미군 전투식량 깡통은 농촌에서 그릇과 등잔으로 다시 쓰였다. 전쟁의 물건은 생활의 물건이 되었다.", cite:"베트남 농촌의 전시 생활"},
  {id:"roster", name:"마을 명부", tx:"마을 사람들의 이름과 나이가 적힌 종이. 훗날 누가 사라졌는지 확인할 수 있는 거의 유일한 기록이 되었다.", cite:"베트남 중부 마을 기록"},
];

/* =========================================================================
   1막 종료 — 카운터
   ========================================================================= */
function endAct1(){
  if(S.over) return; S.over=true; renderOn=false;
  closeModal(); nightHide();
  const held=S.allDead?S.day:CONFIG.totalDays;
  const C=SC.counter, el=document.getElementById("counter");
  el.innerHTML=`<div class="c1">당신은</div>
    <div class="c2">${held}일을 버텼습니다.</div>
    <div class="c3">${C.lead}</div>
    <div class="cbig" id="cnum">0</div>
    <div class="c3">${C.tail}</div>
    <div class="c4" id="cfact" style="opacity:0"></div>
    <button class="btn-go" id="cbtn">그리고 그 후 ▸</button>`;
  el.style.display="flex";
  const num=document.getElementById("cnum"), t0=performance.now(), dur=2600;
  (function tick(){
    const p=Math.min(1,(performance.now()-t0)/dur), e=1-Math.pow(1-p,3);
    num.textContent=Math.round(e*C.big).toLocaleString();
    if(p<1) requestAnimationFrame(tick);
    else { const f=document.getElementById("cfact");
      f.innerHTML=SC.endFact; f.style.transition="opacity 1s"; f.style.opacity="1";
      snd.beat(); setTimeout(()=>document.getElementById("cbtn").classList.add("show"),700); }
  })();
  document.getElementById("cbtn").onclick=()=>{ snd.click();
    el.style.display="none"; document.getElementById("wrap").style.display="none"; act2Start(); };
}

/* =========================================================================
   2막
   ========================================================================= */
const A2=document.getElementById("act2"), A2B=document.getElementById("a2body");
function showAct2(h){ A2.style.display="block"; A2B.innerHTML=h; A2.scrollTop=0; window.scrollTo(0,0);
  narrStop(); }
function act2Start(){
  const A=SC.act2, dead=S.survivors.filter(s=>!s.alive);
  const intro=S.allDead?A.introDead:
    A.intro+(dead.length?`<br><br>${dead.map(s=>s.name).join(", ")}${JP(dead[dead.length-1].name,"은/는")} 그러지 못했다.`:"");
  showAct2(`<div class="a2door">제 2 막 · ${A.year}</div>
    <h1 class="a2title">${A.openTitle}</h1>
    <div class="a2scene">${intro}<br><br><em>전쟁은 끝났다. 과거사는 이제 시작이다.</em></div>
    <div class="rowbtns"><button class="btn-go" onclick="door1()">첫 번째 문을 연다 ▸</button></div>`);
}
/* ---- 문 ① 구술 채록 ---- */
/* 조사관이 한 번에 하나씩 묻는다. 답한 것만 조서에 타이핑되어 쌓인다. */
const ORAL_Q = [
  "그해 이야기부터 들려주시겠습니까. 무엇이 먼저 떠오르십니까?",
  "그다음에는 어떻게 되었습니까?",
  "그때 그 자리에 누가 함께 있었습니까?",
  "그 일은 직접 보신 겁니까, 나중에 들으신 겁니까?",
  "이 이야기를 그동안 누구에게 하신 적이 있습니까?",
  "마지막으로, 꼭 기록에 남기고 싶은 것이 있습니까?",
];
let _cards=[], _sel=[], _qi=0, _tape=null, _tapeT=0, _typing=false;

function buildCards(){
  let pool=S.choiceLog.slice();
  if(pool.length>6){ const step=pool.length/6, p=[];
    for(let i=0;i<6;i++) p.push(pool[Math.floor(i*step)]); pool=p; }
  while(pool.length<6) pool.push({day:0,tags:{},card:"기억나지 않는 날들이 있다."});
  const blurN=S.tags.sil>=10?2:(S.tags.sil>=6?1:0);
  const order=pool.map((c,i)=>({i,w:(c.tags&&Object.keys(c.tags).length)||0})).sort((a,b)=>a.w-b.w);
  const blurred=new Set(order.slice(0,blurN).map(o=>o.i));
  _cards=pool.map((c,i)=>({day:c.day,text:c.card,tags:c.tags||{},blur:blurred.has(i),
    said:null,
    evidence:(S.evidence&&(c.day===10||c.day===11))?EVIDENCE_NAME[S.evidence]:null}));
  _sel=[]; _qi=0;
}
window.door1=function(){ buildCards(); paintOral(); startTape(); };

function startTape(){
  _tapeT=0; stopTape();
  _tape=setInterval(()=>{ _tapeT++;
    const el=document.getElementById("tapeClock");
    if(!el){ stopTape(); return; }
    const m=String(Math.floor(_tapeT/60)).padStart(2,"0"), s=String(_tapeT%60).padStart(2,"0");
    el.textContent="00:"+m+":"+s;
  },1000);
}
function stopTape(){ if(_tape){ clearInterval(_tape); _tape=null; } }

function oralImg(){
  const p=(typeof SCN_PFX!=="undefined"&&SCN_PFX[S.scn])||"ln";
  return (typeof ORAL_IMG!=="undefined" && ORAL_IMG[p]) || "";
}
/* 조서에 이미 적힌 줄 */
function ledgerLines(){
  let h="";
  _sel.forEach((idx,n)=>{
    const c=_cards[idx];
    h+=`<div class="olrow"><span class="oln">${n+1}</span>
      <span class="olt">${c.text}${c.evidence&&c.usedEv?` <b class="olev">📎 ${c.evidence}</b>`:""}
      ${c.blur?` <i class="olblur">— 확실하지는 않습니다</i>`:""}</span></div>`;
  });
  for(let n=_sel.length;n<3;n++)
    h+=`<div class="olrow empty"><span class="oln">${n+1}</span><span class="olt"></span></div>`;
  return h;
}
function paintOral(){
  const A=SC.act2.d1, full=(_sel.length>=3), done=(_qi>=_cards.length)||full;
  const c=_cards[Math.min(_qi,_cards.length-1)];
  const ev = S.evidence
    ? `<p class="ohint ok">▸ <b>${EVIDENCE_NAME[S.evidence]}</b>${JP(EVIDENCE_NAME[S.evidence],"이/가")} 남아 있다. 물증을 붙인 증언은 훨씬 강하다.</p>`
    : `<p class="ohint bad">▸ 남겨둔 기록이 없다. 확인할 방법이 없다.</p>`;

  let ask="";
  if(!done){
    ask = `<div class="oq"><span class="oqw">조사관</span>
        <p>“${ORAL_Q[_qi % ORAL_Q.length]}”</p></div>
      <div class="omem ${c.blur?'blur':''}">
        <span class="omd">${c.day?c.day+"일차의 기억":"기억 없음"}</span>
        <span class="omt">${c.text}</span>
        ${c.blur?`<span class="omflag">그때 똑바로 보지 않았다 — 기억이 흐리다</span>`:""}
      </div>
      <div class="oacts">
        <button class="btn-go" onclick="oralSay(false)">그대로 말한다</button>
        ${c.evidence?`<button class="btn-ev" onclick="oralSay(true)">📎 ${c.evidence}를 함께 내민다</button>`:""}
        <button class="btn-quiet" onclick="oralSkip()">말하지 않는다</button>
      </div>`;
  } else {
    ask = `<div class="oq"><span class="oqw">조사관</span>
        <p>“${full?"세 가지면 충분합니다. 여기 서명해 주시겠습니까.":"더 기억나시는 게 없으시면, 여기까지 하겠습니다."}”</p></div>
      <div class="oacts"><button class="btn-go" onclick="submitTestimony()">진술서에 서명한다 ▸</button></div>`;
  }

  showAct2(`<div class="a2door">문 ①</div><h1 class="a2title">${A.title}</h1>
    <p class="a2sub">${A.sub}</p>
    <div class="oralwrap">
      <div class="ocol">
        <div class="oscene" style="background-image:url('${oralImg()}')">
          <div class="orec"><span class="dot"></span>REC <b id="tapeClock">00:00:00</b>
            <span class="reel"></span><span class="reel r2"></span>
            <span class="lvl"><i></i><i></i><i></i><i></i><i></i></span></div>
        </div>
        <div class="a2scene">${A.scene}</div>${ev}
        ${ask}
      </div>
      <div class="ocol">
        <div class="ledger">
          <div class="ldh">조 서<span>구술 채록 · ${SC.act2.year}</span></div>
          <div class="ldbody" id="ldBody">${ledgerLines()}</div>
          <div class="ldsign">진술인 서명 ______________</div>
        </div>
        <div class="selcount">기록 ${_sel.length} / 3</div>
      </div>
    </div>`);
}
/* 말하면 조서에 한 글자씩 타이핑된다.
   타이핑 도중에 다음을 누르면 기다리게 하지 않고 즉시 끝낸다. */
let _typeEnd=null;
function typeInto(el, text, done){
  _typing=true; el.textContent=""; let i=0;
  const rec=document.querySelector(".orec");
  if(rec) rec.classList.add("hot");
  const finish=()=>{ _typing=false; _typeEnd=null;
    el.textContent=text; if(rec) rec.classList.remove("hot"); done&&done(); };
  _typeEnd=finish;
  (function step(){
    if(!_typing) return;                      /* 이미 건너뛰었다 */
    el.textContent = text.slice(0, ++i);
    if(i < text.length) setTimeout(step, 18);
    else finish();
  })();
}
function flushType(){ if(_typeEnd) _typeEnd(); }
window.oralSay=function(withEv){
  flushType();
  if(_sel.length>=3) return;
  const idx=Math.min(_qi,_cards.length-1), c=_cards[idx];
  c.said=true; c.usedEv=!!withEv; _sel.push(idx); _qi++;
  snd.click();
  paintOral();
  const rows=document.querySelectorAll("#ldBody .olrow");
  const row=rows[_sel.length-1];
  if(row){ const t=row.querySelector(".olt"); const html=t.innerHTML;
    typeInto(t, t.textContent.trim(), ()=>{ t.innerHTML=html; }); }
};
window.oralSkip=function(){
  flushType();
  const idx=Math.min(_qi,_cards.length-1);
  _cards[idx].said=false; _qi++; snd.click();
  paintOral();
};
window.submitTestimony=function(){
  flushType(); stopTape();
  const A=SC.act2.d1;
  const sub=_sel.map(i=>_cards[i]), wit=_cards.filter((c,i)=>!_sel.includes(i));
  let sc=1;
  if(S.evidence) sc++; if(S.tags.rec>=8) sc++;
  if(!sub.some(c=>c.blur)) sc++;
  const confessed=sub.some(c=>c.tags&&c.tags.sil); if(confessed) sc++;
  if(S.relics.length>=2) sc++;
  S.act2.score=clamp(sc,1,5);
  S.act2.submitted=sub.map(c=>c.text); S.act2.withheld=wit.map(c=>c.text);
  const stars="●".repeat(S.act2.score)+"○".repeat(5-S.act2.score);
  const react = S.act2.score>=4
    ? "조사관이 오래 받아 적는다. “이건 기록으로 남길 수 있겠습니다. 재판에서 인용될 수도 있어요.”"
    : S.act2.score>=3 ? "고개를 끄덕이며 적는다. “도움이 됩니다. 뒷받침할 자료가 있으면 더 좋겠군요.”"
    : "잠시 펜을 멈춘다. “확인할 방법이 없군요. 기억만으로는… 다투기 어렵습니다.”";
  showAct2(`<div class="a2door">문 ① — 결과</div><h1 class="a2title">진술서</h1>
    <div class="ledger signed">
      <div class="ldh">조 서<span>구술 채록 · ${SC.act2.year}</span></div>
      <div class="ldbody">${sub.map((c,n)=>`<div class="olrow"><span class="oln">${n+1}</span>
        <span class="olt">${c.text}${c.usedEv&&c.evidence?` <b class="olev">📎 ${c.evidence}</b>`:""}</span></div>`).join("")}</div>
      <div class="ldsign">진술인 서명 <b>———</b> · 녹음 ${Math.floor(_tapeT/60)}분 ${_tapeT%60}초</div>
    </div>
    <div class="a2scene">
      <div class="wlbl">내가 말하지 않은 것</div>
      <ul class="wlist">${wit.map(c=>`<li>${c.text}</li>`).join("")}</ul></div>
    <div class="a2scene"><b style="color:var(--warn)">증언의 무게 ${stars}</b><br><br>${react}
      ${confessed?`<p style="color:var(--warn);margin-top:12px">말하기 부끄러운 기억도 함께 진술했다. 진술의 무게는 올라갔지만, 그날 밤 오래 잠들지 못했다.</p>`:""}</div>
    <div class="srcbox"><span class="lbl">그 뒤 에 일 어 난 일</span>${A.after}<span class="cite">— ${A.cite}</span></div>
    <div class="rowbtns"><button class="btn-go" onclick="door2()">두 번째 문 ▸</button></div>`);
};
/* ---- 문 ② 책임 ---- */
/* 2막 그림 */
function defImg(id){ return (typeof DEF_IMG!=="undefined" && DEF_IMG[S.scn+"_"+id]) || ""; }
function memImg(id){ return (typeof MEM_IMG!=="undefined" && MEM_IMG[S.scn+"_"+id]) || ""; }

let _blame=[];
window.door2=function(){ _blame=[]; paintDoor2(); };
function paintDoor2(){
  const D=SC.act2.defendants;
  const cards=D.map(d=>{ const at=_blame.indexOf(d.id); const u=defImg(d.id);
    return `<div class="defcard ${at>=0?'picked':''}" onclick="pickBlame('${d.id}')">
      ${u?`<span class="dpic" style="background-image:url('${u}')"></span>`:""}
      <span class="dsh"></span>
      ${at>=0?`<span class="rank">${at+1}</span>`:""}
      <span class="dtx"><b>${d.name}</b><span class="dd">${d.dd}</span></span></div>`; }).join("");
  showAct2(`<div class="a2door">문 ②</div><h1 class="a2title">책임 — 누구의 죄인가</h1>
    <p class="a2sub">피고석이 네 개 있다. 가장 무겁게 책임을 물어야 할 순서대로 누르세요.</p>
    <div class="a2scene"><em>정답은 없습니다. 당신의 순서를 정한 뒤, 역사가 실제로 어떻게 답했는지 보게 됩니다.</em></div>
    <div class="defgrid">${cards}</div>
    <div class="selcount">순위 ${_blame.length} / 4 <span style="font-weight:400;color:var(--ink-dim)">(다시 누르면 취소)</span></div>
    <div class="rowbtns"><button class="btn-go" ${_blame.length===4?'':'disabled'} onclick="submitBlame()">진술한다 ▸</button></div>`);
}
window.pickBlame=function(id){ const at=_blame.indexOf(id);
  if(at>=0) _blame.splice(at,1); else _blame.push(id); snd.click(); paintDoor2(); };
window.submitBlame=function(){
  S.act2.blameOrder=_blame.slice();
  const boxes=_blame.map((id,i)=>{ const d=SC.act2.defendants.find(x=>x.id===id); const u=defImg(id);
    return `<div class="verdictbox haspic">
      ${u?`<span class="vpic" style="background-image:url('${u}')"></span>`:""}
      <span class="vtx"><b>${d.name}<span class="myrank">내가 매긴 순위 ${i+1}위</span></b>${d.verdict}</span></div>`; }).join("");
  showAct2(`<div class="a2door">문 ② — 역사의 답</div><h1 class="a2title">판결</h1>
    <p class="a2sub">당신이 매긴 순서 옆에, 실제로 무슨 일이 있었는지 나란히 놓습니다.</p>${boxes}
    <div class="srcbox"><span class="lbl">생 각 해 볼 것</span>
      책임에는 <b>층위</b>가 있습니다. 가장 가까이서 방아쇠를 당긴 손은 대개 가장 적게 처벌됐고,
      가장 멀리 있던 결정권자에게 책임을 묻기까지는 수십 년이 걸렸으며,
      아무것도 하지 않은 쪽에는 법이 닿지 않았습니다.
      <b>처벌되지 않은 책임은 사라지는가?</b></div>
    <div class="rowbtns"><button class="btn-go" onclick="door3()">세 번째 문 ▸</button></div>`);
};
/* ---- 문 ③ 기억 ---- */
window.door3=function(){
  const D=SC.act2.d3, solHigh=(S.tags.sol>=8||S.tags.rec>=8);
  const opts=`<div class="memgrid">`+D.options.map(o=>{
    const boost=(o.id==="C"&&solHigh&&o.resSol), u=memImg(o.id);
    return `<button class="memcardx ${boost?'unlocked':''}" onclick="pickMemorial('${o.id}')">
      ${u?`<span class="mpic" style="background-image:url('${u}')"></span>`:""}
      <span class="msh"></span>
      <span class="mtx"><b>${o.x}</b>${boost?'<i>당신에게는 적어둔 것이 있다</i>':''}</span>
    </button>`; }).join("")+`</div>`;
  showAct2(`<div class="a2door">문 ③</div><h1 class="a2title">${D.title}</h1>
    <p class="a2sub">${D.sub}</p><div class="a2scene">${D.scene}</div>
    <div style="margin-top:14px">${opts}</div>`);
};
window.pickMemorial=function(id){
  const D=SC.act2.d3, o=D.options.find(x=>x.id===id);
  S.act2.memorial=id;
  const solHigh=(S.tags.sol>=8||S.tags.rec>=8);
  const res=(id==="C"&&solHigh&&o.resSol)?o.resSol:o.res;
  const mu=memImg(id);
  showAct2(`<div class="a2door">문 ③ — 그 후</div><h1 class="a2title">${o.x}</h1>
    ${mu?`<div class="memhero" style="background-image:url('${mu}')"></div>`:""}
    <div class="a2scene">${res}</div>
    <div class="srcbox"><span class="lbl">실 제 로 는</span>${o.src.tx}<span class="cite">— ${o.src.cite}</span></div>
    <div class="srcbox" style="border-left-color:var(--ok)"><span class="lbl">생 각 해 볼 것</span>${D.lesson}</div>
    <div class="rowbtns"><button class="btn-go" onclick="showRecord()">나의 기록 ▸</button></div>`);
};
/* ---- 엔딩 카드 ---- */
function topTag(){ let b="sur",v=-1; for(const k of ["sol","rec","sur","sil"]) if(S.tags[k]>v){v=S.tags[k];b=k;} return b; }
function makeCode(){
  const tm={sol:"Y",rec:"G",sur:"S",sil:"C"}, r=S.sourcesRead.length;
  const c3=r<10?String(r):String.fromCharCode(65+(r-10));
  const c5=String(SC.act2.defendants.findIndex(d=>d.id===S.act2.blameOrder[0])+1);
  const sc={leningrad:"L",korea:"K",vietnam:"V"}[S.scn]||"X";
  return `${sc}${alives().length}${tm[topTag()]}${c3}${S.act2.score}${c5}${S.act2.memorial}`;
}
function tagBar(k){ const mx=Math.max(8,S.tags.sol,S.tags.rec,S.tags.sur,S.tags.sil);
  return `<div class="tagbar"><span class="tn">${TAGNAME[k]}</span>
    <span class="tb"><i class="${k==='sil'?'hi':''}" style="width:${Math.round(S.tags[k]/mx*100)}%"></i></span></div>`; }
window.showRecord=function(){
  const alive=alives(), dead=S.survivors.filter(s=>!s.alive);
  const held=S.allDead?S.day:CONFIG.totalDays;
  const blame=S.act2.blameOrder.map((id,i)=>`${i+1} ${SC.act2.defendants.find(d=>d.id===id).name}`).join(" · ");
  const mem=SC.act2.d3.options.find(o=>o.id===S.act2.memorial);
  const row=(n,f,gone)=>`<div class="lrow ${gone?'gone':''}"><span class="ln">${n}</span><span class="lf">${f}</span></div>`;
  let fam="";
  S.survivors.forEach(s=>{ fam += s.alive
    ? row(s.name, "살아남았다", false)
    : row(s.name, `${SC.dates[Math.min(S.day,12)-1]||""} 돌아오지 못했다`, true); });
  let nb="";
  (SC.npc||[]).forEach(n=>{ const st=S.npc[n.id];
    nb += st.alive ? row(n.name, "아직 살아 있다", false) : row(n.name, n.died, true); });

  showAct2(`
    <div id="ledger">
      <div class="lhan">名 簿</div>
      <h3>명 부</h3>
      <div class="lsub">${SC.title} · ${SC.sub}</div>

      <div class="lsect">이 름 이 불 린 사 람 들 — 우 리 식 구</div>${fam}
      <div class="lsect">이 웃</div>${nb || '<div class="lrow"><span class="lf">기록해 둔 이웃이 없다.</span></div>'}

      <div class="lsect">내 가 증 언 한 것</div>
      <ul>${S.act2.submitted.map(t=>`<li>${t}</li>`).join("")}</ul>
      <div class="lsect">내 가 말 하 지 않 은 것</div>
      <ul class="sil">${S.act2.withheld.map(t=>`<li>${t}</li>`).join("")}</ul>

      <div class="lsect">기 록</div>
      <div class="lrow"><span class="ln">버틴 날</span><span class="lf">${held}일 &nbsp;/&nbsp; ${SC.counter.big.toLocaleString()}${SC.counter.unit}</span></div>
      <div class="lrow"><span class="ln">읽은 사료</span><span class="lf">12개 중 ${S.sourcesRead.length}개</span></div>
      <div class="lrow"><span class="ln">남긴 기록</span><span class="lf">${S.evidence?EVIDENCE_NAME[S.evidence]:"없음 — 확인할 방법이 없다"}</span></div>
      <div class="lrow"><span class="ln">주워 온 것</span><span class="lf">${S.relics.length?S.relics.map(r=>r.name).join(", "):"없음"}</span></div>
      <div class="lrow"><span class="ln">내가 매긴 책임</span><span class="lf">${blame}</span></div>
      <div class="lrow"><span class="ln">내가 고른 기억</span><span class="lf">${mem?mem.x:"—"}</span></div>

      <div class="lsect">나 의 길</div>
      <div class="tagbars">${tagBar("sol")}${tagBar("rec")}${tagBar("sur")}${tagBar("sil")}</div>

      <div class="closing">
        <b>명부는 사람을 죽이는 데도 쓰였고,<br>사람을 기억하는 데도 쓰였습니다.</b><br>
        같은 종이, 같은 이름, 다른 손.
      </div>

      <div class="codebox">${makeCode()}</div>
      <div class="codelbl">나의 명부 코드 — 선생님이 안내하는 곳에 입력하세요</div>
    </div>

    <div class="qbox"><div class="qh">토 론 질 문</div>
      <ol>${SC.act2.questions.map(q=>`<li>${q}</li>`).join("")}</ol></div>

    <div class="rowbtns">
      <button onclick="window.print()">인쇄 / PDF로 저장</button>
      <button onclick="backToSelect()">다른 시나리오</button>
      <button class="btn-go" onclick="restartGame()">다시 하기</button></div>`);
};
window.restartGame=function(){ A2.style.display="none";
  document.getElementById("wrap").style.display="flex";
  document.getElementById("counter").style.display="none";
  startScenario(S.scn); };
window.backToSelect=function(){ A2.style.display="none";
  document.getElementById("counter").style.display="none";
  document.getElementById("wrap").style.display="flex"; scenarioSelect(); };

/* =========================================================================
   부팅 / 시나리오 선택
   ========================================================================= */
function scenarioSelect(){
  const PIC = {leningrad:"ln03", korea:"kr03", vietnam:"vn06"};
  const T = document.getElementById("title");
  const SCNS = [["leningrad",LENINGRAD],["korea",KOREA],["vietnam",VIETNAM]];
  document.getElementById("tCards").innerHTML = SCNS.map(([k,s])=>
    `<button class="tcard" onclick="startScenario('${k}')">
       <img src="${EVIMG[PIC[k]]}" alt="">
       <span class="tcsh"></span>
       <span class="tct"><b>${s.title}</b><i>${s.sub}</i><span>${s.course}</span></span>
     </button>`).join("");

  setBgm("leningrad");            /* 첫 화면부터 음악을 깐다 */
  const V = document.getElementById("titleVid");
  if(typeof INTRO_POSTER!=="undefined") V.poster = INTRO_POSTER;
  const kick=()=>{ V.muted=true; const q=V.play(); if(q&&q.catch) q.catch(()=>{}); };
  V.addEventListener("canplay", kick);
  V.addEventListener("loadeddata", kick);
  introPrepare().then(u=>{ if(u){ V.src=u; V.load(); kick(); } });
  T.style.display="block";

  /* 전쟁을 겪은 쪽에서 본 문장 — 이 게임이 무엇을 하려는지 */
  const LINES=[
    "전쟁의 이름은 <b>군인</b>이 짓고,<br>그 값은 대개 <b>군인이 아닌 사람들</b>이 치렀다.",
    "당신은 이 전쟁의 <b>이름</b>을 알고 있다.<br>그 안에서 사라진 <b>사람들의 이름</b>은 알지 못한다.",
    "<b>적힌 것은 남고,<br>적히지 않은 것은 증명되지 않는다.</b>"
  ];
  const Q=document.getElementById("tQuote"), M=document.getElementById("tMast"),
        P=document.getElementById("tPick"), K=document.getElementById("tSkip");
  let _tt=[], done=false;
  const at=(ms,fn)=>_tt.push(setTimeout(fn,ms));

  function finish(){
    kick(); narrStop();
    if(done) return; done=true;
    _tt.forEach(clearTimeout); _tt=[];
    Q.classList.remove("on"); Q.innerHTML="";
    T.classList.add("lit"); M.classList.add("on"); P.classList.add("on");
    K.classList.remove("on");
    T.removeEventListener("pointerdown", finish);
  }
  window._titleFinish = finish;

  LINES.forEach((tx,n)=>{
    at(700+n*4300, ()=>{ Q.innerHTML=tx; Q.classList.add("on"); narrate(tx, 0.84); });
    at(700+n*4300+3400, ()=>Q.classList.remove("on"));
  });
  at(1800, ()=>K.classList.add("on"));
  at(700+LINES.length*4300+200, finish);
  T.addEventListener("pointerdown", finish);
}
window.scenarioSelect=scenarioSelect;
window.startScenario=function(k){
  snd.click();
  const T=document.getElementById("title");
  const V=document.getElementById("titleVid"); if(V){ V.pause(); }
  T.style.display="none"; T.classList.remove("lit");
  A2.style.display="none"; document.getElementById("counter").style.display="none";
  document.getElementById("wrap").style.display="flex"; nightHide();
  newGame(k); resize(); relayoutAll(); snapAll(); setBgm(k);
  renderOn=true; render(); refreshAll(); paintLog();
  const INTRO_PIC={leningrad:"ln03", korea:"kr01", vietnam:"vn01"};
  showModal(SC.title, `<div class="evimg"><img src="${EVIMG[INTRO_PIC[k]]}" alt=""></div>
    <div class="pad"><p style="font-size:15px;line-height:1.8">${SC.intro}</p>
    <div class="srcbox"><span class="lbl">알 아 둘 것</span>
      사건 화면의 <b>🕯 그때 들은 이야기를 떠올린다</b>는 장식이 아닙니다. 읽으면 <b>새로운 선택지</b>가 열립니다.
      아는 만큼 살아남고, 아는 만큼 나중에 증언할 수 있습니다.</div>
    <div class="rowbtns"><button class="btn-go" onclick="closeModal();startDay()">시작 ▸</button></div></div>`);
};
document.getElementById("btnHelp").onclick=()=>showModal("도움말",`<div class="pad">
  <p><b style="color:var(--warn)">이기는 게임이 아닙니다.</b> 전쟁을 겪은 사람의 자리에서 12일을 버티고, 그 뒤에 질문을 받습니다.</p>
  <p>이 게임의 이름은 <b>명부(名簿)</b>입니다. 명부는 누군가를 잡아가는 데 쓰이기도 하고, 누군가를 기억하는 데 쓰이기도 합니다. 무엇을 적고 무엇을 적지 않을지가 이 게임의 전부입니다.</p>
  <p><b>조작</b> — ① 아래 <b>인물 카드</b>를 눌러 사람을 고르고 → ② 화면의 <b>방</b>을 클릭합니다.<br>
  방마다 무엇을 할 수 있는지 <b>색깔 배지</b>로 표시돼 있습니다.</p>
  <p><b>하루</b> — 아침에 사건이 하나 일어납니다. 낮에는 행동 3회, 밤에는 한 사람을 밖으로 내보냅니다.
  현관(사다리)에 사람을 배치하면 야간 침입을 막을 수 있습니다.</p>
  <div class="rowbtns"><button class="btn-go" onclick="closeModal()">닫기</button></div></div>`);
(function(){
  const b=document.createElement("button");
  b.id="btnNarr"; b.className="ghost"; b.textContent="🔊 낭독"; b.style.opacity=1;
  b.onclick=function(){ const on=this.textContent.indexOf("끔")>=0;
    setNarrOn(on); this.textContent=on?"🔊 낭독":"🔊 낭독 끔"; this.style.opacity=on?1:.5; };
  const s=document.getElementById("btnSound"); s.parentNode.insertBefore(b, s);
})();
document.getElementById("btnSound").onclick=function(){
  const on=snd.toggle(); setBgmOn(on); if(!on) narrStop();
  this.textContent=on?"♪ 소리":"♪ 소리 끔"; this.style.opacity=on?1:.5; };
document.getElementById("actCraft").onclick=()=>{ if(S&&!S.over) openCraft(); };
document.getElementById("actNight").onclick=()=>{ if(S&&!S.over) openNight(); };
window.addEventListener("resize",()=>{ if(S) resize(); });

/* 초기 부팅 — 기본 시나리오로 캔버스만 준비하고 선택 화면을 띄운다 */
newGame("leningrad"); resize(); relayoutAll(); snapAll();
refreshAll(); paintLog(); render();
document.getElementById("wrap").style.display="none";
scenarioSelect();
