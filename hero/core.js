// ============================================================
//  core.js — Tiện ích, camera, input (desktop + touch), SFX, FX
// ============================================================
'use strict';

// ---------- [TIỆN ÍCH] ----------
const U = {
    TAU: Math.PI * 2,
    rand(a, b) { if (b === undefined) { b = a; a = 0; } return a + Math.random() * (b - a); },
    irand(a, b) { return Math.floor(U.rand(a, b + 1)); },
    choice(arr) { return arr[(Math.random() * arr.length) | 0]; },
    chance(p) { return Math.random() < p; },
    clamp(v, a, b) { return v < a ? a : (v > b ? b : v); },
    lerp(a, b, t) { return a + (b - a) * t; },
    dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); },
    dist2(ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; },
    angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); },
    angDiff(a, b) { let d = (b - a) % U.TAU; if (d > Math.PI) d -= U.TAU; if (d < -Math.PI) d += U.TAU; return d; },
    angLerp(a, b, t) { return a + U.angDiff(a, b) * t; },
    fmtTime(s) { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; },
};

// ---------- [CAMERA] ----------
const Cam = {
    x: 1500, y: 1500, w: 1280, h: 720, zoom: 1, shakeM: 0, zoomP: 0,
    init(W, H) {
        this.w = W; this.h = H;
        this.zoom = U.clamp(Math.max(W / 1500, H / 840), 0.6, 1.35);
    },
    follow(tx, ty, dt) {
        const k = 1 - Math.pow(0.0005, dt);
        this.x += (tx - this.x) * k;
        this.y += (ty - this.y) * k;
        const hx = this.w / 2 / this.zoom, hy = this.h / 2 / this.zoom;
        this.x = U.clamp(this.x, hx - 200, World.size - hx + 200);
        this.y = U.clamp(this.y, hy - 200, World.size - hy + 200);
    },
    snap(tx, ty) { this.x = tx; this.y = ty; },
    shake(m) { this.shakeM = Math.max(this.shakeM, m); },
    punch(z) { this.zoomP = Math.max(this.zoomP, z); },
    update(dt) {
        this.shakeM *= Math.pow(0.02, dt);
        if (this.shakeM < 0.05) this.shakeM = 0;
        this.zoomP *= Math.pow(0.05, dt);
    },
    zoomNow() { return this.zoom * (1 + this.zoomP); },
    apply(ctx) {
        const z = this.zoomNow();
        const sx = this.shakeM > 0 ? U.rand(-this.shakeM, this.shakeM) : 0;
        const sy = this.shakeM > 0 ? U.rand(-this.shakeM, this.shakeM) : 0;
        ctx.translate(this.w / 2 + sx, this.h / 2 + sy);
        ctx.scale(z, z);
        ctx.translate(-this.x, -this.y);
    },
    screenToWorld(sx, sy) {
        const z = this.zoomNow();
        return { x: (sx - this.w / 2) / z + this.x, y: (sy - this.h / 2) / z + this.y };
    },
};

// ---------- [INPUT] ----------
const Input = {
    keys: {}, pressQ: [], mouse: { x: 0, y: 0, down: false },
    stick: { active: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 },   // joystick ảo
    btns: {
        atk: { x: 0, y: 0, r: 46, down: false, id: -1, glow: 0 },
        Q: { x: 0, y: 0, r: 30, down: false, id: -1, glow: 0 },
        E: { x: 0, y: 0, r: 30, down: false, id: -1, glow: 0 },
        R: { x: 0, y: 0, r: 34, down: false, id: -1, glow: 0 },
    },
    isTouch: false, aimScreen: { x: 640, y: 360 },
    init(canvas) {
        const cv = canvas;
        this.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        window.addEventListener('keydown', (e) => {
            if (e.repeat) { return; }
            this.keys[e.code] = true;
            this.pressQ.push(e.code);
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
            Sfx.ensure();
        });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

        cv.addEventListener('pointerdown', (e) => {
            Sfx.ensure();
            cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
            const x = e.clientX, y = e.clientY;
            if (this.isTouch && x < cv.clientWidth * 0.48 && !this.stick.active) {
                this.stick.active = true; this.stick.id = e.pointerId;
                this.stick.ox = x; this.stick.oy = y; this.stick.x = 0; this.stick.y = 0;
                return;
            }
            // nút kỹ năng
            for (const k of ['R', 'E', 'Q', 'atk']) {
                const b = this.btns[k];
                if (U.dist(x, y, b.x, b.y) <= b.r * 1.3) {
                    b.down = true; b.id = e.pointerId; b.glow = 1; return;
                }
            }
            if (e.pointerType === 'mouse') {
                if (e.button === 0) this.mouse.down = true;
            }
        });
        window.addEventListener('pointermove', (e) => {
            const x = e.clientX, y = e.clientY;
            this.mouse.x = x; this.mouse.y = y;
            if (this.stick.active && e.pointerId === this.stick.id) {
                let dx = x - this.stick.ox, dy = y - this.stick.oy;
                const d = Math.hypot(dx, dy);
                const max = 72;
                if (d > max) { this.stick.ox = x - dx / d * max; this.stick.oy = y - dy / d * max; dx = dx / d * max; dy = dy / d * max; }
                this.stick.x = dx / max; this.stick.y = dy / max;
            }
        });
        const endP = (e) => {
            if (this.stick.active && e.pointerId === this.stick.id) {
                this.stick.active = false; this.stick.x = 0; this.stick.y = 0;
            }
            for (const k of ['R', 'E', 'Q', 'atk']) {
                const b = this.btns[k];
                if (b.id === e.pointerId) { b.down = false; b.id = -1; }
            }
            if (e.pointerType === 'mouse' && e.button === 0) this.mouse.down = false;
        };
        window.addEventListener('pointerup', endP);
        window.addEventListener('pointercancel', endP);
        cv.addEventListener('contextmenu', (e) => e.preventDefault());
    },
    pressed(code) { return this.pressQ.includes(code); },
    held(code) { return !!this.keys[code]; },
    consumeKeys() { this.pressQ.length = 0; },
    moveVec() {
        let mx = 0, my = 0;
        if (this.held('KeyA') || this.held('ArrowLeft')) mx -= 1;
        if (this.held('KeyD') || this.held('ArrowRight')) mx += 1;
        if (this.held('KeyW') || this.held('ArrowUp')) my -= 1;
        if (this.held('KeyS') || this.held('ArrowDown')) my += 1;
        if (this.stick.active) { mx = this.stick.x; my = this.stick.y; }
        const d = Math.hypot(mx, my);
        if (d > 1) { mx /= d; my /= d; }
        return { x: mx, y: my, mag: Math.min(1, d) };
    },
    wantAttack() {
        if (this.mouse.down || this.held('Space') || this.held('KeyJ')) return true;
        if (this.btns.atk.down) return true;
        return false;
    },
};

