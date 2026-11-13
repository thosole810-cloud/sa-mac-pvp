// ============================================================
//  world.js — Sa mạc: nền cát, chướng ngại, bão cát co dần
// ============================================================
'use strict';

const World = {
    size: 3000,
    solids: [],   // {x,y,r,kind,tall} — chặn di chuyển & đạn: rock, cactus, tree
    walls: [],    // {x,y,w,h,seed} — tường sa mạc chia lane, chặn di chuyển & TẦM NHÌN
    props: [],    // trang trí không chặn: bone, pebble, crack, shrub
    _pat: null, _patCv: null,

    init(seed) {
        // RNG có seed để host/client online sinh cùng một bản đồ
        let _s = (seed === undefined || seed === null) ? ((Math.random() * 4294967296) >>> 0) : (seed >>> 0);
        const rnd = () => { _s = (Math.imul(_s, 1664525) + 1013904223) >>> 0; return _s / 4294967296; };
        const rand = (a, b) => a + rnd() * (b - a);
        const chance = p => rnd() < p;

        this.solids.length = 0; this.props.length = 0; this.walls.length = 0;
        const S = this.size, n = 120;
        // ---- TƯỜNG SA MẠC chia lane: vành quanh trung tâm + 4 khối góc ----
        const L = S * 0.26, R = S * 0.74, T = S * 0.26, B = S * 0.74, M = S * 0.5;
        const gapW = 150; // lối đi giữa các tường
        const mkWall = (x, y, w, h) => this.walls.push({ x, y, w, h, seed: rnd() });
        const segWithGap = (a, b) => {
            const gl = rand(a + 70, b - 70 - gapW);
            return [[a, gl], [gl + gapW, b]];
        };
        for (const y of [T, B]) for (const [a, b] of segWithGap(L, R)) mkWall(a, y, b - a, 44);
        for (const x of [L, R]) for (const [a, b] of segWithGap(T, B)) mkWall(x, a, 44, b - a);
        // khối tường góc tư phần (tạo góc khuất, cản tầm nhìn)
        for (let q = 0; q < 4; q++) {
            const qx = q % 2, qy = (q / 2) | 0;
            const x0 = qx ? M + 170 : 120, x1 = qx ? S - 120 : M - 170;
            const y0 = qy ? M + 170 : 120, y1 = qy ? M - 170 : S - 120;
            const bw = rand(170, 330), bh = rand(170, 330);
            mkWall(rand(x0, Math.max(x0 + 10, x1 - bw)), rand(y0, Math.max(y0 + 10, y1 - bh)), bw, bh);
        }
        const placed = [];
        // chướng ngại vật có va chạm
        let tries = 0;
        while (this.solids.length < n && tries < 4000) {
            tries++;
            const x = rand(90, S - 90), y = rand(90, S - 90);
            const kind = chance(0.42) ? 'rock' : (chance(0.62) ? 'cactus' : 'tree');
            const r = kind === 'rock' ? rand(26, 46) : kind === 'cactus' ? rand(12, 17) : rand(10, 14);
            let ok = true;
            for (const o of placed) {
                const minD = o.r + r + 70;
                if (U.dist(x, y, o.x, o.y) < minD) { ok = false; break; }
            }
            if (ok) for (const w of this.walls) {
                if (x > w.x - r - 50 && x < w.x + w.w + r + 50 && y > w.y - r - 50 && y < w.y + w.h + r + 50) { ok = false; break; }
            }
            if (!ok) continue;
            // tránh giữa map (khu spawn an toàn)
            if (U.dist2(x, y, S / 2, S / 2) < 180 * 180) continue;
            const o = { x, y, r, kind, tall: kind === 'tree' ? 1.9 : kind === 'cactus' ? 1.15 : 1.05, seed: rnd() };
            this.solids.push(o); placed.push(o);
        }
        // vật trang trí
        for (let i = 0; i < 240; i++) {
            const x = rand(30, S - 30), y = rand(30, S - 30);
            let inside = false;
            for (const o of this.solids) if (U.dist2(x, y, o.x, o.y) < (o.r + 24) * (o.r + 24)) { inside = true; break; }
            if (inside) continue;
            const r = rnd();
            const kind = r < 0.36 ? 'pebble' : r < 0.6 ? 'shrub' : r < 0.78 ? 'crack' : 'bone';
            this.props.push({ x, y, kind, r: rand(0, U.TAU), s: rand(0.7, 1.4) });
        }
    },

    // đẩy một vòng tròn ra khỏi tường + chướng ngại + biên
    clampEnt(e) {
        const S = this.size;
        e.x = U.clamp(e.x, e.r + 8, S - e.r - 8);
        e.y = U.clamp(e.y, e.r + 8, S - e.r - 8);
        // tường (hình chữ nhật)
        for (const w of this.walls) {
            const cx = U.clamp(e.x, w.x, w.x + w.w), cy = U.clamp(e.y, w.y, w.y + w.h);
            const dx = e.x - cx, dy = e.y - cy, d2 = dx * dx + dy * dy;
            if (d2 < e.r * e.r) {
                if (d2 < 0.0001) { // ở trong tường: đẩy ra cạnh gần nhất
                    const dl = e.x - w.x, dr = w.x + w.w - e.x, du = e.y - w.y, db = w.y + w.h - e.y;
                    const m = Math.min(dl, dr, du, db);
                    if (m === dl) e.x = w.x - e.r; else if (m === dr) e.x = w.x + w.w + e.r;
                    else if (m === du) e.y = w.y - e.r; else e.y = w.y + w.h + e.r;
                } else {
                    const d = Math.sqrt(d2);
                    e.x = cx + dx / d * e.r; e.y = cy + dy / d * e.r;
                }
            }
        }
        for (const o of this.solids) {
            const d = U.dist(e.x, e.y, o.x, o.y);
            const min = e.r + o.r;
            if (d < min && d > 0.001) {
                const a = U.angleTo(o.x, o.y, e.x, e.y);
                e.x = o.x + Math.cos(a) * min;
                e.y = o.y + Math.sin(a) * min;
            }
        }
    },

    // đạn bay qua đá/tr réal bị chặn? — đá & cây & TƯỜNG chặn, xương rồng cho xuyên
    blockedSegment(x1, y1, x2, y2) {
        // quét dọc đoạn, kiểm tra tường
        const L = U.dist(x1, y1, x2, y2), NS = Math.max(4, Math.ceil(L / 12));
        for (let i = 0; i <= NS; i++) {
            const t = i / NS, px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t;
            for (const w of this.walls) {
                if (px > w.x - 2 && px < w.x + w.w + 2 && py > w.y - 2 && py < w.y + w.h + 2) return { x: px, y: py };
            }
        }
        for (const o of this.solids) {
            if (o.kind === 'cactus') continue;
            // khoảng cách đoạn-điểm
            const dx = x2 - x1, dy = y2 - y1;
            const L2 = dx * dx + dy * dy;
            let t = L2 > 0 ? ((o.x - x1) * dx + (o.y - y1) * dy) / L2 : 0;
            t = U.clamp(t, 0, 1);
            const px = x1 + dx * t, py = y1 + dy * t;
            if (U.dist2(px, py, o.x, o.y) < o.r * o.r) return { x: px, y: py };
        }
        return null;
    },

    // tầm nhìn bị tường chặn? (dùng để ẩn kẻ địch sau tường + sương mù)
    losBlocked(x1, y1, x2, y2) {
        const L = U.dist(x1, y1, x2, y2), NS = Math.max(4, Math.ceil(L / 16));
        for (let i = 0; i <= NS; i++) {
            const t = i / NS, px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t;
            for (const w of this.walls) {
                if (px > w.x && px < w.x + w.w && py > w.y && py < w.y + w.h) return true;
            }
        }
        return false;
    },

    makePattern() {
        if (this._pat) return this._pat;
        const s = 256;
        const cv = document.createElement('canvas');
        cv.width = s; cv.height = s;
        const g = cv.getContext('2d');
        g.fillStyle = '#c9a26a'; g.fillRect(0, 0, s, s);
        // loang màu cát
        for (let i = 0; i < 46; i++) {
            const x = U.rand(0, s), y = U.rand(0, s), r = U.rand(14, 44);
            const gr = g.createRadialGradient(x, y, 0, x, y, r);
            const c = U.chance(0.5) ? 'rgba(182,140,88,0.20)' : 'rgba(224,186,124,0.22)';
            gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = gr;
            g.beginPath(); g.arc(x, y, r, 0, U.TAU); g.fill();
            // vẽ tràn biên để lặp liền mạch
            g.beginPath(); g.arc(x - s, y, r, 0, U.TAU); g.fill();
            g.beginPath(); g.arc(x + s, y, r, 0, U.TAU); g.fill();
            g.beginPath(); g.arc(x, y - s, r, 0, U.TAU); g.fill();
            g.beginPath(); g.arc(x, y + s, r, 0, U.TAU); g.fill();
        }
        // li ti
        for (let i = 0; i < 340; i++) {
            const x = U.rand(0, s), y = U.rand(0, s);
            g.fillStyle = U.chance(0.5) ? 'rgba(120,90,50,0.25)' : 'rgba(245,225,180,0.28)';
            g.fillRect(x, y, 1.4, 1.4);
        }
        this._patCv = cv;
        this._pat = g.createPattern ? cv : cv; // pattern tạo khi RenderWorld
        return cv;
    },

    drawGround(ctx, view) {
        if (!this._pattern) {
            const cv = this.makePattern();
            this._pattern = ctx.createPattern(cv, 'repeat');
        }
        ctx.fillStyle = this._pattern;
        ctx.fillRect(view.x0, view.y0, view.x1 - view.x0, view.y1 - view.y0);
    },

    // vẽ các chướng ngại & trang trí trong khung nhìn
    drawProps(ctx, view, time) {
        // ---- TƯỜNG SA MẠC: khối đá cát lớn, có mặt trên sáng + vết nứt ----
        for (const w of this.walls) {
            if (w.x > view.x1 || w.x + w.w < view.x0 || w.y > view.y1 || w.y + w.h < view.y0) continue;
            const sh = 16; // cao giả lập 2.5D
            // bóng đổ
            ctx.fillStyle = 'rgba(20,14,6,0.35)';
            ctx.fillRect(w.x + 5, w.y + w.h + 3, w.w, 9);
            // thân tường
            const gr = ctx.createLinearGradient(0, w.y - sh, 0, w.y + w.h);
            gr.addColorStop(0, '#b39064'); gr.addColorStop(0.25, '#9a7850'); gr.addColorStop(1, '#6e5433');
            ctx.fillStyle = gr;
            ctx.fillRect(w.x, w.y - sh, w.w, w.h + sh);
            // mặt trên (nắng chiếu)
            ctx.fillStyle = 'rgba(240,214,160,0.38)';
            ctx.fillRect(w.x, w.y - sh, w.w, 9);
            // gờ đá theo texture
            ctx.strokeStyle = 'rgba(70,50,26,0.35)'; ctx.lineWidth = 1.4;
            const step = 46;
            for (let gx = w.x + step; gx < w.x + w.w - 6; gx += step) {
                ctx.beginPath(); ctx.moveTo(gx, w.y - sh + 9);
                ctx.lineTo(gx + (Math.sin(gx * 12.9898 + w.seed * 7) * 5), w.y + w.h);
                ctx.stroke();
            }
            for (let gy = w.y + 34; gy < w.y + w.h - 8; gy += 34) {
                ctx.beginPath(); ctx.moveTo(w.x, gy);
                ctx.lineTo(w.x + w.w, gy + Math.sin(gy * 7.7 + w.seed * 3) * 3);
                ctx.stroke();
            }
            // viền sáng mép
            ctx.strokeStyle = 'rgba(255,232,180,0.25)'; ctx.lineWidth = 1.2;
            ctx.strokeRect(w.x + 0.6, w.y - sh + 0.6, w.w - 1.2, w.h + sh - 1.2);
        }
        // trang trí trước (nằm dưới)
        for (const p of this.props) {
            if (p.x < view.x0 - 40 || p.x > view.x1 + 40 || p.y < view.y0 - 40 || p.y > view.y1 + 40) continue;
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            if (p.kind === 'pebble') {
                ctx.fillStyle = 'rgba(140,110,66,0.6)';
                ctx.beginPath(); ctx.ellipse(0, 0, 5 * p.s, 3.4 * p.s, 0, 0, U.TAU); ctx.fill();
                ctx.fillStyle = 'rgba(90,70,40,0.5)';
                ctx.beginPath(); ctx.ellipse(-3 * p.s, 2 * p.s, 3 * p.s, 2 * p.s, 0, 0, U.TAU); ctx.fill();
            } else if (p.kind === 'crack') {
                ctx.strokeStyle = 'rgba(110,82,44,0.5)'; ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.moveTo(-16 * p.s, 0);
                ctx.quadraticCurveTo(-4 * p.s, 4 * p.s, 2 * p.s, 0);
                ctx.quadraticCurveTo(9 * p.s, -4 * p.s, 16 * p.s, 2 * p.s);
                ctx.stroke();
            } else if (p.kind === 'bone') {
                ctx.strokeStyle = 'rgba(235,225,205,0.8)'; ctx.lineWidth = 2.6 * p.s; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(-7 * p.s, 0); ctx.lineTo(7 * p.s, -2 * p.s); ctx.stroke();
                ctx.fillStyle = 'rgba(235,225,205,0.85)';
                ctx.beginPath(); ctx.arc(-8 * p.s, 1 * p.s, 2.6 * p.s, 0, U.TAU); ctx.fill();
                ctx.beginPath(); ctx.arc(-6 * p.s, -2.4 * p.s, 2.2 * p.s, 0, U.TAU); ctx.fill();
                ctx.beginPath(); ctx.arc(8 * p.s, -1 * p.s, 2.6 * p.s, 0, U.TAU); ctx.fill();
                ctx.beginPath(); ctx.arc(6 * p.s, 2.4 * p.s, 2.2 * p.s, 0, U.TAU); ctx.fill();
            } else { // shrub — bụi khô
                ctx.strokeStyle = 'rgba(150,110,60,0.75)'; ctx.lineWidth = 1.4;
                for (let k = 0; k < 5; k++) {
                    const a = -Math.PI / 2 + (k - 2) * 0.42;
                    ctx.beginPath(); ctx.moveTo(0, 3);
                    ctx.quadraticCurveTo(Math.cos(a) * 4, 3 - 7 * p.s, Math.cos(a) * 8 * p.s, 3 - 12 * p.s + Math.sin(time * 2 + k) * 0.8);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
        // chướng ngại (vẽ theo y) — có bóng + cao
        const list = [];
        for (const o of this.solids) {
            if (o.x < view.x0 - 80 || o.x > view.x1 + 80 || o.y < view.y0 - 120 || o.y > view.y1 + 120) continue;
            list.push(o);
        }
        list.sort((a, b) => a.y - b.y);
        for (const o of list) {
            // bóng
            ctx.save();
            ctx.globalAlpha = 0.3; ctx.fillStyle = '#2a1c0e';
            ctx.beginPath(); ctx.ellipse(o.x, o.y + o.r * 0.5, o.r * 1.05, o.r * 0.42, 0, 0, U.TAU); ctx.fill();
            ctx.restore();
            if (o.kind === 'rock') {
                ctx.save(); ctx.translate(o.x, o.y);
                const R = o.r, h = R * 1.25;
                // thân
                const gr = ctx.createLinearGradient(0, -h, 0, R * 0.4);
                gr.addColorStop(0, '#a8895f'); gr.addColorStop(0.6, '#8a6e47'); gr.addColorStop(1, '#6b5232');
                ctx.fillStyle = gr;
                ctx.beginPath();
                ctx.moveTo(-R * 0.95, R * 0.25);
                ctx.lineTo(-R * 0.75, -h * 0.4);
                ctx.lineTo(-R * 0.25, -h * 0.85);
                ctx.lineTo(R * 0.3, -h * 0.7);
                ctx.lineTo(R * 0.8, -h * 0.2);
                ctx.lineTo(R * 0.9, R * 0.25);
                ctx.closePath(); ctx.fill();
                // mặt nắng
                ctx.fillStyle = 'rgba(240,215,160,0.35)';
                ctx.beginPath();
                ctx.moveTo(-R * 0.75, -h * 0.4); ctx.lineTo(-R * 0.25, -h * 0.85); ctx.lineTo(-R * 0.05, -h * 0.3); ctx.closePath(); ctx.fill();
                // vết nứt
                ctx.strokeStyle = 'rgba(60,42,22,0.5)'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(R * 0.1, -h * 0.5); ctx.lineTo(R * 0.35, -h * 0.1); ctx.lineTo(R * 0.2, R * 0.15); ctx.stroke();
                ctx.restore();
            } else if (o.kind === 'cactus') {
                ctx.save(); ctx.translate(o.x, o.y);
                const h = 42 * (0.8 + o.seed * 0.5);
                const sway = Math.sin(time * 1.3 + o.seed * 9) * 1.2;
                ctx.rotate(sway * 0.02);
                ctx.fillStyle = '#4f7a3a';
                this._rr(ctx, -o.r * 0.45, -h, o.r * 0.9, h, o.r * 0.45); ctx.fill();
                // nhánh
                ctx.fillStyle = '#557f40';
                this._rr(ctx, -o.r * 1.35, -h * 0.62, o.r * 0.85, o.r * 0.55, o.r * 0.27); ctx.fill();
                this._rr(ctx, -o.r * 1.35, -h * 0.75, o.r * 0.45, h * 0.3, o.r * 0.22); ctx.fill();
                this._rr(ctx, o.r * 0.42, -h * 0.5, o.r * 0.9, o.r * 0.5, o.r * 0.25); ctx.fill();
                this._rr(ctx, o.r * 1.3, -h * 0.75, o.r * 0.45, h * 0.5, o.r * 0.22); ctx.fill();
                // gai
                ctx.fillStyle = 'rgba(235,240,200,0.7)';
                for (let k = 0; k < 7; k++) ctx.fillRect(-o.r * 0.4 + (k % 3) * o.r * 0.4, -h * (0.25 + (k * 0.11)), 2, 1.5);
                // hoa nhỏ trên đỉnh
                if (o.seed > 0.75) {
                    ctx.fillStyle = '#e84a7f';
                    ctx.beginPath(); ctx.arc(0, -h - 1, 3, 0, U.TAU); ctx.fill();
                }
                ctx.restore();
            } else { // cây khô
                ctx.save(); ctx.translate(o.x, o.y);
                const h = 52 * (0.9 + o.seed * 0.4);
                const sway = Math.sin(time * 0.9 + o.seed * 17) * 1.6;
                ctx.strokeStyle = '#6b4c2c'; ctx.lineCap = 'round';
                ctx.lineWidth = 7;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sway, -h * 0.45, sway * 1.6, -h); ctx.stroke();
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(sway * 0.7, -h * 0.5); ctx.lineTo(sway * 0.7 - 16, -h * 0.8); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(sway * 1.1, -h * 0.72); ctx.lineTo(sway * 1.1 + 13, -h * 0.95); ctx.stroke();
                ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(sway * 0.7 - 16, -h * 0.8); ctx.lineTo(sway * 0.7 - 26, -h * 0.95); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(sway * 1.1 + 13, -h * 0.95); ctx.lineTo(sway * 1.1 + 22, -h * 1.05); ctx.stroke();
                ctx.restore();
            }
        }
    },
    _rr(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    },
};

// ---------- [BÃO CÁT] — vòng co dần kiểu battle royale ----------
const Storm = {
    cx: 1500, cy: 1500, r: 1050,
    phase: 0, t: 0, shrinking: false,
    oldR: 1050, oldX: 1500, oldY: 1500, dstR: 1050, dstX: 1500, dstY: 1500,
    dps: 2, enabled: true,
    PHASES: [
        { wait: 40, dura: 26, to: 640, dps: 3 },
        { wait: 34, dura: 22, to: 380, dps: 4 },
        { wait: 30, dura: 20, to: 215, dps: 7 },
        { wait: 26, dura: 18, to: 100, dps: 10 },
        { wait: 24, dura: 16, to: 34,  dps: 14 },
    ],
    reset(enabled) {
        this.enabled = enabled;
        this.cx = World.size / 2 + U.rand(-120, 120);
        this.cy = World.size / 2 + U.rand(-120, 120);
        this.r = 1050; this.phase = 0; this.t = this.PHASES[0].wait; this.shrinking = false;
        this.oldR = this.r; this.oldX = this.cx; this.oldY = this.cy;
        const p = this.PHASES[0];
        this.dstR = p.to; this.dps = p.dps;
        this._pickTarget(p);
    },
    _pickTarget(p) {
        const drift = (this.r - p.to) * U.rand(0.1, 0.42);
        const a = U.rand(0, U.TAU);
        let nx = this.cx + Math.cos(a) * drift, ny = this.cy + Math.sin(a) * drift;
        // giữ đích nằm trong vòng cũ
        const lim = this.r - p.to;
        const d = U.dist(this.cx, this.cy, nx, ny);
        if (d > lim * 0.9) { const s = (lim * 0.9) / d; nx = this.cx + (nx - this.cx) * s; ny = this.cy + (ny - this.cy) * s; }
        nx = U.clamp(nx, p.to, World.size - p.to);
        ny = U.clamp(ny, p.to, World.size - p.to);
        this.dstX = nx; this.dstY = ny; this.dstR = p.to;
    },
    update(dt) {
        if (!this.enabled) { this.r = 3000; return; }
        this.t -= dt;
        const p = this.PHASES[this.phase];
        if (this.shrinking) {
            const k = 1 - Math.pow(0.0001, dt);
            this.r += (this.dstR - this.r) * k * 2.2;
            this.cx += (this.dstX - this.cx) * k * 2.2;
            this.cy += (this.dstY - this.cy) * k * 2.2;
            if (this.t <= 0 && Math.abs(this.r - this.dstR) < 3) {
                this.r = this.dstR; this.cx = this.dstX; this.cy = this.dstY;
                this.shrinking = false;
                this.phase = Math.min(this.phase + 1, this.PHASES.length - 1);
                const np = this.PHASES[this.phase];
                this.t = (this.r > np.to) ? np.wait : 9999;
                this.dps = np.dps;
                if (this.r > np.to) this._pickTarget(np);
            }
        } else {
            if (this.t <= 0 && this.r > p.to + 1) {
                this.shrinking = true;
                this.t = p.dura;
                this.dps = p.dps;
                // giữ đích đã chọn
            } else if (this.t <= 0) {
                // đã ở cuối → tiếp tục chờ chậm
                this.t = 45;
            }
        }
    },
    // văn bản đồng hồ cho HUD: "Chờ 12s" / "CO 8s"
    label() {
        if (!this.enabled) return 'KHÔNG BÃO (TRAINING)';
        if (this.t > 900) return 'BÃO CO HẾT CỰC TIỂU';
        return (this.shrinking ? 'BÃO CO ĐẾN ' : 'BÃO CO SAU ') + Math.ceil(this.t) + 's';
    },
    outside(x, y) { return U.dist(x, y, this.cx, this.cy) > this.r; },
    drawWind(ctx, view, time) {
        // hạt cát bay quanh viền bão (chỉ khi trong khung nhìn)
        if (!this.enabled) return;
        const n = 30;
        for (let i = 0; i < n; i++) {
            const a = time * 0.55 + i * (U.TAU / n);
            const rr = this.r + Math.sin(time * 2 + i) * 14;
            const x = this.cx + Math.cos(a) * rr, y = this.cy + Math.sin(a) * rr;
            if (x < view.x0 - 60 || x > view.x1 + 60 || y < view.y0 - 60 || y > view.y1 + 60) continue;
            ctx.save();
            ctx.globalAlpha = 0.5 + Math.sin(time * 3 + i * 2) * 0.2;
            ctx.fillStyle = i % 3 ? '#e8b96b' : '#ff9a3c';
            const vx = -Math.sin(a) * 46, vy = Math.cos(a) * 46;
            ctx.fillRect(x - 3, y - 1, 8, 2);
            ctx.fillRect(x - 8 + vx * 0.06, y - 1 + vy * 0.06, 5, 1.4);
            ctx.restore();
        }
        // tia sét lăn quanh viền bão
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) {
            const flick = Math.sin(time * 11 + i * 7.3);
            if (flick < 0.35) continue;
            const a0 = time * 0.32 + i * (U.TAU / 6);
            const rr = this.r + Math.sin(time * 2.4 + i) * 6;
            const steps = 7;
            let px = this.cx + Math.cos(a0) * rr, py = this.cy + Math.sin(a0) * rr;
            if (px < view.x0 - 120 || px > view.x1 + 120 || py < view.y0 - 120 || py > view.y1 + 120) continue;
            ctx.globalAlpha = 0.18 + 0.5 * (flick - 0.35);
            ctx.strokeStyle = i % 2 ? '#ffd27a' : '#fff0c0';
            ctx.lineWidth = i % 2 ? 3.2 : 1.8;
            ctx.lineJoin = 'round';
            ctx.beginPath(); ctx.moveTo(px, py);
            for (let s = 1; s <= steps; s++) {
                const aa = a0 + s * 0.045;
                const jr = rr + Math.sin(time * 27 + i * 13 + s * 5.7) * 16;
                const nx = this.cx + Math.cos(aa) * jr, ny = this.cy + Math.sin(aa) * jr;
                ctx.lineTo(nx, ny);
                px = nx; py = ny;
            }
            ctx.stroke();
            ctx.globalAlpha *= 0.5;
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    },
    draw(ctx, view) {
        if (!this.enabled) return;
        ctx.save();
        // vùng ngoài bão: tối & đỏ cam
        ctx.beginPath();
        ctx.rect(view.x0 - 200, view.y0 - 200, (view.x1 - view.x0) + 400, (view.y1 - view.y0) + 400);
        ctx.arc(this.cx, this.cy, this.r, 0, U.TAU, true);
        ctx.fillStyle = 'rgba(122,58,18,0.42)';
        ctx.fill('evenodd');
        // viền phát sáng
        const pulse = 1 + Math.sin(performance.now() / 300) * 0.04;
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ff9a3c'; ctx.lineWidth = 7 * pulse;
        ctx.beginPath(); ctx.arc(this.cx, this.cy, this.r, 0, U.TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,235,180,0.8)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(this.cx, this.cy, this.r - 6, 0, U.TAU); ctx.stroke();
        ctx.restore();
    },
};
