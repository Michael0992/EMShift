const imgs = ["knight.png","hero.png","goblins.png","ambush.png","beggar.png","caravels.png","cavalry.png","support.png"];
const titles = ["Gefallener Ritter","Unerschrockener Held","Goblin Armee","Hinterhalt","Schlechte Zeiten","Reichtum","Kavallerie","Unterstützung"];
const texts = [
    "Ein gefallener Ritter aus den Schattenkriegen des Hochmittelalters, dessen Seele durch endlose Schlachten verhärtet wurde.",
    "Ein unerschrockener Held, der sich den Mächten der Dunkelheit entgegenstellt.",
    "Eine Goblin Armee, die aus den Tiefen der Wälder aufsteigt, um Chaos zu verbreiten.",
    "Ein hinterhältiger Hinterhalt, der die Feinde überrascht und ihnen den Boden wegzieht.",
    "Schlechte Zeiten, in denen nur die Mutigsten überleben können.",
    "Reichtum aus den Schätzen der alten Königreiche.",
    "Kavallerie, die mit unbändiger Kraft über das Schlachtfeld stürmt.",
    "Unterstützung, die den Helden den entscheidenden Vorteil verschafft."
];

// ===== SPIELZUSTAND =====
const game = {
    playerHP: 8000,
    opponentHP: 8000,
    playerField: Array(5).fill(null),
    opponentField: Array(5).fill(null),
    playerHand: [],
    round: 'player',
    roundCounter: 0,
    timer: 60,
    hasDrawnThisTurn: false,
    hasPlayedThisTurn: false,   // max. 1 Karte pro Runde legen
    hasAttackedThisTurn: false, // entweder legen ODER angreifen
    selectedHandCard: null,     // { card, el }
    attackingFieldIndex: null,
};

let cardIdCounter = 0;

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
    randomizeStapel();
    updateHP();
    updateGameInfo();
    load_opponent();
    clock();

    // Startkarten ziehen
    for (let i = 0; i < 3; i++) drawPlayerCard();
    game.hasDrawnThisTurn = true;
    updateUI();
});

function randomizeStapel() {
    const stapel = document.getElementsByClassName("pseudokarte");
    for (let i = 0; i < stapel.length; i++) {
        stapel[i].style.transform = "rotate(" + (Math.random() * 20 - 10) + "deg)";
    }
}

// ===== LEBENSPUNKTE =====
function updateHP() {
    document.getElementById('player-lp-value').textContent = game.playerHP;
    document.getElementById('opponent-lp-value').textContent = game.opponentHP;
}

function applyDamage(target, amount) {
    if (target === 'player') {
        game.playerHP = Math.max(0, game.playerHP - amount);
        document.getElementById('player-lp-display').classList.add('damage-flash');
        setTimeout(() => document.getElementById('player-lp-display').classList.remove('damage-flash'), 600);
    } else {
        game.opponentHP = Math.max(0, game.opponentHP - amount);
        document.getElementById('opponent-lp-display').classList.add('damage-flash');
        setTimeout(() => document.getElementById('opponent-lp-display').classList.remove('damage-flash'), 600);
    }
    updateHP();
    if (game.playerHP <= 0) showMessage("Du hast verloren!");
    else if (game.opponentHP <= 0) showMessage("Du hast gewonnen!");
}

// ===== KARTEN ERSTELLEN =====
function randomStat() {
    return Math.floor(Math.random() * 2701) + 300; // 300–3000
}

function createCard() {
    const idx = Math.floor(Math.random() * imgs.length);
    return {
        id: 'card_' + (++cardIdCounter),
        name: titles[idx],
        img: imgs[idx],
        text: texts[idx],
        atk: randomStat(),
        def: randomStat(),
    };
}

