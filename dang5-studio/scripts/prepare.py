"""Dạng 4 — BƯỚC 1: chuẩn bị video nguồn.

python scripts/prepare.py <video.mp4> [--lang vi] [--model medium] [--job ten-job]

Làm:
  1. Nhận lời (faster-whisper, mốc thời gian từng từ).
  2. Cắt lặng: giữ lời, khoảng nghỉ giữa câu nén còn ~0,35s (không cắt giữa từ).
  3. Đưa về 1080x1920 30fps (crop dọc bám mặt nếu có mediapipe, không thì giữa khung).
  4. Chỉnh màu nhẹ kiểu mẫu: ấm, nâng đen, tương phản vừa, làm nét nhẹ.
Ra: public/_jobs/<job>/cut.mp4 + words.json (mốc thời gian đã dời theo video đã cắt).
Sau bước này Claude đọc words.json, sửa chính tả, rồi viết plan.json.
"""
import argparse, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAP_KEEP = 0.35   # khoảng nghỉ giữ lại giữa 2 câu


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height:format=duration", "-of", "json", path],
                         capture_output=True, text=True).stdout
    d = json.loads(out)
    s = d["streams"][0]
    return s["width"], s["height"], float(d["format"]["duration"])


def transcribe(path, lang, model):
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device="cpu", compute_type="int8")
    segs, info = m.transcribe(path, word_timestamps=True, language=lang, vad_filter=True,
                              initial_prompt=os.environ.get("D5_PROMPT") or None)
    words = []
    for s in segs:
        for w in s.words:
            words.append({"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3),
                          "prob": round(w.probability, 2)})
    return words, info.language


