
/* =========================================================================
   SPRITE — 생성한 인물 스프라이트 시트 · 아이템 아이콘 · 제작물
   좌표표(SPRITE_FR)는 시트를 조립할 때 함께 만들었으므로 어긋날 수 없다.
   ========================================================================= */
const SPRITE_H = 190;                    /* 시트 안에서 '서 있는' 자세의 높이 */
const sheetImg = new Image(); let sheetReady = false;
sheetImg.onload = ()=>{ sheetReady = true; }; sheetImg.src = SPRITE_SHEET;

/* 제작물 이미지 */
const objImg = {};
for(const k in OBJ_IMG){ const im = new Image(); im.src = OBJ_IMG[k]; objImg[k] = im; }

/* 인물 한 명 그리기 — 발끝(footY) 기준, dir로 좌우 반전 */
function drawPersonSprite(c, x, footY, wantH, styleKey, frame, dir, weak){
  const f = SPRITE_FR[styleKey + "_" + frame] || SPRITE_FR[styleKey + "_idle"];
  if(!f || !sheetReady) return false;
  const sc = wantH / SPRITE_H;
  const w = f[2]*sc, h = f[3]*sc;
  c.save();
  c.translate(x, footY); c.scale(dir||1, 1);
  if(weak){ try{ c.filter = "saturate(0.55) brightness(0.82)"; }catch(e){} }
  c.drawImage(sheetImg, f[0], f[1], f[2], f[3], -w/2, -h, w, h);
  c.restore();
  return true;
}


/* 밤 화면 인물 카드용 초상 — 시트를 CSS 배경으로 잘라 쓴다 */
document.documentElement.style.setProperty("--sheet", "url('" + SPRITE_SHEET + "')");
function scoutPortrait(sk, boxH){
  const f = SPRITE_FR[sk + "_idle"] || SPRITE_FR[sk + "_walk1"];
  const SW = sheetImg.naturalWidth, SH = sheetImg.naturalHeight;
  if(!f || !SW) return "";
  const sc = boxH / f[3];
  return `<span class="scpor" style="width:${Math.round(f[2]*sc)}px;height:${boxH}px;
    background-size:${Math.round(SW*sc)}px ${Math.round(SH*sc)}px;
    background-position:${-Math.round(f[0]*sc)}px ${-Math.round(f[1]*sc)}px"></span>`;
}



/* 제목용 글꼴 — 자산이라 런타임에 붙인다 (나눔명조 ExtraBold 부분집합, SIL OFL) */
if(typeof DISP_FONT !== "undefined"){
  const _fs = document.createElement("style");
  _fs.textContent = '@font-face{font-family:"MyeongjoDisp";font-style:normal;'
    + 'font-weight:800;font-display:swap;src:url(' + DISP_FONT + ') format("woff2");}';
  document.head.appendChild(_fs);
}
/* 큰 mp4 는 data: URL 로는 크롬이 디코딩하지 않는다 — Blob 으로 바꿔 쓴다.
   atob 루프는 1.7MB 문자열에서 화면을 멈추므로 fetch 로 넘긴다. */
let _introUrl=null, _introReady=null;
function introPrepare(){
  if(_introReady) return _introReady;
  if(typeof INTRO_VIDEO==="undefined" || !INTRO_VIDEO) return Promise.resolve(null);
  _introReady = fetch(INTRO_VIDEO).then(r=>r.blob())
    .then(b=>{ _introUrl=URL.createObjectURL(b); return _introUrl; })
    .catch(()=>null);
  return _introReady;
}
introPrepare();   /* 부팅하자마자 미리 받아둔다 */

/* 침입자 시트 — 생존자와 같은 기준 키(190)로 조립해 두었다 */
const raidImg = new Image(); let raidReady = false;
raidImg.onload = ()=>{ raidReady = true; };
if(typeof RAID_SHEET !== "undefined") raidImg.src = RAID_SHEET;

function drawRaidSprite(c, x, footY, wantH, key, dir, alpha){
  const f = (typeof RAID_FR !== "undefined") && RAID_FR[key];
  if(!f || !raidReady) return false;
  const sc = wantH / SPRITE_H, w = f[2]*sc, h = f[3]*sc;
  c.save();
  c.globalAlpha = alpha==null ? 1 : alpha;
  c.translate(x, footY); c.scale(dir||1, 1);
  c.drawImage(raidImg, f[0], f[1], f[2], f[3], -w/2, -h, w, h);
  c.restore();
  return true;
}
/* 걷는 동안 두 프레임을 번갈아 쓴다 */
function walkFrame(phase){ return (Math.floor(phase/1.7) % 2) ? "walk2" : "walk1"; }

