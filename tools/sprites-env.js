'use strict';
/* Môi trường & vật phẩm */
const { Img, solid, radial, linear, hex } = require('./sprite-lib');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bgDesert() { /* 1024x1024 — sa mạc nhìn từ trên xuống */
  const S = 1024;
  const img = new Img(S, S, 1);
  const rng = mulberry32(42);
  // Nền gradient cát
  img.fillPoly([[0, 0], [S, 0], [S, S], [0, S]], linear(0, 0, 0, S,
    [[0, '#dcb283'], [0.35, '#caa072'], [0.75, '#a8835c'], [1, '#8a6a4a']]));
  // Gợn sóy cát (dune ripples)
  for (let i = 0; i < 52; i++) {
    const yBase = rng() * S;
    const amp = 2 + rng() * 5;
    const freq = 0.006 + rng() * 0.008;
    const phase = rng() * 10;
    const light = rng() < 0.45;
    const col = light ? [232, 200, 144, 0.10] : [106, 74, 48, 0.12];
    const pts = [];
    for (let x = 0; x <= S; x += 16) pts.push([x, yBase + Math.sin(x * freq + phase) * amp]);
    img.polyline(pts, 2 + rng() * 2, () => col);
  }
  // Bóng dún lớn (rất nhẹ)
  for (let i = 0; i < 3; i++) {
    img.fillEllipse(rng() * S, rng() * S, 140 + rng() * 160, 70 + rng() * 90, rng() * 3, () => [70, 45, 25, 0.03]);
  }
  // Miệng nứt nẻ
  for (let i = 0; i < 6; i++) {
    const cx2 = 80 + rng() * (S - 160), cy2 = 80 + rng() * (S - 160), r = 34 + rng() * 44;
    img.fillEllipse(cx2, cy2, r, r * 0.7, rng() * 3, () => [120, 84, 52, 0.12]);
    for (let k = 0; k < 4; k++) {
      const a = rng() * Math.PI * 2;
      const pts = [[cx2, cy2]];
      let px2 = cx2, py2 = cy2, ang = a;
      for (let s = 0; s < 3; s++) {
        ang += (rng() - 0.5) * 1.2;
        px2 += Math.cos(ang) * r * 0.4; py2 += Math.sin(ang) * r * 0.4;
        pts.push([px2, py2]);
      }
      img.polyline(pts, 1.6, () => [90, 60, 34, 0.4]);
    }
  }
  // Đá nhỏ rải rác
  for (let i = 0; i < 10; i++) {
    const cx2 = 40 + rng() * (S - 80), cy2 = 40 + rng() * (S - 80), r = 5 + rng() * 11;
    const pts = [];
    const n = 7;
    for (let k = 0; k < n; k++) {
      const a = k * Math.PI * 2 / n + rng() * 0.3;
      pts.push([cx2 + Math.cos(a) * r * (0.8 + rng() * 0.4), cy2 + Math.sin(a) * r * (0.7 + rng() * 0.3)]);
    }
    img.fillPoly(pts, radial(cx2 - r * 0.4, cy2 - r * 0.4, 0, r * 2, [[0, '#c8a878'], [1, '#6a4a2a']]));
    img.strokePoly(pts, 1.5, () => [58, 42, 26, 0.7]);
  }
  // Đốm cát
  for (let i = 0; i < 700; i++) {
    const x = rng() * S, y = rng() * S, light = rng() < 0.5;
    img.fillCircle(x, y, 0.8 + rng() * 0.9, () => light ? [255, 236, 200, 0.09] : [74, 48, 26, 0.1]);
  }
  return img;
}

function rockVariant(seed) { /* 4 viên đá 256x256 */
  const img = new Img(256, 256, 3);
  const rng = mulberry32(seed);
  const cx2 = 128, cy2 = 140, base = 78 + seed * 6;
  const pts = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = i * Math.PI * 2 / n + rng() * 0.25;
    const r = base * (0.72 + rng() * 0.34);
    pts.push([cx2 + Math.cos(a) * r, cy2 + Math.sin(a) * r * 0.84]);
  }
  img.fillPoly(pts, radial(cx2 - base * 0.45, cy2 - base * 0.45, 0, base * 2, [[0, '#A08868'], [0.55, '#7A6040'], [1, '#4A3820']]));
  img.strokePoly(pts, 5, solid('#2a1a10'));
  // Nét sáng mặt trên
  const hi = pts.map(([x, y]) => [127 + (x - cx2) * 0.55 - 8, cy2 + (y - cy2) * 0.55 - 16]);
  img.fillPoly(hi, () => [255, 240, 215, 0.14]);
  // Vết nứt
  for (let k = 0; k < 2; k++) {
    let px2 = cx2 + (rng() - 0.5) * 60, py2 = cy2 - 20 + rng() * 30;
    const seg = [[px2, py2]];
    for (let s = 0; s < 3; s++) { px2 += (rng() - 0.3) * 50; py2 += 20 + rng() * 25; seg.push([px2, py2]); }
    img.polyline(seg, 3, () => [42, 26, 16, 0.55]);
  }
  return img;
}

