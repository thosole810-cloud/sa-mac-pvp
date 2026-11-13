// ============================================================
//  entities.js — Nhân vật (người chơi + bot), Quái, Đạn, Kỹ năng
//  • CC: knock-up (bay lên), slow (làm chậm), root (trói)
//  • XP/Level: hạ quái hoặc người → nhận xp → lên cấp mạnh hơn
// ============================================================
'use strict';

// ---------- [ĐAN: định nghĩa 4 tướng] ----------
const HEROES = {
    // ---------- XẠ THỦ: sát thương lớn, máu giấy ----------
    binhan: {
        id: 'binhan', name: 'BÌNH AN', role: 'XẠ THỦ', className: 'XẠ THỦ', color: '#4dd7ff', color2: '#0e5a7a', beastName: 'Lang Vương',
        maxHp: 96, speed: 212, radius: 13,
        atk: { kind: 'ranged', dmg: 13, cd: 0.19, range: 460, speed: 900 },
        skills: {
            Q: { name: 'LƯỚT TẤT', cd: 4, desc: 'Lướt nhanh 240px theo hướng di chuyển, né mọi sát thương trong lúc lướt.' },
            E: { name: 'MƯA ĐẠN', cd: 7, desc: 'Bắn chùm 5 viên đạn ra hình quạt, kẻ địch trúng bị LÀM CHẬM 45% trong 1.5s.' },
            R: { name: 'MINIGUN CUỒNG NỘ', cd: 26, desc: 'Xả đạn 3s liên tục với tốc độ khủng khiếp, đạn phủ kín cả vùng trước mặt.' },
        },
    },
    // Bình An — DẠNG V2: XÍCH VẠN NĂNG (vẫn là Xạ Thủ: damage to, máu giấy)
    binhan2: {
        id: 'binhan2', name: 'BÌNH AN', role: 'XÍCH VẠN NĂNG', className: 'XẠ THỦ', color: '#ffd166', color2: '#7a3d0f', beastName: 'Thiết Ngưu',
        maxHp: 108, speed: 218, radius: 14,
        atk: { kind: 'chain', dmg: 17, cd: 0.38, range: 132, arc: 1.7 },
        skills: {
            Q: { name: 'XÍCH MÓC', cd: 4.5, desc: 'Phóng xích móc 300px, kéo bản thân lao tới, gây 22 sát thương + choáng 0.5s.' },
            E: { name: 'XÍCH TRÓI', cd: 8, desc: '3 sợi xích phóng tới kẻ địch: TRÓI 1.1s, kéo chúng lại gần và gây 16 sát thương.' },
            R: { name: 'XÍCH VẠN NĂNG', cd: 26, desc: 'Thiên la địa võng 2.6s: xích khổng lồ siết mọi kẻ địch trong 300px, kéo vào tâm, trói và gây sát thương liên tục.' },
        },
    },
    // ---------- ĐẤU SĨ: trâu vừa phải, sát thương vừa phải ----------
    binhminh: {
        id: 'binhminh', name: 'BÌNH MINH', role: 'ĐẤU THẦN', className: 'ĐẤU THẦN', color: '#ffd93d', beastName: 'Hổ Sa Mạc',
        maxHp: 195, speed: 206, radius: 15, armorPct: 0.10,
        atk: { kind: 'melee', dmg: 13, cd: 0.40, range: 66, arc: 1.85 },
        skills: {
            Q: { name: 'PHÁ ĐỊA TRỌNG KÍCH', cd: 7, desc: 'Đấm nứt chiến trường 160px: 24 dmg + HẤT TUNG 0.9s + chậm 50%/1.6s. Nứt đất lửa rực!' },
            E: { name: 'HỔ HẦU THIẾT BỐI', cd: 8, desc: 'Gầm gừ hút mọi kẻ địch trong 260px về phía mình: 18 dmg + choáng 0.6s, tự tăng 30% sát thương 4s (HỔ UY).' },
            R: { name: 'THIÊN BĂNG ĐỊA LIỄN', cd: 26, desc: 'Bật lên trời rồi ập xuống 3 tầng sóng xung kích lan xa dần: 30/40/55 dmg — tầng cuối HẤT TUNG cả vùng!' },
        },
    },
    // ---------- PHÁP SƯ: tầm xa, sát thương phép lớn, máu giấy ----------
    annie: {
        id: 'annie', name: 'ANNIE NÂU', role: 'PHÁP SƯ', className: 'PHÁP SƯ', color: '#b06bff', locked: true, beastName: 'Hạc Lửa',
        maxHp: 106, speed: 208, radius: 12,
        atk: { kind: 'ranged', dmg: 13, cd: 0.52, range: 410, speed: 380 },
        skills: {
            Q: { name: 'KHI QUYỀN', cd: 7, desc: 'Chưởng khí cách 180px hất kẻ địch bật lùi 2.6m.' },
            E: { name: 'LỐC KHÍ BỘNG', cd: 9, desc: 'Xoay xoay phát nổ 115px quanh thân: 14 dmg + kéo nhẹ kẻ địch.' },
            R: { name: 'CỰ LỐC THIÊN DIỆT', cd: 26, desc: 'Thả chân khí bão xoáy tròn hút kẻ địch cận chiến, kéo liên tục và gây sát thương trong 4.2s.' },
        },
    },

    // ============================================================
    //  TƯỚNG MỞ KHOÁ — mỗi người một lối chơi riêng
    // ============================================================
    quan: {
        id: 'quan', name: 'QUÂN', role: 'CUỒNG ĐAO', className: 'ĐẤU SĨ', color: '#ff9f43', color2: '#6e2c00', beastName: 'Cuồng Long',
        maxHp: 184, speed: 204, radius: 15, armorPct: 0.10,
        atk: { kind: 'melee', dmg: 15, cd: 0.44, range: 72, arc: 2.05 },
        skills: {
            Q: { name: 'TRẢM PHONG', cd: 7, desc: 'Sóng đao xuyên 380px: 24 dmg + CHẢY MÁU 5/s trong 3s. Trúng càng nhiều càng hồi máu.' },
            E: { name: 'CUỒNG NỘ', cd: 10, desc: '4.5s cuồng bạo: +30% tốc chạy, +40% tốc đánh, hút máu 25%, đòn đánh gây chảy máu.' },
            R: { name: 'ĐAO THẦN CHI NỘ', cd: 28, desc: '3 nhát chém khổng lồ liên tiếp: 26/32/42 dmg, chém đôi chiến trường, hồi máu theo sát thương.' },
        },
    },
    nhathuy: {
        id: 'nhathuy', name: 'NHẬT HUY', role: 'ẢNH VỆ', className: 'SÁT THỦ', color: '#7dff9a', color2: '#0d3b25', beastName: 'Xà Độc',
        maxHp: 98, speed: 262, radius: 12,
        atk: { kind: 'ranged', dmg: 10, cd: 0.24, range: 340, speed: 760 },
        skills: {
            Q: { name: 'ẢNH BƯỚC', cd: 5, desc: 'Dịch chuyển sau lưng mục tiêu gần nhất (420px), bất tử 0.25s; đòn kế tiếp +70% sát thương.' },
            E: { name: 'ĐỘC NHẬN', cd: 7.5, desc: '3 phi đao tẩm độc: 9 dmg mỗi dao + ĐỘC 5/s trong 3s. Đánh thường lên mục tiêu nhiễm độc +50% dmg.' },
            R: { name: 'VÔ ẢNH SÁT', cd: 26, desc: 'Lướt 440px xuyên chiến trường, chém mọi mục tiêu: 32 dmg + độc mạnh, bất tử khi lướt.' },
        },
    },
    truongan: {
        id: 'truongan', name: 'TRƯỜNG AN', role: 'VỢT THỦ', className: 'VỢT THỦ', color: '#ff6bd6', color2: '#5a0b3c', beastName: 'Phượng Vũ',
        maxHp: 94, speed: 218, radius: 12,
        atk: { kind: 'ranged', dmg: 16, cd: 0.34, range: 540, speed: 1100 },  // cú vụt cầu lông
        skills: {
            Q: { name: 'VỤT XUYÊN VÂN', cd: 6, desc: 'Cú vụt cầu lông xuyên 560px: 26 dmg, xuyên mọi mục tiêu, khiến chúng chịu +20% sát thương trong 3s.' },
            E: { name: 'MƯA CẦU XOÁY', cd: 10, desc: 'Phóng cầu xoay lên trời — cầu rơi xuống như mưa tại vùng chỉ định (460px): 7 đợt 7 dmg + làm chậm 35%.' },
            R: { name: 'SMASH THIÊN THẦN', cd: 30, desc: 'Cú smash khổng lồ xuyên toàn bản đồ: 60 dmg + 15% máu đã mất, xuyên mọi kẻ địch, đánh dấu +25% dmg nhận 4s!' },
        },
    },
    dat: {
        id: 'dat', name: 'ĐẠT', role: 'HỘ VỆ', className: 'PHÁP SƯ', color: '#ffb86b', color2: '#4a2a08', beastName: 'Rùa Thần',
        maxHp: 116, speed: 206, radius: 13,
        atk: { kind: 'ranged', dmg: 13, cd: 0.5, range: 400, speed: 380 },
        skills: {
            Q: { name: 'LÁ CHẮN', cd: 8, desc: 'Lá chắn hấp thụ 65 + 8 mỗi cấp trong 4s, đồng thời giải làm chậm/trói.' },
            E: { name: 'TRÓI LINH HỒN', cd: 10, desc: 'Phóng xích tới vùng chỉ định (420px): 15 dmg, TRÓI 1.2s và làm chậm 45% trong 2s.' },
            R: { name: 'THIÊN ĐỊA HOÀN VŨ', cd: 30, desc: 'Vòng tròn 3s: 10 dmg mỗi nhịp, làm chậm 40%, hồi máu bản thân và đồng đội trong vùng.' },
        },
    },
    leanh: {
        id: 'leanh', name: 'LÊ ANH', role: 'HỘ PHÁP', className: 'ĐẤU SĨ', color: '#9ad0ff', color2: '#123d5c', beastName: 'Hạc Băng',
        maxHp: 182, speed: 204, radius: 14, armorPct: 0.09,
        atk: { kind: 'melee', dmg: 14, cd: 0.42, range: 70, arc: 1.95 },
        skills: {
            Q: { name: 'HỘ THÂN', cd: 9, desc: '4s giáp thánh quang: giảm 40% sát thương nhận, nhận thêm lá chắn 40 và phản 15% sát thương.' },
            E: { name: 'XUNG KÍCH', cd: 8, desc: 'Lao 300px hất tung kẻ địch trên đường (18 dmg), nhận lá chắn 35 cho mỗi mục tiêu trúng.' },
            R: { name: 'BẤT DIỆT HỘ VỆ', cd: 30, desc: '4.5s MIỄN KHỐNG CHẾ, giảm 30% dmg, hồi 10 máu/s; vùng thánh quang thiêu đốt kẻ địch xung quanh.' },
        },
    },
};

const BOT_NAMES = ['Sa Mạc Lang', 'Bão Cát', 'Vệ Binh Cát', 'Tử Thần Cát', 'Bọ Hung', 'Rồng Cát'];

// ---------- [CC + helpers chung] ----------
function canAct(c) {
    return !c.dead && c.knockT <= 0 && c.stunT <= 0;
}
function canMove(c) {
    return canAct(c) && c.rootT <= 0;
}

// ---------- [LỚP NHÂN VẬT] ----------
class Fighter {
    constructor(heroId, x, y, team, isBot, name) {
        this.def = HEROES[heroId];
        this.heroId = heroId;
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;
        this.r = this.def.radius;
        this.team = team;
        this.isBot = !!isBot;
        this.name = name || this.def.name;
        this.maxHp = this.def.maxHp; this.hp = this.maxHp;
        this.facing = 1;              // 1 phải / -1 trái
        this.aim = 0;                 // góc nhắm (rad)
        this.dead = false;
        // CC
        this.slowT = 0; this.slowAmt = 0;
        this.rootT = 0; this.stunT = 0;
        this.knockT = 0; this.knockDur = 0.8; this.z = 0; this.vz = 0;
        this.invulnT = 0;
        // kỹ năng + attack
        this.atkCd = 0;
        this.cdQ = 0; this.cdE = 0; this.cdR = 0;
        this.dashT = 0; this.dashDirX = 0; this.dashDirY = 0; this.dashSpeed = 0; this.dashHitSet = null;
        this.dmgMul = 1;
        // trang bị trong trận
        this.armorPct = this.def.armorPct || 0;
        this.ccResist = 0;
        this.lifesteal = 0;
        this.speedBonus = 0;
        this.cdRate = 0;
        // trạng thái đặc biệt của các tướng mới
        this.dots = [];              // [{kind:'bleed'|'poison', dps, t, acc, src}]
        this.shield = 0; this.shieldT = 0;
        this.guardT = 0; this.guardPct = 0; this.guardReflect = 0;
        this.vulnT = 0; this.vulnAmt = 0;
        this.rageT = 0;
        // ---- NỘ: cưỡi linh thú ----
        this.fury = 0;          // 0..100
        this.mountT = 0;        // thời gian còn lại khi đang NỘ
        this._furyHint = false;
        this.unstoppableT = 0;
        this.regenT = 0; this.regenAmt = 0;
        this.shadowStrikeT = 0;
        this.channelX = 0; this.channelY = 0; this.channelHits = 0;
        this.channelT = 0;       // minigun/spin đang bật
        this.channelKind = '';
        this.channelTick = 0;
        this.spinT = 0;          // ngoại hiệu Bão Kiếm / Lốc Khí
        this.spinTick = 0;
        this.spinRadius = 0; this.spinDmg = 0; this.spinPull = 0; this.spinKind = '';
        this.killCount = 0; this.dmgDealt = 0;
        // xp
        this.xp = 0; this.level = 1;
        // sprite anim
        this.sprite = null; this.sheetKey = ''; this.animName = ''; this.animT = 0;
        this.procedural = heroId === 'binhan' || heroId === 'binhan2' ||
            heroId === 'quan' || heroId === 'nhathuy' || heroId === 'truongan' ||
            heroId === 'dat' || heroId === 'leanh';
        this.t = U.rand(0, 10);
        this.walkT = 0;
        this.takeHitT = 0;
        this.bonus = null; // nếu là quái dùng riêng
    }

    // tốc độ hiện tại (làm tạm chậm)
    speedNow() {
        let s = this.def.speed + this.speedBonus;
        if (this.slowT > 0) s *= (1 - this.slowAmt);
        if (this.rageT > 0) s *= 1.30;
        if (this.mountT > 0) s *= 1.22;
        if (this.unstoppableT > 0) s *= 1.12;
        if (this.channelKind === 'minigun') s *= 0.45;
        if (this.channelKind === 'chainult') s *= 0.6;
        if (this.channelKind === 'datult') s *= 0.75;
        if (this.channelKind === 'spin') s *= 1.15;
        return s;
    }

    setAnim(name) {
        if (this.animName !== name) { this.animName = name; this.animT = 0; }
    }

