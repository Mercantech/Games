/**
 * Mercantec Games Controller — MKR WiFi 1010 + MKR IoT Carrier
 * Bomberman, Wizard Duel, Tetris og Pong via config.h (GAME_MODE).
 *
 * POST {GAME_BASE_PATH}/api/controller/join
 * POST {GAME_BASE_PATH}/api/controller/heartbeat
 * POST {GAME_BASE_PATH}/api/controller/action
 */

#include <Arduino_MKRIoTCarrier.h>
#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>
#include "config.h"

MKRIoTCarrier carrier;

#if USE_HTTPS
  WiFiSSLClient wifi;
#else
  WiFiClient wifi;
#endif
HttpClient client = HttpClient(wifi, SERVER_HOST, SERVER_PORT);

const int TFT_W = 240;
const int TFT_H = 240;
const unsigned long DEBOUNCE_MS = 80;
const unsigned long HEARTBEAT_MS = 3000;
const unsigned long HTTP_TIMEOUT_MS = 15000;
const int WIFI_CONNECT_ATTEMPTS = 40;
const int JOIN_ATTEMPTS = 4;

String playerId;
String deviceId;

unsigned long lastUp = 0;
unsigned long lastDown = 0;
unsigned long lastLeft = 0;
unsigned long lastRight = 0;
unsigned long lastBomb = 0;
unsigned long lastSpell = 0;
unsigned long lastRotate = 0;
unsigned long lastHardDrop = 0;
unsigned long lastStop = 0;
unsigned long lastHeartbeat = 0;

enum JoinResult {
  JOIN_OK = 0,
  JOIN_BAD_PIN,
  JOIN_TIMEOUT,
  JOIN_FAIL
};

String apiPath(const char* endpoint) {
  return String(GAME_BASE_PATH) + endpoint;
}

void drawCenteredLine(const char* text, int y, int textSize, uint16_t color) {
  carrier.display.setTextSize(textSize);
  carrier.display.setTextColor(color);
  int charW = 6 * textSize;
  int textW = (int)strlen(text) * charW;
  int x = (TFT_W - textW) / 2;
  if (x < 0) x = 0;
  carrier.display.setCursor(x, y);
  carrier.display.print(text);
}

void showMsg(const char* line1, const char* line2 = nullptr, uint16_t color = ST77XX_WHITE) {
  carrier.display.fillScreen(ST77XX_BLACK);
  carrier.display.setTextWrap(false);
  if (line2) {
    drawCenteredLine(line1, 88, 2, color);
    drawCenteredLine(line2, 118, 2, color);
  } else {
    drawCenteredLine(line1, 108, 2, color);
  }
}

void showError(const char* line1, const char* line2) {
  showMsg(line1, line2, ST77XX_RED);
}

void buildDeviceId() {
  byte mac[6];
  WiFi.macAddress(mac);
  char buf[16];
  sprintf(buf, "OPLA_%02X%02X%02X", mac[3], mac[4], mac[5]);
  deviceId = String(buf);
}

int httpPost(const String& path, const String& body, String& responseBody) {
  wifi.setTimeout(HTTP_TIMEOUT_MS / 1000);
  client.beginRequest();
  client.post(path);
  client.sendHeader("Content-Type", "application/json");
  client.sendHeader("Content-Length", body.length());
  client.beginBody();
  client.print(body);
  client.endRequest();

  int status = client.responseStatusCode();
  responseBody = client.responseBody();
  int jsonStart = responseBody.indexOf('{');
  if (jsonStart > 0) {
    responseBody = responseBody.substring(jsonStart);
  }
  return status;
}

bool responseIndicatesBadPin(const String& resp) {
  String lower = resp;
  lower.toLowerCase();
  if (lower.indexOf("invalid") < 0 && lower.indexOf("wrong") < 0) {
    return false;
  }
  return lower.indexOf("pin") >= 0;
}

bool parsePlayerId(const String& resp) {
  if (resp.indexOf("\"playerId\"") < 0) return false;
  int start = resp.indexOf("\"playerId\":\"") + 12;
  int end = resp.indexOf("\"", start);
  if (end <= start) return false;
  playerId = resp.substring(start, end);
  return playerId.length() > 0;
}

JoinResult doJoinOnce() {
  String path = apiPath("/api/controller/join");
  String body = "{\"name\":\"" + String(PLAYER_NAME) +
                "\",\"deviceId\":\"" + deviceId + "\"";
  if (String(GAME_PIN).length() > 0) {
    body += ",\"pin\":\"" + String(GAME_PIN) + "\"";
  }
  body += "}";

  Serial.println("========== JOIN ==========");
  Serial.print("[JOIN] ");
  Serial.println(path);
  Serial.println(body);

  String resp;
  int status = httpPost(path, body, resp);
  Serial.print("[JOIN] status=");
  Serial.println(status);
  Serial.println(resp);

  if (status == 400 || status == 403 || status == 404 || responseIndicatesBadPin(resp)) {
    return JOIN_BAD_PIN;
  }
  if (status <= 0 || status == 408 || status == 504) {
    return JOIN_TIMEOUT;
  }
  if (status == 200 && parsePlayerId(resp)) {
    Serial.print("[JOIN] OK playerId=");
    Serial.println(playerId);
    return JOIN_OK;
  }
  return JOIN_FAIL;
}

