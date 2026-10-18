'use strict';
/* Quái 3 tầng, Rồng boss, Nhện triệu hồi, Bia tập luyện — 256x256, hướng PHẢI */
const { Img, solid, radial, linear } = require('./sprite-lib');

function monsterT1() { /* Bọ cát nâu */
  const img = new Img(256, 256, 3);
  const dark = '#241108';
  // 6 chân
  const legs = [
    [78, 158, 48, 186], [108, 168, 92, 202], [146, 166, 150, 200],
    [78, 122, 48, 94], [108, 112, 92, 78], [146, 114, 150, 80],
  ];
  for (const [x1, y1, x2, y2] of legs) img.line(x1, y1, x2, y2, 6, solid(dark));
  // Vỏ
  img.fillEllipse(122, 140, 74, 58, 0, radial(95, 112, 0, 150, [[0, '#C78A4A'], [0.5, '#8A4A2A'], [1, '#3a2010']]));
  img.strokeEllipse(122, 140, 74, 58, 0, 4, solid(dark));
  img.line(56, 140, 190, 140, 2.5, () => [36, 17, 8, 0.55]);
  for (const dx of [84, 122, 160]) img.fillCircle(dx, 132, 3.5, () => [36, 17, 8, 0.6]);
  // Đầu
  img.fillEllipse(198, 140, 26, 22, 0, radial(190, 132, 0, 40, [[0, '#a06a3a'], [1, '#3a2010']]));
  img.strokeEllipse(198, 140, 26, 22, 0, 3, solid(dark));
  img.fillPoly([[192, 120], [200, 98], [208, 120]], solid(dark)); // sừng
  // Mắt vàng phát sáng
  for (const ey of [132, 148]) {
    img.glow(208, ey, 9, '#ffd166', 0.8);
    img.fillCircle(208, ey, 3.5, solid('#ffd166'));
    img.fillCircle(207, ey - 1, 1.2, solid('#fff8e0'));
  }
  // Kìm
  img.fillPoly([[218, 128], [236, 124], [222, 136]], solid(dark));
  img.fillPoly([[218, 152], [236, 156], [222, 144]], solid(dark));
  return img;
}

function monsterT2() { /* Bọ cạp tím */
  const img = new Img(256, 256, 3);
  const dark = '#1a0624';
  // Đuôi cong lên
  const tail = [[70, 112, 15], [50, 86, 13], [40, 62, 11], [44, 42, 9]];
  for (const [x, y, r] of tail) {
    img.fillCircle(x, y, r, radial(x - 3, y - 3, 0, r * 1.8, [[0, '#a05ab8'], [1, '#3a1050']]));
    img.strokeEllipse(x, y, r, r, 0, 2.5, solid(dark));
  }
  img.glow(52, 30, 14, '#c77dff', 0.7);
  img.fillPoly([[44, 36], [64, 30], [58, 52]], solid('#C77DFF')); // nọc
  // Chân
  const legs = [[86, 168, 62, 196], [116, 176, 104, 206], [146, 172, 148, 202], [92, 116, 66, 90], [120, 108, 106, 78], [148, 110, 146, 82]];
  for (const [x1, y1, x2, y2] of legs) img.line(x1, y1, x2, y2, 5, solid(dark));
  // Thân
  img.fillEllipse(122, 142, 62, 44, 0, radial(100, 122, 0, 118, [[0, '#C77DFF'], [0.5, '#6A2A8A'], [1, '#2a0a3a']]));
  img.strokeEllipse(122, 142, 62, 44, 0, 4, solid(dark));
  for (const k of [0, 1, 2]) img.strokeEllipse(122, 142, 56 - k * 16, 38 - k * 12, 0, 1.5, () => [199, 125, 255, 0.35]);
  // Đầu
  img.fillEllipse(178, 138, 27, 23, 0, radial(170, 130, 0, 42, [[0, '#9a4ab4'], [1, '#3a1050']]));
  img.strokeEllipse(178, 138, 27, 23, 0, 3, solid(dark));
  // 4 mắt
  for (const [ex, ey] of [[186, 128], [192, 140], [186, 150], [176, 156]]) {
    img.glow(ex, ey, 6.5, '#c77dff', 0.85);
    img.fillCircle(ex, ey, 2.5, solid('#e8c8ff'));
  }
  // 2 càng
  for (const side of [-1, 1]) {
    const ay = 138 + side * 22;
    img.line(196, ay, 218, ay + side * -6, 8, solid('#4A1A6A'));
    img.fillCircle(226, ay - 6 * side * -1, 15, radial(220, ay - 6 * side * -1 - 4, 0, 24, [[0, '#a05ab8'], [1, '#3a1050']]));
    img.strokeEllipse(226, ay - 6 * side * -1, 15, 15, 0, 2.5, solid(dark));
    img.fillCircle(232, ay - 6 * side * -1 + side * 7, 6, solid(dark));
  }
  return img;
}