    // ghi nhận sát thương nhận vào; trả về đã chết?
    hurt(amount, src, opts) {
        opts = opts || {};
        if (this.dead) return false;
        if (this.invulnT > 0) return false;
        // giáp: giảm sát thương nhận vào (từ nội tại tướng + trang bị)
        amount *= (1 - (this.armorPct || 0));
        // Trường An đánh dấu: mục tiêu chịu thêm sát thương
        if (this.vulnT > 0) amount *= (1 + (this.vulnAmt || 0));
        // Lê Anh hộ thân / bất diệt
        if (this.guardT > 0) amount *= (1 - (this.guardPct || 0));
        // lá chắn hấp thụ (Đạt / Lê Anh)
        let blocked = 0;
        if (this.shield > 0 && this.shieldT > 0) {
            blocked = Math.min(this.shield, amount);
            this.shield -= blocked;
            amount -= blocked;
            FX.ring(this.x, this.y - 18, 8, 30, '#9be8a8', 0.3, 3);
            FX.sparkHit(this.x, this.y - 22, '#c8ffd8', 4);
            if (this.shield <= 0) { this.shield = 0; this.shieldT = 0; FX.text(this.x, this.y - 44, 'VỠ CHẮN', '#9be8a8', 12); }
        }
        if (amount <= 0 && blocked > 0) {
            this.takeHitT = 0.15;
            if (!opts.silent) FX.text(this.x + U.rand(-6, 6), this.y - 38, 'CHẶN', '#9be8a8', 12);
            // hiệu ứng khống chế vẫn có thể xuyên qua (trừ khi bất tử)
            if (this.unstoppableT <= 0) {
                const ccK0 = 1 - (this.ccResist || 0);
                if (opts.slow) { this.slowT = Math.max(this.slowT, opts.slow.dur * ccK0); this.slowAmt = Math.max(this.slowAmt, opts.slow.amp); }
                if (opts.root) this.rootT = Math.max(this.rootT, opts.root * ccK0);
                if (opts.stun) this.stunT = Math.max(this.stunT, opts.stun * ccK0);
            }
            return false;
        }
        const dealt = Math.max(0, amount);
        this.hp -= dealt;
        this.takeHitT = 0.15;
        if (src && !opts.silent) {
            src.dmgDealt += dealt;
            FX.text(this.x + U.rand(-6, 6), this.y - 34 - (this.z || 0), String(Math.round(dealt)), opts.textC || '#ffffff', opts.isCrit ? 17 : 13);
        }
        if (!opts.silent) {
            FX.sparkHit(this.x, this.y - 22 - (this.z || 0), opts.sparkC || '#ffdd55', 5);
            FX.hurtFlash(this.isPlayer ? 0.5 : 0);
            Sfx.hit();
        }
        // combo + hitstop khi người chơi gây đòn nặng
        if (src && src.isPlayer && !opts.silent && !this.isPlayer) {
            if (dealt >= 8) FX.comboAdd();
            if (dealt >= 18) FX.hitstop(0.05);
        }
        // kháng khống chế từ trang bị + bất tử khống chế
        const ccK = this.unstoppableT > 0 ? 0 : (1 - (this.ccResist || 0));
        if (opts.slow && ccK > 0) { this.slowT = Math.max(this.slowT, opts.slow.dur * ccK); this.slowAmt = Math.max(this.slowAmt, opts.slow.amp); }
        if (opts.root && ccK > 0) { this.rootT = Math.max(this.rootT, opts.root * ccK); }
        if (opts.stun && ccK > 0) { this.stunT = Math.max(this.stunT, opts.stun * ccK); }
        if (opts.vx) { this.vx += opts.vx; this.vy += (opts.vy || 0); }
        if (opts.launch && this.unstoppableT <= 0) this.launch(opts.launch);
        // phản sát thương (Lê Anh Q)
        if (this.guardReflect > 0 && src && !src.dead && typeof src.hurt === 'function' && dealt > 0) {
            const back = dealt * this.guardReflect;
            if (back >= 1) src.hurt(back, this, { trueDmg: true, silent: true, sparkC: '#ffe9a8' });
        }
        // hút máu: người chơi gây sát thương → hồi máu (Cuồng Nộ cộng thêm 25%)
        if (src && src.lifesteal !== undefined && !this.isPlayer) {
            const ls = (src.lifesteal || 0) + (src.rageT > 0 ? 0.25 : 0);
            if (ls > 0) src.hp = Math.min(src.maxHp, src.hp + dealt * ls);
        }
        if (this.hp <= 0) { this.hp = 0; this.die(src); return true; }
        return false;
    }

    // ---- trạng thái theo thời gian (chảy máu / độc) ----
    addDot(kind, dps, dur, src) {
        if (this.dead) return;
        let dot = this.dots.find(d => d.kind === kind);
        if (!dot) { dot = { kind, dps: 0, t: 0, acc: 0, src }; this.dots.push(dot); }
        dot.dps = Math.max(dot.dps, dps);
        dot.t = Math.max(dot.t, dur);
        dot.src = src || dot.src;
    }
    tickDots(dt) {
        if (!this.dots.length) return;
        for (let i = this.dots.length - 1; i >= 0; i--) {
            const d = this.dots[i];
            d.t -= dt; d.acc += dt;
            while (d.acc >= 0.5 && d.t > -0.5) {
                d.acc -= 0.5;
                if (!this.dead) {
                    const col = d.kind === 'poison' ? '#8dff9a' : '#ff7d6b';
                    this.hurt(d.dps * 0.5, d.src, { trueDmg: true, silent: true, sparkC: col });
                    FX.text(this.x + U.rand(-7, 7), this.y - 36, String(Math.round(d.dps * 0.5)), col, 11);
                }
            }
            if (d.t <= 0) this.dots.splice(i, 1);
        }
    }

    // hất tung: bay lên rồi rơi xuống
    launch(power) {
        if (this.dead) return;
        this.knockT = this.knockDur = 0.75 + power * 0.1;
        this.vz = 220 + power * 90;
        this.z = 0.01;
        Sfx.launch();
        FX.dust(this.x, this.y, 6);
    }

    heal(v) {
        this.hp = Math.min(this.maxHp, this.hp + v);
        FX.text(this.x, this.y - 30, '+' + v, '#7dff9a', 13);
    }

    die(src) {
        if (this.dead) return;
        this.dead = true;
        this.z = 0;
        if (this.isPlayer) Game.streak = 0;
        FX.explosion(this.x, this.y, 0.8, this.def.color);
        FX.stain(this.x, this.y, 20, 'rgba(140,30,30,0.5)');
        Sfx.die();
        if (src) {
            src.killCount++;
            src.gainXp(55);
            Sfx.pick();
            Game.addFeed(src, this);
            if (src.isPlayer) { src.heal(15); Game.onKill(this); }
        }
        // rỉ máu lệ
        FX.stain(this.x + U.rand(-14, 14), this.y + U.rand(-8, 8), 14, 'rgba(150,40,30,0.4)');
        for (let i = 0; i < 3; i++) {
            FX.part(this.x, this.y, U.rand(-90, 90), U.rand(-140, -60), 0.9, 3.5, '#ff5a5a', { grav: 380, glow: true });
        }
    }

    // ---- NỘ: tích & kích hoạt linh thú ----
    addFury(n) {
        if (this.dead || this.mountT > 0) return;
        this.fury = Math.min(100, this.fury + n);
        if (this.fury >= 100 && !this._furyHint && !this.isBot && !this.isRemote) {
            this._furyHint = true;
            Game.banner('NỘ SẴN SÀNG — BẤM F ĐỂ CƯỠI LINH THÚ!', '#ff9f43');
            Sfx.levelup();
        }
    }

