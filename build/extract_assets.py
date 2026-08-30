# -*- coding: utf-8 -*-
"""명부.html 안에 박혀 있는 자산 블록을 build/assets.js 로 도로 꺼낸다.

자산(스프라이트 시트·아이콘·제작물·사건 삽화·배경·장소 그림·BGM)은
전부 base64 로 HTML 안에 들어 있다. 원본 PNG/MP3 는 저장소에 넣기엔 너무 커서
(합계 180MB 남짓) 두지 않고, 이 스크립트로 HTML에서 되꺼내 쓴다.

    python build/extract_assets.py

build.py 는 assets.js 가 없으면 이 스크립트를 알아서 부른다.
"""
import sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, '명부.html')
OUT  = os.path.join(ROOT, 'build', 'assets.js')

# 자산 블록은 이 이름들로 시작하는 줄이다 (v2_head.html 의 /*__ASSETS__*/ 자리)
KEYS = ['const SPRITE_SHEET=', 'const SPRITE_FR=', 'const ICON_IMG=', 'const OBJ_IMG=',
        'const EVIMG=', 'const BG_LN=', 'const BG_KR=', 'const BG_VN=',
        'const BGM ', 'const BGM=', 'const LOC_ART=']

def main():
    if not os.path.exists(HTML):
        sys.exit('없음: ' + HTML)
    lines = io.open(HTML, encoding='utf-8').read().split('\n')
    picked, seen = [], []
    for ln in lines:
        for k in KEYS:
            if ln.startswith(k):
                picked.append(ln); seen.append(k.strip()); break
    if not picked:
        sys.exit('자산 줄을 찾지 못했다. 명부.html 이 빌드된 파일이 맞는지 확인할 것.')
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(picked) + '\n')
    print('assets.js %d줄, %.2f MB' % (len(picked), os.path.getsize(OUT)/1048576))
    print('  ' + ', '.join(seen))

if __name__ == '__main__':
    main()
