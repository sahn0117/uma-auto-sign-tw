param(
  [string]$Time,
  [string]$Profile = "Default"
)

$ErrorActionPreference = "Stop"
$TaskName = "Uma Auto Sign TW"
$Url = "https://uma.komoejoy.com/event/dailygift/"

$chromeCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { $_ -and (Test-Path $_) }

if (-not $chromeCandidates) {
  throw "找不到 Google Chrome。請確認 Chrome 是否已安裝。"
}

$Chrome = $chromeCandidates[0]

if (-not $Time) {
  $Time = Read-Host "請輸入每天啟動時間 (HH:mm，例如 08:00)"
}

if ($Time -notmatch '^(?:[01]\d|2[0-3]):[0-5]\d$') {
  throw "時間格式錯誤，請使用 HH:mm。"
}

$today = Get-Date
$parts = $Time.Split(':')
$at = Get-Date -Year $today.Year -Month $today.Month -Day $today.Day -Hour ([int]$parts[0]) -Minute ([int]$parts[1]) -Second 0
if ($at -lt (Get-Date)) { $at = $at.AddDays(1) }

$action = New-ScheduledTaskAction `
  -Execute $Chrome `
  -Argument "--profile-directory=`"$Profile`" --new-window `"$Url`""

$trigger = New-ScheduledTaskTrigger -Daily -At $at
$settings = New-ScheduledTaskSettingsSet -WakeToRun -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Principal $principal `
  -Description "Open Chrome and Uma Musume TW daily gift page for Uma Auto Sign TW." `
  -Force | Out-Null

Write-Host ""
Write-Host "已建立排程：$TaskName"
Write-Host "Chrome：$Chrome"
Write-Host "Profile：$Profile"
Write-Host "每天：$Time"
Write-Host ""
Write-Host "注意：Windows 必須已登入；關機狀態無法自動執行。睡眠時可由排程喚醒。"