    activateFury() {
        if (this.dead || this.mountT > 0 || this.fury < 100 || !canAct(this)) return false;
        this.fury = 0; this._furyHint = false;
        this.mountT = 10;
        this.dmgMul += 0.6;
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.15);
        const beast = this.beastName || 'Linh Thú';
        Game.announce(this.name + ' NỘ — CƯỠI ' + beast.toUpperCase() + '!', this.def.color);
        FX.flash(this.def.color, 0.25);
        FX.ring(this.x, this.y - 10, 12, 130, this.def.color, 0.6, 6);
        FX.ring(this.x, this.y - 10, 40, 90, '#ffffff', 0.4, 4);
        FX.burst(this.x, this.y - 14, 26, this.def.color, { speed: 280, life: 0.7, glow: true, size: 3.6 });
        FX.text(this.x, this.y - 66, 'NỘ!', '#ffb347', 20);
        Cam.shake(7); Cam.punch(0.05);
        Sfx.ult(); Sfx.growl();
        return true;
    }

    gainXp(v) {
        this.xp += v;
        let need = xpNeed(this.level);
        while (this.xp >= need && this.level < 12) {
            this.xp -= need;
            this.level++;
            this.maxHp += 14;
            this.hp = Math.min(this.maxHp, this.hp + 45);
            this.dmgMul += 0.07;
            this.addFury(18);
            FX.ring(this.x, this.y - 10, 6, 52, '#ffe066', 0.6, 4);
            FX.ring(this.x, this.y - 10, 4, 34, '#ffffff', 0.5, 2.5);
            FX.burst(this.x, this.y - 24, 16, '#ffe066', { speed: 180, life: 0.7, glow: true, size: 3.4 });
            FX.text(this.x, this.y - 60, 'LÊN CẤP ' + this.level + '!', '#ffe066', 17);
            if (!this.isBot) { Game.banner('LÊN CẤP ' + this.level + ' — MẠNH MẼ HƠN!', '#ffe066'); }
            Sfx.levelup();
            need = xpNeed(this.level);
        }
    }

    update(dt, worldUpdate) {
        this.t += dt;
        // đồng hồ (cdRate từ trang bị giúp hồi chiêu nhanh hơn)
        const cdr = 1 + (this.cdRate || 0) + (this.mountT > 0 ? 0.35 : 0);
        this.atkCd -= dt; this.cdQ -= dt * cdr; this.cdE -= dt * cdr; this.cdR -= dt * cdr;
        if (this.slowT > 0) this.slowT -= dt; else this.slowAmt = 0;
        if (this.rootT > 0) this.rootT -= dt;
        if (this.stunT > 0) this.stunT -= dt;
        if (this.invulnT > 0) this.invulnT -= dt;
        if (this.takeHitT > 0) this.takeHitT -= dt;
        // trạng thái riêng
        if (this.shieldT > 0) { this.shieldT -= dt; if (this.shieldT <= 0) { this.shield = 0; this.shieldT = 0; } }
        if (this.guardT > 0) { this.guardT -= dt; if (this.guardT <= 0) { this.guardPct = 0; this.guardReflect = 0; } }
        if (this.vulnT > 0) { this.vulnT -= dt; if (this.vulnT <= 0) this.vulnAmt = 0; }
        if (this.rageT > 0) {
            this.rageT -= dt;
            if (U.chance(dt * 10)) FX.part(this.x + U.rand(-12, 12), this.y - U.rand(8, 38), U.rand(-12, 12), U.rand(-55, -20), 0.5, 3, '#ff8a3d', { glow: true });
        }
        if (this.unstoppableT > 0) this.unstoppableT -= dt;
        if (this.regenT > 0) {
            this.regenT -= dt;
            this.hp = Math.min(this.maxHp, this.hp + (this.regenAmt || 0) * dt);
        }
        if (this.shadowStrikeT > 0) this.shadowStrikeT -= dt;
        // ---- NỘ: đếm ngược linh thú / tụt nộ ----
        if (this.mountT > 0) {
            this.mountT -= dt;
            if (this.mountT <= 0) {
                this.mountT = 0;
                this.dmgMul = Math.max(1, this.dmgMul - 0.6);
                FX.text(this.x, this.y - 58, 'LINH THÚ RỜI ĐI', '#c9a2ff', 12);
                FX.burst(this.x, this.y - 10, 14, '#b06bff', { speed: 160, life: 0.5, glow: true, size: 3 });
            } else if (U.chance(dt * 14)) {
                FX.part(this.x + U.rand(-16, 16), this.y - U.rand(2, 12), U.rand(-30, 30), U.rand(-70, -30), 0.55, 3, this.def.color, { glow: true });
            }
        } else if (this.fury > 0) this.fury = Math.max(0, this.fury - 3.5 * dt);
        this.tickDots(dt);
        if (this.dead) return;
        // hồi máu chậm khi an toàn
        if (!this.dead && this.takeHitT <= 0) this.hp = Math.min(this.maxHp, this.hp + 1.6 * dt);

        // knock-up: bay lên rồi rơi (đảm bảo luôn chạm đất dù knockT kết thúc sớm)
        if (this.knockT > 0 || this.z > 0.0001) {
            this.knockT -= dt;
            this.vz -= 620 * dt;
            this.z += this.vz * dt;
            if (this.z <= 0) {
                this.z = 0; this.vz = 0; this.knockT = 0;
                this.stunT = Math.max(this.stunT, 0.25);
                FX.dust(this.x, this.y, 5);
                Cam.shake(2.5);
                // Bình Minh R: đáp xuống → 3 tầng sóng thiên băng
                if (this.channelKind === 'quakePend') {
                    this.channelKind = 'bmQuake';
                    this.channelT = 1.05; this.channelTick = 0.05; this.bmWave = 0;
                    FX.flash('#ffd93d', 0.28);
                    FX.ring(this.x, this.y, 20, 200, '#ffe066', 0.5, 7);
                    FX.dust(this.x, this.y, 18);
                    Cam.punch(0.05); Cam.shake(9);
                    Sfx.slam();
                }
            }
        }

        // dash
        if (this.dashT > 0) {
            this.dashT -= dt;
            this.x += this.dashDirX * this.dashSpeed * dt;
            this.y += this.dashDirY * this.dashSpeed * dt;
            FX.part(this.x, this.y - 16, U.rand(-10, 10), U.rand(-10, 10), 0.25, 7, this.def.color, { glow: true });
            World.clampEnt(this);
            // chém trên đường lướt
            this.dashHitAlong();
            if (this.dashT <= 0) {
                this.dashShieldGain = 0;
                this.dashPoisonDps = 0;
                this.dashExecute = false;
                this.dashBleed = null;
            }
        }
        // xoay chém (spin)
        if (this.spinT > 0) {
            this.spinT -= dt;
            this.spinTick -= dt;
            if (this.spinTick <= 0) {
                this.spinTick = 0.22;
                this.spinHit(dt);
            }
        }
        // channel minigun
        if (this.channelKind === 'minigun' && this.channelT > 0) {
            this.channelT -= dt;
            this.channelTick -= dt;
            if (this.channelTick <= 0) {
                this.channelTick = 0.08;
                this.minigunShot();
            }
            if (this.channelT <= 0) this.channelKind = '';
        } else if (this.channelKind === 'quakePend') {
            this.channelT -= dt;
        } else if (this.channelKind === 'bmQuake' && this.channelT > 0) {
            this.channelT -= dt; this.channelTick -= dt;
            if (this.channelTick <= 0) { this.channelTick = 0.36; this.bmQuakeWave(); }
            if (this.channelT <= 0) this.channelKind = '';
        } else if (this.channelKind === 'chainult' && this.channelT > 0) {
            this.channelT -= dt;
            this.channelTick -= dt;
            if (this.channelTick <= 0) {
                this.channelTick = 0.22;
                this.chainUltTick();
            }
            if (this.channelT <= 0) this.chainUltEnd();
        } else if (this.channelKind === 'quanult' && this.channelT > 0) {
            this.channelT -= dt; this.channelTick -= dt;
            if (this.channelTick <= 0) { this.channelTick = 0.42; this.quanUltSlash(); }
            if (this.channelT <= 0) { this.channelKind = ''; this.channelHits = 0; }
        } else if (this.channelKind === 'arrowrain' && this.channelT > 0) {
            this.channelT -= dt; this.channelTick -= dt;
            if (this.channelTick <= 0) { this.channelTick = 0.34; this.arrowRainTick(); }
            if (this.channelT <= 0) this.channelKind = '';
        } else if (this.channelKind === 'datult' && this.channelT > 0) {
            this.channelT -= dt; this.channelTick -= dt;
            if (this.channelTick <= 0) { this.channelTick = 0.4; this.datUltTick(); }
            if (this.channelT <= 0) this.channelKind = '';
        } else if (this.channelKind === 'leanhult' && this.channelT > 0) {
            this.channelT -= dt; this.channelTick -= dt;
            if (this.channelTick <= 0) { this.channelTick = 0.5; this.leanhUltTick(); }
            if (this.channelT <= 0) this.channelKind = '';
        }
    }

    // THIÊN BĂNG ĐỊA LIỄN: mỗi nhịp một tầng sóng lan xa dần
    bmQuakeWave() {
        this.bmWave = (this.bmWave || 0) + 1;
        const w = this.bmWave;
        const r = [160, 240, 320][w - 1] || 320;
        const dmg = [30, 40, 55][w - 1] || 55;
        const opts = w === 3 ? { launch: 1.1 } : { slow: { amp: 0.45, dur: 1.4 }, slowR: r * 0.6 };
        FX.shock(this.x, this.y, r, w === 3 ? 'rgba(255,214,120,0.42)' : 'rgba(255,214,120,0.22)', 0.55);
        FX.ring(this.x, this.y, 14, r, w === 3 ? '#fff3b0' : '#ffe066', 0.5, 6);
        FX.crack(this.x, this.y, r * 0.72);
        FX.dust(this.x, this.y, 12 + w * 5);
        FX.burst(this.x, this.y - 6, 8 + w * 4, '#ffd93d', { speed: 200 + w * 40, life: 0.5, glow: true, size: 3.4 });
        Cam.shake(7 + w * 2);
        Sfx.slam();
        Game.aoeHit(this, this.x, this.y, r, dmg * this.dmgMul, opts);
        if (w === 3) {
            FX.flash('#ffd93d', 0.3);
            Cam.punch(0.06);
            FX.text(this.x, this.y - 74, 'THIÊN BĂNG!', '#fff3b0', 16);
        } else {
            FX.text(this.x, this.y - 60, 'SÓNG ' + w + '!', '#ffe066', 12);
        }
    }

    // XÍCH VẠN NĂNG: mỗi nhịp siết xích quanh tâm
    chainUltTick() {
        const R = 300;
        FX.ring(this.x, this.y - 10, R * 0.4, R * 1.02, '#ffd166', 0.3, 3);
        FX.runeBurst(this.x, this.y - 10, '#ffd166', 8, R * 0.9, 0.32);
        FX.runes(this.x, this.y - 10, '#ffe9a8', 2, 100, 0.6);
        Sfx.chain();
        Cam.shake(2.6);
        for (const en of Game.enemyTargets(this)) {
            const d = U.dist(en.x, en.y, this.x, this.y);
            if (d > R + en.r) continue;
            const a = U.angleTo(this.x, this.y, en.x, en.y) + U.rand(-0.5, 0.5);
            FX.chain(this.x + Math.cos(a) * R, this.y - 8 + Math.sin(a) * R * 0.8, en.x, en.y - 14, { color: '#ffd166', w: 4, sag: 10, life: 0.3 });
            FX.chain(this.x, this.y - 16, en.x, en.y - 14, { color: '#ffe9a8', w: 2.6, sag: 6, life: 0.26 });
            en.hurt(9 * this.dmgMul, this, { textC: '#ffe066', root: 0.35, sparkC: '#ffd166', slow: d < 190 ? { amp: 0.5, dur: 0.5 } : undefined });
            // kéo mạnh về tâm
            const pa = U.angleTo(en.x, en.y, this.x, this.y);
            en.x += Math.cos(pa) * 110; en.y += Math.sin(pa) * 110;
            World.clampEnt(en);
            FX.sparkHit(en.x, en.y - 12, '#ffd166', 3);
        }
    }

    chainUltEnd() {
        this.channelKind = '';
        FX.premiumShock(this.x, this.y, 300, '#ffd166');
        FX.flash('#ffd166', 0.25);
        FX.bolt(this.x - 220, this.y, this.x + 220, this.y, '#fff3c4', 0.25, 14);
        FX.bolt(this.x, this.y - 160, this.x, this.y + 160, '#fff3c4', 0.22, 12);
        FX.runeBurst(this.x, this.y - 10, '#ffd166', 20, 360, 0.7);
        Game.aoeHit(this, this.x, this.y, 300, 26 * this.dmgMul, { launch: 0.8, textC: '#ffe066', sparkC: '#ffd166' });
        Sfx.chainHit(); Sfx.slam();
        Cam.shake(14);
    }

    // ============================================================
    //  KỸ NĂNG RIÊNG CỦA TƯỚNG MỚI
    // ============================================================
    // QUÂN R — 3 nhát đao thần chẻ đôi chiến trường
    quanUltSlash() {
        const n = this.channelHits = (this.channelHits || 0) + 1;
        const ang = this.aim + (n === 1 ? -0.16 : n === 2 ? 0.16 : 0);
        const reach = 400 + n * 30;
        const dmg = (n === 1 ? 26 : n === 2 ? 32 : 42) * this.dmgMul;
        this.facing = Math.cos(ang) >= 0 ? 1 : -1;
        FX.slash(this.x, this.y - 14, ang, reach, 2.5, '#ffb066', 13);
        FX.slash(this.x, this.y - 14, ang + 0.12, reach * 0.86, 2.1, '#fff1c4', 6);
        FX.beam(this.x, this.y - 16, this.x + Math.cos(ang) * reach, this.y - 16 + Math.sin(ang) * reach, '#ff9f43', 10, 0.22);
        FX.bolt(this.x, this.y - 8, this.x + Math.cos(ang) * reach, this.y - 8 + Math.sin(ang) * reach, '#fff3c4', 0.18, 8);
        FX.burst(this.x + Math.cos(ang) * 40, this.y - 20, 14, '#ffb066', { speed: 260, life: 0.5, glow: true, size: 4 });
        FX.flash('#ff9f43', n === 3 ? 0.32 : 0.16);
        Cam.shake(n === 3 ? 13 : 8);
        Cam.punch(n === 3 ? 0.05 : 0.025);
        const hit = Game.lineHit(this, this.x, this.y, ang, reach, 74, dmg, {
            textC: '#ffd08a', sparkC: '#ffb066', isCrit: n === 3
        });
        // chảy máu + hồi máu theo sát thương
        for (const en of Game.enemyTargets(this)) {
            const t = this._lineT(en, ang, reach, 74);
            if (t !== null) en.addDot && en.addDot('bleed', 6 * this.dmgMul, 3, this);
        }
        if (hit > 0) this.heal(Math.round(hit * 0.18));
        Sfx.slash(); Sfx.slam();
        if (n === 3) {
            FX.crack(this.x + Math.cos(ang) * 180, this.y + Math.sin(ang) * 180, 120);
            FX.shock(this.x, this.y, 260, 'rgba(255,159,67,0.22)', 0.5);
            FX.ring(this.x, this.y - 10, 20, 300, '#ffd08a', 0.55, 7);
        }
    }

    // helper: hình chiếu mục tiêu lên đường chém (dùng cho hiệu ứng)
    _lineT(en, ang, range, halfW) {
        const dx = en.x - this.x, dy = en.y - this.y;
        const t = dx * Math.cos(ang) + dy * Math.sin(ang);
        if (t < -en.r || t > range + en.r) return null;
        const perp = Math.abs(-dx * Math.sin(ang) + dy * Math.cos(ang));
        return perp < halfW + en.r ? t : null;
    }

    // TRƯỜNG AN E — mưa tên
    arrowRainTick() {
        const R = 155;
        Game.aoeHit(this, this.channelX, this.channelY, R, 7 * this.dmgMul, {
            slow: { amp: 0.35, dur: 0.9 }, textC: '#ffc2ea', sparkC: '#ff6bd6'
        });
        FX.ring(this.channelX, this.channelY, 20, R, '#ff6bd6', 0.4, 4);
        FX.shock(this.channelX, this.channelY, R, 'rgba(255,107,214,0.14)', 0.35);
        for (let i = 0; i < 7; i++) {
            const a = U.rand(0, U.TAU), rr = Math.sqrt(Math.random()) * R;
            const tx = this.channelX + Math.cos(a) * rr, ty = this.channelY + Math.sin(a) * rr;
            FX.beam(tx - 30, ty - 240, tx, ty, '#ffb3e6', 2.5, 0.18);
            FX.sparkHit(tx, ty, '#ff8ad8', 3);
            if (U.chance(0.45)) FX.dust(tx, ty, 2, '#e8b98a');
        }
        Sfx.shoot();
    }

    // ĐẠT R — vòng tròn thiên địa hoàn vũ
    datUltTick() {
        const R = 205;
        Game.aoeHit(this, this.channelX, this.channelY, R, 10 * this.dmgMul, {
            slow: { amp: 0.4, dur: 0.8 }, textC: '#ffe0b0', sparkC: '#ffb86b'
        });
        // hồi máu + lá chắn cho bản thân và đồng đội trong vùng
        for (const f of Game.fighters) {
            if (!f || f.dead || f.team !== this.team) continue;
            if (U.dist(f.x, f.y, this.channelX, this.channelY) > R + f.r) continue;
            f.hp = Math.min(f.maxHp, f.hp + 4);
            if (f !== this) {
                f.shield = Math.max(f.shield || 0, 10);
                f.shieldT = Math.max(f.shieldT || 0, 1.2);
            }
            if (U.chance(0.5)) FX.sparkHit(f.x, f.y - 18, '#9be8a8', 2);
        }
        FX.ring(this.channelX, this.channelY, 30, R, '#ffb86b', 0.45, 4);
        FX.runeBurst(this.channelX, this.channelY - 8, '#ffd08a', 10, R * 0.75, 0.45);
        FX.runes(this.channelX, this.channelY - 8, '#ffe9c4', 2, R * 0.6, 0.7);
        FX.bolt(this.channelX, this.channelY - 190, this.channelX, this.channelY, '#ffe9c4', 0.18, 7);
        Sfx.cast();
    }

    // LÊ ANH R — thánh quang bất diệt
    leanhUltTick() {
        const R = 170;
        Game.aoeHit(this, this.x, this.y, R, 7 * this.dmgMul, {
            slow: { amp: 0.2, dur: 0.6 }, textC: '#d8ecff', sparkC: '#9ad0ff'
        });
        this.hp = Math.min(this.maxHp, this.hp + 3);
        FX.ring(this.x, this.y - 6, 24, R, '#9ad0ff', 0.42, 4);
        FX.ring(this.x, this.y - 6, R * 0.4, R * 0.95, '#e8f6ff', 0.3, 2);
        FX.burst(this.x, this.y - 26, 8, '#d8ecff', { speed: 150, life: 0.45, glow: true, size: 3 });
        Sfx.cast();
    }

    move(dt, mx, my) {
        this.isMoving = false;
        if (!canMove(this)) return;
        if (this.dashT > 0) return;
        const sp = this.speedNow();
        this.x += mx * sp * dt;
        this.y += my * sp * dt;
        if (Math.abs(mx) + Math.abs(my) > 0.05) {
            this.isMoving = true;
            this.walkT += dt * 2.6;
            if (Math.abs(mx) > 0.08) this.facing = mx > 0 ? 1 : -1;
            World.clampEnt(this);
            if (U.chance(dt * 5) && (Math.hypot(mx, my) > 0.5)) {
                FX.part(this.x - mx * 6, this.y, -mx * 20 + U.rand(-8, 8), -8 + U.rand(-12, 4), 0.4, 4, '#cbaa76', { type: 'smoke' });
            }
        } else {
            this.walkT = 0;
        }
    }

    // ---- tấn công cơ bản ----
    tryAttack(aimAng, target) {
        if (!canAct(this) || this.atkCd > 0) return false;
        const a = this.def.atk;
        this.atkCd = a.cd / (this.rageT > 0 ? 1.4 : 1);
        this.aim = aimAng;
        if (this.procedural) { this.facing = Math.cos(aimAng) >= 0 ? 1 : -1; }
        if (a.kind === 'ranged') {
            const off = 16;
            const sx = this.x + Math.cos(aimAng) * off, sy = this.y - 10 + Math.sin(aimAng) * 8;
            this.spawnProj(sx, sy, aimAng, a.speed, a.dmg * this.dmgMul, this.procedural ? '#3fa9ff' : this.def.color, 220, { beam: true });
            Sfx.shoot();
            FX.sparkHit(sx, sy, '#aee7ff', 3);
        } else if (a.kind === 'chain') {
            // XÍCH VẠN NĂNG: quất xích tầm xa hình quạt
            const ex = this.x + Math.cos(aimAng) * a.range;
            const ey = this.y - 10 + Math.sin(aimAng) * a.range * 0.72;
            FX.chain(this.x, this.y - 16, ex, ey, { color: '#ffd166', w: 3.6, sag: -8, life: 0.28, grow: 0.07 });
            FX.chain(this.x, this.y - 14, this.x + Math.cos(aimAng - 0.42) * a.range * 0.8, this.y - 18 + Math.sin(aimAng - 0.42) * a.range * 0.5, { color: '#ffe9a8', w: 2.5, sag: 12, life: 0.22 });
            FX.slash(this.x, this.y - 14, aimAng, a.range, a.arc, '#ffd166', 7);
            Game.meleeHit(this, this.x, this.y, aimAng, a.range, a.arc, a.dmg * this.dmgMul, { textC: '#ffe066', sparkC: '#ffd166' });
            Sfx.chain();
            if (U.chance(0.4)) FX.sparkHit(ex, ey, '#ffe9a8', 5);
        } else {
            // chém cận chiến: quét quạt
            this.swing(aimAng, a.range, a.arc, a.dmg * this.dmgMul, this.def.color);
            Sfx.slash();
        }
        this.addFury(5);
        return true;
    }

    swing(ang, range, arc, dmg, color) {
        FX.slash(this.x, this.y - 14, ang, range, arc, color, 8);
        Game.meleeHit(this, this.x, this.y, ang, range, arc, dmg, {});
        // Quân trong Cuồng Nộ: mỗi nhát chém gây chảy máu
        if (this.heroId === 'quan' && this.rageT > 0) {
            for (const en of Game.enemyTargets(this)) {
                const d = U.dist(en.x, en.y, this.x, this.y);
                if (d > range + en.r) continue;
                const aa = U.angleTo(this.x, this.y, en.x, en.y);
                if (Math.abs(U.angDiff(ang, aa)) < arc / 2 && en.addDot) en.addDot('bleed', 4 * this.dmgMul, 2.4, this);
            }
        }
    }

    // hất tung khu vực (Bình Minh Q/R)
    slam(r, dmg, launchPow, slowOpt, slowR) {
        FX.shock(this.x, this.y, r, 'rgba(255,214,120,0.28)', 0.45);
        FX.ring(this.x, this.y, 12, r, '#ffd27a', 0.4, 5);
        FX.crack(this.x, this.y, r * 0.8);
        FX.dust(this.x, this.y, 16);
        Cam.shake(12); Sfx.slam();
        const opts = { launch: launchPow };
        if (slowOpt) {
            opts.slow = slowOpt;
            opts.slowR = slowR === undefined ? r * 0.7 : slowR;
        }
        Game.aoeHit(this, this.x, this.y, r, dmg, opts);
    }

    spawnProj(sx, sy, ang, speed, dmg, color, life, opts) {
        Game.projectiles.push(new Proj(sx, sy, ang, speed, dmg * this.dmgMul, color, life, this, opts || {}));
    }

    // ---- kỹ năng ----
    castQ(aimAng, tgt) {
        if (this.cdQ > 0 || !canAct(this)) return false;
        this.cdQ = this.def.skills.Q.cd;
        this.addFury(10);
        if (this.heroId === 'binhan') {
            // LƯỚT TẤT
            if (this.procedural) this.facing = Math.cos(aimAng) >= 0 ? 1 : -1;
            this.dash(aimAng, 240, 720, { invuln: 0.3 });
            Sfx.dash();
        } else if (this.heroId === 'binhan2') {
            // XÍCH MÓC: phóng xích rồi kéo bản thân lao theo
            if (this.procedural) this.facing = Math.cos(aimAng) >= 0 ? 1 : -1;
            const sx = this.x, sy = this.y;
            const ex = this.x + Math.cos(aimAng) * 300, ey = this.y + Math.sin(aimAng) * 300;
            FX.chain(sx, sy - 16, ex, ey - 14, { color: '#ffd166', w: 4.6, sag: 16, life: 0.45, grow: 0.16 });
            FX.runeBurst(sx, sy - 10, '#ffd166', 8, 54, 0.5);
            FX.runes(sx, sy - 10, '#ffe9a8', 3, 34, 0.6);
            this.dash(aimAng, 300, 920, { invuln: 0.26, hitDmg: 18 * this.dmgMul, stun: 0.5, knockback: 130 });
            this.animName = 'dash'; this.animT = 0;
            Sfx.chain(); Sfx.dash();
            FX.flash('#ffd166', 0.09);
        } else if (this.heroId === 'binhminh') {
            // PHÁ ĐỊA TRỌNG KÍCH: đấm nứt đất lớn + VFX rực
            this.aim = aimAng; this.facing = Math.cos(aimAng) >= 0 ? 1 : -1;
            this.slam(160, 24 * this.dmgMul, 0.9, { amp: 0.5, dur: 1.6 }, 110);
            FX.slash(this.x, this.y - 16, aimAng, 76, 2.2, '#fff3b0', 7);
            FX.burst(this.x, this.y - 4, 20, '#ffe066', { speed: 240, life: 0.5, glow: true, size: 3.6 });
            FX.dust(this.x, this.y, 12);
            FX.flash('#ffd93d', 0.18);
            Cam.shake(6);
        } else if (this.heroId === 'annie') {
            // Khi Quyền: chưởng khí đẩy lùi
            this.aim = aimAng; this.animName = 'cast'; this.animT = 0;
            const px = this.x + Math.cos(aimAng) * 40, py = this.y + Math.sin(aimAng) * 40;
            FX.shock(px, py, 96, 'rgba(176,107,255,0.3)', 0.4);
            FX.ring(px, py, 8, 92, '#b06bff', 0.4, 4);
            Game.aoeHit(this, px, py, 100, 12 * this.dmgMul, { vxPush: 320 });
            Game.aoeHit(this, px, py, 46, 10 * this.dmgMul, {});
            Sfx.cast();
        } else if (this.heroId === 'quan') {
            // TRẢM PHONG: sóng đao xuyên thấu + chảy máu
            this.aim = aimAng; this.facing = Math.cos(aimAng) >= 0 ? 1 : -1;
            this.animName = 'atk'; this.animT = 0;
            const reach = 380;
            FX.slash(this.x, this.y - 14, aimAng, reach, 2.2, '#ffb066', 11);
            FX.slash(this.x, this.y - 14, aimAng + 0.1, reach * 0.9, 1.9, '#fff1c4', 5);
            FX.beam(this.x, this.y - 16, this.x + Math.cos(aimAng) * reach, this.y - 16 + Math.sin(aimAng) * reach, '#ff9f43', 8, 0.22);
            FX.shock(this.x + Math.cos(aimAng) * 90, this.y + Math.sin(aimAng) * 90, 70, 'rgba(255,159,67,0.2)', 0.35);
            FX.burst(this.x + Math.cos(aimAng) * 26, this.y - 18, 12, '#ffb066', { speed: 220, life: 0.42, glow: true, size: 3.4 });
            Cam.shake(5);
            const total = Game.lineHit(this, this.x, this.y, aimAng, reach, 46, 24 * this.dmgMul, {
                textC: '#ffd08a', sparkC: '#ffb066', bleed: { dps: 5 * this.dmgMul, dur: 3 }
            });
            if (total > 0) this.heal(Math.round(total * 0.15));
            Sfx.slash(); Sfx.shoot();
        } else if (this.heroId === 'nhathuy') {
            // ẢNH BƯỚC: dịch chuyển sau lưng mục tiêu gần nhất
            this.aim = aimAng; this.animName = 'dash'; this.animT = 0;
            const ox = this.x, oy = this.y;
            let best = null, bd = 420;
            for (const en of Game.enemyTargets(this)) {
                const d = U.dist(this.x, this.y, en.x, en.y);
                if (d < bd) { bd = d; best = en; }
            }
            let tx, ty;
            if (best) {
                const a = U.angleTo(this.x, this.y, best.x, best.y);
                tx = best.x + Math.cos(a) * (best.r + 20);
                ty = best.y + Math.sin(a) * (best.r + 20);
                FX.text(best.x, best.y - 52, 'ẢNH BƯỚC!', '#7dff9a', 12);
            } else {
                tx = this.x + Math.cos(aimAng) * 240;
                ty = this.y + Math.sin(aimAng) * 240;
            }
            this.x = U.clamp(tx, 20, World.size - 20);
            this.y = U.clamp(ty, 20, World.size - 20);
            World.clampEnt(this);
            this.invulnT = Math.max(this.invulnT, 0.25);
            this.shadowStrikeT = 2.2;
            this.facing = Math.cos(aimAng) >= 0 ? 1 : -1;
            for (let i = 0; i < 3; i++) {
                const gx = U.lerp(ox, this.x, i / 3), gy = U.lerp(oy, this.y, i / 3);
                FX.ring(gx, gy - 14, 6, 20 + i * 6, '#7dff9a', 0.35, 2.5);
                FX.part(gx, gy - 18, U.rand(-20, 20), U.rand(-30, -8), 0.45, 3, '#7dff9a', { glow: true });
            }
            FX.burst(this.x, this.y - 18, 14, '#7dff9a', { speed: 180, life: 0.4, glow: true, size: 3 });
            FX.slash(this.x, this.y - 14, aimAng, 46, 1.4, '#d8ffe4', 5);
            Sfx.dash(); Sfx.slash();
            Cam.shake(2);
        } else if (this.heroId === 'truongan') {
            // VỤT XUYÊN VÂN: cú vụt cầu lông xuyên thấu + đánh dấu
            this.aim = aimAng; this.facing = Math.cos(aimAng) >= 0 ? 1 : -1;
            this.animName = 'atk'; this.animT = 0;
            const reach = 560;
            FX.slash(this.x + Math.cos(aimAng) * 14, this.y - 14, aimAng, 60, 1.6, '#ffc2ea', 6);
            FX.beam(this.x, this.y - 12, this.x + Math.cos(aimAng) * reach, this.y - 12 + Math.sin(aimAng) * reach, '#ff6bd6', 4.5, 0.28);
            FX.beam(this.x, this.y - 12, this.x + Math.cos(aimAng) * reach, this.y - 12 + Math.sin(aimAng) * reach, '#ffe0f4', 1.6, 0.22);
            // cầu lông bay dọc theo đường vụt
            for (let i = 1; i <= 6; i++) {
                const t = i / 6;
                const cxp = this.x + Math.cos(aimAng) * reach * t;
                const cyp = this.y - 12 + Math.sin(aimAng) * reach * t;
                FX.part(cxp, cyp, U.rand(-16, 16), U.rand(-14, 2), 0.4, 3, i % 2 ? '#ffffff' : '#ff8ad8', { glow: true });
                if (i === 3) FX.ring(cxp, cyp, 5, 22, '#ffd6f2', 0.3, 2.5);
            }
            FX.flash('#ff6bd6', 0.08);
            Game.lineHit(this, this.x, this.y, aimAng, reach, 20, 26 * this.dmgMul, {
                textC: '#ffc2ea', sparkC: '#ff6bd6', vuln: { amp: 0.2, dur: 3 }
            });
            Sfx.shoot(); Sfx.pellet();
        } else if (this.heroId === 'dat') {
            // LÁ CHẮN: hấp thụ sát thương + giải khống chế
            this.aim = aimAng; this.animName = 'cast'; this.animT = 0;
            this.shield = Math.max(this.shield || 0, 65 + this.level * 8);
            this.shieldT = Math.max(this.shieldT || 0, 4);
            this.slowT = 0; this.slowAmt = 0; this.rootT = 0;
            FX.ring(this.x, this.y - 18, 10, 48, '#9be8a8', 0.5, 4);
            FX.ring(this.x, this.y - 18, 26, 38, '#c8ffd8', 0.35, 2);
            FX.burst(this.x, this.y - 24, 16, '#9be8a8', { speed: 130, life: 0.6, glow: true, size: 3 });
            FX.text(this.x, this.y - 54, 'LÁ CHẮN', '#9be8a8', 12);
            Sfx.cast(); Sfx.pick();
        } else if (this.heroId === 'leanh') {
            // HỘ THÂN: giảm sát thương + phản đòn
            this.aim = aimAng; this.animName = 'cast'; this.animT = 0;
            this.guardT = Math.max(this.guardT, 4);
            this.guardPct = Math.max(this.guardPct || 0, 0.4);
            this.guardReflect = 0.15;
            this.shield = Math.max(this.shield || 0, 40);
            this.shieldT = Math.max(this.shieldT || 0, 4);
            FX.ring(this.x, this.y - 14, 12, 50, '#9ad0ff', 0.5, 5);
            FX.ring(this.x, this.y - 14, 30, 42, '#e8f6ff', 0.32, 2);
            FX.runeBurst(this.x, this.y - 10, '#9ad0ff', 8, 44, 0.45);
            FX.text(this.x, this.y - 54, 'HỘ THÂN', '#9ad0ff', 12);
            Sfx.cast();
        }
        return true;
    }

    castE(aimAng) {
        if (this.cdE > 0 || !canAct(this)) return false;
        this.cdE = this.def.skills.E.cd;
        this.addFury(12);
        this.aim = aimAng;
        if (this.heroId === 'binhan') {
            // Mưa Đạn: 5 viên quạt, làm chậm
            for (let i = -2; i <= 2; i++) {
                const ang = aimAng + i * 0.14;
                this.spawnProj(this.x + Math.cos(ang) * 16, this.y - 10, ang, 420, 7, '#6fe2ff', 260, { slow: { amp: 0.45, dur: 1.5 } });
            }
            this.animName = 'atk'; this.animT = 0;
            Sfx.pellet();
            FX.sparkHit(this.x + Math.cos(aimAng) * 20, this.y - 10, '#aee7ff', 6);
        } else if (this.heroId === 'binhan2') {
            // XÍCH TRÓI: 3 sợi xích bắt mục tiêu gần nhất trong hình quạt
            const list = [];
            for (const e of Game.enemyTargets(this)) {
                const d = U.dist(e.x, e.y, this.x, this.y);
                if (d < 340 && Math.abs(U.angDiff(aimAng, U.angleTo(this.x, this.y, e.x, e.y))) < 1.0) list.push({ e, d });
            }
            list.sort((a, b) => a.d - b.d);
            const picks = list.slice(0, 3);
            if (!picks.length) {
                FX.chain(this.x, this.y - 16, this.x + Math.cos(aimAng) * 300, this.y - 10 + Math.sin(aimAng) * 220, { color: '#ffd166', w: 4, sag: 18, life: 0.4 });
                FX.runes(this.x + Math.cos(aimAng) * 300, this.y + Math.sin(aimAng) * 220, '#ffe9a8', 3, 24, 0.5);
                Sfx.chain();
            }
            for (const o of picks) {
                const e = o.e;
                FX.chain(this.x, this.y - 16, e.x, e.y - 14, { color: '#ffd166', w: 3.8, sag: 12, life: 0.42 });
                FX.ring(e.x, e.y - 10, 6, 34, '#ffd166', 0.4, 3);
                e.hurt(14 * this.dmgMul, this, { textC: '#ffe066', root: 1.1, sparkC: '#ffd166' });
                const a = U.angleTo(e.x, e.y, this.x, this.y);
                const pull = Math.min(90, o.d * 0.45);
                e.x += Math.cos(a) * pull; e.y += Math.sin(a) * pull;
                World.clampEnt(e);
                FX.chain(e.x, e.y - 14, this.x, this.y - 16, { color: '#ffe9a8', w: 2.4, sag: 8, life: 0.22 });
                FX.sparkHit(e.x, e.y - 14, '#ffd166', 4);
            }
            this.animName = 'atk'; this.animT = 0;
            Sfx.chainHit();
        } else if (this.heroId === 'binhminh') {
            // HỔ HẦU THIẾT BỐI: hút địch về phía mình + HỔ UY
            this.animName = 'cast'; this.animT = 0;
            let pulled = 0;
            for (const en of Game.enemyTargets(this)) {
                const d = U.dist(en.x, en.y, this.x, this.y);
                if (d < 260 + en.r) {
                    const a = U.angleTo(en.x, en.y, this.x, this.y);
                    const step = Math.min(d * 0.55, 175);
                    en.x += Math.cos(a) * step; en.y += Math.sin(a) * step;
                    World.clampEnt(en);
                    en.hurt(18 * this.dmgMul, this, { stun: 0.6, textC: '#ffe066', sparkC: '#ffd93d' });
                    pulled++;
                    FX.ring(en.x, en.y - 10, 6, 28, '#ffd93d', 0.35, 3);
                }
            }
            this.rageT = Math.max(this.rageT, 4);
            FX.ring(this.x, this.y - 16, 10, 250, '#ffd93d', 0.5, 6);
            FX.ring(this.x, this.y - 16, 40, 210, '#ffe9a8', 0.4, 4);
            FX.burst(this.x, this.y - 24, 24, '#ffd93d', { speed: 260, life: 0.55, glow: true, size: 3.6 });
            FX.text(this.x, this.y - 62, 'HỔ HẦU!', '#ffd93d', 15);
            Cam.shake(6);
            Sfx.growl(); Sfx.cast();
        } else if (this.heroId === 'annie') {
            this.spinT = 0.5; this.spinTick = 0; this.spinRadius = 115; this.spinDmg = 14 * this.dmgMul; this.spinPull = 120;
            this.spinKind = 'annie';
            this.animName = 'cast'; this.animT = 0;
            Sfx.cast();
        } else if (this.heroId === 'quan') {
            // CUỒNG NỘ: bùng nổ sức mạnh
            this.aim = aimAng; this.animName = 'cast'; this.animT = 0;
            this.rageT = Math.max(this.rageT, 4.5);
            this.shield = Math.max(this.shield || 0, 18);
            this.shieldT = Math.max(this.shieldT || 0, 4.5);
            FX.flash('#ff9f43', 0.14);
            FX.ring(this.x, this.y - 18, 12, 72, '#ff9f43', 0.5, 5);
            FX.ring(this.x, this.y - 18, 30, 54, '#ffe9c4', 0.35, 2);
            FX.burst(this.x, this.y - 26, 22, '#ff8a3d', { speed: 200, life: 0.6, glow: true, size: 3.6 });
            FX.text(this.x, this.y - 58, 'CUỒNG NỘ!', '#ff9f43', 14);
            Cam.shake(4);
            Sfx.growl(); Sfx.cast();
        } else if (this.heroId === 'nhathuy') {
            // ĐỘC NHẬN: 3 phi đao tẩm độc
            for (let i = -1; i <= 1; i++) {
                const ang = aimAng + i * 0.17;
                this.spawnProj(this.x, this.y - 12, ang, 520, 9 * this.dmgMul, '#8dff9a', 260, {
                    dagger: true, poison: { dps: 5 * this.dmgMul, dur: 3 }
                });
            }
            this.animName = 'toss'; this.animT = 0;
            FX.sparkHit(this.x + Math.cos(aimAng) * 18, this.y - 12, '#8dff9a', 8);
            FX.burst(this.x, this.y - 20, 10, '#7dff9a', { speed: 150, life: 0.35, glow: true, size: 2.6 });
            Sfx.slash(); Sfx.cast();
        } else if (this.heroId === 'truongan') {
            // BÃO TIỄN: mưa tên vùng chỉ định
            this.aim = aimAng; this.animName = 'cast'; this.animT = 0;
            const dist = 460;
            this.channelX = U.clamp(this.x + Math.cos(aimAng) * dist, 30, World.size - 30);
            this.channelY = U.clamp(this.y + Math.sin(aimAng) * dist, 30, World.size - 30);
            this.channelKind = 'arrowrain'; this.channelT = 2.4; this.channelTick = 0.34;
            FX.ring(this.channelX, this.channelY, 10, 155, '#ff6bd6', 0.55, 4);
            FX.runeBurst(this.channelX, this.channelY - 6, '#ff8ad8', 10, 120, 0.5);
            FX.beam(this.channelX, this.channelY - 300, this.channelX, this.channelY, '#ffb3e6', 7, 0.3);
            FX.text(this.channelX, this.channelY - 36, 'MƯA CẦU XOÁY', '#ff6bd6', 13);
            Sfx.cast(); Sfx.shoot();
        } else if (this.heroId === 'dat') {
            // TRÓI LINH HỒN: xích phép trói vùng chỉ định
            this.aim = aimAng; this.animName = 'cast'; this.animT = 0;
            const tx = U.clamp(this.x + Math.cos(aimAng) * 420, 30, World.size - 30);
            const ty = U.clamp(this.y + Math.sin(aimAng) * 420, 30, World.size - 30);
            FX.chain(this.x, this.y - 20, tx, ty - 12, { color: '#ffb86b', w: 4.2, sag: 26, life: 0.5, grow: 0.14 });
            for (let i = 0; i < 4; i++) {
                const a = i * U.TAU / 4 + 0.4;
                FX.chain(tx, ty - 12, tx + Math.cos(a) * 95, ty + Math.sin(a) * 60, { color: '#ffd08a', w: 3, sag: 12, life: 0.42 });
            }
            FX.ring(tx, ty - 10, 12, 135, '#ffb86b', 0.5, 4);
            FX.runeBurst(tx, ty - 10, '#ffd08a', 10, 90, 0.45);
            Game.aoeHit(this, tx, ty, 135, 15 * this.dmgMul, {
                textC: '#ffe0b0', sparkC: '#ffb86b', root: 1.2, slow: { amp: 0.45, dur: 2 }
            });
            Sfx.chain(); Sfx.chainHit();
            Cam.shake(3);
        } else if (this.heroId === 'leanh') {
            // XUNG KÍCH: lao tới, hất tung, nhận lá chắn
            this.dash(aimAng, 300, 760, { invuln: 0.18, hitDmg: 18 * this.dmgMul, stun: 0.35, knockback: 120 });
            this.dashShieldGain = 35;
            this.animName = 'charge'; this.animT = 0;
            FX.flash('#9ad0ff', 0.1);
            FX.ring(this.x, this.y - 14, 10, 46, '#9ad0ff', 0.4, 4);
            for (let i = 0; i < 6; i++) FX.part(this.x - Math.cos(aimAng) * i * 8, this.y - 12 - Math.sin(aimAng) * i * 8, -Math.cos(aimAng) * 80, -Math.sin(aimAng) * 80, 0.3, 3, '#9ad0ff', { glow: true });
            Sfx.dash(); Sfx.charge();
        }
        return true;
    }

    castR(aimAng) {
        if (this.cdR > 0 || !canAct(this)) return false;
        this.cdR = this.def.skills.R.cd;
        this.addFury(20);
        this.aim = aimAng;
        FX.flash(this.def.color, 0.35); Cam.shake(8);
        Cam.punch(0.06);
        Sfx.ult();
        if (this.heroId === 'binhan') {
            this.channelKind = 'minigun'; this.channelT = 3.0; this.channelTick = 0;
            this.animName = 'atk'; this.animT = 0;
            Game.announce('MINIGUN CUỒNG NỘ!', '#4dd7ff');
        } else if (this.heroId === 'binhan2') {
            // XÍCH VẠN NĂNG: thiên la địa võng
            this.channelKind = 'chainult'; this.channelT = 2.6; this.channelTick = 0;
            this.animName = 'cast'; this.animT = 0;
            FX.runeBurst(this.x, this.y - 10, '#ffd166', 18, 330, 1.0);
            FX.runes(this.x, this.y - 10, '#ffe9a8', 8, 70, 1.1);
            FX.premiumShock(this.x, this.y, 300, '#ffd166', { hitstop: false });
            Game.announce('XÍCH VẠN NĂNG — THIÊN LA ĐỊA VÕNG!', '#ffd166');
        } else if (this.heroId === 'binhminh') {
            // cú bật nhảy rồi ập xuống 3 tầng sóng
            this.launch(1.5);
            this.channelKind = 'quakePend'; this.channelT = 0.75;
            FX.runeBurst(this.x, this.y - 10, '#ffd93d', 16, 150, 0.8);
            FX.burst(this.x, this.y - 10, 18, '#ffe066', { speed: 220, life: 0.6, glow: true, size: 3.4 });
            Game.announce('THIÊN BĂNG ĐỊA LIỄN!', '#ffd93d');
        } else if (this.heroId === 'annie') {
            this.spinT = 4.2; this.spinTick = 0; this.spinRadius = 126; this.spinDmg = 11 * this.dmgMul; this.spinPull = 170;
            this.spinKind = 'annieUlt';
            this.animName = 'cast'; this.animT = 0;
            Game.announce('CỰ LỐC THIÊN DIỆT!', '#b06bff');
        } else if (this.heroId === 'quan') {
            // ĐAO THẦN CHI NỘ: 3 nhát chém khổng lồ
            this.channelKind = 'quanult'; this.channelT = 1.5; this.channelTick = 0; this.channelHits = 0;
            this.animName = 'atk'; this.animT = 0;
            FX.runeBurst(this.x, this.y - 10, '#ff9f43', 18, 170, 0.8);
            FX.runes(this.x, this.y - 10, '#ffe9c4', 6, 80, 0.9);
            FX.shock(this.x, this.y, 190, 'rgba(255,159,67,0.2)', 0.5);
            Cam.shake(9);
            Game.announce('ĐAO THẦN CHI NỘ!', '#ff9f43');
        } else if (this.heroId === 'nhathuy') {
            // VÔ ẢNH SÁT: lướt xuyên chiến trường, để lại tàn ảnh
            this.dash(aimAng, 440, 1500, { ghost: true, hitDmg: 32 * this.dmgMul, stun: 0.2, invuln: 0.35 });
            this.dashPoisonDps = 8 * this.dmgMul;
            this.dashPoisonDur = 3;
            this.dashExecute = true;
            this.animName = 'dash'; this.animT = 0;
            FX.flash('#7dff9a', 0.2);
            for (let i = 1; i <= 4; i++) {
                const a = aimAng;
                FX.ring(this.x + Math.cos(a) * i * 26, this.y - 16 + Math.sin(a) * i * 26, 6, 18, '#7dff9a', 0.4, 2);
            }
            Game.announce('VÔ ẢNH SÁT!', '#7dff9a');
        } else if (this.heroId === 'truongan') {
            // SMASH THIÊN THẦN: cú smash cầu lông xuyên toàn bản đồ
            this.aim = aimAng; this.animName = 'atk'; this.animT = 0;
            const reach = 1400;
            const ex = this.x + Math.cos(aimAng) * reach, ey = this.y + Math.sin(aimAng) * reach;
            FX.beam(this.x, this.y - 14, ex, ey, '#ff6bd6', 12, 0.4);
            FX.beam(this.x, this.y - 14, ex, ey, '#ffffff', 4, 0.3);
            FX.bolt(this.x, this.y - 14, ex, ey, '#ffc2ea', 0.3, 12);
            FX.slash(this.x, this.y - 14, aimAng, 80, 2.4, '#ffe0f4', 8);
            // quả cầu lông khổng lồ bay dọc đường smash
            for (let i = 1; i <= 8; i++) {
                const t = i / 8;
                FX.part(this.x + Math.cos(aimAng) * reach * t, this.y - 14 + Math.sin(aimAng) * reach * t, U.rand(-20, 20), U.rand(-20, 6), 0.5, 4.5, i % 2 ? '#ffffff' : '#ff6bd6', { glow: true });
            }
            FX.flash('#ff6bd6', 0.3);
            Cam.shake(12); Cam.punch(0.05);
            for (const en of Game.enemyTargets(this)) {
                const t = this._lineT(en, aimAng, reach, 34);
                if (t === null) continue;
                const dmg = (60 + (en.maxHp - en.hp) * 0.15) * this.dmgMul;
                en.hurt(dmg, this, { textC: '#ffd6f2', isCrit: true, sparkC: '#ff6bd6' });
                if (en.vulnT !== undefined) {
                    en.vulnT = Math.max(en.vulnT, 4);
                    en.vulnAmt = Math.max(en.vulnAmt || 0, 0.25);
                }
                FX.ring(en.x, en.y - 16, 6, 42, '#ff8ad8', 0.4, 3);
                FX.burst(en.x, en.y - 22, 12, '#ff6bd6', { speed: 180, life: 0.5, glow: true, size: 3 });
            }
            FX.ring(this.x, this.y - 10, 20, 110, '#ffc2ea', 0.5, 5);
            Sfx.ult(); Sfx.slam();
            Game.announce('SMASH THIÊN THẦN!', '#ff6bd6');
        } else if (this.heroId === 'dat') {
            // THIÊN ĐỊA HOÀN VŨ: vùng phép hồi máu + trói chân
            this.channelKind = 'datult'; this.channelT = 3.2; this.channelTick = 0.4;
            this.channelX = U.clamp(this.x + Math.cos(aimAng) * 120, 30, World.size - 30);
            this.channelY = U.clamp(this.y + Math.sin(aimAng) * 120, 30, World.size - 30);
            this.animName = 'cast'; this.animT = 0;
            FX.ring(this.channelX, this.channelY, 20, 205, '#ffb86b', 0.7, 6);
            FX.runeBurst(this.channelX, this.channelY - 10, '#ffd08a', 22, 170, 0.9);
            FX.runes(this.channelX, this.channelY - 10, '#ffe9c4', 8, 90, 1.0);
            FX.premiumShock(this.channelX, this.channelY, 205, '#ffb86b', { hitstop: false });
            Game.announce('THIÊN ĐỊA HOÀN VŨ!', '#ffb86b');
        } else if (this.heroId === 'leanh') {
            // BẤT DIỆT HỘ VỆ: miễn khống chế + thánh quang thiêu đốt
            this.unstoppableT = Math.max(this.unstoppableT, 4.5);
            this.guardT = Math.max(this.guardT, 4.5);
            this.guardPct = Math.max(this.guardPct || 0, 0.3);
            this.regenT = 4.5; this.regenAmt = 10;
            this.channelKind = 'leanhult'; this.channelT = 4.5; this.channelTick = 0.5;
            this.animName = 'cast'; this.animT = 0;
            FX.ring(this.x, this.y - 10, 20, 170, '#9ad0ff', 0.7, 6);
            FX.runeBurst(this.x, this.y - 10, '#e8f6ff', 20, 150, 0.9);
            FX.burst(this.x, this.y - 30, 26, '#d8ecff', { speed: 180, life: 0.8, glow: true, size: 3.4 });
            Game.announce('BẤT DIỆT HỘ VỆ!', '#9ad0ff');
        }
        return true;
    }

    dash(ang, dist, speed, opts) {
        opts = opts || {};
        this.dashT = dist / speed;
        this.dashDirX = Math.cos(ang); this.dashDirY = Math.sin(ang);
        this.dashSpeed = speed;
        this.dashHitSet = new Set();
        this.dashHitDmg = opts.hitDmg || 0;
        this.dashStun = opts.stun || 0;
        this.dashKnock = opts.knockback || 0;
        this.dashBleed = opts.bleed || null;
        this.aimDash = ang;
        this.invulnT = Math.max(this.invulnT, opts.invuln || 0);
    }

    // lướt chém: sát thương dọc đường đi
    dashHitAlong() {
        if (!this.dashHitDmg) return;
        for (const en of Game.enemyTargets(this)) {
            if (this.dashHitSet.has(en)) continue;
            if (U.dist2(en.x, en.y, this.x, this.y) < (en.r + 26) * (en.r + 26)) {
                this.dashHitSet.add(en);
                en.hurt(this.dashHitDmg, this, { textC: '#ff9d9d', stun: this.dashStun, launch: this.dashKnock ? 0.5 : undefined, vx: this.dashKnock ? Math.cos(this.aimDash || 0) * this.dashKnock : undefined });
                // Khải Kiệt Q: chảy máu song kiếm
                if (this.dashBleed && en.addDot) en.addDot('bleed', this.dashBleed.dps, this.dashBleed.dur, this);
                // Nhật Huy R: độc + xử tử mục tiêu yếu
                if (this.dashPoisonDps && en.addDot) en.addDot('poison', this.dashPoisonDps, this.dashPoisonDur || 3, this);
                if (this.dashExecute && !en.dead && en.hp > 0 && en.hp < en.maxHp * 0.25) {
                    en.hurt(en.maxHp * 0.15, this, { trueDmg: true, textC: '#c8ffd8', isCrit: true, sparkC: '#7dff9a' });
                    FX.text(en.x, en.y - 50, 'XỬ TỬ!', '#7dff9a', 14);
                }
                // Lê Anh E: mỗi mục tiêu trúng cho lá chắn
                if (this.dashShieldGain) {
                    const before = this.shield || 0;
                    this.shield = Math.min(105, before + this.dashShieldGain);
                    this.shieldT = Math.max(this.shieldT || 0, 4);
                    if (this.shield > before) {
                        FX.ring(this.x, this.y - 18, 8, 30, '#9be8a8', 0.35, 3);
                        FX.text(this.x, this.y - 48, '+' + Math.round(this.shield - before) + ' CHẮN', '#9be8a8', 11);
                    }
                }
                FX.slash(en.x, en.y - 14, U.angleTo(this.x, this.y, en.x, en.y) + U.rand(-0.4, 0.4), 40, 1.2, '#ffe9e9', 5);
            }
        }
    }

    spinHit(dt) {
        // Bão kiếm / lốc khí: sát thương tick + hút nhẹ
        const pull = this.spinPull || 0;
        for (const en of Game.enemyTargets(this)) {
            const d = U.dist(en.x, en.y, this.x, this.y);
            if (d < this.spinRadius + en.r) {
                en.hurt(this.spinDmg, this, { textC: '#fff3b0' });
                if (pull) {
                    const a = U.angleTo(en.x, en.y, this.x, this.y);
                    en.x += Math.cos(a) * pull * dt; en.y += Math.sin(a) * pull * dt;
                }
            }
        }
        // hiệu ứng
        if (this.spinKind === 'annie' || this.spinKind === 'annieUlt') FX.ring(this.x, this.y - 8, this.spinRadius * 0.4, this.spinRadius, '#b06bff', 0.2, 3);
    }

    minigunShot() {
        const base = this.aim + U.rand(-0.2, 0.2);
        this.spawnProj(this.x + Math.cos(base) * 18, this.y - 10, base, 720, 6, '#ffec9e', 200, {});
        if (this.procedural) this.facing = Math.cos(base) >= 0 ? 1 : -1;
        Sfx.pellet();
        FX.sparkHit(this.x + Math.cos(base) * 22, this.y - 10, '#ffe98a', 2);
        Cam.shake(0.7);
    }

    updateAnim(dt, moving) {
        if (this.procedural) return;
        let want = 'idle';
        if (this.dead) want = 'die';
        else if (this.dashT > 0) want = 'walk';
        else if (this.spinT > 0 || this.channelKind === 'minigun') want = 'atk';
        else if (this.channelKind === 'quakePend') want = 'atk';
        else if (this.atkCd > this.def.atk.cd * 0.45) want = this.def.atk.kind === 'ranged' ? (this.heroId === 'monk' ? 'atk' : 'atk') : 'atk';
        else if (moving) want = 'walk';
        if (this.heroId === 'annie' && ['cast'].includes(this.animName) && this.animT < 1.2 && !moving && !this.dead) want = this.animName;
        if (this.isElite) {
            want = moving ? 'walk' : (this.atkAnimT > 0 ? 'atk' : 'idle');
        }
        if (this.animName !== want) { this.animName = want; this.animT = 0; }
    }

    draw(ctx) {
        const liftZ = this.z || 0;
        // ---- LINH THÚ (NỘ): vẽ dưới chân tướng ----
        if (!this.dead && this.mountT > 0) this.drawMount(ctx);
        // bóng
        const shadowK = 1 - U.clamp(liftZ / 140, 0, 0.65);
        ctx.save();
        ctx.globalAlpha = 0.35 * shadowK;
        ctx.fillStyle = '#20140a';
        ctx.beginPath(); ctx.ellipse(this.x, this.y, this.r * 0.95, this.r * 0.42, 0, 0, U.TAU); ctx.fill();
        ctx.restore();
        // vòng chỉ huy (khi là người chơi)
        if (this === Game.player && !this.dead) {
            ctx.save();
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); ctx.lineDashOffset = -performance.now() / 50;
            ctx.beginPath(); ctx.ellipse(this.x, this.y, this.r + 5, (this.r + 3) * 0.5, 0, 0, U.TAU); ctx.stroke();
            ctx.restore();
        }
        // hào quang chọn tướng
        ctx.save();
        ctx.globalAlpha = 0.16 + Math.sin(this.t * 3) * 0.05;
        ctx.fillStyle = this.def.color;
        ctx.beginPath(); ctx.ellipse(this.x, this.y, this.r + 9, (this.r + 5) * 0.55, 0, 0, U.TAU); ctx.fill();
        ctx.restore();

        // hào quang trạng thái (Cuồng Nộ / Hộ Thân / Bất Diệt)
        if (!this.dead && (this.rageT > 0 || this.guardT > 0 || this.unstoppableT > 0)) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const pulse = 0.5 + Math.sin(this.t * 6) * 0.18;
            if (this.rageT > 0) {
                ctx.strokeStyle = '#ff9f43'; ctx.globalAlpha = pulse * 0.7; ctx.lineWidth = 2.6;
                ctx.beginPath(); ctx.ellipse(this.x, this.y + 2, 25, 9, 0, 0, U.TAU); ctx.stroke();
                ctx.globalAlpha = pulse * 0.22;
                ctx.fillStyle = '#ff7a2a';
                ctx.beginPath(); ctx.ellipse(this.x, this.y + 2, 30, 12, 0, 0, U.TAU); ctx.fill();
            }
            if (this.guardT > 0) {
                ctx.strokeStyle = '#9ad0ff'; ctx.globalAlpha = pulse * 0.65; ctx.lineWidth = 2.2;
                ctx.beginPath(); ctx.ellipse(this.x, this.y - 16, 22, 30, 0, 0, U.TAU); ctx.stroke();
            }
            if (this.unstoppableT > 0) {
                ctx.strokeStyle = '#fff3c4'; ctx.globalAlpha = pulse * 0.8; ctx.lineWidth = 2.4;
                ctx.beginPath(); ctx.ellipse(this.x, this.y + 1, 34, 12, 0, 0, U.TAU); ctx.stroke();
            }
            ctx.restore();
        }

        if (this.procedural) this.drawProcedural(ctx);
        else this.drawSheet(ctx);

        // thanh máu trên đầu
        if (!this.dead) {
            const topH = this.sheetKey ? Math.round(this.sheetScale * 335) : 58;
            const w = 38, h = 5;
            const bx = this.x - w / 2, by = this.y - topH - 14 - liftZ;
            ctx.save();
            ctx.fillStyle = 'rgba(10,10,14,0.65)';
            ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
            const pct = U.clamp(this.hp / this.maxHp, 0, 1);
            ctx.fillStyle = this === Game.player ? '#58e07a' : (pct > 0.55 ? '#67d94f' : pct > 0.25 ? '#e8c33a' : '#e0503a');
            ctx.fillRect(bx, by, w * pct, h);
            // thanh lá chắn
            if (this.shield > 0 && this.shieldT > 0) {
                const sp = U.clamp(this.shield / Math.max(20, this.maxHp * 0.55), 0, 1);
                ctx.fillStyle = '#9be8a8';
                ctx.fillRect(bx, by - 3, w * sp, 2);
            }
            ctx.font = '600 9px system-ui';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            if (this.isBot || this.showName) ctx.fillText(this.name, this.x, by - 3);
            ctx.restore();
            // trạng thái cc biểu tượng nhỏ
            let off = 0;
            if (this.slowT > 0) { this._ccIcon(ctx, this.x + off - 10, by - 22, '#7fc8ff', '❄'); off += 10; }
            if (this.rootT > 0) { this._ccIcon(ctx, this.x + off - 10, by - 22, '#9ae06a', '⛓'); off += 10; }
            if (this.stunT > 0) { this._ccIcon(ctx, this.x + off - 10, by - 22, '#ffd93d', '✦'); off += 10; }
            if (this.shield > 0 && this.shieldT > 0) { this._ccIcon(ctx, this.x + off - 10, by - 22, '#9be8a8', '◈'); off += 10; }
            if (this.rageT > 0) { this._ccIcon(ctx, this.x + off - 10, by - 22, '#ff9f43', '🔥'); off += 10; }
            if (this.guardT > 0) { this._ccIcon(ctx, this.x + off - 10, by - 22, '#9ad0ff', '✦'); off += 10; }
            if (this.dots && this.dots.some(d => d.kind === 'poison')) { this._ccIcon(ctx, this.x + off - 10, by - 22, '#8dff9a', '☠'); off += 10; }
            if (this.dots && this.dots.some(d => d.kind === 'bleed')) { this._ccIcon(ctx, this.x + off - 10, by - 22, '#ff7d6b', '🩸'); off += 10; }
        }
    }

    _ccIcon(ctx, x, y, color, ch) {
        ctx.save();
        ctx.font = '700 12px system-ui'; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(ch, x, y);
        ctx.fillStyle = color; ctx.fillText(ch, x, y);
        ctx.restore();
    }

    sprH() { return this.sheetKey ? Math.round(this.sheetScale * 335) : 58; }

    // ---- vẽ bằng sprite sheet (tự cắt cell) ----
    drawSheet(ctx) {
        if (!this.sheetKey) { this.drawFallback(ctx); return; }
        const set = SPR.ANIM[this.sheetKey];
        if (!set) { this.drawFallback(ctx); return; }
        const A = set[this.animName] || set.idle;
        const cellIdx = SPR.animAt(A, this.animT);
        const flip = this.facing < 0;
        const sc = this.sheetScale;
        // knock-up: nghiêng nhẹ khi bay
        const rot = this.knockT > 0 ? Math.sin(this.t * 20) * 0.15 : 0;
        const cellUse = (cellIdx === null || cellIdx === undefined) ? set.idle.cells[0] : cellIdx;
        this.cellIdx = cellUse;
        // nhún nhảy khi bước đi (rõ nhất ở Bình Minh) + lắc người nhẹ
        let stepY = 0, sway = 0;
        if (this.animName === 'walk' && !this.dead) {
            const ph = this.walkT * 8;
            const strength = this.sheetKey === 'boxer' ? 3.4 : 2.2;
            stepY = -Math.abs(Math.sin(ph)) * strength;
            sway = Math.sin(ph) * 0.045;
        }
        const drew = SPR.drawCell(ctx, this.sheetKey, cellUse, this.x, this.y - (this.z || 0) + stepY, sc, flip, 1, rot + sway);
        if (this.takeHitT > 0 && drew) {
            // nháy sáng khi trúng đòn
            SPR.drawCell(ctx, this.sheetKey, cellUse, this.x, this.y - (this.z || 0) + stepY, sc * 1.02, flip, 0.45, rot + sway);
        }
        if (!drew) this.drawFallback(ctx); // sheet chưa nạp → họa sĩ dự phòng
    }

    drawProcedural(ctx) { this.drawFallback(ctx); }

    // ---- Bình An: họa sĩ vector tự vẽ (khoan sử dụng sheet ngoài) ----
    drawFallback(ctx) {
        const v2 = this.heroId === 'binhan2';
        const hid = this.heroId;
        const isNew = hid === 'quan' || hid === 'nhathuy' || hid === 'truongan' || hid === 'dat' || hid === 'leanh';
        const c = this.def.color, c2 = this.def.color2 || '#123';
        const bob = this.animName === 'walk' || this.animName === 'dash' ? Math.sin(this.walkT * 5) * 2.2 : Math.sin(this.t * 2.4) * 1.2;
        const y = this.y - 17 - (this.z || 0) - 20;
        const x = this.x;
        ctx.save();
        const lean = this.animName === 'atk' ? 2 : 0;
        // chân
        ctx.strokeStyle = v2 ? '#4a3416' : (isNew ? c2 : '#1d3a52'); ctx.lineWidth = 4.5; ctx.lineCap = 'round';
        const lw = this.animName === 'walk' || this.dashT > 0 ? Math.sin(this.walkT * 9) : 0;
        ctx.beginPath(); ctx.moveTo(x - 3.5, y + 4); ctx.lineTo(x - 4 + lw * 3.6, y + 13); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 3.5, y + 4); ctx.lineTo(x + 4 - lw * 3.6, y + 13); ctx.stroke();
        // đạn body
        ctx.fillStyle = c; // áo xanh
        this._body(ctx, x, y - lean, 15, 17);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        this._body(ctx, x - 3, y - 3 - lean, 8, 9);
        // túi/đai
        ctx.fillStyle = v2 ? '#5a3a10' : (isNew ? c2 : '#123a4d');
        ctx.fillRect(x - 8, y + 1, 16, 3.4);
        // đầu
        ctx.fillStyle = '#f2c99a';
        ctx.beginPath(); ctx.arc(x, y - 16 - lean + bob * 0.4, 7.6, 0, U.TAU); ctx.fill();
        // mũ xanh
        ctx.fillStyle = c2;
        ctx.beginPath(); ctx.arc(x, y - 17.4 - lean + bob * 0.3, 7.2, Math.PI, U.TAU); ctx.fill();
        ctx.fillRect(x - 7.6, y - 17.6 - lean, 15.2, 2.4);
        // kính ngắm / mặt nạ vàng
        ctx.fillStyle = v2 ? '#ffe9a8' : (isNew ? '#f4f8ff' : '#d8f4ff');
        ctx.fillRect(x + this.facing * 1.4 - 5.5, y - 15.8, 5, 2.6);
        // mặt
        ctx.fillStyle = '#20303c';
        ctx.beginPath(); ctx.arc(x + this.facing * 3.4, y - 14.4, 1.1, 0, U.TAU); ctx.fill();
        // phụ kiện nhận diện từng tướng
        if (isNew) {
            if (hid === 'quan') {
                // băng đô + giáp vai cuồng đao
                ctx.fillStyle = '#ffcf7a';
                ctx.fillRect(x - 7.8, y - 19.4 - lean, 15.6, 2.2);
                ctx.fillStyle = '#d95d12';
                ctx.beginPath(); ctx.moveTo(x - 8, y - 19); ctx.lineTo(x - 16, y - 15 + bob); ctx.lineTo(x - 7, y - 15); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#8a3a08';
                ctx.beginPath(); ctx.arc(x - 8, y - 4, 3.6, 0, U.TAU); ctx.fill();
            } else if (hid === 'nhathuy') {
                // mũ trùm + khăn che mặt
                ctx.fillStyle = '#0d3b25';
                ctx.beginPath(); ctx.arc(x, y - 17.4 - lean + bob * 0.3, 8.2, Math.PI, U.TAU); ctx.fill();
                ctx.fillStyle = '#154d31';
                ctx.fillRect(x - 7.4, y - 16 - lean, 14.8, 4.2);
                ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 1.4;
                ctx.beginPath(); ctx.moveTo(x + this.facing * 7, y - 8); ctx.quadraticCurveTo(x - this.facing * 14, y - 4 + bob, x - this.facing * 20, y - 10 + bob); ctx.stroke();
            } else if (hid === 'truongan') {
                // mũ trùm thần tiễn + dải tóc
                ctx.fillStyle = '#5a0b3c';
                ctx.beginPath(); ctx.arc(x, y - 17.8 - lean + bob * 0.3, 8, Math.PI, U.TAU); ctx.fill();
                ctx.strokeStyle = '#ff9ad8'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(x - this.facing * 5, y - 12); ctx.quadraticCurveTo(x - this.facing * 18, y - 8 + bob, x - this.facing * 24, y - 15 + bob); ctx.stroke();
                ctx.fillStyle = '#ffd6f2';
                ctx.beginPath(); ctx.arc(x + this.facing * 5.2, y - 14.4, 1.2, 0, U.TAU); ctx.fill();
            } else if (hid === 'dat') {
                // mũ trùm hộ vệ + vòng lá
                ctx.fillStyle = '#4a2a08';
                ctx.beginPath(); ctx.arc(x, y - 17.6 - lean + bob * 0.3, 8.4, Math.PI, U.TAU); ctx.fill();
                ctx.strokeStyle = '#9be8a8'; ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.ellipse(x, y - 20 - lean, 10, 3.4, 0, 0, U.TAU); ctx.stroke();
                ctx.fillStyle = '#9be8a8';
                ctx.beginPath(); ctx.arc(x - 9, y - 20 - lean, 1.8, 0, U.TAU); ctx.fill();
                ctx.beginPath(); ctx.arc(x + 9, y - 20 - lean, 1.8, 0, U.TAU); ctx.fill();
            } else if (hid === 'leanh') {
                // mũ giáp hộ pháp + lông vũ
                ctx.fillStyle = '#1d4d70';
                ctx.beginPath(); ctx.arc(x, y - 17.8 - lean + bob * 0.3, 8.2, Math.PI, U.TAU); ctx.fill();
                ctx.fillStyle = '#e8f6ff';
                ctx.beginPath(); ctx.moveTo(x, y - 25 - lean); ctx.lineTo(x + 3.6, y - 19 - lean); ctx.lineTo(x - 3.6, y - 19 - lean); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#9ad0ff'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(x - 8, y - 3, 5, 0, U.TAU); ctx.stroke();
            }
        }
        // vũ khí: V1 súng trường / V2 xích quấn tay / tướng mới vũ khí riêng
        const aim = this.aim;
        if (isNew) {
            this.drawHeroWeapon(ctx, x, y, lean);
        } else {
        const gx = x + Math.cos(aim) * 10, gy = y - 12 + Math.sin(aim) * 6;
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(aim * (this.facing === -1 ? -1 : 1));
        if (v2) {
            // dây xích vàng phóng theo hướng ngắm
            ctx.strokeStyle = '#3a2408'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, 4, 26, -2); ctx.stroke();
            ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, 4, 26, -2); ctx.stroke();
            for (let i = 0; i <= 4; i++) {
                const s = i / 4;
                const cxp = (1 - s) * (1 - s) * 0 + 2 * (1 - s) * s * 14 + s * s * 26;
                const cyp = (1 - s) * (1 - s) * 0 + 2 * (1 - s) * s * 4 + s * s * -2;
                ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.arc(cxp, cyp, 2.2, 0, U.TAU); ctx.stroke();
            }
            if (this.atkCd > this.def.atk.cd * 0.62) {
                ctx.fillStyle = 'rgba(255,236,150,0.9)';
                ctx.beginPath(); ctx.arc(27, -2, 4.5 + Math.random() * 2, 0, U.TAU); ctx.fill();
            }
        } else {
            ctx.fillStyle = '#232c33';
            ctx.fillRect(0, -1.9, 19, 3.8);
            ctx.fillRect(3, 1, 4, 5);
            ctx.fillStyle = c;
            ctx.fillRect(13, -2.2, 6, 2.2);
            if (this.atkCd > this.def.atk.cd * 0.62) {
                ctx.fillStyle = 'rgba(255,230,122,0.95)';
                ctx.beginPath(); ctx.arc(21, 0, 5.5 + Math.random() * 2, 0, U.TAU); ctx.fill();
            }
        }
        ctx.restore();
        }
        // V2: vòng xích hộ thể + rune dưới chân
        if (v2) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let k = 0; k < 2; k++) {
                const rr = 22 + k * 7, ph = this.t * 2.2 + k * Math.PI;
                ctx.globalAlpha = 0.5 - k * 0.16;
                ctx.strokeStyle = k ? '#ffe9a8' : '#ffd166';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                for (let i = 0; i <= 22; i++) {
                    const aa = ph + i / 22 * U.TAU;
                    const px = x + Math.cos(aa) * rr, py = y - 2 + Math.sin(aa) * rr * 0.42;
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.stroke();
            }
            ctx.globalAlpha = 0.28 + 0.1 * Math.sin(this.t * 4);
            ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.ellipse(x, this.y + 2, 26, 9, 0, 0, U.TAU); ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }
    _body(ctx, x, y, w, h) {
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y + h / 2);
        ctx.quadraticCurveTo(x - w / 2 - 1.6, y - h / 2 - 2, x, y - h / 2 - 4);
        ctx.quadraticCurveTo(x + w / 2 + 1.6, y - h / 2 - 2, x + w / 2, y + h / 2);
        ctx.quadraticCurveTo(x, y + h / 2 + 2.6, x - w / 2, y + h / 2);
        ctx.closePath(); ctx.fill();
    }

    // vũ khí procedural riêng cho 5 tướng mở khoá
    // ---- vẽ linh thú cưỡi khi NỘ ----
    drawMount(ctx) {
        const c = this.def.color, t = this.t;
        const run = this.isMoving ? 1 : 0;
        const bob = Math.sin(t * (run ? 14 : 4)) * (run ? 2.6 : 1);
        ctx.save();
        ctx.translate(this.x, this.y + 2);
        ctx.scale(this.facing, 1);
        // hào quang
        ctx.globalAlpha = 0.25 + Math.sin(t * 6) * 0.08;
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0, 0, this.r + 12, (this.r + 6) * 0.55, 0, 0, U.TAU); ctx.fill();
        ctx.globalAlpha = 1;
        // 4 chân (chạy nhịp)
        ctx.strokeStyle = '#3a2814'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
            const ph = Math.sin(t * 14 + i * Math.PI * 0.9) * (run ? 6 : 0);
            const lx = i < 2 ? -9 : 9;
            ctx.beginPath(); ctx.moveTo(lx, -8); ctx.lineTo(lx + ph * 0.5, 4 + Math.abs(ph) * 0.2); ctx.stroke();
        }
        // thân
        const bg = ctx.createLinearGradient(0, -24, 0, 0);
        bg.addColorStop(0, c); bg.addColorStop(1, '#2a1a0c');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.ellipse(0, -12 + bob * 0.3, 16, 10, 0, 0, U.TAU); ctx.fill();
        // đuôi
        ctx.strokeStyle = c; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-14, -14 + bob * 0.3);
        ctx.quadraticCurveTo(-24, -18 + Math.sin(t * 9) * 3, -27, -10 + Math.sin(t * 9) * 4); ctx.stroke();
        // đầu + sừng
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.ellipse(15, -20 + bob * 0.3, 8, 6.5, -0.25, 0, U.TAU); ctx.fill();
        ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(13, -26 + bob * 0.3); ctx.quadraticCurveTo(16, -34, 21, -36); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(17, -25 + bob * 0.3); ctx.quadraticCurveTo(22, -31, 26, -31); ctx.stroke();
        // mắt phát sáng
        ctx.fillStyle = '#fff';
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath(); ctx.arc(18.5, -21 + bob * 0.3, 2.2, 0, U.TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }

    drawHeroWeapon(ctx, x, y, lean) {
        const hid = this.heroId;
        const aim = this.aim;
        const c = this.def.color, c2 = this.def.color2 || '#222';
        const swing = Math.max(0, this.atkCd - this.def.atk.cd * 0.62) / Math.max(0.01, this.def.atk.cd);
        ctx.save();
        ctx.translate(x + Math.cos(aim) * 9, y - 12 + Math.sin(aim) * 5 + (lean || 0) * 0.4);
        ctx.rotate(aim * (this.facing === -1 ? -1 : 1));
        ctx.lineCap = 'round';
        if (hid === 'quan') {
            // đại đao
            ctx.strokeStyle = '#3a2408'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(35, 0); ctx.stroke();
            ctx.strokeStyle = '#e9d7b0'; ctx.lineWidth = 5.2;
            ctx.beginPath(); ctx.moveTo(8, -1); ctx.lineTo(36, -1); ctx.stroke();
            ctx.strokeStyle = '#fff6df'; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(34, -2); ctx.stroke();
            ctx.fillStyle = '#8a3a08';
            ctx.fillRect(4, -4.2, 3.4, 8.4);
            ctx.fillStyle = '#ff9f43';
            ctx.beginPath(); ctx.arc(-6, 0, 2.6, 0, U.TAU); ctx.fill();
            if (swing > 0) {
                ctx.globalAlpha = 0.5 + swing * 0.4;
                ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 2.2;
                ctx.beginPath(); ctx.arc(12, 0, 30, -0.7, 0.7); ctx.stroke();
                ctx.globalAlpha = 1;
            }
        } else if (hid === 'nhathuy') {
            // song đao tẩm độc
            for (const s of [-1, 1]) {
                ctx.save(); ctx.rotate(s * 0.18);
                ctx.strokeStyle = '#1b3a29'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(-5, s * 2); ctx.lineTo(20, s * 2); ctx.stroke();
                ctx.strokeStyle = '#d8ffe4'; ctx.lineWidth = 2.2;
                ctx.beginPath(); ctx.moveTo(6, s * 2); ctx.lineTo(22, s * 2 - 2.5); ctx.stroke();
                ctx.restore();
            }
            ctx.fillStyle = '#7dff9a';
            if (this.atkCd > this.def.atk.cd * 0.6) {
                ctx.beginPath(); ctx.arc(24, -2, 3 + Math.random() * 2, 0, U.TAU); ctx.fill();
            }
        } else if (hid === 'truongan') {
            // VỢT CẦU LÔNG
            ctx.strokeStyle = '#3d2a1a'; ctx.lineWidth = 3.4;
            ctx.beginPath(); ctx.moveTo(-8, 3); ctx.lineTo(9, 0); ctx.stroke();
            ctx.strokeStyle = '#ff6bd6'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(19, -1, 10.5, 13.5, -0.22, 0, U.TAU); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,240,250,0.8)'; ctx.lineWidth = 1;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath(); ctx.moveTo(11, -1 + i * 4.4); ctx.lineTo(27, -1 + i * 4.4); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(19 + i * 3.4, -12); ctx.lineTo(19 + i * 3.4, 10); ctx.stroke();
            }
            if (swing > 0) {
                ctx.globalAlpha = 0.5 + swing * 0.4;
                ctx.strokeStyle = '#ffd6f2'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(14, 0, 24, -0.9, 0.9); ctx.stroke();
                ctx.globalAlpha = 1;
            }
        } else if (hid === 'dat') {
            // trượng lá + hồn phép
            ctx.strokeStyle = '#4a2a08'; ctx.lineWidth = 3.4;
            ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(30, -2); ctx.stroke();
            ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(-6, -0.6); ctx.lineTo(28, -1.6); ctx.stroke();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = '#9be8a8';
            ctx.beginPath(); ctx.arc(31, -2, 4.6 + Math.sin(this.t * 3) * 1.2, 0, U.TAU); ctx.fill();
            ctx.strokeStyle = '#c8ffd8'; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.ellipse(31, -2, 8, 3.4, 0.3, 0, U.TAU); ctx.stroke();
        } else if (hid === 'leanh') {
            // khiên thánh quang + búa
            ctx.save(); ctx.translate(9, 0);
            ctx.fillStyle = c2;
            ctx.beginPath(); ctx.ellipse(0, 0, 9, 13, 0, 0, U.TAU); ctx.fill();
            ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(0, 0, 7, 10.5, 0, 0, U.TAU); ctx.stroke();
            ctx.strokeStyle = '#9ad0ff'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
            ctx.restore();
            ctx.strokeStyle = '#3a4a58'; ctx.lineWidth = 3.6;
            ctx.beginPath(); ctx.moveTo(-15, 4); ctx.lineTo(26, -4); ctx.stroke();
            ctx.fillStyle = '#d8ecff';
            ctx.fillRect(22, -8, 7, 8);
        }
        ctx.restore();
    }
}

