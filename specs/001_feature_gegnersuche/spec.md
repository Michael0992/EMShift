# Spezifikation für die Funktion "Gegnersuche"

## Ziel
Angemeldete Benutzer sollen über die index.html Seite die Möglichkeit haben, einen Gegner für ein Spiel zu suchen. Sobald ein Gegner gefunden wurde, soll der Benutzer in den Spielraum weitergeleitet werden, wo das Spiel stattfindet.

## User Story
**Als** angemeldeter Benutzer
**möchte ich** die Möglichkeit haben, einen Gegner für ein Spiel zu suchen
**damit ich** gegen einen anderen Spieler antreten kann.

Wärend der Suche sehe ich eine Nachricht "Gegnersuche läuft..." und sobald ein Gegner gefunden wurde, werde ich automatisch in den Spielraum weitergeleitet.

Wärend der gegnersuche habe ich die Möglichkeit die Suche abzubrechen, indem ich die Seite verlasse oder auf einen "Abbrechen" Button klicke. In diesem Fall wird der offene Raum gelöscht und die index.html Seite wird neu geladen.

## Funktionale Anforderungen

- **FR-001:** Auf der Index.html befinden sich der Button "Spiel vs Mensch", der die Gegnersuche startet.
- **FR-002:** Sobald der Benutzer auf den Button klickt, wird eine Nachricht "Gegnersuche läuft..." angezeigt.
- **FR-003:** Das System schickt eine Anfrage an den Server um einen Gegner zu suchen.
- **FR-004:** Das System schaut ob der Spieler bereits zu einem Raum gehört wenn nicht sucht das System nach offenen Räumen und wenn es keinen offenen Raum gibt wird einer erstellt.
- **FR-005:** Sobald ein Gegner gefunden wurde, wird der Benutzer automatisch in den Spielraum weitergeleitet.

## Akzeptanzkriterien
- [ ] Der Button "Spiel vs Mensch" ist auf der Index.html Seite sichtbar und klickbar solange die Gegnersuche nicht läuft.
- [ ] Sobald der Benutzer auf den Button klickt, wird die Nachricht "Gegnersuche läuft..." angezeigt.
- [ ] Eine Funktion wird beim klicken auf den Button aufgerufeen mit parameter "human" um die Gegnersuche zu starten.
- [ ] Die Funktion schickt eine Anfrage an den Server um einen Gegner zu suchen.
- [ ] Das System prüft ob der Spieler bereits zu einem Raum gehört.
- [ ] Das System sucht nach offenen Räumen in der Datenbank und wenn es keinen offnen Raum gibt wird einer erstellt.
- [ ] Sobald ein Gegner gefunden wurde oder der Spieler einem bestehenden Raum beitritt, wird der Benutzer automatisch in den Spielraum weitergeleitet.
- [ ] Wenn der Benutzer die Seite verlässt oder die Gegnersuche abbricht, wird die index.html Seite neu geladen.

## Edge Cases
- Wenn der Spieler einem Raum beitritt oder bereits einen erstellt hat kann er nicht in einen weiteren Raum beitreten oder einen neuen erstellen.
- Ein Spieler kann nur einem Raum beitreten wenn er nicht bereits einem Raum beigetreten ist oder einen Raum erstellt hat.

## Offene Fragen
- Aktuell keine offenen Fragen.
