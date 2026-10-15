"""Cắt tiếp các KHOẢNG VẤP / NGẬP NGỪNG còn sót sau prepare.py.

    python scripts/trim_gaps.py <job> [--min 1.2] [--chua 0.22] [--xem]

Tìm mọi khoảng TRỐNG LỜI dài hơn --min giây trong words.json, cắt bớt chỉ chừa --chua giây
(để câu không dính sát nhau), ghi cut2.mp4 + words.json mới (bản cũ: words.truoc-trim.json).
--xem = chỉ liệt kê, không cắt. KHÔNG bao giờ cắt vào chữ: mốc cắt luôn nằm giữa 2 từ.
"""
import argparse, json, os, shutil, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("job"); ap.add_argument("--min", type=float, default=1.2); ap.add_argument("--chua", type=float, default=0.22)
ap.add_argument("--xem", action="store_true")
a = ap.parse_args()
jd = os.path.join(ROOT, "public", "_jobs", a.job)
d = json.load(open(os.path.join(jd, "words.json"), encoding="utf8"))
W = d["words"]; dur = d["durationSec"]

gaps = []
for x, y in zip(W, W[1:]):
    g = y["start"] - x["end"]
    if g > a.min:
        gaps.append((round(x["end"] + a.chua / 2, 3), round(y["start"] - a.chua / 2, 3), round(g, 2), x["w"], y["w"]))
tong = sum(b - s for s, b, *_ in gaps)
for s, b, g, w1, w2 in gaps:
    print(f"  {s:7.2f} → {b:7.2f}  (trống {g}s)   …{w1} | {w2}…")
print(f"{len(gaps)} chỗ, cắt tổng {tong:.1f}s → còn {dur - tong:.1f}s")
if a.xem or not gaps:
    raise SystemExit

keep, t = [], 0.0
for s, b, *_ in gaps:
    if s > t:
        keep.append((t, s))
    t = b
if t < dur:
    keep.append((t, dur))
sel = "+".join(f"between(t,{s:.3f},{b:.3f})" for s, b in keep)
out = os.path.join(jd, "cut2.mp4")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(jd, "cut.mp4"),
                "-vf", f"select='{sel}',setpts=N/FRAME_RATE/TB", "-af", f"aselect='{sel}',asetpts=N/SR/TB",
                "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", out], check=True)

def moi(t0):
    acc = 0.0
    for s, b in keep:
        if t0 < s:
            return acc
        if t0 <= b:
            return acc + (t0 - s)
        acc += b - s
    return acc

shutil.copyfile(os.path.join(jd, "words.json"), os.path.join(jd, "words.truoc-trim.json"))
d["words"] = [{"w": w["w"], "start": round(moi(w["start"]), 3), "end": round(moi(w["end"]), 3)} for w in W]
d["durationSec"] = round(sum(b - s for s, b in keep), 3)
d["trimGaps"] = [[s, b] for s, b, *_ in gaps]
json.dump(d, open(os.path.join(jd, "words.json"), "w", encoding="utf8"), ensure_ascii=False)
print("XONG:", out, "|", d["durationSec"], "giây |", len(d["words"]), "từ (giữ nguyên)")
