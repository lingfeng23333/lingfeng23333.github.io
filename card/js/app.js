// ================================================================
// app.js — Main Application Entry Point (with AI Mode)
// ================================================================

(async function () {
    'use strict';
    UI.init();

    // Add AI select screen to UI
    UI.screens.aiSelect = document.getElementById('screenAISelect');

    // Try Firebase auth
    try {
        await initAuth();
        console.log('[App] Firebase ready. UID:', getUID());
    } catch (e) {
        console.log('[App] Firebase offline, AI mode still available');
    }

    let currentPlayers = {};
    let climaxShown = false;
    let selectedAIChar = null;

    // ── Lobby ──────────────────────────────────────────────────
    document.getElementById('btnCreateRoom').addEventListener('click', async () => {
        const name = document.getElementById('inputNickname').value.trim();
        if (!name) { UI.toast('请输入昵称', 'error'); return; }
        try {
            const code = await GameEngine.createRoom(name);
            document.getElementById('displayRoomCode').textContent = code;
            setupRoomListeners();
            UI.showScreen('waiting');
            UI.toast('房间 ' + code + ' 已创建', 'success');
        } catch (e) { UI.toast('创建失败: ' + e.message, 'error'); }
    });

    document.getElementById('btnJoinRoom').addEventListener('click', async () => {
        const name = document.getElementById('inputNickname').value.trim();
        const code = document.getElementById('inputRoomCode').value.trim();
        if (!name) { UI.toast('请输入昵称', 'error'); return; }
        if (!code || code.length < 4) { UI.toast('请输入4位房间代码', 'error'); return; }
        try {
            await GameEngine.joinRoom(code, name);
            document.getElementById('displayRoomCode').textContent = code.toUpperCase();
            setupRoomListeners();
            UI.showScreen('waiting');
            UI.toast('已加入 ' + code.toUpperCase(), 'success');
        } catch (e) { UI.toast('加入失败: ' + e.message, 'error'); }
    });

    // ── AI Mode ────────────────────────────────────────────────
    document.getElementById('btnAIMode').addEventListener('click', () => {
        const name = document.getElementById('inputNickname').value.trim();
        if (!name) { UI.toast('请输入昵称', 'error'); return; }
        selectedAIChar = null;
        renderAICharSelect();
        UI.showScreen('aiSelect');
    });

    function renderAICharSelect() {
        const grid = document.getElementById('aiCharGrid');
        grid.innerHTML = '';
        Object.values(CHARACTERS).forEach(ch => {
            const d = document.createElement('div');
            d.className = 'char-option' + (selectedAIChar === ch.id ? ' selected' : '');
            d.innerHTML = `<span class="char-emoji">${ch.emoji}</span><div class="char-name">${ch.name}</div><div class="char-title">${ch.title}</div>`;
            d.addEventListener('click', () => {
                selectedAIChar = ch.id;
                document.getElementById('btnStartAI').classList.remove('hidden');
                renderAICharSelect();
            });
            grid.appendChild(d);
        });
    }

    document.getElementById('btnStartAI').addEventListener('click', () => {
        if (!selectedAIChar) return;
        const name = document.getElementById('inputNickname').value.trim() || '玩家';
        const players = GameEngine.startAIMode(name, selectedAIChar);
        currentPlayers = players;
        climaxShown = false;

        // Set up state change listener for AI mode
        GameEngine._onStateChange = (state) => {
            UI.renderGameState(state, currentPlayers);
            if (state.climaxActive && !climaxShown) { climaxShown = true; UI.showClimaxBanner(); }
        };

        UI.showScreen('game');
        UI.renderGameState(GameEngine.localState, currentPlayers);
        UI.toast('AI对战开始！', 'success');

        // Trigger first AI turn if AI goes first
        const firstUID = GameEngine.localState.turnOrder[0];
        if (firstUID !== 'human') {
            setTimeout(() => GameEngine.executeAITurn(), 1000);
        }
    });

    document.getElementById('btnBackFromAI').addEventListener('click', () => {
        UI.showScreen('lobby');
    });

    // ── Waiting Room ───────────────────────────────────────────
    document.getElementById('btnReady').addEventListener('click', async () => {
        try {
            const ready = await GameEngine.toggleReady();
            const btn = document.getElementById('btnReady');
            btn.textContent = ready ? '✗ 取消准备' : '✓ 准备就绪';
            btn.classList.toggle('btn-gold', ready);
            btn.classList.toggle('btn-secondary', !ready);
        } catch (e) { UI.toast(e.message, 'error'); }
    });
    document.getElementById('btnStartGame').addEventListener('click', async () => {
        try { await GameEngine.startGame(); UI.toast('游戏开始！', 'success'); }
        catch (e) { UI.toast(e.message, 'error'); }
    });
    document.getElementById('btnLeaveRoom').addEventListener('click', async () => {
        await GameEngine.leaveRoom();
        UI.showScreen('lobby');
    });

    // ── Game Actions ───────────────────────────────────────────
    document.getElementById('btnPlayCard').addEventListener('click', () => {
        if (!UI.selectedCard) return;
        const card = UI.selectedCard;
        const state = GameEngine.localState;

        // Chain response?
        if (state.pendingChain && state.pendingChain.active && state.pendingChain.team === GameEngine.myTeam && state.pendingChain.sourceUID !== GameEngine.myUID && card.tag === state.pendingChain.tag) {
            GameEngine.playCardLocal(GameEngine.myUID, card, null);
            UI.selectedCard = null;
            return;
        }

        // Needs target?
        const e = card.effect || {};
        const needsTarget = !!(e.damage || e.sleep || e.polymorphChance || e.silenceSpecial || e.apCostDouble || e.multiRoll || e.grantInvincible || e.delayedHeal || e.soulLink || e.revive || e.damageFromShield || e.executeHPBelow);
        const isSelfOrAOE = !!(e.shield || e.enterIai || e.grantCrit || e.taunt || e.teamBuff || e.coinFlip || e.aoeDamage || e.drawCards || e.buyRandomSpecial || e.deepSleepAll || e.skipEnemyTurn || e.purgeAll || e.invertHealing || e.nullifyNextMagic || e.sacrificeHand || e.enemyAPCostUp || e.consumeAllAP || e.dotAll || e.healLosingTeam || e.rollbackHP || e.nerfBest || e.copyLast || e.absorbAllDmg || e.apCostHalf || e.convertDmgToHeal);

        if (needsTarget && !isSelfOrAOE) {
            UI.showTargetSelection(card, (targetUID) => {
                GameEngine.playCard(card, targetUID);
                UI.selectedCard = null;
            });
        } else {
            GameEngine.playCard(card, null);
            UI.selectedCard = null;
        }
    });

    document.getElementById('btnEndTurn').addEventListener('click', () => {
        GameEngine.endTurn();
    });

    document.getElementById('btnCancelTarget').addEventListener('click', () => {
        UI.hideTargetSelection();
    });

    document.getElementById('btnBackToLobby').addEventListener('click', () => {
        GameEngine.cleanup();
        climaxShown = false;
        UI.showScreen('lobby');
    });

    // ── Room Setup (Online Mode) ───────────────────────────────
    function setupRoomListeners() {
        GameEngine.listenToRoom({
            onPlayersChange(players) {
                currentPlayers = players || {};
                GameEngine.setPlayersCache(currentPlayers);
                UI.renderCharacterSelect(currentPlayers);
                UI.renderPlayersGrid(currentPlayers);
            },
            onStatusChange(status) {
                if (status === 'playing') {
                    GameEngine.myTeam = currentPlayers[GameEngine.myUID]?.team;
                    GameEngine.myCharacter = currentPlayers[GameEngine.myUID]?.character;
                    UI.showScreen('game');
                    setupGameListeners();
                }
            }
        });
    }

    function setupGameListeners() {
        GameEngine.listenToGame({
            onGameUpdate(state) {
                UI.renderGameState(state, currentPlayers);
                if (state.climaxActive && !climaxShown) { climaxShown = true; UI.showClimaxBanner(); }
            }
        });
    }

    // ── Keyboard shortcuts ─────────────────────────────────────
    document.getElementById('inputRoomCode').addEventListener('keypress', e => { if (e.key === 'Enter') document.getElementById('btnJoinRoom').click(); });
    document.getElementById('inputNickname').addEventListener('keypress', e => { if (e.key === 'Enter') document.getElementById('btnCreateRoom').click(); });

})();
