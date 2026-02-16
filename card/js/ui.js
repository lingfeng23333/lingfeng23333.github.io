// ================================================================
// ui.js — UI Controller with Shame Pillar, Tombstone Danmaku, AI
// ================================================================

const UI = {
    screens: {}, selectedCard: null, danmakuTimers: [],

    init() {
        this.screens = {
            lobby: document.getElementById('screenLobby'),
            waiting: document.getElementById('screenWaiting'),
            game: document.getElementById('screenGame'),
            result: document.getElementById('screenResult')
        };
    },
    showScreen(name) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens[name].classList.add('active');
    },

    toast(message, type = 'info') {
        const c = document.getElementById('toastContainer');
        const el = document.createElement('div');
        el.className = 'toast ' + type;
        el.textContent = message;
        c.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    },

    // ── Waiting Room ───────────────────────────────────────────
    renderCharacterSelect(players) {
        const grid = document.getElementById('charSelectGrid');
        grid.innerHTML = '';
        const taken = {};
        if (players) Object.entries(players).forEach(([uid, p]) => { if (p.character) taken[p.character] = uid; });
        Object.values(CHARACTERS).forEach(ch => {
            const d = document.createElement('div');
            d.className = 'char-option' + (taken[ch.id] && taken[ch.id] !== GameEngine.myUID ? ' taken' : '') + (taken[ch.id] === GameEngine.myUID ? ' selected' : '');
            d.innerHTML = `<span class="char-emoji">${ch.emoji}</span><div class="char-name">${ch.name}</div><div class="char-title">${ch.title}</div>`;
            d.addEventListener('click', async () => { try { await GameEngine.selectCharacter(ch.id); UI.toast('选择了 ' + ch.name, 'success'); } catch (e) { UI.toast(e.message, 'error'); } });
            grid.appendChild(d);
        });
    },

    renderPlayersGrid(players) {
        const grid = document.getElementById('playersGrid');
        const uids = Object.keys(players || {});
        document.getElementById('playerCount').textContent = `(${uids.length}/8)`;
        grid.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const d = document.createElement('div');
            if (i < uids.length) {
                const uid = uids[i], p = players[uid], ch = p.character ? CHARACTERS[p.character] : null;
                d.className = 'player-slot filled' + (p.ready ? ' ready' : '');
                d.innerHTML = `<span class="player-emoji">${ch ? ch.emoji : '❓'}</span><div class="player-name">${p.name}${uid === GameEngine.myUID ? ' (你)' : ''}</div><div class="player-char">${ch ? ch.name : '未选择'}</div>${p.ready ? '<span class="ready-badge">READY</span>' : ''}`;
            } else { d.className = 'player-slot empty'; d.innerHTML = '<span style="color:var(--text-dim)">等待加入...</span>'; }
            grid.appendChild(d);
        }
        const rc = uids.filter(u => players[u].ready && players[u].character).length;
        const btn = document.getElementById('btnStartGame');
        btn.classList.toggle('hidden', !(GameEngine.isHost && uids.length >= 4));
        btn.disabled = rc < 4;
    },

    // ── Game Screen ────────────────────────────────────────────
    renderGameState(state, players) {
        if (!state) return;
        // Scores
        document.getElementById('scoreStarValue').textContent = state.starScore || 0;
        document.getElementById('scoreAbyssValue').textContent = state.abyssScore || 0;
        const starPct = ((state.starScore || 0) / state.scoreToWin) * 100;
        const abyssPct = ((state.abyssScore || 0) / state.scoreToWin) * 100;
        document.getElementById('scoreFillStar').style.width = Math.min(100, starPct) + '%';
        document.getElementById('scoreFillAbyss').style.width = Math.min(100, abyssPct) + '%';

        // DP
        document.getElementById('dpValue').textContent = state.dp || 0;
        const dpF = document.getElementById('dpFill');
        dpF.style.width = Math.min(100, state.dp || 0) + '%';
        if (state.dp >= 100) dpF.classList.add('climax');

        document.getElementById('roundDisplay').textContent = `ROUND ${state.round || 1}`;

        // Turn indicator
        const cUID = state.turnOrder[state.currentTurnIndex];
        const cChar = CHARACTERS[GameEngine.getPlayerCharacter(cUID)];
        document.getElementById('turnIndicator').innerHTML = `${cChar ? cChar.emoji : ''} <span class="turn-name">${GameEngine.getPlayerName(cUID)}</span> 的回合`;
        const banner = document.getElementById('yourTurnBanner');
        banner.classList.toggle('active', cUID === GameEngine.myUID);

        // Rosters
        this.renderRoster('rosterStar', 'star', state);
        this.renderRoster('rosterAbyss', 'abyss', state);

        // Shame Pillar (Feeder Board)
        this.renderShamePillar();

        // Battle Log
        this.renderBattleLog(state.log || []);

        // Hand
        this.renderHand(state);

        // AP
        const ms = state.playerStates[GameEngine.myUID];
        if (ms) document.getElementById('apDisplay').textContent = ms.ap;

        // Buttons
        const isMyTurn = cUID === GameEngine.myUID;
        document.getElementById('btnPlayCard').disabled = !isMyTurn || !this.selectedCard;
        document.getElementById('btnEndTurn').disabled = !isMyTurn;

        // Chain window
        this.renderChainWindow(state);

        // Tombstone Danmaku
        this.renderTombstones(state);

        if (state.finished) this.showResult(state);
    },

    renderRoster(containerId, team, state) {
        const container = document.getElementById(containerId);
        const title = container.querySelector('.roster-title');
        container.innerHTML = '';
        container.appendChild(title);
        if (!state.turnOrder) return;
        state.turnOrder.forEach(uid => {
            if (GameEngine.getPlayerTeam(uid) !== team) return;
            const ps = state.playerStates[uid];
            if (!ps) return;
            const ch = CHARACTERS[GameEngine.getPlayerCharacter(uid)];
            const nm = GameEngine.getPlayerName(uid);
            const isCur = state.turnOrder[state.currentTurnIndex] === uid;

            const d = document.createElement('div');
            d.className = 'roster-player' + (isCur ? ' current-turn' : '') + (!ps.alive ? ' dead' : '');

            // HP bar for individual HP
            const hpPct = Math.max(0, (ps.hp / ps.maxHP) * 100);

            // Buffs
            const bi = [];
            if (ps.buffs) {
                if (ps.buffs.crusade) bi.push('✟圣战');
                if (ps.buffs.sleeping || ps.buffs.deepSleep) bi.push('💤');
                if (ps.buffs.stunned) bi.push('💫');
                if (ps.buffs.polymorph) bi.push('🐑');
                if (ps.buffs.invincible) bi.push('🛡无敌');
                if (ps.buffs.frenzy) bi.push('🔥');
                if (ps.buffs.bleed) bi.push('🩸' + ps.buffs.bleed);
                if (ps.buffs.shame) bi.push('😢×' + ps.buffs.shame);
                if (ps.iaiStance) bi.push('⚔居合');
            }

            d.innerHTML = `
                <div class="rp-header">
                    <span class="rp-emoji${!ps.alive ? ' tombstone' : ''}">${ps.alive ? (ch ? ch.emoji : '') : '🪦'}</span>
                    <div class="rp-info">
                        <div class="rp-name">${nm}${uid === GameEngine.myUID ? ' (你)' : ''}${!ps.alive ? ' [阵亡]' : ''}</div>
                        <div class="rp-hp-bar"><div class="rp-hp-fill" style="width:${hpPct}%;background:${hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#fbbf24' : '#ef4444'}"></div></div>
                        <div class="rp-stats">HP:${ps.hp}/${ps.maxHP} ⚡AP:${ps.ap}${ps.shield ? ' 🛡' + ps.shield : ''} ☠×${ps.deaths || 0}</div>
                    </div>
                </div>
                ${bi.length ? `<div class="rp-buffs">${bi.join(' ')}</div>` : ''}
            `;

            // If dead, allow clicking for tombstone message
            if (!ps.alive) {
                d.classList.add('tombstone-player');
                d.addEventListener('click', () => this.showTombstoneMessages(uid));
            }

            container.appendChild(d);
        });
    },

    // ── Shame Pillar ───────────────────────────────────────────
    renderShamePillar() {
        const container = document.getElementById('shamePillar');
        const feeders = GameEngine.getFeederBoard();
        const list = container.querySelector('.shame-list');
        list.innerHTML = '';
        if (feeders.length === 0) {
            list.innerHTML = '<div class="shame-empty">暂无送头选手</div>';
            return;
        }
        feeders.forEach((f, i) => {
            const ch = CHARACTERS[GameEngine.getPlayerCharacter(f.uid)];
            const d = document.createElement('div');
            d.className = 'shame-entry' + (i === 0 ? ' top-feeder' : '');
            d.innerHTML = `
                <span class="shame-rank">${i === 0 ? '👑' : '#' + (i + 1)}</span>
                <span class="shame-avatar${i === 0 ? ' shame-frame' : ''}">${ch ? ch.emoji : '?'}</span>
                <span class="shame-name">${f.name}</span>
                <span class="shame-deaths">☠×${f.deaths}</span>
                <span class="shame-score">送${f.deaths * 10}分</span>
            `;
            list.appendChild(d);
        });
    },

    // ── Tombstone Danmaku ──────────────────────────────────────
    showTombstoneMessages(uid) {
        const overlay = document.getElementById('tombstoneOverlay');
        const ch = CHARACTERS[GameEngine.getPlayerCharacter(uid)];
        const nm = GameEngine.getPlayerName(uid);
        document.getElementById('tombstoneTarget').textContent = nm;
        const btns = document.getElementById('tombstoneButtons');
        btns.innerHTML = '';
        TOMBSTONE_MESSAGES.forEach(msg => {
            const b = document.createElement('button');
            b.className = 'tombstone-msg-btn';
            b.textContent = msg;
            b.addEventListener('click', () => {
                GameEngine.addTombstoneMessage(uid, msg);
                overlay.classList.remove('active');
                this.spawnDanmaku(msg, uid);
            });
            btns.appendChild(b);
        });
        overlay.classList.add('active');
    },

    spawnDanmaku(text, targetUID) {
        const area = document.getElementById('danmakuArea');
        const el = document.createElement('div');
        el.className = 'danmaku-msg';
        el.textContent = text;
        el.style.top = (20 + Math.random() * 60) + '%';
        el.style.animationDuration = (2.5 + Math.random() * 1.5) + 's';
        area.appendChild(el);
        setTimeout(() => el.remove(), 5000);
    },

    renderTombstones(state) {
        if (!state.tombstones) return;
        // Show active tombstone danmaku from state
        Object.entries(state.tombstones).forEach(([uid, data]) => {
            if (data.messages) {
                data.messages.forEach(m => {
                    if (Date.now() - m.ts < 3000) this.spawnDanmaku(m.text, uid);
                });
            }
        });
    },

    renderBattleLog(log) {
        const c = document.getElementById('battleLog');
        c.innerHTML = '';
        log.forEach(e => {
            const d = document.createElement('div');
            d.className = 'log-entry ' + (e.type || 'system');
            d.textContent = e.msg;
            c.appendChild(d);
        });
        c.scrollTop = c.scrollHeight;
    },

    renderHand(state) {
        const row = document.getElementById('cardsRow');
        row.innerHTML = '';
        this.selectedCard = null;
        const { commons, specials, extras } = GameEngine.getMyCards();
        const isMyTurn = GameEngine.isMyTurn();
        const canChain = state.pendingChain && state.pendingChain.active && state.pendingChain.team === GameEngine.myTeam && state.pendingChain.sourceUID !== GameEngine.myUID;
        const allCards = [...commons.map(c => ({ ...c, cat: 'common' })), ...specials.map(c => ({ ...c, cat: 'special' })), ...extras.map(c => ({ ...c, cat: c.type === CARD_TYPE.SPECIAL ? 'special' : 'common' }))];
        if (state.climaxActive && isMyTurn) {
            const cls = GameEngine.getAvailableClimaxCards();
            if (cls.length) allCards.push({ ...cls[Math.floor(Math.random() * cls.length)], cat: 'climax' });
        }
        allCards.forEach(card => {
            const d = document.createElement('div');
            let canPlay = canChain && card.tag === state.pendingChain.tag && card.type === CARD_TYPE.COMMON ? true : (isMyTurn ? GameEngine.canPlayCard(card) : false);
            d.className = 'game-card' + (card.cat === 'special' ? ' special-card' : '') + (card.cat === 'climax' ? ' climax-card' : '') + (!canPlay ? ' disabled' : '');
            let badge = '';
            if (card.type === CARD_TYPE.SPECIAL) badge = `<span class="card-type-badge special">${GameEngine.specialsUsed[card.id] ? '已用' : '特殊'}</span>`;
            if (card.type === CARD_TYPE.CLIMAX) badge = '<span class="card-type-badge climax">决战</span>';
            d.innerHTML = `${badge}<div class="card-tag">${card.tag || ''}</div><div class="card-name">${card.name}</div><div class="card-desc">${card.desc}</div><div class="card-ap">⚡${card.ap !== undefined ? card.ap : '∞'}</div>`;
            if (canPlay) d.addEventListener('click', () => {
                if (this.selectedCard?.id === card.id) { this.selectedCard = null; d.classList.remove('selected'); }
                else { row.querySelectorAll('.game-card').forEach(c => c.classList.remove('selected')); this.selectedCard = card; d.classList.add('selected'); }
                document.getElementById('btnPlayCard').disabled = !this.selectedCard;
            });
            row.appendChild(d);
        });
    },

    renderChainWindow(state) {
        const ov = document.getElementById('chainOverlay');
        const ch = state.pendingChain;
        if (ch && ch.active && ch.team === GameEngine.myTeam && ch.sourceUID !== GameEngine.myUID) {
            if (Date.now() - ch.timestamp < 3000) {
                ov.classList.add('active');
                document.getElementById('chainTimer').textContent = Math.ceil((3000 - (Date.now() - ch.timestamp)) / 1000);
                document.getElementById('chainInfo').textContent = `${GameEngine.getPlayerName(ch.sourceUID)} 使用了「${ch.cardName}」· 打出【${ch.tag}】来连携！`;
            } else ov.classList.remove('active');
        } else ov.classList.remove('active');
    },

    showTargetSelection(card, callback) {
        const ov = document.getElementById('targetOverlay');
        const list = document.getElementById('targetList');
        const state = GameEngine.localState;
        const e = card.effect || {};
        const isOff = !!(e.damage || e.sleep || e.polymorphChance || e.silenceSpecial || e.apCostDouble || e.multiRoll || e.consumeAllAP || e.damageFromShield || e.executeHPBelow);
        const isDef = !!(e.grantInvincible || e.delayedHeal || e.soulLink || e.revive);
        list.innerHTML = '';
        state.turnOrder.forEach(uid => {
            const ps = state.playerStates[uid];
            if (!ps) return;
            const isDead = !ps.alive;
            if (isOff) {
                if (GameEngine.getPlayerTeam(uid) === GameEngine.myTeam) return;
                if (isDead) return;
            } else if (isDef) {
                if (GameEngine.getPlayerTeam(uid) !== GameEngine.myTeam) return;
                if (e.revive && !isDead) return;
                if (!e.revive && isDead) return;
            } else return;
            const ch = CHARACTERS[GameEngine.getPlayerCharacter(uid)];
            const d = document.createElement('div');
            d.className = 'target-option';
            d.innerHTML = `<div class="to-name">${ch ? ch.emoji : ''} ${GameEngine.getPlayerName(uid)}</div><div class="to-hp">HP:${ps.hp}/${ps.maxHP} AP:${ps.ap}</div>`;
            d.addEventListener('click', () => { ov.classList.remove('active'); callback(uid); });
            list.appendChild(d);
        });
        if (list.children.length === 0) { callback(null); return; }
        ov.classList.add('active');
    },

    hideTargetSelection() { document.getElementById('targetOverlay').classList.remove('active'); },
    showClimaxBanner() { const b = document.getElementById('climaxBanner'); b.classList.add('active'); setTimeout(() => b.classList.remove('active'), 4000); },

    showCoinFlip(isHeads) {
        const ov = document.getElementById('coinOverlay');
        ov.classList.add('active');
        setTimeout(() => { document.getElementById('coinResult').textContent = isHeads ? '正面！攻击+30%！' : '反面！防御-30%！'; }, 1000);
        setTimeout(() => ov.classList.remove('active'), 2500);
    },

    showResult(state) {
        const won = state.winner === GameEngine.myTeam;
        document.getElementById('resultTitle').textContent = won ? 'VICTORY' : 'DEFEAT';
        document.getElementById('resultTitle').className = 'result-title ' + (won ? 'win' : 'lose');
        document.getElementById('resultSubtitle').textContent = (state.winner === 'star' ? '星辰' : '深渊') + '阵营获胜！ ' + (state.starScore || 0) + ' vs ' + (state.abyssScore || 0);
        document.getElementById('resultStats').innerHTML = `
            <div class="stat-box"><div class="stat-label">回合数</div><div class="stat-value">${state.round}</div></div>
            <div class="stat-box"><div class="stat-label">你的送头次数</div><div class="stat-value">${GameEngine.myDeaths}</div></div>
            <div class="stat-box"><div class="stat-label">造成伤害</div><div class="stat-value">${GameEngine.totalDamageDealt}</div></div>
            <div class="stat-box"><div class="stat-label">出牌数</div><div class="stat-value">${GameEngine.cardsPlayed}</div></div>
        `;
        this.showScreen('result');
    }
};
