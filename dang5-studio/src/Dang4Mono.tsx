// DẠNG 4 "Mono Bold" — bộ dựng talking-head kiểu reel chuyên gia (tạo 13/10/2026, nâng cấp tới 21/10/2026). Claude viết plan.json, file này chỉ dựng hình.
// Cảnh: talk (cận mặt, lọc ấm mềm) | broll (clip đời thật phủ kín) | card (thẻ TRẮNG chữ đen / thẻ ĐEN chữ trắng).
// Chữ: Inter đậm, trắng, bóng đổ mềm lệch phải-xuống, 2 tầng (dòng nhỏ + cụm to), đặt thấp ~70% khung; cả cụm bật một lần.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const W = 1080;
const H = 1920;
const F = "D4Inter";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const TRACK = "-0.012em";   // 15/10: anh Phong chê chữ dính nhau → nới từ -0.05em
const TRACK_BIG = "-0.018em"; // cụm chữ to (trước -0.055em)
const TRACK_N = -0.018;       // cùng giá trị, dạng số để tính bề ngang
// VÙNG AN TOÀN TIKTOK (khung 1080): cột nút tim/bình luận/lưu bên phải ~170px,
// nên chữ chạy phải hẹp hơn thẻ. Anh Phong báo 18/10: chữ thẻ bị cắt mất hai đầu.
const W_THE = 920;            // chữ to trên thẻ toàn màn
const W_CHU = 880;            // chữ chạy đè lên hình (né cột nút bên phải)

export type D4Scene =
  | { kind: "talk"; from: number; to: number; scale?: number; anchorY?: number }
  | { kind: "broll"; from: number; to: number; file: string; pos?: string }
  | { kind: "card"; from: number; to: number; tone: "white" | "black"; enter?: "wipe" | "cut"; small?: string; big: string; tBig?: number; order?: "small-big" | "big-small" }
  // màn hình điện thoại giả lập: app ChatGPT, câu lệnh gõ dần trong ô chat, bàn phím iOS bên dưới
  // ảnh nổi giữa màn, chiếm ~2/3, nền là chính ảnh đó phóng to + làm mờ → mắt dồn vào ảnh
  | { kind: "photo"; from: number; to: number; file: string; w?: number }
  | { kind: "phone"; from: number; to: number; prompt: string; app?: string; reply?: string; tReply?: number; send?: number; pics?: ({ file: string; t?: number } | string)[]; replyPic?: string; typeAt?: number; logo?: string }
  // THANG XẾP HẠNG (21/10, anh Phong): các bậc xếp từ THẤP (dưới) lên CAO (trên); level = bậc đang nói (0 = xem tổng quan)
  | { kind: "ladder"; from: number; to: number; level: number; tLevel?: number; title?: string }   // tLevel: trước mốc này xem tổng quan, tới mốc thì bậc sáng lên
  // KHUNG SO SÁNH: các công cụ xếp dọc, tới tPick thì cái được chọn sáng trắng + nhãn "CHỌN", còn lại mờ đi
  | { kind: "compare"; from: number; to: number; label?: string; title: string; items: { file: string; name: string; note?: string; t?: number }[]; pick?: number; tPick?: number; pickText?: string };
export type D4Logo = { from: number; to: number; file: string; name: string; sub?: string };
export type D4Ladder = { label?: string; rungs: { name: string; note?: string; logos?: { file: string; t?: number }[] }[] };
export type D4Caption = { from: number; to: number; y?: number; lead?: string; leadT?: number; punch?: string; punchT?: number; shade?: number };
export type D4List = { from: number; to: number; y?: number; title: string; items: { t: number; text: string }[] };
export type D4Props = {
  video: string;
  durationSec: number;
  fps?: number;
  scenes: D4Scene[];
  captions: D4Caption[];
  lists?: D4List[];
  title?: { text: string; sub?: string } | null; // tiêu đề nhỏ ghim trên đỉnh suốt video (tuỳ chọn)
  graded?: boolean; // video ĐÃ áp LUT bằng scripts/grade.py → tắt lớp chỉnh màu CSS (chỉ giữ tối góc + hạt)
  softCut?: number; // số khung hoà hình giữa 2 cảnh (mặc định 5; 0 = cắt thẳng như mẫu)
  grade?: { warm?: number; vignette?: number; grain?: number };
  leaks?: { t: number; kind?: "prism" | "warm" }[]; // CHÁY SÁNG đúng mốc cắt — mặc định "warm" (đỏ→cam→vàng trắng); "prism" = trắng + viền cầu vồng
  logos?: D4Logo[];   // nhắc tới công cụ nào → logo thật hiện nhỏ, tinh tế ở đỉnh khung rồi tự tắt
  ladder?: D4Ladder;  // nội dung thang xếp hạng dùng cho mọi cảnh "ladder"
};
export const DANG4_DEFAULT: D4Props = { video: "_jobs/demo/cut.mp4", durationSec: 5, scenes: [], captions: [] };

const useFonts = () => {
  const [handle] = useState(() => delayRender("dang4-fonts"));
  useEffect(() => {
    let done = false;
    const fin = () => { if (!done) { done = true; continueRender(handle); } };
    const tm = setTimeout(fin, 15000);
    new FontFace(F, `url("${staticFile("fonts/Inter[opsz,wght].ttf")}")`, { weight: "100 900" })
      .load().then((l) => document.fonts.add(l)).catch((e) => console.error("dang4 font", e)).finally(() => { clearTimeout(tm); fin(); });
  }, [handle]);
};
const sec = (s: number, fps: number) => Math.round(s * fps);
const isVid = (f: string) => /\.(mp4|mov|webm|m4v)$/i.test(f);

