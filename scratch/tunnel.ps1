while ($true) {
    Write-Host "[TUNNEL] Connecting to localhost.run..."
    ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=6 -o StrictHostKeyChecking=no -o ConnectTimeout=10 -R 80:localhost:5173 nokey@localhost.run
    Write-Host "[TUNNEL] Connection closed. Reconnecting in 3s..."
    Start-Sleep -Seconds 3
}
