"""Dạng 4 "Mono Bold" — BƯỚC 3: render từ plan.json.

python scripts/render.py <job> [--music the-rain] [--music-db -12] [--no-sfx] [--out duong-dan.mp4]

Đọc public/_jobs/<job>/plan.json (Claude viết) → Remotion dựng hình (câm) → ffmpeg trộn:
  giọng (loudnorm -14 LUFS) + nhạc nền duck theo giọng + SFX nhẹ tự sinh theo plan
Ra: public/_jobs/<job>/final.mp4 (hoặc --out). Bản xuất NHẸ (~4,5 Mbps, ~35MB/phút) theo anh Phong dặn 04/10.
"""
import argparse, json, os, subprocess, sys, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")


def sfx_events(plan):
    """Âm tiết chế: 1 tiếng lướt rất nhỏ khi THẺ TRẮNG trồi từ đáy,
    1 tiếng lướt sớm 0,15s trước mỗi lần cháy đỏ-cam (đo từ kênh mẫu)."""
    ev = [(s_["from"], "swoosh-soft.mp3", -22) for s_ in plan.get("scenes", [])
          if s_.get("kind") == "card" and s_.get("tone") == "white" and s_.get("enter", "wipe") == "wipe"]
    ev += [(max(0.0, lk["t"] - 0.15), "swoosh-soft.mp3", -20) for lk in plan.get("leaks", [])]
    return sorted(ev)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("job")
    ap.add_argument("--music", default=None, help="tên file trong public/music (không .mp3); mặc định lấy theo plan hoặc the-rain")
    ap.add_argument("--music-db", type=float, default=None)
    ap.add_argument("--no-sfx", action="store_true")
    ap.add_argument("--skip-video", action="store_true", help="dùng lại _video.mp4 đã dựng (khi bước dựng hình xong nhưng trộn âm lỗi)")
    ap.add_argument("--out", default=None)
    a = ap.parse_args()

    jd = os.path.join(PUB, "_jobs", a.job)
    plan = json.load(open(os.path.join(jd, "plan.json"), encoding="utf8"))
    plan.setdefault("video", f"_jobs/{a.job}/cut.mp4")
    if "durationSec" not in plan:
        plan["durationSec"] = json.load(open(os.path.join(jd, "words.json"), encoding="utf8"))["durationSec"]
    # kiểm plan: thẻ trắng không được để giấy trống >0,4s ở đầu thẻ
    for c in plan.get("cards", []):
        first = min((b["t"] for b in c.get("beats", [])), default=c["to"])
        if first - c["from"] > 0.4:
            print(f"  ⚠ thẻ {c['from']:.2f}s: giấy trống {first - c['from']:.1f}s trước beat đầu — nên dời beat đầu về đầu thẻ")
    props = os.path.join(jd, "_props.json")
    json.dump(plan, open(props, "w", encoding="utf8"), ensure_ascii=False)

    silent = os.path.join(jd, "_video.mp4")
    print("[1/2] Remotion dựng hình…")
    npx = shutil.which("npx") or "npx"
    if not (a.skip_video and os.path.exists(silent)):
        for attempt in (1, 2, 3):   # mạng đổi giữa chừng (ERR_NETWORK_CHANGED) làm hỏng lượt dựng → thử lại
            r = subprocess.run([npx, "remotion", "render", "src/index.ts", plan.get("comp", "dang4"), silent, f"--props={props}",
                    "--muted", "--codec=h264", "--crf=16", "--concurrency=50%", "--log=error"], cwd=ROOT)
            if r.returncode == 0:
                break
            print(f"  ⚠ dựng hình lỗi lần {attempt}, thử lại…")
        else:
            raise SystemExit("Remotion dựng hình lỗi 3 lần")

    print("[2/2] Trộn âm thanh…")
    music = a.music or plan.get("music", {}).get("name") or "the-rain"
    mdb = a.music_db if a.music_db is not None else plan.get("music", {}).get("gainDb", -12)
    dur = plan["durationSec"]
    # plan.music.mute = [[a, b], ...]: tắt nhạc nền trong các khoảng (vd đoạn chèn video có nhạc riêng), vào/ra mềm 0,4s
    mute = ""
    for a0, b0 in plan.get("music", {}).get("mute", []):
        mute += (f",volume='if(between(t,{a0 - 0.4},{b0 + 0.4}),"
                 f"max(0,min(1,max(({a0}-t)/0.4,(t-{b0})/0.4))),1)':eval=frame")
    cut = os.path.join(jd, "cut.mp4")
    mstart = float(plan.get("music", {}).get("startAt", 0))
    mfade = float(plan.get("music", {}).get("fadeIn", 0.8))
    mduck = plan.get("music", {}).get("duck", "deep")
    mout = float(plan.get("music", {}).get("fadeOut", 1.2))
    no_music = bool(plan.get("music", {}).get("none"))   # plan.music.none = true → KHÔNG thêm nhạc nền
    if no_music:
        inputs = ["-i", silent, "-i", cut, "-f", "lavfi", "-t", str(dur), "-i", "anullsrc=r=48000:cl=stereo"]
    else:
        inputs = ["-i", silent, "-i", cut, "-stream_loop", "3", "-i", os.path.join(PUB, "music", music + ".mp3")]
    # Dạng 3 (duck light): giọng lọc ù <85Hz + nén nhẹ cho dày và đều; nhạc khoét −4 dB quanh 2,5 kHz để giọng "ngồi" lên trên
    vpre = "highpass=f=85,acompressor=threshold=0.09:ratio=2.6:attack=8:release=140:makeup=1.6," if mduck == "light" else ""
    meq = ",equalizer=f=2500:t=q:w=1.1:g=-4,equalizer=f=70:t=q:w=0.9:g=1.5" if mduck == "light" else ""
    fc = [f"[1:a]{vpre}loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000,asplit=2[voice][sc]",
          # nhạc: loop HỮU HẠN + cắt đúng độ dài, fade đầu/cuối, duck theo giọng
          # startAt = bỏ N giây đầu bài nhạc để PHÁCH rơi đúng mốc chuyển cảnh (Dạng 3); fadeIn ngắn nếu plan đặt
          f"[2:a]atrim={mstart}:{mstart + dur},asetpts=PTS-STARTPTS,aresample=48000,volume={mdb}dB{meq},afade=t=in:d={mfade},afade=t=out:st={max(0, dur - mout)}:d={mout}{mute}[mraw]",
          # duck: 'light' (Dạng 3 — nhạc là nhân vật, chỉ lùi nhẹ dưới giọng) | mặc định sâu (Dạng 1)
          f"[mraw][sc]sidechaincompress=threshold={'0.05:ratio=2.2:attack=20:release=260' if mduck == 'light' else '0.03:ratio=6:attack=15:release=350'}[music]"]
    mix = ["[voice]", "[music]"]
    if not a.no_sfx:
        explicit = "sfx" in plan
        evs = ([(e["t"], e["file"], e.get("db", -14)) for e in plan["sfx"]] if explicit else sfx_events(plan))
        for i, (t, f, db) in enumerate(evs):
            inputs += ["-i", os.path.join(PUB, f) if explicit else os.path.join(PUB, "sfx", f)]
            idx = 3 + i
            ms = int(max(0, t) * 1000)
            fc.append(f"[{idx}:a]aresample=48000,volume={db}dB,adelay={ms}|{ms}[s{i}]")
            mix.append(f"[s{i}]")
    fc.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0:duration=first,alimiter=limit=0.95[aout]")
    out = a.out or os.path.join(jd, "final.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-maxrate", "5M", "-bufsize", "10M", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "160k", "-t", str(dur), "-movflags", "+faststart", out], check=True)
    # dọn file trung gian (anh Phong dặn: chỉ giữ thành phẩm + plan/words, đỡ nặng máy)
    for f in (silent, props):
        try:
            os.remove(f)
        except OSError:
            pass
    print("XONG:", out)


if __name__ == "__main__":
    sys.exit(main())
