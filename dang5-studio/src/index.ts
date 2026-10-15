// Cửa vào của bộ dựng Dạng 4 "Mono Bold".
// Render:  npx remotion render src/index.ts dang4 out.mp4 --props=plan.json
// Xem thử: npx remotion studio src/index.ts
// public/ chứa phông, hạt phim, bộ lọc màu, tiếng động, nhạc và _jobs/ (mỗi video một thư mục).
import { registerRoot } from "remotion";
import { Dang4Root } from "./Root";

registerRoot(Dang4Root);
