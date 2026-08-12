#!/bin/bash
# =====================================================================
# Deploy via FTPS (curl --ssl-reqd) — fallback quando o SSH está instável
# Uso: bash deploy-ftps.sh front | bash deploy-ftps.sh back | bash deploy-ftps.sh all
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")"

HOST="186.209.113.157"
USER="arti3263"
PASS="CmQ#yD7R.u993t"
FRONT_REMOTE="/domains/artigocomcafe.com/public_html"
BACK_REMOTE="/domains/back.artigocomcafe.com/public_html"
MODE="${1:-all}"

echo ">> Deploy FTPS $MODE -> $HOST"

upload_file() {
  # $1 = local, $2 = remote path
  curl -sk --ssl-reqd --ftp-pasv --ftp-create-dirs \
    --connect-timeout 25 --max-time 300 \
    -u "$USER:$PASS" -T "$1" "ftp://$HOST$2" \
    || echo "[!] FAIL: $1"
}

upload_tree() {
  # $1 = local dir, $2 = remote base dir
  local local_dir="$1" remote_base="$2"
  find "$local_dir" -type f | while read -r f; do
    rel="${f#$local_dir/}"
    echo "  ↑ $rel"
    upload_file "$f" "$remote_base/$rel"
  done
}

if [[ "$MODE" == "front" || "$MODE" == "all" ]]; then
  echo "== FRONTEND: dist -> $FRONT_REMOTE"
  upload_tree "$PWD/dist" "$FRONT_REMOTE"
  echo "[OK] FRONTEND done"
fi

if [[ "$MODE" == "back" || "$MODE" == "all" ]]; then
  echo "== BACKEND: arquivos alterados -> $BACK_REMOTE"
  upload_file "backend/routes/api.php" "$BACK_REMOTE/routes/api.php"
  upload_file "backend/app/Http/Controllers/Api/OpenLibraryController.php" "$BACK_REMOTE/app/Http/Controllers/Api/OpenLibraryController.php"
  upload_file "backend/app/Services/Integrations/OpenLibraryService.php" "$BACK_REMOTE/app/Services/Integrations/OpenLibraryService.php"
  echo "[OK] BACKEND done"
fi

echo "== DEPLOY FTPS DONE"
