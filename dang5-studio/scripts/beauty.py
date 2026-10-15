"""Làm đẹp da cho video cận mặt (Dạng 4): python scripts/beauty.py <job> [--strength 1.0]
Đọc public/_jobs/<job>/cut.mp4 → ghi cut_beauty.mp4 (plan đặt "video": "_jobs/<job>/cut_beauty.mp4").
Cách làm (kiểu "retouch" của app quay/CapCut, bản nhẹ tay):
  1) mịn da GIỮ NÉT viền: bilateral 2 lượt (xoá lỗ chân lông/nếp nhỏ, không nhoè mắt-môi-tóc)
  2) trộn lại 25% bản gốc để da còn kết cấu, không "nhựa"
  3) sáng trong: nhấc vùng trung tính + trắng hơi hồng, giữ đen
  4) làm nét nhẹ chi tiết lớn (mắt, môi, gọng kính)
"""
import argparse, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("job"); ap.add_argument("--strength", type=float, default=1.0); a = ap.parse_args()
jd = os.path.join(ROOT, "public", "_jobs", a.job)
k = max(0.0, min(1.5, a.strength))
fc = (f"[0:v]split=2[o][s];"
      f"[s]bilateral=sigmaS={5*k:.1f}:sigmaR={0.085*k:.3f},bilateral=sigmaS={9*k:.1f}:sigmaR={0.06*k:.3f}[sm];"
      f"[sm][o]blend=all_mode=normal:all_opacity=0.25[b];"
      f"[b]curves=all='0/0 0.25/0.27 0.5/0.56 0.75/0.80 1/1':r='0/0 0.5/0.515 1/1',"
      f"eq=saturation=1.03,unsharp=7:7:0.35:7:7:0[v]")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(jd, "cut.mp4"), "-filter_complex", fc, "-map", "[v]", "-map", "0:a?",
                "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", os.path.join(jd, "cut_beauty.mp4")], check=True)
print("XONG:", os.path.join(jd, "cut_beauty.mp4"))
