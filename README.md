# Mercantec Games

Retro Nintendo-agtig forside for Mercantec-spil på **https://games.mercantec.tech/**

| Path | Indhold |
|------|---------|
| `/` | Player select (Bomberman / Wizard / Tetris) |
| `/guide` | 1:1 Arduino MKR IoT Carrier guide + spil-flow |
| `/Bomberman` | Bomberman (eget compose) |
| `/Wizard` | Wizard Duel (eget compose) |
| `/Tetris` | Tetris battle (eget compose) |

## Arduino-controller

Fælles MKR IoT Carrier-sketch til alle spil: [`arduino/MercantecGamesController/`](arduino/MercantecGamesController/) — rediger kun `config.h` (`GAME_MODE`, WiFi, PIN). Se [`arduino/README.md`](arduino/README.md).

## Lokalt

```bash
cd web
npm install
npm run dev
```

Docker:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```
