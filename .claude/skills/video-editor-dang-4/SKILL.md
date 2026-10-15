---
name: video-editor-dang-4
description: Dạng 4 — edit talking-head kiểu "MONO BOLD" (reel chuyên gia/coach: cận mặt lọc ấm, chữ trắng đậm 2 tầng, thẻ trắng–đen) của anh Phong, Claude là đầu não. Kích hoạt khi anh nói "edit Dạng 4", "làm Dạng 4", "edit kiểu trắng đen", "edit giống kênh reel chuyên gia", "thẻ trắng thẻ đen", "chữ đậm trắng bóng đổ". Đặc trưng - (1) cận mặt + BỘ LỌC ẤM mềm (bão hoà thấp, tối 4 góc, hạt phim), (2) chữ Inter đậm trắng 2 tầng đặt thấp ~70% khung, cả cụm bật một lần, bóng đổ mềm, KHÔNG màu nhấn, (3) B-ROLL đời thật phủ kín màn hình minh hoạ câu nói, (4) THẺ TRẮNG chữ đen / THẺ ĐEN chữ trắng toàn màn cho câu chốt, thẻ trắng trồi từ đáy, (5) nhạc nền êm RẤT NHỎ, gần như không SFX. Khác Dạng 1 (đỏ-trắng, thẻ giấy), Dạng 2 (hồng kể chuyện), Dạng 3 (mint, nhạc to, nhiều SFX). TUYỆT ĐỐI KHÔNG XOÁ skill này.
---

# Video Editor — DẠNG 4 "Mono Bold"