function xpNeed(lvl) { return 70 * lvl + 30; }

// ---------- [ĐẠN] ----------
class Proj {
    constructor(x, y, ang, speed, dmg, color, life, owner, opts) {
        this.x = x; this.y = y;
        this.vx = Math.cos(ang) * speed; this.vy = Math.sin(ang) * speed;
        this.dmg = dmg; this.color = color;
        this.life = (opts && opts.life) || life || 0.9;
        this.owner = owner; this.opts = opts || {};
        this.r = this.opts.dagger ? 7 : 4;
        this.dead = false;
        this.ang = ang;
    }
    update(dt) {
        this.life -= dt;
        if (this.life <= 0) { this.dead = true; return; }
        // chia bước nhỏ để không xuyên mục tiêu
        const steps = Math.max(1, Math.ceil(Math.hypot(this.vx, this.vy) * dt / 12));
        for (let s = 0; s < steps; s++) {
            const sdt = dt / steps;
            this.x += this.vx * sdt; this.y += this.vy * sdt;
            // chạm biên hoặc độ
            if (this.x < 0 || this.y < 0 || this.x > World.size || this.y > World.size) { this.dead = true; return; }
            // chạm chướng ngại vô hình: đá/cây cho xuyên? — đá chặn (đạn nổ)
            const blk = World.blockedSegment(this.x - this.vx * sdt, this.y - this.vy * sdt, this.x, this.y);
            if (blk && !this.opts.pierce) {
                FX.burst(this.x, this.y, 5, '#d8b98a', { speed: 90, life: 0.35, size: 3 });
                this.dead = true; return;
            }
            // trúng mục tiêu — dùng hitbox toàn thân (đầu/thân/chân đều tính)
            for (const en of Game.enemyTargets(this.owner)) {
                if (Game.hitBody(en, this.x, this.y, this.r)) {
                    this.hit(en); this.dead = true; return;
                }
            }
        }
    }
    hit(en) {
        const o = this.opts;
        const opts = { textC: o.dagger ? '#e9f4ff' : '#ffffff' };
        if (o.slow) opts.slow = o.slow;
        if (o.root) opts.root = o.root;
        // Nhật Huy: đòn đánh lên mục tiêu nhiễm độc +50%; Ảnh Bước buff đòn kế tiếp
        let dmg = this.dmg;
        const poisoned = en.dots && en.dots.some(d => d.kind === 'poison');
        if (this.owner && this.owner.heroId === 'nhathuy' && poisoned) {
            dmg *= 1.5;
            opts.textC = '#aaffc0';
        }
        if (this.owner && this.owner.shadowStrikeT > 0) {
            dmg *= 1.7;
            this.owner.shadowStrikeT = 0;
            opts.isCrit = true; opts.textC = '#d8ffe4'; opts.sparkC = '#7dff9a';
            FX.text(en.x, en.y - 46, 'ẢNH KÍCH!', '#7dff9a', 13);
            FX.flash('#7dff9a', 0.08);
        }
        if (o.poison && en.addDot) en.addDot('poison', o.poison.dps, o.poison.dur, this.owner);
        if (o.bleed && en.addDot) en.addDot('bleed', o.bleed.dps, o.bleed.dur, this.owner);
        if (o.vuln && en.vulnT !== undefined) {
            en.vulnT = Math.max(en.vulnT, o.vuln.dur);
            en.vulnAmt = Math.max(en.vulnAmt || 0, o.vuln.amp);
        }
        en.hurt(dmg, this.owner, opts);
        FX.burst(this.x, this.y, 6, this.color, { speed: 150, life: 0.3, size: 3, glow: true });
        FX.ring(this.x, this.y, 2, 14, this.color, 0.25, 2.5);
    }
    draw(ctx) {
        const o = this.opts;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        if (o.dagger) {
            ctx.translate(this.x, this.y); ctx.rotate(this.ang);
            ctx.fillStyle = '#e9f4ff';
            ctx.beginPath();
            ctx.moveTo(9, 0); ctx.lineTo(-5, -3); ctx.lineTo(-3, 0); ctx.lineTo(-5, 3);
            ctx.closePath(); ctx.fill();
        } else {
            // vệt đạn phát sáng
            const tx = this.x - this.vx * 0.05, ty = this.y - this.vy * 0.05;
            const g = ctx.createLinearGradient(tx, ty, this.x, this.y);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(1, o.slow ? '#9be8ff' : this.color);
            ctx.strokeStyle = g; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
            ctx.globalAlpha = 0.55;
            ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(this.x, this.y); ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.fillStyle = o.slow ? '#9be8ff' : this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, 3.2, 0, U.TAU); ctx.fill();
            ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.arc(this.x - this.vx * 0.012, this.y - this.vy * 0.012, 2.2, 0, U.TAU); ctx.fill();
            ctx.globalAlpha = 0.25;
            ctx.beginPath(); ctx.arc(this.x - this.vx * 0.03, this.y - this.vy * 0.03, 1.6, 0, U.TAU); ctx.fill();
        }
        ctx.restore();
        // vệtbridge đạn
        if (this.owner && this.owner.procedural && !o.dagger) {
            FX.part(this.x, this.y, U.rand(-6, 6), U.rand(-6, 6), 0.16, 1.6, this.color, { glow: true });
        }
    }
}

