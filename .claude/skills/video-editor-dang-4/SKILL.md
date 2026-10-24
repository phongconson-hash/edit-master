---
name: video-editor-dang-4
description: Dạng 4 "MONO BOLD" — edit video talking-head kiểu reel chuyên gia/coach, Claude là đạo diễn. Kích hoạt khi người dùng nói "edit Dạng 4", "làm Dạng 4", "edit kiểu trắng đen", "edit giống reel chuyên gia", "thẻ trắng thẻ đen", "chữ đậm trắng bóng đổ", hoặc đưa video người nói mà không nói dạng nào (Dạng 4 là dạng mặc định). Đặc trưng - cận mặt bộ lọc ấm + làm nét nhân vật; chữ Inter trắng đậm 2 tầng đặt thấp; b-roll đời thật phủ kín hoặc màn hình đặt khung giữa; thẻ TRẮNG chữ đen / thẻ ĐEN chữ trắng cho câu chốt; chuyển cảnh cháy đỏ-cam tối đa 2 lần; màn hình iPhone giả lập khi nói tới nhập câu lệnh; THANG XẾP HẠNG + KHUNG SO SÁNH + LOGO công cụ cho video đánh giá; nhạc nền rất nhỏ.
---

# Video Editor — DẠNG 4 "Mono Bold" (bản đầy đủ, 24/10/2026)

## Vai trò
Claude = đạo diễn: nghe lời → soát lời → chia cảnh (mặt / b-roll / thẻ / điện thoại / thang / so sánh) → viết chữ 2 tầng → chọn câu chốt lên thẻ → `plan.json`. Máy (`dang5-studio/`) thi hành.

## Công cụ — thư mục `dang5-studio/`
| Lệnh | Làm gì |
|---|---|
| `python scripts/prepare.py <video> --job <ten>` | Nhận lời (faster-whisper, mốc từng từ) + cắt lặng → `cut.mp4`, `words.json` |
| `python scripts/trim_gaps.py <job> --min 0.55 --chua 0.28` | Cắt thêm khoảng nghỉ còn dài (nếu có) — chạy TRƯỚC grade |
| `python scripts/grade.py <job> --manh 0.85 --net 1.0` | Bộ lọc màu `mint-warm` + làm nét nhân vật → `cut_graded.mp4` |
| `python scripts/do_mat.py <job>` | Đo vị trí mặt (đỉnh đầu · tâm · cằm) → đặt khung và chữ cho đúng. Cần `pip install mediapipe opencv-python` |
| `python scripts/render.py <job>` | Dựng `plan.json` → `final.mp4` (chạy nền nếu video > 2 phút) |
| `npx remotion still src/index.ts dang4 out.png --props=public/_jobs/<job>/_props.json --frame=N` | Soi 1 khung trước khi dựng cả video. Nhớ chép `plan.json` → `_props.json` trước mỗi lần (render.py xoá file này khi xong) |

Composition **`dang4`** (`src/Dang4Mono.tsx`), plan phải có `"comp": "dang4"`, `"graded": true` khi dùng `cut_graded.mp4`.
Phông Inter · hạt phim `tex/grain.png` · nhạc `wholesome` (Kevin MacLeod, CC BY 4.0 — đăng video phải ghi tên tác giả) · logo công cụ ở `public/logos/`.

## Các loại cảnh (`scenes`, nối liền nhau không hở)
| `kind` | Dùng khi | Ghi chú |
|---|---|---|
| `talk` | Người nói | `scale` 1,0 ↔ 1,06–1,10 đổi giữa các cảnh (không zoom trượt); `anchorY` |
| `broll` | Clip DỌC đời thật phủ kín 9:16 | `file`, `pos` |
| `photo` | Ảnh hoặc **clip màn hình 16:9** đặt khung giữa ~2/3, nền chính nó làm mờ | `file`, `w` (0,68–0,97). Clip ngang dùng cái này, đừng phủ kín (mất chữ màn hình) |
| `card` | Câu chốt | `tone` white/black, `small`, `big`, `tBig`, `order`. Thẻ trắng trồi từ đáy, thẻ đen cắt thẳng |
| `phone` | Nói tới **nhập câu lệnh** cho AI | iPhone 18 Pro + app ChatGPT: câu lệnh gõ dần, bấm gửi, nhận trả lời. `prompt`, `typeAt`, `send`, `tReply`, `reply` hoặc `replyPic`, `pics` (ảnh đính kèm), `logo` (đổi app). Bàn phím luôn hiện |
| `ladder` | **Thang xếp hạng** — video đánh giá/xếp hạng | `level` = bậc đang nói (0 = tổng quan), `tLevel` = mốc bậc sáng lên, `title` ghi đè. Nội dung thang ở `plan.ladder` |
| `compare` | **Khung so sánh** công cụ | `label`, `title`, `items:[{file,name,note,t}]`, `pick` + `tPick` (cái được chọn sáng trắng + nhãn cam), `pickText`. Không `pick` = ngang nhau |