JoinResult doJoinWithRetries() {
  JoinResult last = JOIN_FAIL;
  for (int attempt = 0; attempt < JOIN_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      showMsg("Joiner igen...", nullptr, ST77XX_YELLOW);
      delay(800);
    }
    last = doJoinOnce();
    if (last == JOIN_OK) return JOIN_OK;
    if (last == JOIN_BAD_PIN) return JOIN_BAD_PIN;
    if (last != JOIN_TIMEOUT) delay(500);
  }
  return last;
}

void showJoinError(JoinResult result) {
  switch (result) {
    case JOIN_BAD_PIN:
      showError("FORKERT PIN", "Tjek GAME_PIN");
      break;
    case JOIN_TIMEOUT:
      showError("JOIN TIMEOUT", "Net/cert/server");
      break;
    default:
      showError("JOIN FEJL", "Tjek server/PIN");
      break;
  }
}

bool connectWifi() {
  showMsg("WiFi...", nullptr, ST77XX_YELLOW);
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  for (int i = 0; i < WIFI_CONNECT_ATTEMPTS; i++) {
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("[WiFi] OK IP=");
      Serial.println(WiFi.localIP());
      return true;
    }
    delay(500);
  }
  showError("WIFI FEJL", "Tjek SSID/PASS");
  Serial.println("[WiFi] FEJL");
  return false;
}

bool establishSession() {
  playerId = "";
  buildDeviceId();
  Serial.print("[ID] deviceId=");
  Serial.println(deviceId);

  showMsg("Joiner spil...", nullptr, ST77XX_YELLOW);
  JoinResult jr = doJoinWithRetries();
  if (jr != JOIN_OK) {
    showJoinError(jr);
    return false;
  }

#if GAME_MODE == GAME_MODE_WIZARD
  showMsg("WIZARD DUEL", "Klar!", ST77XX_GREEN);
#elif GAME_MODE == GAME_MODE_TETRIS
  showMsg("TETRIS", "Klar!", ST77XX_GREEN);
#elif GAME_MODE == GAME_MODE_PONG
  showMsg("PONG", "Klar!", ST77XX_GREEN);
#else
  showMsg("BOMBERMAN", "Klar!", ST77XX_GREEN);
#endif
  lastHeartbeat = millis();
  return true;
}

void sendHeartbeat() {
  if (playerId.length() == 0) return;
  String path = apiPath("/api/controller/heartbeat");
  String body = "{\"playerId\":\"" + playerId +
                "\",\"deviceId\":\"" + deviceId + "\"";
  if (String(GAME_PIN).length() > 0) {
    body += ",\"pin\":\"" + String(GAME_PIN) + "\"";
  }
  body += "}";
  String resp;
  httpPost(path, body, resp);
}

void sendAction(const char* action, const char* direction = nullptr) {
  if (playerId.length() == 0) return;

  String path = apiPath("/api/controller/action");
  String body = "{\"playerId\":\"" + playerId +
                "\",\"deviceId\":\"" + deviceId +
                "\",\"action\":\"" + String(action) + "\"";
  if (String(GAME_PIN).length() > 0) {
    body += ",\"pin\":\"" + String(GAME_PIN) + "\"";
  }
  if (direction) {
    body += ",\"params\":{\"direction\":\"" + String(direction) + "\"}";
    body += ",\"direction\":\"" + String(direction) + "\"";
  }
  body += "}";

  String resp;
  httpPost(path, body, resp);
}

void castSpell(const char* spellKey, int targetId = 1) {
  if (playerId.length() == 0) return;

  String path = apiPath("/api/controller/action");
  String body = "{";
  if (String(GAME_PIN).length() > 0) {
    body += "\"pin\":\"" + String(GAME_PIN) + "\",";
  }
  body += "\"deviceId\":\"" + deviceId +
          "\",\"playerId\":\"" + playerId +
          "\",\"action\":\"cast\",\"params\":{\"spellKey\":\"" +
          String(spellKey) + "\"";
  if (targetId >= 0) {
    body += ",\"targetId\":" + String(targetId);
  }
  body += "}}";

  String resp;
  httpPost(path, body, resp);
}

void ensureWifiAndSession() {
  if (WiFi.status() == WL_CONNECTED && playerId.length() > 0) {
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    showError("WIFI LOST", "Genopretter...");
    Serial.println("[WiFi] lost — reconnect");
    playerId = "";
    if (!connectWifi()) {
      return;
    }
  }

  if (playerId.length() == 0) {
    Serial.println("[Session] re-join");
    if (!establishSession()) {
      delay(2000);
    }
  }
}

