// ============================================================
//  sprites.js — Sprite DB: nạp & cắt (slice) sprite sheets
//  Mỗi sheet là 1 ảnh PNG thật (assets/...). Vì các sheet được
//  tạo tự động nên khung (cell) KHÔNG đều lưới — ta lưu sẵn
//  toạ độ từng cell (được trích bằng thuật toán connected
//  components trên kênh alpha) rồi "cắt" bằng drawImage.
//  Nếu ảnh chưa kịp nạp → tự vẽ procedural để game không trống.
// ============================================================
'use strict';

const SPR = (() => {
    const IMG = (p) => {
        const im = new Image();
        im.src = p;
        return im;
    };

    // ---------- bảng sheet: ảnh + toạ độ từng cell {x,y,w,h} ----------
    const SHEETS = {
        // "Đấu sĩ Bình Minh" — boxer mập găng đỏ (cartoon)
        boxer: {
            img: IMG('assets/characters/chubby/chubby_tank_spritesheet.png'),
            W: 1920, H: 1280,
            // flat: row0(7) + row1(6) + row2(4)
            cells: [
                { x: 39,   y: 86,  w: 236, h: 313 }, // 0
                { x: 312,  y: 86,  w: 236, h: 313 }, // 1
                { x: 586,  y: 86,  w: 236, h: 313 }, // 2
                { x: 850,  y: 86,  w: 236, h: 313 }, // 3
                { x: 1116, y: 86,  w: 236, h: 313 }, // 4
                { x: 1377, y: 86,  w: 236, h: 313 }, // 5
                { x: 1644, y: 86,  w: 236, h: 313 }, // 6
                { x: 62,   y: 490, w: 222, h: 331 }, // 7  guard đứng
                { x: 326,  y: 494, w: 234, h: 324 }, // 8  đấm g hook 1
                { x: 628,  y: 495, w: 234, h: 324 }, // 9  hook 2
                { x: 931,  y: 495, w: 317, h: 325 }, // 10 đấm dài (reach)
                { x: 1347, y: 498, w: 215, h: 323 }, // 11 thu tay
                { x: 1643, y: 491, w: 222, h: 331 }, // 12 guard
                { x: 113,  y: 925, w: 267, h: 276 }, // 13 xung phong蹲
                { x: 488,  y: 933, w: 345, h: 261 }, // 14 lao đi
                { x: 963,  y: 942, w: 351, h: 247 }, // 15 lao đấm
                { x: 1448, y: 940, w: 342, h: 248 }, // 16 lao tít
            ],
        },
        // "Sát thủ Khải Kiệt" — cô gái song đao (teal/dark)
        girl: {
            img: IMG('assets/vfx/impacts/ground_shockwave_vfx.png'),
            W: 1920, H: 1280,
            cells: [
                { x: 61,   y: 105, w: 161, h: 279 }, // 0 idle
                { x: 292,  y: 68,  w: 153, h: 355 }, // 1 idle 2
                { x: 495,  y: 80,  w: 206, h: 231 }, // 2 né thấp
                { x: 738,  y: 99,  w: 226, h: 320 }, // 3 lean dash
                { x: 986,  y: 100, w: 212, h: 292 }, // 4 chạy
                { x: 1228, y: 107, w: 199, h: 290 }, // 5 chạy lean
                { x: 1476, y: 78,  w: 132, h: 323 }, // 6蹲 thấp
                { x: 1654, y: 121, w: 209, h: 229 }, // 7 dash sâu
                { x: 36,   y: 492, w: 204, h: 329 }, // 8 chém 1
                { x: 259,  y: 527, w: 512, h: 292 }, // 9 (merged — tránh)
                { x: 796,  y: 512, w: 599, h: 304 }, // 10 (merged — tránh)
                { x: 1424, y: 511, w: 197, h: 303 }, // 11 chém X
                { x: 1673, y: 492, w: 204, h: 329 }, // 12 chém 3
                { x: 70,   y: 888, w: 150, h: 332 }, // 13 đứng thu đao
                { x: 283,  y: 936, w: 215, h: 275 }, // 14 dash teal
                { x: 548,  y: 932, w: 226, h: 279 }, // 15 dash tím
                { x: 782,  y: 934, w: 573, h: 262 }, // 16 (merged — tránh)
                { x: 1376, y: 933, w: 219, h: 265 }, // 17 idle góc
                { x: 1702, y: 888, w: 150, h: 332 }, // 18 idle thu
            ],
        },
        // "Pháp sư Annie Nâu" — thi Si/Fa sư tung qi (gi) trắng
        monk: {
            img: IMG('assets/characters/annie/annie_mage_spritesheet.png'),
            W: 2240, H: 1120,
            cells: [
                { x: 20,   y: 19,  w: 235, h: 354 }, // 0 idle
                { x: 292,  y: 25,  w: 232, h: 354 }, // 1 idle 2
                { x: 570,  y: 23,  w: 226, h: 349 }, // 2 đấm ra
                { x: 826,  y: 23,  w: 236, h: 344 }, // 3 bước
                { x: 1115, y: 23,  w: 232, h: 346 }, // 4 bước
                { x: 1399, y: 23,  w: 243, h: 346 }, // 5 bước
                { x: 1687, y: 23,  w: 241, h: 346 }, // 6 bước
                { x: 1981, y: 18,  w: 234, h: 355 }, // 7 idle
                { x: 7,    y: 796, w: 243, h: 305 }, // 8  tụ qi
                { x: 20,   y: 412, w: 239, h: 332 }, // 9 đánh
                { x: 265,  y: 792, w: 242, h: 309 }, // 10 tụ lốc
                { x: 290,  y: 404, w: 233, h: 340 }, // 11 sẵn sàng
                { x: 523,  y: 786, w: 266, h: 315 }, // 12 BÃO LỐC (cyclone)
                { x: 546,  y: 409, w: 227, h: 336 }, // 13 th từ
                { x: 794,  y: 410, w: 618, h: 700 }, // 14 (merged — tránh)
                { x: 1047, y: 409, w: 283, h: 337 }, // 15 kép chưởng 1
                { x: 1350, y: 409, w: 296, h: 336 }, // 16 kép chưởng 2
                { x: 1433, y: 762, w: 516, h: 350 }, // 17 (merged — tránh)
                { x: 1668, y: 412, w: 292, h: 333 }, // 18 tư thế
                { x: 1978, y: 412, w: 237, h: 333 }, // 19 nắm đấm
                { x: 1994, y: 761, w: 228, h: 344 }, // 20 idle ôn hoà
            ],
        },
        // "Quái tinh anh" — Gã mập vác búa gõ (cartoon)
        brute: {
            img: IMG('assets/characters/annie/annie_archer_spritesheet.png'),
            W: 3200, H: 800,
            cells: [
                { x: 4,    y: 374, w: 296, h: 424 }, // 0 vỗ búa thấp
                { x: 18,   y: 31,  w: 313, h: 329 }, // 1 giơ búa (windup)
                { x: 367,  y: 30,  w: 321, h: 767 }, // 2 IDLE full-body
                { x: 734,  y: 34,  w: 289, h: 336 }, // 3 búa chếch
                { x: 744,  y: 497, w: 294, h: 289 }, // 4 (đôi chân)
                { x: 1084, y: 43,  w: 406, h: 323 }, // 5 chồm tới
                { x: 1098, y: 502, w: 327, h: 285 }, // 6 (đôi chân)
                { x: 1451, y: 491, w: 316, h: 295 }, // 7 vung thấp
                { x: 1541, y: 50,  w: 240, h: 312 }, // 8 nấm phi
                { x: 1815, y: 496, w: 331, h: 296 }, // 9 chạm đất
                { x: 1844, y: 38,  w: 282, h: 337 }, // 10 giữ búa
                { x: 2194, y: 40,  w: 286, h: 340 }, // 11 bước
                { x: 2540, y: 38, w: 300, h: 343 },  // 12 bước nghiêng
                { x: 2880, y: 39,  w: 309, h: 331 }, // 13 idle 2
            ],
        },
        // "Trịnh tập dâu" — pixel boxer (thân ref / dummy luyện tập)
        dummy: {
            img: IMG('assets/characters/chubby/chubby_brawler_spritesheet.png'),
            W: 1920, H: 1280,
            cells: [
                { x: 46,   y: 135, w: 238, h: 98 },  // 0 nhãn "walk" (bỏ)
                { x: 344,  y: 40,  w: 215, h: 277 }, // 1
                { x: 569,  y: 40,  w: 216, h: 276 }, // 2
                { x: 796,  y: 40,  w: 208, h: 276 }, // 3
                { x: 1015, y: 40,  w: 208, h: 277 }, // 4
                { x: 1232, y: 40,  w: 214, h: 279 }, // 5
                { x: 1459, y: 40,  w: 215, h: 279 }, // 6
                { x: 1682, y: 40,  w: 218, h: 279 }, // 7
                { x: 18,   y: 441, w: 308, h: 116 }, // 8 nhãn "punch" (bỏ)
                { x: 365,  y: 340, w: 286, h: 606 }, // 9 merged
                { x: 705,  y: 343, w: 241, h: 302 }, // 10 thức đứng
                { x: 999,  y: 344, w: 557, h: 606 }, // 11 merged
                { x: 1612, y: 343, w: 259, h: 294 }, // 12 thức đấm
                { x: 94,   y: 742, w: 158, h: 105 }, // 13 nhãn "hit" (bỏ)
                { x: 756,  y: 657, w: 264, h: 289 }, // 14 đau
                { x: 1571, y: 649, w: 256, h: 298 }, // 15 hoảng
                { x: 14,   y: 1050, w: 315, h: 102 },// 16 nhãn "death" (bỏ)
                { x: 363,  y: 981, w: 288, h: 265 }, // 17 chết 1
                { x: 743,  y: 991, w: 273, h: 238 }, // 18 chết 2
                { x: 1124, y: 1011, w: 299, h: 246 },// 19 chết 3
                { x: 1496, y: 1006, w: 348, h: 247 },// 20 chết 4 (nằm)
            ],
        },
    };

    // ---------- bộ animation cho từng 单 vị ----------
    const ANIM = {
        boxer: {
            scale: 0.34, foot: 1.0,             // scale vẽ; foot = neo chân ở đáy cell
            idle:  { cells: [7, 12], fps: 1.6, loop: 1 },
            walk:  { cells: [0, 1, 2, 3, 4, 5, 6], fps: 9, loop: 1 },
            atk:   { cells: [8, 9, 10, 11], fps: 14, loop: 0, hit: 0.5 },
            charge:{ cells: [13, 14, 15], fps: 13, loop: 1 },
            die:   { cells: [], fps: 8, loop: 0 },
        },
        girl: {
            scale: 0.34,
            idle:  { cells: [0, 13, 1, 18], fps: 2.2, loop: 1 },
            walk:  { cells: [3, 4, 5, 7], fps: 9, loop: 1 },
            atk:   { cells: [8, 11, 12], fps: 15, loop: 0, hit: 0.4 },
            dash:  { cells: [7], fps: 10, loop: 1 },
            toss:  { cells: [2, 11], fps: 12, loop: 0, hit: 0.4 },
            die:   { cells: [], fps: 8, loop: 0 },
        },
        monk: {
            scale: 0.33,
            idle:  { cells: [0, 7, 20], fps: 1.4, loop: 1 },
            walk:  { cells: [3, 4, 5, 6], fps: 7.5, loop: 1 },
            atk:   { cells: [15, 16, 13], fps: 9, loop: 0, hit: 0.35 },
            cast:  { cells: [8, 10, 12], fps: 8, loop: 0, hit: 0.7 },
            die:   { cells: [], fps: 8, loop: 0 },
        },
        brute: {
            scale: 0.20,                        // cell lớn nên scale nhỏ
            idle:  { cells: [2, 13], fps: 1.2, loop: 1 },
            walk:  { cells: [11, 12], fps: 6.5, loop: 1 },
            atk:   { cells: [1, 0], fps: 5.5, loop: 0, hit: 0.65 },
            die:   { cells: [10, 3], fps: 3, loop: 0 },
        },
        dummy: {
            scale: 0.30,
            idle:  { cells: [1, 3, 5, 7], fps: 3, loop: 1 },
            walk:  { cells: [1, 3, 5, 7], fps: 6, loop: 1 },
            hurt:  { cells: [14, 15], fps: 7, loop: 0 },
            die:   { cells: [17, 18, 19, 20], fps: 7, loop: 0 },
        },
    };

    // ============================================================
    //  NẠP ẢNH (khi load xong → onLoad)
    // ============================================================
    let loaded = 0, total = Object.keys(SHEETS).length, done = false, fail = 0;
    function load(onDone) {
        for (const k in SHEETS) {
            const s = SHEETS[k].img;
            const tick = () => { if (loaded + fail >= total) finish(onDone); };
            // ảnh có thể đã nạp xong từ cache trước khi gắn handler
            if (s.complete) {
                if (s.naturalWidth > 0) loaded++; else { s.broken = true; fail++; }
                tick();
                continue;
            }
            s.onload = () => { loaded++; tick(); };
            s.onerror = () => { s.broken = true; fail++; tick(); };
        }
        // an toàn: timeout fallback
        setTimeout(() => { if (!done) finish(onDone); }, 12000);
    }
    function finish(onDone) {
        if (done) return;
        done = true;
        if (onDone) onDone(loaded, total);
    }
    function progress() { return (loaded + fail) / total; }
    function ready() { return done; }

    // ============================================================
    //  CẮT CELL + VẼ
    // ============================================================
    // vẽ 1 cell của sheet — xoay quanhanchor "chân"
    function drawCell(ctx, skey, ci, cx, fy, scale, flip, alpha, angle) {
        const sheet = SHEETS[skey];
        if (!sheet) return false;
        const c = sheet.cells[ci];
        if (!c || !sheet.img.complete || sheet.img.naturalWidth === 0) return false;
        ctx.save();
        if (alpha === undefined) alpha = 1;
        if (alpha < 1) ctx.globalAlpha = alpha;
        ctx.translate(cx, fy);
        if (angle) ctx.rotate(angle);
        if (flip) ctx.scale(-1, 1);
        ctx.scale(scale, scale);
        ctx.drawImage(sheet.img, c.x, c.y, c.w, c.h, -c.w / 2, -c.h, c.w, c.h);
        ctx.restore();
        return true;
    }

    // chạy animation: A={cells,fps,loop}; t = thời gian đã chạy
    // trả về frame cell index; nếu loop=0 và đã hết → null (dùng để knowing kết thúc)
    function animAt(A, t) {
        if (!A || !A.cells.length) return null;
        const fi = t * A.fps;
        if (A.loop) return A.cells[Math.floor(fi) % A.cells.length];
        if (fi >= A.cells.length - 1) return null; // đã phát xong
        return A.cells[Math.floor(fi)];
    }

    return { SHEETS, ANIM, load, progress, ready, drawCell, animAt };
})();
