import { CanvasTexture, SRGBColorSpace } from "three";

/**
 * Textures des cartes dessinées au canvas 2D, une seule fois par figure.
 * Même habillage que PlayingCard.jsx : dégradé de la figure, liseré,
 * glyphe au centre et nom en bas. Les coins arrondis passent par l'alpha.
 */

const W = 250;
const H = 350;
const R = 26;
const EMOJI_FONT = `"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
const TEXT_FONT = `ui-rounded,"SF Pro Rounded",Quicksand,"Trebuchet MS",system-ui,sans-serif`;

const cache = new Map();

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  return [canvas, canvas.getContext("2d")];
}

function toTexture(canvas) {
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Glyphe : emoji, ou pastille colorée avec initiale pour Mario et Luigi. */
function drawGlyph(ctx, sym, cx, cy, size) {
  if (sym.letter) {
    ctx.fillStyle = sym.badge;
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${size * 0.6}px ${TEXT_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sym.letter, cx, cy + size * 0.03);
    return;
  }
  ctx.font = `${size}px ${EMOJI_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(sym.emoji, cx, cy + size * 0.06);
}

/** Recto d'une figure. */
export function frontTexture(sym) {
  const key = `front:${sym.id}`;
  if (cache.has(key)) return cache.get(key);

  const [canvas, ctx] = makeCanvas();
  const [c1 = "#FFFFFF", c2 = "#EEEEEE"] = sym.face.match(/#[0-9a-f]{6}/gi) ?? [];

  roundRect(ctx, 4, 4, W - 8, H - 8, R);
  const grad = ctx.createLinearGradient(0, 0, W * 0.4, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = sym.edge;
  ctx.stroke();

  drawGlyph(ctx, sym, 38, 40, 40);
  drawGlyph(ctx, sym, W / 2, H / 2 - 14, 120);

  ctx.fillStyle = sym.edge;
  ctx.font = `800 30px ${TEXT_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(sym.name, W / 2, H - 42);

  const tex = toTexture(canvas);
  cache.set(key, tex);
  return tex;
}

/** Verso commun : rayures vertes, liseré doré, médaillon « L ». */
export function backTexture() {
  if (cache.has("back")) return cache.get("back");

  const [canvas, ctx] = makeCanvas();

  roundRect(ctx, 4, 4, W - 8, H - 8, R);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#0B6339";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#0E7A45";
  ctx.lineWidth = 11;
  for (let d = -H; d < W + H; d += 22) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + H, H);
    ctx.stroke();
  }
  ctx.restore();

  roundRect(ctx, 4, 4, W - 8, H - 8, R);
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#F7E27A";
  ctx.stroke();

  ctx.fillStyle = "#F7E27A";
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#065F46";
  ctx.font = `900 70px ${TEXT_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("L", W / 2, H / 2 + 3);

  const tex = toTexture(canvas);
  cache.set("back", tex);
  return tex;
}

/** Emblème de casquette : rond blanc, « L » vert. */
export function capEmblemTexture() {
  if (cache.has("cap")) return cache.get("cap");

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0E9F4F";
  ctx.font = `900 84px ${TEXT_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("L", 64, 69);

  const tex = toTexture(canvas);
  cache.set("cap", tex);
  return tex;
}