def silences(path, min_len=0.5):
    """Khoảng im THẬT đo trên sóng âm (Whisper hay kéo dài đuôi từ qua chỗ im nên không tin được).
    Ngưỡng tương đối theo độ to trung bình để chạy được cả nơi ồn (mưa, gió)."""
    vd = subprocess.run(["ffmpeg", "-i", path, "-map", "0:a:0", "-af", "volumedetect", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    import re
    m = re.search(r"mean_volume: (-?[\d.]+) dB", vd)
    thr = (float(m.group(1)) - 9) if m else -35
    thr = max(-50, min(thr, -25))
    r = subprocess.run(["ffmpeg", "-i", path, "-map", "0:a:0", "-af", f"silencedetect=n={thr}dB:d={min_len}",
                        "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", r)]
    en = [float(x) for x in re.findall(r"silence_end: (-?[\d.]+)", r)]
    return list(zip(st, en)), thr


def keep_ranges(sil, dur):
    """Bỏ các khoảng im, mỗi chỗ để lại GAP_KEEP (chia đôi 2 bên) cho nhịp thở tự nhiên."""
    ranges, cur = [], 0.0
    for s, e in sil:
        s, e = max(0.0, s), min(dur, e)
        if e - s <= GAP_KEEP + 0.05:
            continue
        cut_s, cut_e = s + GAP_KEEP / 2, e - GAP_KEEP / 2
        if cut_s > cur:
            ranges.append((round(cur, 3), round(cut_s, 3)))
        cur = cut_e
    if dur - cur > 0.05:
        ranges.append((round(cur, 3), round(dur, 3)))
    return ranges or [(0.0, dur)]


def remap(words, ranges):
    """Dời mốc từng từ sang timeline đã cắt; mốc rơi vào chỗ bị cắt thì kẹp về mép gần nhất."""
    def m(t):
        off = 0.0
        for s, e in ranges:
            if t < s:
                return off
            if t <= e:
                return off + t - s
            off += e - s
        return off
    res = []
    for w in words:
        s, e = m(w["start"]), m(w["end"])
        inside = any(a <= w["start"] <= b or a <= w["end"] <= b for a, b in ranges)
        if e - s < 0.04 and not inside:  # CHỈ bỏ từ nằm trọn trong đoạn bị cắt (tạp âm Whisper nghe nhầm);
            continue                      # từ thật nhưng Whisper ghi độ dài ~0 thì phải GIỮ (lỗi mất 10 từ ở video 10)
        if e - s < 0.04:
            e = s + 0.04
        res.append({**w, "start": round(s, 3), "end": round(e, 3)})
    return res, round(sum(e - s for s, e in ranges), 3)


def face_center_x(path, w, h):
    """Tâm mặt theo chiều ngang (0..1), trung vị trên vài khung. Không có mediapipe → 0.5."""
    try:
        import cv2, mediapipe as mp
    except Exception:
        return 0.5
    cap = cv2.VideoCapture(path)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    xs = []
    with mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5) as fd:
        for i in range(12):
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(n * (i + 0.5) / 12))
            ok, fr = cap.read()
            if not ok:
                continue
            r = fd.process(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB))
            if r.detections:
                b = r.detections[0].location_data.relative_bounding_box
                xs.append(b.xmin + b.width / 2)
    cap.release()
    xs.sort()
    return xs[len(xs) // 2] if xs else 0.5


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--lang", default=None, help="vi / en ... (bỏ trống = tự nhận)")
    ap.add_argument("--model", default="medium")
    ap.add_argument("--job", default=None)
    ap.add_argument("--no-cut", action="store_true", help="không cắt lặng")
    a = ap.parse_args()

    src = os.path.abspath(a.video)
    job = a.job or os.path.splitext(os.path.basename(src))[0][:40].replace(" ", "-")
    jd = os.path.join(ROOT, "public", "_jobs", job)
    os.makedirs(jd, exist_ok=True)
    w, h, dur = probe(src)
    print(f"[1/4] nguồn {w}x{h} {dur:.1f}s → job {job}")

    raw = os.path.join(jd, "raw_words.json")  # cache: chạy lại không phải nhận lời lại
    if os.path.exists(raw) and json.load(open(raw, encoding="utf8")).get("source") == src:
        c = json.load(open(raw, encoding="utf8"))
        words, lang = c["words"], c["lang"]
    else:
        words, lang = transcribe(src, a.lang, a.model)
        json.dump({"source": src, "lang": lang, "words": words}, open(raw, "w", encoding="utf8"), ensure_ascii=False)
    print(f"[2/4] nhận lời: {len(words)} từ, ngôn ngữ {lang}")

    if a.no_cut:
        ranges = [(0.0, dur)]
    else:
        sil, thr = silences(src)
        ranges = keep_ranges(sil, dur)
        print(f"      ngưỡng im {thr:.0f} dB, {len(sil)} khoảng im")
    cut_words, new_dur = remap(words, ranges)
    print(f"[3/4] cắt lặng: {dur:.1f}s → {new_dur:.1f}s ({len(ranges)} đoạn)")

    # crop dọc 9:16 bám mặt
    target = 9 / 16
    if abs(w / h - target) < 0.01:
        crop = "scale=1080:1920"
    elif w / h > target:
        cw = int(h * target) // 2 * 2
        cx = face_center_x(src, w, h)
        x = int(min(max(cx * w - cw / 2, 0), w - cw))
        crop = f"crop={cw}:{h}:{x}:0,scale=1080:1920"
    else:
        ch = int(w / target) // 2 * 2
        crop = f"crop={w}:{ch}:0:{(h - ch) // 2},scale=1080:1920"
    grade = "eq=contrast=1.06:brightness=0.01:saturation=1.05:gamma=1.02,colorbalance=rs=0.03:gs=0.005:bs=-0.03,unsharp=5:5:0.45"

    parts, n = [], len(ranges)
    for i, (s, e) in enumerate(ranges):
        parts.append(f"[0:v]trim={s}:{e},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={s}:{e},asetpts=PTS-STARTPTS[a{i}];")
    fc = "".join(parts) + "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[vc][ac];[vc]fps=30,{crop},{grade},setsar=1[vo]"
    out = os.path.join(jd, "cut.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex", fc, "-map", "[vo]", "-map", "[ac]",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", out], check=True)
    _, _, real = probe(out)
    json.dump({"job": job, "source": src, "lang": lang, "durationSec": round(real, 3), "ranges": ranges,
               "words": cut_words}, open(os.path.join(jd, "words.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print(f"[4/4] xong: {out} ({real:.2f}s)\n      words: {os.path.join(jd, 'words.json')}")
    print("      → Claude đọc words.json, sửa chính tả, viết plan.json vào cùng thư mục, rồi chạy scripts/render.py", job)


if __name__ == "__main__":
    sys.exit(main())
