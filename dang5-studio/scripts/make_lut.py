"""Dựng BỘ LỌC MÀU (.cube) học từ một video mẫu.

    python scripts/make_lut.py <video-mau.mp4> <ten-lut> [--mocs 0.7,1.6,2.6] [--manh 0.85]

Cách làm: đo video mẫu rồi lấy "chất màu" chứ KHÔNG lấy độ sáng —
  1) với mỗi mức sáng (theo phân vị), đo mẫu lệch màu bao nhiêu so với xám (R-lum, G-lum, B-lum);
  2) dựng LUT cộng đúng mức lệch đó vào video của mình, giữ nguyên độ sáng gốc
     (nếu copy cả độ sáng thì video quay ban ngày sẽ bị tối om như phòng đèn vàng);
  3) chỉnh độ bão hoà + độ tương phản mềm cho khớp mẫu.
Ra: public/luts/<ten-lut>.cube — dùng trong plan Dạng 4: "lut": "ten-lut".
"""
import argparse, os, subprocess, numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "luts")
LUM = np.array([0.2126, 0.7152, 0.0722])


def doc(src, ts, w=200):
    px = []
    for t in ts:
        p = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", src, "-frames:v", "1",
                            "-vf", f"scale={w}:-1", "-pix_fmt", "rgb24", "-f", "rawvideo", "-"], capture_output=True).stdout
        n = len(p) // (w * 3)
        px.append(np.frombuffer(p, np.uint8)[:n * w * 3].reshape(-1, 3).astype(float) / 255)
    return np.concatenate(px)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mau"); ap.add_argument("ten")
    ap.add_argument("--mocs", default=None, help="các giây lấy mẫu, cách nhau bởi dấu phẩy")
    ap.add_argument("--manh", type=float, default=0.85, help="0..1 — độ mạnh của chất màu")
    ap.add_argument("--sat", type=float, default=0.85, help="hệ số bão hoà (1 = giữ nguyên)")
    a = ap.parse_args()
    if a.mocs:
        ts = [float(x) for x in a.mocs.split(",")]
    else:
        d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.mau], capture_output=True, text=True).stdout)
        ts = [d * (i + 0.5) / 12 for i in range(12)]
    px = doc(a.mau, ts)
    lum = px @ LUM

    # lệch màu theo PHÂN VỊ sáng (0..1) — 16 mốc
    q = np.linspace(0, 1, 17)
    edges = np.quantile(lum, q)
    mid, offs = [], []
    for i in range(16):
        m = (lum >= edges[i]) & (lum <= edges[i + 1])
        if m.sum() < 50:
            continue
        mid.append((q[i] + q[i + 1]) / 2)
        offs.append((px[m] - lum[m][:, None]).mean(0))
    mid = np.array(mid); offs = np.array(offs) * a.manh

    mx = px.max(1); mn = px.min(1)
    sat_mau = float(np.where(mx > 0, (mx - mn) / (mx + 1e-6), 0).mean())
    print("mẫu: bão hoà %.3f | lệch màu vùng tối %s | vùng sáng %s" % (sat_mau, np.round(offs[1], 3), np.round(offs[-2], 3)))

    N = 33
    g = np.linspace(0, 1, N)
    r, gg, b = np.meshgrid(g, g, g, indexing="ij")
    rgb = np.stack([r, gg, b], -1).reshape(-1, 3)
    L = rgb @ LUM
    # phân vị của mức sáng này trong ảnh mẫu → lệch màu tương ứng
    p = np.interp(L, np.sort(lum), np.linspace(0, 1, len(lum)))
    add = np.stack([np.interp(p, mid, offs[:, c]) for c in range(3)], -1)
    out = rgb + add
    # tương phản mềm (S nhẹ, nhấc bóng tối một chút cho ra chất phim)
    Lo = out @ LUM
    Ln = np.clip(Lo, 0, 1)
    Ln = 0.012 + (Ln ** 0.97) * (1 - 0.012)
    Ln = Ln + 0.055 * np.sin(np.pi * np.clip(Ln, 0, 1)) * (Ln - 0.5) * 2
    out = out + (Ln - Lo)[:, None]
    # bão hoà: lớp cộng màu ở trên làm tăng bão hoà → kéo lại cho khớp mẫu
    Lm = out @ LUM
    out = Lm[:, None] + (out - Lm[:, None]) * a.sat
    out = np.clip(out, 0, 1)

    os.makedirs(OUT, exist_ok=True)
    f = os.path.join(OUT, a.ten + ".cube")
    with open(f, "w", encoding="utf8") as fh:
        fh.write(f"# bộ lọc học từ {os.path.basename(a.mau)}\nTITLE \"{a.ten}\"\nLUT_3D_SIZE {N}\n")
        for i in range(out.shape[0]):
            # thứ tự .cube: B chạy chậm nhất → cần đảo trục cho khớp meshgrid 'ij'
            pass
        cube = out.reshape(N, N, N, 3)
        for bb in range(N):
            for gi in range(N):
                for ri in range(N):
                    v = cube[ri, gi, bb]
                    fh.write("%.6f %.6f %.6f\n" % (v[0], v[1], v[2]))
    print("XONG:", f)


if __name__ == "__main__":
    main()
