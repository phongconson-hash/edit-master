# -*- coding: utf-8 -*-
"""ĐO VỊ TRÍ MẶT trong video người nói (anh Phong 22/10: "khung hình mặt phải lấy chuẩn", "chữ không được che mặt").

    python scripts/do_mat.py <job> [--buoc 0.5] [--tu 0] [--den 999]

Lấy mẫu mỗi --buoc giây trong cut_graded.mp4 (hoặc cut.mp4), dò mặt bằng mediapipe, in ra theo tỉ lệ khung 0..1:
  đỉnh đầu (ước = trán − 0,35 × chiều cao mặt) · tâm mặt · cằm, và từng đoạn mặt lệch nhiều.
Ghi `mat.json` để make_plan.py dùng: faceY cho khung bo góc / ô tròn, y chữ chạy dưới cằm.
"""
import argparse, json, os, statistics
import cv2
import mediapipe as mp

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("job")
ap.add_argument("--buoc", type=float, default=0.5)
ap.add_argument("--tu", type=float, default=0.0)
ap.add_argument("--den", type=float, default=1e9)
a = ap.parse_args()
jd = os.path.join(ROOT, "public", "_jobs", a.job)
src = os.path.join(jd, "cut_graded.mp4")
if not os.path.exists(src):
    src = os.path.join(jd, "cut.mp4")

cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
dur = n / fps
det = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)
rows = []
t = a.tu
while t < min(dur, a.den):
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(t * fps))
    ok, img = cap.read()
    if not ok:
        break
    h, w = img.shape[:2]
    r = det.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    if r.detections:
        b = max(r.detections, key=lambda d: d.score[0]).location_data.relative_bounding_box
        top, fh = b.ymin, b.height
        rows.append({"t": round(t, 2), "dinh": round(top - 0.35 * fh, 3), "tam": round(top + fh / 2, 3),
                     "cam": round(top + fh * 1.05, 3), "x": round(b.xmin + b.width / 2, 3), "cao": round(fh, 3)})
    else:
        rows.append({"t": round(t, 2), "mat": None})
    t += a.buoc

ok = [r for r in rows if "tam" in r]
if not ok:
    raise SystemExit("không thấy mặt")
med = {k: round(statistics.median(r[k] for r in ok), 3) for k in ("dinh", "tam", "cam", "x", "cao")}
lo = {k: round(min(r[k] for r in ok), 3) for k in ("dinh", "tam", "cam", "x")}
hi = {k: round(max(r[k] for r in ok), 3) for k in ("dinh", "tam", "cam", "x")}
print("nguồn:", os.path.basename(src), " %.1fs · %d mẫu · thấy mặt %d" % (dur, len(rows), len(ok)))
print("TRUNG VỊ  đỉnh đầu %.3f · tâm mặt %.3f · cằm %.3f · tâm ngang %.3f · mặt cao %.3f" % (med["dinh"], med["tam"], med["cam"], med["x"], med["cao"]))
print("KHOẢNG    đỉnh %.3f–%.3f · tâm %.3f–%.3f · cằm %.3f–%.3f · ngang %.3f–%.3f" % (lo["dinh"], hi["dinh"], lo["tam"], hi["tam"], lo["cam"], hi["cam"], lo["x"], hi["x"]))
print("→ chữ chạy nên đặt y ≥ %.3f (cằm thấp nhất + 0,13 cho khối chữ 2 tầng)" % (hi["cam"] + 0.13))
lech = [r for r in ok if abs(r["tam"] - med["tam"]) > 0.06 or abs(r["x"] - med["x"]) > 0.08]
if lech:
    print("ĐOẠN MẶT LỆCH NHIỀU (cúi/ngả/nghiêng):", ", ".join("%.1fs" % r["t"] for r in lech[:30]))
json.dump({"nguon": os.path.basename(src), "trungVi": med, "thap": lo, "cao": hi, "mau": rows},
          open(os.path.join(jd, "mat.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