void handleBombermanInput(unsigned long now) {
  carrier.Buttons.update();

  if (carrier.Buttons.getTouch(TOUCH2)) {
    if (now - lastUp > DEBOUNCE_MS) {
      sendAction("move", "UP");
      lastUp = now;
    }
  }
  if (carrier.Buttons.getTouch(TOUCH0)) {
    if (now - lastDown > DEBOUNCE_MS) {
      sendAction("move", "DOWN");
      lastDown = now;
    }
  }
  if (carrier.Buttons.getTouch(TOUCH1)) {
    if (now - lastLeft > DEBOUNCE_MS) {
      sendAction("move", "LEFT");
      lastLeft = now;
    }
  }
  if (carrier.Buttons.getTouch(TOUCH3)) {
    if (now - lastRight > DEBOUNCE_MS) {
      sendAction("move", "RIGHT");
      lastRight = now;
    }
  }
  if (carrier.Buttons.onTouchDown(TOUCH4) && now - lastBomb > DEBOUNCE_MS) {
    sendAction("bomb");
    lastBomb = now;
  }
}

void handleTetrisInput(unsigned long now) {
  carrier.Buttons.update();

  if (carrier.Buttons.getTouch(TOUCH1)) {
    if (now - lastLeft > DEBOUNCE_MS) {
      sendAction("move", "LEFT");
      lastLeft = now;
    }
  }
  if (carrier.Buttons.getTouch(TOUCH3)) {
    if (now - lastRight > DEBOUNCE_MS) {
      sendAction("move", "RIGHT");
      lastRight = now;
    }
  }
  if (carrier.Buttons.getTouch(TOUCH0)) {
    if (now - lastDown > DEBOUNCE_MS) {
      sendAction("move", "DOWN");
      lastDown = now;
    }
  }
  if (carrier.Buttons.onTouchDown(TOUCH2) && now - lastRotate > DEBOUNCE_MS) {
    sendAction("rotate");
    lastRotate = now;
  }
  if (carrier.Buttons.onTouchDown(TOUCH4) && now - lastHardDrop > DEBOUNCE_MS) {
    sendAction("hardDrop");
    lastHardDrop = now;
  }
}

void handlePongInput(unsigned long now) {
  carrier.Buttons.update();

  if (carrier.Buttons.getTouch(TOUCH0)) {
    if (now - lastUp > DEBOUNCE_MS) {
      sendAction("move", "UP");
      lastUp = now;
    }
  }
  if (carrier.Buttons.getTouch(TOUCH2)) {
    if (now - lastDown > DEBOUNCE_MS) {
      sendAction("move", "DOWN");
      lastDown = now;
    }
  }
  if (carrier.Buttons.onTouchDown(TOUCH1) && now - lastStop > DEBOUNCE_MS) {
    sendAction("stop");
    lastStop = now;
  }
  if (carrier.Buttons.onTouchDown(TOUCH3) && now - lastStop > DEBOUNCE_MS) {
    sendAction("stop");
    lastStop = now;
  }
  if (carrier.Buttons.onTouchDown(TOUCH4) && now - lastStop > DEBOUNCE_MS) {
    sendAction("stop");
    lastStop = now;
  }
}

void handleWizardInput(unsigned long now) {
  carrier.Buttons.update();

  if (carrier.Buttons.onTouchDown(TOUCH0) && now - lastSpell > DEBOUNCE_MS) {
    castSpell("FIREBALL", 1);
    lastSpell = now;
  }
  if (carrier.Buttons.onTouchDown(TOUCH1) && now - lastSpell > DEBOUNCE_MS) {
    castSpell("HEAL");
    lastSpell = now;
  }
  if (carrier.Buttons.onTouchDown(TOUCH2) && now - lastSpell > DEBOUNCE_MS) {
    castSpell("SHIELD");
    lastSpell = now;
  }
  if (carrier.Buttons.onTouchDown(TOUCH3) && now - lastSpell > DEBOUNCE_MS) {
    castSpell("LIGHTNING");
    lastSpell = now;
  }
  if (carrier.Buttons.onTouchDown(TOUCH4) && now - lastSpell > DEBOUNCE_MS) {
    castSpell("DEATH_RAY", 1);
    lastSpell = now;
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n========== MERCANTEC GAMES CONTROLLER ==========");
  Serial.print("GAME_BASE_PATH=");
  Serial.println(GAME_BASE_PATH);

  carrier.noCase();
  carrier.begin();
  carrier.display.setRotation(0);
  carrier.display.setTextWrap(false);

  if (!connectWifi()) {
    return;
  }
  if (!establishSession()) {
    return;
  }
}

void loop() {
  ensureWifiAndSession();

  if (playerId.length() == 0) {
    delay(500);
    return;
  }

  unsigned long now = millis();
  if (now - lastHeartbeat > HEARTBEAT_MS) {
    sendHeartbeat();
    lastHeartbeat = now;
  }

#if GAME_MODE == GAME_MODE_TETRIS
  handleTetrisInput(now);
#elif GAME_MODE == GAME_MODE_PONG
  handlePongInput(now);
#elif GAME_MODE == GAME_MODE_WIZARD
  handleWizardInput(now);
#else
  handleBombermanInput(now);
#endif

  delay(20);
}
