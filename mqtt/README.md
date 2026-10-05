# Mercantec Games MQTT (Mosquitto)

Broker til **Oplà-pads** (Bomberman v1). Browser bruger stadig WebSocket mod spil-serveren.

## Host (produktion)

- **Eksternt (MKR):** `games-mqtt.mercantec.tech` port **8883** (MQTTS) — *ikke* `mqtt.mercantec.tech` (optaget).
- **Internt (Bomberman-container):** `mqtt://<compose-service-host>:1883` på `dokploy-network`.

## Dokploy

1. Opret compose-app **Games-MQTT** med `Games/mqtt/docker-compose.yml`.
2. Domæne: Traefik **TCP** router til service `mqtt:1883` eller TLS på **8883** (passthrough / cert på broker).
3. Env (secrets — aldrig i git):
   - `MQTT_SERVER_USER` / `MQTT_SERVER_PASS` → bruger `bomberman-server` (matcher ACL)
   - `MQTT_PAD_USER` / `MQTT_PAD_PASS` → bruger `games-pad` (Oplà i `config.h`)
4. Opret `/mosquitto/config/passwords` på volume (én gang):

```bash
docker exec -it <mqtt-container> sh
mosquitto_passwd -c /mosquitto/config/passwords bomberman-server
mosquitto_passwd -b /mosquitto/config/passwords games-pad '<pad-password>'
```

Genstart container. ACL: [`config/acl`](config/acl).

## Lokal

```bash
cd mqtt
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
# Broker: localhost:1883, anonym (kun dev)
```

Bomberman lokal: `MQTT_ENABLED=1`, `MQTT_URL=mqtt://host.docker.internal:1883` (Windows/Mac) eller service name hvis samme compose stack.

## Topics (Bomberman)

Prefix: `mercantec/bomberman/v1`

| Retning | Topic |
|---------|--------|
| Pad → | `{prefix}/{pin}/join` |
| Pad → | `{prefix}/{pin}/action/{playerId}` |
| Pad → | `{prefix}/{pin}/heartbeat/{playerId}` |
| Server → | `{prefix}/{pin}/join/resp/{deviceId}` |
| Server → | `{prefix}/{pin}/error/{deviceId}` |

Se [AI-Bomberman/README.md](https://github.com/Mercantech/AI-Bomberman) for server-env.
