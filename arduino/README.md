# Mercantec Games — Arduino MKR IoT Carrier

Fælles trådløs controller til **Bomberman**, **Wizard Duel**, **Tetris** og **Pong** på [games.mercantec.tech](https://games.mercantec.tech).

## Hurtig start

1. Åbn mappen **`MercantecGamesController/`** i **Arduino IDE** (filen `MercantecGamesController.ino`).
2. Rediger **kun** `config.h` — WiFi, spillernavn, PIN og spilvalg.
3. Vælg board **Arduino MKR WiFi 1010** og upload.
4. Åbn **Serial Monitor** (115200 baud) og tjek at join lykkes.

## config.h

| Indstilling | Beskrivelse |
|-------------|-------------|
| `WIFI_SSID` / `WIFI_PASS` | Dit netværk |
| `SERVER_HOST` | Produktion: `games.mercantec.tech` |
| `PLAYER_NAME` | Navn i spillet |
| `GAME_PIN` | **Bomberman / Tetris / Pong:** PIN fra lobby. **Wizard:** `""` er OK |
| `GAME_MODE` | `GAME_MODE_BOMBERMAN`, `GAME_MODE_WIZARD`, `GAME_MODE_TETRIS` eller `GAME_MODE_PONG` |
| `USE_HTTPS` | `1` på produktion, `0` kun lokalt HTTP |
| `PAD_TRANSPORT` | `PAD_TRANSPORT_HTTP` (default) eller `PAD_TRANSPORT_MQTT` (**kun Bomberman**) |
| `MQTT_HOST` | Produktion: `games-mqtt.mercantec.tech` (port 8883 MQTTS) |
| `MQTT_USER` / `MQTT_PASS` | Pad-bruger fra broker (Dokploy secret) |

`GAME_BASE_PATH` sættes automatisk ud fra `GAME_MODE`.

## Biblioteker

Installer via **Library Manager**:

- **Arduino_MKRIoTCarrier**
- **WiFiNINA** (følger MKR WiFi 1010)
- **ArduinoHttpClient**
- **PubSubClient** (kun ved `PAD_TRANSPORT_MQTT` + Bomberman)

## HTTPS / root-certifikat

Ved `USE_HTTPS 1` skal MKR WiFi 1010 have rod-certifikat for serveren **én gang per board**:

**Arduino IDE:** *Værktøjer* → *Upload Root Certificates* → *Add New* → `games.mercantec.tech:443` → upload.

Uden certifikat kan join give timeout (`JOIN TIMEOUT` på displayet).

## Pad-mapping

### Bomberman (guide / canonical)

**Transport:** HTTP (default) eller MQTT (`PAD_TRANSPORT_MQTT`) mod `games-mqtt.mercantec.tech`. Pad-sim i portalen bruger stadig HTTP.

| Pad | Funktion |
|-----|----------|
| TOUCH2 | Op |
| TOUCH0 | Ned |
| TOUCH1 | Venstre |
| TOUCH3 | Højre |
| TOUCH4 | Bombe (`onTouchDown`) |

### Wizard Duel

| Pad | Spell |
|-----|--------|
| TOUCH0 | FIREBALL |
| TOUCH1 | HEAL |
| TOUCH2 | SHIELD |
| TOUCH3 | LIGHTNING |
| TOUCH4 | DEATH_RAY |

### Tetris

| Pad | Funktion |
|-----|----------|
| TOUCH1 | Venstre (`move` LEFT) |
| TOUCH3 | Højre (`move` RIGHT) |
| TOUCH0 | Ned / soft drop (`move` DOWN, hold) |
| TOUCH2 | Rotér (`rotate`, `onTouchDown`) |
| TOUCH4 | Hard drop (`hardDrop`, `onTouchDown`) |

Ved join viser TFT **TETRIS** / **Klar!** når `GAME_MODE_TETRIS` er valgt. Base path er `/Tetris`.

### Pong

| Pad | Funktion |
|-----|----------|
| TOUCH0 | Op (`move` UP, hold = gentag) |
| TOUCH2 | Ned (`move` DOWN, hold = gentag) |
| TOUCH1 | Arcade **WIDE** (højere paddle) |
| TOUCH3 | Arcade **NUDGE** (snap til bold) |
| TOUCH4 | Arcade **SMASH** (næste hit hurtigere) |

Powers virker kun i **Arcade**-lobby (Classic ignorerer dem). Ved join viser TFT **PONG** / **Klar!** når `GAME_MODE_PONG` er valgt. Base path er `/Pong`.

## TFT-fejlbeskeder

| Display | Betydning |
|---------|-----------|
| **WIFI FEJL** / Tjek SSID/PASS | Kunne ikke forbinde WiFi ved opstart |
| **WIFI LOST** / Genopretter... | Forbindelse tabt — genopretter automatisk |
| **FORKERT PIN** / Tjek GAME_PIN | Server afviste PIN (400/403/404 eller invalid pin) |
| **JOIN TIMEOUT** / Net/cert/server | Ingen svar, 408/504 eller SSL/cert-problem |
| **JOIN FEJL** | Anden join-fejl efter 4 forsøg |

Controlleren forsøger **genforbindelse til WiFi** og **re-join** automatisk i `loop()`.

## Ældre starter-kits

Disse er **superseded** — brug denne mappe i stedet:

- Bomberman: `AI-Bomberman/iot/`
- Wizard Duel: `WizardDuel-ArduinoOplaMercantech/ArduinoKode/`

Interaktiv manual: [games.mercantec.tech/guide](https://games.mercantec.tech/guide)