> ⛔ **KHÔNG XOÁ SKILL NÀY.** (Skill "video-editor-dang-4" kiểu CŨ của app Clipsale đã bỏ 10/10/2026 — đây là Dạng 4 MỚI, tạo 13–14/10/2026.)
> Bóc tách 4 video kênh mẫu: [references/phan-tich-video-mau.md](references/phan-tich-video-mau.md) · khung mẫu (chỉ có ở bản nội bộ) · video + script đo ở `thư mục nghiên cứu trên máy chủ nhà\`
> Ví dụ plan: `dang5-studio/public/_jobs/d4-test/make_plan.py`

## Vai trò
Claude = đạo diễn: đọc lời → chia cảnh (mặt / b-roll / thẻ), viết chữ 2 tầng, chọn câu chốt lên thẻ, chọn b-roll đúng ý → `plan.json`. Máy thi hành.

## Công cụ — chung thư mục `dang5-studio\`
- `scripts/prepare.py` như các dạng khác. `src/Dang4Mono.tsx` = composition **`dang4`** (plan cần `"comp": "dang4"`). `scripts/render.py <job>` (chạy nền nếu video >2 phút).
- Phông: `public/fonts/Inter[opsz,wght].ttf`. Hạt phim: `public/tex/grain.png`.
- Nhạc mặc định: **`wholesome`** (Kevin MacLeod, CC BY 4.0 — nền êm, năng lượng dồn 150–800 Hz giống mẫu; đăng video phải ghi tên tác giả). `gainDb −11`, duck sâu (mặc định) → nhạc nằm ~13 dB dưới giọng như mẫu.
- B-roll: kho của anh (`python scripts/kho_broll.py tim …`). Dạng 4 cần clip ĐỜI THẬT, phủ kín 9:16 — clip ngang sẽ bị cắt hai bên, chọn clip có chủ thể ở giữa hoặc đặt `pos`.

## 5 trụ cột
1. **Mặt + bộ lọc ấm**: mọi cảnh quay qua `GRADE` (bão hoà 0,86, sepia 0,16, phủ ấm, tối góc 0,4, hạt 0,06). Đổi cỡ khung bằng `scale` giữa các cảnh nói (1,0 ↔ 1,10–1,12), không zoom mượt.
2. **Chữ 2 tầng trắng đậm**, `y` mặc định 0,70 (mặt thấp/đứng xa: 0,76). `lead` = dòng nhỏ (≤26 ký tự), `punch` = cụm to (≤13 ký tự, dài hơn renderer tự thu cỡ). Cả cụm bật một lần. KHÔNG khối màu, KHÔNG từng từ.
3. **B-roll phủ kín** cho câu tả bối cảnh/nỗi đau/bằng chứng; chữ vẫn chạy trên b-roll.
4. **Thẻ trắng/đen** cho câu chốt — `tone`, `small`, `big`, `tBig` (lúc cụm to hiện), `order`. Thẻ trắng mặc định `enter: "wipe"` (trồi từ đáy), thẻ đen `"cut"`. Hay đi cặp trắng→đen. Trên thẻ không có chữ chạy.
5. **Âm tiết chế**: nhạc rất nhỏ; SFX chỉ 1 tiếng lướt −22 dB khi thẻ trắng trồi lên (plan tự sinh).

## ✨ TIA SÁNG CHUYỂN CẢNH + DA ĐẸP (anh hỏi 14/10 — đã thêm vào bộ dựng)
- **Tia sáng** (`leaks: [{t, kind}]`): kênh mẫu dùng ở 1–2 mốc cắt QUAN TRỌNG mỗi video (thường ngay sau hook, giây 3–6; đôi khi lúc đổi người nói), KHÔNG dùng ở mọi lần cắt — reel A không có lần nào. Dài ~11 khung: sáng dần 4–5 khung → trắng gần kín đúng mốc cắt → tan 5–6 khung. 2 kiểu: `prism` (luồng sáng trắng tràn từ trái, mép cầu vồng — reel C 5,4s, D 2,8s) và `warm` (cháy đỏ→cam→trắng — video B 5,5s, 19,1s). Kèm 1 tiếng lướt nhẹ −20 dB sớm 0,15s. Tối đa 2 lần/video.
- **Da đẹp, trong**: mẫu = (1) ánh sáng mềm chiếu thẳng mặt (cửa sổ/đèn vòng), (2) làm mịn da kiểu beauty/retouch của app quay hoặc CapCut — lỗ chân lông và nếp nhỏ mất nhưng mắt, môi, gọng kính vẫn nét, (3) nhấc sáng vùng da + màu ấm nhạt. Em chỉ suy được từ hình, không biết chính xác họ dùng app nào.
  → `python scripts/beauty.py <job> [--strength 1.0]` tạo `cut_beauty.mp4` (bilateral 2 lượt giữ viền + trộn 25% gốc + nhấc trung tính + làm nét nhẹ); plan đặt `"video": "_jobs/<job>/cut_beauty.mp4"`. Chỉ có tác dụng rõ khi anh quay CẬN MẶT; đừng tăng strength >1,2 (da nhựa). Lời khuyên khi quay: mặt hướng về nguồn sáng mềm, đừng để đèn trần chiếu từ trên xuống.
- ★★ **ANH CHỐT 14/10 (luật hiện hành):** (1) cháy đỏ-cam CHỈ dùng ở mốc chuyển cảnh lớn hoặc ngay trước đoạn quan trọng — không rải đều, tối đa ~2 lần/video; (2) **LÀM MỊN DA: anh tự làm ở CapCut** → KHÔNG chạy `beauty.py`, plan dùng thẳng `cut.mp4`. Chỉ chạy `beauty.py` khi anh nói rõ video chưa qua CapCut và nhờ làm.
- ★ **Anh chốt 14/10: hiệu ứng anh muốn là CHÁY ĐỎ-CAM** → `kind` mặc định = `"warm"` (đã chỉnh cho khớp mẫu: nhuộm đỏ thẫm → cam đậm 5 khung, vàng-trắng kín ở mốc cắt, lùi qua cam ~8 khung). `prism` chỉ dùng khi anh yêu cầu.
- `beauty.py` là làm mịn TOÀN KHUNG (không nhận diện mặt): vải, tóc tơ, chữ nhỏ ở hậu cảnh cũng mềm đi chút; không xoá mụn riêng lẻ, không chỉnh dáng mặt. Anh đã retouch bằng CapCut/app quay thì KHÔNG chạy beauty nữa (hai lần = da nhựa).
- Demo: `_jobs/d4-da/` (6 giây cận mặt: da đã làm mịn + 1 tia sáng prism). Tia sáng bản hiện tại thiên về chớp trắng, dải cầu vồng còn nhạt hơn mẫu.

## 🎨 BỘ LỌC MÀU HỌC TỪ VIDEO MẪU + CHUYỂN CẢNH MƯỢT (anh yêu cầu 14/10: "chỉnh cho độ đẹp… bộ lọc, da, chuyển cảnh mượt")
- **Dựng bộ lọc từ bất kỳ video mẫu nào**: `python scripts/make_lut.py <video-mau> <ten> [--mocs <giây,giây,…>] [--manh 0.85] [--sat 0.84]`
  → `public/luts/<ten>.cube`. Cách làm: lấy CHẤT MÀU (độ lệch R/G/B theo từng mức sáng, tính theo phân vị) chứ KHÔNG lấy độ sáng của mẫu — copy cả độ sáng thì video quay ban ngày sẽ tối om. `--mocs` nên trỏ vào các giây CẢNH NÓI của mẫu, tránh thẻ trắng/nền màu.
- **Đã có `mint-warm`** (học từ reel mẫu Dạng 3 — anh chỉ đúng video này 14/10: "bộ lọc phải đẹp như video này"). Kiểm chứng trên video anh: bão hoà 0,300 (mẫu 0,291) · vùng sáng ấm R−B +0,175 (mẫu +0,197) · độ sáng gốc giữ nguyên.
- **Áp vào job**: `python scripts/grade.py <job> [--lut mint-warm] [--manh 1.0]` → `cut_graded.mp4` (tự lấy `cut_beauty.mp4` nếu có). Plan đặt `"video": "_jobs/<job>/cut_graded.mp4"` và **`"graded": true`** để renderer tắt lớp chỉnh màu CSS (không chồng 2 lần màu).
- **Chuyển cảnh mượt**: `"softCut": 5` (số khung hoà hình giữa 2 cảnh, mặc định 5, kèm nhoè nhẹ + phóng 2%). `0` = cắt thẳng như kênh mẫu. Không áp cho thẻ (thẻ vẫn trồi/cắt như cũ) và không thay thế cháy đỏ-cam.
- Demo: `_jobs/d4-loc/final.mp4` (14 giây: bộ lọc + 2 lần hoà cảnh + cháy đỏ-cam) · so sánh màu: `Pictures/DANG 4 - so sanh BO LOC truoc-sau.jpg`.

## Nhịp — theo anh Phong, CHẬM hơn mẫu (xem [[feedback-dang3-chu-cham-canh-dai]])
Mẫu: cụm chữ 0,5–1,5s, cảnh ~3,7s. Với anh: **mỗi vế chữ ≥1,2s (ưu tiên 1,5–3s), b-roll ≥3,5s, thẻ ≥2,5s**; gộp vế đệm. `make_plan.py` in độ dài cảnh và vế chữ để soát trước khi dựng.

## Schema `plan.json`
```json
{ "comp": "dang4", "video": "_jobs/<job>/cut.mp4", "durationSec": 52.8,
  "scenes": [
    {"kind": "talk", "from": 0, "to": 5.5, "anchorY": 0.3, "scale": 1.0},
    {"kind": "broll", "from": 5.5, "to": 9.5, "file": "broll/x.mp4", "pos": "50% 40%"},
    {"kind": "card", "from": 11.3, "to": 13.3, "tone": "white", "small": "tối ưu tất cả công việc", "big": "đẩy lên online", "tBig": 12.6},
    {"kind": "card", "from": 13.3, "to": 17.5, "tone": "black", "small": "…", "big": "…", "order": "big-small"} ],
  "captions": [ {"from": 0, "to": 3.0, "y": 0.70, "lead": "Bây giờ Phong vẫn đang cầm", "leadT": 0.0, "punch": "chiếc điện thoại", "punchT": 1.3} ],
  "lists": [ {"from": 6, "to": 12, "title": "3 bước chính:", "items": [{"t": 7.5, "text": "1. Tạo sản phẩm"}]} ],
  "title": {"text": "tiêu đề ghim trên đỉnh", "sub": "dòng nhỏ"},
  "graded": true, "softCut": 5,
  "grade": {"vignette": 0.4, "grain": 0.06},
  "leaks": [{"t": 5.5, "kind": "warm"}],
  "sfx": [{"t": 11.2, "file": "sfx3/swoosh.mp3", "db": -22}],
  "music": {"name": "wholesome", "gainDb": -11, "fadeIn": 0.4, "fadeOut": 1.0} }
