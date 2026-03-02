param(
  [int]$Port = 8085,
  [switch]$ValidateOnly
)

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$env:Path += ";C:\Program Files\nodejs"
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

$sdkRoot = "C:\Users\thangadu\AppData\Local\Android\Sdk"
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

foreach ($entry in @(
  "$env:JAVA_HOME\bin",
  "$sdkRoot",
  "$sdkRoot\platform-tools",
  "$sdkRoot\emulator",
  "$sdkRoot\cmdline-tools\latest\bin"
)) {
  if (($env:Path -split ';') -notcontains $entry) {
    $env:Path += ";$entry"
  }
}

$adbPath = "$sdkRoot\platform-tools\adb.exe"
$emuPath = "$sdkRoot\emulator\emulator.exe"

if (!(Test-Path $adbPath)) {
  throw "adb not found at $adbPath"
}

if (!(Test-Path $emuPath)) {
  throw "Android emulator not found at $emuPath"
}

$adb = & $adbPath devices
$hasDevice = ($adb | Select-String -Pattern "\sdevice$" -SimpleMatch:$false) -ne $null

if (!$hasDevice) {
  $avds = & $emuPath -list-avds
  if (-not $avds -or $avds.Count -eq 0) {
    throw "No Android Virtual Device found. Create an AVD first (e.g. sera_pixel_35)."
  }

  $avdName = if ($avds -contains "sera_pixel_35") { "sera_pixel_35" } else { $avds[0] }
  Start-Process -FilePath $emuPath -ArgumentList "-avd $avdName -netdelay none -netspeed full" | Out-Null

  $ready = $false
  for ($i = 0; $i -lt 24; $i++) {
    Start-Sleep -Seconds 5
    $state = & $adbPath devices
    if (($state | Select-String -Pattern "\sdevice$" -SimpleMatch:$false) -ne $null) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    throw "Emulator did not become ready in time."
  }
}

if ($ValidateOnly) {
  Write-Output "Android environment is ready."
  exit 0
}

npx expo start --android --port $Port
