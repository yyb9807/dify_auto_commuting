# PowerShell Example: Send commute log to Google Apps Script

# Replace with your actual Webhook URL (from Apps Script deployment)
$webhook = "https://script.google.com/macros/s/PUT_YOUR_EXEC_ID/exec"

# Example: Depart office at 18:10, commute by subway
Invoke-RestMethod -Uri $webhook `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json; charset=utf-8" } `
  -Body (@{
    date = "2025-08-22"
    event = "depart_office"
    time  = "2025-08-22T18:10:00+08:00"
    commute_mode = "地铁"
    note = "下班出发"
  } | ConvertTo-Json -Encoding UTF8)