// ---------- [ÂM THANH] (WebAudio tự tổng hợp, không cần file) ----------
const Sfx = {
    ctx: null, master: null, muted: false, _noise: null,
    ensure() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.master = this.ctx.createGain();
                this.master.gain.value = 0.45;
                this.master.connect(this.ctx.destination);
                const len = this.ctx.sampleRate * 0.5;
                const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
                const d = buf.getChannelData(0);
                for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
                this._noise = buf;
            } catch (e) { this.ctx = null; }
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
    },
    tone(o) {
        if (!this.ctx || this.muted) return;
        try {
            const t0 = this.ctx.currentTime + (o.delay || 0);
            const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
            osc.type = o.type || 'square';
            osc.frequency.setValueAtTime(o.f || 440, t0);
            if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + o.dur);
            g.gain.setValueAtTime(o.vol || 0.12, t0);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
            osc.connect(g); g.connect(this.master);
            osc.start(t0); osc.stop(t0 + o.dur + 0.05);
        } catch (e) { }
    },
    noise(o) {
        if (!this.ctx || this.muted || !this._noise) return;
        try {
            const t0 = this.ctx.currentTime + (o.delay || 0);
            const src = this.ctx.createBufferSource();
            src.buffer = this._noise;
            const f = this.ctx.createBiquadFilter();
            f.type = o.ftype || 'bandpass'; f.frequency.value = o.f || 900; f.Q.value = o.q || 1;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(o.vol || 0.15, t0);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
            src.connect(f); f.connect(g); g.connect(this.master);
            src.start(t0); src.stop(t0 + o.dur + 0.05);
        } catch (e) { }
    },
    shoot() { this.tone({ f: 720, f2: 160, dur: 0.08, type: 'square', vol: 0.07 }); },
    pellet() { this.tone({ f: 980, f2: 220, dur: 0.05, type: 'sawtooth', vol: 0.06 }); },
    slash() { this.noise({ f: 2600, dur: 0.09, vol: 0.1, ftype: 'highpass' }); },
    dash() { this.noise({ f: 700, f2: 2400, dur: 0.18, vol: 0.11, ftype: 'bandpass' }); },
    slam() { this.tone({ f: 120, f2: 46, dur: 0.3, type: 'sine', vol: 0.3 }); this.noise({ f: 240, dur: 0.22, vol: 0.2 }); },
    spin() { this.noise({ f: 1400, dur: 0.5, vol: 0.09, ftype: 'bandpass' }); },
    cast() { this.tone({ f: 320, f2: 880, dur: 0.22, type: 'triangle', vol: 0.12 }); },
    hit() { this.tone({ f: 210, f2: 90, dur: 0.07, type: 'square', vol: 0.1 }); this.noise({ f: 1800, dur: 0.05, vol: 0.08 }); },
    launch() { this.tone({ f: 150, f2: 600, dur: 0.2, type: 'sine', vol: 0.18 }); },
    die() { this.tone({ f: 300, f2: 60, dur: 0.45, type: 'sawtooth', vol: 0.16 }); },
    growl() { this.tone({ f: 90, f2: 60, dur: 0.3, type: 'sawtooth', vol: 0.1 }); },
    levelup() {
        [523, 659, 784, 1047].forEach((f, i) => this.tone({ f, dur: 0.16, type: 'triangle', vol: 0.14, delay: i * 0.09 }));
    },
    ult() {
        this.tone({ f: 90, f2: 40, dur: 0.7, type: 'sawtooth', vol: 0.25 });
        this.tone({ f: 200, f2: 800, dur: 0.5, type: 'triangle', vol: 0.14 });
    },
    ultReady() { this.tone({ f: 880, dur: 0.1, type: 'triangle', vol: 0.1 }); this.tone({ f: 1320, dur: 0.12, type: 'triangle', vol: 0.1, delay: 0.1 }); },
    pick() { this.tone({ f: 700, f2: 1200, dur: 0.1, type: 'triangle', vol: 0.1 }); },
    chain() {
        // tiếng xích kim loại
        this.noise({ f: 3200, dur: 0.12, vol: 0.12, ftype: 'highpass', q: 0.7 });
        this.noise({ f: 1600, dur: 0.2, vol: 0.09, ftype: 'bandpass', delay: 0.03 });
        this.tone({ f: 2200, f2: 900, dur: 0.12, type: 'square', vol: 0.05 });
    },
    chainHit() {
        this.noise({ f: 2400, dur: 0.16, vol: 0.16, ftype: 'bandpass', q: 1.4 });
        this.tone({ f: 170, f2: 70, dur: 0.14, type: 'square', vol: 0.14 });
    },
    charge() {
        this.tone({ f: 180, f2: 900, dur: 0.55, type: 'sawtooth', vol: 0.1 });
    },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone({ f, dur: 0.3, type: 'triangle', vol: 0.15, delay: i * 0.14 })); },
    lose() { [400, 340, 280, 200].forEach((f, i) => this.tone({ f, dur: 0.32, type: 'sawtooth', vol: 0.12, delay: i * 0.16 })); },
    count() { this.tone({ f: 620, dur: 0.1, type: 'triangle', vol: 0.12 }); },
    go() { this.tone({ f: 880, dur: 0.25, type: 'triangle', vol: 0.16 }); },
};

