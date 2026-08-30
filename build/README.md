# 「명부」 빌드

`명부.html` 은 8MB가 넘는 단일 파일이고, 그 대부분은 base64 로 박아 넣은 그림·소리다.
**그 파일을 직접 고치지 말 것.** `build/src/` 를 고치고 빌드한다.

```
python build/build.py          # src/ + assets.js  →  명부.html
node --check build/check.js    # 문법 검사 (자산 뺀 코드만)
```

## 왜 이렇게 나눠 두었나

그림 원본(PNG·MP3)을 다 합치면 180MB가 넘어 저장소에 두기 어렵다.
그래서 **자산은 `명부.html` 안에만 두고**, 필요할 때 도로 꺼내 쓴다.

```
python build/extract_assets.py   # 명부.html  →  build/assets.js
```

`build.py` 는 `assets.js` 가 없으면 이걸 알아서 부른다.
그래서 저장소를 새로 받은 직후에도 `python build/build.py` 한 줄이면 된다.

`assets.js` 와 `check.js` 는 만들어지는 파일이라 커밋하지 않는다.

## src/ 붙는 순서

순서가 곧 실행 순서다. 뒤 파일이 앞 파일의 상수를 쓴다.

| 파일 | 담긴 것 |
|---|---|
| `v2_head.html` | HTML 뼈대와 CSS 전부. `/*__ASSETS__*/` 자리에 자산이 들어간다 |
| `v2_data1.js` | 레닌그라드 시나리오 |
| `v2_data2.js` | 베트남 시나리오 |
| `v2_data_kr.js` | 6·25 시나리오 |
| `v2_data3.js` | 공통 자원·제작·사건 규칙 |
| `v2_sprite.js` | 스프라이트 시트에서 인물·물건 그리기 |
| `v2_engine.js` | 낮 — 방, 이동, 행동, 하루 넘기기 |
| `v2_engine2.js` | 밤 — 외출 카드, 인물 선택, 사건, 계기판 |
| `v2_act2.js` | 2막 — 세 개의 문과 「명부」 엔딩 |

## 자산을 새로 넣을 때

1. 그림을 만든다 (16:9 PNG)
2. `Pillow` 로 줄이고 어둡게 해서 base64 JPEG 로 바꾼다
   — 사건 삽화·장소 그림은 700~760px 폭, quality 71~72
3. `build/assets.js` 의 해당 객체(`EVIMG`, `LOC_ART`, `OBJ_IMG`, `ICON_IMG` …)에 키를 더한다
4. `python build/build.py`

BGM 은 `assets.js` 의 `const BGM = {…}` 에 시나리오 키로 넣는다.
곡이 있는 시나리오만 재생되고, 없으면 조용하다.

## 화풍

그림은 전부 한 화풍으로 맞춰 두었다. 새로 뽑을 때 이 앞머리를 그대로 쓴다.

```
Dark monochrome etched illustration, 19th-century engraving crossed with
charcoal drawing, heavy crosshatching, sepia-black limited palette,
dramatic chiaroscuro, grim and somber, cinematic wide composition.
No text, no lettering, no signage, no blood, no bodies.
Scene: …
```
