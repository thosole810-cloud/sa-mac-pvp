'use strict';
/* 7 sheet nhân vật 2x2 (idle x2, run x2) — hướng PHẢI */
const { Img, solid, radial, linear } = require('./sprite-lib');

function drawChibi(cell, cfg, frame) {
  const F = {
    idleA: { bob: 0, sq: 1.000, legs: 0, wrot: 0 },
    idleB: { bob: -4, sq: 0.965, legs: 0, wrot: 0.04 },
    runA: { bob: -2, sq: 1.03, legs: 1, wrot: 0.16 },
    runB: { bob: 0, sq: 0.975, legs: 2, wrot: -0.05 },
  }[frame];
  const cx = 124, cy = 134;
  const rb = cfg.rb, hr = cfg.hr, sq = F.sq;
  const bodyCy = cy + F.bob;
  const dark = '#160808';

  if (cfg.cape) cfg.cape(cell, cx, bodyCy, rb);

  // Chân
  const legY = bodyCy + rb * 1.06 * sq + 8;
  const legSet = [
    [[-17, legY + 2], [13, legY + 2]],
    [[-30, legY + 6], [26, legY - 4]],
    [[-9, legY + 4], [4, legY]],
  ][F.legs];
  for (const [lx, ly] of legSet) {
    cell.fillEllipse(cx + lx, ly, 15, 20, 0, radial(cx + lx - 5, ly - 6, 0, 30, [[0, cfg.accent], [0.55, cfg.color2], [1, '#120606']]));
    cell.strokeEllipse(cx + lx, ly, 15, 20, 0, 2.5, solid('#120606'));
  }

  // Thân
  cell.fillEllipse(cx, bodyCy, rb, rb * 1.06 * sq, 0,
    radial(cx - rb * 0.35, bodyCy - rb * 0.45, 0, rb * 1.55, [[0, cfg.accent], [0.42, cfg.color], [1, cfg.color2]]));
  cell.strokeEllipse(cx, bodyCy, rb, rb * 1.06 * sq, 0, 3, solid(dark));
  if (cfg.bodyDetail) cfg.bodyDetail(cell, cx, bodyCy, rb, cfg);

  // Vũ khí
  if (cfg.weapon) {
    const shoulderX = cx + 16, shoulderY = bodyCy - rb * 0.25;
    cell.withTransform(F.wrot, shoulderX, shoulderY, () => cfg.weapon(cell, cx, bodyCy, rb, cfg));
  }

  // Đầu
  const hcx = cx + 2, hcy = bodyCy - rb * 1.06 * sq - hr + 12;
  cell.fillCircle(hcx, hcy, hr, radial(hcx - hr * 0.35, hcy - hr * 0.35, 0, hr * 1.35, [[0, '#ffe4cc'], [0.55, '#e8bfa0'], [1, '#b88a68']]));
  cell.strokeEllipse(hcx, hcy, hr, hr, 0, 3, solid(dark));
  if (cfg.headgear) cfg.headgear(cell, hcx, hcy, hr, cfg);

  if (!cfg.customEyes) {
    for (const ey of [-7, 9]) {
      cell.fillEllipse(hcx + 13, hcy + ey, 7.5, 5.5, 0, solid('#ffffff'));
      cell.fillCircle(hcx + 16, hcy + ey, 3.2, solid(cfg.eye || '#20242c'));
      cell.fillCircle(hcx + 15, hcy + ey - 1.2, 1.1, solid('#ffffff'));
    }
  }
}

