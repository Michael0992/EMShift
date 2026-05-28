# Projektdokumentation – Kartenspiel Frontend

**Projekt:** Kartenspiel Ingame-Seite  
**Dateien:** `ingame.html`, `script.js`, `style.css`  
**Stand:** 2026-05-20

---

## Übersicht

Das Frontend eines rundenbasierten Kartenspiels im Browser. Die Gegner-Logik wird später vom Server per Socket/API übertragen; alle entsprechenden Stubs sind leer gelassen und kommentiert. Der Spieler steuert seinen Zug vollständig im Browser.

---

## Geänderte & erstellte Dateien

### `ingame.html`

**Vorher:** Nur Sidemenu, Zugstapel, Gegnerstapel und ein Skript-Tag.

**Nachher hinzugefügt:**

| Element | ID / Klasse | Zweck |
|---|---|---|
| Lebenspunkte Gegner | `#opponent-lp-display` | Zeigt gegnerische LP; wird bei Direktangriff angeklickt |
| Lebenspunkte Spieler | `#player-lp-display` | Zeigt eigene LP |
| Spielfeld Gegner | `#opponent-field` | 5 × `.field-slot` für gegnerische Feldkarten |
| Spielfeld Spieler | `#player-field` | 5 × `.field-slot` für eigene Feldkarten |
| Feldtrenner | `#field-divider` | Dünne Linie zwischen beiden Feldhälften |
| Modus-Auswahl | `#card-mode-selector` | Overlay: wählt Angriff oder Verteidigung beim Ausspielen |
| Spielnachricht | `#game-message` | Temporäre Hinweistexte (3 s sichtbar) |
| Zug-beenden-Button | `#end-turn-btn` | Beendet Spielerzug manuell |
| Zugstapel (Klick) | `.stapel` + `.draw-top` | Klick auf oberste Karte zieht 1 Karte |

---

### `script.js`

Vollständige Neuentwicklung auf Basis des bestehenden Grundgerüsts.

#### Spielzustand (`game`-Objekt)

```js
const game = {
    playerHP: 8000,
    opponentHP: 8000,
    playerField: Array(5).fill(null),   // Feldkarten Spieler
    opponentField: Array(5).fill(null), // Feldkarten Gegner
    playerHand: [],
    round: 'player' | 'opponent',
    roundCounter: 0,
    timer: 60,
    hasDrawnThisTurn: false,
    hasPlayedThisTurn: false,    // max. 1 Karte legen pro Runde
    hasAttackedThisTurn: false,  // entweder legen ODER angreifen
    selectedHandCard: null,      // { card, el }
    attackingFieldIndex: null,
}
```

#### Kartenmodell

Jede Karte ist ein einfaches Objekt:

```js
{
    id: 'card_1',
    name: 'Gefallener Ritter',
    img: 'knight.png',
    text: '...',
    atk: 1540,   // zufällig 300–3000
    def: 870,    // zufällig 300–3000
    mode: 'attack' | 'defense',  // nur auf dem Feld
    attacked: false              // wurde diese Runde schon angegriffen
}
```

#### Implementierte Funktionen

| Funktion | Beschreibung |
|---|---|
| `randomizeStapel()` | Stapelkarten mit zufälliger Rotation |
| `updateHP()` | Schreibt aktuelle LP in DOM |
| `applyDamage(target, amount)` | Zieht LP ab, löst Flash-Animation aus, prüft Spielende |
| `randomStat()` | Zufallszahl 300–3000 |
| `createCard()` | Erstellt neues Kartenobjekt mit zufälligen Werten |
| `buildHandCardElement(card)` | Erzeugt DOM-Element für Handkarte |
| `repositionHand()` | Ordnet alle Handkarten in Fächer-Positionen neu |
| `drawPlayerCard()` | Zieht eine Karte (max. 5 auf Hand) |
| `onDrawPileClick()` | Behandelt Klick auf Zugstapel mit Prüfung |
| `onHandCardClick(card, el)` | Öffnet Modus-Selektor oder bricht laufende Aktion ab |
| `deselectHandCard()` | Hebt Selektion einer Handkarte auf |
| `showModeSelector(card)` | Zeigt Overlay mit Angriff/Verteidigung-Auswahl |
| `hideModeSelector()` | Versteckt Overlay |
| `playSelectedCard(mode)` | Legt ausgewählte Karte ins Feld (Angriff oder Verteidigung) |
| `cancelCardPlay()` | Bricht Kartenauswahl ab |
| `renderFieldCard(slot, cardData, owner, index)` | Rendert Feldkarte in Slot |
| `onPlayerFieldCardClick(index)` | Wählt eigene Karte als Angreifer |
| `cancelAttack()` | Bricht Angriffsauswahl ab |
| `onOpponentFieldCardClick(index)` | Wählt Ziel bei gegnerischer Feldkarte |
| `resolveAttack(attacker, atkIdx, defender, defIdx)` | Löst Kampf auf (ATK vs ATK / ATK vs DEF) |
| `onDirectAttack()` | Direktangriff auf gegnerische LP (nur wenn Feld leer) |
| `endPlayerTurn()` | Beendet Spielerzug, setzt Flags zurück |
| `startPlayerTurn()` | Beginnt neuen Spielerzug, setzt Flags zurück |
| `onOpponentTurn()` | **Leer** – Logik wird vom Server übertragen |
| `placeOpponentCard(cardData, mode, slotIndex)` | **Server-Stub** – platziert Karte auf Gegnerfeld |
| `removeOpponentCard(slotIndex)` | **Server-Stub** – entfernt Karte vom Gegnerfeld |
| `clock()` | 60-Sekunden-Timer, wechselt Zug automatisch bei 0 |
| `updateGameInfo()` | Aktualisiert Runde und „Am Zug"-Anzeige |
| `updateUI()` | Zentrales UI-Update nach jeder Aktion |
| `showMessage(msg)` | Zeigt Hinweistext 3 Sekunden lang |
| `hideMessage()` | Versteckt Hinweistext sofort |
| `load_opponent()` | Lädt Gegner-Profil (Name, Bild) vom Server (`/opponent`) |

