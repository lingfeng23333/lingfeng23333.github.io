// ================================================================
// game.js — Core Game Engine (Score + Respawn + AI)
// ================================================================

const GameEngine = {
    roomCode: null, roomRef: null, gameRef: null, playersRef: null,
    myUID: null, myTeam: null, myCharacter: null, isHost: false,
    localState: null, listeners: [], chainTimeout: null,
    specialsUsed: {}, extraCards: [],
    totalDamageDealt: 0, totalHealing: 0, cardsPlayed: 0, myDeaths: 0,
    _playersCache: {}, aiMode: false, aiPlayers: [],

    // ── Room Management ────────────────────────────────────────
    generateRoomCode() {
        const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let r = ''; for (let i = 0; i < 4; i++) r += c[Math.floor(Math.random() * c.length)];
        return r;
    },

    async createRoom(nickname) {
        this.myUID = getUID();
        this.roomCode = this.generateRoomCode();
        this.roomRef = db.ref('rooms/' + this.roomCode);
        this.playersRef = this.roomRef.child('players');
        this.isHost = true;
        await this.roomRef.set({ host: this.myUID, status: 'waiting', createdAt: firebase.database.ServerValue.TIMESTAMP });
        await this.playersRef.child(this.myUID).set({ name: nickname, character: null, team: null, ready: false, online: true });
        this.playersRef.child(this.myUID).child('online').onDisconnect().set(false);
        return this.roomCode;
    },

    async joinRoom(roomCode, nickname) {
        this.myUID = getUID();
        this.roomCode = roomCode.toUpperCase();
        this.roomRef = db.ref('rooms/' + this.roomCode);
        this.playersRef = this.roomRef.child('players');
        const snap = await this.roomRef.once('value');
        if (!snap.exists()) throw new Error('房间不存在');
        const room = snap.val();
        if (room.status !== 'waiting') throw new Error('游戏已开始');
        const pCount = Object.keys(room.players || {}).length;
        if (pCount >= 8) throw new Error('房间已满');
        this.isHost = room.host === this.myUID;
        await this.playersRef.child(this.myUID).set({ name: nickname, character: null, team: null, ready: false, online: true });
        this.playersRef.child(this.myUID).child('online').onDisconnect().set(false);
        return this.roomCode;
    },

    async selectCharacter(charId) {
        const snap = await this.playersRef.once('value');
        const players = snap.val() || {};
        for (const uid in players) {
            if (uid !== this.myUID && players[uid].character === charId) throw new Error('角色已被选择');
        }
        await this.playersRef.child(this.myUID).child('character').set(charId);
    },

    async toggleReady() {
        const snap = await this.playersRef.child(this.myUID).child('ready').once('value');
        const nv = !snap.val();
        await this.playersRef.child(this.myUID).child('ready').set(nv);
        return nv;
    },

    async leaveRoom() {
        if (this.roomRef && this.myUID) await this.playersRef.child(this.myUID).remove();
        this.cleanup();
    },

    cleanup() {
        this.listeners.forEach(u => u());
        this.listeners = [];
        this.roomRef = null; this.gameRef = null; this.roomCode = null;
        this.localState = null; this.specialsUsed = {}; this.extraCards = [];
        this.totalDamageDealt = 0; this.totalHealing = 0; this.cardsPlayed = 0; this.myDeaths = 0;
        this.aiMode = false; this.aiPlayers = [];
        if (this.chainTimeout) clearTimeout(this.chainTimeout);
    },

    // ── AI Mode (local, no firebase) ───────────────────────────
    startAIMode(nickname, charId) {
        this.aiMode = true;
        this.myUID = 'human';
        this.myCharacter = charId;
        this.roomCode = 'AI';
        this.isHost = true;

        // Create AI players
        const allChars = Object.keys(CHARACTERS).filter(c => c !== charId);
        const shuffled = allChars.sort(() => Math.random() - 0.5);
        const aiChars = shuffled.slice(0, 7); // 7 AI + 1 human = 8

        const players = { human: { name: nickname, character: charId, team: 'star', ready: true, online: true } };
        this.aiPlayers = [];
        aiChars.forEach((c, i) => {
            const uid = 'ai_' + i;
            const team = i < 3 ? 'star' : 'abyss'; // 4v4: human+3ai vs 4ai
            players[uid] = { name: CHARACTERS[c].name + '(AI)', character: c, team: team, ready: true, online: true };
            this.aiPlayers.push(uid);
        });

        this.myTeam = 'star';
        this._playersCache = players;

        // Build turn order
        const starUIDs = Object.keys(players).filter(u => players[u].team === 'star');
        const abyssUIDs = Object.keys(players).filter(u => players[u].team === 'abyss');
        const turnOrder = [];
        const maxL = Math.max(starUIDs.length, abyssUIDs.length);
        for (let i = 0; i < maxL; i++) {
            if (i < starUIDs.length) turnOrder.push(starUIDs[i]);
            if (i < abyssUIDs.length) turnOrder.push(abyssUIDs[i]);
        }

        // Init player states
        const ps = {};
        Object.keys(players).forEach(uid => {
            ps[uid] = {
                ap: 3, maxAP: 3, hp: 20, maxHP: 20, shield: 0, buffs: {},
                alive: true, dead: false, respawnTimer: 0, deaths: 0,
                actedThisTurn: false, hitThisTurn: false, cardsPlayedThisTurn: 0,
                iaiStance: false, critNextAttack: false, shameCount: 0
            };
        });

        this.localState = {
            starScore: 0, abyssScore: 0, scoreToWin: 100,
            dp: 0, round: 1, currentTurnIndex: 0, turnOrder: turnOrder,
            playerStates: ps,
            log: [{ msg: '⚔ AI对战模式开始！先到100分获胜！', type: 'system', ts: Date.now() }],
            climaxActive: false, pendingChain: null, lastPlayedCard: null,
            globalBuffs: {}, finished: false, winner: null,
            tombstones: {} // uid -> { messages: [] }
        };

        return players;
    },

    // ── AI Turn Logic ──────────────────────────────────────────
    async executeAITurn() {
        if (!this.aiMode) return;
        const state = this.localState;
        const aiUID = state.turnOrder[state.currentTurnIndex];
        if (aiUID === 'human') return;
        if (!state.playerStates[aiUID] || !state.playerStates[aiUID].alive) {
            this.endTurnLocal();
            return;
        }

        // Wait a bit for visual effect
        await new Promise(r => setTimeout(r, 800));

        const aiChar = this._playersCache[aiUID].character;
        const { commons } = getCharacterCards(aiChar);
        const aiState = state.playerStates[aiUID];

        // Try to play 1-2 cards
        let played = 0;
        for (const card of commons) {
            if (played >= 2) break;
            let apCost = card.ap || 0;
            if (aiState.ap < apCost) continue;
            if (aiState.buffs.stunned || aiState.buffs.sleeping || aiState.buffs.polymorph) break;

            // Find target
            const aiTeam = this._playersCache[aiUID].team;
            const enemyTeam = aiTeam === 'star' ? 'abyss' : 'star';
            const isOffensive = !!(card.effect.damage || card.effect.aoeDamage || card.effect.sleep || card.effect.polymorphChance);
            const isDefensive = !!(card.effect.grantInvincible || card.effect.delayedHeal);

            let targetUID = null;
            if (isOffensive) {
                const enemies = state.turnOrder.filter(u =>
                    this._playersCache[u].team === enemyTeam && state.playerStates[u].alive);
                if (enemies.length > 0) targetUID = enemies[Math.floor(Math.random() * enemies.length)];
            } else if (isDefensive) {
                const allies = state.turnOrder.filter(u =>
                    this._playersCache[u].team === aiTeam && u !== aiUID && state.playerStates[u].alive);
                if (allies.length > 0) targetUID = allies[Math.floor(Math.random() * allies.length)];
            }

            this.playCardLocal(aiUID, card, targetUID);
            played++;
            await new Promise(r => setTimeout(r, 600));
        }

        await new Promise(r => setTimeout(r, 400));
        this.endTurnLocal();
    },

    // ── Local Game Logic (for AI mode) ─────────────────────────
    playCardLocal(playerUID, card, targetUID) {
        const state = this.localState;
        const ps = state.playerStates[playerUID];
        const playerTeam = this._playersCache[playerUID].team;
        const enemyTeam = playerTeam === 'star' ? 'abyss' : 'star';
        const char = CHARACTERS[this._playersCache[playerUID].character];
        const pName = this._playersCache[playerUID].name;

        // Deduct AP
        if (card.type === CARD_TYPE.COMMON) {
            let apCost = card.ap || 0;
            if (ps.buffs.apCostUp) apCost += ps.buffs.apCostUp;
            if (ps.buffs.apCostDouble) apCost *= 2;
            ps.ap -= apCost;
        }
        if (card.type === CARD_TYPE.SPECIAL) this.specialsUsed[card.id] = true;
        ps.cardsPlayedThisTurn = (ps.cardsPlayedThisTurn || 0) + 1;
        if (playerUID === 'human') this.cardsPlayed++;

        // Multiplier
        let mult = 1.0;
        if (ps.iaiStance) { mult *= 2.0; ps.iaiStance = false; }
        if (ps.critNextAttack) { mult *= 1.5; ps.critNextAttack = false; }
        if (ps.buffs.crusade) mult *= 1.2;
        if (ps.buffs.revenge) mult *= 1.5;
        if (ps.buffs.frenzy) mult *= 1.3;
        if (ps.buffs.bossMode) mult *= 3.0;
        if (ps.buffs.shame) mult *= (1 - 0.2 * ps.buffs.shame); // 耻辱 debuff

        state.log.push({ msg: `${char.emoji} ${pName} 使用了「${card.name}」`, type: 'system', ts: Date.now() });
        if (card.quote) state.log.push({ msg: card.quote, type: 'quote', ts: Date.now() });

        const e = card.effect || {};
        let totalDmg = 0;

        // ── Direct damage to target ──
        if (e.damage && targetUID) {
            let dmg = Math.floor(e.damage * mult);
            if (e.critIfFirst && ps.cardsPlayedThisTurn <= 1) { dmg = Math.floor(dmg * 1.5); state.log.push({ msg: '💥 暴击！', type: 'damage', ts: Date.now() }); }
            if (e.bonusVsUnacted && state.playerStates[targetUID] && !state.playerStates[targetUID].actedThisTurn) { dmg = Math.floor(dmg * 1.5); }
            if (e.executeThreshold && state.playerStates[targetUID]) {
                if ((state.playerStates[targetUID].hp / state.playerStates[targetUID].maxHP) < e.executeThreshold) { dmg = 999; state.log.push({ msg: '☠ 斩杀！', type: 'damage', ts: Date.now() }); }
            }
            if (e.executeHPBelow && state.playerStates[targetUID] && state.playerStates[targetUID].hp > e.executeHPBelow) { dmg = 0; }
            dmg = this.applyDamageToPlayer(targetUID, dmg, e, state);
            totalDmg += dmg;
            if (e.hits && e.hits > 1) {
                for (let i = 1; i < e.hits; i++) {
                    const extraDmg = this.applyDamageToPlayer(targetUID, Math.floor(e.damage * mult), e, state);
                    totalDmg += extraDmg;
                }
                state.log.push({ msg: `🔥 ${e.hits}连击！`, type: 'damage', ts: Date.now() });
            }
        }

        // ── AOE damage ──
        if (e.aoeDamage) {
            state.turnOrder.forEach(uid => {
                if (this._playersCache[uid].team === enemyTeam && state.playerStates[uid].alive) {
                    const dmg = this.applyDamageToPlayer(uid, Math.floor(e.aoeDamage * mult), e, state);
                    totalDmg += dmg;
                }
            });
            state.log.push({ msg: `🌀 全体攻击！`, type: 'damage', ts: Date.now() });
        }

        // ── Multi roll (关帝圣君) ──
        if (e.multiRoll && targetUID) {
            let hits = 0;
            for (let i = 0; i < e.multiRoll; i++) { if (Math.random() < (e.hitChance || 0.5)) hits++; }
            const dmg = hits * (e.damagePerHit || 3);
            if (dmg > 0) { totalDmg += this.applyDamageToPlayer(targetUID, dmg, e, state); }
            state.log.push({ msg: `🎲 ${e.multiRoll}次判定命中${hits}次！`, type: 'damage', ts: Date.now() });
            if (hits > 0) ps.buffs.frenzy = 2;
        }

        // ── Ignore all (向风车冲锋) ──
        if (e.ignoreAll && e.selfDmg) {
            ps.hp = Math.max(1, ps.hp - e.selfDmg);
            state.log.push({ msg: `🩸 反噬 ${e.selfDmg} 点！`, type: 'damage', ts: Date.now() });
            if (e.selfStun) ps.buffs.stunned = e.selfStun;
        }

        // ── Shield from shield (荣耀冲锋) ──
        if (e.damageFromShield && targetUID) {
            const dmg = Math.floor((ps.shield || 0) * e.damageFromShield);
            if (dmg > 0) totalDmg += this.applyDamageToPlayer(targetUID, dmg, e, state);
        }

        // ── Self effects ──
        if (e.shield) { ps.shield = (ps.shield || 0) + e.shield; state.log.push({ msg: `🛡 +${e.shield}护盾`, type: 'buff', ts: Date.now() }); }
        if (e.selfHeal) { ps.hp = Math.min(ps.maxHP, ps.hp + e.selfHeal); state.log.push({ msg: `💚 自身回复${e.selfHeal}HP`, type: 'heal', ts: Date.now() }); }
        if (e.enterIai) { ps.iaiStance = true; state.log.push({ msg: '⚔ 居合架势！', type: 'buff', ts: Date.now() }); }
        if (e.grantCrit) { ps.critNextAttack = true; if (e.selfDmg) { ps.hp = Math.max(1, ps.hp - e.selfDmg); } }
        if (e.taunt) { ps.buffs.taunting = true; state.log.push({ msg: '🎯 嘲讽！', type: 'buff', ts: Date.now() }); }
        if (e.convertDmgToHeal) { ps.buffs.convertDmgToHeal = true; }

        // ── Target debuffs ──
        if (e.sleep && targetUID && state.playerStates[targetUID]) { state.playerStates[targetUID].buffs.sleeping = true; state.log.push({ msg: '💤 目标入睡！', type: 'buff', ts: Date.now() }); }
        if (e.polymorphChance && targetUID && state.playerStates[targetUID]) {
            if (Math.random() < e.polymorphChance) { state.playerStates[targetUID].buffs.polymorph = 1; state.log.push({ msg: '🐑 变羊！', type: 'buff', ts: Date.now() }); }
        }
        if (e.silenceSpecial && targetUID && state.playerStates[targetUID]) { state.playerStates[targetUID].buffs.silenceSpecial = true; }
        if (e.apCostDouble && targetUID && state.playerStates[targetUID]) { state.playerStates[targetUID].buffs.apCostDouble = true; }
        if (e.bleed && targetUID && state.playerStates[targetUID]) { state.playerStates[targetUID].buffs.bleed = (state.playerStates[targetUID].buffs.bleed || 0) + e.bleed; }

        // ── Ally buffs ──
        if (e.grantInvincible && targetUID && state.playerStates[targetUID]) { state.playerStates[targetUID].buffs.invincible = true; state.log.push({ msg: '🛡 赋予无敌！', type: 'buff', ts: Date.now() }); }
        if (e.delayedHeal && targetUID && state.playerStates[targetUID]) { state.playerStates[targetUID].buffs.delayedHeal = e.delayedHeal; }
        if (e.soulLink && targetUID) { ps.buffs.soulLink = targetUID; state.playerStates[targetUID].buffs.soulLink = playerUID; state.log.push({ msg: '🔗 灵魂链接！', type: 'buff', ts: Date.now() }); }

        // ── Team/Global effects ──
        if (e.teamBuff === 'crusade') { state.turnOrder.forEach(u => { if (this._playersCache[u].team === playerTeam) state.playerStates[u].buffs.crusade = e.duration || 2; }); state.log.push({ msg: '✟ 全队圣战！', type: 'buff', ts: Date.now() }); }
        if (e.deepSleepAll) { state.turnOrder.forEach(u => { if (this._playersCache[u].team !== playerTeam && state.playerStates[u].alive) state.playerStates[u].buffs.deepSleep = e.duration || 2; }); state.log.push({ msg: '💤💤 全体深度睡眠！', type: 'buff', ts: Date.now() }); }
        if (e.coinFlip) { const h = Math.random() > 0.5; state.log.push({ msg: h ? '🪙 正面！攻击+30%' : '🪙 反面！敌方防-30%', type: 'buff', ts: Date.now() }); if (h) { state.globalBuffs[playerTeam + '_atkUp'] = 0.3; } else { state.globalBuffs[enemyTeam + '_defDown'] = 0.3; } }
        if (e.enemyAPCostUp) { state.turnOrder.forEach(u => { if (this._playersCache[u].team !== playerTeam) state.playerStates[u].buffs.apCostUp = e.enemyAPCostUp; }); state.log.push({ msg: '💰 通货膨胀！', type: 'buff', ts: Date.now() }); }
        if (e.skipEnemyTurn) { state.globalBuffs.skipNext = enemyTeam; if (e.selfSleep) ps.buffs.sleeping = true; state.log.push({ msg: '⏸ 跳过敌方回合！', type: 'buff', ts: Date.now() }); }
        if (e.purgeAll) { state.turnOrder.forEach(u => { state.playerStates[u].buffs = {}; state.playerStates[u].shield = 0; }); state.globalBuffs = {}; state.log.push({ msg: '🌪 全场清除！', type: 'system', ts: Date.now() }); }
        if (e.invertHealing) { state.globalBuffs[enemyTeam + '_invertHeal'] = e.duration || 3; }
        if (e.nullifyNextMagic) { state.globalBuffs[enemyTeam + '_nullMagic'] = true; }
        if (e.consumeAllAP) { const ap = ps.ap; ps.ap = 0; const d = ap * (e.damagePerAP || 3); if (targetUID) totalDmg += this.applyDamageToPlayer(targetUID, Math.floor(d * mult), e, state); else { const enemies = state.turnOrder.filter(u => this._playersCache[u].team !== playerTeam && state.playerStates[u].alive); if (enemies.length) totalDmg += this.applyDamageToPlayer(enemies[0], Math.floor(d * mult), e, state); } state.log.push({ msg: `🔥 消耗${ap}AP！`, type: 'damage', ts: Date.now() }); }
        if (e.drawCards) { const all = getAllCommonCards(); for (let i = 0; i < e.drawCards; i++) this.extraCards.push(all[Math.floor(Math.random() * all.length)]); state.log.push({ msg: `📜 抽${e.drawCards}张牌！`, type: 'buff', ts: Date.now() }); }
        if (e.buyRandomSpecial) { const all = Object.values(SPECIAL_CARDS).filter(c => c.char !== this._playersCache[playerUID].character); if (all.length) { const r = all[Math.floor(Math.random() * all.length)]; this.extraCards.push(r); state.log.push({ msg: `💰 购入「${r.name}」！`, type: 'buff', ts: Date.now() }); } }
        if (e.copyLast && state.lastPlayedCard) { const lc = getCardById(state.lastPlayedCard.cardId); if (lc && lc.effect && lc.effect.damage && targetUID) { const d = Math.floor(lc.effect.damage * 0.8 * mult); totalDmg += this.applyDamageToPlayer(targetUID, d, e, state); state.log.push({ msg: `📋 复制「${lc.name}」80%效果！`, type: 'buff', ts: Date.now() }); } }
        if (e.sacrificeHand) { const n = this.extraCards.length; this.extraCards = []; if (n > 0) { const enemies = state.turnOrder.filter(u => this._playersCache[u].team !== playerTeam && state.playerStates[u].alive); enemies.forEach(u => totalDmg += this.applyDamageToPlayer(u, Math.floor((e.damagePerCard || 6) * n / enemies.length), e, state)); } }
        if (e.revive) { const dead = state.turnOrder.filter(u => this._playersCache[u].team === playerTeam && !state.playerStates[u].alive); if (dead.length) { const t = targetUID || dead[0]; state.playerStates[t].alive = true; state.playerStates[t].dead = false; state.playerStates[t].hp = state.playerStates[t].maxHP; state.playerStates[t].respawnTimer = 0; if (e.grantInvincible) state.playerStates[t].buffs.invincible = true; state.log.push({ msg: `✟ 复活了！`, type: 'heal', ts: Date.now() }); delete state.tombstones[t]; } }

        // Climax card effects
        if (e.healLosingTeam) { const losing = state.starScore < state.abyssScore ? 'star' : 'abyss'; state.turnOrder.forEach(u => { if (this._playersCache[u].team === losing) { state.playerStates[u].hp = state.playerStates[u].maxHP; state.playerStates[u].buffs.atkBoost = 1; } }); state.log.push({ msg: '⚖ 逆转裁判！劣势方满血+攻击翻倍！', type: 'climax', ts: Date.now() }); }
        if (e.rollbackHP) { state.turnOrder.forEach(u => { state.playerStates[u].hp = state.playerStates[u].maxHP; state.playerStates[u].alive = true; state.playerStates[u].dead = false; state.playerStates[u].buffs = {}; state.playerStates[u].shield = 0; }); state.tombstones = {}; state.log.push({ msg: '⏮ 服务器回档！全员满血！', type: 'climax', ts: Date.now() }); }
        if (e.dotAll) { state.globalBuffs.ragnarokDot = e.dotAll; if (e.apCostHalf) state.globalBuffs.apCostHalf = true; state.log.push({ msg: '☄ 诸神黄昏降临！全员每回合-5HP！', type: 'climax', ts: Date.now() }); }
        if (e.nerfBest) { let best = null, worst = null, bestDmg = -1, worstDmg = Infinity; state.turnOrder.forEach(u => { const d = state.playerStates[u].deaths || 0; if (state.playerStates[u].alive) { if (d < bestDmg || bestDmg < 0) { bestDmg = d; best = u; } if (d >= worstDmg || worstDmg === Infinity) { worstDmg = d; worst = u; } } }); if (best) state.playerStates[best].buffs.polymorph = 2; if (worst) state.playerStates[worst].buffs.bossMode = true; state.log.push({ msg: '⚖ 策划干预！最强变咸鱼，最弱变魔王！', type: 'climax', ts: Date.now() }); }

        // DP update
        if (totalDmg > 0) state.dp = Math.min(100, (state.dp || 0) + Math.floor(totalDmg * 1.5));
        if (totalDmg > 0 && playerUID === 'human') this.totalDamageDealt += totalDmg;

        // Climax check
        if (state.dp >= 100 && !state.climaxActive) {
            state.climaxActive = true;
            state.log.push({ msg: '🔥🔥🔥 CLIMAX PHASE 开启！ 🔥🔥🔥', type: 'climax', ts: Date.now() });
        }

        state.lastPlayedCard = { cardId: card.id, tag: card.tag, playerUID: playerUID, team: playerTeam, ts: Date.now() };
        if (card.type === CARD_TYPE.COMMON && card.tag) {
            state.pendingChain = { active: true, tag: card.tag, sourceUID: playerUID, team: playerTeam, cardName: card.name, baseDamage: totalDmg, timestamp: Date.now() };
        }

        // Trim log
        if (state.log.length > 60) state.log = state.log.slice(-60);

        // Win check
        this.checkWin();
        if (this._onStateChange) this._onStateChange(state);
    },

    applyDamageToPlayer(targetUID, rawDmg, cardEffect, state) {
        const ts = state.playerStates[targetUID];
        if (!ts || !ts.alive) return 0;

        let dmg = rawDmg;

        // Check invincible
        if (ts.buffs.invincible && !(cardEffect && cardEffect.ignoreAll)) {
            ts.buffs.invincible = false;
            state.log.push({ msg: '🛡 无敌抵消！', type: 'buff', ts: Date.now() });
            return 0;
        }

        // Convert damage to heal
        if (ts.buffs.convertDmgToHeal) {
            ts.hp = Math.min(ts.maxHP, ts.hp + dmg);
            ts.buffs.convertDmgToHeal = false;
            state.log.push({ msg: `💚 伤害转治疗！+${dmg}HP`, type: 'heal', ts: Date.now() });
            return 0;
        }

        // Shield absorb
        if (ts.shield > 0 && !(cardEffect && cardEffect.ignoreAll)) {
            if (cardEffect && cardEffect.bonusVsShield) { dmg *= 2; state.log.push({ msg: '💥 护盾粉碎！双倍！', type: 'damage', ts: Date.now() }); }
            const absorbed = Math.min(ts.shield, dmg);
            dmg -= absorbed;
            ts.shield -= absorbed;
        }

        ts.hp -= dmg;
        ts.hitThisTurn = true;
        const tName = this._playersCache[targetUID]?.name || targetUID;
        state.log.push({ msg: `💥 ${tName} 受到 ${dmg} 点伤害 [HP: ${ts.hp + dmg} → ${Math.max(0, ts.hp)}]`, type: 'damage', ts: Date.now() });

        // Check death
        if (ts.hp <= 0) {
            ts.hp = 0;
            ts.alive = false;
            ts.dead = true;
            ts.deaths = (ts.deaths || 0) + 1;
            ts.shameCount = (ts.shameCount || 0) + 1;
            ts.respawnTimer = 10; // 10 seconds

            const killerTeam = this._playersCache[targetUID].team === 'star' ? 'abyss' : 'star';
            if (killerTeam === 'star') state.starScore = (state.starScore || 0) + 10;
            else state.abyssScore = (state.abyssScore || 0) + 10;

            state.tombstones = state.tombstones || {};
            state.tombstones[targetUID] = { messages: [], deathTime: Date.now() };

            if (targetUID === 'human') this.myDeaths++;

            state.log.push({ msg: `☠ ${tName} 阵亡！敌方 +10分！[${killerTeam === 'star' ? '星辰' : '深渊'}: ${killerTeam === 'star' ? state.starScore : state.abyssScore}分]`, type: 'climax', ts: Date.now() });
            state.log.push({ msg: `🪦 ${tName} 将在10秒后复活...`, type: 'system', ts: Date.now() });

            // Start respawn timer
            this.startRespawnTimer(targetUID);
        }

        return dmg;
    },

    startRespawnTimer(uid) {
        if (!this.aiMode) return; // For AI mode, handle locally
        setTimeout(() => {
            const state = this.localState;
            if (!state || state.finished) return;
            const ps = state.playerStates[uid];
            if (!ps || ps.alive) return;

            ps.alive = true;
            ps.dead = false;
            ps.hp = ps.maxHP;
            ps.shield = 0;
            ps.respawnTimer = 0;
            // Add shame debuff
            ps.buffs.shame = (ps.buffs.shame || 0) + 1;
            ps.buffs = { ...ps.buffs, sleeping: false, stunned: false, polymorph: false };

            const pName = this._playersCache[uid]?.name || uid;
            state.log.push({ msg: `🔄 ${pName} 复活了！但带着耻辱(-${ps.buffs.shame * 20}%全属性)...`, type: 'system', ts: Date.now() });

            delete state.tombstones[uid];
            this.checkWin();
            if (this._onStateChange) this._onStateChange(state);
        }, 10000);
    },

    endTurnLocal() {
        const state = this.localState;
        const uid = state.turnOrder[state.currentTurnIndex];
        const ps = state.playerStates[uid];
        if (!ps) { this.advanceTurn(); return; }

        // End of turn effects
        if (ps.alive) {
            // Delayed heal
            if (ps.buffs.delayedHeal) {
                let heal = ps.buffs.delayedHeal;
                if (ps.hitThisTurn) heal *= 2;
                ps.hp = Math.min(ps.maxHP, ps.hp + heal);
                ps.buffs.delayedHeal = null;
                state.log.push({ msg: `💚 延迟治疗！+${heal}HP`, type: 'heal', ts: Date.now() });
            }
            // Bleed
            if (ps.buffs.bleed) {
                const bd = ps.buffs.bleed * 2;
                this.applyDamageToPlayer(uid, bd, {}, state);
                ps.buffs.bleed = Math.max(0, ps.buffs.bleed - 1) || null;
            }
            // Taunt AP refund
            if (ps.buffs.taunting && !ps.hitThisTurn) { ps.ap = Math.min(ps.maxAP, ps.ap + 2); }
            ps.buffs.taunting = null;
            // Ragnarok DOT
            if (state.globalBuffs.ragnarokDot && ps.alive) {
                this.applyDamageToPlayer(uid, state.globalBuffs.ragnarokDot, {}, state);
            }

            // Decrement timed buffs
            ['crusade', 'polymorph', 'deepSleep', 'stunned', 'critBoost', 'frenzy'].forEach(b => {
                if (typeof ps.buffs[b] === 'number' && ps.buffs[b] > 0) {
                    ps.buffs[b] = ps.buffs[b] - 1 > 0 ? ps.buffs[b] - 1 : null;
                }
            });
            if (ps.buffs.atkBoost) ps.buffs.atkBoost = null;
            ps.buffs.apCostDouble = null;
            ps.buffs.silenceSpecial = null;
        }

        ps.actedThisTurn = true;
        ps.hitThisTurn = false;
        ps.cardsPlayedThisTurn = 0;
        state.pendingChain = null;

        this.advanceTurn();
    },

    advanceTurn() {
        const state = this.localState;
        let nextIdx = (state.currentTurnIndex + 1) % state.turnOrder.length;
        let safety = 0;

        while (safety < state.turnOrder.length * 2) {
            const nuid = state.turnOrder[nextIdx];
            const nps = state.playerStates[nuid];

            if (!nps || !nps.alive) { nextIdx = (nextIdx + 1) % state.turnOrder.length; safety++; continue; }
            if (nps.buffs.sleeping || nps.buffs.stunned || nps.buffs.deepSleep) {
                const nm = this._playersCache[nuid]?.name || nuid;
                state.log.push({ msg: `💤 ${nm} 无法行动，跳过`, type: 'system', ts: Date.now() });
                if (nps.buffs.deepSleep) nps.buffs.deepSleep = nps.buffs.deepSleep > 1 ? nps.buffs.deepSleep - 1 : null;
                nps.buffs.sleeping = null;
                if (typeof nps.buffs.stunned === 'number') nps.buffs.stunned = nps.buffs.stunned > 1 ? nps.buffs.stunned - 1 : null;
                nextIdx = (nextIdx + 1) % state.turnOrder.length;
                safety++;
                continue;
            }

            // Skip enemy turn global buff
            if (state.globalBuffs.skipNext && this._playersCache[nuid].team === state.globalBuffs.skipNext) {
                state.log.push({ msg: `⏸ ${this._playersCache[nuid].name} 回合被跳过！`, type: 'system', ts: Date.now() });
                state.globalBuffs.skipNext = null;
                nextIdx = (nextIdx + 1) % state.turnOrder.length;
                safety++;
                continue;
            }
            break;
        }

        // New round check
        if (nextIdx <= state.currentTurnIndex || safety >= state.turnOrder.length) {
            state.round++;
            state.log.push({ msg: `── 第 ${state.round} 回合 ──`, type: 'system', ts: Date.now() });
            state.turnOrder.forEach(u => {
                const p = state.playerStates[u];
                if (p && p.alive) { p.ap = p.maxAP; p.actedThisTurn = false; }
            });
            // Decrement global timed effects
            ['star_invertHeal', 'abyss_invertHeal'].forEach(k => {
                if (typeof state.globalBuffs[k] === 'number') {
                    state.globalBuffs[k] = state.globalBuffs[k] > 1 ? state.globalBuffs[k] - 1 : null;
                }
            });
        }

        state.currentTurnIndex = nextIdx;
        // Restore AP
        const nextUID = state.turnOrder[nextIdx];
        if (state.playerStates[nextUID]) state.playerStates[nextUID].ap = state.playerStates[nextUID].maxAP;

        if (state.log.length > 60) state.log = state.log.slice(-60);
        this.checkWin();
        if (this._onStateChange) this._onStateChange(state);

        // If AI turn, auto-play
        if (this.aiMode && nextUID !== 'human' && !state.finished) {
            setTimeout(() => this.executeAITurn(), 500);
        }
    },

    checkWin() {
        const state = this.localState;
        if (state.finished) return;
        if ((state.starScore || 0) >= state.scoreToWin) { state.finished = true; state.winner = 'star'; state.log.push({ msg: '🏆 星辰阵营率先达到100分！获得胜利！', type: 'climax', ts: Date.now() }); }
        if ((state.abyssScore || 0) >= state.scoreToWin) { state.finished = true; state.winner = 'abyss'; state.log.push({ msg: '🏆 深渊阵营率先达到100分！获得胜利！', type: 'climax', ts: Date.now() }); }
    },

    // ── For AI mode: direct card play ─────────────────────────
    playCard(card, targetUID) {
        if (this.aiMode) {
            this.playCardLocal('human', card, targetUID);
            return Promise.resolve();
        }
        // Firebase mode
        return this._playCardFirebase(card, targetUID);
    },

    endTurn() {
        if (this.aiMode) {
            this.endTurnLocal();
            return Promise.resolve();
        }
        return this._endTurnFirebase();
    },

    // ── Helpers ─────────────────────────────────────────────────
    isMyTurn() {
        if (!this.localState) return false;
        return this.localState.turnOrder[this.localState.currentTurnIndex] === this.myUID;
    },
    getCurrentTurnPlayer() { return this.localState ? this.localState.turnOrder[this.localState.currentTurnIndex] : null; },
    getMyState() { return this.localState ? this.localState.playerStates[this.myUID] : null; },
    getPlayerName(uid) { return this._playersCache[uid] ? this._playersCache[uid].name : uid.substring(0, 6); },
    getPlayerCharacter(uid) { return this._playersCache[uid] ? this._playersCache[uid].character : null; },
    getPlayerTeam(uid) { return this._playersCache[uid] ? this._playersCache[uid].team : null; },
    setPlayersCache(p) { this._playersCache = p; },

    canPlayCard(card) {
        const ms = this.getMyState();
        if (!ms || !ms.alive) return false;
        if (!this.isMyTurn()) return false;
        if (ms.buffs && (ms.buffs.stunned || ms.buffs.sleeping || ms.buffs.polymorph)) return false;
        if (card.type === CARD_TYPE.COMMON) {
            let ap = card.ap || 0;
            if (ms.buffs && ms.buffs.apCostUp) ap += ms.buffs.apCostUp;
            if (ms.buffs && ms.buffs.apCostDouble) ap *= 2;
            if (this.localState.globalBuffs && this.localState.globalBuffs.apCostHalf) ap = Math.ceil(ap / 2);
            return ms.ap >= ap;
        }
        if (card.type === CARD_TYPE.SPECIAL) {
            if (this.specialsUsed[card.id]) return false;
            if (ms.buffs && ms.buffs.silenceSpecial) return false;
            return true;
        }
        return card.type === CARD_TYPE.CLIMAX;
    },

    getMyCards() {
        if (!this.myCharacter) return { commons: [], specials: [], extras: this.extraCards };
        const { commons, specials } = getCharacterCards(this.myCharacter);
        return { commons, specials, extras: this.extraCards };
    },

    getAvailableClimaxCards() {
        if (!this.localState || !this.localState.climaxActive) return [];
        return getClimaxCardsList();
    },

    addTombstoneMessage(uid, msg) {
        if (!this.localState || !this.localState.tombstones || !this.localState.tombstones[uid]) return;
        this.localState.tombstones[uid].messages.push({ text: msg, ts: Date.now() });
        if (this._onStateChange) this._onStateChange(this.localState);
    },

    getFeederBoard() {
        if (!this.localState) return [];
        return this.localState.turnOrder
            .map(uid => ({ uid, name: this._playersCache[uid]?.name || uid, deaths: this.localState.playerStates[uid]?.deaths || 0, team: this._playersCache[uid]?.team }))
            .sort((a, b) => b.deaths - a.deaths)
            .filter(p => p.deaths > 0);
    },

    // ── Firebase stubs (for online mode) ───────────────────────
    listenToRoom(callbacks) {
        if (!this.playersRef) return;
        const u1 = this.playersRef.on('value', s => callbacks.onPlayersChange(s.val() || {}));
        this.listeners.push(() => this.playersRef.off('value', u1));
        const u2 = this.roomRef.child('status').on('value', s => callbacks.onStatusChange(s.val()));
        this.listeners.push(() => this.roomRef.child('status').off('value', u2));
    },
    listenToGame(callbacks) {
        if (!this.roomRef) return;
        this.gameRef = this.roomRef.child('game');
        const u = this.gameRef.on('value', s => { const st = s.val(); if (st) { this.localState = st; callbacks.onGameUpdate(st); } });
        this.listeners.push(() => this.gameRef.off('value', u));
    },
    async _playCardFirebase(card, targetUID) { /* TODO: Firebase write */ },
    async _endTurnFirebase() { /* TODO: Firebase write */ }
};