function buildHandCardElement(card) {
    const el = document.createElement('div');
    el.className = 'spielkarte on_hand';
    el.id = card.id;
    el.innerHTML = `
        <div class="front">
            <span class="kartenTitel">${card.name}</span>
            <div class="kartenStatus">
                <div><img src="./imgs/dmg.png" alt="ATK"><span>${card.atk}</span></div>
                <div><img src="./imgs/deff.png" alt="DEF"><span>${card.def}</span></div>
            </div>
            <img src="./imgs/${card.img}" alt="${card.name}"/>
            <p>${card.text}</p>
        </div>
        <div class="back"></div>`;
    el.addEventListener('click', () => onHandCardClick(card, el));
    return el;
}

// ===== HAND MANAGEMENT =====
const handPositions = [
    { left: "10vw",  bottom: "-10px", rot: "-20deg" },
    { left: "17vw",  bottom: "10px",  rot: "-10deg" },
    { left: "25vw",  bottom: "15px",  rot: "0deg"   },
    { left: "33vw",  bottom: "10px",  rot: "10deg"  },
    { left: "40vw",  bottom: "-10px", rot: "20deg"  },
];

function repositionHand() {
    const els = document.querySelectorAll('.spielkarte.on_hand');
    els.forEach((el, i) => {
        const pos = handPositions[i] || handPositions[handPositions.length - 1];
        el.style.left = pos.left;
        el.style.bottom = pos.bottom;
        el.style.transform = `rotate(${pos.rot})`;
        el.style.zIndex = 10 + i;       
    });
}

function drawPlayerCard() {
    if (game.playerHand.length >= 5) return;
    const card = createCard();
    game.playerHand.push(card);
    const el = buildHandCardElement(card);
    document.body.appendChild(el);
    repositionHand();
}

function onDrawPileClick() {
    if (game.round !== 'player') {
        showMessage("Du bist nicht am Zug!");
        return;
    }
    if (game.hasDrawnThisTurn) {
        showMessage("Du hast diese Runde bereits eine Karte gezogen!");
        return;
    }
    if (game.playerHand.length >= 5) {
        showMessage("Deine Hand ist voll!");
        return;
    }
    drawPlayerCard();
    game.hasDrawnThisTurn = true;
    updateUI();
}

// ===== HANDKARTE ANKLICKEN =====
function onHandCardClick(card, el) {
    if (game.round !== 'player') return;

    // Laufenden Angriff abbrechen
    if (game.attackingFieldIndex !== null) {
        cancelAttack();
        return;
    }

    // Karte abwählen wenn bereits ausgewählt
    if (game.selectedHandCard && game.selectedHandCard.card.id === card.id) {
        deselectHandCard();
        hideModeSelector();
        return;
    }

    deselectHandCard();
    game.selectedHandCard = { card, el };
    el.classList.add('selected');
    showModeSelector(card);
}

function deselectHandCard() {
    if (game.selectedHandCard) {
        game.selectedHandCard.el.classList.remove('selected');
        game.selectedHandCard = null;
    }
}

// ===== MODUS-AUSWAHL =====
function showModeSelector(card) {
    const sel = document.getElementById('card-mode-selector');
    sel.classList.remove('hidden');
    sel.querySelector('.preview-name').textContent = card.name;
    sel.querySelector('.preview-atk').textContent = card.atk;
    sel.querySelector('.preview-def').textContent = card.def;
}

function hideModeSelector() {
    document.getElementById('card-mode-selector').classList.add('hidden');
}

