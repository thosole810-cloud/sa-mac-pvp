// ============================================================
//  items.js — Hệ thống trang bị trong trận (giống Liên Quân)
//  Mỗi món nâng tối đa 3 cấp, giá tăng dần. Mua bằng vàng
//  kiếm được từ hạ gục quái/tướng + thu nhập thụ động.
// ============================================================
'use strict';

const ITEM_ORDER = ['boots', 'armor', 'sword', 'staff', 'vamp', 'ward'];

const ITEMS = {
    // 🟢 Giày: cơ động
    boots: {
        name: 'GIÀY THẦN TỐC', icon: '👟', base: 45, color: '#7dffb0',
        desc: '+22 tốc chạy mỗi cấp',
        apply(P, lvl, owner) { owner.speedBonus += 22; },
    },
    // 🔵 Giáp: trâu hơn
    armor: {
        name: 'GIÁP HỘ MỆNH', icon: '🛡️', base: 55, color: '#9ad0ff',
        desc: '+26 máu, +4% giảm sát thương mỗi cấp',
        apply(P, lvl, owner) {
            owner.maxHp += 26; owner.hp = Math.min(owner.maxHp, owner.hp + 26);
            owner.armorPct = Math.min(0.55, owner.armorPct + 0.04);
        },
    },
    // 🔴 Công: sát thương vật lý
    sword: {
        name: 'KIẾM SÁT THỦ', icon: '⚔️', base: 65, color: '#ff9d9d',
        desc: '+12% sát thương mỗi cấp',
        apply(P, lvl, owner) { owner.dmgMul += 0.12; },
    },
    // 🟣 Phép: sát thương + hồi chiêu
    staff: {
        name: 'TRƯỢNG PHÉP', icon: '🔮', base: 60, color: '#c9a0ff',
        desc: '+10% sát thương, -8% hồi chiêu mỗi cấp',
        apply(P, lvl, owner) {
            owner.dmgMul += 0.10;
            owner.cdRate = Math.min(0.4, owner.cdRate + 0.08);
        },
    },
    // 🩸 Hút máu
    vamp: {
        name: 'HUYẾT KIẾM', icon: '🩸', base: 70, color: '#ff6b81',
        desc: 'Hút 8% sát thương gây ra thành máu mỗi cấp',
        apply(P, lvl, owner) { owner.lifesteal = Math.min(0.35, owner.lifesteal + 0.08); },
    },
    // 💠 Kháng khống chế
    ward: {
        name: 'KHIÊN KIÊN CƯỜNG', icon: '💠', base: 50, color: '#ffe066',
        desc: '+18 máu, giảm 15% thời gian khống chế mỗi cấp',
        apply(P, lvl, owner) {
            owner.maxHp += 18; owner.hp = Math.min(owner.maxHp, owner.hp + 18);
            owner.ccResist = Math.min(0.5, owner.ccResist + 0.15);
        },
    },
};
