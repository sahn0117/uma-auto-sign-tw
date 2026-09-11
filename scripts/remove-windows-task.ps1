$TaskName = "Uma Auto Sign TW"
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "已移除排程：$TaskName"
