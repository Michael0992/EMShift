# Plan

## Architektur
Die Architektur für diesen Teil des Projekts "kampfderheere" basiert auf einem Schichten Modell, mit Models für die Datenbankabfragen, Routern für die Routen und einem Config Ordner für Konfigurationen und Implementierungen. 
Umgebungsvaiablen kommen aus den .env Dateien über die docker-compose Dateien.

Abfragen laufen über fetch von der index.html Seite, die dann an die entsprechenden Routen weitergeleitet werden, wo die Logik implementiert ist.

## Datenmodell
Es gibt bereits ein Datenmodell ("GameRoom") dieses Model muss angepasst werden um Querrys die dazu dienen:
- den Raum des Spielers  zu identifizieren (bereits oder teilweise implementiert)
- offene Räume zu identifizieren
- Einen Raum zu erstellen
- Zu Prüfen ob der Raum viollständig ist (2 Spieler)

## Datenbankstruktur
- Datenbankname: cardgame
- Zugangsdaten user(root), password(576667), port(3306)
- Besonders Relevante Tabellen: playerroom
    - Room_ID (int)
    - User_ID_1 (int)
    - User_ID_2 (int)
    - Created_at (datetime)
    - type (ENUM('HUMAN', 'AI'))

## Schnittstellen
- POST /spielraum (aktuell noch GET, Name kann geändert werden unter berücksichtigung der bereits implementierten "startgame" Funktion unter "EMShift\kampfderheere\public\menu.js")
    - 200 : Weiterleitung zum Spielraum /ingame
    - 400/500 usw : Erneuterter Versuch

    -> Befindet sich unter index.js
    -> Migriert zu Router/gameroom.js

## Bibliotheken:
- `mysql2` für die Interaktion mit der MariaDB-Datenbank.
- `passport` und `passport-local` für die Implementierung der Authentifizierungslogik.
- `express-session` für die Verwaltung von Sessions und die Aufrechterhaltung des Authentifizierungsstatus der Benutzer über mehrere Anfragen hinweg.

## Sicherheit
- Alle Anfragen an die Gegnersuche Route müssen authentifiziert sein, um sicherzustellen, dass nur angemeldete Benutzer die Funktion nutzen können.
- Es wird sichergestellt, dass Benutzer nur einem Raum beitreten können, um Konflikte und unerwartetes Verhalten zu vermeiden.

