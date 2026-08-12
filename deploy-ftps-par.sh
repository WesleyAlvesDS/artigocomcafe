#!/bin/bash
# =====================================================================
# Deploy FTPS paralelo — sobe o dist inteiro (504 arquivos) com xargs -P
# Uso: bash deploy-ftps-par.sh  (frontend) | bash deploy-ftps-par.sh back
# Credenciais: carregadas de scripts/secrets.sh (gitignored)
# =====================================================================
set -u
cd "$(dirname "$0")"

if [[ -f "scripts/secrets.sh" ]]; then
  source scripts/secrets.sh
else
  echo "[!] scripts/secrets.sh nao encontrado — crie-o com FTP_HOST/FTP_USER/FTP_PASS" >&2
  exit 1
fi

HOST="${FTP_HOST:-186.209.113.157}"
USER="${FTP_USER:-arti3263}"
PASS="${FTP_PASS:-}"
FRONT_REMOTE="/domains/artigocomcafe.com/public_html"
BACK_REMOTE="/domains/back.artigocomcafe.com/public_html"
MODE="${1:-front}"
JOBS="${2:-8}"

echo ">> Deploy FTPS paralelo ($MODE, $JOBS jobs) -> $HOST"

export HOST USER PASS

upload_one() {
  local local_path="$1" remote_full="$2"
  curl -sk --ssl-reqd --ftp-pasv --ftp-create-dirs \
    --connect-timeout 25 --max-time 300 \
    -u "$USER:$PASS" -T "$local_path" "ftp://$HOST$remote_full" 2>/dev/null \
    && echo "OK  $remote_full" \
    || echo "FAIL $remote_full"
}
export -f upload_one

if [[ "$MODE" == "front" || "$MODE" == "all" ]]; then
  echo "== FRONTEND: dist -> $FRONT_REMOTE"
  find "$PWD/dist" -type f -print \
    | while read -r f; do
        rel="${f#$PWD/dist/}"
        echo "$f|$FRONT_REMOTE/$rel"
      done \
    | xargs -P "$JOBS" -n 1 bash -c '
        IFS="|" read -r local_path remote_full <<< "$0"
        upload_one "$local_path" "$remote_full"
      '
  echo "[OK] FRONTEND done"
fi

if [[ "$MODE" == "back" || "$MODE" == "all" ]]; then
  echo "== BACKEND -> $BACK_REMOTE"
  for f in \
    "backend/routes/api.php|$BACK_REMOTE/routes/api.php" \
    "backend/app/Http/Controllers/Api/OpenLibraryController.php|$BACK_REMOTE/app/Http/Controllers/Api/OpenLibraryController.php" \
    "backend/app/Services/Integrations/OpenLibraryService.php|$BACK_REMOTE/app/Services/Integrations/OpenLibraryService.php" \
  ; do
    IFS="|" read -r local_path remote_full <<< "$f"
    upload_one "$PWD/$local_path" "$remote_full"
  done
  echo "[OK] BACKEND done"
fi

echo "== DEPLOY FTPS PARALELO DONE"
