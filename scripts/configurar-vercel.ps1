# Configura las variables de entorno de produccion en Vercel.
# Te pide cada valor; las claves no se muestran en pantalla ni se guardan en ningun archivo.
# Uso: powershell -ExecutionPolicy Bypass -File .\scripts\configurar-vercel.ps1

$ErrorActionPreference = "Continue"
$site = "https://alquiler-en-regla.vercel.app"

function Set-VercelEnv([string]$name, [string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { Write-Host "  (vacio, se omite $name)" -ForegroundColor Yellow; return }
  $ok = $true
  foreach ($target in "production", "preview") {
    npx --yes vercel env rm $name $target --yes 2>$null | Out-Null
    $value | npx --yes vercel env add $name $target 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { $ok = $false }
  }
  if ($ok) { Write-Host "  OK $name" -ForegroundColor Green }
  else { Write-Host "  ERROR guardando $name. Anadela a mano en Vercel > Settings > Environment Variables." -ForegroundColor Red }
}

function Ask([string]$label, [string]$help) {
  Write-Host ""
  Write-Host $label -ForegroundColor Cyan
  if ($help) { Write-Host "  $help" -ForegroundColor DarkGray }
  return (Read-Host "  Pega el valor y pulsa Enter").Trim()
}

function AskSecret([string]$label, [string]$help) {
  Write-Host ""
  Write-Host $label -ForegroundColor Cyan
  if ($help) { Write-Host "  $help" -ForegroundColor DarkGray }
  $secure = Read-Host "  Pega el valor (no se vera) y pulsa Enter" -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)).Trim() }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

Write-Host "== 1/3 Inicia sesion en Vercel (se abre el navegador) ==" -ForegroundColor White
npx --yes vercel login
Write-Host ""
Write-Host "== 2/3 Conectando esta carpeta con tu proyecto de Vercel ==" -ForegroundColor White
npx --yes vercel link --yes --project alquiler-en-regla

Write-Host ""
Write-Host "== 3/3 Variables ==" -ForegroundColor White
Write-Host "Ten abierto Supabase en: Project Settings > API (o API Keys)."

# Solo se piden las que aun no estan en Vercel, asi el script se puede repetir.
$existing = (npx --yes vercel env ls production 2>$null | Out-String)
function Missing([string]$name) {
  if ($existing -match "(?m)^\s*$name\s") { Write-Host "  Ya configurada: $name" -ForegroundColor DarkGray; return $false }
  return $true
}

if (Missing "NEXT_PUBLIC_SUPABASE_URL") { Set-VercelEnv "NEXT_PUBLIC_SUPABASE_URL" (Ask "Supabase: Project URL" "Empieza por https:// y acaba en .supabase.co") }
if (Missing "NEXT_PUBLIC_SUPABASE_ANON_KEY") { Set-VercelEnv "NEXT_PUBLIC_SUPABASE_ANON_KEY" (AskSecret "Supabase: clave anon public (o publishable)" "Es la clave publica, la que NO dice secret ni service_role") }
if (Missing "SUPABASE_SERVICE_ROLE_KEY") { Set-VercelEnv "SUPABASE_SERVICE_ROLE_KEY" (AskSecret "Supabase: clave service_role (o secret)" "Pulsa Reveal para verla. No la compartas con nadie") }

if (Missing "NEXT_PUBLIC_SITE_URL") { Set-VercelEnv "NEXT_PUBLIC_SITE_URL" $site }

if (Missing "CRON_SECRET") {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  Set-VercelEnv "CRON_SECRET" (($bytes | ForEach-Object { $_.ToString("x2") }) -join "")
}

if (Missing "LEGAL_NAME") { Set-VercelEnv "LEGAL_NAME" (Ask "Titular de la web: nombre completo o razon social" "Sale en el aviso legal. Ej.: Tech Shop SL") }
if (Missing "LEGAL_ID") { Set-VercelEnv "LEGAL_ID" (Ask "NIF o CIF del titular" "") }
if (Missing "LEGAL_ADDRESS") { Set-VercelEnv "LEGAL_ADDRESS" (Ask "Direccion postal del titular" "Ej.: Calle Mayor 1, 46001 Valencia") }
if (Missing "CONTACT_EMAIL") { Set-VercelEnv "CONTACT_EMAIL" (Ask "Email de contacto publico" "Sale en las paginas legales") }

Write-Host ""
$after = (npx --yes vercel env ls production 2>$null | Out-String)
$all = "NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY","NEXT_PUBLIC_SITE_URL","CRON_SECRET","LEGAL_NAME","LEGAL_ID","LEGAL_ADDRESS","CONTACT_EMAIL"
$left = $all | Where-Object { $after -notmatch "(?m)^\s*$_\s" }
if ($left) {
  Write-Host "Faltan todavia: $($left -join ', ')" -ForegroundColor Red
  Write-Host "Vuelve a ejecutar el script o anadelas en Vercel > Settings > Environment Variables." -ForegroundColor Red
} else {
  Write-Host "Listo: las 9 variables estan en Vercel. Vuelve al chat y escribe: hecho" -ForegroundColor Green
}
