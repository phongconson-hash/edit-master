"""Áp BỘ LỌC MÀU (.cube) + LÀM NỔI NHÂN VẬT lên video của job.

    python scripts/grade.py <job> [--lut mint-warm] [--manh 1.0] [--net 1.0]

Đọc public/_jobs/<job>/cut.mp4 (hoặc cut_beauty.mp4 nếu có) → ghi cut_graded.mp4.
Trong plan đặt:  "video": "_jobs/<job>/cut_graded.mp4",  "graded": true
(`graded` để renderer TẮT lớp chỉnh màu CSS, tránh chồng hai lần màu.)

--manh < 1  pha loãng bộ lọc MÀU với bản gốc (0.6 = nhẹ tay).
--net       làm NHÂN VẬT RÕ NÉT & NỔI BẬT (anh Phong dặn 14/10/2026). 0 = tắt,
            1.0 = mức chuẩn, >1 mạnh hơn. Gồm 3 lớp, chỉ tác động LUMA nên
            không làm da rỗ/ám màu:
              1. độ rõ (clarity): unsharp bán kính lớn, biên độ thấp → khối
                 mặt/vai tách khỏi hậu cảnh.
              2. nét (sharpen): unsharp bán kính nhỏ → mắt, tóc, mép áo sắc.
              3. tương phản nhẹ + tối rìa rất mỏng → mắt người xem dồn vào giữa.
            Chạy TRƯỚC khi làm mịn da ở CapCut là đúng thứ tự: CapCut mịn da,
            phần nét ở mắt/tóc/viền vẫn còn.
"""
import argparse, os, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("job"); ap.add_argument("--lut", default="mint-warm")
ap.add_argument("--manh", type=float, default=1.0)
ap.add_argument("--net", type=float, default=1.0)
a = ap.parse_args()
jd = os.path.join(ROOT, "public", "_jobs", a.job)
src = os.path.join(jd, "cut_beauty.mp4")
if not os.path.exists(src):
    src = os.path.join(jd, "cut.mp4")
lut = os.path.join(ROOT, "public", "luts", a.lut + ".cube").replace("\\", "/").replace(":", "\:")

k = max(0.0, min(1.0, a.manh))
fc = (f"[0:v]split=2[o][g];[g]lut3d='{lut}'[gr];[o][gr]blend=all_mode=normal:all_opacity={k}[v]"
      if k < 1 else f"[0:v]lut3d='{lut}'[v]")

n = max(0.0, a.net)
if n > 0:
    ro = round(0.30 * n, 3)   # độ rõ  — bán kính lớn, biên độ thấp
    sh = round(0.55 * n, 3)   # nét    — bán kính nhỏ
    ct = round(1 + 0.05 * n, 3)
    sa = round(1 + 0.03 * n, 3)
    fc += (f";[v]unsharp=13:13:{ro}:13:13:0,"
           f"unsharp=5:5:{sh}:5:5:0,"
           f"eq=contrast={ct}:saturation={sa},"
           f"vignette=PI/{round(5 + 2 / n, 2)}:eval=init[v2]")
    vout = "[v2]"
else:
    vout = "[v]"

out = os.path.join(jd, "cut_graded.mp4")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex", fc, "-map", vout, "-map", "0:a?",
                "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", out], check=True)
print("XONG:", out, "(nguồn:", os.path.basename(src) + f", bộ lọc {a.lut} x{k}, nét x{n})")