Cảnh `card`, `phone`, `ladder`, `compare` phủ kín → không có chữ chạy, không có logo nhỏ trong lúc đó.

## Lớp phủ
- **`captions`** — chữ 2 tầng: `lead` (dòng nhỏ ≤26 ký tự) + `punch` (cụm to ≤13 ký tự), `leadT`, `punchT`, `y`, `shade` (bóng sau chữ: 0,4 mặc định · 0,5 áo xám · 0,62 áo TRẮNG). Cả cụm bật một lần, KHÔNG màu nhấn, KHÔNG hiện từng từ.
- **`logos`** — nhắc tới công cụ nào thì logo thật hiện **nhỏ, tinh tế** ở đỉnh khung (`y≈0,115`): `{from, to, file, name, sub}`. Nhiều logo cùng lúc tự xếp hàng ngang.
- **`ladder`** — `{label, rungs:[{name, note, logos:[{file, t}]}]}`. **Bậc 1 nằm DƯỚI, bậc cao nhất TRÊN.** Bậc đã qua hiện lời đánh giá + logo (logo chỉ hiện khi `t ≥ logo.t`).
- **`leaks`** — chuyển cảnh **cháy đỏ-cam** `[{t, kind:"warm"}]`: CHỈ ở mốc chuyển phần lớn hoặc ngay trước đoạn quan trọng, **tối đa 2 lần/video**.
- `lists`, `title` (tiêu đề ghim) — có sẵn, ít dùng.

## ★ Luật bắt buộc
1. **Khung an toàn TikTok.** Chữ chạy rộng tối đa 880px, chữ thẻ 920px — renderer tự thu cỡ theo BỀ NGANG THẬT (`beRong` / `fitW`, chữ HOA rộng hơn chữ thường ~27%). Cột nút phải ~170px, dưới ~300px, trên ~120px: đừng đặt chữ dưới `y = 0,90` hay trên `0,08`; thang và so sánh nằm trong `x 70…890`.
2. **Khung mặt phải CHUẨN, chữ KHÔNG che mặt.** Chạy `do_mat.py` mỗi video: chữ chạy đặt dưới cằm thấp nhất (+0,13), tiêu đề/logo trên đỉnh đầu. Mỗi video người quay ngồi xa gần khác nhau — đừng đoán theo video cũ. Phóng khung nhẹ thôi (≤1,06) khi người ngồi gần máy.
3. **B-roll phải là CLIP ĐỘNG, không lấy ảnh tĩnh.** Cắt đoạn vừa không đổi cảnh vừa có thao tác thật (dò độ lệch giữa 2 khung liền nhau ở 2 fps: đỉnh < 9 = không đổi cảnh, trung bình > 0,45 = có chuyển động). Clip màn hình: crop vào vùng nội dung, bỏ thanh taskbar / chữ chìm "Activate Windows". Ô facecam trong clip nguồn phải tròn vẹn hoặc cắt hẳn.
4. **Video người dùng đã tự ghép màn hình sẵn** (soi khung trước): đoạn đó KHÔNG chèn b-roll/điện thoại, giữ `scale 1.0`, hạ chữ xuống dưới khung màn hình (~0,82–0,88), thẻ chỉ đặt ở đoạn thấy mặt.
5. **Soát lời kỹ.** Whisper hay sai tên riêng (Claude → "Cloud", ChatGPT → "ChartBt", MCP → "MCB", Seedance → "CDN", Kling → "Carling", Higgsfield → "Hit View", vibe coding → "vai cố định"). Nghe lại chỗ nghi ngờ (cắt wav, có thể chậm 0,8×), đừng dùng `initial_prompt` liệt kê tên công cụ (Whisper sẽ bịa lại đúng danh sách đó). Một từ kéo dài > 1,5s hoặc ≥ 3 từ chung một mốc = Whisper bỏ sót / nhồi lời → đo âm lượng rồi nghe lại.
6. **Giữ chỗ người nói lặp để nhấn mạnh**; chỉ cắt lặng và đoạn vấp thật. Soi riêng 20–30s cuối xem có đuôi thừa.
7. **Nhịp chậm, đọng**: mỗi vế chữ ≥ 1,2s (ưu tiên 1,5–3s), b-roll ≥ 2,6s, thẻ ≥ 2,5s. Khung so sánh đừng mở trước khi nhắc mục đầu tiên quá ~1,5s.
8. **Âm thanh**: nhạc `wholesome` −11 đến −12 dB, duck sâu; SFX tự sinh (1 lướt khi thẻ trắng trồi, 1 lướt trước mỗi lần cháy). Thành phẩm ≈ −14 LUFS.

