document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DEFINIÇÕES GLOBAIS E CONSTANTES ---
    const clans = {
        'Brujah': { class: 'card-brujah', name: 'Brujah', cost: 0, description: 'Membros da ralé, rebeldes e tiranos com uma paixão ardente.', initialBlood: 10, maxBlood: 12, initialHumanity: 6, disciplines: [{ name: 'Potência', cost: 1, effect: 'potency', description: 'Ignora a perda de Sangue ao enfrentar um perigo.'},{ name: 'Presença', cost: 1, effect: 'presence', targetType: 'danger', description: 'Intimida um inimigo adjacente, fazendo-o fugir.' },{ name: 'Rapidez', cost: 2, effect: 'celerity', description: 'Seu próximo movimento é silencioso e anula até 2 de dano.' }] },
        'Nosferatu': { class: 'card-nosferatu', name: 'Nosferatu', cost: 75, description: 'Espiões e monstros escondidos, mestres dos segredos.', initialBlood: 8, maxBlood: 10, initialHumanity: 7, disciplines: [{ name: 'Ofuscação', cost: 2, effect: 'obfuscate', description: 'Move-se para uma casa adjacente sem ativar seu efeito.'},{ name: 'Animalismo', cost: 1, effect: 'animalism', targetType: 'any', description: 'Transforma uma carta adjacente em Ratos.' },{ name: 'Potência', cost: 1, effect: 'potency', description: 'Ignora a perda de Sangue ao enfrentar um perigo.' }] },
        'Toreador': { class: 'card-toreador', name: 'Toreador', cost: 75, description: 'Artesãos obcecados pela beleza em todas as suas formas.', initialBlood: 8, maxBlood: 10, initialHumanity: 7, disciplines: [{ name: 'Presença', cost: 1, effect: 'charm', description: 'Encanta um Mortal, ganhando +2 de Sangue extra.'},{ name: 'Auspícios', cost: 1, effect: 'auspex', description: 'Revela o tipo de todas as cartas no tabuleiro.' },{ name: 'Rapidez', cost: 2, effect: 'celerity', description: 'Seu próximo movimento é silencioso e anula até 2 de dano.' }] }
    };
    const cardPool = [
        { weight: 20, data: { name: 'Rato', type: 'animal', blood: 1 } }, { weight: 15, data: { name: 'Beco', type: 'safe', humanity: 1 } }, { weight: 25, data: { name: 'Policial', type: 'danger', blood: -2 } }, { weight: 15, data: { name: 'Mortal', type: 'mortal', blood: 3, humanity: -2 } }, { weight: 8,  data: { name: 'O_Abraço', type: 'fateful_choice' } }, { weight: 8,  data: { name: 'Carniçal', type: 'ally_choice' } }, { weight: 7,  data: { name: 'Nova_Inquisicao', type: 'inquisition_danger', blood: -3 } }, { weight: 1,  data: { name: 'Refugio', type: 'haven', blood: 4, humanity: 1 } }, { weight: 1,  data: { name: 'Bolsa_sangue', type: 'special', blood: 4 } }
    ];

    // --- 2. VARIÁVEIS DE ESTADO E REFERÊNCIAS ---
    let weightedCardDeck = []; let player; let gameBoard = new Array(9).fill(null); let activeDiscipline = null; let isPlayerTurn = true; let totalInfluence = 0; let unlockedClans = {};
    const screens = { menu: document.getElementById('main-menu-screen'), clanSelect: document.getElementById('clan-select-screen'), game: document.getElementById('game-screen'), store: document.getElementById('clans-store-screen'), };
    const boardElement = document.getElementById('game-board'); const choiceModal = document.getElementById('choice-modal');

    // --- 3. DECLARAÇÃO DE TODAS AS FUNÇÕES ---
    function generateWeightedDeck() { weightedCardDeck = []; cardPool.forEach(e => { for (let i = 0; i < e.weight; i++) { weightedCardDeck.push(e.data); } }); }
    function getRandomCard() { return { ...weightedCardDeck[Math.floor(Math.random() * weightedCardDeck.length)] }; }
    function createNewPlayer(clanName) { const clan = clans[clanName]; return { clan: clan, blood: clan.initialBlood, humanity: clan.initialHumanity, position: 4, isDiseased: false, runStats: { elitesDefeated: 0, turns: 0, influenceGained: 0, alliesMaintained: 0, embraced: 0 } }; }
    function isAdjacentForMovement(index1, index2) { const r1 = Math.floor(index1 / 3), c1 = index1 % 3, r2 = Math.floor(index2 / 3), c2 = index2 % 3; return (r1 === r2 && Math.abs(c1 - c2) === 1) || (c1 === c2 && Math.abs(r1 - r2) === 1); }
    function getOrthogonalAdjacentIndices(index) { const indices = []; const r = Math.floor(index / 3), c = index % 3; if (r > 0) indices.push(index - 3); if (r < 2) indices.push(index + 3); if (c > 0) indices.push(index - 1); if (c < 2) indices.push(index + 1); return indices.filter(i => gameBoard[i]); }
    function getAdjacentIndices(index) { const indices = []; const sr = Math.floor(index / 3) - 1, sc = index % 3 - 1; for (let r = sr; r <= sr + 2; r++) { for (let c = sc; c <= sc + 2; c++) { if (r >= 0 && r < 3 && c >= 0 && c < 3) { const ni = r * 3 + c; if (ni !== index) indices.push(ni); } } } return indices; }
    function logMessage(m){ document.getElementById("log-message").textContent=m; }
    function fillBoard() { for (let i = 0; i < gameBoard.length; i++) { if (i !== player.position) { gameBoard[i] = getRandomCard(); } else { gameBoard[i] = null; } } }
    
    function createCardElement(cardData, index) { const e = document.createElement("div"); e.classList.add("card"); if (player && index === player.position) { e.classList.add("player", player.clan.class); const bloodStat = document.createElement('div'); bloodStat.className = 'card-stat player-blood-stat'; bloodStat.textContent = `${player.blood}`; e.appendChild(bloodStat); const humanityStat = document.createElement('div'); humanityStat.className = 'card-stat player-humanity-stat'; humanityStat.textContent = `${player.humanity}`; e.appendChild(humanityStat); } else if (cardData) { e.classList.add("card-" + cardData.name.replace('_','-')); const isAdj = player ? isAdjacentForMovement(player.position, index) : false; if (isAdj) { if (activeDiscipline && activeDiscipline.targetType && (activeDiscipline.targetType === "any" || cardData.type.includes(activeDiscipline.targetType))) { e.classList.add("targetable"); e.addEventListener("click", () => targetDiscipline(index)); } else { e.addEventListener("click", () => movePlayer(index)); } } else { e.classList.add("non-adjacent"); } e.innerHTML = `<span>${cardData.isRevealed ? cardData.type.toUpperCase() : cardData.name.replace('_',' ')}</span>`; if (cardData.blood) { const s = document.createElement('div'); s.className = `card-stat ${cardData.blood > 0 ? "stat-gain" : "stat-loss"}`; s.textContent = `${cardData.blood > 0 ? "+" : ""}${cardData.blood}`; e.appendChild(s); } if (cardData.humanity) { const s = document.createElement('div'); s.className = `card-stat ${cardData.humanity > 0 ? "stat-gain" : "stat-loss"}`; s.textContent = `${cardData.humanity > 0 ? "+" : ""}${cardData.humanity}`; s.style.color = "#2196F3"; s.style.top = "30px"; e.appendChild(s); } } return e; }
    function drawDisciplineButtons() { const c = document.getElementById("disciplines-container"); if(c) { c.innerHTML = ""; if (player && player.clan) { player.clan.disciplines.forEach(d => { const b = document.createElement("button"); b.className = "discipline-btn"; b.textContent = `${d.name} (${d.cost})`; b.title = d.description; b.onclick = () => activateDiscipline(d); if (activeDiscipline && activeDiscipline.effect === d.effect) b.classList.add("active"); c.appendChild(b); }); } } }
    
    function updateUI() {
        boardElement.innerHTML = ''; gameBoard.forEach((cardData, index) => { const cardElement = createCardElement(cardData, index); cardElement.style.transform = ''; cardElement.style.opacity = '1'; boardElement.appendChild(cardElement); });
        if(player) {
            document.getElementById('clan-name').textContent = player.clan.name;
            document.getElementById('blood-stat').textContent = player.blood; // Revertido para não mostrar o máximo
            document.getElementById('humanity-stat').textContent = player.humanity;
        }
        drawDisciplineButtons();
    }

    function populateClanStore() { const container = document.getElementById('clans-store-container'); container.innerHTML = ''; for (const clanName in clans) { const clan = clans[clanName]; const card = document.createElement('div'); card.className = 'clan-store-card'; let html = `<h3>${clan.name}</h3><p>${clan.description}</p><h4>Disciplinas:</h4><ul class="discipline-list">${clan.disciplines.map(d=>`<li><strong>${d.name} (${d.cost}):</strong> ${d.description}</li>`).join('')}</ul>`; if (unlockedClans[clanName]) { card.classList.add('unlocked'); html += `<div class="buy-section"><span><strong>Desbloqueado</strong></span></div>`; } else { card.classList.add('locked'); html += `<div class="buy-section"><button class="buy-btn" data-clan="${clanName}" ${totalInfluence < clan.cost ? 'disabled' : ''}>Comprar (${clan.cost} Influência)</button></div>`; } card.innerHTML = html; container.appendChild(card); } document.querySelectorAll('.buy-btn').forEach(btn => btn.addEventListener('click', () => buyClan(btn.dataset.clan))); }
    function populateClanSelection() { const container = document.getElementById('clan-selection-container'); container.innerHTML = ''; for(const clanName in unlockedClans) { if (unlockedClans[clanName]) { const btn = document.createElement('button'); btn.className = 'menu-btn'; btn.textContent = clanName; btn.addEventListener('click', () => startGame(clanName)); container.appendChild(btn); } } }
    function animateCascade(emptyIndex) { const adjacentIndices = getOrthogonalAdjacentIndices(emptyIndex); if (adjacentIndices.length === 0) { gameBoard[emptyIndex] = getRandomCard(); updateUI(); return; } const police = adjacentIndices.filter(i => gameBoard[i].type.includes('danger')); const replacementIndex = police.length > 0 ? police[0] : adjacentIndices[0]; const cardToMoveElement = Array.from(boardElement.children)[replacementIndex]; const emptyCardElement = Array.from(boardElement.children)[emptyIndex]; if (!cardToMoveElement || !emptyCardElement) return; cardToMoveElement.style.transform = `translate(${emptyCardElement.offsetLeft - cardToMoveElement.offsetLeft}px, ${emptyCardElement.offsetTop - cardToMoveElement.offsetTop}px)`; setTimeout(() => { gameBoard[emptyIndex] = gameBoard[replacementIndex]; gameBoard[replacementIndex] = getRandomCard(); updateUI(); }, 200); }
    
    function showScreen(screenName) { Object.values(screens).forEach(s => s.classList.add('hidden')); screens[screenName].classList.remove('hidden'); }
    function saveMetaState() { localStorage.setItem('vtm_influence', totalInfluence); localStorage.setItem('vtm_unlockedClans', JSON.stringify(unlockedClans)); }
    function loadMetaState() { totalInfluence = parseInt(localStorage.getItem('vtm_influence') || '0', 10); const savedClans = localStorage.getItem('vtm_unlockedClans'); unlockedClans = savedClans ? JSON.parse(savedClans) : { 'Brujah': true, 'Nosferatu': false, 'Toreador': false }; document.getElementById('total-influence-display').textContent = totalInfluence; }
    function saveGame() { if (player) localStorage.setItem('vtm_save_game', JSON.stringify({player, gameBoard})); }
    function loadGame() { const savedGame = localStorage.getItem('vtm_save_game'); if (savedGame) { const savedState = JSON.parse(savedGame); player = savedState.player; gameBoard = savedState.gameBoard; logMessage('Continuando a noite...'); isPlayerTurn = true; updateUI(); showScreen('game'); return true; } return false; }
    function buyClan(clanName) { const clan = clans[clanName]; if (totalInfluence >= clan.cost && !unlockedClans[clanName]) { totalInfluence -= clan.cost; unlockedClans[clanName] = true; saveMetaState(); document.getElementById('total-influence-display').textContent = totalInfluence; populateClanStore(); } }
    
    function endGame(endMessage) { isPlayerTurn = false; let runInfluence = player.runStats.influenceGained; let summaryHTML = `<h3>Resumo da Noite</h3><p>+${runInfluence.toFixed(1)} por suas ações.</p>`; if (player.blood > 0 && player.humanity > 0) { const s = 10; runInfluence += s; summaryHTML += `<p>+${s} (Bônus) por sobreviver.</p>`; } const e = player.runStats.elitesDefeated * 5; if (e > 0) { runInfluence += e; summaryHTML += `<p>+${e} (Bônus) por eliminar ameaças.</p>`; } const a = player.runStats.alliesMaintained * 1; if (a > 0) { runInfluence += a; summaryHTML += `<p>+${a} por manter seus aliados.</p>`; } const b = player.runStats.embraced * 5; if (b > 0) { runInfluence += b; summaryHTML += `<p>+${b} por expandir sua linhagem.</p>`; } totalInfluence += runInfluence; saveMetaState(); localStorage.removeItem('vtm_save_game'); boardElement.innerHTML = `<div class="end-game-summary"><h2>${endMessage}</h2>${summaryHTML}<h4>Influência total ganha: ${runInfluence.toFixed(1)}</h4></div>`; const abilities = document.getElementById('abilities'); if(abilities) abilities.innerHTML = ''; const quitBtn = document.getElementById('quit-run-btn'); if(quitBtn) { quitBtn.textContent = "Voltar ao Menu"; quitBtn.onclick = () => init(); } }
    function endTurn({ message, oldPosition }) { if (player.isDiseased) { player.blood--; logMessage(message.trim() + " (Você se sente doente...)"); } else { logMessage(message.trim()); } if (oldPosition !== undefined && oldPosition !== -1) { animateCascade(oldPosition); } else { updateUI(); } if (player.blood <= 0) { endGame("Você sucumbiu à Fome Final."); return; } if (player.humanity <= 0) { endGame("Você se entregou à Besta."); return; } saveGame(); setTimeout(() => { isPlayerTurn = true; }, 450); }
    
    function resolveChoice(choice, oldPosition) {
        choiceModal.classList.add("hidden"); let message = '';
        switch(choice) {
            case 'sacrifice':
                player.humanity = Math.max(0, player.humanity - 2); message = "Você o envia para uma morte certa. O caminho está limpo.";
                getAdjacentIndices(player.position).forEach(idx => {
                    if (gameBoard[idx] && (gameBoard[idx].type.includes('danger') || gameBoard[idx].type === 'obstacle')) {
                        gameBoard[idx] = { name: 'Beco', type: 'safe', humanity: 1 };
                    }
                });
                break;
            case 'maintain':
                if(player.blood > 1) { player.blood--; player.runStats.alliesMaintained++; message = "Sua influência sobre seus lacaios cresce."; }
                else { message = "Sangue insuficiente para manter a lealdade."; }
                break;
            case 'ignore':
                message = "Você sabiamente se afasta da tentação.";
                break;
            case 'embrace':
                if (player.blood > 3 && player.humanity > 1) {
                    player.blood -= 3; player.humanity--; player.runStats.embraced++;
                    message = "O feito está consumado. Uma nova cria da noite caminha na Terra.";
                } else { message = "Você não tem o sangue ou a força de vontade para o Abraço."; }
                break;
        }
        endTurn({ message, oldPosition });
    }
    
    function showChoiceModal(cardType, oldPosition) {
        const title = document.querySelector('#choice-modal h3'); const desc = document.querySelector('#choice-modal p');
        const btn1 = document.getElementById('choice-btn-1'); const btn2 = document.getElementById('choice-btn-2');
        if (cardType === 'ally_choice') {
            title.textContent = "Um Carniçal Leal"; desc.textContent = "Você pode sacrificá-lo para limpar a área, ou reforçar sua lealdade para o futuro.";
            btn1.textContent = "Sacrificar (-2 Humanidade)"; btn2.textContent = "Alimentar (-1 Sangue, +1 Influência)";
            btn1.onclick = () => resolveChoice('sacrifice', oldPosition); btn2.onclick = () => resolveChoice('maintain', oldPosition);
        } else if (cardType === 'fateful_choice') {
            title.textContent = "A Oportunidade de um Abraço"; desc.textContent = "Este mortal... ele tem potencial. Amaldiçoá-lo com a imortalidade trará grande poder, a um custo.";
            btn1.textContent = "Ignorar"; btn2.textContent = "Abraçar (-3 Sangue, -1 Humanidade, +5 Influência)";
            btn1.onclick = () => resolveChoice('ignore', oldPosition); btn2.onclick = () => resolveChoice('embrace', oldPosition);
        }
        choiceModal.classList.remove('hidden');
    }
    
    function activateDiscipline(d) { if (!isPlayerTurn) return; if (activeDiscipline && activeDiscipline.effect === d.effect) { activeDiscipline = null; logMessage("Disciplina desativada."); } else if (player.blood > d.cost) { activeDiscipline = d; logMessage(`Ativado: ${d.name}.`); if (d.effect === "auspex") { player.blood -= d.cost; logMessage("Você sente a aura das coisas ao redor."); getAdjacentIndices(player.position).forEach(i => { if (gameBoard[i]) gameBoard[i].isRevealed = true; }); activeDiscipline = null; } } else { logMessage("Sangue insuficiente."); } updateUI(); }
    function targetDiscipline(t) { if (!activeDiscipline || !gameBoard[t]) return; isPlayerTurn = false; player.blood -= activeDiscipline.cost; let m = ""; const o = player.position; if (activeDiscipline.effect === "animalism") { gameBoard[t] = { name: "Ratos", type: "animal", blood: 2 }; m = "Você invoca um enxame."; player.runStats.influenceGained += 1; } else if (activeDiscipline.effect === "presence" && gameBoard[t].type.includes("danger")) { gameBoard[t] = getRandomCard(); m = "Intimidado, o perigo recua."; player.runStats.influenceGained += 2; } activeDiscipline = null; endTurn({ message: m, oldPosition: o }); }
    
    function movePlayer(targetIndex) {
        if (!isPlayerTurn || !gameBoard[targetIndex]) return;
        isPlayerTurn = false; player.runStats.turns++; const oldPosition = player.position; const targetCard = { ...gameBoard[targetIndex] };
        if (targetCard.type === 'ally_choice' || targetCard.type === 'fateful_choice') { player.position = targetIndex; gameBoard[player.position] = null; showChoiceModal(targetCard.type, oldPosition); return; }
        const isElite = targetCard.type.includes('inquisition'); if (isElite) player.runStats.elitesDefeated++;
        const playerCardElement = document.querySelector('.player'); const targetCardElement = Array.from(boardElement.children)[targetIndex]; if (!playerCardElement || !targetCardElement) { isPlayerTurn = true; return; }
        playerCardElement.style.transform = `translate(${targetCardElement.offsetLeft - playerCardElement.offsetLeft}px, ${targetCardElement.offsetTop - playerCardElement.offsetTop}px)`; targetCardElement.style.opacity = '0';
        setTimeout(() => {
            let message = ''; let isSilentMove = false;
            if (activeDiscipline) {
                player.blood -= activeDiscipline.cost;
                switch (activeDiscipline.effect) {
                    case 'potency': if (targetCard.type.includes('danger')) { targetCard.blood = 0; message = 'Com Potência, você supera o perigo. '; } break;
                    case 'obfuscate': message = 'Você usa Ofuscação e passa despercebido.'; isSilentMove = true; break;
                    case 'celerity': isSilentMove = true; if(targetCard.blood < 0) {targetCard.blood = Math.min(0, targetCard.blood + 2);} message = 'Seu ataque é veloz e silencioso. '; break;
                }
                activeDiscipline = null;
            }
            if (targetCard.blood) { player.blood = Math.min(player.clan.maxBlood, player.blood + targetCard.blood); }
            if (targetCard.humanity) { player.humanity = Math.max(0, Math.min(10, player.humanity + targetCard.humanity)); }
            if (targetCard.type === 'animal' && Math.random() < 0.25) { player.isDiseased = true; message += " O sangue da criatura estava doente! "; }
            if ((targetCard.type === 'mortal' || targetCard.type === 'haven') && player.isDiseased) { player.isDiseased = false; message += " O sangue puro te cura da doença. "; }
            let influenceFromAction = 0; if (targetCard.type.includes('danger') || targetCard.type === 'mortal') { influenceFromAction = 1; } else if (targetCard.type === 'safe' || targetCard.type === 'animal') { influenceFromAction = 0.5; } player.runStats.influenceGained += influenceFromAction;
            player.position = targetIndex; gameBoard[player.position] = null;
            if (targetCard.type === 'obstacle') { gameBoard[oldPosition] = getRandomCard(); endTurn({message, oldPosition: -1}); return; }
            if (!isSilentMove) {
                const isLoudAction = targetCard.type.includes('danger') || targetCard.type === 'mortal';
                if (isLoudAction && Math.random() < 0.33) {
                    const validNeighbors = getAdjacentIndices(targetIndex).filter(i => gameBoard[i] && i !== oldPosition);
                    if (validNeighbors.length > 0) { gameBoard[validNeighbors[0]] = { name: 'Policial', type: 'danger', blood: -2 }; message += 'A comoção atrai a polícia!'; }
                }
            }
            endTurn({ message, oldPosition });
        }, 300);
    }
    
    function startGame(clanName) {
        player = createNewPlayer(clanName);
        gameBoard.fill(null);
        fillBoard();
        isPlayerTurn = true;
        activeDiscipline = null;
        logMessage(`A noite começa para o clã ${clanName}.`);
        const quitBtn = document.getElementById('quit-run-btn');
        if(quitBtn) { quitBtn.textContent = "Desistir da Noite"; quitBtn.onclick = () => { endGame("Você abandonou a caçada."); }; }
        updateUI();
        saveGame();
        showScreen('game');
    }
    
    function init() {
        showScreen('menu');
        generateWeightedDeck();
        loadMetaState();
        const continueBtn = document.getElementById('continue-btn');
        if (localStorage.getItem('vtm_save_game')) {
            continueBtn.classList.remove('hidden');
            continueBtn.addEventListener('click', loadGame);
        } else {
            continueBtn.classList.add('hidden');
        }
        document.getElementById('new-game-btn').addEventListener('click', () => { localStorage.removeItem('vtm_save_game'); populateClanSelection(); showScreen('clanSelect'); });
        document.getElementById('clans-btn').addEventListener('click', () => { populateClanStore(); showScreen('store'); });
        document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', () => init()));
    }

    // --- PONTO DE ENTRADA ---
    init();
});