function monsterT3() { /* Golem đá đỏ */
  const img = new Img(256, 256, 3);
  const dark = '#2a0606';
  function rockPoly(cx2, cy2, base, seedFn, k) {
    const pts = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = i * Math.PI * 2 / n + seedFn() * 0.2;
      const r = base * (0.8 + seedFn() * 0.28) * k;
      pts.push([cx2 + Math.cos(a) * r, cy2 + Math.sin(a) * r * 0.86]);
    }
    img.fillPoly(pts, radial(cx2 - base * 0.4, cy2 - base * 0.4, 0, base * 1.9 * k, [[0, '#c04848'], [0.55, '#A01A1A'], [1, '#4a0a0a']]));
    img.strokePoly(pts, 4, solid(dark));
    return pts;
  }
  const rng = (function () { let s = 777; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })();
  // Đá bay lơ lửng
  rockPoly(158, 52, 16, rng, 1);
  rockPoly(84, 62, 12, rng, 1);
  // Thân
  rockPoly(118, 148, 84, rng, 1);
  // Nứt phát sáng
  const cracks = [[[72, 128], [96, 148], [88, 176]], [[150, 108], [138, 140], [156, 168]], [[104, 92], [118, 118]]];
  for (const c of cracks) {
    img.polyline(c, 4.5, () => [255, 107, 53, 0.9]);
    img.polyline(c, 1.6, solid('#ffd166'));
  }
  // Nắm đấm
  rockPoly(208, 112, 30, rng, 1);
  rockPoly(206, 190, 30, rng, 1);
  img.line(196, 102, 216, 108, 3, solid(dark));
  img.line(194, 182, 214, 188, 3, solid(dark));
  // Chân mày + mắt
  img.line(158, 132, 196, 140, 7, solid(dark));
  for (const [ex, ey] of [[172, 146], [190, 150]]) {
    img.glow(ex, ey, 9, '#ff6b35', 0.95);
    img.fillCircle(ex, ey, 3, solid('#ffd166'));
  }
  return img;
}

