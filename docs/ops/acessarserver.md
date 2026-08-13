# Como acessar o servidor — Artigo com Café (ValueHost)

Guia de acesso ao servidor de produção. Credenciais sensíveis ficam em `.env.server` (gitignored) — **não** copie senhas para arquivos versionados.

## Credenciais

- Provedor: ValueHost (DirectAdmin)
- Conta: `arti3263`
- IP: `186.209.113.157` (DNS de `br64-da.valueserver.net.br` → mesmo IP)
- Senha FTP/database: arquivo `.env.server` na raiz do projeto (gitignored), campo `FTP_PASS`

---

## SSH (principal — preferível)

| Item | Valor |
|------|-------|
| Host | `br64-da.valueserver.net.br` |
| Porta | `1157` (não é a 22) |
| Usuário | `arti3263` |
| Chave | `C:\Users\prowe\.ssh\id_ed25519` |

```bash
ssh -p 1157 -i C:\Users\prowe\.ssh\id_ed25519 -o StrictHostKeyChecking=accept-new arti3263@br64-da.valueserver.net.br
```

Chave cliente (confirmação): `SHA256:/S6KDAnJxy+QcTQtCpby+mf60EotFNhD+9hGYStNnSs`

> Nota: a fingerprint acima é da chave cliente `id_ed25519`, não do host. Se o OpenSSH reclamar do host key, aceite com `accept-new` (use o comando acima).

### Paths no servidor

| Item | Caminho |
|------|---------|
| Site estático (Astro) | `~/domains/artigocomcafe.com/public_html/` |
| Backend (Laravel) | `~/domains/back.artigocomcafe.com/public_html/` |

### Exemplos rápidos

```bash
# Ver carga do servidor
ssh -p 1157 -i C:\Users\prowe\.ssh\id_ed25519 arti3263@br64-da.valueserver.net.br uptime

# Ver arquivos do frontend
ssh -p 1157 -i C:\Users\prowe\.ssh\id_ed25519 arti3263@br64-da.valueserver.net.br ls ~/domains/artigocomcafe.com/public_html/

# Laravel: limpar caches após atualizar rotas
ssh -p 1157 -i C:\Users\prowe\.ssh\id_ed25519 arti3263@br64-da.valueserver.net.br "cd ~/domains/back.artigocomcafe.com/public_html && php artisan route:clear && php artisan config:clear"
```

---

## FTPS (fallback — quando o SSH está instável)

O host SSH compartilhado às vezes fica sob pressão (`fork: Resource temporarily unavailable`). Nesse caso use FTPS via `curl` (porta 21, FTP explícito sobre TLS).

| Item | Valor |
|------|-------|
| Host | `186.209.113.157` |
| Porta | `21` (FTPS `--ssl-reqd`) |
| Usuário | `arti3263` |
| Senha | `.env.server` → `FTP_PASS` |
| Frontend | `/domains/artigocomcafe.com/public_html/` |
| Backend | `/domains/back.artigocomcafe.com/public_html/` |

> **Importante:** o certificado TLS do IP falha a validação (`SEC_E_WRONG_PRINCIPAL`) — usar `curl -k` (skip verify).

### Comandos

```bash
# Listar frontend
curl -k --ssl-reqd --ftp-pasv -u "arti3263:SENHA" "ftp://186.209.113.157/domains/artigocomcafe.com/public_html/"

# Upload de um arquivo
curl -k --ssl-reqd --ftp-pasv --ftp-create-dirs -u "arti3263:SENHA" -T "dist/index.html" "ftp://186.209.113.157/domains/artigocomcafe.com/public_html/index.html"

# Download de um arquivo (ex.: conferir rota do backend)
curl -k --ssl-reqd --ftp-pasv -u "arti3263:SENHA" "ftp://186.209.113.157/domains/back.artigocomcafe.com/public_html/routes/api.php" -o server-api.php
```

---

## Deploy

- **Via SSH (preferível):** `.\deploy.ps1` na pasta do projeto — sobe frontend + backend, roda migrações e `php artisan optimize`.
- **Via FTPS (fallback):**
  - `bash deploy-ftps-par.sh front` → sobe o `dist/` inteiro em paralelo
  - `bash deploy-ftps-par.sh back` → sobe arquivos backend alterados

### Deploy frontend (dist) via FTPS paralelo

```bash
bash deploy-ftps-par.sh front
```

---

## URLs de produção

| Recurso | URL |
|---------|-----|
| Site | https://artigocomcafe.com |
| Dashboard | https://dash.artigocomcafe.com |
| API | https://back.artigocomcafe.com/api |
| Proxy da API (frontend) | https://artigocomcafe.com/api-proxy.php |

---

## Diagnóstico rápido

```bash
# Saúde do site estático (esperado 200)
curl -s -o NUL -w "%{http_code}" https://artigocomcafe.com/

# Saúde da API (esperado 200)
curl -s -o NUL -w "%{http_code}" "https://artigocomcafe.com/api-proxy.php/ai/status"

# Backend direto
curl -s -o NUL -w "%{http_code}" "https://back.artigocomcafe.com/api/test"
```