function playSelectedCard(mode) {
    if (!game.selectedHandCard) return;

    if (game.hasPlayedThisTurn) {
        showMessage("Du hast diese Runde bereits eine Karte gelegt!");
        cancelCardPlay();
        return;
    }
    if (game.hasAttackedThisTurn) {
        showMessage("Du hast bereits angegriffen – du kannst nicht mehr legen!");
        cancelCardPlay();
        return;
    }

    const slotIndex = game.playerField.findIndex(s => s === null);
    if (slotIndex === -1) {
        showMessage("Das Spielfeld ist voll!");
        return;
    }

    const { card, el } = game.selectedHandCard;

    // Karte von der Hand entfernen
    el.remove();
    game.playerHand = game.playerHand.filter(c => c.id !== card.id);
    repositionHand();

    // Karte auf dem Feld platzieren
    game.hasPlayedThisTurn = true;
    const fieldCard = { ...card, mode, attacked: false };
    game.playerField[slotIndex] = fieldCard;

    const slot = document.querySelector(`#player-field .field-slot[data-index="${slotIndex}"]`);
    renderFieldCard(slot, fieldCard, 'player', slotIndex);

    deselectHandCard();
    hideModeSelector();
    updateUI();
}

function cancelCardPlay() {
    deselectHandCard();
    hideModeSelector();
}

// ===== FELDKARTE RENDERN =====
function renderFieldCard(slot, cardData, owner, index) {
    slot.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'spielkarte field-card';
    el.id = cardData.id + '_field';
    el.innerHTML = `
        <div class="front">
            <span class="kartenTitel">${cardData.name}</span>
            <div class="kartenStatus">
                <div><img src="./imgs/dmg.png" alt="ATK"><span>${cardData.atk}</span></div>
                <div><img src="./imgs/deff.png" alt="DEF"><span>${cardData.def}</span></div>
            </div>
            <img src="./imgs/${cardData.img}" alt="${cardData.name}"/>
            <p>${cardData.text}</p>
        </div>
        <div class="back"></div>`;

    if (cardData.mode === 'defense') {
        el.classList.add('defense-mode');
        el.querySelector('.front').style.display = 'none';
        if (owner === 'player') {
            el.classList.add('own-defense'); // hover zeigt Vorderseite
        }
    } else {
        el.querySelector('.back').style.display = 'none';
    }

    if (owner === 'player') {
        el.addEventListener('click', () => onPlayerFieldCardClick(index));
    } else {
        el.addEventListener('click', () => onOpponentFieldCardClick(index));
    }

    slot.appendChild(el);
}

// ===== ANGRIFFS-LOGIK =====
function onPlayerFieldCardClick(index) {
    if (game.round !== 'player') return;
    const card = game.playerField[index];
    if (!card) return;

    if (card.mode === 'defense') {
        showMessage("Verteidigungskarten können nicht angreifen!");
        return;
    }
    if (card.attacked) {
        showMessage("Diese Karte hat bereits angegriffen!");
        return;
    }
    if (game.hasPlayedThisTurn) {
        showMessage("Du hast diese Runde bereits eine Karte gelegt – du kannst nicht mehr angreifen!");
        return;
    }
    if (game.hasAttackedThisTurn) {
        showMessage("Du hast diese Runde bereits angegriffen!");
        return;
    }

    if (game.selectedHandCard) {
        deselectHandCard();
        hideModeSelector();
    }

    if (game.attackingFieldIndex === index) {
        cancelAttack();
        return;
    }

    // Vorherigen Angreifer abwählen
    if (game.attackingFieldIndex !== null) cancelAttack();

    game.attackingFieldIndex = index;
    const el = document.querySelector(`#player-field .field-slot[data-index="${index}"] .field-card`);
    if (el) el.classList.add('attacking');

    document.getElementById('opponent-lp-display').classList.add('attackable');
    showMessage("Wähle ein Ziel: gegnerische Karte oder Lebenspunkte anklicken");
}

function cancelAttack() {
    if (game.attackingFieldIndex !== null) {
        const el = document.querySelector(`#player-field .field-slot[data-index="${game.attackingFieldIndex}"] .field-card`);
        if (el) el.classList.remove('attacking');
        game.attackingFieldIndex = null;
    }
    document.getElementById('opponent-lp-display').classList.remove('attackable');
    hideMessage();
}