// BỘ LỌC: ấm, bão hoà thấp, đen hơi nhấc, tối 4 góc — đo từ mẫu (sat≈0,24 · R>G>B · góc tối ≈0,6 lần giữa)
const GRADE_CSS = "saturate(0.86) contrast(1.04) brightness(1.03) sepia(0.16)";
let GRADED = false;   // đặt lại mỗi khung trong Dang4Mono
const GRADE = () => (GRADED ? "none" : GRADE_CSS);
const Grade: React.FC<{ g?: D4Props["grade"] }> = ({ g }) => (
  <>
    {GRADED ? null : <AbsoluteFill style={{ backgroundColor: `rgba(255,186,132,${g?.warm ?? 0.1})`, mixBlendMode: "soft-light" }} />}
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 48%, rgba(20,12,6,${g?.vignette ?? 0.4}) 100%)` }} />
  </>
);

const Talk: React.FC<{ s: Extract<D4Scene, { kind: "talk" }>; video: string; g?: D4Props["grade"] }> = ({ s, video, g }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = (frame - sec(s.from, fps)) / Math.max(1, sec(s.to, fps) - sec(s.from, fps));
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0b0908" }}>
      <OffthreadVideo src={staticFile(video)} muted style={{ width: W, height: H, objectFit: "cover", filter: GRADE(), transform: `scale(${(s.scale ?? 1) * (1 + 0.025 * k)})`, transformOrigin: `50% ${(s.anchorY ?? 0.36) * 100}%` }} />
      <Grade g={g} />
    </AbsoluteFill>
  );
};
const Broll: React.FC<{ s: Extract<D4Scene, { kind: "broll" }>; g?: D4Props["grade"] }> = ({ s, g }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = sec(s.from, fps);
  const k = (frame - f0) / Math.max(1, sec(s.to, fps) - f0);
  const st: React.CSSProperties = { width: W, height: H, objectFit: "cover", objectPosition: s.pos ?? "50% 50%", filter: GRADE(), transform: `scale(${1.03 + 0.04 * k})` };
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0b0908" }}>
      <Sequence from={f0} layout="none">
        {isVid(s.file) ? <OffthreadVideo src={staticFile(s.file)} muted style={st} /> : <Img src={staticFile(s.file)} style={st} />}
      </Sequence>
      <Grade g={g} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 52%, rgba(0,0,0,0.3) 76%, rgba(0,0,0,0.12) 100%)" }} />
    </AbsoluteFill>
  );
};

// cỡ chữ tự thu để LUÔN 1 dòng
// Ước lượng bề ngang chuỗi theo cỡ chữ: CHỮ HOA rộng hơn chữ thường nhiều,
// khoảng trắng và i/l/t hẹp. Đếm ký tự suông sẽ tính thiếu và chữ TRÀN RA NGOÀI KHUNG.
const beRong = (t: string, size: number) => {
  let w = 0;
  for (const ch of t) {
    if (ch === " ") w += 0.28;
    else if ("ilj|!.,'’:;".includes(ch)) w += 0.30;
    else if (ch !== ch.toLowerCase() && ch === ch.toUpperCase()) w += 0.70;   // HOA
    else w += 0.55;
  }
  return w * size + TRACK_N * size * Math.max(0, t.length - 1);
};
// Thu cỡ chữ cho VỪA bề ngang cho phép (vùng an toàn TikTok), không bao giờ để tràn.
const fitW = (text: string, base: number, maxW: number) => {
  let s = base;
  while (s > 22 && beRong(text, s) > maxW) s -= 2;
  return Math.round(s);
};
const fit = (text: string, base: number, chars: number) => Math.round(base * Math.min(1, chars / Math.max(1, text.length)));

const Card: React.FC<{ s: Extract<D4Scene, { kind: "card" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = sec(s.from, fps);
  const white = s.tone === "white";
  const wipe = (s.enter ?? (white ? "wipe" : "cut")) === "wipe";
  // thẻ trắng: trồi từ ĐÁY lên trong 8 khung, mép trên có dải mờ; thẻ đen: cắt thẳng
  const p = wipe ? interpolate(frame, [f0, f0 + 8], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) }) : 1;
  const bg = white ? "#FFFFFF" : "#000000";
  const fg = white ? "#0A0A0A" : "#FFFFFF";
  const tb = sec(s.tBig ?? s.from, fps);
  const aS = interpolate(frame, [f0 + (wipe ? 5 : 1), f0 + (wipe ? 9 : 4)], [0, 1], CL);
  const aB = interpolate(frame, [Math.max(tb, f0 + (wipe ? 5 : 1)), Math.max(tb, f0 + (wipe ? 5 : 1)) + 4], [0, 1], CL);
  const small = s.small ? (
    <div key="s" style={{ fontFamily: F, fontWeight: 700, fontSize: fitW(s.small, 62, W_THE), letterSpacing: TRACK, color: fg, opacity: aS, lineHeight: 1.18, marginBottom: 14, whiteSpace: "nowrap" }}>{s.small}</div>
  ) : null;
  const big = (
    <div key="b" style={{ fontFamily: F, fontWeight: 800, fontSize: fitW(s.big, 132, W_THE), letterSpacing: TRACK_BIG, color: fg, opacity: aB, lineHeight: 1.12, whiteSpace: "nowrap", transform: `scale(${1 + 0.02 * Math.min(1, Math.max(0, frame - tb) / 70)})` }}>{s.big}</div>
  );
  return (
    <AbsoluteFill style={{ clipPath: `inset(${(1 - p) * 100}% 0 0 0)` }}>
      <AbsoluteFill style={{ backgroundColor: bg }} />
      {wipe && p < 1 ? <div style={{ position: "absolute", left: 0, right: 0, top: `${(1 - p) * 100}%`, height: 260, background: "linear-gradient(to bottom, rgba(255,255,255,0.0), rgba(255,255,255,0))" }} /> : null}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", display: "flex", padding: "0 60px", textAlign: "center" }}>
        {(s.order ?? "small-big") === "small-big" ? [small, big] : [big, small]}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
// Ảnh NỔI giữa màn: chiếm ~2/3 bề ngang, nền là chính ảnh đó phóng to + làm mờ tối
// → người xem dồn mắt vào ảnh thay vì bị ảnh full màn nuốt hết khung.
const Photo: React.FC<{ s: Extract<D4Scene, { kind: "photo" }>; g?: D4Props["grade"] }> = ({ s, g }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = sec(s.from, fps);
  const k = (frame - f0) / Math.max(1, sec(s.to, fps) - f0);
  const inn = interpolate(frame, [f0, f0 + 9], [0, 1], { ...CL, easing: EASE });
  const w = (s.w ?? 0.68) * W;
  const vid = isVid(s.file);   // nhận cả .mp4 — b-roll màn hình 16:9 hiện khung giữa cho khỏi mất nội dung
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0b0908" }}>
      {/* nền: chính nó, phóng to và làm mờ tối */}
      {vid ? (
        <OffthreadVideo src={staticFile(s.file)} muted style={{ width: W, height: H, objectFit: "cover", filter: "blur(34px) brightness(0.34) saturate(0.9)", transform: `scale(${1.22 + 0.05 * k})` }} />
      ) : (
        <Img src={staticFile(s.file)} style={{ width: W, height: H, objectFit: "cover", filter: "blur(34px) brightness(0.34) saturate(0.9)", transform: `scale(${1.22 + 0.05 * k})` }} />
      )}
      {/* khung chính giữa */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: w, maxHeight: H * 0.70, borderRadius: 26, overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.58)",
          transform: `scale(${(0.955 + 0.045 * inn) * (1 + 0.025 * k)}) translateY(${(1 - inn) * 26}px)`,
          opacity: inn, display: "flex",
        }}>
          {vid
            ? <OffthreadVideo src={staticFile(s.file)} muted style={{ width: "100%", display: "block" }} />
            : <Img src={staticFile(s.file)} style={{ width: "100%", maxHeight: H * 0.70, objectFit: "contain", display: "block" }} />}
        </div>
      </AbsoluteFill>
      <Grade g={g} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 54%, rgba(0,0,0,0.34) 78%, rgba(0,0,0,0.14) 100%)" }} />
    </AbsoluteFill>
  );
};

// ───────── MÀN HÌNH ĐIỆN THOẠI: app ChatGPT, câu lệnh gõ dần, bàn phím iOS ─────────
// Để khách hình dung đúng chỗ phải gõ. Nền là cảnh trước đã làm mờ + tối.
const KEYS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const PhoneChat: React.FC<{ s: Extract<D4Scene, { kind: "phone" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = sec(s.from, fps);
  const f1 = sec(s.to, fps);
  const t = frame - f0;

  // điện thoại trượt lên 10 khung
  const up = interpolate(t, [0, 10], [120, 0], { ...CL, easing: EASE });
  const op = interpolate(t, [0, 8], [0, 1], CL);

  // gõ chữ: bắt đầu sau 12 khung, xong trước lúc gửi
  const sendF = s.send != null ? sec(s.send, fps) - f0 : Math.max(26, (f1 - f0) - 26);
  // mốc bắt đầu gõ: mặc định 12 khung sau khi điện thoại hiện, hoặc đúng lúc anh đọc câu lệnh
  const typeFrom = s.typeAt != null ? sec(s.typeAt, fps) - f0 : 12;
  const typed = Math.max(0, Math.min(s.prompt.length,
    Math.round(interpolate(t, [typeFrom, sendF - 4], [0, s.prompt.length], CL))));
  const text = s.prompt.slice(0, typed);
  const caret = t < sendF && Math.floor(t / 7) % 2 === 0;
  const sent = t >= sendF;

  // câu trả lời (tuỳ chọn) hiện sau khi gửi
  const rf = s.tReply != null ? sec(s.tReply, fps) - f0 : sendF + 14;
  const showReply = (!!s.reply || !!s.replyPic) && t >= rf;
  const replyOp = interpolate(t, [rf, rf + 7], [0, 1], CL);

  const PW = 760;                    // bề ngang khung máy
  const PH = 1430;
  const SCR = "#FFFFFF";

  // BÀN PHÍM TRƯỢT LÊN như iPhone thật: nằm khuất dưới màn, bắt đầu trượt 0,4s trước khi gõ
  const KBH = 500;                               // chiều cao cụm bàn phím
  const kbF = Math.max(0, typeFrom - 12);        // mốc bắt đầu trượt
  // anh Phong chốt: BÀN PHÍM LUÔN HIỆN (đẹp, chuyên nghiệp) — không trượt lên/xuống nữa
  const kb = 0;

  const keyCap: React.CSSProperties = {
    flex: 1, margin: "0 4px", height: 74, borderRadius: 9, background: "#FCFCFE",
    boxShadow: "0 1px 0 rgba(0,0,0,0.28)", display: "flex", alignItems: "center",
    justifyContent: "center", fontFamily: F, fontSize: 33, fontWeight: 400, color: "#111",
  };

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: op }}>
      <div style={{
        width: PW, height: PH, transform: `translateY(${up}px)`, borderRadius: 66,
        background: "#0B0B0D", padding: 8,
        boxShadow: "0 40px 90px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.09)",
      }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 59, background: SCR, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>

          {/* thanh trạng thái + Dynamic Island */}
          <div style={{ height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px", flexShrink: 0 }}>
            <span style={{ fontFamily: F, fontSize: 23, fontWeight: 600, color: "#111" }}>9:41</span>
            <span style={{ fontFamily: F, fontSize: 20, color: "#111", letterSpacing: "0.06em" }}>▮▮▮ ⌁</span>
          </div>
          {/* iPhone 18 Pro: Face ID hồng ngoại nằm DƯỚI màn hình (góc trên-trái) nên
            Dynamic Island thu nhỏ còn ~110px thay vì 168px của đời trước */}
          <div style={{ position: "absolute", top: 15, left: "50%", transform: "translateX(-50%)", width: 110, height: 34, borderRadius: 17, background: "#0B0B0D" }} />

          {/* đầu trang app */}
          <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "6px 30px 16px", borderBottom: "1px solid #ECECEF", flexShrink: 0 }}>
            <Img src={staticFile(s.logo ?? "logos/chatgpt.png")} style={{ width: 40, height: 40, borderRadius: 20 }} />
            <span style={{ fontFamily: F, fontSize: 31, fontWeight: 700, color: "#111", letterSpacing: TRACK }}>{s.app ?? "ChatGPT"}</span>
          </div>

          {/* khung hội thoại */}
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "26px 26px 0", display: "flex", flexDirection: "column", justifyContent: !sent || (showReply && s.replyPic) ? "center" : "flex-end", gap: 16 }}>
            {/* ảnh người dùng đã tải lên trước khi gõ câu lệnh */}
            {s.pics && s.pics.length ? (
              <div style={{ alignSelf: "flex-end", display: "flex", gap: 12 }}>
                {s.pics.map((pc, i) => {
                  const f = typeof pc === "string" ? pc : pc.file;
                  // mỗi ảnh có mốc riêng → hiện đúng lúc anh nói "tải ảnh này lên"
                  const pf = typeof pc === "string" ? f0 : sec(pc.t ?? s.from, fps);
                  if (frame < pf) return null;
                  const a2 = interpolate(frame, [pf, pf + 7], [0, 1], CL);
                  const up2 = interpolate(frame, [pf, pf + 9], [22, 0], { ...CL, easing: EASE });
                  return (
                    <Img key={i} src={staticFile(f)}
                      style={{ width: 196, height: 261, objectFit: "cover", borderRadius: 20,
                               boxShadow: "0 3px 14px rgba(0,0,0,0.16)", opacity: a2 * (showReply && s.replyPic ? Math.max(0, 1 - (t - rf) / 7) : 1),
                               display: showReply && s.replyPic && t - rf > 7 ? "none" : "block",
                               transform: `translateY(${up2}px) scale(${0.94 + 0.06 * a2})` }} />
                  );
                })}
              </div>
            ) : null}
            {sent ? (
              <div style={{ alignSelf: "flex-end", maxWidth: "84%", background: "#111", color: "#fff", borderRadius: "24px 24px 7px 24px", padding: "15px 21px", fontFamily: F, fontSize: 27, fontWeight: 500, lineHeight: 1.34,
                            opacity: showReply && s.replyPic ? Math.max(0, 1 - (t - rf) / 7) : 1,
                            display: showReply && s.replyPic && t - rf > 7 ? "none" : "block" }}>
                {s.prompt}
              </div>
            ) : null}
            {showReply && s.replyPic ? (
              // ảnh ChatGPT trả về: đặt CHÍNH GIỮA màn hình điện thoại cho cân, trồi lên nhẹ
              <div style={{ alignSelf: "center", opacity: replyOp, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                            transform: `translateY(${(1 - replyOp) * 18}px) scale(${0.95 + 0.05 * replyOp})` }}>
                <Img src={staticFile(s.logo ?? "logos/chatgpt.png")} style={{ width: 34, height: 34, borderRadius: 17 }} />
                <Img src={staticFile(s.replyPic)} style={{ width: 440, height: 587, objectFit: "cover", borderRadius: 22, display: "block", boxShadow: "0 14px 40px rgba(0,0,0,0.22)" }} />
              </div>
            ) : showReply ? (
              <div style={{ alignSelf: "flex-start", display: "flex", gap: 12, maxWidth: "90%", opacity: replyOp }}>
                <Img src={staticFile(s.logo ?? "logos/chatgpt.png")} style={{ width: 36, height: 36, borderRadius: 18, flexShrink: 0 }} />
                <div style={{ background: "#F2F2F5", color: "#111", borderRadius: "8px 26px 26px 26px", padding: "18px 24px", fontFamily: F, fontSize: 29, fontWeight: 500, lineHeight: 1.34 }}>
                  {s.reply}
                </div>
              </div>
            ) : null}
          </div>

          {/* ô nhập LUÔN dính đáy; bàn phím bên dưới cao dần lên khi được gọi */}
          <div style={{ padding: "16px 24px 14px", background: "#fff", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13, background: "#F2F2F5", borderRadius: 32, padding: "15px 17px" }}>
              <Img src={staticFile(s.logo ?? "logos/chatgpt.png")} style={{ width: 36, height: 36, borderRadius: 18, flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: F, fontSize: 29, color: sent ? "#A8A8AE" : "#111", lineHeight: 1.3, overflow: "hidden", whiteSpace: "nowrap" }}>
                {sent ? "Hỏi bất kỳ điều gì" : (t < typeFrom ? <span style={{ color: "#A8A8AE" }}>Hỏi bất kỳ điều gì</span> : text)}
                {caret && !sent ? <span style={{ color: "#10A37F" }}>|</span> : null}
              </span>
              <div style={{ width: 46, height: 46, borderRadius: 23, background: sent ? "#D7D7DC" : "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontSize: 25, fontWeight: 700, lineHeight: 1 }}>↑</span>
              </div>
            </div>
          </div>

          {/* bàn phím iOS */}
          <div style={{ height: KBH - kb, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: "#D1D3D9", padding: "14px 7px 20px", width: "100%", height: KBH }}>
            {KEYS.map((row, ri) => (
              <div key={ri} style={{ display: "flex", justifyContent: "center", marginBottom: 12, padding: ri === 1 ? "0 30px" : ri === 2 ? "0 4px" : 0 }}>
                {ri === 2 ? <div style={{ ...keyCap, flex: 1.5, background: "#AEB2BC" }}>⇧</div> : null}
                {row.map((k) => <div key={k} style={keyCap}>{k}</div>)}
                {ri === 2 ? <div style={{ ...keyCap, flex: 1.5, background: "#AEB2BC" }}>⌫</div> : null}
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ ...keyCap, flex: 1.6, background: "#AEB2BC" }}>123</div>
              <div style={{ ...keyCap, flex: 5 }}>space</div>
              <div style={{ ...keyCap, flex: 2, background: "#AEB2BC" }}>return</div>
            </div>
            {/* thanh home của iPhone */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 18 }}>
              <div style={{ width: 230, height: 7, borderRadius: 4, background: "#1A1A1C", opacity: 0.82 }} />
            </div>
          </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// dải mờ trắng đi trước mép thẻ khi thẻ trồi lên (hình bên dưới bị "phủ sương")
const CardHaze: React.FC<{ s: Extract<D4Scene, { kind: "card" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = sec(s.from, fps);
  if (s.tone !== "white" || (s.enter ?? "wipe") !== "wipe" || frame < f0 - 3 || frame > f0 + 8) return null;
  const p = interpolate(frame, [f0 - 3, f0 + 8], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
  return <div style={{ position: "absolute", left: 0, right: 0, top: `${(1 - p) * 100 - 16}%`, height: "24%", background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.72))" }} />;
};

const SH = "5px 7px 16px rgba(0,0,0,0.5), 0 0 26px rgba(0,0,0,0.22)";
const Captions: React.FC<{ caps: D4Caption[] }> = ({ caps }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const c = caps.find((x) => t >= x.from && t < x.to);
  if (!c) return null;
  const y = (c.y ?? 0.7) * H;
  // bóng đậm hơn khi nền sáng (áo trắng): đặt shade 0.55–0.65
  const sh = c.shade ?? 0.4;
  // cả cụm bật một lần: mờ→rõ 5 khung, KHÔNG trượt, KHÔNG nảy (đo từ mẫu); hết vế cắt thẳng sang vế sau
  const lf = sec(c.leadT ?? c.from, fps);
  const pf = sec(c.punchT ?? c.from, fps);
  const aL = interpolate(frame, [lf, lf + 5], [0.25, 1], CL);
  const aP = interpolate(frame, [pf, pf + 5], [0.3, 1], CL);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y - 150, height: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      {/* bóng mềm sau khối chữ: nền rối (áo sọc, cây lá) vẫn đọc được — mẫu quay áo trắng trơn nên không cần */}
      <div style={{ position: "absolute", left: 0, right: 0, top: -70, height: 440, background: `radial-gradient(ellipse 50% 46% at 50% 50%, rgba(0,0,0,${sh}) 0%, rgba(0,0,0,${sh*0.5}) 45%, rgba(0,0,0,0) 74%)`, filter: "blur(22px)" }} />
      {c.lead && frame >= lf ? (
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: fitW(c.lead, 60, W_CHU), letterSpacing: TRACK, color: "#fff", textShadow: SH, opacity: aL, lineHeight: 1.16, whiteSpace: "nowrap", position: "relative" }}>{c.lead}</div>
      ) : (
        <div style={{ height: 63 }} />
      )}
      {c.punch && frame >= pf ? (
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: fitW(c.punch, 128, W_CHU), letterSpacing: TRACK_BIG, color: "#fff", textShadow: SH, opacity: aP, lineHeight: 1.1, whiteSpace: "nowrap", marginTop: 10, position: "relative" }}>{c.punch}</div>
      ) : (
        <div style={{ height: 128 }} />
      )}
    </div>
  );
};

const ListLayer: React.FC<{ l: D4List }> = ({ l }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = sec(l.from, fps);
  if (frame < f0 || frame >= sec(l.to, fps)) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: (l.y ?? 0.66) * H, textAlign: "center" }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 84, letterSpacing: TRACK_BIG, color: "#fff", textShadow: SH, opacity: interpolate(frame, [f0, f0 + 5], [0.3, 1], CL) }}>{l.title}</div>
      {l.items.map((it, i) => (frame >= sec(it.t, fps) ? (
        <div key={i} style={{ fontFamily: F, fontWeight: 600, fontSize: 44, letterSpacing: TRACK, color: "#fff", textShadow: SH, marginTop: 14, opacity: interpolate(frame, [sec(it.t, fps), sec(it.t, fps) + 5], [0.2, 1], CL) }}>{it.text}</div>
      ) : null))}
    </div>
  );
};

// TIA SÁNG CHUYỂN CẢNH (đo từ mẫu, ~11 khung): sáng dần 4–5 khung → trắng gần kín ở mốc cắt → tan 5–6 khung.
//  prism: luồng sáng trắng tràn từ TRÁI sang, mép có dải cầu vồng (reel C 5,4s · D 2,8s)
//  warm : cháy đỏ → cam → trắng rồi lùi qua cam (video B 5,5s · 19,1s)
const Leak: React.FC<{ l: { t: number; kind?: "prism" | "warm" } }> = ({ l }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = sec(l.t, fps);
  if (frame < f - 6 || frame > f + 8) return null;
  const up = interpolate(frame, [f - 6, f - 1], [0, 1], CL);
  const down = interpolate(frame, [f, f + 8], [1, 0], CL);
  const a = frame < f ? up : down;
  if ((l.kind ?? "warm") === "warm") {
    // CHÁY ĐỎ-CAM (mặc định — anh Phong chốt 14/10). Đo từ video B 5,3–5,6s:
    //  −4 khung: viền đỏ thẫm ăn từ mép vào → −2: cả khung ngả cam → 0: vàng-trắng gần kín → +2: cam → +5: đỏ nhạt → hết
    const k = frame < f ? up : down;                       // 0..1 độ "cháy"
    const hot = Math.max(0, k - 0.6) / 0.4;                // phần lõi vàng-trắng quanh mốc cắt
    return (
      <AbsoluteFill>
        {/* lớp nhuộm đặc: đỏ thẫm khi mới cháy → cam khi gần mốc cắt (mẫu nhuộm RẤT đậm, không chỉ sáng lên) */}
        <AbsoluteFill style={{ backgroundColor: `rgba(${Math.round(215 + 40 * k)},${Math.round(45 + 115 * k)},${Math.round(18 + 22 * k)},${0.68 * Math.pow(k, 0.7)})`, mixBlendMode: "hard-light" }} />
        <AbsoluteFill style={{ backgroundColor: `rgba(255,${Math.round(70 + 110 * k)},${Math.round(20 + 30 * k)},${0.62 * k})`, mixBlendMode: "screen" }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 65% at 55% 45%, rgba(255,170,60,${0.5 * k}) 0%, rgba(220,40,10,${0.75 * k}) 100%)`, mixBlendMode: "screen" }} />
        <AbsoluteFill style={{ background: `linear-gradient(105deg, rgba(255,214,120,${0.95 * hot}) 0%, rgba(255,246,214,${hot}) 55%, rgba(255,226,150,${0.9 * hot}) 100%)` }} />
      </AbsoluteFill>
    );
  }
  const x = interpolate(frame, [f - 5, f + 7], [-60, 150], CL); // tâm luồng sáng đi từ trái sang phải (%)
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 120% at ${x}% 45%, rgba(255,255,255,${a}) 0%, rgba(255,250,235,${0.9 * a}) 38%, rgba(255,240,200,0) 78%)`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: `linear-gradient(100deg, rgba(255,80,80,0) ${x - 25}%, rgba(255,210,60,${0.5 * a}) ${x + 18}%, rgba(90,230,140,${0.45 * a}) ${x + 30}%, rgba(90,150,255,${0.4 * a}) ${x + 42}%, rgba(200,120,255,0) ${x + 58}%)`, mixBlendMode: "screen", filter: "blur(30px)" }} />
      <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${Math.max(0, a - 0.5) * 1.9})` }} />
    </AbsoluteFill>
  );
};