// ---------- [QUÁI] ----------
class Monster {
    constructor(kind, x, y) {
        this.kind = kind; // 'scorp' | 'brute' | 'dummy'
        this.r = kind === 'brute' ? 24 : kind === 'dummy' ? 15 : 13;
        this.x = x; this.y = y;
        this.dead = false;
        this.team = 'monster';
        this.isBot = false; this.isMonster = true;
        const cfg = {
            scorp: { hp: 32, speed: 80, dmg: 6, xp: 22, aggro: 240, atkCd: 1.15, color: '#c96a3c' },
            brute: { hp: 160, speed: 54, dmg: 16, xp: 95, aggro: 430, atkCd: 1.9, color: '#8a3b2a' },
            dummy: { hp: 55, speed: 0, dmg: 0, xp: 30, aggro: 0, atkCd: 9, color: '#c9574a' },
        }[kind];
        this.maxHp = cfg.hp; this.hp = cfg.hp;
        this.dmg = cfg.dmg; this.xp = cfg.xp; this.speed = cfg.speed; this.aggro = cfg.aggro;
        this.atkCdBase = cfg.atkCd; this.atkCd = 0;
        this.name = kind === 'brute' ? 'QUÁI TINH ANH' : kind === 'dummy' ? 'XÁNH MÔN' : 'BỌ CÁT';
        this.color = cfg.color;
        this.t = U.rand(0, 9);
        this.wanderA = U.rand(0, U.TAU);
        this.z = 0; this.vz = 0; this.knockT = 0; this.takeHitT = 0;
        this.animT = 0; this.animName = 'idle';
        this.sheetKey = kind === 'brute' ? 'brute' : kind === 'dummy' ? 'dummy' : '';
        this.sheetScale = kind === 'brute' ? 0.2 : kind === 'dummy' ? 0.3 : 0;
        this.procedural = kind === 'scorp';
        this.facing = 1;
        this.targetT = U.rand(0, 1.4);
        this.lungeT = 0;
        this.dmgDealt = 0; this.killCount = 0;
        this.slowK = 1; this.slowKT = 0;
        this.dots = []; this.vulnT = 0; this.vulnAmt = 0;
    }
    speedNow() { return this.speed * this.slowK; }
    setAnim(n) { if (this.animName !== n) { this.animName = n; this.animT = 0; } }
    hurt(amount, src, opts) {
        opts = opts || {};
        if (this.dead) return false;
        if (this.vulnT > 0) amount *= (1 + (this.vulnAmt || 0));
        if (src && !src.isMonster && !opts.silent) {
            FX.text(this.x + U.rand(-6, 6), this.y - 30 - (this.z || 0), String(Math.round(amount)), opts.textC || '#fff', 13);
        }
        if (src) { src.dmgDealt += amount; }
        this.hp -= amount;
        this.takeHitT = 0.14;
        if (src && src.lifesteal !== undefined) {
            const ls = (src.lifesteal || 0) + (src.rageT > 0 ? 0.25 : 0);
            if (ls > 0) src.hp = Math.min(src.maxHp, src.hp + amount * ls);
        }
        if (!opts.silent) { Sfx.hit(); FX.sparkHit(this.x, this.y - 14, '#ffdd55', 5); }
        if (src && src.isPlayer && !opts.silent) {
            if (amount >= 8) FX.comboAdd();
            if (amount >= 18) FX.hitstop(0.05);
        }
        if (opts.slow) { this.slowK = 0.5; this.slowKT = Math.max(this.slowKT, opts.slow.dur); } // quái bị làm chậm
        if (opts.root) { this.slowK = 0.05; this.slowKT = Math.max(this.slowKT, opts.root); }
        if (opts.launch) this.launch(opts.launch);
        if (this.hp <= 0) { this.hp = 0; this.die(src); return true; }
        return false;
    }
    addDot(kind, dps, dur, src) {
        if (this.dead) return;
        let dot = this.dots.find(d => d.kind === kind);
        if (!dot) { dot = { kind, dps: 0, t: 0, acc: 0, src }; this.dots.push(dot); }
        dot.dps = Math.max(dot.dps, dps);
        dot.t = Math.max(dot.t, dur);
        dot.src = src || dot.src;
    }
    tickDots(dt) {
        if (!this.dots.length) return;
        for (let i = this.dots.length - 1; i >= 0; i--) {
            const d = this.dots[i];
            d.t -= dt; d.acc += dt;
            while (d.acc >= 0.5 && d.t > -0.5) {
                d.acc -= 0.5;
                if (!this.dead) {
                    const col = d.kind === 'poison' ? '#8dff9a' : '#ff7d6b';
                    this.hurt(d.dps * 0.5, d.src, { silent: true });
                    FX.text(this.x + U.rand(-7, 7), this.y - 30, String(Math.round(d.dps * 0.5)), col, 11);
                }
            }
            if (d.t <= 0) this.dots.splice(i, 1);
        }
    }
    launch(power) {
        if (this.kind === 'brute') { /* quái tinh anh hất không bay — chỉ nhảy nhẹ */ power *= 0.5; }
        this.vz = 160 + power * 80;
        this.z = 0.01; this.knockT = 0.5 + power * 0.08;
    }
    die(src) {
        this.dead = true;
        FX.explosion(this.x, this.y, this.kind === 'brute' ? 1.3 : 0.6, this.color);
        FX.stain(this.x, this.y, 15, 'rgba(90,50,20,0.5)');
        if (src) {
            src.killCount++; src.gainXp(this.xp);
            if (src.isPlayer) Game.goldGain(this.kind === 'brute' ? 30 : this.kind === 'dummy' ? 8 : 12);
        }
        Sfx.die();
        // tinhorn mảnh nhỏ
        for (let i = 0; i < 5; i++) FX.part(this.x, this.y, U.rand(-100, 100), U.rand(-160, -40), 0.9, 3, this.color, { grav: 400 });
    }
    gainXp() { }

