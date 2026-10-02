# Mercantec Games

Forside for Mercantec-spil på **https://games.mercantec.tech/**

| Path | Spil | Repo |
|------|------|------|
| `/` | Denne portal | Mercantech/Games |
| `/Bomberman` | Bomberman | Mercantech/AI-Bomberman |
| `/Wizard` | Wizard Duel | Mercantech/WizardDuel-ArduinoOpla |

## Lokalt

```bash
cd web
npm install
npm run dev
```

Eller med Docker:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

Åbn http://localhost:3000

## Arduino

Portalens sektion **Arduino Oplà controller** beskriver den fælles kontrakt (`join` / `heartbeat` / `action`). Skift `GAME_BASE_PATH` mellem `/Bomberman` og `/Wizard`.
