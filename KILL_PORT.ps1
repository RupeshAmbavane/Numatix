# Script to kill process on port 3000
# Usage: .\KILL_PORT.ps1

$port = 3000
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($connections) {
    foreach ($conn in $connections) {
        if ($conn.OwningProcess -ne 0) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Killing process $($process.Id) ($($process.ProcessName)) on port $port"
                Stop-Process -Id $conn.OwningProcess -Force
            }
        }
    }
    Write-Host "Port $port is now free"
} else {
    Write-Host "Port $port is already free"
}

