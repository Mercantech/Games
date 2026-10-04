#pragma once

// ========== UDFYLD DETTE ==========
#define WIFI_SSID      "WIFI_NAVN_HER"
#define WIFI_PASS      "WIFI_PASSWORD_HER"
#define SERVER_HOST    "games.mercantec.tech"
#define PLAYER_NAME    "Arduino"
#define GAME_PIN       "1234"   // Bomberman + Tetris: PIN fra lobby. Wizard: "" er OK.

// Vælg ét spil:
#define GAME_MODE_BOMBERMAN  1
#define GAME_MODE_WIZARD     2
#define GAME_MODE_TETRIS     3
#define GAME_MODE            GAME_MODE_BOMBERMAN
// Skift til GAME_MODE_WIZARD eller GAME_MODE_TETRIS.

// 1 = HTTPS (produktion). 0 = HTTP kun lokalt.
#define USE_HTTPS      1
// ==================================

#if GAME_MODE == GAME_MODE_WIZARD
  #define GAME_BASE_PATH "/Wizard"
#elif GAME_MODE == GAME_MODE_TETRIS
  #define GAME_BASE_PATH "/Tetris"
#else
  #define GAME_BASE_PATH "/Bomberman"
#endif

#if USE_HTTPS
  #define SERVER_PORT 443
#else
  #define SERVER_PORT 80
#endif