## Quy trình
1. `prepare.py` → đọc `words.json` toàn bộ: sửa chính tả, tìm từ bị nhồi/kéo dài, nghe lại tên công cụ.
2. (Tuỳ) `trim_gaps.py` → `grade.py --manh 0.85 --net 1.0` → `do_mat.py`.
3. Soi khung nguồn (1 khung/10s): có màn hình tự ghép không, áo màu gì (chọn `shade`).
4. Viết `public/_jobs/<job>/make_plan.py`: sinh `plan.json` + tự soát (cảnh hở, chữ đè thẻ/thang/so sánh, logo bị che, thiếu file, clip ngắn hơn cảnh, cỡ chữ sau khi thu).
5. Soi 6–8 khung tĩnh ở các thành phần mới → sửa → `render.py`.
6. Kiểm thành phẩm: tấm ghép 1 khung/9–10s, âm lượng `loudnorm`, nghe lại bằng Whisper so với `words.json` (lệch khối > 2 từ = có vấn đề).
7. Nếu một lần dựng chạy quá ~2× thời lượng bình thường mà không ra file → dừng tiến trình (`taskkill /T` theo PID của render.py) rồi chạy lại.

## Schema `plan.json` (rút gọn)
```json
{ "comp": "dang4", "video": "_jobs/<job>/cut_graded.mp4", "graded": true, "durationSec": 94.2, "softCut": 5,
  "scenes": [
    {"kind": "talk", "from": 0, "to": 6.6, "anchorY": 0.3, "scale": 1.0},
    {"kind": "card", "from": 6.6, "to": 10.2, "tone": "black", "small": "cả năm 2026", "big": "MẤT TIỀN", "tBig": 7.5},
    {"kind": "photo", "from": 29.5, "to": 35.8, "file": "broll/man-hinh.mp4", "w": 0.97},
    {"kind": "phone", "from": 35.8, "to": 41.1, "prompt": "Bật trình duyệt giúp tôi", "typeAt": 36.4, "send": 39.1, "tReply": 39.7, "reply": "Đã bật trình duyệt."},
    {"kind": "ladder", "from": 41.1, "to": 44.0, "level": 2},
    {"kind": "compare", "from": 44.0, "to": 48.0, "label": "VIDEO AI", "title": "SEEDANCE vs KLING",
     "items": [{"file": "logos/seedance.svg", "name": "Seedance", "note": "Top 1"}, {"file": "logos/kling.png", "name": "Kling"}],
     "pick": 0, "tPick": 46.5} ],
  "captions": [{"from": 0.2, "to": 2.6, "y": 0.72, "shade": 0.5, "lead": "Một nhân viên AI", "leadT": 0.2, "punch": "vừa mang về 540 đô", "punchT": 0.95}],
  "logos": [{"from": 12.0, "to": 18.5, "file": "logos/chatgpt.png", "name": "GPT Image 2.5", "sub": "OpenAI"}],
  "ladder": {"label": "XẾP HẠNG", "rungs": [{"name": "TẠO ẢNH", "note": "Dễ bắt đầu nhất", "logos": [{"file": "logos/chatgpt.png", "t": 12.0}]}, {"name": "VIDEO AI"}]},
  "leaks": [{"t": 6.6, "kind": "warm"}],
  "music": {"name": "wholesome", "gainDb": -11, "fadeIn": 0.4, "fadeOut": 1.2} }
```

## Bẫy đã gặp
- `render.py` xoá `_props.json` khi xong → chép lại `plan.json` trước mỗi lần soi khung.
- `transform: translateY` không đổi bố cục → muốn một khối co giãn thật thì đổi chiều cao, đừng dịch.
- Lệnh bash có heredoc chứa tiếng Việt hay vỡ → viết script ra file rồi chạy.
- Dò cảnh bằng `select='gt(scene,N)'` của ffmpeg trả về 0 kết quả với video quay màn hình → tự tính độ lệch khung.
- TikTok chặn yt-dlp thường → `pip install curl_cffi` rồi thêm `--impersonate chrome`.