/* =========================================================================
   제작물 — 만들면 그 방에 실제로 나타난다
   ========================================================================= */
const OBJ_PLACE = {
  leningrad:{
    stove:     {key:"ln_stove", room:4,  wf:0.50, ax:0.34, ay:1.00},
    bed:       {key:"ln_bed",   room:6,  wf:0.62, ax:0.50, ay:1.00},
    bed2:      {key:"ln_bed",   room:7,  wf:0.58, ax:0.50, ay:1.00},
    rain:      {key:"ln_rain",  room:11, wf:0.72, ax:0.50, ay:1.00},
    barricade: {key:"ln_door",  room:8,  wf:0.56, ax:0.50, ay:1.00},
  },
  korea:{
    stove:     {key:"kr_stove", room:4,  wf:0.44, ax:0.50, ay:1.00},
    bed:       {key:"kr_bed",   room:5,  wf:0.48, ax:0.50, ay:1.00},
    bed2:      {key:"kr_bed",   room:7,  wf:0.46, ax:0.50, ay:1.00},
    rain:      {key:"kr_rain",  room:9,  wf:0.54, ax:0.50, ay:1.00},
    barricade: {key:"kr_door",  room:8,  wf:0.46, ax:0.50, ay:1.00},
    hide:      {key:"kr_hide",  room:11, wf:0.58, ax:0.50, ay:1.00},
  },
  vietnam:{
    hide:      {key:"vn_hide",  room:9,  wf:0.56, ax:0.50, ay:1.00},
    bed:       {key:"vn_bed",   room:6,  wf:0.40, ax:0.70, ay:1.00},
    bed2:      {key:"vn_bed",   room:2,  wf:0.34, ax:0.30, ay:1.00},
    rain:      {key:"vn_rain",  room:11, wf:0.38, ax:0.42, ay:1.00},
    barricade: {key:"vn_door",  room:8,  wf:0.52, ax:0.52, ay:1.00},
  },
};
/* 어떤 제작물이 지금 지어져 있는가 */
function builtList(){
  const P = OBJ_PLACE[S.scn] || {}, out = [];
  if(S.build.stove && P.stove) out.push(P.stove);
  if(S.build.hide  && P.hide)  out.push(P.hide);
  if(S.build.rain  && P.rain)  out.push(P.rain);
  if(S.build.bed >= 1 && P.bed)  out.push(P.bed);
  if(S.build.bed >= 2 && P.bed2) out.push(P.bed2);
  if(S.build.barricade >= 1 && P.barricade) out.push(P.barricade);
  return out;
}
function drawBuilt(c){
  for(const o of builtList()){
    const im = objImg[o.key]; if(!im || !im.complete || !im.naturalWidth) continue;
    const q = rrect(o.room);
    const boost = (o.key.indexOf("door")>=0 && S.build.barricade>=2) ? 1.14 : 1;
    const w = q.w*o.wf*boost, h = w*(im.naturalHeight/im.naturalWidth);
    const x = q.x + q.w*o.ax - w/2, y = q.y + q.h*o.ay - h;
    c.save();
    c.globalAlpha = 0.28;                      /* 바닥 그림자 */
    c.fillStyle = "#000";
    c.beginPath(); c.ellipse(x+w/2, y+h, w*0.42, h*0.07, 0,0,7); c.fill();
    c.globalAlpha = 1;
    c.drawImage(im, x, y, w, h);
    c.restore();
  }
}
function drawExtraBarricade(c){ /* 문 그림으로 충분하다 */ }

/* =========================================================================
   아이콘 — 자원 목록·제작 비용에 쓰는 <img>
   ========================================================================= */
function resIcon(k, size){
  size = size || 16;
  const u = (typeof ICON_IMG !== "undefined") && ICON_IMG[k];
  if(u) return `<img src="${u}" width="${size}" height="${size}" alt=""
    style="flex:0 0 ${size}px;width:${size}px;height:${size}px;object-fit:contain;
    vertical-align:middle;image-rendering:auto">`;
  const c = (RES[k] && RES[k][1]) || "#888";
  return `<span style="display:inline-block;width:${size}px;height:${size}px;
    border-radius:3px;background:${c};vertical-align:middle"></span>`;
}