#### Aktionsbeschränkungen pro Runde (neu)

- **Nur 1 Karte legen** pro Runde (`hasPlayedThisTurn`)
- **Entweder legen ODER angreifen** – beide Aktionen schließen sich gegenseitig aus (`hasPlayedThisTurn` / `hasAttackedThisTurn`)
- Alle Flags werden beim Zugwechsel zurückgesetzt

#### Kampfregeln

| Situation | Ergebnis |
|---|---|
| ATK > gegn. ATK | Gegnerische Karte zerstört, Differenz als LP-Schaden beim Gegner |
| ATK < gegn. ATK | Eigene Karte zerstört, Differenz als LP-Schaden beim Spieler |
| ATK = gegn. ATK | Beide Karten zerstört, kein LP-Schaden |
| ATK > gegn. DEF | Verteidigungskarte zerstört, kein LP-Schaden |
| ATK < gegn. DEF | Eigene Karte bleibt, Differenz als LP-Schaden beim Spieler |
| ATK = gegn. DEF | Keine Auswirkungen |
| Direktangriff | Nur möglich wenn Gegnerfeld komplett leer; ATK als LP-Schaden |

#### Startzustand

- Beide Spieler: 8000 LP
- Spieler zieht automatisch 3 Startkarten
- `hasDrawnThisTurn = true` nach Starthand (erste Runde kein weiteres Ziehen)

---

### `style.css`

**Vorher:** Sidemenu, Spielkarte, Pseudokarte, Flip-Animationen.

**Nachher hinzugefügt/geändert:**

#### Lebenspunkte-Anzeigen

```
#opponent-lp-display  → oben rechts im Spielfeld
#player-lp-display    → unten rechts im Spielfeld
```

- `.attackable` – rotes Pulsieren, wenn Direktangriff möglich
- `.damage-flash` – roter Hintergrund-Flash bei Schadensereignis

#### Spielfeld-Layout

```
#opponent-field   → obere Feldhälfte, zentriert links der Sidebar
#player-field     → untere Feldhälfte, zentriert links der Sidebar
#field-divider    → horizontale Trennlinie bei 50% Höhe
.field-slot       → 120 × 200 px, gestrichelte Umrandung
```

#### Feldkarten (`.field-card`)

- Skaliert auf Slot-Größe (120 × 200 px)
- **Angriffsmodus:** Vorderseite sichtbar
- **Verteidigungsmodus** (`.defense-mode`): 90° gedreht, Rückseite oben
  - `.own-defense` + `:hover` → zeigt eigene Vorderseite temporär (👁)
- **`.can-attack`** → gelber Rahmen/Leuchten (angriffsfähig)
- **`.attacking`** → oranges Pulsieren (ausgewählt als Angreifer)
- **`.exhausted`** → abgedunkelt (Angriff bereits durchgeführt)

#### Handkarten (Erweiterungen)

- Hover: Karte springt hoch, Rotation wird aufgehoben
- `.selected`: gelber Rahmen + springt hoch

#### Modus-Auswahl (`#card-mode-selector`)

- Overlay über dem Spielfeld
- Zeigt Kartenname, ATK, DEF
- Buttons: Angriff / Verteidigung / Abbrechen

#### Zugstapel

- `.draw-top.disabled` → abgedunkelt und kein Cursor, wenn Ziehen nicht erlaubt

#### Spielnachricht (`#game-message`)

- Zentriert auf dem Feld, halbdurchsichtig, `pointer-events: none`

---

## Spielablauf (Zusammenfassung)

```
Spielstart
  └─ 3 Startkarten ziehen (automatisch)
  
Spielerzug
  ├─ [Optional] 1 Karte ziehen (Klick auf Zugstapel)
  ├─ [Optional] 1 Handkarte ins Feld legen  ──┐ schließen sich
  ├─ [Optional] 1 Feldkarte angreifen        ──┘ gegenseitig aus
  └─ Zug beenden (Button oder Timer abgelaufen)

Gegnerzug
  └─ Logik wird vom Server übertragen (onOpponentTurn ist leer)
```

---

## Server-Schnittstellen (Stubs)

```js
// Gegner-Karte auf Feld platzieren
placeOpponentCard(cardData, mode, slotIndex)

// Gegner-Karte vom Feld entfernen
removeOpponentCard(slotIndex)

// Wird aufgerufen wenn Gegnerzug startet (leer)
onOpponentTurn()
```

Diese Funktionen sind vorhanden und können direkt vom Server per WebSocket/Fetch aufgerufen werden.

---

## Bekannte Einschränkungen / Offene Punkte

- Gegner-Handkarten-Verwaltung (Anzahl sichtbarer Rücken) kommt vom Server
- Keine Siegbedingung außer LP = 0 (kein Deckout etc.)
- Karten haben keine Spezialfähigkeiten
- Kein Undo / Zurückziehen einer Aktion