function onOpponentFieldCardClick(index) {
    if (game.round !== 'player') return;
    if (game.attackingFieldIndex === null) return;

    const attacker = game.playerField[game.attackingFieldIndex];
    const defender = game.opponentField[index];
    if (!attacker || !defender) return;

    resolveAttack(attacker, game.attackingFieldIndex, defender, index);
}

function resolveAttack(attacker, atkIdx, defender, defIdx) {
    const atkSlot = document.querySelector(`#player-field .field-slot[data-index="${atkIdx}"]`);
    const defSlot = document.querySelector(`#opponent-field .field-slot[data-index="${defIdx}"]`);

    if (defender.mode === 'defense') {
        // Verteidigungskarte aufdecken
        const defEl = defSlot.querySelector('.field-card');
        if (defEl) {
            defEl.querySelector('.front').style.display = 'flex';
            defEl.querySelector('.back').style.display = 'none';
            defEl.classList.remove('defense-mode');
        }

        if (attacker.atk > defender.def) {
            game.opponentField[defIdx] = null;
            defSlot.innerHTML = '';
            // Kein LP-Schaden beim Besiegen einer Verteidigungskarte
        } else if (attacker.atk < defender.def) {
            applyDamage('player', defender.def - attacker.atk);
        }
        // Gleichstand: keine Auswirkungen
    } else {
        // Angriff vs. Angriff
        if (attacker.atk > defender.atk) {
            applyDamage('opponent', attacker.atk - defender.atk);
            game.opponentField[defIdx] = null;
            defSlot.innerHTML = '';
        } else if (attacker.atk < defender.atk) {
            applyDamage('player', defender.atk - attacker.atk);
            game.playerField[atkIdx] = null;
            atkSlot.innerHTML = '';
        } else {
            // Gleichstand: beide zerstört
            game.opponentField[defIdx] = null;
            game.playerField[atkIdx] = null;
            defSlot.innerHTML = '';
            atkSlot.innerHTML = '';
        }
    }

    if (game.playerField[atkIdx]) {
        game.playerField[atkIdx].attacked = true;
        const atkEl = atkSlot.querySelector('.field-card');
        if (atkEl) {
            atkEl.classList.remove('attacking');
            atkEl.classList.add('exhausted');
        }
    }

    game.hasAttackedThisTurn = true;
    game.attackingFieldIndex = null;
    document.getElementById('opponent-lp-display').classList.remove('attackable');
    hideMessage();
    updateUI();
}

function onDirectAttack() {
    if (game.round !== 'player') return;
    if (game.attackingFieldIndex === null) return;

    const opponentHasCards = game.opponentField.some(c => c !== null);
    if (opponentHasCards) {
        showMessage("Der Gegner hat Karten auf dem Feld – du musst diese zuerst angreifen!");
        return;
    }

    const attacker = game.playerField[game.attackingFieldIndex];
    if (!attacker) return;

    applyDamage('opponent', attacker.atk);
    attacker.attacked = true;

    const atkEl = document.querySelector(`#player-field .field-slot[data-index="${game.attackingFieldIndex}"] .field-card`);
    if (atkEl) {
        atkEl.classList.remove('attacking');
        atkEl.classList.add('exhausted');
    }

    game.hasAttackedThisTurn = true;
    game.attackingFieldIndex = null;
    document.getElementById('opponent-lp-display').classList.remove('attackable');
    hideMessage();
    updateUI();
}

// ===== ZUG-MANAGEMENT =====
function endPlayerTurn() {
    if (game.round !== 'player') return;
    cancelAttack();
    deselectHandCard();
    hideModeSelector();

    // Angriffs-Erschöpfung zurücksetzen
    game.playerField.forEach((c, i) => {
        if (!c) return;
        c.attacked = false;
        const el = document.querySelector(`#player-field .field-slot[data-index="${i}"] .field-card`);
        if (el) el.classList.remove('exhausted');
    });

    game.round = 'opponent';
    game.hasDrawnThisTurn = false;
    game.hasPlayedThisTurn = false;
    game.hasAttackedThisTurn = false;
    game.timer = 60;
    updateGameInfo();
    updateUI();

    // Gegner-Zug — Logik wird vom Server übertragen
    onOpponentTurn();
}

