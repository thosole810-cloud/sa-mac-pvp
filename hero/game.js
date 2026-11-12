// ============================================================
//  game.js — Vòng lặp chính, HUD, minimap, điều phối trận
// ============================================================
'use strict';

const Game = {
    canvas: null, ctx: null, W: 720, H: 360, DPR: 1,
    state: 'boot',        // load | menu | countdown | playing | paused | over
    mode: 'pvp',          // pvp | training
    fighters: [], monsters: [], projectiles: [], orbs: [],
    player: null,
    time: 0, countdown: 3.2,
    tickCount: 0,
    _spawnT: 0, _bruteT: 42, _waveT: 0,
    bannerT: { text: '', color: '#fff', t: 0, life: 2 },
    feed: [],
    eQueue: [],
    selectedHero: 'binhan',
    selectedForm: 'v1',   // riêng Bình An: v1 = Xạ Thủ, v2 = Xích Vạn Năng
    killRank: 6,
    // ---- PVP ONLINE ----
    online: false, netHost: false, netPayload: null, _ended: false,
    _netT: 0, _monSeq: 0, _netInputT: 0,
    // ---- trang bị trong trận ----
    gold: 0, goldAcc: 0, items: {}, firstBlood: false, _prevState: null, streak: 0,

    playerHeroId() {
        return this.selectedHero === 'binhan' && this.selectedForm === 'v2' ? 'binhan2' : this.selectedHero;
    },

    banner(text, color) {
        this.bannerT = { text, color: color || '#fff', t: 0, life: 1.6 };
    },
    announce(text, color) { this.banner(text, color); },
    addFeed(killer, victim) {
        if (!killer) return;
        this.feed.unshift({
            an: killer.name || (killer.def && killer.def.name) || '?',
            ac: killer.color || (killer.def && killer.def.color) || '#fff',
            vn: victim && (victim.name || (victim.def && victim.def.name)) || '?',
            vc: victim && (victim.color || (victim.def && victim.def.color)) || '#fff',
            t: 0,
        });
        if (this.feed.length > 5) this.feed.pop();
    },

    // hitbox toàn thân: đầu / thân / chân đều nhận đòn (đạn không còn chỉ trúng chân)
    hitBody(en, px, py, pad) {
        if (!en || en.dead) return false;
        pad = pad || 4;
        const h = en.mobH ? en.mobH() : (en.sprH ? en.sprH() : 58);
        const z = en.z || 0;
        const halfW = (en.r || 14) * 1.15 + pad;
        return px > en.x - halfW && px < en.x + halfW &&
               py > en.y - h - z - pad && py < en.y + 10 - z + pad;
    },

    // ---- vàng + trang bị ----
    goldGain(v) {
        this.gold += v;
        this.refreshShopIfOpen();
    },
    itemLevel(key) { return this.items[key] || 0; },
    itemCost(key) {
        const it = ITEMS[key];
        return it.base * (this.itemLevel(key) + 1);
    },
    buyItem(key) {
        const it = ITEMS[key];
        if (!it) return false;
        const lvl = this.itemLevel(key);
        if (lvl >= 3) { this.toast('ĐÃ ĐẠT CẤP TỐI ĐA!', '#ffd166'); return false; }
        const cost = this.itemCost(key);
        if (this.gold < cost) { this.toast('KHÔNG ĐỦ VÀNG!', '#ff5a5a'); return false; }
        this.gold -= cost;
        this.items[key] = lvl + 1;
        if (this.player) {
            it.apply(this.player, lvl + 1, this.player);
            FX.ring(this.player.x, this.player.y - 10, 8, 46, it.color, 0.55, 4);
            FX.burst(this.player.x, this.player.y - 26, 12, it.color, { speed: 160, life: 0.6, glow: true, size: 3 });
        }
        Sfx.pick();
        this.toast(it.name + ' — CẤP ' + (lvl + 1), it.color);
        this.refreshShopIfOpen();
        return true;
    },
    toast(text, color) {
        const el = document.getElementById('shopMsg');
        if (!el) return;
        el.textContent = text;
        el.style.color = color || '#ffe066';
        el.classList.add('show');
        clearTimeout(this._toastT);
        this._toastT = setTimeout(() => el.classList.remove('show'), 1600);
    },
    refreshShopIfOpen() {
        if (typeof updateShopUI === 'function' && this.state === 'shop') updateShopUI();
    },
    openShop() {
        if (this.state !== 'playing' && this.state !== 'countdown') return;
        // Online: không mở shop (dữ liệu trận nằm ở host, tránh lệch trạng thái)
        if (this.mode === 'online' || this.mode === 'online-client') {
            this.banner('TRANG BỊ CHỈ DÙNG Ở CHẾ ĐỘ OFFLINE', '#ffd166');
            return;
        }
        this._prevState = this.state;
        this.state = 'shop';
        document.getElementById('shopModal').classList.remove('hidden');
        updateShopUI();
        Sfx.pick();
    },
    closeShop() {
        if (this.state !== 'shop') return;
        this.state = this._prevState || 'playing';
        this._prevState = null;
        document.getElementById('shopModal').classList.add('hidden');
        Sfx.pick();
    },

    // thông báo hạ gục kiểu Liên Quân
    onKill(victim) {
        const P = this.player;
        if (!P) return;
        this.goldGain(45);
        if (!this.firstBlood) {
            this.firstBlood = true;
            this.banner('🩸 HẠ GỤC ĐẦU TIÊN!', '#ffd166');
        }
        const n = ++this.streak;
        const streak = { 2: 'ĐÔI HẠ GỤC!', 3: 'TAM SÁT!', 4: 'TỨ SÁT!', 5: 'PENTAKILL!' }[n];
        if (streak) {
            this.banner(streak, '#ff5a5a');
            FX.flash('#ff5a5a', 0.18);
            Cam.shake(7);
            FX.ring(P.x, P.y - 10, 10, 130, '#ff5a5a', 0.6, 5);
            FX.burst(P.x, P.y - 30, 20, '#ff8a8a', { speed: 220, life: 0.8, glow: true, size: 3.4 });
        }
        if (victim) FX.text(victim.x, victim.y - 50, '+' + 45 + ' VÀNG', '#ffd166', 14);
    },

    // danh sách mục tiêu mà owner có thể bắn
    enemyTargets(owner) {
        const out = [];
        if (owner.team === 'monster') {
            for (const f of this.fighters) if (!f.dead) out.push(f);
        } else {
            for (const f of this.fighters) if (!f.dead && f !== owner && f.team !== owner.team) out.push(f);
            for (const m of this.monsters) if (!m.dead) out.push(m);
        }
        return out;
    },

    aoeHit(owner, x, y, r, dmg, opts) {
        opts = opts || {};
        let total = 0;
        for (const en of this.enemyTargets(owner)) {
            const d = U.dist(en.x, en.y, x, y);
            if (d < r + en.r) {
                // đẩy lùi theo hướng (dùng vxPush, vx/vy riêng khi có)
                if (opts.vxPush) {
                    const a = U.angleTo(x, y, en.x, en.y);
                    opts.vx = Math.cos(a) * opts.vxPush; opts.vy = Math.sin(a) * opts.vxPush;
                }
                // làm chậm chỉ trong bán kính nhỏ hơn (slowR), không phủ cả vùng chiêu
                let o = opts;
                if (opts.slow && opts.slowR !== undefined && d > opts.slowR + en.r) {
                    o = Object.assign({}, opts);
                    delete o.slow;
                }
                const dealt = dmg * (1 - 0.25 * d / (r + 0.001));
                en.hurt(dealt, owner, o);
                total += dealt;
                FX.ring(en.x, en.y - 10, 4, 22, owner.def ? owner.def.color : '#ffd27a', 0.28, 2.6);
            }
        }
        return total;
    },

    // sát thương xuyên theo một đường thẳng (Quân Q/R, Trường An Q/R)
    lineHit(owner, x, y, ang, range, halfW, dmg, opts) {
        opts = opts || {};
        let total = 0;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        for (const en of this.enemyTargets(owner)) {
            const dx = en.x - x, dy = en.y - y;
            const t = dx * ca + dy * sa;
            if (t < -en.r || t > range + en.r) continue;
            const perp = Math.abs(-dx * sa + dy * ca);
            if (perp > halfW + en.r) continue;
            en.hurt(dmg, owner, Object.assign({ textC: '#fff2b0' }, opts));
            total += dmg;
            if (opts.bleed && en.addDot) en.addDot('bleed', opts.bleed.dps, opts.bleed.dur, owner);
            if (opts.poison && en.addDot) en.addDot('poison', opts.poison.dps, opts.poison.dur, owner);
            if (opts.vuln && en.vulnT !== undefined) {
                en.vulnT = Math.max(en.vulnT, opts.vuln.dur);
                en.vulnAmt = Math.max(en.vulnAmt || 0, opts.vuln.amp);
            }
            FX.ring(en.x, en.y - 12, 4, 26, owner.def ? owner.def.color : '#ffd27a', 0.3, 2.8);
            FX.sparkHit(en.x, en.y - 18, opts.sparkC || '#ffe9b0', 5);
        }
        return total;
    },

    meleeHit(owner, x, y, ang, range, arc, dmg, opts) {
        for (const en of this.enemyTargets(owner)) {
            const d = U.dist(en.x, en.y, x, y);
            if (d < range + en.r) {
                const a = U.angleTo(x, y, en.x, en.y);
                if (Math.abs(U.angDiff(ang, a)) < arc / 2) {
                    en.hurt(dmg, owner, Object.assign({ textC: '#fff2b0' }, opts));
                    FX.ring(en.x, en.y - 12, 3, 16, '#fff2b0', 0.22, 2.4);
                }
            }
        }
    },

    // ---------- khởi động trận ----------
    start(mode) {
        this.mode = mode;
        this.online = false; this.netHost = false; this.netPayload = null;
        this._ended = false; this._netT = 0; this._monSeq = 0;
        this.state = 'countdown';
        this.countdown = 3.2;
        this.time = 0;
        this.fighters = []; this.monsters = []; this.projectiles = []; this.orbs = [];
        this.feed = []; this.eQueue = [];
        FX.clear(); FX.slowT = 0;
        // reset trang bị / vàng / thông báo hạ gục
        this.gold = 0; this.goldAcc = 0; this.items = {}; this.firstBlood = false;
        this.streak = 0;
        this._prevState = null;
        const shopEl = document.getElementById('shopModal');
        if (shopEl) shopEl.classList.add('hidden');
        this.player = null;
        this._hpLag = 0;
        this._spawnT = 0; this._bruteT = 40; this._waveT = 7; this._respawnT = undefined;

        World.init();
        Storm.reset(mode === 'pvp');
        const cx = World.size / 2, cy = World.size / 2;

        // fighter vị quanh tâm
        const spawnRing = [];
        for (let i = 0; i < 6; i++) spawnRing.push({ a: i * U.TAU / 6 + U.rand(-0.2, 0.2), d: U.rand(760, 980) });
        const own = { x: cx + Math.cos(spawnRing[0].a) * spawnRing[0].d, y: cy + Math.sin(spawnRing[0].a) * spawnRing[0].d };

        if (mode === 'pvp') {
            const botHeroes = ['quan', 'nhathuy', 'truongan', 'dat', 'leanh'];
            this.player = this.makeFighter(this.playerHeroId(), own.x, own.y, 0, false);
            this.fighters.push(this.player);
            for (let i = 1; i < 6; i++) {
                const p = spawnRing[i];
                const bid = botHeroes[(i - 1) % botHeroes.length];
                const b = this.makeBot(bid, cx + Math.cos(p.a) * p.d, cy + Math.sin(p.a) * p.d, i);
                this.fighters.push(b);
            }
        } else {
            this.player = this.makeFighter(this.playerHeroId(), cx, cy, 0, false);
            this.fighters.push(this.player);
        }
        for (const f of this.fighters) f.invulnT = 3.5;

        // quái xuất phát
        this.spawnInitial();
        Cam.snap(this.player.x, this.player.y);
        Sfx.count();
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('endScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.body.classList.add('in-match');
    },

    // ============================================================
    //  PVP ONLINE — host mô phỏng, client gửi input/nhận snapshot
    // ============================================================
    buildOnlinePayload() {
        const cx = World.size / 2, cy = World.size / 2;
        let list = (Net.players && Net.players.length)
            ? Net.players.slice(0, 6)
            : [{ id: Net.id || 'host', name: (Net._profile && Net._profile.name) || 'Chủ phòng', hero: this.selectedHero, form: this.selectedForm }];
        const humans = list.map((p, i) => {
            const a = i * U.TAU / 6 + 0.22;
            return {
                id: p.id, name: p.name || ('Người chơi ' + (i + 1)),
                hero: p.hero || 'binhan', form: p.form || 'v1',
                x: Math.round(cx + Math.cos(a) * 860), y: Math.round(cy + Math.sin(a) * 860),
            };
        });
        const botPool = ['quan', 'nhathuy', 'truongan', 'dat', 'leanh', 'khaikiet', 'annie', 'binhan2'];
        const bots = [];
        for (let i = humans.length; i < 6; i++) {
            const a = i * U.TAU / 6 + 0.22;
            bots.push({
                hero: botPool[(i - humans.length) % botPool.length],
                name: BOT_NAMES[i] || ('Bot ' + (i + 1)),
                x: Math.round(cx + Math.cos(a) * 860), y: Math.round(cy + Math.sin(a) * 860),
            });
        }
        return { seed: (Net.seed || 1) >>> 0, players: humans, bots };
    },

    startOnline(payload, isHost) {
        payload = payload || { seed: 1, players: [], bots: [] };
        this.online = true;
        this.netHost = !!isHost;
        this.netPayload = payload;
        this.mode = isHost ? 'online' : 'online-client';
        this.state = isHost ? 'countdown' : 'playing';
        this.countdown = 3.2;
        this.time = 0;
        this.tickCount = 0;
        this._ended = false; this._netT = 0; this._monSeq = 0;
        this._netInputT = 0;
        this._npQ = this._npE = this._npR = false;
        this.fighters = []; this.monsters = []; this.projectiles = []; this.orbs = [];
        this.feed = []; this.eQueue = [];
        FX.clear(); FX.slowT = 0;
        this.gold = 0; this.goldAcc = 0; this.items = {}; this.firstBlood = false;
        this.streak = 0; this._prevState = null;
        this._hpLag = 0;
        this._deadNotice = false;
        this._spawnT = 0; this._bruteT = 42; this._waveT = 7;
        const shopEl = document.getElementById('shopModal');
        if (shopEl) shopEl.classList.add('hidden');
        this.player = null;

        World.init(payload.seed || 1);
        Storm.reset(isHost);
        const humans = payload.players || [];
        this._humanCount = humans.length;
        const myId = Net.id;
        humans.forEach((p, i) => {
            const hid = (p.hero === 'binhan' && p.form === 'v2') ? 'binhan2' : (p.hero || 'binhan');
            const f = this.makeFighter(hid, p.x, p.y, i, false);
            f.netId = p.id;
            f.name = p.name || f.def.name;
            f.isPlayer = (p.id === myId);
            f.isRemote = isHost && (p.id !== myId);
            f.isBot = false;
            f.showName = !f.isPlayer;
            if (!f.isPlayer) f.color = f.def.color;
            this.fighters.push(f);
            if (f.isPlayer) this.player = f;
        });
        (payload.bots || []).forEach((b, i) => {
            const team = humans.length + i;
            const f = this.makeBot(b.hero || 'khaikiet', b.x, b.y, team);
            f.netId = 'bot' + i;
            f.name = b.name || f.name;
            this.fighters.push(f);
        });
        if (!this.player) this.player = this.fighters[0] || null;
        for (const f of this.fighters) f.invulnT = 3.5;

        if (isHost) {
            this.spawnInitial();
            Net.hookFx();
            Net.hookSfx();
            Net.remotes = {};
            Net.takeFx();
            Net.takeSnd();
            this._netT = 0;
        } else {
            Net.snap = null;
        }
        Cam.snap(this.player ? this.player.x : World.size / 2, this.player ? this.player.y : World.size / 2);
        document.body.classList.add('in-match', 'online-match');
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('endScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        Sfx.count();
        if (isHost) this.netTick(0);
    },

    spectateTarget() {
        if (this.player && !this.player.dead) return this.player;
        const human = this.fighters.find(f => !f.dead && f.netId && !String(f.netId).startsWith('bot'));
        if (human) return human;
        return this.fighters.find(f => !f.dead) || this.player || this.monsters[0] || null;
    },

    applyRemoteInput(f, dt) {
        if (!f || f.dead) return;
        const inp = Net.remotes[f.netId];
        const seen = Net.remoteSeen[f.netId] || 0;
        if (!inp || Date.now() - seen > 1500) {
            f.isMoving = false;
            return;
        }
        f.aim = inp.aim;
        f.facing = Math.cos(inp.aim) >= 0 ? 1 : -1;
        if (inp.q) { inp.q = false; f.castQ(inp.aim); }
        if (inp.e) { inp.e = false; f.castE(inp.aim); }
        if (inp.r) { inp.r = false; f.castR(inp.aim); }
        if (inp.atk && !f.dead) f.tryAttack(inp.aim);
        if (inp.mag > 0.04 && !f.dead) f.move(dt, inp.mvx * inp.mag, inp.mvy * inp.mag);
    },

    netTick(dt) {
        if (!this.online || !this.netHost) return;
        this._netT = (this._netT || 0) - dt;
        if (this._netT <= 0) {
            this._netT = 0.05; // 20 Hz
            this.sendSnapshot();
        }
    },

    sendSnapshot() {
        if (!this.online || !this.netHost) return;
        const st = {
            cx: Math.round(Storm.cx), cy: Math.round(Storm.cy), r: Math.round(Storm.r),
            en: Storm.enabled ? 1 : 0, ph: Storm.phase, t: Math.round(Storm.t * 10) / 10,
            sh: Storm.shrinking ? 1 : 0,
        };
        const snap = {
            t: Math.round(this.time * 100) / 100,
            state: this.state, cd: Math.max(0, Math.round(this.countdown * 100) / 100),
            st,
            f: this.fighters.map(f => ({
                id: f.netId, n: f.name, h: f.heroId,
                x: Math.round(f.x), y: Math.round(f.y), z: Math.round((f.z || 0) * 10) / 10,
                hp: Math.max(0, Math.round(f.hp)), mhp: Math.round(f.maxHp),
                aim: Math.round(f.aim * 1000) / 1000, fc: f.facing,
                an: f.animName || 'idle', at: Math.round(f.animT * 100) / 100,
                d: f.dead ? 1 : 0, k: f.killCount || 0, dd: Math.round(f.dmgDealt || 0),
                lv: f.level || 1, xp: Math.round(f.xp || 0),
                cq: Math.max(0, Math.round(f.cdQ * 100) / 100),
                ce: Math.max(0, Math.round(f.cdE * 100) / 100),
                cr: Math.max(0, Math.round(f.cdR * 100) / 100),
                sl: f.slowT > 0 ? 1 : 0, rt: f.rootT > 0 ? 1 : 0, stt: f.stunT > 0 ? 1 : 0,
                ch: f.channelKind || '',
            })),
            m: this.monsters.map(m => ({
                id: m.netId, k: m.kind,
                x: Math.round(m.x), y: Math.round(m.y), z: Math.round((m.z || 0) * 10) / 10,
                hp: Math.max(0, Math.round(m.hp)), mhp: Math.round(m.maxHp),
                fc: m.facing, an: m.animName || 'idle', at: Math.round(m.animT * 100) / 100,
            })),
            p: this.projectiles.slice(0, 80).map(p => ({
                x: Math.round(p.x), y: Math.round(p.y), a: Math.round(p.ang * 100) / 100,
                vx: Math.round(p.vx || 0), vy: Math.round(p.vy || 0),
                c: p.color, dg: p.opts.dagger ? 1 : 0, sl: p.opts.slow ? 1 : 0,
            })),
            feed: this.feed.slice(0, 4).map(s => ({ an: s.an, ac: s.ac, vn: s.vn, vc: s.vc, t: s.t })),
            bn: this.bannerT.t < this.bannerT.life
                ? { text: this.bannerT.text, color: this.bannerT.color, t: this.bannerT.t, life: this.bannerT.life }
                : null,
            fx: Net.takeFx(),
            snd: Net.takeSnd(),
        };
        Net.sendSnapshot(snap);
    },

    onlineEnd(d) {
        if (this.mode !== 'online-client') return;
        this.state = 'over';
        this._ended = true;
        const win = !!(d && d.winnerId && d.winnerId === Net.id);
        const P = this.player;
        document.body.classList.remove('in-match');
        document.getElementById('endScreen').classList.remove('hidden');
        const title = document.getElementById('endTitle');
        title.textContent = win ? '🏆 CHIẾN THẮNG!' : (d && d.winnerName ? '🏆 ' + d.winnerName + ' THẮNG' : 'BẠN ĐÃ BỊ HẠ');
        title.style.color = win ? '#ffd93d' : '#ff5a5a';
        document.getElementById('endStats').innerHTML =
            '<div class="statRow"><span>Chế độ:</span><b>PVP ONLINE · PHÒNG ' + Net.code + '</b></div>' +
            (d && d.winnerName ? '<div class="statRow"><span>Người thắng:</span><b>' + d.winnerName + '</b></div>' : '') +
            '<div class="statRow"><span>Hạ gục:</span><b>' + (P ? P.killCount : 0) + '</b></div>' +
            '<div class="statRow"><span>Sát thương:</span><b>' + (P ? Math.round(P.dmgDealt) : 0) + '</b></div>' +
            '<div class="statRow"><span>Cấp độ:</span><b>' + (P ? P.level : 1) + '</b></div>' +
            '<div class="statRow"><span>Thời gian:</span><b>' + U.fmtTime(this.time) + '</b></div>';
        if (win) Sfx.win(); else Sfx.lose();
    },

    onlineAbort(text) {
        if (!this.online) return;
        this.online = false; this.netHost = false; this.mode = 'pvp'; this.state = 'over';
        this._ended = true;
        document.body.classList.remove('in-match', 'online-match');
        document.getElementById('endScreen').classList.remove('hidden');
        document.getElementById('endTitle').textContent = '⚠️ MẤT KẾT NỐI';
        document.getElementById('endTitle').style.color = '#ff8a4a';
        document.getElementById('endStats').innerHTML =
            '<div class="statRow"><span>Trạng thái:</span><b>' + (text || 'KẾT NỐI ĐÃ ĐÓNG') + '</b></div>' +
            '<div class="statRow"><span>Phòng:</span><b>' + (Net.code || '----') + '</b></div>';
        Net._resetRoom();
    },

    leaveOnlineToMenu() {
        if (this.online) Net.leave();
        this.online = false; this.netHost = false; this.mode = 'pvp'; this.state = 'menu';
        this._ended = true;
        document.body.classList.remove('in-match', 'online-match');
        document.getElementById('endScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('shopModal').classList.add('hidden');
        document.getElementById('menu').classList.remove('hidden');
        Net.hideModal();
    },

    makeFighter(heroId, x, y, team, isBot) {
        const f = new Fighter(heroId, x, y, team, isBot);
        // ánh xạ sprite
        const sheetMap = { binhan: null, binhan2: null, binhminh: 'boxer', khaikiet: 'girl', annie: 'monk' };
        f.sheetKey = sheetMap[heroId] || '';
        f.sheetScale = f.sheetKey ? ({ boxer: 0.30, girl: 0.30, monk: 0.30 })[f.sheetKey] : 0;
        f.isPlayer = !isBot;
        if (f.isPlayer) {
            f.color = f.def.color;
            f.name = f.def.name;
        }
        return f;
    },

    makeBot(heroId, x, y, team) {
        const b = this.makeFighter(heroId, x, y, team, true);
        b.name = BOT_NAMES[team] || 'Bot';
        b.thinkT = U.rand(0, 0.3);
        b.strafeT = 0; b.strafeDir = U.chance(0.5) ? 1 : -1;
        return b;
    },

    // ---------- quái ----------
    spawnMonster(kind, x, y) {
        const m = new Monster(kind, x, y);
        m.netId = 'm' + (this._monSeq = (this._monSeq || 0) + 1);
        if (kind === 'dummy') m.isDummy = true;
        this.monsters.push(m);
        return m;
    },
    spawnInitial() {
        const S = World.size, cx = S / 2, cy = S / 2;
        if (this.mode === 'pvp' || this.mode === 'online') {
            for (let i = 0; i < 15; i++) {
                const a = U.rand(0, U.TAU), r = U.rand(200, 900);
                this.spawnMonster('scorp', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            }
            for (let i = 0; i < 2; i++) {
                const a = U.rand(0, U.TAU), r = U.rand(500, 850);
                this.spawnMonster('brute', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            }
        } else {
            for (let i = 0; i < 6; i++) {
                const a = U.rand(0, U.TAU), r = U.rand(150, 450);
                this.spawnMonster('scorp', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            }
            for (let i = 0; i < 2; i++) {
                const a = U.rand(0, U.TAU), r = U.rand(140, 320);
                this.spawnMonster('dummy', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            }
            this.spawnMonster('brute', cx + 520, cy + 60);
        }
        this._cleanup();
    },
    _cleanup() {
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            const m = this.monsters[i];
            if (m.x < 60 || m.y < 60 || m.x > World.size - 60 || m.y > World.size - 60) {
                m.x = U.clamp(m.x, 80, World.size - 80); m.y = U.clamp(m.y, 80, World.size - 80);
            }
            World.clampEnt(m);
        }
    },

    // ---------- cập nhật ----------
    update(dt) {
        this.tickCount++;
        if (this.mode === 'online-client') { this.updateOnlineClient(dt); return; }
        if (this.state === 'countdown') {
            this.countdown -= dt;
            if (Math.abs(this.countdown - Math.round(this.countdown)) < dt * 0.5) Sfx.count();
            if (this.countdown <= 0) { this.state = 'playing'; Sfx.go(); this.banner('CHIẾN ĐẤU!', '#ffd93d'); if (this.online) Net.remotes = {}; }
        }
        if (this.state !== 'playing') {
            // vẫn để quái/dựng tĩnh nhẹ
            FX.update(dt);
            this.netTick(dt);
            return;
        }
        this.time += dt;
        // thu nhập vàng thụ động (mua trang bị trong trận)
        if (!this.online) this.gold += 2.0 * dt;
        Storm.update(dt);

        // input người chơi
        const P = this.player;
        if (P && !P.dead) {
            // nhắm
            if (Input.isTouch) {
                // gần nhất trong 480px
                let tb = null, bd = 480 * 480;
                for (const en of this.enemyTargets(P)) {
                    const d = U.dist2(P.x, P.y, en.x, en.y);
                    if (d < bd) { bd = d; tb = en; }
                }
                if (tb) P.aim = U.angleTo(P.x, P.y, tb.x, tb.y);
                else {
                    const mv = Input.moveVec();
                    if (mv.mag > 0.1) P.aim = Math.atan2(mv.y, mv.x);
                }
            } else {
                const mw = Cam.screenToWorld(Input.mouse.x, Input.mouse.y);
                P.aim = U.angleTo(P.x, P.y, mw.x, mw.y);
            }
            P.facing = Math.cos(P.aim) >= 0 ? 1 : -1;
            // tương tác
            if (Input.pressed('KeyQ')) P.castQ(P.aim);
            if (Input.pressed('KeyE')) P.castE(P.aim);
            if (Input.pressed('KeyR')) P.castR(P.aim);
            const Bs = Input.btns;
            if (Bs.Q.down) { P.castQ(P.aim); Bs.Q.down = false; Bs.Q.id = -1; }
            if (Bs.E.down) { P.castE(P.aim); Bs.E.down = false; Bs.E.id = -1; }
            if (Bs.R.down) { P.castR(P.aim); Bs.R.down = false; Bs.R.id = -1; }
            if (Input.wantAttack()) P.tryAttack(P.aim);
            const mv = Input.moveVec();
            P.move(dt, mv.x * mv.mag, mv.y * mv.mag);
        }

        // fighters cập nhật
        for (const f of this.fighters) {
            if (f.isRemote) {
                if (!f.dead) this.applyRemoteInput(f, dt);
            } else if (f.isBot) {
                if (!f.dead) BotBrain.think(f, dt);
            }
            f.animT += dt;
            const movingBeforeDash = f.dashT > 0;
            f.update(dt);
            if (!movingBeforeDash && f.dashT > 0) f.dashHitAlong();
            f.updateAnim(dt, f.isMoving || f.dashT > 0);
        }
        // lọc hết hạn eQueue
        for (let i = this.eQueue.length - 1; i >= 0; i--) {
            const e = this.eQueue[i];
            e.t -= dt;
            if (e.t <= 0) { e.fn(); this.eQueue.splice(i, 1); }
        }

        // quái
        for (const m of this.monsters) { m.animT += dt; m.update(dt); }
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            if (this.monsters[i].dead) this.monsters.splice(i, 1);
        }
        // đạn
        for (const p of this.projectiles) p.update(dt);
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            if (this.projectiles[i].dead) this.projectiles.splice(i, 1);
        }

        // bão sát thương ngoài vòng
        if (Storm.enabled) {
            for (const f of this.fighters) {
                if (f.dead) continue;
                if (Storm.outside(f.x, f.y)) {
                    f.hurt(Storm.dps * dt, null, { trueDmg: true, silent: true });
                    if (U.chance(dt * 8)) FX.part(f.x + U.rand(-10, 10), f.y - 6, U.rand(-20, 20), -40, 0.5, 3, '#e8a24a', { glow: true });
                }
            }
            for (const m of this.monsters) {
                if (m.dead) continue;
                if (Storm.outside(m.x, m.y)) m.hp -= Storm.dps * dt;
            }
        }

        // tiết kiệm: quái sống còn ít? spawn bù
        this._spawnT -= dt;
        const aliveMons = this.monsters.length;
        if (this._spawnT <= 0) {
            this._spawnT = 9;
            const cap = (this.mode === 'pvp' || this.mode === 'online') ? 16 : 14;
            if (aliveMons < cap) {
                const a = U.rand(0, U.TAU), r = U.rand(200, Storm.enabled ? Storm.r * 0.8 : 900);
                this.spawnMonster('scorp', Storm.cx + Math.cos(a) * r, Storm.cy + Math.sin(a) * r);
            }
        }
        // quái tinh anh định kỳ
        if (this.mode === 'pvp' || this.mode === 'online') {
            this._bruteT -= dt;
            if (this._bruteT <= 0) {
                this._bruteT = 52;
                const a = U.rand(0, U.TAU), r = U.rand(240, Storm.enabled ? Storm.r * 0.7 : 800);
                this.spawnMonster('brute', Storm.cx + Math.cos(a) * r, Storm.cy + Math.sin(a) * r);
                this.banner('QUÁI TINH ANH XUẤT HIỆN!', '#ff8a3c');
                Sfx.growl();
            }
        } else {
            this._waveT += dt;
            if (this._waveT > 55) {
                this._waveT = 0;
                // chỉ thêm đợt mới khi chưa vượt trần
                if (this.monsters.length < 14) {
                    for (let i = 0; i < 3 && this.monsters.length < 14; i++) {
                        const a = U.rand(0, U.TAU), r = U.rand(150, 420);
                        this.spawnMonster('scorp', World.size / 2 + Math.cos(a) * r, World.size / 2 + Math.sin(a) * r);
                    }
                    this.banner('ĐỢT QUÁI MỚI!', '#ffd93d');
                }
            }
            // dummy chuẩn bị tự hồi sinh khi bị phá
            this._dummyRespT = (this._dummyRespT === undefined ? 5 : this._dummyRespT - dt);
            if (this._dummyRespT <= 0) {
                this._dummyRespT = 16;
                const hasDummy = this.monsters.some(m => m.kind === 'dummy' || (m.isDummy && !m.dead));
                if (!hasDummy) {
                    const a = U.rand(0, U.TAU), r = U.rand(150, 320);
                    this.spawnMonster('dummy', World.size / 2 + Math.cos(a) * r, World.size / 2 + Math.sin(a) * r);
                }
            }
        }

        // thua/thắng
        if (this.mode === 'online') {
            const humans = this.fighters.filter(f => f.netId && !String(f.netId).startsWith('bot'));
            const alive = humans.filter(f => !f.dead);
            if (!this._ended) {
                if ((this._humanCount || 0) >= 2) {
                    if (alive.length <= 1) this.endOnline(alive[0] || null);
                } else if (this.player && this.player.dead) {
                    this.end(false);
                }
            }
            this.killRank = alive.length + 1;
        } else if (this.mode === 'pvp') {
            if (this.player.dead) {
                this.killRank = this.fighters.filter(f => !f.dead).length + 1;
                this.end(false);
            } else {
                const alive = this.fighters.filter(f => !f.dead);
                if (alive.length === 1 && alive[0] === this.player) this.end(true);
            }
        } else if (this.player.dead) {
            // Training: hồi sinh sau 3 giây
            if (this._respawnT === undefined) {
                this._respawnT = 3;
                this.banner('HỒI SINH SAU 3s...', '#9ae06a');
                Sfx.count();
            }
            this._respawnT -= dt;
            if (this._respawnT <= 0) {
                this._respawnT = undefined;
                const P = this.player;
                P.dead = false; P.hp = P.maxHp; P.z = 0; P.vz = 0;
                P.slowT = P.rootT = P.stunT = P.knockT = 0;
                P.cdQ = P.cdE = P.cdR = 0; P.atkCd = 0;
                P.invulnT = 2.5; P.dashT = 0; P.channelKind = ''; P.spinT = 0;
                // điểm hồi sinh: vòng quanh tâm, né chướng ngại
                const a = U.rand(0, U.TAU), r = U.rand(120, 300);
                P.x = World.size / 2 + Math.cos(a) * r; P.y = World.size / 2 + Math.sin(a) * r;
                World.clampEnt(P);
                FX.ring(P.x, P.y, 8, 70, '#9ae06a', 0.6, 5);
                this.banner('TRỞ LẠI TRẬN!', '#9ae06a');
                Sfx.go();
            }
        }

        FX.update(dt);
        const camT = (this.online && this.player && this.player.dead) ? this.spectateTarget() : this.player;
        if (camT) Cam.follow(camT.x, camT.y, dt);
        Cam.update(dt);
        // banner
        if (this.bannerT.t < this.bannerT.life) this.bannerT.t += dt;
        for (const s of this.feed) s.t += dt;
        this.netTick(dt);
    },

    // ============================================================
    //  CLIENT ONLINE — chỉ nội suy snapshot, không mô phỏng
    // ============================================================
    updateOnlineClient(dt) {
        this.sendClientInput(dt);
        const S = Net.snap;
        if (!S) { FX.update(dt); return; }
        this.time = S.t || 0;
        this.state = S.state === 'over' ? 'over' : (S.state || 'playing');
        this.countdown = S.cd || 0;
        if (S.st) {
            Storm.enabled = !!S.st.en;
            Storm.cx = S.st.cx; Storm.cy = S.st.cy; Storm.r = S.st.r;
            Storm.phase = S.st.ph || 0; Storm.t = S.st.t || 0;
            Storm.shrinking = !!S.st.sh;
        }
        // fighters
        for (const sf of (S.f || [])) {
            let f = this.fighters.find(x => x.netId === sf.id);
            if (!f) {
                const hid = sf.h || 'binhan';
                f = this.makeFighter(hid, sf.x, sf.y, this.fighters.length, false);
                f.netId = sf.id;
                this.fighters.push(f);
            }
            if (f._tx === undefined) { f.x = sf.x; f.y = sf.y; }
            f._tx = sf.x; f._ty = sf.y;
            f.name = sf.n || f.name;
            f.hp = sf.hp; f.maxHp = sf.mhp;
            f.aim = sf.aim; f.facing = sf.fc;
            f.dead = !!sf.d; f.z = sf.z;
            f.animName = sf.an; f.animT = sf.at;
            f.killCount = sf.k; f.dmgDealt = sf.dd;
            f.level = sf.lv; f.xp = sf.xp;
            f.cdQ = sf.cq; f.cdE = sf.ce; f.cdR = sf.cr;
            f.slowT = sf.sl ? 0.5 : 0; f.rootT = sf.rt ? 0.5 : 0; f.stunT = sf.stt ? 0.5 : 0;
            f.channelKind = sf.ch || '';
            f.isPlayer = (sf.id === Net.id);
            f.showName = !f.isPlayer;
            if (f.isPlayer) this.player = f;
            f.t += dt;
        }
        // monsters
        const seenM = {};
        for (const sm of (S.m || [])) {
            let m = this.monsters.find(x => x.netId === sm.id);
            if (!m) {
                m = new Monster(sm.k, sm.x, sm.y);
                m.netId = sm.id;
                this.monsters.push(m);
            }
            if (m._tx === undefined) { m.x = sm.x; m.y = sm.y; }
            m._tx = sm.x; m._ty = sm.y;
            m.hp = sm.hp; m.maxHp = sm.mhp; m.facing = sm.fc;
            m.animName = sm.an; m.animT = sm.at; m.z = sm.z;
            seenM[sm.id] = true;
        }
        this.monsters = this.monsters.filter(m => seenM[m.netId]);
        // đạn (chỉ vẽ)
        this.projectiles = (S.p || []).map(sp => {
            const pr = new Proj(sp.x, sp.y, sp.a, 0, 0, sp.c, 1, null, {
                dagger: !!sp.dg, slow: sp.sl ? { amp: 0.4, dur: 0.5 } : undefined,
            });
            pr.vx = sp.vx; pr.vy = sp.vy;
            return pr;
        });
        // feed + banner + VFX host gửi kèm
        this.feed = (S.feed || []).map(s => Object.assign({}, s));
        if (S.bn) this.bannerT = { text: S.bn.text, color: S.bn.color, t: S.bn.t, life: S.bn.life };
        for (const ev of (S.fx || [])) {
            const fn = FX[ev.k];
            if (typeof fn === 'function') { try { fn.apply(FX, ev.a); } catch (e) { } }
        }
        for (const sname of (S.snd || [])) {
            const fn = Sfx[sname];
            if (typeof fn === 'function') { try { fn.call(Sfx); } catch (e) { } }
        }
        // nội suy vị trí
        for (const f of this.fighters) {
            if (f._tx === undefined) continue;
            const k = Math.min(1, dt * 14);
            f.x += (f._tx - f.x) * k; f.y += (f._ty - f.y) * k;
            f.isMoving = U.dist(f.x, f.y, f._tx, f._ty) > 2;
        }
        for (const m of this.monsters) {
            if (m._tx === undefined) continue;
            const k = Math.min(1, dt * 14);
            m.x += (m._tx - m.x) * k; m.y += (m._ty - m.y) * k;
            m.isMoving = U.dist(m.x, m.y, m._tx, m._ty) > 2;
        }
        if (this.bannerT.t < this.bannerT.life) this.bannerT.t += dt;
        if (this.player && this.player.dead && !this._deadNotice) {
            this._deadNotice = true;
            this.banner('BẠN ĐÃ BỊ HẠ — ĐANG XEM TRẬN', '#ff7a7a');
        }
        const camT = (this.player && !this.player.dead) ? this.player : this.spectateTarget();
        if (camT) Cam.follow(camT.x, camT.y, dt);
        Cam.update(dt);
        FX.update(dt);
    },

    sendClientInput(dt) {
        // gom phím kỹ năng mỗi frame — tránh mất phím giữa 2 lần gửi 30Hz
        if (Input.pressed('KeyQ')) this._npQ = true;
        if (Input.pressed('KeyE')) this._npE = true;
        if (Input.pressed('KeyR')) this._npR = true;
        const Bs0 = Input.btns;
        if (Bs0.Q.down) { this._npQ = true; Bs0.Q.down = false; Bs0.Q.id = -1; }
        if (Bs0.E.down) { this._npE = true; Bs0.E.down = false; Bs0.E.id = -1; }
        if (Bs0.R.down) { this._npR = true; Bs0.R.down = false; Bs0.R.id = -1; }

        this._netInputT = (this._netInputT || 0) + dt;
        if (this._netInputT < 1 / 30) return;
        this._netInputT = 0;
        const P = this.player;
        let aim = P ? P.aim : 0;
        if (P && !P.dead) {
            if (Input.isTouch) {
                let tb = null, bd = 520 * 520;
                for (const en of this.fighters) {
                    if (en === P || en.dead) continue;
                    const d = U.dist2(P.x, P.y, en.x, en.y);
                    if (d < bd) { bd = d; tb = en; }
                }
                for (const m of this.monsters) {
                    if (m.dead) continue;
                    const d = U.dist2(P.x, P.y, m.x, m.y);
                    if (d < bd) { bd = d; tb = m; }
                }
                if (tb) aim = U.angleTo(P.x, P.y, tb.x, tb.y);
                else {
                    const mv = Input.moveVec();
                    if (mv.mag > 0.1) aim = Math.atan2(mv.y, mv.x);
                }
            } else {
                const mw = Cam.screenToWorld(Input.mouse.x, Input.mouse.y);
                aim = U.angleTo(P.x, P.y, mw.x, mw.y);
            }
        }
        const q = !!this._npQ, e = !!this._npE, r = !!this._npR;
        this._npQ = this._npE = this._npR = false;
        const mv = Input.moveVec();
        Net.sendInput({
            mvx: Math.round(mv.x * 100) / 100,
            mvy: Math.round(mv.y * 100) / 100,
            mag: Math.round(mv.mag * 100) / 100,
            aim: Math.round(aim * 1000) / 1000,
            atk: Input.wantAttack() ? 1 : 0,
            q: q ? 1 : 0, e: e ? 1 : 0, r: r ? 1 : 0,
        });
    },

    endOnline(winnerF) {
        if (this._ended) return;
        const wid = winnerF ? winnerF.netId : null;
        const wname = winnerF ? winnerF.name : null;
        this.killRank = winnerF && winnerF === this.player ? 1 : 2;
        this.end(!!(winnerF && wid === Net.id), wname, wid);
    },

    end(win, winnerName, winnerId) {
        if (this.state === 'over' && this._ended) return;
        this._ended = true;
        this.state = 'over';
        document.body.classList.remove('in-match', 'online-match');
        const P = this.player;
        if (this.online && this.netHost) {
            const wid = winnerId !== undefined ? winnerId : (win ? Net.id : null);
            const wname = winnerName !== undefined ? winnerName : (win && P ? P.name : null);
            Net.sendEnd({ winnerId: wid, winnerName: wname, time: Math.round(this.time) });
        }
        document.getElementById('endScreen').classList.remove('hidden');
        document.getElementById('endTitle').textContent = win ? '🏆 CHIẾN THẮNG!' : 'BẠN ĐÃ BỊ HẠ';
        document.getElementById('endTitle').style.color = win ? '#ffd93d' : '#ff5a5a';
        const winnerRow = (!win && winnerName)
            ? '<div class="statRow"><span>Người thắng:</span><b>' + winnerName + '</b></div>' : '';
        document.getElementById('endStats').innerHTML =
            '<div class="statRow"><span>Hạng:</span><b>' + (win ? '#' + killRankTop() : '#' + this.killRank) + '</b></div>' +
            winnerRow +
            '<div class="statRow"><span>Hạ gục:</span><b>' + P.killCount + '</b></div>' +
            '<div class="statRow"><span>Sát thương:</span><b>' + Math.round(P.dmgDealt) + '</b></div>' +
            '<div class="statRow"><span>Cấp độ:</span><b>' + P.level + '</b></div>' +
            '<div class="statRow"><span>Thời gian sống:</span><b>' + U.fmtTime(this.time) + '</b></div>';
        if (win) Sfx.win(); else Sfx.lose();
    },
};

function killRankTop() { return 1; }

// thanh chỉ số lớp trên thẻ tướng: ST (sát thương) / HP (độ trâu) / CĐ (cơ động)
function heroStatBar(d) {
    const atk = Math.round(U.clamp((d.atk ? d.atk.dmg : 10) / 17 * 100, 15, 100));
    const hp = Math.round(U.clamp((d.maxHp || 100) / 155 * 100, 15, 100));
    const mob = Math.round(U.clamp(((d.speed || 240) - 195) / 105 * 100, 15, 100));
    const bar = (cls, label, val, color) =>
        '<span class="hs ' + cls + '" title="' + label + '"><b>' + label + '</b>' +
        '<i><em style="width:' + val + '%;background:' + color + '"></em></i></span>';
    return bar('st', 'ST', atk, '#ff8a8a') + bar('hp', 'HP', hp, '#7dffb0') + bar('mob', 'CĐ', mob, '#9ad0ff');
}

// ============================================================
//  SHOP — cửa hàng trang bị trong trận
// ============================================================
function buildShopUI() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const key of ITEM_ORDER) {
        const it = ITEMS[key];
        const card = document.createElement('div');
        card.className = 'shopCard';
        card.dataset.item = key;
        card.innerHTML =
            '<div class="scIcon" style="color:' + it.color + '">' + it.icon + '</div>' +
            '<div class="scInfo"><div class="scName" style="color:' + it.color + '">' + it.name + '</div>' +
            '<div class="scDesc">' + it.desc + '</div><div class="scLv" data-lv></div></div>' +
            '<button class="scBuy" data-buy>MUA</button>';
        card.querySelector('[data-buy]').addEventListener('click', () => Game.buyItem(key));
        grid.appendChild(card);
    }
}

function updateShopUI() {
    const goldEl = document.getElementById('shopGold');
    if (goldEl) goldEl.textContent = '🪙 ' + Math.floor(Game.gold) + ' VÀNG';
    for (const card of document.querySelectorAll('.shopCard')) {
        const key = card.dataset.item;
        const it = ITEMS[key];
        const lv = Game.itemLevel(key);
        const cost = it.base * (lv + 1);
        const lvEl = card.querySelector('[data-lv]');
        lvEl.innerHTML = 'CẤP ' + lv + '/3' + (lv ? ' <span class="pips">' + '●'.repeat(lv) + '○'.repeat(3 - lv) + '</span>' : '');
        const btn = card.querySelector('[data-buy]');
        if (lv >= 3) {
            btn.textContent = 'TỐI ĐA';
            btn.disabled = true;
            card.classList.add('maxed');
        } else {
            btn.textContent = '🪙 ' + cost;
            btn.disabled = Game.gold < cost;
            card.classList.remove('maxed');
        }
    }
}

// ============================================================
//  RENDER
// ============================================================
function render(dt) {
    const ctx = Game.ctx;
    ctx.setTransform(Game.DPR, 0, 0, Game.DPR, 0, 0);
    ctx.clearRect(0, 0, Game.W, Game.H);
    // nền
    ctx.fillStyle = '#141210';
    ctx.fillRect(0, 0, Game.W, Game.H);

    if (Game.state === 'menu' || Game.state === 'load') { renderMenuBg(); return; }

    const z = Cam.zoomNow();
    const view = {
        x0: Cam.x - Game.W / 2 / z - 80, x1: Cam.x + Game.W / 2 / z + 80,
        y0: Cam.y - Game.H / 2 / z - 100, y1: Cam.y + Game.H / 2 / z + 100,
    };

    ctx.save();
    Cam.apply(ctx);
    World.drawGround(ctx, view);
    World.drawProps(ctx, view, Game.time);
    FX.drawDecals(ctx);
    FX.drawAmbient(ctx, view, Game.time);

    // thực thể: quái + fighters theo y
    const ents = [];
    for (const m of Game.monsters) if (m.x > view.x0 && m.x < view.x1 && m.y > view.y0 - 60 && m.y < view.y1 + 60) ents.push(m);
    for (const f of Game.fighters) if (!f.dead && f.x > view.x0 && f.x < view.x1 && f.y > view.y0 - 60 && f.y < view.y1 + 60) ents.push(f);
    for (const f of Game.fighters) if (f.dead) ents.push(f); // hồn mờ?
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) e.draw(ctx);

    for (const p of Game.projectiles) {
        if (p.x > view.x0 && p.x < view.x1 && p.y > view.y0 && p.y < view.y1) p.draw(ctx);
    }
    // vòng chỉ đạo bão trong world
    Storm.draw(ctx, view);
    Storm.drawWind(ctx, view, Game.time);
    FX.drawWorld(ctx);
    ctx.restore();

    // hiệu ứng màn hình
    FX.drawScreen(ctx, Game.W, Game.H);
    drawHUD(ctx, dt);
}
function renderMenuBg() {
    // hậu cảnh menu: sa mạc đêm, mặt trời lặn, đụn cát và bụi vàng
    const ctx = Game.ctx, W = Game.W, H = Game.H, t = performance.now() / 1000;
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#120d08'); gr.addColorStop(0.45, '#2a1c0e'); gr.addColorStop(1, '#3a2712');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    // mặt trời lặn
    const sx = W * 0.5, sy = H * 0.34;
    const sun = ctx.createRadialGradient(sx, sy, 10, sx, sy, H * 0.42);
    sun.addColorStop(0, 'rgba(255,214,120,0.5)');
    sun.addColorStop(0.25, 'rgba(255,150,60,0.18)');
    sun.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,225,150,0.85)';
    ctx.beginPath(); ctx.arc(sx, sy, H * 0.055, 0, U.TAU); ctx.fill();
    // đụn cát xa + gần
    for (let layer = 0; layer < 2; layer++) {
        const base = H * (0.68 + layer * 0.14);
        const amp = 26 - layer * 8;
        ctx.fillStyle = layer ? 'rgba(28,18,8,0.95)' : 'rgba(66,42,18,0.75)';
        ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 24) {
            const y = base + Math.sin(x * 0.004 + layer * 2.1 + t * 0.06) * amp + Math.sin(x * 0.011 + layer) * 8;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    }
    // bụi vàng bay
    for (let i = 0; i < 70; i++) {
        const x = (i * 137.5 + t * (10 + (i % 4) * 6)) % W;
        const y = (i * 89.7 + Math.sin(t * 0.9 + i) * 34) % H;
        ctx.globalAlpha = 0.1 + 0.12 * Math.sin(t * 2 + i);
        ctx.fillStyle = i % 3 ? '#ffd27a' : '#ffe9b8';
        ctx.fillRect(x, y, 2, 2);
    }
    // tia sáng rune mờ giữa màn hình
    ctx.globalAlpha = 0.05 + 0.02 * Math.sin(t * 1.3);
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 12; i++) {
        const a = i / 12 * U.TAU + t * 0.05;
        ctx.beginPath(); ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(a) * W * 0.7, sy + Math.sin(a) * W * 0.7);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

