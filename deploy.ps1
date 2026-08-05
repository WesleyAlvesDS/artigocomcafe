# =====================================================================
# Artigocomcafe.com - unified deploy (ValueHost / DirectAdmin) via SSH
# =====================================================================
# Usage:
#   .\deploy.ps1                  -> deploy everything (frontend + backend)
#   .\deploy.ps1 -Front           -> Astro frontend only
#   .\deploy.ps1 -Back            -> Laravel backend only
#   .\deploy.ps1 -All -DryRun     -> simulate, change nothing
#   .\deploy.ps1 -Back -NoMigrate -> backend without running migrations
#
# Optional config (overrides defaults), add to .env:
#   DEPLOY_SSH_HOST=br64-da.valueserver.net.br
#   DEPLOY_SSH_PORT=1157
#   DEPLOY_SSH_USER=arti3263
#   DEPLOY_SSH_KEY=C:\Users\voce\.ssh\id_ed25519
#   DEPLOY_FRONT_PATH=~/domains/artigocomcafe.com/public_html
#   DEPLOY_BACK_PATH=~/domains/back.artigocomcafe.com/public_html
# =====================================================================

param(
  [switch]$Front,
  [switch]$Back,
  [switch]$All,
  [switch]$DryRun,
  [switch]$NoMigrate
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# =====================================================================
# Compatibilidade com git-bash / MSYS: quando o script roda via bash,
# o PATH herdado pode trazer tar/ssh do MSYS que não resolvem caminhos
# Windows (C:\...). Garantimos prioridade para as ferramentas nativas.
# =====================================================================
$env:PATH = "$env:SystemRoot\System32\OpenSSH;$env:SystemRoot\System32;$env:PATH"

# Resolve um tar compatível com caminhos Windows (bsdtar do System32).
# O tar do MSYS/git-bash falha com "Cannot connect to C: resolve failed"
# ao tentar gravar em caminhos como C:\Users\...\Temp\artigo_deploy\*.tar.gz.
function Get-WindowsTar {
  foreach ($c in @("$env:SystemRoot\System32\tar.exe", "$env:SystemRoot\System32\bsdtar.exe")) {
    if (Test-Path $c) { return $c }
  }
  $cmd = Get-Command tar.exe -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($cmd) { return $cmd.Source }
  return "tar.exe"
}
$tarExe = Get-WindowsTar

$okC   = "Green"
$warnC = "Yellow"
$errC  = "Red"
$infoC = "Cyan"

function Say($head, $color, $msg) {
  Write-Host ("$head ") -NoNewline -ForegroundColor $color
  Write-Host $msg
}

$cfg = @{
  Host      = "br64-da.valueserver.net.br"
  Port      = 1157
  User      = "arti3263"
  Key       = "$env:USERPROFILE\.ssh\id_ed25519"
  FrontPath = "~/domains/artigocomcafe.com/public_html"
  BackPath  = "~/domains/back.artigocomcafe.com/public_html"
}

$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*(DEPLOY_\w+)\s*=\s*(.+?)\s*$') {
      $k, $v = $matches[1], $matches[2].Trim('"').Trim("'")
      switch ($k) {
        "DEPLOY_SSH_HOST"   { $cfg.Host = $v }
        "DEPLOY_SSH_PORT"   { $cfg.Port = [int]$v }
        "DEPLOY_SSH_USER"   { $cfg.User = $v }
        "DEPLOY_SSH_KEY"    { $cfg.Key = $v }
        "DEPLOY_FRONT_PATH" { $cfg.FrontPath = $v }
        "DEPLOY_BACK_PATH"  { $cfg.BackPath = $v }
      }
    }
  }
}

if (-not ($Front -or $Back -or $All)) { $All = $true }
if ($All) { $Front = $true; $Back = $true }

$ssh = "ssh -p $($cfg.Port) -i `"$($cfg.Key)`" -o StrictHostKeyChecking=accept-new $($cfg.User)@$($cfg.Host)"
$scp = "scp -P $($cfg.Port) -i `"$($cfg.Key)`" -o StrictHostKeyChecking=accept-new"

