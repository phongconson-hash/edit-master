# Cài đặt

## Bước 1 — Cài 3 phần mềm nền

| Phần mềm | Tải ở đâu |
|---|---|
| **Node.js** (bản LTS) | https://nodejs.org |
| **Python 3.11** | https://www.python.org/downloads — nhớ tích ô **"Add Python to PATH"** |
| **ffmpeg** | https://www.gyan.dev/ffmpeg/builds — lấy bản *release full*, giải nén rồi thêm thư mục `bin` vào PATH |

Mở cửa sổ dòng lệnh **mới**, chạy để kiểm tra — cả 3 phải ra số phiên bản:

```
node --version
python --version
ffmpeg -version
```

---

## Bước 2 — Chép đúng một lần, dán vào cửa sổ dòng lệnh

**Windows (PowerShell):**

```
git clone https://github.com/phongconson-hash/edit-master.git; cd edit-master\dang5-studio; npm install; pip install faster-whisper; cd ..; claude
```

**Mac / Linux:**

```
git clone https://github.com/phongconson-hash/edit-master.git && cd edit-master/dang5-studio && npm install && pip install faster-whisper && cd .. && claude
```

Lệnh này tải kho về, cài thư viện rồi mở Claude Code ngay tại thư mục đó. Skill nằm sẵn
trong `.claude/skills/` nên Claude tự đọc, không phải chép gì thêm.

> Lần đầu `npm install` tải khoảng 600 MB, hơi lâu. Lần sau không cần chạy lại.
> Chưa có Claude Code thì cài bằng: `npm install -g @anthropic-ai/claude-code`

---

## Bước 3 — Dựng video

Trong Claude Code, gõ:

```
edit Dạng 4 cho video này: D:\duong-dan\video.mp4
```

Claude sẽ tự nhận lời, cắt khoảng lặng, áp bộ lọc, viết kịch bản và dựng.
Thành phẩm nằm ở `dang5-studio/public/_jobs/<tên-job>/final.mp4`.

### Muốn tự chạy từng bước

```
cd dang5-studio
python scripts/prepare.py duong-dan-video.mp4 --job video-1
python scripts/grade.py video-1 --manh 0.85 --net 1.0
python scripts/render.py video-1
```

(Giữa bước 2 và 3, Claude đọc `public/_jobs/video-1/words.json` rồi viết `plan.json` —
xem mẫu trong `.claude/skills/video-editor-dang-4/SKILL.md`.)

Xem thử trong trình duyệt trước khi dựng:

```
npx remotion studio src/index.ts
```

---

## Lỗi hay gặp

| Báo lỗi | Cách xử lý |
|---|---|
| `ffmpeg: command not found` | Chưa thêm ffmpeg vào PATH — xem lại Bước 1 |
| `Repository not found` khi clone | Kho để riêng tư; trình duyệt phải đang đăng nhập tài khoản được cấp quyền |
| Nhận lời rất chậm lần đầu | Bình thường — đang tải mô hình nghe ~1,5 GB. Máy yếu thì thêm `--model small` |
| `ERR_NETWORK_CHANGED` | Mạng đổi giữa chừng. `render.py` tự thử lại 3 lần; vẫn lỗi thì chạy lại |
| `ffmpeg exited with code null` | Hết RAM — đóng bớt ứng dụng rồi chạy lại |

---

## Gói này có gì, không có gì

**Có:** bộ dựng Dạng 4, các script Python, phông Inter, hạt phim, bộ lọc màu `mint-warm`,
4 tiếng động, nhạc nền `wholesome`.

**Không có:** kho b-roll, logo thương hiệu, nhạc khác, và các dạng edit khác.
Muốn dùng b-roll thì bỏ clip vào `dang5-studio/public/broll/` rồi khai trong `plan.json`.

**Ghi nguồn:** nhạc `wholesome` của Kevin MacLeod, giấy phép CC BY 4.0 — đăng video phải
ghi tên tác giả.
