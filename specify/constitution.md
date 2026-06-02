**Diese Datei wird nicht verändert und enthält die Regeln und Prinzipien für die Erstellung von Spezifikationen. Sie darf nur geändert werden wenn das Projekt selber sich grundlegend ändert.**

## Zweck 
Das Projekt umfasst mehrere Unterprojekte, die alle unter einem gemeinsamen Dach organisiert sind. Um eine klare und einheitliche Struktur zu gewährleisten, wird jedes Unterprojekt in einem eigenen Ordner innerhalb des Hauptordners "Emshift" organisiert . 
Das Projekt umfasst folgende Unterprojekte:

- Kampfderheere: Das Hauptprojekt, ein Kartenspiel mit einem Backend und einem Frontend. Backend besteht hier aus Nodejs, Express.js, Passport.js und MariaDB. Frontend besteht aus HTML, CSS und Vanilla JavaScript.
- Admin_panel: Ein separates Projekt für die Verwaltung von Inhalten und Benutzern, ebenfalls mit einem Backend und einem Frontend. Backend besteht hier aus Nodejs, Express.js, Passport.js und MariaDB. Frontend besteht aus HTML, CSS und Vanilla JavaScript.

Die Anwendungen laufen in Docker Containern, orchestriert durch Docker Compose. Es gibt separate Docker-Compose Dateien für die Entwicklungs- und Produktionsumgebung (Diese unterscheiden sich hauptsächlich in der Art und Weise wie Umgebungsvariablen gehandhabt werden).

Es könnten zu einem späteren Zeitpunkt noch weitere Unterprojekte hinzukommen, theroretisch auch auf basis von python oder anderen sprachen, aber das ist nicht geplant.

## Technische Grundsätze
- Sprache: JavaScript (kein TypeScript/kein Vite/kein React/kein Angular/kein Vue)
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express.js
- Datenbank: MariaDB
- Authentifizierung: Passport.js
- Containerisierung: Docker
- Orchestrierung: Docker Compose
- Reverse Proxy: Nginx 
- Testing: Fetch, Serverseitig und Powershell Scripting (vorlaufig keine Testframeworks)


## Struktur
- Datenbankabfragen: in Models
- Routen: in Router
- Konfigurationen und Implementierungen: in Config
- Umgebungsvariablen: über Docker (Docker-Compose.dev.yaml und Docker-Compose.prod.yaml)
- Projektordner: ./kampfderheere/

## Code Style
- Variablen: camelCase
- Funktionsnamen: camelCase
- Funktionen-Aufbau: klein, eine verantwortung, klar benannt
- Kommentare: Klar und prägnant, Jede öffentliche Funktion muss einen Kommentar haben.
- Frameworks ohne triftigen Grund.
- Fehler werden niemals still schweigend behandelt, sondern immer geloggt.

## Bewusste nicht Ziele:
- Keine Echtzeit-Kolleration (vorerst)
- keine native Mobile App.
