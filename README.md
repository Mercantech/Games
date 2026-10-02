# Mercantec Games

Retro Nintendo-agtig forside for Mercantec-spil på **https://games.mercantec.tech/**

| Path | Indhold |
|------|---------|
| `/` | Player select (Bomberman / Wizard) |
| `/guide` | 1:1 Arduino MKR IoT Carrier guide + spil-flow |
| `/Bomberman` | Bomberman (eget compose) |
| `/Wizard` | Wizard Duel (eget compose) |

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
