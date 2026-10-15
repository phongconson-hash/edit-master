# Bóc tách kênh mẫu DẠNG 4

> Số đo rút ra khi xem một kênh reel chuyên gia. Tên kênh, link và khung hình gốc
> giữ ở bản nội bộ — ở đây chỉ còn phần số liệu kỹ thuật.

Nguồn (tải 13/10/2026 bằng yt-dlp, lưu ở máy chủ nhà):

| File | Video | Dài | Đăng |
|---|---|---|---|
| A.mp4 | reel "Một nghịch lý đáng buồn mà rất nhiều chuyên gia, coach…" (anh gửi) — **MẪU CHÍNH** | 88s | 11/10 |
| B.mp4 | video "Cách tạo ra 1 tỷ doanh thu chỉ trong 5 ngày…" (anh gửi) | 310s | 13/10 |
| C.mp4 | reel "Lộ trình chi tiết 21 ngày…" (em lấy thêm, đăng sát đó) | 161s | 12/10 |
| D.mp4 | reel "Lý do khiến các chuyên gia kiếm ít tiền hơn thực lực" (em lấy thêm) | 131s | 10/10 |

Khung soi: `A1_*.jpg, B1_*.jpg, C1_*.jpg, D1_*.jpg`, `ct/*.jpg`. Lời A: `A_words.json`. Script đo: `pt.py`, `det.py`, `sheet.py`.

## 1. Con số (reel A, 88s)
- **24 lần cắt** (≈3,7s/cảnh). Tốc độ nói 4,7 từ/giây, gần như không nghỉ (3% thời gian không lời).
- Thành phần: ~62% cận mặt người nói · ~22% b-roll đời thật · ~16% thẻ trắng/đen (8 thẻ, mỗi thẻ 1,7–2,7s).
- Âm: −14,2 LUFS, LRA 2,2. **Nhạc nền rất nhỏ**: chỗ chỉ còn nhạc ≈ −32 dB, giọng ≈ −19 dB (thấp hơn ~13 dB); phổ nhạc dồn 150–800 Hz (72%) → đệm êm kiểu pad/piano, không trống mạnh. Chỉ thấy 1 tiếng trầm rõ (38,1s). Không đo được SFX riêng biệt đáng kể — nếu có thì rất nhẹ.
- Video dài B (310s): cùng ngôn ngữ nhưng THƯA hơn nhiều (chữ chỉ ở ý chính, b-roll ~1 lần/40s, 1 thẻ số "111 Business").

## 2. Hình
- **Cận mặt, tay cầm máy / selfie**, mặt chiếm 45–60% bề ngang, hơi lệch tâm; nền nhà ấm, đèn vàng. Mỗi lần cắt đổi nhẹ cỡ khung (jump-cut) — không zoom mượt.
- **Bộ lọc** (đo 4 khung): độ sáng TB 0,49–0,54 · đen nhấc nhẹ (p5 0,06–0,12) · trắng không cháy (p95 0,87–0,93) · **bão hoà thấp ≈0,24** · ấm (R 0,60 > G 0,51 > B 0,46) · **4 góc tối ≈0,6 lần vùng giữa**. Cảm giác: phim ấm, mềm, da đẹp.
- **B-roll**: clip đời thật phủ KÍN màn hình (ngồi laptop, gõ phím, lớp học, sự kiện, gặp khách), 2–4,5s/clip, có khi 3 clip nối nhau; cắt thẳng; chữ vẫn chạy bên trên. B-roll luôn MINH HOẠ đúng câu đang nói.
- **Thẻ trắng / thẻ đen** toàn màn hình cho câu chốt, hay đi theo CẶP trắng→đen. Thẻ trắng trồi từ đáy lên trong ~8 khung, có dải sương trắng đi trước; thẻ đen cắt thẳng. Chữ giữa thẻ, hiện mờ→rõ 3–4 khung. Hết thẻ: cắt thẳng về mặt.
- Biến thể (reel C, D): tiêu đề nhỏ ghim trên đỉnh suốt video; nét vẽ trắng nguệch ngoạc động quanh đầu; **danh sách** "3 bước chính: 1. …" / "2 trường hợp: 1… 2…" hiện dần từng dòng nhỏ dưới tiêu đề.

## 3. Chữ
- **Phông**: sans grotesque đậm, chữ rất khít — khớp **Inter** (Bold/ExtraBold) với khoảng chữ ≈ −0,05em.
- **2 tầng, căn giữa, đặt THẤP ≈70% chiều cao** (vùng ngực/áo): dòng nhỏ đậm (≈58–60px trên khung 1080) + cụm to rất đậm (≈110–130px). Trắng, **bóng đổ mềm lệch phải-xuống** (không viền, không khối màu).
- **Cả cụm bật một lần** (không chạy từng từ): mờ→rõ ~5 khung, không trượt, không nảy. Dòng nhỏ thường GIỮ, cụm to thay liên tiếp theo danh sách ("đấy là trên" + Facebook → TikTok → YouTube → cộng đồng).
- Chỉ 2 màu chữ: trắng (trên hình) và đen (trên thẻ trắng). Không màu nhấn.
- Mỗi cụm đứng 0,5–1,5s ở mẫu (nhanh) — xem mục nhịp của anh Phong trong SKILL.

## 4. Công thức dựng (rút ra)
1. Hook 0–10s: cận mặt + chữ 2 tầng dồn dập theo danh sách.
2. Cứ 8–12s chèn 1 cụm b-roll 2–3 clip minh hoạ nỗi đau/bối cảnh.
3. Mỗi luận điểm chốt bằng 1 thẻ (hoặc cặp trắng→đen).
4. Kết: thẻ câu hỏi/đúc kết → về mặt nói CTA.
