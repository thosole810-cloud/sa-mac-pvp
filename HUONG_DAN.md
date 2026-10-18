# SA MẮC SINH TỬ — Bản Nâng Cấp Đồ Họa (Sprite v2)

Trọn bộ game đã được nâng cấp đồ họa: **21 sprite PNG chất lượng cao** thay cho hình vẽ thủ công, kèm hệ quản lý tài sản (Asset Manager) tự tải ảnh + tự quay về hình vẽ code cũ nếu thiếu ảnh (không bao giờ trắng màn hình).

---

## 1. Chạy game

```bash
npm install     # 1 lần duy nhất (cần internet)
node server.js  # rồi mở http://localhost:3000
```

Cần Node.js 18+ (đã thử trên Node 24).

## 2. Cấu trúc thư mục

```
sa-mac-sinh-tu-v2/
├── server.js                      # Server Express + Socket.IO (không đổi)
├── package.json
├── public/
│   ├── index.html                 # Game client — ĐÃ NHÚNG SPRITE
│   └── assets/sprites/
│       ├── chars/                 # 7 sheet nhân vật 512×512 (2×2 ô: idle×2 / chạy×2)
│       │   binh_an.png  binh_minh.png  khai_kiet.png
│       │   khoi_nguyen.png  annie_nau.png  nhat_huy.png  quan_hacker.png
│       ├── monsters/              # quái 3 tầng, rồng boss, nhện triệu hồi, bia tập (256×256)
│       │   monster_t1.png monster_t2.png monster_t3.png
│       │   dragon.png  spider.png  dummy.png
│       └── env/                   # nền cát 1024×1024, đá×4, xương rồng, xu, thịt rồng
│           bg_desert.png  rock0..3.png  cactus.png  coin.png  meat.png
└── tools/
    ├── sprite-lib.js              # Thư viện raster mini (PNG encoder + vẽ supersampling)
    ├── sprites-chars.js           # Chibi 7 tướng + sheet 2×2
    ├── sprites-creatures.js       # Quái / rồng / nhện / bia tập
    ├── sprites-env.js             # Sa mạc / đá / xương rồng / xu / thịt
    └── generate-sprites.js        # MAIN — chạy để sinh lại toàn bộ PNG
```

## 3. Sinh lại / thay sprite

```bash
node tools/generate-sprites.js   # vẽ lại toàn bộ PNG kể trên
```

Muốn dùng ảnh AI (DALL-E 3 / Midjourney) thay thế: làm theo file
`ASSET_PROMPTS_SA_MAC.md` (nằm ngoài, ở workspace gốc) — prompt đầy đủ + quy tắc kỹ thuật
(sheet 2×2 512×512, sprite quay mặt sang phải, nền trong suốt).

> **Sau khi thay bất kỳ ảnh nào:** tăng `ASSET_VER` trong `public/index.html`
> (dòng `const ASSET_VER = 'v1'` → `'v2'`) để phá cache trình duyệt.

## 4. Cách game nạp sprite (tóm tắt kỹ thuật)

- `SPRITE_FILES` (trong `index.html`) map **key → đường dẫn**: key nhân vật phải trùng
  chính xác `name` trong `CHAR_DATA` (kể cả dấu: `'BÌNH AN'`, `'KHÔI NGUYÊN'`…).
- `preloadAssets()` tải ngầm; `IMG[key]` chứa ảnh.
- `drawCharSprite(name, radius, animState, isMoving)` — cắt ô theo trạng thái
  (idle/chạy × 2 frame quay vòng) rồi vẽ vào canvas; gọi khi ctx đã `translate`+`rotate`.
- `drawEntitySprite(key, radius, mult, opts)` — cho quái/rồng/nhện/bia/đá…
- Mọi nơi vẽ đều có nhánh fallback về code cũ (`drawCharBody`, vẽ procedural…) khi `IMG` thiếu ảnh.
- Hiệu ứng kỹ năng (lửa, hố đen, slow-mo, screen-shake…) vẫn là code procedural — đẹp và mượt hơn ảnh tĩnh.

## 5. Đẩy lên GitHub + Render

```bash
git init
git add -A
git commit -m "Nang cap do hoa: sprite v2"
git remote add origin https://github.com/thosle810-cloud/sa-mac-pvp.git   # nếu chưa có remote
git push -f origin main      # Render tự deploy → chờ xong → Ctrl+F5 trang game
```

> Thư mục `node_modules` không cần commit (Render tự `npm install`).

## 6. Ghi chú

- Sprite sinh bằng thuật toán (renderer tự viết, supersampling ×3) — nhẹ (~90KB tổng), sắc nét, tải tức thì.
- Ảnh AI sinh từ prompt có thể thay 1-1 cùng tên file; game tự dùng khi có mặt trong thư mục.
- Bản quyền: ảnh do công cụ tự sinh → dùng thương mại thoải mái.