function onOpponentTurn() {
    // Wird vom Server übertragen
}

function startPlayerTurn() {
    game.round = 'player';
    game.hasDrawnThisTurn = false;
    game.hasPlayedThisTurn = false;
    game.hasAttackedThisTurn = false;
    game.roundCounter++;
    game.timer = 60;
    updateGameInfo();
    updateUI();
}

// ===== GEGNER-FELD (wird vom Server befüllt) =====
function placeOpponentCard(cardData, mode, slotIndex) {
    // Wird vom Server aufgerufen
    game.opponentField[slotIndex] = { ...cardData, mode, attacked: false };
    const slot = document.querySelector(`#opponent-field .field-slot[data-index="${slotIndex}"]`);
    if (slot) renderFieldCard(slot, { ...cardData, mode }, 'opponent', slotIndex);
}

function removeOpponentCard(slotIndex) {
    // Wird vom Server aufgerufen
    game.opponentField[slotIndex] = null;
    const slot = document.querySelector(`#opponent-field .field-slot[data-index="${slotIndex}"]`);
    if (slot) slot.innerHTML = '';
}

// ===== TIMER =====
function clock() {
    setInterval(() => {
        game.timer--;
        if (game.timer < 0) {
            if (game.round === 'player') {
                endPlayerTurn();
            } else {
                startPlayerTurn();
            }
        }
        document.getElementById('timer').textContent = Math.max(0, game.timer);
        document.getElementById('timer').style.color = game.timer <= 10 ? 'red' : 'black';
    }, 1000);
}

// ===== UI UPDATE =====
function updateGameInfo() {
    const spans = document.getElementById('gameinfo').getElementsByTagName('span');
    spans[0].textContent = game.roundCounter;
    spans[1].textContent = game.round === 'player' ? 'Spieler' : 'Gegner';
}

function updateUI() {
    updateHP();
    updateGameInfo();

    // Zugstapel visuell sperren
    const drawTop = document.querySelector('.draw-top');
    if (drawTop) {
        if (game.round !== 'player' || game.hasDrawnThisTurn) {
            drawTop.classList.add('disabled');
        } else {
            drawTop.classList.remove('disabled');
        }
    }

    // "Zug beenden"-Button
    const btn = document.getElementById('end-turn-btn');
    if (btn) btn.disabled = game.round !== 'player';

    // Angriffsfähige Karten markieren
    const canAttackNow = game.round === 'player' && !game.hasPlayedThisTurn && !game.hasAttackedThisTurn;
    game.playerField.forEach((card, i) => {
        const el = document.querySelector(`#player-field .field-slot[data-index="${i}"] .field-card`);
        if (!el) return;
        if (card && card.mode === 'attack' && !card.attacked && canAttackNow) {
            el.classList.add('can-attack');
        } else {
            el.classList.remove('can-attack');
        }
    });
}

function showMessage(msg) {
    const el = document.getElementById('game-message');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.add('hidden'), 3000);
}

function hideMessage() {
    document.getElementById('game-message').classList.add('hidden');
}

// ===== GEGNER LADEN =====
async function load_opponent() {
    try {
        const response = await fetch("/opponent");
        const data = await response.json();
        const profile = document.getElementById("opponent");
        const img = document.createElement("img");
        img.src = data.image;
        img.id = "opponent_img";
        img.alt = "Profilbild des Gegners";
        const name = document.createElement("div");
        name.textContent = data.name;
        name.id = "opponent_name";
        profile.appendChild(img);
        profile.appendChild(name);
    } catch (e) {
        // Server nicht erreichbar
    }
}
