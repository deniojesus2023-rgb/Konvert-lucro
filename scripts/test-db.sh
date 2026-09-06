#!/usr/bin/env bash
#
# Starts/stops the PostgreSQL instance used by the integration tests.
#
# Preferred path: Docker (docker-compose.test.yml) — portable, matches CI.
# Fallback path: a local PostgreSQL cluster via initdb/pg_ctl, for
# environments where the Docker daemon isn't available (some sandboxes and
# CI runners). Either way the tests run against a REAL PostgreSQL — never
# SQLite, never an in-memory stand-in.
#
# Both paths expose the same connection string:
#   postgres://konvert:konvert@127.0.0.1:55432/konvert_test
#
set -euo pipefail

PORT="${KONVERT_TEST_DB_PORT:-55432}"
DB_NAME="konvert_test"
DB_USER="konvert"
DB_PASSWORD="konvert"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGDATA_DIR="${REPO_ROOT}/.tmp/pgdata"
LOG_FILE="${REPO_ROOT}/.tmp/postgres.log"

find_pg_bin() {
  if command -v pg_ctl >/dev/null 2>&1; then
    dirname "$(command -v pg_ctl)"
    return 0
  fi
  local candidate
  for candidate in /usr/lib/postgresql/*/bin /usr/local/pgsql/bin /opt/homebrew/opt/postgresql*/bin; do
    if [ -x "${candidate}/pg_ctl" ]; then
      echo "${candidate}"
      return 0
    fi
  done
  return 1
}

docker_available() {
  command -v docker >/dev/null 2>&1 && timeout 10 docker info >/dev/null 2>&1
}

# The local cluster runs as the `postgres` OS user when we're root, since
# PostgreSQL refuses to start as root.
run_as_pg() {
  if [ "$(id -u)" -eq 0 ]; then
    su postgres -c "$1"
  else
    bash -c "$1"
  fi
}

local_up() {
  local pg_bin
  pg_bin="$(find_pg_bin)" || {
    echo "ERRO: nem o Docker nem os binários do PostgreSQL foram encontrados." >&2
    echo "Instale o PostgreSQL 16+ ou inicie o Docker e rode de novo." >&2
    exit 1
  }

  mkdir -p "${REPO_ROOT}/.tmp"

  if "${pg_bin}/pg_isready" -h 127.0.0.1 -p "${PORT}" >/dev/null 2>&1; then
    echo "PostgreSQL de teste já está no ar em 127.0.0.1:${PORT}."
    return 0
  fi

  if [ ! -f "${PGDATA_DIR}/PG_VERSION" ]; then
    echo "Inicializando cluster local em ${PGDATA_DIR}..."
    rm -rf "${PGDATA_DIR}"
    mkdir -p "${PGDATA_DIR}"
    chmod 777 "${REPO_ROOT}/.tmp" "${PGDATA_DIR}"
    if [ "$(id -u)" -eq 0 ]; then chown -R postgres "${PGDATA_DIR}"; fi
    run_as_pg "'${pg_bin}/initdb' -D '${PGDATA_DIR}' -U '${DB_USER}' --auth=trust --encoding=UTF8" >/dev/null
  fi

  touch "${LOG_FILE}"
  chmod 666 "${LOG_FILE}"
  echo "Subindo PostgreSQL local na porta ${PORT}..."
  run_as_pg "'${pg_bin}/pg_ctl' -D '${PGDATA_DIR}' -l '${LOG_FILE}' -o '-p ${PORT} -k /tmp -c listen_addresses=127.0.0.1' -w start"

  if ! run_as_pg "'${pg_bin}/psql' -h 127.0.0.1 -p ${PORT} -U '${DB_USER}' -d postgres -tAc \"SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'\"" | grep -q 1; then
    run_as_pg "'${pg_bin}/createdb' -h 127.0.0.1 -p ${PORT} -U '${DB_USER}' '${DB_NAME}'"
  fi
  run_as_pg "'${pg_bin}/psql' -h 127.0.0.1 -p ${PORT} -U '${DB_USER}' -d postgres -tAc \"ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASSWORD}'\"" >/dev/null

  echo "Pronto: postgres://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${PORT}/${DB_NAME}"
}

local_down() {
  local pg_bin
  pg_bin="$(find_pg_bin)" || return 0
  if [ -f "${PGDATA_DIR}/PG_VERSION" ]; then
    run_as_pg "'${pg_bin}/pg_ctl' -D '${PGDATA_DIR}' -m fast -w stop" || true
    echo "PostgreSQL local parado."
  fi
}

case "${1:-}" in
  up)
    if docker_available; then
      echo "Docker disponível — subindo via docker-compose.test.yml."
      docker compose -f "${REPO_ROOT}/docker-compose.test.yml" up -d --wait
      echo "Pronto: postgres://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${PORT}/${DB_NAME}"
    else
      echo "Docker indisponível — usando cluster PostgreSQL local."
      local_up
    fi
    ;;
  down)
    if docker_available; then
      docker compose -f "${REPO_ROOT}/docker-compose.test.yml" down -v || true
    fi
    local_down
    ;;
  *)
    echo "uso: $0 {up|down}" >&2
    exit 1
    ;;
esac
