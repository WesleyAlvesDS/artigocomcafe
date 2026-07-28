# Artigocomcafe.com - Script de Deploy para ValueHost (DirectAdmin)
# Uso: .\deploy.ps1 -Target "C:\caminho\para\public_html"
# Ou apenas .\deploy.ps1 (usa .env se existir)

param(
  [string]$Target = "",
  [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

# Cores
$green = "Green"
$yellow = "Yellow"
$red = "Red"
$cyan = "Cyan"

# Tenta ler .env
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*DEPLOY_PATH\s*=\s*(.+)\s*$') {
      $Target = $matches[1]
    }
  }
}

if (-not $Target) {
  Write-Host "❌" -NoNewline
  Write-Host " Uso: .\deploy.ps1 -Target `"C:\caminho\para\public_html`"" -ForegroundColor $yellow
  Write-Host "  Ou crie um arquivo .env com: DEPLOY_PATH=C:\caminho\para\public_html"
  exit 1
}

if (-not (Test-Path $Target)) {
  Write-Host "❌" -NoNewline
  Write-Host " Diretório não encontrado: $Target" -ForegroundColor $red
  exit 1
}

Write-Host "`n🚀" -NoNewline
Write-Host " Deploy Artigocomcafe.com" -ForegroundColor $cyan
Write-Host "   Origem:  " -NoNewline
Write-Host "$PSScriptRoot\dist" -ForegroundColor $green
Write-Host "   Destino: " -NoNewline
Write-Host "$Target" -ForegroundColor $green
Write-Host ""

# 1. Build
Write-Host "`n📦" -NoNewline
Write-Host " Build do Astro..." -ForegroundColor $cyan
Set-Location $PSScriptRoot
$buildResult = npx astro build 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌" -NoNewline
  Write-Host " Build falhou:" -ForegroundColor $red
  Write-Host $buildResult
  exit 1
}
Write-Host "✅" -NoNewline
Write-Host " Build concluído!" -ForegroundColor $green

$source = Join-Path $PSScriptRoot "dist"

# 2. Backup do WordPress
$wpFiles = @(
  "wp-admin", "wp-includes", "wp-content", "wp-config.php",
  "xmlrpc.php", "wp-load.php", "wp-login.php", "wp-mail.php",
  "wp-settings.php", "wp-signup.php", "wp-trackback.php",
  "wp-links-opml.php", "wp-cron.php", "wp-comments-post.php",
  "wp-blog-header.php", "wp-activate.php", ".htaccess",
  "index.php", "license.txt", "readme.html"
)

Write-Host "`n📋" -NoNewline
Write-Host " Verificando WordPress existente..." -ForegroundColor $cyan
$hasWP = $false
foreach ($file in $wpFiles) {
  $path = Join-Path $Target $file
  if (Test-Path $path) { $hasWP = $true; break }
}

if ($hasWP) {
  Write-Host "✅" -NoNewline
  Write-Host " WordPress detectado em $Target" -ForegroundColor $green
} else {
  Write-Host "⚠️" -NoNewline
  Write-Host " Nenhum WordPress encontrado. O deploy só terá os arquivos estáticos." -ForegroundColor $yellow
}

# 3. Dry run
if ($DryRun) {
  Write-Host "`n🔍" -NoNewline
  Write-Host " Dry Run - Arquivos que serão copiados:" -ForegroundColor $cyan
  $files = Get-ChildItem -Path $source -Recurse -File
  foreach ($f in $files) {
    $rel = $f.FullName.Substring($source.Length + 1)
    $dest = Join-Path $Target $rel
    Write-Host "   📄 $rel →  $dest"
  }
  Write-Host "`n✅" -NoNewline
  Write-Host " Dry Run completo. Nada foi alterado." -ForegroundColor $green
  exit 0
}

# 4. Copiar arquivos estáticos
Write-Host "`n📤" -NoNewline
Write-Host " Copiando arquivos estáticos..." -ForegroundColor $cyan
$fileCount = 0
Get-ChildItem -Path $source -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($source.Length + 1)
  $dest = Join-Path $Target $rel
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
  }
  Copy-Item -Path $_.FullName -Destination $dest -Force
  $fileCount++
}
Write-Host "✅" -NoNewline
Write-Host " $fileCount arquivos copiados." -ForegroundColor $green

# 5. .htaccess
Write-Host "`n🔒" -NoNewline
Write-Host " Verificando .htaccess..." -ForegroundColor $cyan
$htaccess = Join-Path $Target ".htaccess"
if (Test-Path $htaccess) {
  $content = Get-Content $htaccess -Raw
  if ($content -notmatch "DirectoryIndex") {
    Write-Host "📝" -NoNewline
    Write-Host " Adicionando DirectoryIndex ao .htaccess..." -ForegroundColor $yellow
    $newContent = "DirectoryIndex index.html index.php`n`n$content"
    Set-Content -Path $htaccess -Value $newContent
    Write-Host "✅" -NoNewline
    Write-Host " .htaccess atualizado!" -ForegroundColor $green
  } else {
    Write-Host "✅" -NoNewline
    Write-Host " .htaccess já configurado." -ForegroundColor $green
  }
} else {
  Write-Host "📝" -NoNewline
  Write-Host " Criando .htaccess..." -ForegroundColor $yellow
  @"
DirectoryIndex index.html index.php
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
"@ | Set-Content -Path $htaccess
  Write-Host "✅" -NoNewline
  Write-Host " .htaccess criado!" -ForegroundColor $green
}

# 6. Permissões (ajuda)
Write-Host "`n🔐" -NoNewline
Write-Host " Verificando permissões..." -ForegroundColor $cyan
if ($Target -match "public_html") {
  Write-Host "   Dica: No DirectAdmin, as permissões são gerenciadas automaticamente."
  Write-Host "   Se precisar: acesse o File Manager e dê permissão 755 para pastas, 644 para arquivos."
}

# Sumário
Write-Host "`n" + "="*50 -ForegroundColor $cyan
Write-Host " ✅ DEPLOY CONCLUÍDO!" -ForegroundColor $green
Write-Host "="*50 -ForegroundColor $cyan
Write-Host ""

# URLs
$urls = @(
  "/", "/blog/", "/sobre/", "/contato/", "/newsletter/"
)
Get-ChildItem -Path $source -Recurse -Directory | ForEach-Object {
  $rel = $_.FullName.Substring($source.Length)
  if (Test-Path (Join-Path $_.FullName "index.html")) {
    $urls += $rel.Replace("\", "/") + "/"
  }
}

Write-Host "📄 Páginas implantadas:" -ForegroundColor $cyan
$urls | Sort-Object | ForEach-Object {
  Write-Host "   • https://artigocomcafe.com$_" -ForegroundColor $green
}

Write-Host "`n📌 LEMBRE-SE:" -ForegroundColor $yellow
Write-Host "   • WordPress continua em: https://artigocomcafe.com/wp-admin/" -ForegroundColor $white
Write-Host "   • API REST: https://artigocomcafe.com/wp-json/wp/v2/posts" -ForegroundColor $white
Write-Host "   • Mídias: https://artigocomcafe.com/wp-content/uploads/" -ForegroundColor $white
Write-Host "   • Artigos novos: publique no WordPress, execute 'npm run build' e deploy novamente" -ForegroundColor $white
Write-Host ""
