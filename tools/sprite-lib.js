'use strict';
/* Thư viện raster mini: PNG encoder + vẽ có supersampling (không cần package nào) */
const fs = require('fs');
const zlib = require('zlib');

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------- PNG ENCODER ---------------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c; }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

/* ---------------- COLOR ---------------- */
function hex(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function sampleStops(st, t) {
  t = clamp(t, 0, 1);
  for (let i = 0; i < st.length - 1; i++) {
    const s0 = st[i], s1 = st[i + 1];
    if (t <= s1[0]) {
      const k = s1[0] === s0[0] ? 0 : (t - s0[0]) / (s1[0] - s0[0]);
      return [
        s0[1] + (s1[1] - s0[1]) * k,
        s0[2] + (s1[2] - s0[2]) * k,
        s0[3] + (s1[3] - s0[3]) * k,
        s0[4] + (s1[4] - s0[4]) * k,
      ];
    }
  }
  const l = st[st.length - 1];
  return [l[1], l[2], l[3], l[4]];
}
function prep(st) {
  return st.map(([t, c, a]) => { const h = hex(c); return [t, h[0], h[1], h[2], a === undefined ? 1 : a]; });
}
const solid = (h, a = 1) => { const c = hex(h); return () => [c[0], c[1], c[2], a]; };
const radial = (cx, cy, r0, r1, st) => {
  const S = prep(st);
  return (x, y) => sampleStops(S, clamp((Math.hypot(x - cx, y - cy) - r0) / ((r1 - r0) || 1), 0, 1));
};
const linear = (x1, y1, x2, y2, st) => {
  const S = prep(st);
  const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1;
  return (x, y) => sampleStops(S, clamp(((x - x1) * dx + (y - y1) * dy) / L, 0, 1));
};

/* ---------------- IMG (raster supersampled) ---------------- */
class Img {
  constructor(w, h, ss = 2) {
    this.w = w; this.h = h; this.ss = ss;
    this.W = w * ss; this.H = h * ss;
    this.d = Buffer.alloc(this.W * this.H * 4);
    this._t = null;
  }
  withTransform(rot, px, py, fn) {
    const old = this._t;
    this._t = { c: Math.cos(rot), s: Math.sin(rot), px, py };
    fn();
    this._t = old;
  }
  _map(x, y) { // screen → local (local (0,0) = pivot, vẽ quanh pivot)
    const t = this._t;
    if (!t) return [x, y];
    const dx = x - t.px, dy = y - t.py;
    return [dx * t.c + dy * t.s, -dx * t.s + dy * t.c];
  }
  _toScreen(x, y) { // local → screen (tính bbox)
    const t = this._t;
    if (!t) return [x, y];
    return [t.px + x * t.c - y * t.s, t.py + x * t.s + y * t.c];
  }
  px(X, Y, r, g, b, a) {
    if (X < 0 || Y < 0 || X >= this.W || Y >= this.H) return;
    const i = (Y * this.W + X) * 4, d = this.d, sa = clamp(a, 0, 1);
    if (sa <= 0) return;
    const da = d[i + 3] / 255, oa = sa + da * (1 - sa);
    d[i] = (r * sa + d[i] * da * (1 - sa)) / oa;
    d[i + 1] = (g * sa + d[i + 1] * da * (1 - sa)) / oa;
    d[i + 2] = (b * sa + d[i + 2] * da * (1 - sa)) / oa;
    d[i + 3] = oa * 255;
  }
  _bbox(cx, cy, R) {
    const ss = this.ss;
    return [
      Math.max(0, Math.floor((cx - R) * ss)), Math.min(this.W, Math.ceil((cx + R) * ss)),
      Math.max(0, Math.floor((cy - R) * ss)), Math.min(this.H, Math.ceil((cy + R) * ss)),
    ];
  }
  fillEllipse(cx, cy, rx, ry, rot, fn) {
    const ss = this.ss;
    const [scx, scy] = this._toScreen(cx, cy);
    const R = Math.max(rx, ry) + Math.min(rx, ry) * 0.5 + 2;
    const [bx0, bx1, by0, by1] = this._bbox(scx, scy, R);
    const cr = Math.cos(rot), sr = Math.sin(rot);
    for (let Y = by0; Y < by1; Y++) for (let X = bx0; X < bx1; X++) {
      const [x, y] = this._map((X + .5) / ss, (Y + .5) / ss);
      const dx = x - cx, dy = y - cy;
      const u = (dx * cr + dy * sr) / rx, v = (-dx * sr + dy * cr) / ry;
      if (u * u + v * v <= 1) { const c = fn(x, y); this.px(X, Y, c[0], c[1], c[2], c[3]); }
    }
  }
  fillCircle(cx, cy, r, fn) { this.fillEllipse(cx, cy, r, r, 0, fn); }
  strokeEllipse(cx, cy, rx, ry, rot, w, fn) {
    const ss = this.ss, hw = w / 2;
    const orx = rx + hw, ory = ry + hw, irx = Math.max(.1, rx - hw), iry = Math.max(.1, ry - hw);
    const [scx, scy] = this._toScreen(cx, cy);
    const [bx0, bx1, by0, by1] = this._bbox(scx, scy, Math.max(orx, ory) + Math.min(rx, ry) * 0.5 + 2);
    const cr = Math.cos(rot), sr = Math.sin(rot);
    for (let Y = by0; Y < by1; Y++) for (let X = bx0; X < bx1; X++) {
      const [x, y] = this._map((X + .5) / ss, (Y + .5) / ss);
      const dx = x - cx, dy = y - cy;
      const uo = (dx * cr + dy * sr) / orx, vo = (-dx * sr + dy * cr) / ory;
      if (uo * uo + vo * vo <= 1) {
        const ui = (dx * cr + dy * sr) / irx, vi = (-dx * sr + dy * cr) / iry;
        if (ui * ui + vi * vi >= 1) { const c = fn(x, y); this.px(X, Y, c[0], c[1], c[2], c[3]); }
      }
    }
  }
  ring(cx, cy, r, w, fn) { this.strokeEllipse(cx, cy, r, r, 0, w, fn); }
  fillPoly(pts, fn) {
    const ss = this.ss;
    const sp = pts.map(p => this._toScreen(p[0], p[1]));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of sp) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const bx0 = Math.max(0, Math.floor(x0 * ss)), bx1 = Math.min(this.W, Math.ceil(x1 * ss));
    const by0 = Math.max(0, Math.floor(y0 * ss)), by1 = Math.min(this.H, Math.ceil(y1 * ss));
    const n = pts.length;
    for (let Y = by0; Y < by1; Y++) for (let X = bx0; X < bx1; X++) {
      const [x, y] = this._map((X + .5) / ss, (Y + .5) / ss);
      let inside = false;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const yi = pts[i][1], yj = pts[j][1], xi = pts[i][0], xj = pts[j][0];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) { const c = fn(x, y); this.px(X, Y, c[0], c[1], c[2], c[3]); }
    }
  }
  strokePoly(pts, w, fn) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      this.line(a[0], a[1], b[0], b[1], w, fn);
    }
  }
  line(x1, y1, x2, y2, w, fn) {
    const ss = this.ss, hw = w / 2;
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1e-6;
    const [sx1, sy1] = this._toScreen(x1, y1), [sx2, sy2] = this._toScreen(x2, y2);
    const bx0 = Math.max(0, Math.floor((Math.min(sx1, sx2) - hw) * ss)), bx1 = Math.min(this.W, Math.ceil((Math.max(sx1, sx2) + hw) * ss));
    const by0 = Math.max(0, Math.floor((Math.min(sy1, sy2) - hw) * ss)), by1 = Math.min(this.H, Math.ceil((Math.max(sy1, sy2) + hw) * ss));
    for (let Y = by0; Y < by1; Y++) for (let X = bx0; X < bx1; X++) {
      const [x, y] = this._map((X + .5) / ss, (Y + .5) / ss);
      let t = ((x - x1) * dx + (y - y1) * dy) / L2;
      t = clamp(t, 0, 1);
      const d = Math.hypot(x - (x1 + dx * t), y - (y1 + dy * t));
      if (d <= hw) { const c = fn(x, y); this.px(X, Y, c[0], c[1], c[2], c[3]); }
    }
  }
  polyline(pts, w, fn) {
    for (let i = 0; i < pts.length - 1; i++) this.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w, fn);
  }
  glow(cx, cy, r, color, A = 0.6) {
    const [R, G, B] = hex(color);
    this.fillCircle(cx, cy, r, (x, y) => {
      const t = Math.hypot(x - cx, y - cy) / r;
      return [R, G, B, A * Math.pow(1 - t, 1.8)];
    });
  }
  flatten() {
    const ss = this.ss, W = this.w, H = this.h, d = this.d;
    const out = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const i = ((y * ss + sy) * this.W + (x * ss + sx)) * 4;
        const al = d[i + 3] / 255;
        r += d[i] * al; g += d[i + 1] * al; b += d[i + 2] * al; a += al;
      }
      const oa = a / (ss * ss), j = (y * W + x) * 4;
      if (a > 0) {
        out[j] = clamp(Math.round(r / a), 0, 255);
        out[j + 1] = clamp(Math.round(g / a), 0, 255);
        out[j + 2] = clamp(Math.round(b / a), 0, 255);
      }
      out[j + 3] = Math.round(oa * 255);
    }
    return out;
  }
  paste(srcImg, x, y) {
    if (this.ss !== 1) throw new Error('paste yêu cầu đích ss=1');
    const data = srcImg.flatten(), w = srcImg.w, h = srcImg.h, d = this.d;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const si = (yy * w + xx) * 4;
      const sa = data[si + 3] / 255;
      if (sa <= 0) continue;
      const gx = x + xx, gy = y + yy;
      if (gx < 0 || gy < 0 || gx >= this.w || gy >= this.h) continue;
      const i = (gy * this.w + gx) * 4, da = d[i + 3] / 255, oa = sa + da * (1 - sa);
      d[i] = (data[si] * sa + d[i] * da * (1 - sa)) / oa;
      d[i + 1] = (data[si + 1] * sa + d[i + 1] * da * (1 - sa)) / oa;
      d[i + 2] = (data[si + 2] * sa + d[i + 2] * da * (1 - sa)) / oa;
      d[i + 3] = oa * 255;
    }
  }
  save(file) {
    fs.writeFileSync(file, encodePNG(this.w, this.h, this.flatten()));
    console.log('OK', path.basename(file), this.w + 'x' + this.h, Math.round(fs.statSync(file).size / 1024) + 'KB');
  }
}

module.exports = { Img, encodePNG, hex, solid, radial, linear, clamp };
const path = require('path'); // noqa: dùng trong save()
