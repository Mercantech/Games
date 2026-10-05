#pragma once

// ========== UDFYLD DETTE ==========
#define WIFI_SSID      "WIFI_NAVN_HER"
#define WIFI_PASS      "WIFI_PASSWORD_HER"
#define SERVER_HOST    "games.mercantec.tech"
#define PLAYER_NAME    "Arduino"
#define GAME_PIN       "1234"   // Bomberman / Tetris / Pong: PIN fra lobby. Wizard: "" er OK.

// Vælg ét spil:
#define GAME_MODE_BOMBERMAN  1
#define GAME_MODE_WIZARD     2
#define GAME_MODE_TETRIS     3
#define GAME_MODE_PONG       4
#define GAME_MODE            GAME_MODE_BOMBERMAN
// Skift til GAME_MODE_WIZARD, GAME_MODE_TETRIS eller GAME_MODE_PONG.

// Pad-transport (kun Bomberman understøtter MQTT i v1):
#define PAD_TRANSPORT_HTTP   0
#define PAD_TRANSPORT_MQTT     1
#define PAD_TRANSPORT          PAD_TRANSPORT_HTTP

// MQTT (Oplà → games-mqtt.mercantec.tech) — kun ved PAD_TRANSPORT_MQTT + BOMBERMAN
#define MQTT_USE_TLS           1
#define MQTT_HOST              "games-mqtt.mercantec.tech"
#define MQTT_PORT              8883
#define MQTT_USER              "games-pad"
#define MQTT_PASS              "SKIFT_MIG"
#define MQTT_TOPIC_PREFIX      "mercantec/bomberman/v1"

// 1 = HTTPS (produktion). 0 = HTTP kun lokalt.
#define USE_HTTPS      1
// ==================================

#if PAD_TRANSPORT == PAD_TRANSPORT_MQTT && GAME_MODE != GAME_MODE_BOMBERMAN
#error MQTT pad-transport understøttes kun med GAME_MODE_BOMBERMAN
#endif

#if GAME_MODE == GAME_MODE_WIZARD
  #define GAME_BASE_PATH "/Wizard"
#elif GAME_MODE == GAME_MODE_TETRIS
  #define GAME_BASE_PATH "/Tetris"
#elif GAME_MODE == GAME_MODE_PONG
  #define GAME_BASE_PATH "/Pong"
#else
  #define GAME_BASE_PATH "/Bomberman"
#endif

#if USE_HTTPS
  #define SERVER_PORT 443
#else
  #define SERVER_PORT 80
#endif

#if PAD_TRANSPORT == PAD_TRANSPORT_MQTT && !MQTT_USE_TLS
  #undef MQTT_PORT
  #define MQTT_PORT 1883
#endif