// ============================================================
//  HUD
// ============================================================
function drawHUD(ctx, dt) {
    const W = Game.W, H = Game.H, P = Game.player;
    const uiS = U.clamp(H / 780, 0.82, 1.25);

    // ---- đồng hồ bão & bố cục trên ----
    ctx.save();
    ctx.font = '700 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, W / 2 - 118, 10, 236, 44, 10); ctx.fill();
    ctx.fillStyle = '#ffd27a';
    const lbl = Storm.label();
    ctx.fillText(lbl, W / 2, 30);
    ctx.font = '600 12px system-ui'; ctx.fillStyle = '#cfe9ff';
    const onlineMode = Game.mode === 'online' || Game.mode === 'online-client';
    const survivalMax = (Game.mode === 'pvp' || onlineMode) ? '/6' : '';
    ctx.fillText('Còn sống: ' + Game.fighters.filter(f => !f.dead).length + survivalMax + '   •   ' + U.fmtTime(Game.time), W / 2, 47);

    if (Game.mode === 'training') {
        ctx.fillStyle = '#9ae06a';
        ctx.fillText('TRAINING — bấm ESC để về menu', W / 2, 70);
    } else if (onlineMode) {
        ctx.fillStyle = '#7fe3ff';
        ctx.fillText('🌐 ONLINE · PHÒNG ' + (Net.code || '----') + ' · ' + Net.latency + 'ms' +
            (Game.player && Game.player.dead ? ' · ĐANG XEM TRẬN' : ''), W / 2, 70);
    }

    // ---- banner lớn giữa (nâng cấp điện ảnh) ----
    const bt = Game.bannerT;
    if (bt.t < bt.life) {
        const pp = bt.t / bt.life;
        const a = pp < 0.12 ? pp / 0.12 : (pp > 0.72 ? (1 - pp) / 0.28 : 1);
        const pop = pp < 0.16 ? 0.86 + (pp / 0.16) * 0.18 : 1.02 - Math.min(0.02, (pp - 0.16));
        ctx.save();
        ctx.translate(W / 2, H * 0.3);
        ctx.scale(pop, pop);
        ctx.globalAlpha = U.clamp(a, 0, 1);
        // tia sáng sau chữ
        ctx.globalCompositeOperation = 'lighter';
        const g0 = ctx.createRadialGradient(0, 0, 4, 0, 0, 300 * uiS);
        const bc0 = /^#[0-9a-fA-F]{6}$/.test(bt.color) ? bt.color : (/^#[0-9a-fA-F]{3}$/.test(bt.color) ? '#' + bt.color[1] + bt.color[1] + bt.color[2] + bt.color[2] + bt.color[3] + bt.color[3] : '#ffd166');
        g0.addColorStop(0, bc0 + '55');
        g0.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g0;
        ctx.fillRect(-320, -110, 640, 220);
        ctx.globalCompositeOperation = 'source-over';
        // đường kẻ hai bên
        const lw2 = 130 * Math.min(1, pp * 3);
        const grad = ctx.createLinearGradient(-lw2 - 60, 0, -60, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, bt.color);
        ctx.fillStyle = grad; ctx.fillRect(-lw2 - 66, 6, lw2, 2);
        ctx.fillRect(66, 6, lw2, 2);
        // chữ
        ctx.font = '900 ' + Math.round(34 * uiS) + 'px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(20,12,4,0.85)';
        ctx.strokeText(bt.text, 0, 0);
        const tg = ctx.createLinearGradient(0, -20, 0, 20);
        tg.addColorStop(0, '#ffffff');
        tg.addColorStop(0.55, bt.color);
        tg.addColorStop(1, '#ffb347');
        ctx.shadowColor = bt.color; ctx.shadowBlur = 26;
        ctx.fillStyle = tg;
        ctx.fillText(bt.text, 0, 0);
        ctx.restore();
    }
    // đếm ngược
    if (Game.state === 'countdown') {
        const n = Math.ceil(Game.countdown);
        ctx.font = '900 ' + Math.round(90 * uiS) + 'px system-ui';
        ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(20,12,4,0.9)';
        const txt = n > 0 ? String(n) : 'CHIẾN ĐẤU!';
        ctx.strokeText(txt, W / 2, H / 2);
        ctx.fillStyle = '#ffd93d';
        ctx.fillText(txt, W / 2, H / 2);
    }

    // ---- kill feed (trái) — kiểu Liên Quân ----
    ctx.textAlign = 'left';
    let fy = 22;
    ctx.font = '700 11px system-ui';
    for (const s of Game.feed) {
        if (s.t > 5) continue;
        ctx.globalAlpha = U.clamp(1 - (s.t - 4) / 1, 0, 1) * 0.95;
        ctx.fillStyle = 'rgba(8,10,14,0.62)';
        roundRect(ctx, 12, fy - 12, 252, 18, 5); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        roundRect(ctx, 12, fy - 12, 4, 18, 2); ctx.fill();
        ctx.fillStyle = '#ff7a7a';
        ctx.fillText('☠', 19, fy);
        ctx.fillStyle = s.ac; ctx.fillText(s.an, 33, fy);
        let aw = ctx.measureText(s.an).width;
        ctx.fillStyle = '#d9c9a8'; ctx.fillText(' hạ ', 33 + aw, fy);
        const hw = ctx.measureText(' hạ ').width;
        ctx.fillStyle = s.vc; ctx.fillText(s.vn, 33 + aw + hw, fy);
        fy += 20;
    }
    ctx.globalAlpha = 1;

    // ---- thanh trang bị + vàng (trên panel) ----
    const px = 14, py = H - 86 * uiS;
    if (P && !Game.online) {
        const keys = ITEM_ORDER;
        const sz = 21 * uiS;
        const iy = H - 114 * uiS;
        for (let i = 0; i < keys.length; i++) {
            const it = ITEMS[keys[i]];
            const lv = Game.itemLevel(keys[i]);
            const ix = px + i * (sz + 4);
            ctx.fillStyle = lv ? 'rgba(20,18,14,0.82)' : 'rgba(20,18,14,0.42)';
            roundRect(ctx, ix, iy, sz, sz, 5); ctx.fill();
            ctx.strokeStyle = lv ? it.color : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = lv ? 1.6 : 1;
            roundRect(ctx, ix, iy, sz, sz, 5); ctx.stroke();
            ctx.globalAlpha = lv ? 1 : 0.35;
            ctx.font = Math.round(sz * 0.62) + 'px system-ui';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText(it.icon, ix + sz / 2, iy + sz * 0.68);
            ctx.globalAlpha = 1;
            if (lv) {
                for (let d = 0; d < lv; d++) {
                    ctx.fillStyle = it.color;
                    ctx.beginPath(); ctx.arc(ix + 4 + d * 4.6, iy + sz - 3.4, 1.5, 0, U.TAU); ctx.fill();
                }
            }
        }
        // vàng
        const gx = px + keys.length * (sz + 4) + 8;
        ctx.font = '800 ' + Math.round(12 * uiS) + 'px system-ui';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        roundRect(ctx, gx, iy + 4 * uiS, 72 * uiS, 18 * uiS, 8); ctx.fill();
        ctx.fillStyle = '#ffd166';
        ctx.fillText('🪙 ' + Math.floor(Game.gold), gx + 7, iy + 16.5 * uiS);
    }

    // ---- panel nhân vật (trái dưới) ----
    ctx.fillStyle = 'rgba(10,10,14,0.62)';
    roundRect(ctx, px, py, 216 * uiS, 74 * uiS, 12); ctx.fill();
    // vòng cấp độ
    const lvlR = 20 * uiS;
    ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(px + 30 * uiS, py + 30 * uiS, lvlR, 0, U.TAU); ctx.stroke();
    ctx.fillStyle = '#ffe066'; ctx.font = '800 ' + Math.round(16 * uiS) + 'px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(P.level, px + 30 * uiS, py + 36 * uiS);
    ctx.textAlign = 'left';
    // tên
    ctx.font = '700 ' + Math.round(14 * uiS) + 'px system-ui';
    ctx.fillStyle = P.def.color;
    ctx.fillText(P.def.name, px + 58 * uiS, py + 22 * uiS);
    ctx.font = '600 ' + Math.round(10.5 * uiS) + 'px system-ui';
    ctx.fillStyle = '#9fb3c8';
    const roleTxt = (P.def.className && P.def.className !== P.def.role) ? P.def.className + ' · ' + P.def.role : P.def.role;
    ctx.fillText(roleTxt + ' • ' + P.killCount + ' hạ', px + 58 * uiS, py + 38 * uiS);
    // HP (thanh máu + vệt tụt máu)
    const hbW = 190 * uiS, hbX = px + 22 * uiS, hbY = py + 47 * uiS;
    Game._hpLag = Math.max(P.hp, (Game._hpLag === undefined || Game._hpLag <= 0 ? P.hp : Game._hpLag) - dt * P.maxHp * 0.55);
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    roundRect(ctx, hbX, hbY, hbW, 10, 5); ctx.fill();
    // vệt máu tụt chậm
    const lagW = hbW * U.clamp(Game._hpLag / P.maxHp, 0, 1);
    if (lagW > hbW * U.clamp(P.hp / P.maxHp, 0, 1)) {
        ctx.fillStyle = 'rgba(255,120,90,0.55)';
        roundRect(ctx, hbX, hbY, lagW, 10, 5); ctx.fill();
    }
    const hg = ctx.createLinearGradient(hbX, 0, hbX + hbW, 0);
    hg.addColorStop(0, '#2fbf63'); hg.addColorStop(0.6, '#58e07a'); hg.addColorStop(1, '#b6ff8e');
    ctx.fillStyle = hg;
    roundRect(ctx, hbX, hbY, hbW * U.clamp(P.hp / P.maxHp, 0, 1), 10, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, hbX + 2, hbY + 1.5, hbW * U.clamp(P.hp / P.maxHp, 0, 1) - 4, 3, 2); ctx.fill();
    ctx.font = '700 10px system-ui'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    ctx.fillText(Math.ceil(P.hp) + '/' + P.maxHp, hbX + 4, hbY + 9);
    // XP (có vệt sáng chạy)
    const need = xpNeed(P.level);
    const xf = U.clamp(P.xp / need, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    roundRect(ctx, hbX, hbY + 13, hbW, 5, 3); ctx.fill();
    const xg = ctx.createLinearGradient(hbX, 0, hbX + hbW, 0);
    xg.addColorStop(0, '#7a3fd0'); xg.addColorStop(0.7, '#b06bff'); xg.addColorStop(1, '#e0b6ff');
    ctx.fillStyle = xg;
    roundRect(ctx, hbX, hbY + 13, hbW * xf, 5, 3); ctx.fill();
    const shine = ((performance.now() / 1000 * 0.5) % 1) * hbW;
    if (xf > 0.03 && shine < hbW * xf) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(hbX + shine - 6, hbY + 13, 6, 5);
    }

    ctx.restore();

    // ---- nút kỹ năng (phải dưới) ----
    drawSkillBtn(ctx, P, Input.btns.Q, 'Q', P.cdQ, P.def.skills.Q.cd, '#67d0ff', false);
    drawSkillBtn(ctx, P, Input.btns.E, 'E', P.cdE, P.def.skills.E.cd, '#ffd27a', false);
    drawSkillBtn(ctx, P, Input.btns.R, 'R', P.cdR, P.def.skills.R.cd, '#ff7a7a', true);
    drawAtkBtn(ctx, Input.btns.atk);

    // ---- COMBO counter ----
    if (FX.comboN >= 2 && FX.comboT > 0) {
        const fade = U.clamp(FX.comboT / 0.45, 0, 1);
        const pop = 1 + U.clamp((FX.comboT - 1.45) * 2.4, 0, 0.5);
        ctx.save();
        ctx.translate(W / 2 + 96 * uiS, H * 0.58);
        ctx.scale(pop, pop);
        ctx.globalAlpha = fade;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '900 ' + Math.round(34 * uiS) + 'px system-ui';
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(30,16,4,0.85)';
        ctx.strokeText(FX.comboN + '', 0, 0);
        const cg = ctx.createLinearGradient(0, -22, 0, 22);
        cg.addColorStop(0, '#fffbe8'); cg.addColorStop(0.55, '#ffd166'); cg.addColorStop(1, '#ff8a3c');
        ctx.shadowColor = '#ffb347'; ctx.shadowBlur = 18;
        ctx.fillStyle = cg;
        ctx.fillText(FX.comboN + '', 0, 0);
        ctx.shadowBlur = 0;
        ctx.font = '800 ' + Math.round(11 * uiS) + 'px system-ui';
        ctx.fillStyle = '#ffe9b8';
        ctx.fillText('COMBO', 0, 26 * uiS);
        ctx.restore();
    }

    // ---- minimap ----
    drawMinimap(ctx, W, H);

    // ---- joystick + hướng nhắm ----
    if (Input.stick.active) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(Input.stick.ox, Input.stick.oy, 56, 0, U.TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.beginPath(); ctx.arc(Input.stick.ox + Input.stick.x * 46, Input.stick.oy + Input.stick.y * 46, 22, 0, U.TAU); ctx.fill();
        ctx.restore();
    }
    // tex hướng nhắm
    if (P && !P.dead && P.channelKind !== 'minigun') {
        const z = Cam.zoomNow();
        const sx = W / 2 + (P.x - Cam.x) * z, sy = H / 2 + (P.y - Cam.y) * z;
        ctx.save();
        ctx.translate(sx, sy); ctx.rotate(P.aim);
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#ffe066';
        ctx.beginPath();
        ctx.moveTo(46, 0); ctx.lineTo(30, -5); ctx.lineTo(30, 5);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }
}

