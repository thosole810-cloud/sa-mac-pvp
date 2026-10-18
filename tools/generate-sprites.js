'use strict';
/* Main: sinh toàn bộ sprite vào public/assets/sprites/
   Chạy: node tools/generate-sprites.js */
const path = require('path');
const fs = require('fs');
const { CHARS, buildCharSheet } = require('./sprites-chars');
const C = require('./sprites-creatures');
const E = require('./sprites-env');

const ROOT = path.join(__dirname, '..', 'public', 'assets', 'sprites');
for (const d of ['chars', 'monsters', 'env']) fs.mkdirSync(path.join(ROOT, d), { recursive: true });

console.log('--- Sheet nhân vật (512x512, 2x2: idle x2 / run x2) ---');
for (const cfg of CHARS) {
  buildCharSheet(cfg).save(path.join(ROOT, 'chars', cfg.name + '.png'));
}

console.log('--- Quái & boss ---');
C.monsterT1().save(path.join(ROOT, 'monsters', 'monster_t1.png'));
C.monsterT2().save(path.join(ROOT, 'monsters', 'monster_t2.png'));
C.monsterT3().save(path.join(ROOT, 'monsters', 'monster_t3.png'));
C.dragonSprite().save(path.join(ROOT, 'monsters', 'dragon.png'));
C.spiderSprite().save(path.join(ROOT, 'monsters', 'spider.png'));
C.dummySprite().save(path.join(ROOT, 'monsters', 'dummy.png'));

console.log('--- Môi trường ---');
E.bgDesert().save(path.join(ROOT, 'env', 'bg_desert.png'));
for (let i = 0; i < 4; i++) E.rockVariant(i).save(path.join(ROOT, 'env', 'rock' + i + '.png'));
E.cactusSprite().save(path.join(ROOT, 'env', 'cactus.png'));
E.coinSprite().save(path.join(ROOT, 'env', 'coin.png'));
E.meatSprite().save(path.join(ROOT, 'env', 'meat.png'));

console.log('Hoàn tất! Sprite nằm trong public/assets/sprites/');