const CHARS = [
  { /* BÌNH AN — xạ thủ súng ma thuật */
    name: 'binh_an', rb: 50, hr: 36,
    color: '#4CC9F0', color2: '#1A5F8A', accent: '#A0E7FF', eye: '#1a3a5a',
    headgear(img, hx, hy, hr) {
      img.fillEllipse(hx - 7, hy - 11, hr * 0.99, hr * 0.8, -0.14, radial(hx - 12, hy - 18, 0, hr, [[0, '#3a2a24'], [1, '#221510']]));
      img.line(hx - hr * 0.95, hy - 3, hx + hr * 0.98, hy - 3, 5, solid('#101020'));
      for (const gx of [hx + 8, hx + 27]) {
        img.fillCircle(gx, hy - 3, 9.5, solid('#3a5a78'));
        img.fillCircle(gx, hy - 3, 7.5, (x, y) => { const t = Math.hypot(x - gx, y - (hy - 3)) / 7.5; return [76 + 104 * (1 - t), 201, 240, 0.6]; });
        img.strokeEllipse(gx, hy - 3, 9.5, 9.5, 0, 2, solid('#ffd166'));
        img.fillCircle(gx - 2.5, hy - 5.5, 1.8, solid('#ffffff'));
      }
    },
    weapon(img) {
      img.fillPoly([[6, -2], [26, -9], [26, 11], [6, 7]], solid('#2a2a3a'));
      img.fillPoly([[24, -8], [94, -6], [94, 8], [24, 10]], linear(0, -8, 0, 10, [[0, '#5a5a6e'], [0.5, '#3a3a4a'], [1, '#14142a']]));
      img.fillPoly([[50, -3], [94, -3], [94, 3], [50, 3]], () => [76, 201, 240, 0.75]);
      img.strokePoly([[24, -8], [94, -6], [94, 8], [24, 10]], 2, solid('#0a0a1a'));
      img.glow(97, 0, 15, '#4cc9f0', 0.85);
      img.fillCircle(97, 0, 4.5, solid('#bfeaff'));
      img.fillCircle(53, -15, 5, solid('#1a1a2a'));
      img.fillCircle(53, -15, 2, solid('#4cc9f0'));
    },
    bodyDetail(img, cx, bodyCy, rb) {
      img.line(cx - rb * 0.55, bodyCy + rb * 0.45, cx + rb * 0.5, bodyCy + rb * 0.42, 3, solid('#16507a'));
      img.fillPoly([[cx - 16, bodyCy - rb * 0.35], [cx - 4, bodyCy - rb * 0.2], [cx - 16, bodyCy - rb * 0.05], [cx - 28, bodyCy - rb * 0.2]], solid('#A0E7FF'));
    }
  },
  { /* BÌNH MINH — đấu sĩ búa */
    name: 'binh_minh', rb: 56, hr: 37,
    color: '#FFD166', color2: '#A06B1A', accent: '#FFEDB3', eye: '#4a2a00',
    headgear(img, hx, hy, hr) {
      img.fillEllipse(hx - 3, hy - 9, hr * 1.04, hr * 0.92, 0, radial(hx - 10, hy - 16, 0, hr * 1.3, [[0, '#FFE9A8'], [0.55, '#FFD166'], [1, '#A06B1A']]));
      img.strokeEllipse(hx - 3, hy - 9, hr * 1.04, hr * 0.92, 0, 2.5, solid('#6a4408'));
      img.fillEllipse(hx + 13, hy + 7, hr * 0.56, hr * 0.52, 0, radial(hx + 6, hy - 2, 0, hr, [[0, '#ffe4cc'], [1, '#d8a87a']]));
      img.strokeEllipse(hx + 13, hy + 7, hr * 0.56, hr * 0.52, 0, 2, solid('#8a5a10'));
      for (const [rx2, ry2] of [[-18, -6], [-6, -14], [10, -16]]) img.fillCircle(hx + rx2, hy + ry2, 2.2, solid('#8a5a10'));
      img.line(hx - 8, hy + 1, hx + 34, hy - 2, 3.5, solid('#6a4408'));
    },
    weapon(img) {
      img.line(12, 20, 88, -16, 11, solid('#2a1a0a'));
      img.line(12, 20, 88, -16, 6, solid('#7a5228'));
      img.fillPoly([[76, -38], [110, -28], [116, -2], [82, -12]], linear(76, -38, 116, -2, [[0, '#c8c8d8'], [0.5, '#6a6a7a'], [1, '#2a2a3a']]));
      img.strokePoly([[76, -38], [110, -28], [116, -2], [82, -12]], 2.5, solid('#1a1a2a'));
      img.line(84, -22, 108, -14, 2.5, solid('#e8e8f0'));
      img.fillPoly([[86, -4], [112, 0], [86, 6]], solid('#8a8a9a'));
    },
    bodyDetail(img, cx, bodyCy, rb) {
      img.fillEllipse(cx - 30, bodyCy - rb * 0.42, 17, 13, -0.2, radial(cx - 36, bodyCy - rb * 0.5, 0, 22, [[0, '#FFEDB3'], [1, '#A06B1A']]));
      img.strokeEllipse(cx - 30, bodyCy - rb * 0.42, 17, 13, -0.2, 2.5, solid('#6a4408'));
      img.strokeEllipse(cx, bodyCy + rb * 0.5, rb * 0.8, rb * 0.28, 0, 4, solid('#7a4a10'));
    }
  },
  { /* KHẢI KIỆT — sát thủ song kiếm */
    name: 'khai_kiet', rb: 48, hr: 35,
    color: '#FF4D6D', color2: '#8A1A30', accent: '#FF9DB1', eye: '#5a1020',
    headgear(img, hx, hy, hr) {
      img.fillEllipse(hx - 6, hy - 10, hr * 0.97, hr * 0.82, -0.12, solid('#1a0a1a'));
      for (let i = 0; i < 4; i++) {
        const sx = hx - 26 + i * 14;
        img.fillPoly([[sx, hy - hr * 0.62], [sx + 5, hy - hr * 0.62 - 10 - (i % 2) * 4], [sx + 10, hy - hr * 0.6]], solid('#1a0a1a'));
      }
      img.line(hx - hr * 0.95, hy - 1, hx + hr * 1.02, hy - 1, 6, solid('#FF4D6D'));
      img.fillPoly([[hx - hr * 0.95, hy - 4], [hx - hr * 0.95 - 16, hy - 10], [hx - hr * 0.95 - 12, hy + 4]], solid('#FF4D6D'));
      img.fillPoly([[hx - hr * 0.95, hy + 1], [hx - hr * 0.95 - 13, hy + 3], [hx - hr * 0.95 - 10, hy + 10]], solid('#c23a55'));
    },
    weapon(img) {
      img.fillPoly([[34, -20], [102, -40], [106, -33], [38, -12]], linear(34, -20, 106, -33, [[0, '#ffffff'], [0.55, '#c8c8d8'], [1, '#505060']]));
      img.strokePoly([[34, -20], [102, -40], [106, -33], [38, -12]], 1.8, solid('#141420'));
      img.line(38, -15, 100, -34, 1.5, () => [255, 77, 109, 0.8]);
      img.fillPoly([[28, -16], [36, -22], [38, -10], [30, -6]], solid('#c9a227'));
      img.fillPoly([[26, -14], [14, -8], [16, 0], [28, -4]], solid('#2a1020'));
      img.fillPoly([[34, 16], [102, -2], [106, 5], [38, 23]], linear(34, 16, 106, -2, [[0, '#ffffff'], [0.55, '#c8c8d8'], [1, '#505060']]));
      img.strokePoly([[34, 16], [102, -2], [106, 5], [38, 23]], 1.8, solid('#141420'));
      img.line(38, 19, 100, 2, 1.5, () => [255, 77, 109, 0.8]);
      img.fillPoly([[28, 12], [36, 8], [38, 20], [30, 24]], solid('#c9a227'));
      img.fillPoly([[26, 16], [14, 10], [16, 2], [28, 8]], solid('#2a1020'));
    },
    bodyDetail(img, cx, bodyCy, rb) {
      img.line(cx - rb * 0.7, bodyCy - rb * 0.2, cx + rb * 0.3, bodyCy + rb * 0.5, 4, solid('#5a1020'));
      img.fillCircle(cx - rb * 0.15, bodyCy + rb * 0.28, 4, solid('#FF9DB1'));
    }
  },
  { /* KHÔI NGUYÊN — thánh kỵ sĩ CC */
    name: 'khoi_nguyen', rb: 52, hr: 36,
    color: '#FFD700', color2: '#8A6A00', accent: '#FFF4B3', eye: '#0a4a7a',
    cape(img, cx, bodyCy, rb) {
      img.fillPoly([[cx - 6, bodyCy - 34], [cx - 64, bodyCy - 4], [cx - 52, bodyCy + 40], [cx - 2, bodyCy + 26]],
        linear(cx - 8, bodyCy - 30, cx - 60, bodyCy + 30, [[0, '#ffffff'], [0.6, '#fff4b3'], [1, '#d8c060']]));
      img.strokePoly([[cx - 6, bodyCy - 34], [cx - 64, bodyCy - 4], [cx - 52, bodyCy + 40], [cx - 2, bodyCy + 26]], 2, solid('#a08420'));
    },
    headgear(img, hx, hy, hr) {
      img.fillEllipse(hx - 2, hy - 8, hr * 0.99, hr * 0.9, 0, radial(hx - 10, hy - 16, 0, hr * 1.3, [[0, '#ffe066'], [0.6, '#e8c020'], [1, '#8a6a00']]));
      for (let i = 0; i < 3; i++) {
        const sx = hx - 20 + i * 12;
        img.fillPoly([[sx, hy - hr * 0.6], [sx + 4, hy - hr * 0.6 - 9 - (i % 2) * 3], [sx + 8, hy - hr * 0.58]], solid('#c89a00'));
      }
      img.glow(hx, hy - hr - 15, 20, '#ffd700', 0.5);
      img.strokeEllipse(hx, hy - hr - 15, 15, 5, -0.15, 4, solid('#FFD700'));
      img.strokeEllipse(hx, hy - hr - 15, 15, 5, -0.15, 1.4, solid('#fffbe0'));
    },
    weapon(img) {
      img.fillPoly([[12, -5], [32, -5], [32, 5], [12, 5]], solid('#3a2a08'));
      img.fillPoly([[30, -19], [40, -19], [40, 19], [30, 19]], linear(30, 0, 40, 0, [[0, '#fff4b3'], [1, '#b88a00']]));
      img.strokePoly([[30, -19], [40, -19], [40, 19], [30, 19]], 2, solid('#6a4a00'));
      img.fillPoly([[40, -7], [100, -3.5], [110, 0], [100, 3.5], [40, 7]], linear(40, -7, 110, 3, [[0, '#ffffff'], [0.5, '#f0f0fa'], [1, '#b0b0c8']]));
      img.strokePoly([[40, -7], [100, -3.5], [110, 0], [100, 3.5], [40, 7]], 1.8, solid('#8a7a30'));
      img.line(44, -2, 104, 0, 1.4, () => [255, 215, 0, 0.55]);
      img.glow(78, 0, 24, '#fff4b3', 0.4);
    },
    bodyDetail(img, cx, bodyCy, rb) {
      img.line(cx - 6, bodyCy - rb * 0.5, cx - 6, bodyCy + rb * 0.35, 5, solid('#b88a00'));
      img.line(cx - 18, bodyCy - rb * 0.15, cx + 8, bodyCy - rb * 0.15, 5, solid('#b88a00'));
      img.fillEllipse(cx - 34, bodyCy - rb * 0.4, 13, 10, -0.2, radial(cx - 38, bodyCy - rb * 0.48, 0, 18, [[0, '#FFF4B3'], [1, '#C89800']]));
      img.strokeEllipse(cx - 34, bodyCy - rb * 0.4, 13, 10, -0.2, 2.5, solid('#8a6a00'));
    }
  },
  { /* ANNIE NÂU — pháp sư bóng tối (khóa) */
    name: 'annie_nau', rb: 48, hr: 35, customEyes: true,
    color: '#C77DFF', color2: '#4A1A6A', accent: '#E0C8FF',
    cape(img, cx, bodyCy, rb) {
      img.fillPoly([[cx - 4, bodyCy - 30], [cx - 56, bodyCy + 2], [cx - 44, bodyCy + 44], [cx, bodyCy + 30]],
        linear(cx - 4, bodyCy - 28, cx - 52, bodyCy + 34, [[0, '#7a3aa8'], [0.6, '#4A1A6A'], [1, '#2a0a3a']]));
      img.strokePoly([[cx - 4, bodyCy - 30], [cx - 56, bodyCy + 2], [cx - 44, bodyCy + 44], [cx, bodyCy + 30]], 2, solid('#1a0624'));
    },
    headgear(img, hx, hy, hr) {
      img.fillEllipse(hx - 2, hy - 3, hr * 1.2, hr * 1.16, 0, radial(hx - 8, hy - 12, 0, hr * 1.7, [[0, '#7a3aa8'], [0.55, '#4A1A6A'], [1, '#2a0a3a']]));
      img.strokeEllipse(hx - 2, hy - 3, hr * 1.2, hr * 1.16, 0, 3, solid('#1a0624'));
      img.fillEllipse(hx + 9, hy + 5, hr * 0.62, hr * 0.6, 0, radial(hx + 2, hy - 4, 0, hr, [[0, '#ffe4cc'], [1, '#c09878']]));
      for (const ey of [-3, 10]) {
        img.glow(hx + 17, hy + ey, 8, '#c77dff', 0.85);
        img.fillEllipse(hx + 17, hy + ey, 4.5, 3.2, 0, solid('#e8c8ff'));
        img.fillCircle(hx + 18, hy + ey, 2, solid('#8a2ad8'));
      }
      img.fillCircle(hx - 18, hy - 16, 3, solid('#FFD700'));
    },
    weapon(img) {
      img.line(-4, 48, 84, -18, 8, solid('#241030'));
      img.line(-4, 48, 84, -18, 3, solid('#5a3a7a'));
      img.glow(96, -25, 24, '#c77dff', 0.6);
      img.fillCircle(96, -25, 12, radial(92, -29, 0, 15, [[0, '#f0e0ff'], [0.5, '#C77DFF'], [1, '#5a1a8a']]));
      img.strokeEllipse(96, -25, 17, 6, 0.4, 2, () => [199, 125, 255, 0.75]);
      img.fillPoly([[-8, 44], [0, 36], [4, 52], [-4, 58]], solid('#2a0a3a'));
    },
    bodyDetail(img, cx, bodyCy, rb) {
      img.fillCircle(cx - 16, bodyCy - rb * 0.42, 4.5, solid('#FFD700'));
      img.strokeEllipse(cx - 16, bodyCy - rb * 0.42, 4.5, 4.5, 0, 1.5, solid('#8a6a00'));
      img.strokeEllipse(cx, bodyCy + rb * 0.52, rb * 0.75, rb * 0.22, 0, 3, solid('#2a0a3a'));
    }
  },
  { /* NHẬT HUY — bóp méo không gian */
    name: 'nhat_huy', rb: 50, hr: 35,
    color: '#06D6A0', color2: '#0A4A3A', accent: '#A0FFD6', eye: '#0a3a2a',
    cape(img, cx, bodyCy, rb) {
      img.fillPoly([[cx - 4, bodyCy - 28], [cx - 52, bodyCy + 4], [cx - 42, bodyCy + 40], [cx, bodyCy + 28]],
        linear(cx - 4, bodyCy - 26, cx - 48, bodyCy + 30, [[0, '#0f8a68'], [0.6, '#0A4A3A'], [1, '#062a20']]));
      img.strokePoly([[cx - 4, bodyCy - 28], [cx - 52, bodyCy + 4], [cx - 42, bodyCy + 40], [cx, bodyCy + 28]], 2, solid('#04241a'));
    },
    headgear(img, hx, hy, hr) {
      img.fillEllipse(hx - 6, hy - 10, hr * 0.98, hr * 0.84, -0.12, radial(hx - 12, hy - 16, 0, hr * 1.2, [[0, '#0f8a68'], [1, '#0A4A3A']]));
      for (let i = 0; i < 3; i++) {
        const sx = hx - 24 + i * 13;
        img.fillPoly([[sx, hy - hr * 0.62], [sx + 4, hy - hr * 0.62 - 8 - (i % 2) * 3], [sx + 9, hy - hr * 0.6]], solid('#0a3a2a'));
      }
      img.glow(hx - 42, hy - 34, 13, '#06d6a0', 0.7);
      img.fillCircle(hx - 42, hy - 34, 5, solid('#A0FFD6'));
      img.strokeEllipse(hx - 42, hy - 34, 11, 4.5, 0.35, 1.5, () => [160, 255, 214, 0.8]);
    },
    weapon(img) {
      img.fillPoly([[14, -4], [34, -4], [34, 4], [14, 4]], solid('#0A4A3A'));
      img.strokePoly([[14, -4], [34, -4], [34, 4], [14, 4]], 1.5, solid('#032a1e'));
      img.fillPoly([[34, -6], [92, -4], [101, 0], [92, 4], [34, 6]], linear(34, -6, 101, 3, [[0, '#A0FFD6'], [0.5, '#06D6A0'], [1, '#0A4A3A']]));
      img.strokePoly([[34, -6], [92, -4], [101, 0], [92, 4], [34, 6]], 1.6, solid('#032a1e'));
      img.glow(68, 0, 20, '#06d6a0', 0.5);
      img.strokeEllipse(60, 0, 14, 6, 0.5, 1.5, () => [160, 255, 214, 0.85]);
      img.strokeEllipse(80, 0, 12, 5, -0.4, 1.3, () => [160, 255, 214, 0.7]);
    },
    bodyDetail(img, cx, bodyCy, rb) {
      img.strokeEllipse(cx - 14, bodyCy - rb * 0.25, 7, 7, 0, 2, solid('#A0FFD6'));
      img.fillCircle(cx - 14, bodyCy - rb * 0.25, 3, solid('#06D6A0'));
      img.strokeEllipse(cx, bodyCy + rb * 0.5, rb * 0.72, rb * 0.2, 0, 3, solid('#04241a'));
    }
  },
  { /* QUÂN HACKER — hacker ma trận */
    name: 'quan_hacker', rb: 50, hr: 36, customEyes: true,
    color: '#00FF88', color2: '#004422', accent: '#B3FFD9',
    headgear(img, hx, hy, hr) {
      img.fillEllipse(hx - 8, hy - 10, hr * 0.98, hr * 0.82, -0.12, solid('#14141e'));
      img.glow(hx + 4, hy - 2, 34, '#00ff88', 0.26);
      img.fillPoly([[hx - 27, hy - 12], [hx + 32, hy - 12], [hx + 32, hy + 7], [hx - 27, hy + 7]], solid('#0a0a12'));
      img.strokePoly([[hx - 27, hy - 12], [hx + 32, hy - 12], [hx + 32, hy + 7], [hx - 27, hy + 7]], 2.5, solid('#00ff88'));
      img.line(hx - 24, hy - 6, hx + 29, hy - 6, 2, () => [0, 255, 136, 0.85]);
      img.line(hx - 24, hy + 1, hx + 29, hy + 1, 2, () => [0, 255, 136, 0.55]);
      for (let i = 0; i < 5; i++) img.fillCircle(hx - 20 + i * 12 + (i % 2) * 4, hy - 2.5, 1.3, solid('#b3ffd9'));
      img.line(hx - 20, hy - 34, hx - 26, hy - 46, 2.5, solid('#101018'));
      img.glow(hx - 27, hy - 48, 6, '#00ff88', 0.8);
      img.fillCircle(hx - 27, hy - 48, 2.5, solid('#00ff88'));
    },
    weapon(img) {
      img.fillPoly([[14, -4], [32, -4], [32, 4], [14, 4]], solid('#0a2a1a'));
      img.strokePoly([[14, -4], [32, -4], [32, 4], [14, 4]], 1.5, solid('#00ff88'));
      img.fillPoly([[32, -5], [96, -5], [96, 5], [32, 5]], linear(32, 0, 96, 0, [[0, '#b3ffd9'], [0.5, '#00ff88'], [1, '#004422']]));
      img.strokePoly([[32, -5], [96, -5], [96, 5], [32, 5]], 1.6, solid('#00331a'));
      img.glow(66, 0, 20, '#00ff88', 0.45);
      for (let i = 0; i < 5; i++) {
        const px2 = 38 + i * 13;
        img.fillPoly([[px2, -2 + (i % 2) * 2], [px2 + 3, -2 + (i % 2) * 2], [px2 + 3, 1 + (i % 2) * 2], [px2, 1 + (i % 2) * 2]], solid('#eafff4'));
      }
    },
    bodyDetail(img, cx, bodyCy, rb) {
      img.line(cx - 6, bodyCy - rb * 0.3, cx - 6, bodyCy - rb * 0.05, 2.5, solid('#f0f0f0'));
      img.line(cx + 6, bodyCy - rb * 0.3, cx + 6, bodyCy - rb * 0.05, 2.5, solid('#f0f0f0'));
      img.line(cx - rb * 0.6, bodyCy + rb * 0.3, cx - rb * 0.2, bodyCy + rb * 0.45, 2, solid('#00ff88'));
      img.line(cx - rb * 0.2, bodyCy + rb * 0.45, cx + rb * 0.3, bodyCy + rb * 0.28, 2, solid('#00ff88'));
    }
  },
];

/* Sinh 1 sheet 512x512 (2x2 ô 256) cho 1 tướng */
function buildCharSheet(cfg) {
  const sheet = new Img(512, 512, 1);
  const frames = ['idleA', 'idleB', 'runA', 'runB'];
  const pos = [[0, 0], [256, 0], [0, 256], [256, 256]];
  frames.forEach((f, i) => {
    const cell = new Img(256, 256, 3);
    drawChibi(cell, cfg, f);
    sheet.paste(cell, pos[i][0], pos[i][1]);
  });
  return sheet;
}

module.exports = { CHARS, buildCharSheet, drawChibi };