// ---------- [FX] hiệu ứng ----------
const FX = {
    parts: [], rings: [], texts: [], ghosts: [], slashes: [], decals: [], shocks: [],
    chains: [], beams: [], bolts: [], runeBits: [], rays: [],
    flashA: 0, flashC: '#ffffff', hurtA: 0, slowT: 0, MAXP: 900,
    hitstopT: 0, comboN: 0, comboT: 0, comboBest: 0,
    clear() {
        this.parts.length = 0; this.rings.length = 0; this.texts.length = 0; this.ghosts.length = 0;
        this.slashes.length = 0; this.decals.length = 0; this.shocks.length = 0;
        this.chains.length = 0; this.beams.length = 0; this.bolts.length = 0; this.runeBits.length = 0; this.rays.length = 0;
        this.hitstopT = 0; this.comboN = 0; this.comboT = 0; this.comboBest = 0;
    },
    add(p) { if (this.parts.length >= this.MAXP) this.parts.splice(0, 50); this.parts.push(p); },
    part(x, y, vx, vy, life, size, color, opts) {
        opts = opts || {};
        this.add({ x, y, vx, vy, life, maxLife: life, size, color, type: opts.type || 'dot', grav: opts.grav || 0, drag: opts.drag || 0.9, glow: opts.glow || false, rot: opts.rot || 0, vr: opts.vr || 0 });
    },
    burst(x, y, n, color, opts) {
        opts = opts || {};
        for (let i = 0; i < n; i++) {
            const a = opts.ang !== undefined ? opts.ang + U.rand(-opts.spread || -0.6, opts.spread || 0.6) : U.rand(0, U.TAU);
            const sp = U.rand(0.4, 1.0) * (opts.speed || 160);
            this.part(x, y, Math.cos(a) * sp, Math.sin(a) * sp, U.rand(0.25, opts.life || 0.6), U.rand(1.5, opts.size || 4), color, opts);
        }
    },
    sparkHit(x, y, color, n) {
        for (let i = 0; i < (n || 6); i++) {
            const a = U.rand(0, U.TAU), sp = U.rand(120, 340);
            this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: U.rand(0.12, 0.3), maxLife: 0.3, size: U.rand(1, 2.4), color: i % 2 ? color : '#ffffff', type: 'spark', drag: 0.86, glow: true });
        }
    },
    ring(x, y, r0, r1, color, life, w) { this.rings.push({ x, y, r0, r1, color, life, maxLife: life, w: w || 3 }); },
    shock(x, y, r, color, life) { this.shocks.push({ x, y, r, color, life, maxLife: life || 0.4 }); },
    text(x, y, str, color, size) { this.texts.push({ x, y, str, color, size: size || 14, life: 0.9, maxLife: 0.9, vy: -46 }); },
    slash(x, y, ang, range, arc, color, w) {
        this.slashes.push({ x, y, ang, range, arc: arc || 1.9, color, w: w || 7, life: 0.18, maxLife: 0.18, sweep: 0 });
    },
    ghost(f) {
        this.ghosts.push({ sheet: f.sheetKey, cell: f.cellIdx, scale: f.sheetScale, flip: f.flip, x: f.x, y: f.y, t: 0, life: 0.28, color: f.def.color });
    },
    crack(x, y, r) {
        if (this.decals.length > 110) this.decals.shift();
        this.decals.push({ x, y, r, rot: U.rand(0, U.TAU), type: 'crack', life: 14, maxLife: 14 });
    },
    stain(x, y, r, color) {
        if (this.decals.length > 110) this.decals.shift();
        this.decals.push({ x, y, r, rot: U.rand(0, U.TAU), type: 'stain', color, life: 12, maxLife: 12 });
    },
    dust(x, y, n, color) {
        for (let i = 0; i < n; i++) {
            const a = U.rand(0, U.TAU), sp = U.rand(30, 120);
            this.part(x, y, Math.cos(a) * sp, Math.sin(a) * sp * 0.5 - 20, U.rand(0.4, 0.9), U.rand(6, 13), color || '#d8b98a', { type: 'smoke', drag: 0.92 });
        }
    },
    explosion(x, y, scale, color) {
        const s = scale || 1;
        FX.burst(x, y, Math.round(18 * s), color || '#ffb642', { speed: 300 * s, life: 0.7, size: 6 * s, glow: true });
        FX.burst(x, y, Math.round(12 * s), '#ff5a3c', { speed: 220 * s, life: 0.55, size: 5 * s, glow: true });
        for (let i = 0; i < Math.round(8 * s); i++) FX.part(x + U.rand(-8, 8) * s, y + U.rand(-8, 8) * s, U.rand(-40, 40), U.rand(-70, -20), U.rand(0.6, 1.2), U.rand(10, 22) * s, '#5a5250', { type: 'smoke' });
        FX.ring(x, y, 6 * s, 62 * s, '#ffd27a', 0.35, 5 * s);
        FX.flash('#ffb642', 0.12 * s);
        Cam.shake(9 * s);
    },

    // ---------- VFX CAO CẤP ----------
    // sợi xích bay từ A đến B (tự vẽ từng mắt xích + quầng sáng)
    chain(x1, y1, x2, y2, opts) {
        opts = opts || {};
        if (this.chains.length > 90) this.chains.splice(0, 20);
        this.chains.push({
            x1, y1, x2, y2, t: 0,
            life: opts.life || 0.32, maxLife: opts.life || 0.32,
            color: opts.color || '#ffd166', w: opts.w || 3.4,
            sag: opts.sag === undefined ? 14 : opts.sag,
            grow: opts.grow || 0.1, glow: opts.glow !== false, style: opts.style || 'chain',
            jitter: opts.jitter || 0,
        });
    },
    bolt(x1, y1, x2, y2, color, life, seg) {
        if (this.bolts.length > 60) this.bolts.splice(0, 14);
        this.bolts.push({ x1, y1, x2, y2, color: color || '#e8f6ff', life: life || 0.18, maxLife: life || 0.18, seg: seg || 10, seed: Math.random() * 1000 });
    },
    beam(x1, y1, x2, y2, color, w, life) {
        if (this.beams.length > 40) this.beams.splice(0, 10);
        this.beams.push({ x1, y1, x2, y2, color: color || '#fff2b0', w: w || 4, life: life || 0.2, maxLife: life || 0.2 });
    },
    runeBurst(x, y, color, n, radius, life) {
        this.rays.push({ x, y, color: color || '#ffd166', n: n || 10, radius: radius || 90, life: life || 0.6, maxLife: life || 0.6, rot: U.rand(0, U.TAU) });
    },
    runes(x, y, color, n, radius, life) {
        // vòng chữ rune bay lên
        for (let i = 0; i < (n || 6); i++) {
            const a = U.rand(0, U.TAU);
            this.runeBits.push({ x: x + Math.cos(a) * radius * 0.3, y: y + Math.sin(a) * radius * 0.15, vy: -U.rand(18, 40), color: color || '#ffd166', glyph: (Math.random() * 6) | 0, size: U.rand(8, 15), life: life || 0.9, maxLife: life || 0.9, rot: U.rand(0, U.TAU), vr: U.rand(-2, 2) });
        }
    },
    // xung kích "cao cấp": nhiều lớp vòng + bụi + tàn lửa + sẹo đất
    premiumShock(x, y, r, color, opts) {
        opts = opts || {};
        color = color || '#ffd28a';
        FX.ring(x, y, r * 0.1, r * 1.05, color, 0.5, 6);
        FX.ring(x, y, r * 0.05, r * 0.7, '#ffffff', 0.32, 2.5);
        FX.ring(x, y, r * 0.2, r * 1.35, color, 0.75, 2);
        FX.shock(x, y, r * 0.95, 'rgba(255,205,130,0.22)', 0.5);
        FX.dust(x, y, Math.min(24, Math.round(r / 9)));
        for (let i = 0; i < Math.min(22, Math.round(r / 7)); i++) {
            const a = U.rand(0, U.TAU), sp = U.rand(140, 420);
            this.part(x, y, Math.cos(a) * sp, Math.sin(a) * sp * 0.55 - 40, U.rand(0.4, 0.85), U.rand(1.4, 3.4), U.chance(0.5) ? color : '#fff4c9', { glow: true, grav: 520, drag: 0.93 });
        }
        FX.crack(x, y, r * 0.85);
        Cam.shake(4 + r * 0.05);
        if (opts.hitstop !== false) FX.hitstop(0.05);
    },
    hitstop(sec) { this.hitstopT = Math.max(this.hitstopT, sec); },
    comboAdd() { this.comboN++; this.comboT = 1.7; this.comboBest = Math.max(this.comboBest, this.comboN); },

    // bụi cát bay lơ lửng toàn màn hình (ambient)
    drawAmbient(ctx, view, time) {
        const w = view.x1 - view.x0, h = view.y1 - view.y0;
        ctx.save();
        ctx.fillStyle = '#ffe9bc';
        for (let i = 0; i < 64; i++) {
            const seed = i * 97.13;
            const spd = 26 + (i % 5) * 18;
            const x = view.x0 + ((seed * 53 + time * spd) % w);
            const y = view.y0 + ((seed * 31 + Math.sin(time * 0.6 + i * 1.7) * 46 + i * 41) % h);
            const a = 0.05 + ((i % 3) * 0.045);
            ctx.globalAlpha = a;
            ctx.fillRect(x, y, 2 + (i % 3) * 1.2, 1.1);
        }
        // bụi cát lớn trôi chậm (parallax)
        for (let i = 0; i < 10; i++) {
            const x = view.x0 + ((i * 331 + time * (14 + i * 3)) % w);
            const y = view.y0 + ((i * 217 + Math.sin(time * 0.35 + i) * 70) % h);
            ctx.globalAlpha = 0.045;
            ctx.fillStyle = '#e8c88c';
            ctx.beginPath(); ctx.ellipse(x, y, 34 + (i % 3) * 16, 12 + (i % 2) * 6, 0.3, 0, U.TAU); ctx.fill();
        }
        ctx.restore();
    },
    flash(color, a) { this.flashC = color; this.flashA = Math.max(this.flashA, a); },
    slowmo(sec) { this.slowT = Math.max(this.slowT, sec); },
    hurtFlash(a) { this.hurtA = Math.max(this.hurtA, a); },

    update(dt) {
        const d2 = dt * dt;
        // hạt
        for (let i = this.parts.length - 1; i >= 0; i--) {
            const p = this.parts[i];
            p.life -= dt;
            if (p.life <= 0) { this.parts.splice(i, 1); continue; }
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60);
            p.vy += (p.grav || 0) * dt;
            p.rot += (p.vr || 0) * dt;
        }
        for (let i = this.rings.length - 1; i >= 0; i--) { const r = this.rings[i]; r.life -= dt; if (r.life <= 0) this.rings.splice(i, 1); }
        for (let i = this.shocks.length - 1; i >= 0; i--) { const s = this.shocks[i]; s.life -= dt; if (s.life <= 0) this.shocks.splice(i, 1); }
        for (let i = this.slashes.length - 1; i >= 0; i--) { const s = this.slashes[i]; s.life -= dt; s.sweep = 1 - s.life / s.maxLife; if (s.life <= 0) this.slashes.splice(i, 1); }
        for (let i = this.texts.length - 1; i >= 0; i--) { const t = this.texts[i]; t.life -= dt; t.y += t.vy * dt; t.vy *= Math.pow(0.9, dt * 60); if (t.life <= 0) this.texts.splice(i, 1); }
        for (let i = this.ghosts.length - 1; i >= 0; i--) { const g = this.ghosts[i]; g.t += dt; if (g.t >= g.life) this.ghosts.splice(i, 1); }
        for (let i = this.decals.length - 1; i >= 0; i--) { const d = this.decals[i]; d.life -= dt; if (d.life <= 0) this.decals.splice(i, 1); }
        for (let i = this.chains.length - 1; i >= 0; i--) { const c = this.chains[i]; c.t += dt; if (c.t >= c.life) this.chains.splice(i, 1); }
        for (let i = this.beams.length - 1; i >= 0; i--) { const b = this.beams[i]; b.life -= dt; if (b.life <= 0) this.beams.splice(i, 1); }
        for (let i = this.bolts.length - 1; i >= 0; i--) { const b = this.bolts[i]; b.life -= dt; if (b.life <= 0) this.bolts.splice(i, 1); }
        for (let i = this.runeBits.length - 1; i >= 0; i--) { const r = this.runeBits[i]; r.life -= dt; r.y += r.vy * dt; r.rot += r.vr * dt; if (r.life <= 0) this.runeBits.splice(i, 1); }
        for (let i = this.rays.length - 1; i >= 0; i--) { const r = this.rays[i]; r.life -= dt; if (r.life <= 0) this.rays.splice(i, 1); }
        if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.comboN = 0; }
        this.flashA = Math.max(0, this.flashA - dt * 2.4);
        this.hurtA = Math.max(0, this.hurtA - dt * 2.2);
        this.slowT = Math.max(0, this.slowT - dt);
    },

    // vết trên đất (vẽ trước thực thể)
    drawDecals(ctx) {
        for (const d of this.decals) {
            const a = U.clamp(d.life / d.maxLife, 0, 1);
            ctx.save(); ctx.globalAlpha = a * (d.type === 'stain' ? 0.5 : 0.55); ctx.translate(d.x, d.y);
            if (d.type === 'stain') {
                ctx.fillStyle = d.color; ctx.beginPath(); ctx.ellipse(0, 0, d.r, d.r * 0.6, d.rot, 0, U.TAU); ctx.fill();
            } else {
                ctx.rotate(d.rot); ctx.strokeStyle = '#6b4a26'; ctx.lineWidth = 2.2;
                for (let k = 0; k < 6; k++) {
                    const ang = k / 6 * Math.PI + 0.3;
                    const len = d.r * (0.55 + (k % 3) * 0.22);
                    ctx.beginPath(); ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
                    ctx.lineTo(Math.cos(ang) * len + Math.cos(ang + 1.2) * len * 0.4, Math.sin(ang) * len + Math.sin(ang + 1.2) * len * 0.4);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
    },

    drawWorld(ctx) {
        // sau ảnh bước (dash)
        for (const g of this.ghosts) {
            const a = 0.5 * (1 - g.t / g.life);
            ctx.save(); ctx.globalAlpha = a * 0.5;
            SPR.drawCell(ctx, g.sheet, g.cell, g.x, g.y, g.scale, g.flip, a);
            ctx.restore();
        }
        // vòng xung kích
        for (const r of this.rings) {
            const p = 1 - r.life / r.maxLife;
            const rr = U.lerp(r.r0, r.r1, p);
            const a = Math.sin((1 - p) * Math.PI) * 0.9;
            ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = r.color; ctx.lineWidth = r.w * (1 - p * 0.6);
            ctx.beginPath(); ctx.arc(r.x, r.y, rr, 0, U.TAU); ctx.stroke(); ctx.restore();
        }
        // dao động xung kích (mờ dần)
        for (const s of this.shocks) {
            const p = 1 - s.life / s.maxLife;
            ctx.save(); ctx.globalAlpha = 0.35 * (1 - p);
            ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (0.6 + p * 0.4), 0, U.TAU); ctx.fill(); ctx.restore();
        }
        // vết chém (lưỡi liềm)
        for (const s of this.slashes) {
            const a = s.life / s.maxLife;
            const p = s.sweep;
            ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.ang);
            // quầng sáng phía sau lưỡi chém
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = a * 0.3;
            ctx.strokeStyle = s.color; ctx.lineCap = 'round';
            ctx.lineWidth = s.w * 2.4 * a;
            const from0 = -s.arc / 2 + p * 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, s.range * 0.9, from0, from0 + s.arc * (0.35 + p * 0.65));
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = a; ctx.strokeStyle = s.color;
            ctx.lineWidth = s.w * a;
            const from = -s.arc / 2 + p * 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, s.range * 0.9, from, from + s.arc * (0.35 + p * 0.65));
            ctx.stroke();
            ctx.lineWidth = Math.max(1, s.w * a * 0.5); ctx.strokeStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, s.range * 0.9, from, from + s.arc * (0.35 + p * 0.65) - 0.25);
            ctx.stroke();
            ctx.restore();
        }
        // ---------- XÍCH + NĂNG LƯỢNG (lớp mới) ----------
        this._drawEnergy(ctx);
        // hạt bụi/khói (phía dưới glow)
        for (const p of this.parts) {
            const a = U.clamp(p.life / p.maxLife, 0, 1);
            if (p.glow) continue;
            if (p.type === 'smoke') {
                ctx.save(); ctx.globalAlpha = a * 0.4; ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.4 - a * 0.5), 0, U.TAU); ctx.fill(); ctx.restore();
            } else if (p.type === 'spark') {
                ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = p.color; ctx.lineWidth = p.size * 0.7;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); ctx.stroke(); ctx.restore();
            } else {
                ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, U.TAU); ctx.fill(); ctx.restore();
            }
        }
        // hạt phát sáng (lighter)
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const p of this.parts) {
            if (!p.glow) continue;
            const a = U.clamp(p.life / p.maxLife, 0, 1);
            ctx.globalAlpha = a;
            if (p.type === 'spark') {
                ctx.strokeStyle = p.color; ctx.lineWidth = p.size * 0.8;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, U.TAU); ctx.fill();
            }
        }
        ctx.restore();
        // số sát thương
        for (const t of this.texts) {
            const a = U.clamp(t.life / t.maxLife, 0, 1);
            const pop = 1 + U.clamp((t.life - (t.maxLife - 0.12)) / 0.12, 0, 1) * 0.4;
            ctx.save();
            ctx.globalAlpha = a;
            ctx.translate(t.x, t.y); ctx.scale(pop, pop);
            ctx.font = '800 ' + t.size + 'px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.lineWidth = 3.4; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeText(t.str, 0, 0);
            ctx.shadowColor = t.color; ctx.shadowBlur = 8;
            ctx.fillStyle = t.color; ctx.fillText(t.str, 0, 0);
            ctx.restore();
        }
    },

    // ===== VẼ XÍCH / TIA SÉT / RUNE / TIA SÁNG =====
    _drawEnergy(ctx) {
        const now = performance.now() / 1000;
        // tia sáng nền (rune burst)
        for (const r of this.rays) {
            const p = 1 - r.life / r.maxLife;
            const a = Math.sin((1 - p) * Math.PI);
            ctx.save();
            ctx.translate(r.x, r.y);
            ctx.globalCompositeOperation = 'lighter';
            ctx.rotate(r.rot + p * 0.6);
            ctx.globalAlpha = 0.35 * a;
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 2;
            for (let i = 0; i < r.n; i++) {
                const ang = i / r.n * U.TAU;
                const len = r.radius * (0.5 + p * 0.7);
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * r.radius * 0.12, Math.sin(ang) * r.radius * 0.12);
                ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
                ctx.stroke();
            }
            // vòng tròn rune kép
            ctx.globalAlpha = 0.55 * a;
            ctx.lineWidth = 3 * (1 - p * 0.4);
            ctx.beginPath(); ctx.arc(0, 0, r.radius * (0.3 + p * 0.6), 0, U.TAU); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, r.radius * (0.45 + p * 0.75), 0, U.TAU); ctx.stroke();
            ctx.restore();
        }
        // rune glyph bay
        for (const r of this.runeBits) {
            const a = U.clamp(r.life / r.maxLife, 0, 1);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = a * 0.9;
            ctx.translate(r.x, r.y);
            ctx.rotate(r.rot);
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 1.8;
            const s = r.size;
            // vài nét tượng trưng chữ cổ
            ctx.beginPath();
            if (r.glyph === 0) { ctx.moveTo(-s * 0.4, -s * 0.5); ctx.lineTo(s * 0.3, -s * 0.5); ctx.lineTo(-s * 0.1, s * 0.1); ctx.lineTo(s * 0.4, s * 0.5); }
            else if (r.glyph === 1) { ctx.moveTo(0, -s * 0.55); ctx.lineTo(0, s * 0.55); ctx.moveTo(-s * 0.45, 0); ctx.lineTo(s * 0.45, 0); }
            else if (r.glyph === 2) { ctx.arc(0, 0, s * 0.45, 0.4, U.TAU - 0.4); }
            else if (r.glyph === 3) { ctx.moveTo(-s * 0.4, -s * 0.45); ctx.lineTo(0, s * 0.5); ctx.lineTo(s * 0.4, -s * 0.45); }
            else if (r.glyph === 4) { ctx.moveTo(-s * 0.35, s * 0.45); ctx.quadraticCurveTo(-s * 0.6, -s * 0.2, 0, -s * 0.5); ctx.quadraticCurveTo(s * 0.6, -s * 0.2, s * 0.35, s * 0.45); }
            else { ctx.moveTo(-s * 0.35, -s * 0.5); ctx.lineTo(s * 0.35, -s * 0.15); ctx.lineTo(-s * 0.35, s * 0.15); ctx.lineTo(s * 0.35, s * 0.5); }
            ctx.stroke();
            ctx.restore();
        }
        // tia sét
        for (const b of this.bolts) {
            const a = U.clamp(b.life / b.maxLife, 0, 1);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            // quầng ngoài
            ctx.globalAlpha = 0.35 * a;
            ctx.strokeStyle = b.color; ctx.lineWidth = 7; ctx.lineJoin = 'round';
            ctx.beginPath();
            const rnd = (i) => Math.sin(b.seed + i * 12.9898 + Math.floor(now * 30) * 78.233) * 43758.5453 % 1;
            let px = b.x1, py = b.y1;
            ctx.moveTo(px, py);
            for (let i = 1; i <= b.seg; i++) {
                const t = i / b.seg;
                const mx = U.lerp(b.x1, b.x2, t), my = U.lerp(b.y1, b.y2, t);
                const nx = -(b.y2 - b.y1), ny = (b.x2 - b.x1);
                const nl = Math.hypot(nx, ny) || 1;
                const off = (Math.abs(rnd(i)) - 0.5) * 26 * Math.sin(t * Math.PI);
                px = mx + nx / nl * off; py = my + ny / nl * off;
                ctx.lineTo(px, py);
            }
            ctx.stroke();
            // lõi trắng
            ctx.globalAlpha = a;
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
        // chùm sáng
        for (const b of this.beams) {
            const a = U.clamp(b.life / b.maxLife, 0, 1);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createLinearGradient(b.x1, b.y1, b.x2, b.y2);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(0.25, b.color);
            g.addColorStop(0.5, '#ffffff');
            g.addColorStop(0.75, b.color);
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.globalAlpha = a;
            ctx.strokeStyle = g;
            ctx.lineCap = 'round';
            ctx.lineWidth = b.w * 3 * a;
            ctx.globalAlpha = 0.18 * a;
            ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
            ctx.globalAlpha = 0.75 * a;
            ctx.lineWidth = b.w * a;
            ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
            ctx.globalAlpha = a;
            ctx.lineWidth = Math.max(1, b.w * 0.35 * a);
            ctx.strokeStyle = '#ffffff';
            ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
            ctx.restore();
        }
        // xích — vẽ từng mắt xích dọc đường cong
        for (const c of this.chains) {
            const t = c.t / c.life;
            const growT = U.clamp(c.t / c.grow, 0, 1);
            const ease = 1 - Math.pow(1 - growT, 3);
            const fade = t < 0.62 ? 1 : 1 - (t - 0.62) / 0.38;
            const ax = c.x1, ay = c.y1;
            const bx = U.lerp(c.x1, c.x2, ease), by = U.lerp(c.y1, c.y2, ease);
            const mx = (ax + bx) / 2 + (c.jitter ? Math.sin(now * 26) * c.jitter : 0);
            const my = (ay + by) / 2 + c.sag * (1 - Math.abs(ease * 2 - 1) * 0.35);
            const len = Math.hypot(bx - ax, by - ay) || 1;
            const step = 9;
            const n = Math.max(2, Math.floor(len / step));
            ctx.save();
            // quầng năng lượng phía sau xích
            ctx.globalCompositeOperation = 'lighter';
            if (c.glow) {
                ctx.globalAlpha = 0.3 * fade;
                ctx.strokeStyle = c.color;
                ctx.lineWidth = c.w * 2.4;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.quadraticCurveTo(mx, my, bx, by);
                ctx.stroke();
                ctx.globalAlpha = 0.16 * fade;
                ctx.lineWidth = c.w * 5;
                ctx.stroke();
            }
            ctx.globalCompositeOperation = 'source-over';
            // các mắt xích
            for (let i = 0; i <= n; i++) {
                const s = i / n;
                // điểm trên đường cong bậc 2
                const px = (1 - s) * (1 - s) * ax + 2 * (1 - s) * s * mx + s * s * bx;
                const py = (1 - s) * (1 - s) * ay + 2 * (1 - s) * s * my + s * s * by;
                // đạo hàm để lấy hướng
                const dx = 2 * (1 - s) * (mx - ax) + 2 * s * (bx - mx);
                const dy = 2 * (1 - s) * (my - ay) + 2 * s * (by - my);
                const ang = Math.atan2(dy, dx);
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(ang);
                ctx.globalAlpha = fade;
                const lw = c.w * (0.62 + Math.sin(s * Math.PI) * 0.28);
                // mắt xích: viền tối + lõi sáng
                ctx.strokeStyle = 'rgba(60,34,8,0.85)';
                ctx.lineWidth = lw + 1.6;
                ctx.beginPath();
                if (i % 2 === 0) ctx.ellipse(0, 0, step * 0.52, lw, 0, 0, U.TAU);
                else ctx.ellipse(0, 0, lw, step * 0.52, 0, 0, U.TAU);
                ctx.stroke();
                ctx.strokeStyle = c.color;
                ctx.lineWidth = lw * 0.62;
                ctx.stroke();
                // ánh kim loại
                ctx.strokeStyle = 'rgba(255,246,214,0.8)';
                ctx.lineWidth = Math.max(0.6, lw * 0.22);
                ctx.stroke();
                ctx.restore();
            }
            // mũi xích phát sáng ở đầu
            if (growT < 1) {
                ctx.globalCompositeOperation = 'lighter';
                const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 16);
                grd.addColorStop(0, 'rgba(255,255,255,0.95)');
                grd.addColorStop(0.4, c.color);
                grd.addColorStop(1, 'rgba(255,200,80,0)');
                ctx.globalAlpha = 1 - growT;
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(bx, by, 16, 0, U.TAU); ctx.fill();
            }
            ctx.restore();
        }
    },

    drawScreen(ctx, W, H) {
        // flash màn hình
        if (this.flashA > 0.01) {
            ctx.save(); ctx.globalAlpha = this.flashA; ctx.fillStyle = this.flashC;
            ctx.fillRect(0, 0, W, H); ctx.restore();
        }
        // viền đỏ khi trúng đòn
        if (this.hurtA > 0.01) {
            const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.72);
            g.addColorStop(0, 'rgba(255,40,40,0)');
            g.addColorStop(1, 'rgba(255,30,30,' + (0.55 * this.hurtA) + ')');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        }
        // slow motion khi dùng chiêu cuối
        if (this.slowT > 0) {
            const a = U.clamp(this.slowT, 0, 0.4) / 0.4;
            ctx.save(); ctx.globalAlpha = 0.85 * a; ctx.fillStyle = '#07070c';
            ctx.fillRect(0, 0, W, 34); ctx.fillRect(0, H - 34, W, 34);
            ctx.globalAlpha = 0.18 * a; ctx.fillStyle = '#7a3cff';
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
        }
    },
};