// ───────── LOGO CÔNG CỤ (21/10, anh Phong: "nhắc logo nào hiện logo đó một cách tinh tế") ─────────
// Viên trắng nhỏ ở đỉnh khung (dưới vùng nút quay lại của TikTok), logo thật + tên. Trồi nhẹ 7 khung, tắt mờ 6 khung.
// Nhiều logo cùng lúc → xếp hàng ngang, quá bề ngang an toàn thì thu cả hàng lại.
const LOGO_Y = 0.115;
const LogoBox: React.FC<{ file: string; size: number; r?: number; pad?: number }> = ({ file, size, r = 0.24, pad = 0.12 }) => (
  <div style={{ width: size, height: size, borderRadius: size * r, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
    <Img src={staticFile(file)} style={{ width: size * (1 - 2 * pad), height: size * (1 - 2 * pad), objectFit: "contain" }} />
  </div>
);
const LogoChips: React.FC<{ logos: D4Logo[] }> = ({ logos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const on = logos.filter((l) => t >= l.from && t < l.to);
  if (!on.length) return null;
  const CH = 88, LG = 62, FS = 36;
  const wOf = (l: D4Logo) => 13 + LG + 16 + beRong(l.name, FS) + 30;
  const tot = on.reduce((a, l) => a + wOf(l), 0) + 16 * (on.length - 1);
  const k = Math.min(1, W_CHU / tot);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: LOGO_Y * H, display: "flex", justifyContent: "center", gap: 16, transform: `scale(${k})`, transformOrigin: "50% 0%" }}>
      {on.map((l, i) => {
        const f0 = sec(l.from, fps), f1 = sec(l.to, fps);
        const a = Math.min(interpolate(frame, [f0, f0 + 7], [0, 1], { ...CL, easing: EASE }), interpolate(frame, [f1 - 6, f1], [1, 0], CL));
        return (
          <div key={i} style={{ height: CH, borderRadius: CH / 2, padding: `0 30px 0 13px`, display: "flex", alignItems: "center", gap: 16,
            backgroundColor: "rgba(255,255,255,0.94)", boxShadow: "0 12px 34px rgba(0,0,0,0.30)", opacity: a,
            transform: `translateY(${(1 - a) * -14}px) scale(${0.94 + 0.06 * a})` }}>
            <LogoBox file={l.file} size={LG} r={0.5} pad={0.14} />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontFamily: F, fontWeight: 800, fontSize: FS, letterSpacing: TRACK, color: "#0A0A0A", lineHeight: 1.05, whiteSpace: "nowrap" }}>{l.name}</div>
              {l.sub ? <div style={{ fontFamily: F, fontWeight: 600, fontSize: 22, letterSpacing: TRACK, color: "#6b6b6b", lineHeight: 1.1, whiteSpace: "nowrap", marginTop: 3 }}>{l.sub}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ───────── THANG XẾP HẠNG: bậc 1 ở DƯỚI → bậc cao nhất ở TRÊN ─────────
// Bậc đã qua: viền sáng mờ, hiện nhận xét + logo. Bậc đang nói: nền trắng chữ đen, số trong ô cam. Bậc chưa tới: viền đứt, chữ mờ.
// Cột phải để trống ~170px cho nút TikTok (tim · bình luận · lưu) — nội dung nằm trong x 70…890.
const ACCENT = "#FF4D1A";   // cùng tông cháy đỏ-cam của chuyển cảnh
const Ladder: React.FC<{ s: Extract<D4Scene, { kind: "ladder" }>; L: D4Ladder }> = ({ s, L }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f0 = sec(s.from, fps);
  const n = L.rungs.length;
  const X0 = 70, RW = 820, TOP = 0.255 * H, BOT = 0.845 * H;
  const gap = 24, RH = (BOT - TOP - gap * (n - 1)) / n;
  const aIn = interpolate(frame, [f0, f0 + 6], [0, 1], CL);
  const level = s.tLevel !== undefined && t < s.tLevel ? 0 : s.level;
  const fl = s.tLevel !== undefined ? sec(s.tLevel, fps) : f0 + 7;
  const lit = interpolate(frame, [fl, fl + 10], [0, 1], { ...CL, easing: EASE });
  const head = s.title ?? (level > 0 ? `BẬC ${level} · ${L.rungs[level - 1].name}` : "TỪ THẤP ĐẾN CAO");
  return (
    <AbsoluteFill style={{ backgroundColor: "#060606" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 55% at 45% 55%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 70%)" }} />
      {/* tiêu đề */}
      <div style={{ position: "absolute", left: X0, top: 0.125 * H, opacity: aIn }}>
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: 28, letterSpacing: "0.22em", color: "#8d8d8d" }}>{L.label ?? "XẾP HẠNG"}</div>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: fitW(head, 66, RW), letterSpacing: TRACK_BIG, color: "#fff", marginTop: 8, whiteSpace: "nowrap" }}>{head}</div>
      </div>
      {/* chỉ hướng: thấp → cao */}
      <div style={{ position: "absolute", left: X0, top: TOP - 46, fontFamily: F, fontWeight: 700, fontSize: 24, letterSpacing: "0.2em", color: "#9a9a9a", opacity: aIn }}>▲ CAO</div>
      <div style={{ position: "absolute", left: X0, top: BOT + 16, fontFamily: F, fontWeight: 700, fontSize: 24, letterSpacing: "0.2em", color: "#6f6f6f", opacity: aIn }}>THẤP</div>
      {L.rungs.map((r, i) => {
        const lv = i + 1;                                  // bậc 1 nằm DƯỚI CÙNG
        const y = BOT - (i + 1) * RH - i * gap;
        const st = level === 0 ? "view" : lv < level ? "done" : lv === level ? "now" : "next";
        const d = 2 + i * 3;                               // xuất hiện từ dưới lên
        const a = interpolate(frame, [f0 + d, f0 + d + 6], [0, 1], { ...CL, easing: EASE });
        const now = st === "now";
        const showInfo = st === "done" || now;
        const sc = now ? 1 + 0.035 * lit : 1;
        const logos = (r.logos ?? []).filter((g) => g.t === undefined || t >= g.t);
        const fg = now && lit > 0.5 ? "#0A0A0A" : "#FFFFFF";
        return (
          <div key={i} style={{ position: "absolute", left: X0, top: y, width: RW, height: RH, opacity: a * (st === "next" ? 0.42 : st === "view" ? 0.9 : 1),
            transform: `translateY(${(1 - a) * 22}px) scale(${sc})`, transformOrigin: "0% 50%" }}>
            {/* khung bậc */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 30,
              border: st === "next" ? "2px dashed rgba(255,255,255,0.28)" : now ? "2px solid rgba(255,255,255,0.9)" : "2px solid rgba(255,255,255,0.22)",
              backgroundColor: st === "done" ? "rgba(255,255,255,0.09)" : st === "view" ? "rgba(255,255,255,0.05)" : "transparent",
              boxShadow: now ? `0 0 ${70 * lit}px rgba(255,255,255,${0.28 * lit})` : "none" }} />
            {/* bậc đang nói: nền trắng quét từ trái sang */}
            {now ? <div style={{ position: "absolute", inset: 0, borderRadius: 30, backgroundColor: "#fff", clipPath: `inset(0 ${(1 - lit) * 100}% 0 0 round 30px)` }} /> : null}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 26px", gap: 24 }}>
              <div style={{ width: 84, height: 84, borderRadius: 42, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: now ? ACCENT : st === "done" ? "#fff" : "transparent", border: now || st === "done" ? "none" : "2px solid rgba(255,255,255,0.5)",
                fontFamily: F, fontWeight: 800, fontSize: 44, color: now ? "#fff" : st === "done" ? "#0A0A0A" : "#fff" }}>{lv}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F, fontWeight: 800, fontSize: fitW(r.name, 52, 420), letterSpacing: TRACK_BIG, color: fg, lineHeight: 1.05, whiteSpace: "nowrap" }}>{r.name}</div>
                {showInfo && r.note ? <div style={{ fontFamily: F, fontWeight: 600, fontSize: fitW(r.note, 27, 440), letterSpacing: TRACK, color: now && lit > 0.5 ? "#4a4a4a" : "#bdbdbd", marginTop: 6, whiteSpace: "nowrap" }}>{r.note}</div> : null}
              </div>
              {showInfo && logos.length ? (
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  {logos.map((g, j) => {
                    const fa = g.t === undefined ? 1 : interpolate(t, [g.t, g.t + 0.25], [0, 1], CL);
                    return <div key={j} style={{ opacity: fa, transform: `scale(${0.8 + 0.2 * fa})`, borderRadius: 18, boxShadow: now && lit > 0.5 ? "0 4px 14px rgba(0,0,0,0.18)" : "none" }}><LogoBox file={g.file} size={66} r={0.27} /></div>;
                  })}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ───────── KHUNG SO SÁNH công cụ (21/10) ─────────
// Hàng dọc từng công cụ: logo + tên + nhận xét. Tới tPick → cái được chọn nền trắng, nhãn cam "CHỌN"; các cái khác mờ đi.
// Không có pick = các công cụ ngang nhau (vd 2 công cụ ảnh đều nên dùng).
const Compare: React.FC<{ s: Extract<D4Scene, { kind: "compare" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = sec(s.from, fps);
  const n = s.items.length;
  const RH = n >= 3 ? 172 : 196, gap = n === 2 && s.pick !== undefined ? 92 : 26;
  const blockH = n * RH + (n - 1) * gap;
  const top0 = 0.52 * H - blockH / 2;
  const fp = s.tPick !== undefined ? sec(s.tPick, fps) : Infinity;
  const pk = s.pick !== undefined ? interpolate(frame, [fp, fp + 9], [0, 1], { ...CL, easing: EASE }) : 0;
  const aT = interpolate(frame, [f0, f0 + 6], [0, 1], CL);
  const X0 = 80, RW = 810;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: X0, top: 0.2 * H, opacity: aT }}>
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: 28, letterSpacing: "0.22em", color: "#a8a8a8" }}>{s.label ?? "SO SÁNH"}</div>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: fitW(s.title, 66, RW), letterSpacing: TRACK_BIG, color: "#fff", marginTop: 8, whiteSpace: "nowrap", textShadow: SH }}>{s.title}</div>
      </div>
      {s.items.map((it, i) => {
        const ft = sec(it.t ?? s.from + 0.18 + i * 0.22, fps);
        const a = interpolate(frame, [ft, ft + 7], [0, 1], { ...CL, easing: EASE });
        const win = s.pick === i;
        const lose = s.pick !== undefined && !win;
        const y = top0 + i * (RH + gap);
        const fg = win && pk > 0.5 ? "#0A0A0A" : "#fff";
        return (
          <div key={i} style={{ position: "absolute", left: X0, top: y, width: RW, height: RH,
            opacity: a * (lose ? 1 - 0.6 * pk : 1),
            transform: `translateY(${(1 - a) * 24}px) scale(${win ? 1 + 0.04 * pk : lose ? 1 - 0.03 * pk : 1})`, transformOrigin: "0% 50%" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.10)", border: "2px solid rgba(255,255,255,0.22)", backdropFilter: "blur(6px)" }} />
            {win ? <div style={{ position: "absolute", inset: 0, borderRadius: 32, backgroundColor: "#fff", opacity: pk, boxShadow: `0 0 ${80 * pk}px rgba(255,255,255,${0.3 * pk})` }} /> : null}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 28px", gap: 28 }}>
              <div style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.25)", borderRadius: RH * 0.62 * 0.26 }}><LogoBox file={it.file} size={RH * 0.62} r={0.26} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F, fontWeight: 800, fontSize: fitW(it.name, 58, 470), letterSpacing: TRACK_BIG, color: fg, lineHeight: 1.05, whiteSpace: "nowrap" }}>{it.name}</div>
                {it.note ? <div style={{ fontFamily: F, fontWeight: 600, fontSize: fitW(it.note, 30, 470), letterSpacing: TRACK, color: win && pk > 0.5 ? "#4a4a4a" : "#cfcfcf", marginTop: 8, whiteSpace: "nowrap" }}>{it.note}</div> : null}
              </div>
              {win ? (
                <div style={{ flexShrink: 0, padding: "12px 22px", borderRadius: 999, backgroundColor: ACCENT, opacity: pk, transform: `scale(${0.7 + 0.3 * pk})`,
                  fontFamily: F, fontWeight: 800, fontSize: 30, letterSpacing: "0.04em", color: "#fff", whiteSpace: "nowrap" }}>{s.pickText ?? "★ CHỌN"}</div>
              ) : null}
            </div>
          </div>
        );
      })}
      {n === 2 && s.pick !== undefined ? (
        <div style={{ position: "absolute", left: X0, width: RW, top: top0 + RH + gap / 2 - 26, textAlign: "center", fontFamily: F, fontWeight: 800, fontSize: 40, letterSpacing: "0.12em", color: "rgba(255,255,255,0.75)", opacity: interpolate(frame, [f0 + 8, f0 + 14], [0, 1], CL) }}>VS</div>
      ) : null}
    </AbsoluteFill>
  );
};

const PANEL = ["card", "phone", "ladder", "compare"];   // cảnh phủ kín: không chữ chạy, không logo nhỏ

export const Dang4Mono: React.FC<D4Props> = (props) => {
  useFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  GRADED = !!props.graded;
  const idx = props.scenes.findIndex((s) => t >= s.from && t < s.to);
  const sc = idx >= 0 ? props.scenes[idx] : ({ kind: "talk", from: 0, to: props.durationSec } as D4Scene);
  // CHUYỂN CẢNH MƯỢT: cảnh trước giữ bên dưới, cảnh sau hoà vào trong softCut khung (kèm nhoè + phóng rất nhẹ)
  const SOFT = props.softCut ?? 5;
  const sf = idx >= 0 ? sec(sc.from, fps) : 0;
  const fading = idx > 0 && SOFT > 0 && sc.kind !== "card" && props.scenes[idx - 1].kind !== "card" && frame < sf + SOFT;
  const mix = fading ? interpolate(frame, [sf, sf + SOFT], [0, 1], { ...CL, easing: Easing.out(Easing.quad) }) : 1;
  // thẻ đang trồi lên → cảnh trước vẫn phải hiện bên dưới
  const under = (sc.kind === "card" && idx > 0 && frame < sf + 9 ? props.scenes[idx - 1] : null) || (fading ? props.scenes[idx - 1] : null);
  const next = idx >= 0 && idx + 1 < props.scenes.length ? props.scenes[idx + 1] : null;
  const base = (s: D4Scene) => (s.kind === "talk" ? <Talk s={s} video={props.video} g={props.grade} /> : s.kind === "broll" ? <Broll s={s} g={props.grade} /> : s.kind === "photo" ? <Photo s={s} g={props.grade} /> : null);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {under ? base(under) : null}
      {!PANEL.includes(sc.kind) ? (
        <AbsoluteFill style={fading ? { opacity: mix, filter: `blur(${(1 - mix) * 7}px)`, transform: `scale(${1 + (1 - mix) * 0.02})` } : undefined}>{base(sc)}</AbsoluteFill>
      ) : null}
      {sc.kind === "phone" ? (
        <>
          {/* nền: cảnh nói làm mờ + tối để điện thoại nổi lên */}
          <AbsoluteFill style={{ filter: "blur(16px) brightness(0.42)", transform: "scale(1.08)" }}>
            <Talk s={{ kind: "talk", from: sc.from, to: sc.to, scale: 1.0 }} video={props.video} g={props.grade} />
          </AbsoluteFill>
          <PhoneChat s={sc} />
        </>
      ) : null}
      {sc.kind === "ladder" && props.ladder ? <Ladder s={sc} L={props.ladder} /> : null}
      {sc.kind === "compare" ? (
        <>
          {/* nền: cảnh nói làm mờ + tối như cảnh điện thoại */}
          <AbsoluteFill style={{ filter: "blur(18px) brightness(0.36)", transform: "scale(1.08)" }}>
            <Talk s={{ kind: "talk", from: sc.from, to: sc.to, scale: 1.0 }} video={props.video} g={props.grade} />
          </AbsoluteFill>
          <Compare s={sc} />
        </>
      ) : null}
      {!PANEL.includes(sc.kind) ? <Captions caps={props.captions} /> : null}
      {!PANEL.includes(sc.kind) ? (props.lists ?? []).map((l, i) => <ListLayer key={i} l={l} />) : null}
      {!PANEL.includes(sc.kind) && props.logos ? <LogoChips logos={props.logos} /> : null}
      {props.title && !PANEL.includes(sc.kind) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.085, textAlign: "center" }}>
          {props.title.sub ? <div style={{ fontFamily: F, fontWeight: 600, fontSize: 30, letterSpacing: TRACK, color: "#fff", textShadow: SH }}>{props.title.sub}</div> : null}
          <div style={{ fontFamily: F, fontWeight: 800, fontSize: 56, letterSpacing: TRACK, color: "#fff", textShadow: SH }}>{props.title.text}</div>
        </div>
      ) : null}
      {next && next.kind === "card" ? <CardHaze s={next} /> : null}
      {sc.kind === "card" ? <Card s={sc} /> : null}
      {(props.leaks ?? []).map((l, i) => <Leak key={i} l={l} />)}
      {sc.kind !== "card" ? (
        <AbsoluteFill style={{ backgroundImage: `url(${staticFile("tex/grain.png")})`, backgroundPosition: `${(frame * 137) % 512}px ${(frame * 89) % 512}px`, opacity: props.grade?.grain ?? 0.06, mixBlendMode: "overlay" }} />
      ) : null}
    </AbsoluteFill>
  );
};