function dragonSprite() { /* Rồng lửa boss, cánh xòe */
  const img = new Img(256, 256, 3);
  const dark = '#4a0a00';
  // Cánh xa (behind)
  img.fillPoly([[96, 122], [30, 44], [14, 96], [62, 140]], linear(96, 122, 20, 90, [[0, '#8a2400'], [1, '#3a0c00']]));
  img.strokePoly([[96, 122], [30, 44], [14, 96], [62, 140]], 2.5, solid(dark));
  img.line(88, 118, 34, 56, 2, () => [255, 120, 60, 0.5]);
  img.line(84, 124, 24, 92, 2, () => [255, 120, 60, 0.4]);
  // Đuôi
  for (const [x, y, r] of [[52, 170, 13], [36, 184, 10], [24, 194, 7]]) {
    img.fillCircle(x, y, r, radial(x, y - 3, 0, r * 1.7, [[0, '#ff6b35'], [1, '#8a1a00']]));
    img.strokeEllipse(x, y, r, r, 0, 2, solid(dark));
  }
  // Cánh gần (membrane bán trong suốt)
  img.fillPoly([[104, 114], [58, 22], [22, 68], [70, 132]], linear(104, 114, 40, 60, [[0, '#FF6B35'], [1, '#c22e00']]));
  img.strokePoly([[104, 114], [58, 22], [22, 68], [70, 132]], 2.5, solid(dark));
  img.line(100, 110, 62, 30, 2, () => [255, 190, 120, 0.7]);
  img.line(96, 118, 34, 66, 2, () => [255, 190, 120, 0.5]);
  // Gai lưng
  for (const [sx, sy, s] of [[104, 108, 10], [84, 118, 9], [66, 130, 8]]) img.fillPoly([[sx, sy - s], [sx + 6, sy], [sx - 6, sy + 2]], solid('#FFD700'));
  // Thân
  img.fillEllipse(124, 152, 84, 52, 0, radial(96, 128, 0, 140, [[0, '#FF8A50'], [0.5, '#FF4D1A'], [1, '#8a1a00']]));
  img.strokeEllipse(124, 152, 84, 52, 0, 4, solid(dark));
  // Bụng vàng
  for (const [bx, by] of [[96, 182], [124, 190], [152, 186], [176, 178]]) {
    img.fillEllipse(bx, by, 15, 8, 0, () => [255, 215, 0, 0.9]);
  }
  // Cổ
  img.line(172, 132, 196, 102, 34, solid(dark));
  img.line(172, 132, 196, 102, 27, solid('#e03a10'));
  // Đầu + hàm há
  img.fillEllipse(202, 94, 27, 22, 0, radial(194, 86, 0, 44, [[0, '#FF6B35'], [1, '#8a1a00']]));
  img.strokeEllipse(202, 94, 27, 22, 0, 3, solid(dark));
  img.fillPoly([[212, 82], [246, 88], [214, 96]], solid('#e03a10'));   // hàm trên
  img.fillPoly([[210, 106], [242, 114], [212, 114]], solid('#a02a08')); // hàm dưới
  img.strokePoly([[212, 82], [246, 88], [214, 96]], 2, solid(dark));
  img.strokePoly([[210, 106], [242, 114], [212, 114]], 2, solid(dark));
  img.fillPoly([[216, 92], [244, 96], [220, 104]], solid('#3a0800'));   // miệng
  for (const tx of [218, 228, 238]) img.fillPoly([[tx, 94], [tx + 4, 94], [tx + 2, 99]], solid('#fff2d8')); // răng
  // Lửa
  img.glow(252, 102, 18, '#ff8c1a', 0.85);
  img.fillCircle(250, 102, 6, solid('#ffd166'));
  // Mắt
  img.glow(208, 80, 8, '#ffd166', 0.95);
  img.fillCircle(209, 80, 2.6, solid('#7a2000'));
  img.fillCircle(208, 79, 1, solid('#ffffff'));
  // Sừng
  img.fillPoly([[188, 76], [176, 58], [196, 72]], solid('#f0e0c8'));
  img.fillPoly([[196, 72], [190, 52], [204, 68]], solid('#e0d0b0'));
  return img;
}

