# 🖥️ Acesso ao Servidor (ValueHost) — Artigo com Café

> 🔐 **Segurança:** as credenciais reais **não ficam neste arquivo** (que é
> versionado no git). Elas vivem em `.env.server` na raiz do projeto —
> arquivo **gitignored** (nunca deve ser commitado).

## Como acessar

1. Leia as credenciais do arquivo gitignored:

   ```bash
   # raiz do projeto
   cat .env.server        # FTP_HOST, FTP_USER, FTP_PASS, FTP_PATH
   ```

2. **FTP** (upload manual / deploy alternativo):
   ```
   ftp://186.209.113.157/domains/
   usuário: arti3263   (senha: ver .env.server)
   ```

3. **SSH / DirectAdmin** — ver skill `valuehost-servers`:
   ```
   ssh -p 1157 arti3263@br64-da.valueserver.net.br
   ```

## Deploy automático

O `deploy.ps1` da raiz resolve o tar do Windows/bsdtar e faz o deploy do
frontend (`dist/`) e do backend (migrations + optimize). Ele autentica via
**chave SSH** e lê a configuração do `.env` (chaves `DEPLOY_*`) — não usa
senha FTP. O `.env.server` é apenas referência de credenciais FTP.

---

> ⚠️ **Histórico de segurança:** as credenciais deste servidor estiveram
> versionadas em `acessarserver.md` no git (**continuam no histórico do repo** —
> o arquivo movido não apaga o passado). **Troque a senha do FTP** no
> DirectAdmin o quanto antes (rotação é a única correção definitiva) e nunca
> mais versionue segredos.
