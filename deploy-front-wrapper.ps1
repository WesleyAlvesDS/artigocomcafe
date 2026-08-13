$env:Path = "$env:SystemRoot\System32;$env:SystemRoot;$env:SystemRoot\System32\OpenSSH;$env:SystemRoot\System32\WindowsPowerShell\v1.0;C:\Program Files\nodejs"
Set-Location $PSScriptRoot
& .\deploy.ps1 -Front
Exit $LASTEXITCODE