```

## Quy trình
1. `prepare.py` → đọc lời, soi sót lời. **Rồi `grade.py <job>`** (bộ lọc màu) — da thì anh tự làm ở CapCut trước khi gửi.
2. Soi khung để đặt `anchorY`, `y`.
3. Chia cảnh: hook mặt → cụm b-roll → thẻ chốt → lặp → thẻ đúc kết/CTA.
4. `make_plan.py` → ≤10 khung tĩnh → `render.py`.
5. Tự kiểm 2 khung/giây, −14 LUFS, đủ lời.
6. Giao `OUTPUT/` + `Pictures/`, tên `… - DA EDIT Dang4.mp4`, ghi sổ, dọn file trung gian.

## Giới hạn / chưa làm
- Chưa có nét vẽ nguệch ngoạc động quanh đầu (reel D). ⚠️ Lần bóc tách đầu em SÓT tia sáng chuyển cảnh vì chỉ soi mốc cắt của reel A — học một kênh thì phải quét bừng sáng/chuyển cảnh trên MỌI video mẫu (script quét độ sáng trung bình từng khung). `lists` và `title` đã có trong renderer nhưng chưa dùng trong bản thử.
- Mẫu quay CẬN MẶT trong nhà đèn ấm; video anh quay xa/ngoài trời thì bộ lọc chỉ kéo gần được một phần. Áo sọc/nền rối: renderer có bóng mềm sau chữ.
- Em không nghe được nhạc: chọn `wholesome` bằng số đo (phổ + tempo ước lượng trùng mẫu). Không xác định được tên bài nhạc kênh mẫu dùng.

## Nhật ký
- **15/10/2026 — LẦN ĐẦU CHẠY TRÊN VIDEO THẬT** (video 22, quay thô 95,0s → 94,19s, chủ đề dùng Subagent miễn phí trên máy). ⚠️ Hai lỗi phải nhớ: (a) `render.py` sinh SFX theo cấu trúc plan **Dạng 1** nên vỡ ngay (`captions[].punch` ở Dạng 4 là CHUỖI, thẻ nằm trong `scenes` chứ không phải `cards`) → đã thêm nhánh riêng `if plan.get("comp")=="dang4"`: 1 lướt −22 dB khi thẻ TRẮNG trồi, 1 lướt −20 dB sớm 0,15s trước mỗi `leak`. (b) Anh quay **ÁO TRẮNG** — đo độ sáng 4 dải chữ đều 159–190/255, chữ trắng chìm → đã thêm `shade` cho từng caption trong `Dang4Mono.tsx` (mặc định 0,4; video này 0,62). Luôn đo dải chữ trước khi chọn `y`. (c) B-roll kho khớp chủ đề nhất (`sa_flow`, `sa_mcp`, `sa_edit`…) đều 1280×720 — Dạng 4 phủ kín 9:16 cắt còn 405px nên MẤT HẾT chữ màn hình → chỉ dùng clip DỌC đời thật (`pm_mo_laptop`, `pm_kenhyoutube`, `pm_maytinh`), ý 'màn hình' đẩy lên thẻ chữ to. Thông số: 26 cảnh (đổi cỡ khung 1,0↔1,10 mỗi 2–5s), 36 vế chữ ngắn nhất 1,30s, 4 thẻ xen trắng–đen, 3 b-roll ≥3,56s, 2 cháy đỏ-cam (9,8s hết hook · 57,4s sang phần mục đích), nhạc `wholesome` −11 dB. Kết quả 94,2s · 45MB · −14,3 LUFS · 458/458 từ. Bộ lọc dùng `grade.py --manh 0.85 --net 1.0` (có lớp làm nét nhân vật mới). Mẫu: `_jobs/video-22/make_plan.py`.
- **13–14/10/2026** — khởi tạo: tải 4 video kênh mẫu (2 anh gửi + 2 reel sát ngày), đo cắt cảnh/chữ/màu/âm, viết `Dang4Mono.tsx`, chọn nhạc `wholesome`, bản thử `d4-test` trên video hải đăng 52,8s (14 cảnh: 5 mặt · 5 b-roll · 4 thẻ; 21 vế chữ). ⚠️ Lệnh bash có heredoc chứa nhiều dấu nháy tiếng Việt hay lỗi → viết file bằng công cụ Write.
