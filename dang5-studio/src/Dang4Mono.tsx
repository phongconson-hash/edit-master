// DẠNG 4 "Mono Bold" — học từ kênh Thao Tran (4 reel, 13/10/2026). Claude viết plan.json, file này chỉ dựng hình.
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

export type D4Scene =
  | { kind: "talk"; from: number; to: number; scale?: number; anchorY?: number }
  | { kind: "broll"; from: number; to: number; file: string; pos?: string }
  | { kind: "card"; from: number; to: number; tone: "white" | "black"; enter?: "wipe" | "cut"; small?: string; big: string; tBig?: number; order?: "small-big" | "big-small" };
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
    <div key="s" style={{ fontFamily: F, fontWeight: 700, fontSize: fit(s.small, 62, 24), letterSpacing: TRACK, color: fg, opacity: aS, lineHeight: 1.18, marginBottom: 14, whiteSpace: "nowrap" }}>{s.small}</div>
  ) : null;
  const big = (
    <div key="b" style={{ fontFamily: F, fontWeight: 800, fontSize: fit(s.big, 132, 13), letterSpacing: TRACK_BIG, color: fg, opacity: aB, lineHeight: 1.12, whiteSpace: "nowrap", transform: `scale(${1 + 0.02 * Math.min(1, Math.max(0, frame - tb) / 70)})` }}>{s.big}</div>
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
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: fit(c.lead, 60, 26), letterSpacing: TRACK, color: "#fff", textShadow: SH, opacity: aL, lineHeight: 1.16, whiteSpace: "nowrap", position: "relative" }}>{c.lead}</div>
      ) : (
        <div style={{ height: 63 }} />
      )}
      {c.punch && frame >= pf ? (
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: fit(c.punch, 128, 13), letterSpacing: TRACK_BIG, color: "#fff", textShadow: SH, opacity: aP, lineHeight: 1.1, whiteSpace: "nowrap", marginTop: 10, position: "relative" }}>{c.punch}</div>
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
  const base = (s: D4Scene) => (s.kind === "talk" ? <Talk s={s} video={props.video} g={props.grade} /> : s.kind === "broll" ? <Broll s={s} g={props.grade} /> : null);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {under ? base(under) : null}
      {sc.kind !== "card" ? (
        <AbsoluteFill style={fading ? { opacity: mix, filter: `blur(${(1 - mix) * 7}px)`, transform: `scale(${1 + (1 - mix) * 0.02})` } : undefined}>{base(sc)}</AbsoluteFill>
      ) : null}
      {sc.kind !== "card" ? <Captions caps={props.captions} /> : null}
      {sc.kind !== "card" ? (props.lists ?? []).map((l, i) => <ListLayer key={i} l={l} />) : null}
      {props.title && sc.kind !== "card" ? (
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
