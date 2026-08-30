# -*- coding: utf-8 -*-
"""build/src/*  +  build/assets.js  →  명부.html (단일 파일)

    python build/build.py

8MB짜리 HTML을 직접 고치지 말 것. src/ 를 고치고 이걸 돌린다.
문법 검사까지 하려면 이어서:  node --check build/check.js
"""
import sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
import io, os, subprocess, sys

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD  = os.path.join(ROOT, 'build')
SRC    = os.path.join(BUILD, 'src')
ASSETS = os.path.join(BUILD, 'assets.js')
OUT    = os.path.join(ROOT, '명부.html')

# 붙이는 순서가 곧 실행 순서다. 자료 → 스프라이트 → 엔진 → 2막
FILES = ['v2_data1.js', 'v2_data2.js', 'v2_data_kr.js', 'v2_data3.js',
         'v2_sprite.js', 'v2_engine.js', 'v2_engine2.js', 'v2_act2.js']

def rd(p): return io.open(p, encoding='utf-8').read()

def main():
    if not os.path.exists(ASSETS):
        print('assets.js 가 없다 — 명부.html 에서 꺼낸다')
        subprocess.check_call([sys.executable, os.path.join(BUILD, 'extract_assets.py')])

    head   = rd(os.path.join(SRC, 'v2_head.html'))
    assets = rd(ASSETS)
    code   = ''.join(rd(os.path.join(SRC, f)) for f in FILES)

    html = head.replace('/*__ASSETS__*/', assets) + code + '\n</script>\n</body>\n</html>\n'
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(html)
    print('명부.html  %.2f MB · %d줄' % (os.path.getsize(OUT)/1048576, html.count('\n')))

    # 자산 없이 코드만 담은 사본 — node --check 로 문법을 볼 때 쓴다
    stub = ('const SPRITE_SHEET="";const SPRITE_FR={};const ICON_IMG={};const OBJ_IMG={};'
            'const EVIMG={};const BG_LN="";const BG_KR="";const BG_VN="";'
            'const BGM={};const LOC_ART={};\n')
    io.open(os.path.join(BUILD, 'check.js'), 'w', encoding='utf-8', newline='\n').write(stub + code)

    for need in ['const SPRITE_SHEET=', 'const BG_KR=', 'const BG_LN=',
                 'const BG_VN=', 'const LOC_ART=']:
        if need not in html:
            print('  !! 자산 누락:', need)

if __name__ == '__main__':
    main()
