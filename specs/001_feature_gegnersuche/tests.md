# Tests

**Schreibe für jeden dieser Überprüfungen einen Unit Test unter EMShift\Test**

- [ ] Test-001: Überprüfen, ob der Button "Spiel vs Mensch" auf der Index.html Seite sichtbar und klickbar ist, solange die Gegnersuche nicht läuft.

- [ ] Test-002: Überprüfen, ob die Nachricht "Gegnersuche läuft..." angezeigt wird, sobald der Benutzer auf den Button klickt.

- [ ] Test-003: Überprüfen, ob eine Funktion beim Klicken auf den Button mit dem Parameter "human" aufgerufen wird, um die Gegnersuche zu starten.

- [ ] Test-004: Überprüfen, ob die Funktion eine Anfrage an den Server schickt, um einen Gegner zu suchen.

- [ ] Test-005: Überprüfen, ob das System korrekt auf die Antwort des Servers reagiert, insbesondere bei Statuscodes 200 und 202.

- [ ] Test-006: Überprüfen, ob das System prüft, ob der Spieler bereits zu einem Raum gehört.

- [ ] Test-007: Überprüfen, ob das System nach offenen Räumen in der Datenbank sucht und einen neuen Raum erstellt, wenn kein offener Raum gefunden wird.

- [ ] Test-008: Überprüfen, ob der Benutzer automatisch in den Spielraum weitergeleitet wird, sobald ein Gegner gefunden wurde oder der Spieler einem bestehenden Raum beitritt.

- [ ] Test-009: Überprüfen, ob die index.html Seite neu geladen wird, wenn der Benutzer die Seite verlässt oder die Gegnersuche abbricht.

- [ ] Test-010: Überprüfen, ob die KI-Gegnersuche korrekt mit einem passenden Statuscode und einer JSON-Nachricht reagiert, wenn sie angefragt wird.

- [ ] Test-011: Überprüfen, ob ein Spieler nicht mehreren Räumen beitreten oder mehrere Räume erstellen kann.

- [ ] Test-012: Überprüfen, ob ein Spieler nur einem Raum beitreten kann, wenn er nicht bereits einem Raum beigetreten ist oder einen Raum erstellt hat.

- [ ] Test-013: Überprüfen, ob alle Anfragen an die Gegnersuche Route authentifiziert sein müssen, um sicherzustellen, dass nur angemeldete Benutzer die Funktion nutzen können.

- [ ] Test-014: Überprüfen, ob Benutzer nur einem Raum beitreten können, um Konflikte und unerwartetes Verhalten zu vermeiden.

- [ ] Test-015: Überprüfen, ob die Datenbank korrekt aktualisiert wird, wenn ein Spieler einem Raum beitritt oder einen neuen Raum erstellt.