function spiderSprite() { /* Nhện triệu hồi — nâu vàng như bản gốc */
  const img = new Img(256, 256, 3);
  const dark = '#3a2010';
  // 8 chân (2 khớp)
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 4; i++) {
      const sx = 128 + side * 10, sy = 142 + side * 4;
      const mx = 128 + side * 34 + (i - 1.5) * 8, my = 142 + side * (26 + i * 4);
      const ex = 128 + side * (34 + i * 7) + (i === 3 ? side * 26 : 0), ey = 142 + side * (38 + i * 7);
      img.line(sx, sy, mx, my, 5, solid(dark));
      img.line(mx, my, ex, ey, 4, solid(dark));
      img.fillCircle(sx, sy, 3.5, solid(dark));
    }
  }
  // Bụng
  img.fillEllipse(104, 142, 44, 36, 0, radial(90, 126, 0, 72, [[0, '#d19a5a'], [0.5, '#a06b1a'], [1, '#5a3a1a']]));
  img.strokeEllipse(104, 142, 44, 36, 0, 3, solid(dark));
  img.fillPoly([[104, 130], [96, 142], [104, 154]], () => [209, 154, 90, 0.85]);
  img.fillPoly([[104, 142], [112, 142], [104, 154]], () => [209, 154, 90, 0.6]);
  // Đầu
  img.fillEllipse(154, 140, 25, 22, 0, radial(146, 132, 0, 40, [[0, '#c08a4a'], [1, '#4a2a10']]));
  img.strokeEllipse(154, 140, 25, 22, 0, 3, solid(dark));
  // Răng cernes trắng
  img.fillPoly([[170, 132], [182, 128], [172, 140]], solid('#f0e0c8'));
  img.fillPoly([[170, 148], [182, 152], [172, 140]], solid('#f0e0c8'));
  // Mắt đỏ
  for (const ey of [132, 148]) {
    img.glow(162, ey, 9, '#ff4d6d', 0.9);
    img.fillCircle(162, ey, 3, solid('#ff4d6d'));
    img.fillCircle(161, ey - 1, 1, solid('#ffd0d8'));
  }
  return img;
}

function dummySprite() { /* Bia tập luyện gỗ */
  const img = new Img(256, 256, 3);
  const dark = '#2a1a08';
  // Chân đế
  img.fillEllipse(128, 210, 50, 15, 0, radial(110, 202, 0, 80, [[0, '#a0784a'], [1, '#4a3010']]));
  img.strokeEllipse(128, 210, 50, 15, 0, 3, solid(dark));
  // Cột
  img.fillPoly([[116, 86], [140, 86], [140, 210], [116, 210]], linear(116, 0, 140, 0, [[0, '#a0784a'], [0.5, '#8a6a4a'], [1, '#5a3a1a']]));
  img.strokePoly([[116, 86], [140, 86], [140, 210], [116, 210]], 3, solid(dark));
  img.line(122, 96, 122, 200, 1.5, () => [42, 26, 8, 0.4]);
  img.line(134, 96, 134, 200, 1.5, () => [42, 26, 8, 0.3]);
  // Tay ngang
  img.fillPoly([[62, 104], [194, 104], [194, 124], [62, 124]], linear(0, 104, 0, 124, [[0, '#a0784a'], [1, '#5a3a1a']]));
  img.strokePoly([[62, 104], [194, 104], [194, 124], [62, 124]], 3, solid(dark));
  for (const rx of [100, 128, 156]) img.line(rx, 104, rx, 124, 3, solid('#3a2410'));
  // Vòng ngắm trên cột
  img.fillCircle(128, 56, 34, radial(114, 42, 0, 56, [[0, '#e8cc90'], [0.6, '#d0a860'], [1, '#8a6a30']]));
  img.strokeEllipse(128, 56, 34, 34, 0, 3, solid(dark));
  img.line(102, 40, 154, 72, 2.5, solid('#6a4a18'));
  img.line(154, 40, 102, 72, 2.5, solid('#6a4a18'));
  for (const [ex, ey] of [[116, 50], [140, 50]]) img.fillCircle(ex, ey, 3.5, solid('#3a2410'));
  for (let i = 0; i < 5; i++) img.line(112 + i * 8, 70, 112 + i * 8, 76, 1.8, solid('#3a2410'));
  // Vòng ngắm trên cột
  img.fillCircle(128, 152, 32, solid('#f5f0e0'));
  img.strokeEllipse(128, 152, 32, 32, 0, 2.5, solid(dark));
  img.fillCircle(128, 152, 23, solid('#ff4d6d'));
  img.fillCircle(128, 152, 15, solid('#f5f0e0'));
  img.fillCircle(128, 152, 7, solid('#ff4d6d'));
  img.strokeEllipse(128, 152, 23, 23, 0, 1.5, solid(dark));
  img.strokeEllipse(128, 152, 15, 15, 0, 1.5, solid(dark));
  return img;
}

module.exports = { monsterT1, monsterT2, monsterT3, dragonSprite, spiderSprite, dummySprite };
