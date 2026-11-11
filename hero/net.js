// ============================================================
//  net.js — PVP ONLINE: kết nối WebSocket, phòng chơi, lobby
//  Host chạy mô phỏng gốc; client gửi input + nhận snapshot.
// ============================================================
'use strict';

const Net = {
    ws: null,
    role: '',            // '' | host | client
    id: '',
    code: '',
    seed: 1,
    players: [],
    hostId: '',
    latency: 0,
    connected: false,
    snap: null,
    lastSnapAt: 0,
    remotes: {},         // host: id -> input mới nhất
    remoteSeen: {},      // host: id -> Date.now()
    autoRoom: '',
    _pending: null,
    _pingTimer: null,
    _fxQueue: [],
    _fxHooked: false,
    _sndQueue: [],
    _sndHooked: false,
    _uiReady: false,
    _profile: { name: 'Chiến Binh', hero: 'binhan', form: 'v1' },
    // phần tử DOM
    nameEl: null, codeEl: null, statusEl: null, lobbyEl: null, listEl: null,
    startEl: null, waitEl: null, hintEl: null, roomCodeEl: null,

    // ---------------- kết nối ----------------
    connect() {
        if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) return;
        const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
        try {
            this.ws = new WebSocket(proto + location.host + '/ws');
        } catch (e) {
            this._status('KHÔNG MỞ ĐƯỢC WEBSOCKET', '#ff7a7a');
            return;
        }
        this.ws.onopen = () => {
            this.connected = true;
            if (this._pending) {
                const p = this._pending; this._pending = null;
                this.send(p);
            }
            clearInterval(this._pingTimer);
            this._pingTimer = setInterval(() => {
                if (this.connected) this.send({ t: 'ping', ts: Date.now() });
            }, 2000);
        };
        this.ws.onmessage = (ev) => {
            let m = null;
            try { m = JSON.parse(ev.data); } catch (e) { return; }
            this.onMessage(m);
        };
        this.ws.onerror = () => {
            if (!this.connected) this._status('KHÔNG KẾT NỐI ĐƯỢC SERVER', '#ff7a7a');
        };
        this.ws.onclose = () => {
            const was = this.connected;
            this.connected = false;
            clearInterval(this._pingTimer);
            this.ws = null;
            this.remotes = {};
            if (Game.mode === 'online' || Game.mode === 'online-client') {
                Game.onlineAbort('MẤT KẾT NỐI VỚI SERVER');
            } else if (was) {
                this._status('MẤT KẾT NỐI', '#ff7a7a');
            }
        };
    },

    send(obj) {
        if (!this.ws || this.ws.readyState !== 1) return false;
        try { this.ws.send(JSON.stringify(obj)); return true; } catch (e) { return false; }
    },

    // gửi hành động; nếu chưa mở kết nối thì chờ onopen
    _action(obj) {
        if (!this.send(obj)) {
            this._pending = obj;
            this.connect();
        }
    },

    profileData() {
        const name = ((this.nameEl && this.nameEl.value) || this._profile.name || 'Chiến Binh').trim().slice(0, 16) || 'Chiến Binh';
        try { localStorage.setItem('samac_net_name', name); } catch (e) { }
        return { name, hero: Game.selectedHero, form: Game.selectedForm };
    },

    createRoom() {
        const p = this.profileData();
        this._profile = p;
        this._status('ĐANG TẠO PHÒNG...', '#9fd0ff');
        this._action({ t: 'create', name: p.name, hero: p.hero, form: p.form });
    },

    joinRoom(code) {
        code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
        if (code.length !== 4) { this._status('MÃ PHÒNG PHẢI CÓ 4 KÝ TỰ', '#ff7a7a'); return; }
        const p = this.profileData();
        this._profile = p;
        this._status('ĐANG VÀO PHÒNG ' + code + '...', '#9fd0ff');
        this._action({ t: 'join', code, name: p.name, hero: p.hero, form: p.form });
    },

    startMatch(payload) {
        this.send({ t: 'start', payload });
    },

    sendInput(d) {
        if (this.role !== 'client') return;
        this.send({ t: 'input', d });
    },

    sendSnapshot(d) {
        if (this.role !== 'host') return;
        this.send({ t: 'snap', d });
    },

    sendEnd(d) {
        if (this.role !== 'host') return;
        this.send({ t: 'end', d });
    },

    leave(silent) {
        if (this.connected && this.role) this.send({ t: 'leave' });
        this._resetRoom();
        if (!silent) this._hideLobby();
    },

    _resetRoom() {
        this.role = '';
        this.code = '';
        this.players = [];
        this.hostId = '';
        this.remotes = {};
        this.remoteSeen = {};
        this.snap = null;
        this.lastSnapAt = 0;
        if (this.roomCodeEl) this.roomCodeEl.textContent = '----';
        this._hideLobby();
    },

    // ---------------- nhận tin ----------------
    onMessage(m) {
        switch (m.t) {
            case 'created':
                this.role = 'host';
                this.id = m.id;
                this.code = m.code;
                this.seed = m.seed || 1;
                this._status('ĐÃ TẠO PHÒNG — chờ bạn bè vào...', '#9ae06a');
                this._updateLobby();
                break;
            case 'joined':
                this.role = 'client';
                this.id = m.id;
                this.code = m.code;
                this.seed = m.seed || 1;
                this._status('ĐÃ VÀO PHÒNG ' + m.code, '#9ae06a');
                this._updateLobby();
                break;
            case 'room':
                this.code = m.room.code;
                this.hostId = m.room.hostId;
                this.players = m.room.players || [];
                this._updateLobby();
                break;
            case 'start':
                if (this.role !== 'host') {
                    this.snap = null;
                    Net.hideModal();
                    Game.startOnline(m.payload, false);
                }
                break;
            case 'input':
                if (this.role === 'host' && m.id) {
                    const prev = this.remotes[m.id] || {};
                    const d = m.d || {};
                    this.remotes[m.id] = {
                        mvx: +d.mvx || 0, mvy: +d.mvy || 0, mag: U.clamp(+d.mag || 0, 0, 1),
                        aim: +d.aim || 0, atk: d.atk ? 1 : 0,
                        q: !!d.q || !!prev.q, e: !!d.e || !!prev.e, r: !!d.r || !!prev.r,
                    };
                    this.remoteSeen[m.id] = Date.now();
                }
                break;
            case 'snap':
                this.snap = m.d;
                this.lastSnapAt = performance.now();
                break;
            case 'end':
                if (this.role !== 'host') Game.onlineEnd(m.d || {});
                break;
            case 'hostLeft':
                if (Game.mode === 'online-client' && Game.state !== 'over') Game.onlineAbort('CHỦ PHÒNG ĐÃ RỜI TRẬN');
                this._resetRoom();
                this._status('CHỦ PHÒNG ĐÃ RỜI', '#ff7a7a');
                break;
            case 'peerLeft':
                if (this.role === 'host') {
                    const f = Game.fighters.find(x => x.netId === m.id);
                    if (f) { f.isRemote = false; f.isBot = false; f._peerGone = true; f.dead = true; f.hp = 0; }
                    delete this.remotes[m.id];
                }
                break;
            case 'error':
                this._status(m.msg || 'CÓ LỖI', '#ff7a7a');
                break;
            case 'pong':
                if (m.ts) this.latency = Math.max(0, Math.min(9999, Date.now() - m.ts));
                break;
            case 'left':
                this._resetRoom();
                break;
            default: break;
        }
    },

    // ---------------- chụp VFX host -> client ----------------
    hookFx() {
        if (this._fxHooked || typeof FX === 'undefined') return;
        this._fxHooked = true;
        const names = ['ring', 'text', 'slash', 'crack', 'dust', 'burst', 'sparkHit', 'shock',
            'chain', 'bolt', 'beam', 'runeBurst', 'runes', 'flash', 'speedline', 'stain'];
        for (const n of names) {
            if (typeof FX[n] !== 'function') continue;
            const orig = FX[n];
            FX[n] = function (...args) {
                try {
                    Net._fxQueue.push({ k: n, a: args });
                    if (Net._fxQueue.length > 64) Net._fxQueue.splice(0, Net._fxQueue.length - 64);
                } catch (e) { }
                return orig.apply(this, args);
            };
        }
    },
    takeFx() {
        const q = this._fxQueue;
        this._fxQueue = [];
        return q;
    },

    hookSfx() {
        if (this._sndHooked || typeof Sfx === 'undefined') return;
        this._sndHooked = true;
        const names = ['hit', 'shoot', 'slash', 'chain', 'chainHit', 'die', 'pick', 'levelup',
            'launch', 'slam', 'growl', 'count', 'go', 'win', 'lose'];
        for (const n of names) {
            if (typeof Sfx[n] !== 'function') continue;
            const orig = Sfx[n];
            Sfx[n] = function (...args) {
                try {
                    Net._sndQueue.push(n);
                    if (Net._sndQueue.length > 24) Net._sndQueue.splice(0, Net._sndQueue.length - 24);
                } catch (e) { }
                return orig.apply(this, args);
            };
        }
    },
    takeSnd() {
        const q = this._sndQueue;
        this._sndQueue = [];
        return q;
    },

    // ---------------- UI ----------------
    initUI() {
        if (this._uiReady) return;
        this._uiReady = true;
        this.nameEl = document.getElementById('netName');
        this.codeEl = document.getElementById('netCode');
        this.statusEl = document.getElementById('netStatus');
        this.lobbyEl = document.getElementById('netLobby');
        this.listEl = document.getElementById('netPlayers');
        this.startEl = document.getElementById('netStart');
        this.waitEl = document.getElementById('netWait');
        this.hintEl = document.getElementById('netHint');
        this.roomCodeEl = document.getElementById('roomCode');
        try {
            const saved = localStorage.getItem('samac_net_name');
            if (saved && this.nameEl) this.nameEl.value = saved;
        } catch (e) { }

        const btnCreate = document.getElementById('netCreate');
        const btnJoin = document.getElementById('netJoin');
        const btnLeave = document.getElementById('netLeave');
        const btnClose = document.getElementById('netClose');
        const btnCopy = document.getElementById('netCopy');
        if (btnCreate) btnCreate.addEventListener('click', () => { Sfx.ensure(); this.createRoom(); });
        if (btnJoin) btnJoin.addEventListener('click', () => { Sfx.ensure(); this.joinRoom(this.codeEl ? this.codeEl.value : ''); });
        if (btnLeave) btnLeave.addEventListener('click', () => {
            this.leave();
            this._status('ĐÃ RỜI PHÒNG', '#cdbd9b');
        });
        if (btnClose) btnClose.addEventListener('click', () => this.closeModal());
        if (btnCopy) btnCopy.addEventListener('click', () => {
            const link = location.origin + '/hero.html?room=' + encodeURIComponent(this.code || '');
            try {
                navigator.clipboard.writeText(link).then(() => this._status('ĐÃ COPY LINK MỜI BẠN BÈ!', '#9ae06a'));
            } catch (e) { this._status('LINK: ' + link, '#cdbd9b'); }
        });
        if (this.startEl) this.startEl.addEventListener('click', () => {
            if (this.role !== 'host') return;
            Sfx.ensure();
            const payload = Game.buildOnlinePayload();
            this.startMatch(payload);
            this.hideModal();
            Game.startOnline(payload, true);
        });
        if (this.codeEl) this.codeEl.addEventListener('input', () => {
            this.codeEl.value = this.codeEl.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
        });
        if (this.nameEl) this.nameEl.addEventListener('change', () => {
            const p = this.profileData();
            this._profile = p;
            if (this.role && this.players.length) this.send({ t: 'profile', name: p.name, hero: p.hero, form: p.form });
        });

        // link mời ?room=XXXX
        try {
            const q = new URLSearchParams(location.search).get('room');
            if (q) {
                this.autoRoom = q.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
                if (this.codeEl) this.codeEl.value = this.autoRoom;
            }
        } catch (e) { }
        const isPublic = location.protocol === 'https:' ||
            !/^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
        if (this.hintEl && isPublic) {
            this.hintEl.textContent = '🌍 Link đã PUBLIC: gửi ' + location.origin + '/hero.html cho bạn bè — họ nhập mã phòng (hoặc bấm link mời có ?room=) để chơi chung.';
        }
        if (this.hintEl) {
            fetch('/__netinfo').then(r => r.json()).then(d => {
                if (isPublic) return;
                const ip = (d.ips && d.ips[0]) || location.hostname;
                this.hintEl.textContent = 'Bạn bè cùng mạng LAN mở: http://' + ip + ':' + d.port + '/hero.html (hoặc link mời có ?room=). Internet: cần mở cổng ' + d.port + ' / dùng tunnel.';
            }).catch(() => { });
        }
        this._updateLobby();
    },

    openModal() {
        this.initUI();
        const el = document.getElementById('onlineModal');
        if (el) el.classList.remove('hidden');
        this._updateLobby();
    },
    hideModal() {
        const el = document.getElementById('onlineModal');
        if (el) el.classList.add('hidden');
    },
    closeModal() {
        if (this.role) this.leave();
        this.hideModal();
    },

    _status(text, color) {
        if (!this.statusEl) return;
        this.statusEl.textContent = text || '';
        this.statusEl.style.color = color || '#cdbd9b';
    },

    _hideLobby() {
        if (this.lobbyEl) this.lobbyEl.classList.add('hidden');
    },

    _updateLobby() {
        if (!this.lobbyEl) return;
        if (!this.code) { this.lobbyEl.classList.add('hidden'); return; }
        this.lobbyEl.classList.remove('hidden');
        if (this.roomCodeEl) this.roomCodeEl.textContent = this.code;
        if (this.listEl) {
            this.listEl.innerHTML = '';
            this.players.forEach((p, i) => {
                const row = document.createElement('div');
                row.className = 'netPlayer' + (p.id === this.hostId ? ' host' : '');
                const hid = (p.hero === 'binhan' && p.form === 'v2') ? 'binhan2' : p.hero;
                const def = (typeof HEROES !== 'undefined' && HEROES[hid]) ? HEROES[hid] : null;
                const name = document.createElement('b');
                name.textContent = p.name || 'Chiến Binh';
                const meta = document.createElement('span');
                meta.textContent = (def ? def.name : hid) + (p.id === this.hostId ? ' · CHỦ PHÒNG' : '') + (p.id === this.id ? ' · BẠN' : '');
                row.appendChild(name); row.appendChild(meta);
                this.listEl.appendChild(row);
            });
        }
        const isHost = this.role === 'host';
        if (this.startEl) this.startEl.classList.toggle('hidden', !isHost);
        if (this.waitEl) {
            this.waitEl.classList.toggle('hidden', isHost);
            this.waitEl.textContent = isHost ? '' : 'Chờ chủ phòng bắt đầu trận...';
        }
        if (isHost) this._status('PHÒNG ' + this.code + ' — ' + Math.max(0, 6 - this.players.length) + ' slot trống (sẽ bù bot)', '#9ae06a');
        else this._status('ĐÃ VÀO PHÒNG ' + this.code, '#9ae06a');
        this._hideLobbyIfEmpty();
    },
    _hideLobbyIfEmpty() {
        if (this.lobbyEl && !this.code) this.lobbyEl.classList.add('hidden');
    },
};