Say ">>" $infoC "Deploy Artigocomcafe.com -> $($cfg.Host):$($cfg.Port)"
Say "   Host:" $okC " $($cfg.Host)"
Say "   User:" $okC " $($cfg.User)"
Say "   Key :" $okC " $($cfg.Key)"
if (-not (Test-Path $cfg.Key)) {
  Say "[!]" $errC "SSH key not found: $($cfg.Key)"
  exit 1
}
if ($DryRun) { Say "==" $warnC "DRY RUN - nothing will be changed" }

$tmp = Join-Path $env:TEMP "artigo_deploy"
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

function Run-Remote($remoteCmd) {
  if ($DryRun) { Say "== (dry)" $warnC $remoteCmd; return }
  # build:  ssh ... user@host  "remote command"
  $cmd = $ssh + " `"" + ($remoteCmd -replace '"', '\"') + "`""
  Invoke-Expression $cmd
  if ($LASTEXITCODE -ne 0) {
    Say "[!]" $errC "Remote command failed (exit $LASTEXITCODE): $remoteCmd"
    exit 1
  }
}
function Send-File($local, $remotePath) {
  if ($DryRun) { Say "== (dry) scp" $warnC "$local -> $remotePath"; return }
  Invoke-Expression ($scp + " `"$local`" $($cfg.User)@$($cfg.Host):$remotePath")
  if ($LASTEXITCODE -ne 0) {
    Say "[!]" $errC "scp failed for $local"
    exit 1
  }
}

# ================= FRONTEND =================
if ($Front) {
  Write-Host ""
  Say "== FRONTEND" $infoC "build Astro"
  if (-not $DryRun) {
    Push-Location $root
    try { npm run build } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { Say "[!]" $errC "Build failed"; exit 1 }
  }

  $dist = Join-Path $root "dist"
  $tar  = Join-Path $tmp "front.tar.gz"
  if (Test-Path $tar) { Remove-Item $tar }

  Say "-- FRONTEND" $infoC "pack dist"
  if (-not $DryRun) {
    & $tarExe -czf $tar -C $dist .
    if ($LASTEXITCODE -ne 0) { Say "[!]" $errC "Failed to create frontend tarball"; exit 1 }
  }

  Say "-- FRONTEND" $infoC "upload + extract"
  Send-File $tar "~/front.tar.gz"
  Run-Remote ("cd " + $cfg.FrontPath + " && tar -xzf ~/front.tar.gz && rm -f ~/front.tar.gz && echo FRONT_OK")
  Say "[OK]" $okC "FRONTEND deployed"
}

# ================= BACKEND =================
if ($Back) {
  Write-Host ""
  Say "== BACKEND" $infoC "Laravel (keeps .env/vendor/storage/public)"
  $backDir = Join-Path $root "backend"
  if (-not (Test-Path $backDir)) { Say "[!]" $errC "backend folder not found: $backDir"; exit 1 }
  $backTar = Join-Path $tmp "back.tar.gz"
  if (Test-Path $backTar) { Remove-Item $backTar }

  Say "-- BACKEND" $infoC "pack source"
  if (-not $DryRun) {
    Push-Location $backDir
    try {
      & $tarExe -czf $backTar app config routes database bootstrap/app.php bootstrap/providers.php resources artisan composer.json composer.lock
    } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { Say "[!]" $errC "Failed to pack backend"; exit 1 }
  }

  Say "-- BACKEND" $infoC "upload + extract"
  Send-File $backTar "~/back.tar.gz"
  Run-Remote ("cd " + $cfg.BackPath + " && tar -xzf ~/back.tar.gz && rm -f ~/back.tar.gz && echo BACK_OK")

  if (-not $NoMigrate) {
    Say "-- BACKEND" $infoC "run migrations"
    Run-Remote ("cd " + $cfg.BackPath + " && php artisan migrate --force")
  }
  Say "-- BACKEND" $infoC "optimize cache"
  Run-Remote ("cd " + $cfg.BackPath + " && php artisan optimize")
  Say "[OK]" $okC "BACKEND deployed"
}

# ================= SUMMARY =================
Write-Host ""
Say ("=" * 50) $infoC ""
Say("[OK]") $okC ("DEPLOY DONE" + $(if ($DryRun) { " (DRY RUN)" } else { "" }))
Say("--")  $infoC ("=" * 50)
Say("-")    $infoC "Frontend : https://artigocomcafe.com"
Say("-")    $infoC "Dashboard: https://dash.artigocomcafe.com"
Say("-")    $infoC "API      : https://back.artigocomcafe.com/api"
Write-Host ""