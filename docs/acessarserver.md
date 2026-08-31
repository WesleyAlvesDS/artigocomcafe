
# Acesso ao Servidor ValueHost (arti3263)

> **Servidor:** br64-da.valueserver.net.br (porta SSH 1157) · DirectAdmin: br64-da.valueserver.net.br:2222
> **Conta:** arti3263 · 

## SSH

```bash
ssh -p 1157 -i ~/.ssh/id_ed25519 arti3263@br64-da.valueserver.net.br
```

## FTPS (conexão segura — recomendada quando SSH indisponível)

```bash
# Listar raiz
curl --ssl-reqd -u 'arti3263:CmQ#yD7R.u993t' 'ftp://br64-da.valueserver.net.br/'

# Listar diretório
curl -u 'arti3263:CmQ#yD7R.u993t' 'ftp://br64-da.valueserver.net.br/domains/'

# Baixar arquivo
curl -u 'arti3263:CmQ#yD7R.u993t' 'ftp://br64-da.valueserver.net.br/domains/loom.ordob.com/public_html/OrdoB-Loom/.env'

# Upload (substitui)
curl -T arquivo.txt -u 'arti3263:CmQ#yD7R.u993t' 'ftp://br64-da.valueserver.net.br/scripts/arquivo.txt'

# Upload com criação de diretórios
curl --ftp-create-dirs -T arquivo.php -u 'arti3263:CmQ#yD7R.u993t' 'ftp://br64-da.valueserver.net.br/domains/loom.ordob.com/public_html/OrdoB-Loom/app/Console/Commands/arquivo.php'

# Apagar arquivo
curl -u 'arti3263:CmQ#yD7R.u993t' -Q 'DELE /domains/loom.ordob.com/public_html/recover.php' 'ftp://br64-da.valueserver.net.br/'
```

> ⚠️ **Segurança:** as credenciais acima dão acesso à conta arti3263. Não commitar em repositórios públicos.

## Scripts de manutenção (subidos no servidor)

| Script | Local no servidor | Função |
|--------|-------------------|--------|
| `redis_watchdog.sh` | `~/scripts/redis_watchdog.sh` | Detecta Redis MISCONF e dispara a correção (cron 1 min) |
| `restore-crontab.sh` | `~/scripts/restore-crontab.sh` | Restaura crontab (watchdog Pasty + redis_watchdog + schedulers) |
| `redis-fix.php` | `loom.ordob.com/public_html/OrdoB-Loom/public/redis-fix.php` | Corrige MISCONF via phpredis (token: `ordob-redis-fix-2026`) |

## Comandos de manutenção importantes

```bash
# Corrigir Redis MISCONF (sem SSH, via HTTP)
curl 'https://loom.ordob.com/redis-fix.php?token=ordob-redis-fix-2026'

# Restaurar crontab (após SSH voltar)
bash /home/arti3263/scripts/restore-crontab.sh

# Testar watchdog do Pasty
bash /home/arti3263/scripts/pasty_watchdog.sh
```

## Notas

- **`shell_exec` bloqueado** no disable_functions do PHP → scripts de recuperação devem usar phpredis/HTTP
- **Loom** configurado (10/08/2026) com cache=file, sessão=database, fila=sync (via `bootstrap/cache/config.php`) para não depender do Redis
- Detalhes do incidente: `docs/RELATORIO_INCIDENTE_20260810.md`