    update(dt) {
        this.t += dt;
        if (this.vulnT > 0) { this.vulnT -= dt; if (this.vulnT <= 0) this.vulnAmt = 0; }
        this.tickDots(dt);
        if (this.dead) return;
        if (this.takeHitT > 0) this.takeHitT -= dt;
        if (this.knockT > 0 || this.z > 0.0001) {
            this.knockT -= dt; this.vz -= 620 * dt; this.z += this.vz * dt;
            if (this.z <= 0) { this.z = 0; this.vz = 0; this.knockT = 0; FX.dust(this.x, this.y, 4); }
            return;
        }
        this.atkCd -= dt;
        if (this.slowKT > 0) { this.slowKT -= dt; if (this.slowKT <= 0) this.slowK = 1; }
        // chọn mục tiêu gần nhất (người chơi/bot)
        let tgt = null, bd = 1e9;
        for (const f of Game.fighters) {
            if (f.dead) continue;
            const d = U.dist(f.x, f.y, this.x, this.y);
            if (d < bd && d < this.aggro) { bd = d; tgt = f; }
        }
        if (tgt) {
            const a = U.angleTo(this.x, this.y, tgt.x, tgt.y);
            this.wanderA = a;
            // lunge khi đủ gần
            if (this.lungeT > 0) this.lungeT -= dt;
            const want = bd < (this.kind === 'brute' ? 52 : 30) ? 0 : 1;
            if (want) {
                const sp = this.speedNow();
                this.x += Math.cos(a) * sp * dt; this.y += Math.sin(a) * sp * dt;
            }
            if (bd < (this.kind === 'brute' ? 68 : 30) && this.atkCd <= 0) {
                this.attack(tgt, a);
            }
        } else {
            // đi lang thang
            this.wanderA += U.rand(-1, 1) * dt;
            if (this.speed > 0 && U.chance(dt * 0.4)) {
                this.x += Math.cos(this.wanderA) * this.speed * 0.35 * dt;
                this.y += Math.sin(this.wanderA) * this.speed * 0.35 * dt;
            }
        }
        World.clampEnt(this);
        // anim
        if (this.sheetKey) {
            this.setAnim(this.lungeT > 0 ? 'atk' : 'idle');
        }
        this.facing = Math.cos(this.wanderA) >= 0 ? 1 : -1;
    }
    attack(tgt, a) {
        this.atkCd = this.atkCdBase;
        if (this.kind === 'brute') {
            // chém búa ập xuống — quạt rộng, hất tung
            this.lungeT = 0.35;
            Game.eQueue.push({ t: 0.28, fn: () => {
                FX.shock(this.x, this.y, 90, 'rgba(255,150,90,0.3)', 0.4);
                FX.ring(this.x, this.y, 10, 86, '#ff9a5c', 0.35, 4);
                FX.crack(this.x, this.y, 70);
                Cam.shake(8); Sfx.slam();
                Game.aoeHit(this, this.x, this.y, 88, this.dmg, { launch: 0.9 });
            }});
        } else if (this.kind === 'dummy') {
            // dummy không tấn công
            return;
        } else {
            // bọ cát phun kẹt
            Game.projectiles.push(new Proj(this.x + Math.cos(a) * 10, this.y - 6, a, 260, this.dmg, '#7fae3a', 0.8, this, { spit: true }));
            Sfx.growl();
        }
    }
    draw(ctx) {
        const liftZ = this.z || 0;
        // bóng
        ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#20140a';
        ctx.beginPath(); ctx.ellipse(this.x, this.y, this.r, this.r * 0.44, 0, 0, U.TAU); ctx.fill();
        ctx.restore();
        // vète máu quái tinh anh
        if (this.takeHitT > 0) { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(this.x, this.y - 10, this.r * 0.9, 0, U.TAU); ctx.fill(); ctx.restore(); }
        if (this.procedural) this.drawScorp(ctx); else this.drawSheetMob(ctx);
        // thanh máu
        if (this.hp < this.maxHp) {
            const w = this.kind === 'brute' ? 52 : 30;
            const by = this.y - this.mobH() - 10 - liftZ;
            ctx.fillStyle = 'rgba(8,8,12,0.7)';
            ctx.fillRect(this.x - w / 2, by, w, 4.6);
            ctx.fillStyle = this.kind === 'brute' ? '#ff7a3c' : '#e0503a';
            ctx.fillRect(this.x - w / 2, by, w * U.clamp(this.hp / this.maxHp, 0, 1), 4.6);
            if (this.kind === 'brute') {
                ctx.font = '700 9px system-ui'; ctx.textAlign = 'center';
                ctx.fillStyle = '#ffb36b'; ctx.fillText('QUÁI TINH ANH', this.x, by - 4);
            }
        }
    }
    mobH() { return this.kind === 'brute' ? 142 : this.kind === 'dummy' ? 78 : 30; }
    drawSheetMob(ctx) {
        const set = SPR.ANIM[this.sheetKey];
        const A = set[this.animName] || set.idle;
        let idx = SPR.animAt(A, this.animT);
        if (idx === null || idx === undefined) idx = set.idle.cells[0];
        SPR.drawCell(ctx, this.sheetKey, idx, this.x, this.y - (this.z || 0), this.sheetScale, this.facing < 0, 1, 0);
        // hào quang tinh anh
        if (this.kind === 'brute') {
            ctx.save(); ctx.globalAlpha = 0.16 + Math.sin(this.t * 4) * 0.05;
            ctx.fillStyle = '#ff8a3c';
            ctx.beginPath(); ctx.ellipse(this.x, this.y, this.r + 6, (this.r + 3) * 0.55, 0, 0, U.TAU); ctx.fill();
            ctx.restore();
        }
    }
    drawScorp(ctx) {
        const a = this.wanderA;
        ctx.save();
        ctx.translate(this.x, this.y - (this.z || 0));
        ctx.rotate(a + Math.PI / 2);
        const t = this.t * 9;
        // 6 chân
        ctx.strokeStyle = '#7a4526'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        for (let i = -1; i <= 1; i++) {
            for (const s of [-1, 1]) {
                const w = Math.sin(t + i * 2 + (s > 0 ? 0 : Math.PI)) * 2.6;
                ctx.beginPath();
                ctx.moveTo(i * 4, s * 3);
                ctx.lineTo(i * 5 + w, s * 9);
                ctx.lineTo(i * 3 + w * 1.4, s * 13);
                ctx.stroke();
            }
        }
        // duôi cong + kim độc
        ctx.strokeStyle = '#8a4a28'; ctx.lineWidth = 3.4;
        ctx.beginPath(); ctx.moveTo(0, 6);
        ctx.quadraticCurveTo(7, 10, 8, 2);
        ctx.quadraticCurveTo(9, -4, 6, -8);
        ctx.stroke();
        ctx.fillStyle = '#e8b93a';
        ctx.beginPath(); ctx.arc(6, -9, 2.4, 0, U.TAU); ctx.fill();
        // thân
        ctx.fillStyle = '#c96a3c';
        ctx.beginPath(); ctx.ellipse(0, 0, 8.5, 10.5, 0, 0, U.TAU); ctx.fill();
        ctx.fillStyle = '#a24d26';
        ctx.beginPath(); ctx.ellipse(0, -5.5, 6, 5, 0, 0, U.TAU); ctx.fill();
        // càng trước
        ctx.strokeStyle = '#a24d26'; ctx.lineWidth = 2.6;
        const open = Math.sin(t * 0.5) * 2;
        ctx.beginPath(); ctx.moveTo(-3, -8); ctx.quadraticCurveTo(-6, -13, -5 - open, -16); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(3, -8); ctx.quadraticCurveTo(6, -13, 5 + open, -16); ctx.stroke();
        // mắt
        ctx.fillStyle = '#ffe8a0';
        ctx.beginPath(); ctx.arc(-2.2, -6.5, 1.1, 0, U.TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(2.2, -6.5, 1.1, 0, U.TAU); ctx.fill();
        ctx.restore();
    }
}

// ---------- [BOT AI] ----------
const BotBrain = {
    think(c, dt) {
        c.thinkT = (c.thinkT || 0) - dt;
        // BOT NỘ: full nộ + có địch gần → cưỡi linh thú
        if (c.fury >= 100 && c.mountT <= 0 && c.thinkT <= 0.02) c.activateFury();
        if (c.thinkT <= 0) {
            c.thinkT = 0.32 + U.rand(0, 0.2);
            // chọn mục tiêu
            let best = null, bd = 1e9;
            for (const f of Game.fighters) {
                if (f === c || f.dead) continue;
                const d = U.dist(f.x, f.y, c.x, c.y);
                const score = d - (f.hp < 30 ? 150 : 0);
                if (score < bd && d < 430) { bd = d; best = f; }
            }
            let tgtMon = null, md = 1e9;
            for (const m of Game.monsters) {
                if (m.dead) continue;
                const d = U.dist(m.x, m.y, c.x, c.y);
                if (d < md && d < 330) { md = d; tgtMon = m; }
            }
            c.tgtFighter = best;
            c.tgtMonster = best ? null : tgtMon;
            // trạng thái né bão
            c.outStorm = Storm.outside(c.x, c.y);
        }
        const tgt = c.tgtFighter || c.tgtMonster;
        let mx = 0, my = 0;
        if (c.outStorm) {
            const a = U.angleTo(c.x, c.y, Storm.cx, Storm.cy);
            mx = Math.cos(a); my = Math.sin(a);
        } else if (tgt) {
            const d = U.dist(tgt.x, tgt.y, c.x, c.y);
            const a = U.angleTo(c.x, c.y, tgt.x, tgt.y);
            const pref = c.heroId === 'binhan' ? 260 : c.heroId === 'binhan2' ? 120 :
                c.heroId === 'binhminh' ? 44 :
                c.heroId === 'quan' ? 52 : c.heroId === 'nhathuy' ? 70 : c.heroId === 'leanh' ? 50 :
                c.heroId === 'truongan' ? 380 : c.heroId === 'dat' ? 300 : 300;
            if (d > pref + 26) { mx = Math.cos(a); my = Math.sin(a); }
            else if (d < pref - 30 && c.heroId !== 'binhminh' && c.heroId !== 'quan' && c.heroId !== 'leanh') { mx = -Math.cos(a); my = -Math.sin(a); }
            // dịch ngang + né đạn
            mx += -Math.sin(a) * c.strafeDir * 0.7;
            my += Math.cos(a) * c.strafeDir * 0.7;
            c.strafeT = (c.strafeT || 0) - dt;
            if (c.strafeT <= 0) { c.strafeT = U.rand(0.7, 1.5); c.strafeDir = U.chance(0.5) ? 1 : -1; }
            // dùng kỹ năng đơn giản
            this.skills(c, tgt, d, a);
        } else {
            // đi về tâm bão
            const a = U.angleTo(c.x, c.y, Storm.cx + U.rand(-60, 60), Storm.cy);
            mx = Math.cos(a) * 0.5; my = Math.sin(a) * 0.5;
        }
        // tránh chướng ngại nhẹ: quét quanh
        for (const o of World.solids) {
            const d = U.dist(c.x, c.y, o.x, o.y);
            if (d < o.r + 42) {
                const aw = U.angleTo(o.x, o.y, c.x, c.y);
                mx += Math.cos(aw) * (1 - d / (o.r + 42)) * 1.6;
                my += Math.sin(aw) * (1 - d / (o.r + 42)) * 1.6;
            }
        }
        const m = Math.hypot(mx, my);
        if (m > 0.05) { mx /= m; my /= m; }
        c.move(dt, mx, my);
        if (m > 0.15) c.facing = mx > 0.05 ? 1 : (mx < -0.05 ? -1 : c.facing);
        // nhắm & bắn thường
        if (tgt && !tgt.dead) {
            const a = U.angleTo(c.x, c.y, tgt.x, tgt.y) + U.rand(-0.06, 0.06);
            const rng = c.def.atk.range;
            if (U.dist(tgt.x, tgt.y, c.x, c.y) < rng && U.chance(0.6)) c.tryAttack(a, tgt);
        }
    },
    skills(c, tgt, d, a) {
        if (!tgt || tgt.dead) return;
        const lowHp = c.hp < c.maxHp * 0.32;
        // Q
        if (c.cdQ <= 0 && U.chance(0.012)) {
            if (c.heroId === 'binhminh') { if (d < 110) c.castQ(a, tgt); }
            else if (c.heroId === 'binhan') { if (lowHp && U.chance(0.5)) c.castQ(a); }
            else if (c.heroId === 'binhan2') { if (d > 140 && d < 340) c.castQ(a, tgt); }
            else if (c.heroId === 'annie') { if (d < 130) c.castQ(a); }
            else if (c.heroId === 'quan') { if (d < 330) c.castQ(a); }
            else if (c.heroId === 'nhathuy') { if (d < 400) c.castQ(a); }
            else if (c.heroId === 'truongan') { if (d > 80 && d < 540) c.castQ(a); }
            else if (c.heroId === 'dat') { if (c.hp < c.maxHp * 0.75 || d < 240) c.castQ(a); }
            else if (c.heroId === 'leanh') { if (d < 260 || c.hp < c.maxHp * 0.55) c.castQ(a); }
        }
        // E
        if (c.cdE <= 0 && U.chance(0.008)) {
            if (c.heroId === 'binhan' && d < 330) c.castE(a);
            else if (c.heroId === 'binhan2' && d < 340) c.castE(a);
            else if (c.heroId === 'binhminh' && d > 90 && d < 250) c.castE(a);
            else if (c.heroId === 'dat' && d < 330) c.castE(a);
            else if (c.heroId === 'annie' && d < 140) c.castE(a);
            else if (c.heroId === 'quan' && d < 210) c.castE(a);
            else if (c.heroId === 'nhathuy' && d < 360) c.castE(a);
            else if (c.heroId === 'truongan' && d > 120 && d < 520) c.castE(a);
            else if (c.heroId === 'dat' && d < 420) c.castE(a);
            else if (c.heroId === 'leanh' && d > 80 && d < 300) c.castE(a);
        }
        // R — khi đủ gần / đủ tầm
        if (c.cdR <= 0 && U.chance(0.0035)) {
            let rng = 170;
            if (c.heroId === 'binhan') rng = 240;
            else if (c.heroId === 'binhan2') rng = 260;
            else if (c.heroId === 'quan') rng = 300;
            else if (c.heroId === 'nhathuy') rng = 360;
            else if (c.heroId === 'truongan') rng = 900;
            else if (c.heroId === 'dat') rng = 340;
            else if (c.heroId === 'leanh') rng = 200;
            if (d < rng) c.castR(a);
        }
    },
};
