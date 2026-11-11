// ============================================================
//  net-p2p.js — ONLINE TRÊN WEB (GitHub Pages) dùng Trystero/WebRTC
//  Khi mở từ địa chỉ public (https, không phải localhost) sẽ tự dùng
//  P2P trực tiếp giữa các người chơi — không cần server riêng.
// ============================================================
'use strict';

const NetP2P = {
    lib: null,
    room: null,
    msgAction: null,
    selfId: '',
    _pingTimer: null,

    async load() {
        if (this.lib) return this.lib;
        const mod = await import('https://cdn.jsdelivr.net/npm/trystero@0.26.0/+esm');
        this.lib = mod;
        this.selfId = mod.selfId;
        return mod;
    },

    async join(roomId) {
        const lib = await this.load();
        this.leave();
        const room = lib.joinRoom({
            appId: 'sa-mac-sinh-tu',
            relayConfig: {
                urls: [
                    'wss://relay.damus.io',
                    'wss://nos.lol',
                    'wss://relay.primal.net',
                    'wss://relay.nostr.band',
                    'wss://nostr.mom',
                ],
            },
        }, roomId);
        this.room = room;
        const act = room.makeAction('msg');
        this.msgAction = act;
        act.onMessage = (data, ctx) => { try { Net._p2pRecv(data, ctx.peerId); } catch (e) { } };
        room.onPeerJoin = pid => { try { Net._p2pPeerJoin(pid); } catch (e) { } };
        room.onPeerLeave = pid => { try { Net._p2pPeerLeave(pid); } catch (e) { } };
        this._startPing();
        return room;
    },

    send(data, target) {
        if (!this.msgAction) return false;
        try {
            this.msgAction.send(data, target ? { target } : undefined);
            return true;
        } catch (e) { return false; }
    },

    leave() {
        if (this._pingTimer) { clearInterval(this._pingTimer); this._pingTimer = null; }
        if (this.room) {
            try { this.room.leave(); } catch (e) { }
            this.room = null;
            this.msgAction = null;
        }
    },

    _startPing() {
        clearInterval(this._pingTimer);
        this._pingTimer = setInterval(async () => {
            try {
                if (Net.role === 'client' && Net.hostId && this.room && this.room.ping) {
                    const ms = await this.room.ping(Net.hostId);
                    if (typeof ms === 'number') Net.latency = Math.max(0, Math.min(9999, Math.round(ms)));
                }
            } catch (e) { }
        }, 2500);
    },
};

// ---------- chỉ kích hoạt khi chạy trên web public (không phải localhost) ----------
(function () {
    const isLocal = /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname)
        || location.protocol === 'file:';
    if (isLocal) return; // giữ nguyên chế độ LAN/WebSocket khi chạy localhost

    Net.useP2P = true;

    const genCode = () => {
        const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let s = '';
        for (let i = 0; i < 4; i++) s += A[(Math.random() * A.length) | 0];
        return s;
    };

    Net.createRoom = async function () {
        const p = this.profileData();
        this._profile = p;
        this._status('ĐANG TẠO PHÒNG P2P...', '#9fd0ff');
        try { await NetP2P.load(); } catch (e) {
            this._status('KHÔNG TẢI ĐƯỢC P2P — kiểm tra mạng', '#ff7a7a');
            return;
        }
        const code = genCode();
        this.role = 'host';
        this.id = NetP2P.selfId;
        this.code = code;
        this.seed = (Math.random() * 2147483647 | 0) + 1;
        this.hostId = this.id;
        this.players = [Object.assign({ id: this.id }, p)];
        try { await NetP2P.join('samactu-' + code); } catch (e) {
            this._status('KHÔNG VÀO ĐƯỢC PHÒNG P2P', '#ff7a7a');
            return;
        }
        this._status('ĐÃ TẠO PHÒNG — chờ bạn bè vào...', '#9ae06a');
        this._updateLobby();
    };

    Net.joinRoom = async function (code) {
        code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
        if (code.length !== 4) { this._status('MÃ PHÒNG PHẢI CÓ 4 KÝ TỰ', '#ff7a7a'); return; }
        const p = this.profileData();
        this._profile = p;
        this._status('ĐANG VÀO PHÒNG ' + code + '...', '#9fd0ff');
        try { await NetP2P.load(); } catch (e) {
            this._status('KHÔNG TẢI ĐƯỢC P2P — kiểm tra mạng', '#ff7a7a');
            return;
        }
        this.role = 'client';
        this.id = NetP2P.selfId;
        this.code = code;
        this.seed = 1;
        try { await NetP2P.join('samactu-' + code); } catch (e) {
            this._status('KHÔNG VÀO ĐƯỢC PHÒNG P2P', '#ff7a7a');
            return;
        }
        NetP2P.send({ t: 'hello', name: p.name, hero: p.hero, form: p.form });
        this._status('ĐANG CHỜ CHỦ PHÒNG...', '#9fd0ff');
    };

    Net.startMatch = function (payload) {
        NetP2P.send({ t: 'start', payload });
    };

    Net.sendInput = function (d) {
        if (this.role !== 'client') return;
        NetP2P.send({ t: 'input', d }, this.hostId);
    };

    Net.sendSnapshot = function (d) {
        if (this.role !== 'host') return;
        NetP2P.send({ t: 'snap', d });
    };

    Net.sendEnd = function (d) {
        if (this.role !== 'host') return;
        NetP2P.send({ t: 'end', d });
    };

    Net.leave = function (silent) {
        if (NetP2P.room) {
            if (this.role === 'host') NetP2P.send({ t: 'hostLeft' });
            else if (this.role === 'client') NetP2P.send({ t: 'leave' });
        }
        NetP2P.leave();
        this._resetRoom();
        if (!silent) this._hideLobby();
    };

    // giữ nguyên logic reset cũ, chỉ thêm việc đóng phòng P2P
    const origReset = Net._resetRoom.bind(Net);
    Net._resetRoom = function () {
        NetP2P.leave();
        origReset();
    };

    // nhận tin P2P
    Net._p2pRecv = function (data, peerId) {
        if (!data || typeof data !== 'object') return;
        if (data.t === 'hello') {
            if (this.role === 'host') {
                if (!this.players.some(p => p.id === peerId)) {
                    this.players.push({ id: peerId, name: data.name, hero: data.hero, form: data.form });
                }
                NetP2P.send({ t: 'room', code: this.code, hostId: this.hostId, players: this.players });
                this._updateLobby();
            }
            return;
        }
        data.id = data.id || peerId;
        this.onMessage(data);
    };

    Net._p2pPeerJoin = function (peerId) {
        if (this.role === 'host') {
            NetP2P.send({ t: 'room', code: this.code, hostId: this.hostId, players: this.players }, peerId);
            this._updateLobby();
        }
    };

    Net._p2pPeerLeave = function (peerId) {
        if (this.role === 'host') {
            this.players = this.players.filter(p => p.id !== peerId);
            delete this.remotes[peerId];
            NetP2P.send({ t: 'room', code: this.code, hostId: this.hostId, players: this.players });
            this._updateLobby();
        } else if (peerId === this.hostId) {
            this.onMessage({ t: 'hostLeft' });
        }
    };

    // hint cho web public
    const origInitUI = Net.initUI.bind(Net);
    Net.initUI = function () {
        origInitUI();
        if (this.hintEl) {
            this.hintEl.textContent = '🌍 WEB P2P: bấm TẠO PHÒNG, gửi mã/link cho bạn bè — kết nối trực tiếp, không cần server.';
        }
    };
})();
