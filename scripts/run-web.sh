#!/usr/bin/env bash
# 재무 레이더 웹앱 로컬 실행 스크립트 (DEV_PLAN 0c, 포트 16000, 0.0.0.0)
# 사용: bash scripts/run-web.sh build|start|stop|restart|status
# 주의: 환경변수 값은 여기서 출력하지 않는다. .env는 web/next.config.ts가 읽는다.

set -u
set -o pipefail

PORT=16000
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT/web"
PID_FILE="$WEB_DIR/.run-web.pid"
LOG_FILE="$ROOT/web.log"
CHECK_URL="http://127.0.0.1:$PORT/"

# HTTP 응답 코드만 돌려준다 (연결 실패면 000)
http_code() {
  curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$CHECK_URL" 2>/dev/null || true
}

read_pid() {
  [[ -f "$PID_FILE" ]] && cat "$PID_FILE" 2>/dev/null
}

# PID 파일의 프로세스가 살아 있는지 (그룹 리더 기준)
pid_running() {
  local pid
  pid="$(read_pid)"
  [[ -n "$pid" ]] && kill -0 -- "$pid" 2>/dev/null
}

port_open() {
  ss -ltn 2>/dev/null | grep -q ":$PORT "
}

cmd_build() {
  # 실행 중인 서버가 빌드 결과(.next)를 읽고 있으므로 먼저 끈다
  if pid_running; then
    echo "실행 중인 서버를 먼저 끕니다."
    cmd_stop
  fi
  if ! (cd "$WEB_DIR" && npm run build); then
    echo "빌드 실패"
    return 1
  fi
  echo "빌드 완료. 기동하려면: bash scripts/run-web.sh start"
}

cmd_start() {
  if pid_running; then
    echo "이미 실행 중입니다 (PID $(read_pid)). 다시 띄우려면 restart."
    return 0
  fi
  if [[ "$(http_code)" == "200" ]]; then
    echo "포트 $PORT에 다른 프로세스가 응답합니다. PID 파일에 없는 프로세스라 끄지 않습니다."
    return 1
  fi
  if [[ ! -f "$WEB_DIR/.next/BUILD_ID" ]]; then
    echo "빌드 결과가 없습니다. 먼저: bash scripts/run-web.sh build"
    return 1
  fi
  # setsid로 새 세션(프로세스 그룹)에 띄운다. stop 때 npm과 next-server 자식을 함께 끄기 위함
  ( cd "$WEB_DIR" && exec setsid nohup npm run start:local ) >"$LOG_FILE" 2>&1 </dev/null &
  echo $! >"$PID_FILE"

  local _i
  for _i in $(seq 1 30); do
    if [[ "$(http_code)" == "200" ]]; then
      echo "기동 완료: http://$PORT (0.0.0.0) · 로그 $LOG_FILE"
      return 0
    fi
    sleep 1
  done
  echo "30초 안에 응답하지 않았습니다. 로그를 확인하세요: $LOG_FILE"
  return 1
}

cmd_stop() {
  if ! pid_running; then
    rm -f "$PID_FILE"
    echo "PID 파일 기준으로 실행 중인 서버가 없습니다."
    if [[ "$(http_code)" == "200" ]]; then
      echo "주의: 포트 $PORT은 응답 중인데 이 스크립트가 띄운 프로세스가 아닙니다."
      return 1
    fi
    return 0
  fi

  local pid _i
  pid="$(read_pid)"
  # 음수 PID = 프로세스 그룹 전체 (npm → next 자식까지)
  kill -TERM -- "-$pid" 2>/dev/null || kill -TERM -- "$pid" 2>/dev/null
  for _i in $(seq 1 10); do
    if ! kill -0 -- "-$pid" 2>/dev/null && ! kill -0 -- "$pid" 2>/dev/null; then
      break
    fi
    sleep 1
  done
  if kill -0 -- "-$pid" 2>/dev/null; then
    kill -KILL -- "-$pid" 2>/dev/null
    sleep 1
  fi
  rm -f "$PID_FILE"

  if port_open; then
    echo "경고: 포트 $PORT이 아직 열려 있습니다. ss -ltnp 로 확인하세요."
    return 1
  fi
  echo "정지 완료 (포트 $PORT 닫힘)"
}

cmd_status() {
  local code
  code="$(http_code)"
  if pid_running; then
    echo "실행 중 (PID $(read_pid), 포트 $PORT)"
  else
    echo "꺼져 있음 (PID 파일 기준 프로세스 없음)"
  fi
  echo "HTTP 응답 코드: $code"
  if port_open; then
    ss -ltn | grep ":$PORT "
  else
    echo "포트 $PORT 리스닝 없음"
  fi
  [[ "$code" == "200" ]]
}

case "${1:-}" in
  build)   cmd_build ;;
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  restart) cmd_stop; cmd_start ;;
  status)  cmd_status ;;
  *)
    echo "사용법: bash scripts/run-web.sh build|start|stop|restart|status"
    exit 2
    ;;
esac