function drawSkillBtn(ctx, P, b, key, cdLeft, cdMax, color, isUlt) {
    const r = b.r;
    const ready = cdLeft <= 0.02;
    ctx.save();
    // quầng ngoài khi sẵn sàng
    if (ready) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300 + b.x);
        ctx.globalAlpha = (isUlt ? 0.34 : 0.18) * (0.6 + pulse * 0.6);
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(b.x, b.y, r + (isUlt ? 7 : 4), 0, U.TAU); ctx.fill();
        ctx.globalAlpha = 1;
    }
    // nền vát gradient
    const bg = ctx.createRadialGradient(b.x - r * 0.3, b.y - r * 0.35, r * 0.15, b.x, b.y, r);
    if (ready) { bg.addColorStop(0, 'rgba(60,66,86,0.95)'); bg.addColorStop(1, 'rgba(16,18,26,0.95)'); }
    else { bg.addColorStop(0, 'rgba(30,32,42,0.9)'); bg.addColorStop(1, 'rgba(10,10,16,0.92)'); }
    ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, U.TAU);
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = ready ? color : 'rgba(120,130,150,0.35)';
    ctx.lineWidth = ready ? 2.4 : 1.6;
    ctx.stroke();
    // vòng trong trang trí
    ctx.globalAlpha = ready ? 0.5 : 0.2;
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(b.x, b.y, r - 4, 0, U.TAU); ctx.stroke();
    ctx.globalAlpha = 1;
    // icon chữ
    ctx.fillStyle = ready ? color : 'rgba(190,200,215,0.55)';
    ctx.font = '900 ' + Math.round(r * 0.74) + 'px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(key, b.x, b.y + 0.5);
    // vòng cooldown (dạng cung)
    if (!ready) {
        const frac = U.clamp(cdLeft / cdMax, 0, 1);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.arc(b.x, b.y, r, -Math.PI / 2, -Math.PI / 2 + U.TAU * frac, false);
        ctx.closePath();
        ctx.fillStyle = 'rgba(10,10,16,0.62)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r - 1.5, -Math.PI / 2, -Math.PI / 2 + U.TAU * (1 - frac), false);
        ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.round(r * 0.72) + 'px system-ui';
        ctx.fillText(Math.ceil(cdLeft), b.x, b.y);
    }
    // nhãn trên
    ctx.font = '800 ' + Math.round(r * 0.33) + 'px system-ui';
    ctx.fillStyle = isUlt && ready ? '#ffe066' : 'rgba(255,255,255,0.72)';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(isUlt ? 'ULT' : key, b.x, b.y - r - 6);
    ctx.restore();
}