function cactusSprite() { /* Xương rồng 256x256 */
  const img = new Img(256, 256, 3);
  const dark = '#123a12';
  // Mound cát
  img.fillEllipse(128, 216, 58, 16, 0, () => [160, 120, 80, 0.9]);
  img.strokeEllipse(128, 216, 58, 16, 0, 2, solid('#6a4a2a'));
  // Thân
  function limb(cx2, cy2, rx, ry, rot) {
    img.fillEllipse(cx2, cy2, rx, ry, rot, radial(cx2 - rx * 0.4, cy2 - ry * 0.5, 0, Math.max(rx, ry) * 2, [[0, '#3f8a3f'], [0.55, '#2A6A2A'], [1, '#1a4a1a']]));
    img.strokeEllipse(cx2, cy2, rx, ry, rot, 3.5, solid(dark));
  }
  limb(128, 122, 36, 92, 0);       // thân chính
  limb(84, 128, 19, 44, -0.42);    // tay trái
  limb(172, 146, 19, 42, 0.42);    // tay phải
  // Sợi gân dọc
  for (const off of [-16, 0, 16]) {
    const pts = [];
    for (let y = 44; y <= 208; y += 8) pts.push([128 + off + Math.sin(y * 0.05) * 3, y]);
    img.polyline(pts, 2, () => [18, 74, 18, 0.55]);
  }
  // Gai trắng
  const rng = mulberry32(9);
  for (let i = 0; i < 26; i++) {
    const a = rng() * Math.PI * 2, rr = 0.5 + rng() * 0.82;
    img.line(128 + Math.cos(a) * 36 * rr * 0.9, 122 + Math.sin(a) * 92 * rr,
      128 + Math.cos(a) * 36 * (rr + 0.1), 122 + Math.sin(a) * 92 * (rr + 0.1), 1.4, solid('#e8f0e0'));
  }
  // Hoa hồng
  img.glow(128, 32, 14, '#ff9db1', 0.7);
  img.fillCircle(128, 32, 9, radial(126, 30, 0, 12, [[0, '#ffd0da'], [1, '#ff4d6d']]));
  img.fillCircle(128, 32, 3.5, solid('#ffe066'));
  return img;
}

function coinSprite() { /* Xu vàng 128x128 */
  const img = new Img(128, 128, 4);
  img.fillCircle(64, 64, 52, radial(52, 48, 0, 70, [[0, '#ffe08a'], [0.55, '#FFD166'], [1, '#b87708']]));
  img.strokeEllipse(64, 64, 52, 52, 0, 4, solid('#7a5208'));
  img.strokeEllipse(64, 64, 42, 42, 0, 3, () => [160, 107, 26, 0.85]);
  // Ký hiệu $ : thanh dọc + hai cung S
  img.line(64, 38, 64, 90, 5, solid('#8a5a10'));
  const arc = (cx2, cy2, r, a0, a1) => {
    const pts = [];
    for (let t = a0; t <= a1; t += 0.12) pts.push([cx2 + Math.cos(t) * r, cy2 + Math.sin(t) * r]);
    return pts;
  };
  img.polyline(arc(64, 52, 10, Math.PI * 0.35, Math.PI * 1.55), 5, solid('#8a5a10'));
  img.polyline(arc(64, 76, 10, Math.PI * 1.35, Math.PI * 2.55), 5, solid('#8a5a10'));
  // Lóe sáng
  img.line(38, 40, 47, 49, 3, () => [255, 255, 255, 0.85]);
  img.line(47, 40, 38, 49, 3, () => [255, 255, 255, 0.85]);
  return img;
}

function meatSprite() { /* Thịt rồng 256x256 */
  const img = new Img(256, 256, 3);
  const dark = '#4a0000';
  img.glow(122, 128, 100, '#ff8c1a', 0.28);
  // Miếng thịt
  const pts = [];
  const rng = mulberry32(7);
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI * 2 / 10;
    const r = 62 * (0.85 + rng() * 0.3);
    pts.push([116 + Math.cos(a) * r, 132 + Math.sin(a) * r * 0.82]);
  }
  img.fillPoly(pts, radial(96, 108, 0, 120, [[0, '#e86a6a'], [0.55, '#c1121f'], [1, '#7a0a0a']]));
  img.strokePoly(pts, 5, solid(dark));
  // Sọc mỡ
  img.line(78, 108, 138, 160, 6, () => [255, 220, 220, 0.5]);
  img.line(96, 96, 150, 142, 4, () => [255, 220, 220, 0.35]);
  // Dấu nướng
  for (const off of [-18, 0, 18]) {
    img.line(84 + off, 92 + off * 0.3, 140 + off, 150 + off * 0.3, 4, () => [60, 0, 0, 0.45]);
  }
  // Xúc xít xương
  img.fillPoly([[160, 118], [200, 102], [206, 122], [166, 138]], linear(160, 118, 206, 122, [[0, '#f5f0e0'], [1, '#c8b898']]));
  img.strokePoly([[160, 118], [200, 102], [206, 122], [166, 138]], 3, solid('#6a5a3a'));
  img.fillCircle(212, 96, 13, radial(206, 90, 0, 20, [[0, '#fffdf2'], [1, '#c8b898']]));
  img.strokeEllipse(212, 96, 13, 13, 0, 2.5, solid('#6a5a3a'));
  img.fillCircle(206, 118, 10, radial(202, 114, 0, 16, [[0, '#fffdf2'], [1, '#c8b898']]));
  img.strokeEllipse(206, 118, 10, 10, 0, 2.5, solid('#6a5a3a'));
  // Tia lửa
  const rng2 = mulberry32(3);
  for (let i = 0; i < 6; i++) {
    const x = 40 + rng2() * 170, y = 30 + rng2() * 170;
    img.glow(x, y, 5, '#ff8c1a', 0.8);
    img.fillCircle(x, y, 1.8, solid('#ffd166'));
  }
  return img;
}

module.exports = { bgDesert, rockVariant, cactusSprite, coinSprite, meatSprite };
