# -*- coding: utf-8 -*-
"""웹 배포용 경량판 — 자산을 다시 압축해 index.html 을 만든다.

교실에서는 원본(명부.html)을 쓰는 편이 낫다. 이 파일은 인터넷으로
바로 열어 보게 하려고 용량을 줄인 것이고, 그만큼 화질과 음질이 떨어진다.

    python build/build_web.py            # → web/index.html
"""
import sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
import io, os, re, base64, subprocess, tempfile

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD  = os.path.join(ROOT, "build")
ASSETS = os.path.join(BUILD, "assets.js")
OUTDIR = os.path.join(ROOT, "web")
OUT    = os.path.join(OUTDIR, "index.html")

def ffmpeg():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()

def dataurl(mime, raw):
    return "data:%s;base64,%s" % (mime, base64.b64encode(raw).decode())

def raw_of(u):
    return base64.b64decode(u.split(",", 1)[1])

# ── 이미지 다시 압축 ──
def shrink_jpeg(u, maxw, q):
    from PIL import Image
    im = Image.open(io.BytesIO(raw_of(u))).convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return dataurl("image/jpeg", b.getvalue())

def shrink_png(u, maxw, colors=200):
    """투명이 필요한 시트·아이콘 — 팔레트로 줄인다."""
    from PIL import Image
    im = Image.open(io.BytesIO(raw_of(u))).convert("RGBA")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    a = im.getchannel("A")
    p = im.convert("RGB").quantize(colors=colors, method=Image.MEDIANCUT).convert("RGBA")
    p.putalpha(a)
    b = io.BytesIO(); p.save(b, "PNG", optimize=True)
    out = dataurl("image/png", b.getvalue())
    return out if len(out) < len(u) else u

def shrink_mp3(u, kbps):
    ff = ffmpeg()
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, "i.mp3"), os.path.join(d, "o.mp3")
        open(src, "wb").write(raw_of(u))
        subprocess.check_call([ff, "-y", "-loglevel", "error", "-i", src,
                               "-ac", "1", "-b:a", "%dk" % kbps, "-ar", "32000", dst])
        return dataurl("audio/mpeg", open(dst, "rb").read())

def shrink_mp4(u, w, crf):
    ff = ffmpeg()
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, "i.mp4"), os.path.join(d, "o.mp4")
        open(src, "wb").write(raw_of(u))
        subprocess.check_call([ff, "-y", "-loglevel", "error", "-i", src, "-an",
                               "-vf", "scale=%d:-2" % w, "-c:v", "libx264",
                               "-crf", str(crf), "-preset", "slow",
                               "-movflags", "+faststart", dst])
        return dataurl("video/mp4", open(dst, "rb").read())

def map_obj(body, fn):
    """{"key":"data:...", ...} 안의 값들만 바꾼다."""
    out, n = [], 0
    # 키가 따옴표 없이 쓰인 것(BGM 등)도 함께 받는다
    KEY = r'(?:"(?:[^"\\]|\\.)*"|[A-Za-z_$][\w$]*)'
    for m in re.finditer(KEY + r'\s*:\s*"(data:[^"]*)"', body):
        out.append((m.start(1), m.end(1), fn(m.group(1)))); n += 1
    for a, b, v in reversed(out):
        body = body[:a] + v + body[b:]
    return body, n

def main():
    s = io.open(ASSETS, encoding="utf-8").read()
    before = len(s)

    def repl_scalar(name, fn):
        nonlocal s
        m = re.search(r'const %s\s*=\s*"(data:[^"]*)"' % name, s)
        if not m: print("  건너뜀:", name); return
        s = s[:m.start(1)] + fn(m.group(1)) + s[m.end(1):]

    def repl_obj(name, fn):
        nonlocal s
        m = re.search(r'const %s\s*=\s*(\{.*?\});\n' % name, s, flags=re.S)
        if not m: print("  건너뜀:", name); return
        body, n = map_obj(m.group(1), fn)
        s = s[:m.start(1)] + body + s[m.end(1):]
        print("   %s %d개" % (name, n))

    print("소리 —")
    repl_obj("BGM",       lambda u: shrink_mp3(u, 48))
    print("영상 —")
    repl_scalar("INTRO_VIDEO", lambda u: shrink_mp4(u, 640, 34))
    repl_scalar("INTRO_POSTER", lambda u: shrink_jpeg(u, 640, 62))
    print("그림 —")
    for nm in ("BG_LN", "BG_KR", "BG_VN"):
        repl_scalar(nm, lambda u: shrink_jpeg(u, 1000, 62))
    repl_obj("EVIMG",   lambda u: shrink_jpeg(u, 620, 58))
    repl_obj("LOC_ART", lambda u: shrink_jpeg(u, 620, 58))
    repl_obj("CH_IMG",  lambda u: shrink_jpeg(u, 250, 56))
    repl_obj("ORAL_IMG",lambda u: shrink_jpeg(u, 620, 60))
    repl_obj("DEF_IMG", lambda u: shrink_jpeg(u, 340, 60))
    repl_obj("MEM_IMG", lambda u: shrink_jpeg(u, 380, 60))
    repl_obj("RESULT_IMG", lambda u: shrink_jpeg(u, 600, 60))
    print("투명 그림 —")
    repl_scalar("SPRITE_SHEET", lambda u: shrink_png(u, 460, 180))
    repl_scalar("RAID_SHEET",   lambda u: shrink_png(u, 300, 180))
    repl_obj("OBJ_IMG",  lambda u: shrink_png(u, 190, 160))
    repl_obj("ICON_IMG", lambda u: shrink_png(u, 56, 128))

    # 조립
    head = io.open(os.path.join(BUILD, "src", "v2_head.html"), encoding="utf-8").read()
    FILES = ["v2_data1.js","v2_data2.js","v2_data_kr.js","v2_data3.js",
             "v2_sprite.js","v2_engine.js","v2_engine2.js","v2_act2.js"]
    code = "".join(io.open(os.path.join(BUILD,"src",f), encoding="utf-8").read() for f in FILES)
    html = head.replace("/*__ASSETS__*/", s) + code + "\n</script>\n</body>\n</html>\n"
    os.makedirs(OUTDIR, exist_ok=True)
    io.open(OUT, "w", encoding="utf-8", newline="\n").write(html)
    print("\n자산 %.2f MB → %.2f MB" % (before/1048576, len(s)/1048576))
    print("web/index.html  %.2f MB" % (os.path.getsize(OUT)/1048576))

if __name__ == "__main__":
    main()