function drawAtkBtn(ctx, b) {
    ctx.save();
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, U.TAU);
    ctx.fillStyle = 'rgba(24,28,38,0.8)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.stroke();
    // biểu tượng xuyên tâm
    ctx.translate(b.x, b.y);
    ctx.fillStyle = '#ffd27a';
    for (let i = 0; i < 8; i++) {
        const a = i / 8 * U.TAU + performance.now() / 3000;
        ctx.rotate(a * 0 + U.TAU / 8);
        ctx.fillRect(b.r * 0.42, -1.8, b.r * 0.3, 3.6);
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, U.TAU); ctx.fill();
    ctx.restore();
}

function drawMinimap(ctx, W, H) {
    const s = 132, mx = W - s - 12, my = 12, k = s / World.size;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(170,130,80,0.9)';
    roundRect(ctx, mx, my, s, s, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,160,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    // cát chướng nhỏ
    ctx.fillStyle = 'rgba(90,66,38,0.8)';
    for (const o of World.solids) {
        if (o.kind !== 'rock') continue;
        ctx.fillRect(mx + o.x * k, my + o.y * k, 2, 2);
    }
    // bão
    if (Storm.enabled) {
        ctx.strokeStyle = '#ff9a3c'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(mx + Storm.cx * k, my + Storm.cy * k, Storm.r * k, 0, U.TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(140,60,20,0.35)';
        ctx.beginPath();
        ctx.rect(mx, my, s, s);
        ctx.arc(mx + Storm.cx * k, my + Storm.cy * k, Storm.r * k, 0, U.TAU, true);
        ctx.fill('evenodd');
    }
    // quái
    ctx.fillStyle = '#8de03a';
    for (const m of Game.monsters) ctx.fillRect(mx + m.x * k - 1, my + m.y * k - 1, 2.4, 2.4);
    // fighters
    for (const f of Game.fighters) {
        if (f.dead) continue;
        const isP = f === Game.player;
        ctx.fillStyle = isP ? '#ffffff' : '#ff4d4d';
        ctx.beginPath(); ctx.arc(mx + f.x * k, my + f.y * k, isP ? 3.4 : 2.8, 0, U.TAU); ctx.fill();
        if (isP) { ctx.strokeStyle = '#ffd93d'; ctx.lineWidth = 1.4; ctx.stroke(); }
    }
    ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// ============================================================
//  BOOT
// ============================================================
(function boot() {
    const canvas = document.getElementById('game');
    Game.canvas = canvas;
    Game.ctx = canvas.getContext('2d');
    const ctx = Game.ctx;

    function resize() {
        Game.DPR = Math.min(2, window.devicePixelRatio || 1);
        Game.W = window.innerWidth; Game.H = window.innerHeight;
        canvas.width = Math.round(Game.W * Game.DPR);
        canvas.height = Math.round(Game.H * Game.DPR);
        canvas.style.width = Game.W + 'px';
        canvas.style.height = Game.H + 'px';
        Cam.init(Game.W, Game.H);
        layoutButtons();
    }
    function layoutButtons() {
        const W = Game.W, H = Game.H, sc = U.clamp(H / 760, 0.85, 1.2);
        const B = Input.btns;
        B.atk.x = W - 66 * sc; B.atk.y = H - 60 * sc; B.atk.r = 40 * sc;
        B.Q.x = W - 152 * sc; B.Q.y = H - 54 * sc; B.Q.r = 26 * sc;
        B.E.x = W - 96 * sc; B.E.y = H - 132 * sc; B.E.r = 26 * sc;
        B.R.x = W - 172 * sc; B.R.y = H - 108 * sc; B.R.r = 28 * sc;
    }
    window.addEventListener('resize', resize);
    resize();

    Input.init(canvas);
    World.initSeed = 12345;
    Net.initUI();

    // khai báo sớm để tránh lỗi TDZ khi callback SPR.load chạy đồng bộ
    const formBar = document.getElementById('formBar');
    let binhanCard = null;

    // ---- nạp sprite sheets ----
    SPR.load(function (loaded, total) {
        Game.state = 'menu';
        document.getElementById('loadScreen').classList.add('hidden');
        document.getElementById('menu').classList.remove('hidden');
        buildMenuCards();
        if (Net.autoRoom) Net.openModal();
    });
    Game.state = 'load';
    const bar = document.getElementById('loadBar');
    const ltxt = document.getElementById('loadText');
    const iv = setInterval(() => {
        if (SPR.ready()) { clearInterval(iv); return; }
        const p = SPR.progress();
        bar.style.width = Math.round(p * 100) + '%';
        ltxt.textContent = 'NẠP SPRITE... ' + Math.round(p * 100) + '%';
    }, 120);

    // ---- menu interacciones ----
    const cards = [];
    function drawPortrait(cv, heroId) {
        const c2 = cv.getContext('2d');
        const w = cv.width, h = cv.height;
        c2.clearRect(0, 0, w, h);
        // nền
        const gr = c2.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, w * 0.62);
        gr.addColorStop(0, HEROES[heroId].color);
        gr.addColorStop(1, 'rgba(10,10,14,0.2)');
        c2.fillStyle = gr;
        c2.beginPath(); c2.arc(w / 2, h / 2, w * 0.46, 0, U.TAU); c2.fill();
        // vẽ nhân vật (cell idle đầu)
        try {
            const proceduralHeroes = ['binhan', 'binhan2', 'quan', 'nhathuy', 'truongan', 'dat', 'leanh'];
            if (proceduralHeroes.includes(heroId)) {
                // procedural: dùng makeFighter tạm để tái dùng painter
                const tmp = new Fighter(heroId, w / 2, h * 0.86, -1, false);
                tmp.procedural = true; tmp.sheetKey = ''; tmp.aim = 0.35;
                c2.save(); c2.scale(2.1, 2.1);
                tmp.drawFallback(c2);
                c2.restore();
            } else {
                const sk = { binhminh: 'boxer', khaikiet: 'girl', annie: 'monk' }[heroId];
                if (sk) {
                    const set = SPR.ANIM[sk];
                    const sc = { boxer: 0.44, girl: 0.42, monk: 0.42 }[heroId];
                    SPR.drawCell(c2, sk, set.idle.cells[1] ? set.idle.cells[1] : set.idle.cells[0], w / 2, h * 0.9, sc, false, 1, 0);
                } else {
                    // tướng chưa có sprite: bóng đen + dấu ? (khung sắp ra mắt)
                    const d = HEROES[heroId];
                    c2.save();
                    c2.fillStyle = 'rgba(8,8,12,0.55)';
                    c2.beginPath();
                    c2.ellipse(w / 2, h * 0.52, w * 0.19, h * 0.26, 0, 0, U.TAU);
                    c2.fill();
                    c2.beginPath(); c2.arc(w / 2, h * 0.36, w * 0.13, 0, U.TAU); c2.fill();
                    c2.restore();
                    c2.font = '900 ' + Math.round(w * 0.34) + 'px system-ui';
                    c2.textAlign = 'center'; c2.textBaseline = 'middle';
                    c2.fillStyle = d.color;
                    c2.shadowColor = d.color; c2.shadowBlur = 16;
                    c2.fillText('?', w / 2, h * 0.56);
                }
            }
        } catch (e) { }
    }
    function buildMenuCards() {
        const grid = document.getElementById('heroGrid');
        grid.innerHTML = '';
        for (const id of ['binhan', 'binhminh', 'khaikiet', 'annie', 'quan', 'nhathuy', 'truongan', 'dat', 'leanh']) {
            const d = HEROES[id];
            const card = document.createElement('div');
            card.className = 'heroCard' + (d.locked ? ' locked' : '') + (id === Game.selectedHero ? ' sel' : '');
            card.dataset.hero = id;
            const cv = document.createElement('canvas');
            cv.width = 92; cv.height = 96;
            drawPortrait(cv, id);
            card.appendChild(cv);
            const nm = document.createElement('div');
            nm.className = 'heroName';
            nm.textContent = d.name;
            card.appendChild(nm);
            const rl = document.createElement('div');
            rl.className = 'heroRole';
            rl.textContent = (d.role || '').startsWith(d.className) ? d.role : (d.className && d.className !== d.role) ? d.className + ' · ' + d.role : d.role;
            card.appendChild(rl);
            // thanh chỉ số lớp: sát thương / độ trâu / cơ động
            const st = document.createElement('div');
            st.className = 'heroStats';
            st.innerHTML = heroStatBar(d);
            card.appendChild(st);
            if (d.locked) {
                const lk = document.createElement('div');
                lk.className = 'lockBadge';
                lk.textContent = '🔒 SẮP RA MẮT';
                card.appendChild(lk);
            }
            if (id === 'binhan') {
                const db = document.createElement('div');
                db.className = 'dualBadge';
                db.textContent = '2 DẠNG';
                card.appendChild(db);
            }
            card.addEventListener('click', () => {
                if (d.locked) { Game.banner('🔒 ' + d.name + ' sắp ra mắt!', d.color); return; }
                Game.selectedHero = id;
                document.querySelectorAll('.heroCard').forEach(c => c.classList.remove('sel'));
                card.classList.add('sel');
                if (formBar) formBar.classList.toggle('hidden', id !== 'binhan');
                Sfx.ensure(); Sfx.pick();
                card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
            });
            grid.appendChild(card);
            if (id === 'binhan') binhanCard = card;
        }
        if (formBar) formBar.classList.toggle('hidden', Game.selectedHero !== 'binhan');
        if (Game.selectedForm === 'v2') updateFormPreview();
    }

    // ---- chọn dạng V1 / V2 cho Bình An ----
    function updateFormPreview() {
        if (!binhanCard) return;
        const cv = binhanCard.querySelector('canvas');
        if (cv) drawPortrait(cv, Game.selectedForm === 'v2' ? 'binhan2' : 'binhan');
        const rl = binhanCard.querySelector('.heroRole');
        if (rl) rl.textContent = Game.selectedForm === 'v2' ? 'XẠ THỦ · XÍCH VẠN NĂNG' : 'XẠ THỦ';
    }
    formBar.querySelectorAll('.formOpt').forEach(opt => {
        opt.addEventListener('click', () => {
            Game.selectedForm = opt.dataset.form;
            formBar.querySelectorAll('.formOpt').forEach(o => o.classList.toggle('sel', o === opt));
            updateFormPreview();
            Sfx.ensure(); Sfx.pick();
            const hc = Game.selectedForm === 'v2' ? '#ffd166' : '#4dd7ff';
            if (binhanCard) binhanCard.style.setProperty('--hc', hc);
            Game.banner(Game.selectedForm === 'v2' ? '⛓️ DẠNG V2: XÍCH VẠN NĂNG' : '🔫 DẠNG V1: XẠ THỦ', '#ffd166');
        });
    });

    // chế độ
    document.querySelectorAll('.modeBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modeBtn').forEach(b => b.classList.remove('sel'));
            btn.classList.add('sel');
        });
    });

    document.getElementById('startBtn').addEventListener('click', () => {
        Sfx.ensure();
        const modeBtn = document.querySelector('.modeBtn.sel');
        const mode = modeBtn ? modeBtn.dataset.mode : 'pvp';
        if (mode === 'online') { Net.openModal(); return; }
        Game.start(mode);
    });
    document.getElementById('helpBtn').addEventListener('click', () => {
        document.getElementById('helpModal').classList.remove('hidden');
    });
    document.getElementById('helpClose').addEventListener('click', () => {
        document.getElementById('helpModal').classList.add('hidden');
    });

    // ---- cửa hàng trang bị ----
    buildShopUI();
    document.getElementById('bagBtn').addEventListener('click', () => Game.openShop());
    document.getElementById('shopClose').addEventListener('click', () => Game.closeShop());
    document.getElementById('endMenuBtn').addEventListener('click', () => {
        if (Game.online) { Game.leaveOnlineToMenu(); return; }
        document.getElementById('endScreen').classList.add('hidden');
        document.getElementById('menu').classList.remove('hidden');
        document.body.classList.remove('in-match');
        Game.state = 'menu';
    });
    document.getElementById('endRetryBtn').addEventListener('click', () => {
        if (Game.online) { Game.leaveOnlineToMenu(); return; }
        document.getElementById('endScreen').classList.add('hidden');
        Game.start(Game.mode);
    });

    // ESC → pause / thoát training; B → mở trang bị
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            if (Game.state === 'shop') { Game.closeShop(); return; }
            if (Game.online) {
                if (Game.state === 'playing' || Game.state === 'countdown') Game.leaveOnlineToMenu();
                return;
            }
            if (Game.state === 'playing' || Game.state === 'countdown') {
                if (Game.mode === 'training') { // training: về menu
                    Game.state = 'menu';
                    document.body.classList.remove('in-match');
                    document.getElementById('menu').classList.remove('hidden');
                } else {
                    Game.state = Game.state === 'paused' ? 'playing' : 'paused';
                    document.getElementById('pauseScreen').classList.toggle('hidden', Game.state !== 'paused');
                }
            }
        }
        if (e.code === 'KeyB') {
            if (Game.state === 'shop') Game.closeShop();
            else if (Game.state === 'playing' || Game.state === 'countdown') Game.openShop();
        }
        if (e.code === 'KeyM') { Sfx.muted = !Sfx.muted; Game.banner(Sfx.muted ? '🔇 TẮT TIẾNG' : '🔊 BẬT TIẾNG', '#9fd0ff'); }
    });
    document.getElementById('resumeBtn').addEventListener('click', () => {
        Game.state = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
    });
    document.getElementById('quitBtn').addEventListener('click', () => {
        if (Game.online) { Game.leaveOnlineToMenu(); return; }
        Game.state = 'menu';
        document.body.classList.remove('in-match');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('menu').classList.remove('hidden');
    });

    // hú băng về menu khi menu lại mở
    const mo = document.getElementById('menu');
    const moObs = new MutationObserver(() => {
        if (!mo.classList.contains('hidden')) Game.state = 'menu';
    });
    moObs.observe(mo, { attributes: true, attributeFilter: ['class'] });

    // ---------- vòng lặp ----------
    let last = performance.now();
    function frame(now) {
        requestAnimationFrame(frame);
        let dt = (now - last) / 1000;
        last = now;
        if (dt > 0.08) dt = 0.08;
        Game.tickCount++;
        // slow-mo toàn cục + hitstop (dừng khựng khi đòn nặng)
        let wdt = FX.slowT > 0 ? dt * 0.35 : dt;
        if (FX.hitstopT > 0) {
            FX.hitstopT = Math.max(0, FX.hitstopT - dt);
            wdt *= 0.12;
        }
        if (Game.state === 'playing') Game.update(wdt);
        else if (Game.state === 'countdown') {
            Game.update(wdt);
        } else if (Game.state === 'menu' || Game.state === 'load') {
            FX.update(dt);
        }
        Input.consumeKeys();
        render(dt);
    }
    requestAnimationFrame(frame);
})();
