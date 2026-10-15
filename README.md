# edit master

Kho riêng của **Phong Menly** — bộ dựng video **Dạng 4 "Mono Bold"** hoàn chỉnh: công thức cho
Claude đọc, cộng bộ máy thi hành để dựng ra video thật.

Kho công khai — ai cũng tải về dùng được.

## Dạng 4 "Mono Bold" là gì

Edit video talking-head kiểu reel chuyên gia/coach:

- Cận mặt, bộ lọc ấm mềm, làm nét để nhân vật tách khỏi hậu cảnh
- Chữ Inter trắng đậm **2 tầng** (dòng nhỏ dẫn + cụm to nhấn), đặt thấp ~70% khung
- B-roll đời thật **phủ kín màn hình** minh hoạ câu nói
- **Thẻ TRẮNG chữ đen / thẻ ĐEN chữ trắng** toàn màn cho câu chốt
- Chuyển cảnh **cháy đỏ-cam**, tối đa 2 lần mỗi video
- Nhạc nền rất nhỏ, gần như không tiếng động

## Trong kho có gì

```
edit-master/
├── CAI-DAT.md              ← đọc cái này trước khi làm gì
├── .claude/skills/
│   └── video-editor-dang-4/ ← CÔNG THỨC (Claude Code tự đọc, khỏi chép đi đâu)
│       ├── SKILL.md            quy trình, schema plan.json, nhật ký từng video
│       └── references/         bóc tách 4 video kênh mẫu + khung hình đối chiếu
└── dang5-studio/           ← BỘ MÁY (dựng ra video thật)
    ├── src/Dang4Mono.tsx       bộ dựng Remotion
    ├── scripts/                prepare · grade · render · trim_gaps · make_lut · beauty
    └── public/                 phông Inter · hạt phim · bộ lọc màu · tiếng động · nhạc
```

Cần **cả hai**: thiếu công thức thì Claude không biết dựng thế nào, thiếu bộ máy thì
không ra được file video.

## Bắt đầu

Đọc **[CAI-DAT.md](CAI-DAT.md)** — 4 bước, khoảng 20 phút cho máy mới.

Tóm tắt: cài Node.js + Python + ffmpeg → chép một dòng lệnh duy nhất trong CAI-DAT.md →
mở Claude Code tại thư mục kho → nói **"edit Dạng 4"** kèm đường dẫn video.

## Không có trong kho

Kho b-roll, logo thương hiệu, nhạc khác, và **các dạng edit khác** (Dạng 1, 2, 3) —
những thứ đó nằm riêng trên máy chủ nhà.

## Ghi chú bản quyền

- Nhạc `wholesome` của **Kevin MacLeod**, giấy phép CC BY 4.0 — đăng video phải ghi tên tác giả.
- Tài liệu bóc tách chỉ chứa **số đo kỹ thuật** (cỡ chữ, màu, nhịp cắt) rút ra khi xem một
  kênh reel chuyên gia. Khung hình gốc và tên kênh không đưa lên đây.
