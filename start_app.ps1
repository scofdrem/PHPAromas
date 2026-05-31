# PHP Aromas - Windows PowerShell Startup Script
# Usage: .\start_app.ps1 [start|stop|restart]

param(
    [Parameter(Position=0)]
    [ValidateSet("start","stop","restart")]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Level, [string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$Level] $timestamp $Message"
}

function Get-LocalIP {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.InterfaceAlias -notlike "*Loopback*" -and $_.PrefixOrigin -ne "WellKnown"
    } | Select-Object -First 1).IPAddress
    if (-not $ip) { $ip = "127.0.0.1" }
    return $ip
}

function Test-PortAvailable {
    param([int]$Port)
    $listener = $null
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        return $true
    } catch {
        return $false
    } finally {
        if ($listener) { $listener.Stop() }
    }
}

function Get-AvailablePort {
    param([int]$StartPort)
    for ($port = $StartPort; $port -le ($StartPort + 100); $port++) {
        if (Test-PortAvailable -Port $port) { return $port }
    }
    throw "No available port found in range $StartPort-$($StartPort + 100)"
}

function Start-Backend {
    param([int]$Port)
    Write-Log "INFO" "Starting Laravel backend on port $Port..."
    $process = Start-Process php -ArgumentList "artisan","serve","--host=0.0.0.0","--port=$Port" `
        -WorkingDirectory $PSScriptRoot -PassThru -NoNewWindow
    return $process.Id
}

function Start-Frontend {
    param([int]$Port)
    Write-Log "INFO" "Starting frontend dev server on port $Port..."
    $pm = if (Get-Command pnpm -ErrorAction SilentlyContinue) { "pnpm" } else { "npm" }
    $process = Start-Process $pm -ArgumentList "dev","--host","0.0.0.0","--port","$Port" `
        -WorkingDirectory "$PSScriptRoot\frontend" -PassThru -NoNewWindow
    return $process.Id
}

function Wait-ForHealth {
    param([string]$Url, [int]$MaxAttempts = 30)
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $null = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            return $true
        } catch {
            if ($i % 10 -eq 0) {
                Write-Log "INFO" "Waiting for $Url (attempt $i/$MaxAttempts)..."
            }
            Start-Sleep -Seconds 1
        }
    }
    return $false
}

function Save-Pids {
    param([int]$BackendPid, [int]$FrontendPid)
    @{
        BACKEND_PID = $BackendPid
        FRONTEND_PID = $FrontendPid
        TIMESTAMP = [int](Get-Date -UFormat %s)
    } | ConvertTo-Json | Set-Content "$PSScriptRoot\.pids.json"
}

function Get-CachedPids {
    $path = "$PSScriptRoot\.pids.json"
    if (Test-Path $path) {
        try { return Get-Content $path | ConvertFrom-Json } catch { return $null }
    }
    return $null
}

function Stop-AllProcesses {
    Write-Log "INFO" "Stopping services..."
    $cached = Get-CachedPids
    if ($cached) {
        foreach ($procId in @($cached.BACKEND_PID, $cached.FRONTEND_PID)) {
            if ($procId -and (Get-Process -Id $procId -ErrorAction SilentlyContinue)) {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-Log "INFO" "Stopped PID $procId"
            }
        }
        Remove-Item "$PSScriptRoot\.pids.json" -ErrorAction SilentlyContinue
    }
    # Also kill any orphaned php artisan serve or node processes from this directory
    Get-Process php -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -and $_.Path -like "*$PSScriptRoot*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Log "SUCCESS" "Services stopped"
}

function Start-App {
    # Check dependencies
    if (-not (Test-Path "$PSScriptRoot\artisan")) {
        Write-Log "ERROR" "artisan not found - wrong directory?"
        return
    }

    $localIP = Get-LocalIP
    Write-Log "INFO" "Local IP: $localIP"

    # Install dependencies if needed
    if (-not (Test-Path "$PSScriptRoot\vendor")) {
        Write-Log "INFO" "Installing PHP dependencies..."
        Set-Location $PSScriptRoot
        composer install --no-interaction --prefer-dist --optimize-autoloader
    } else {
        Write-Log "INFO" "Composer dependencies up to date, skipping"
    }

    if (-not (Test-Path "$PSScriptRoot\frontend\node_modules")) {
        Write-Log "INFO" "Installing frontend dependencies..."
        Set-Location "$PSScriptRoot\frontend"
        $pm = if (Get-Command pnpm -ErrorAction SilentlyContinue) { "pnpm" } else { "npm" }
        & $pm install
    } else {
        Write-Log "INFO" "Frontend dependencies up to date, skipping"
    }

    # Find available ports
    $backendPort = Get-AvailablePort -StartPort 8000
    $frontendPort = Get-AvailablePort -StartPort 3000
    Write-Log "INFO" "Backend port: $backendPort, Frontend port: $frontendPort"

    # Start services
    Set-Location $PSScriptRoot
    $env:BACKEND_PORT = $backendPort
    $env:FRONTEND_PORT = $frontendPort

    $backendPid = Start-Backend -Port $backendPort
    Start-Sleep -Seconds 3

    if (-not (Get-Process -Id $backendPid -ErrorAction SilentlyContinue)) {
        Write-Log "ERROR" "Backend failed to start"
        return
    }

    $frontendPid = Start-Frontend -Port $frontendPort
    Start-Sleep -Seconds 2

    if (-not (Get-Process -Id $frontendPid -ErrorAction SilentlyContinue)) {
        Write-Log "ERROR" "Frontend failed to start"
        Stop-Process -Id $backendPid -Force
        return
    }

    Save-Pids -BackendPid $backendPid -FrontendPid $frontendPid

    # Wait for health
    $healthUrl = "http://$localIP`:$backendPort/health"
    Write-Log "INFO" "Checking backend health at $healthUrl..."
    if (Wait-ForHealth -Url $healthUrl -MaxAttempts 30) {
        Write-Log "SUCCESS" "Backend is healthy"
    } else {
        Write-Log "WARNING" "Backend health check timed out (may still be starting)"
    }

    $frontendUrl = "http://$localIP`:$frontendPort"
    Write-Log "INFO" "Checking frontend at $frontendUrl..."
    if (Wait-ForHealth -Url $frontendUrl -MaxAttempts 15) {
        Write-Log "SUCCESS" "Frontend is ready"
    } else {
        Write-Log "WARNING" "Frontend check timed out (may still be starting)"
    }

    Write-Host ""
    Write-Log "SUCCESS" "=== Application Started ==="
    Write-Host "  Backend:  http://$localIP`:$backendPort"
    Write-Host "  Frontend: http://$localIP`:$frontendPort"
    Write-Host "  Docs:     http://$localIP`:$backendPort/docs"
    Write-Host ""
    Write-Log "INFO" "Press Ctrl+C to stop all services"

    # Register cleanup
    $null = Register-EngineEvent PowerShell.Exiting -Action {
        Stop-AllProcesses
    }

    # Keep script running
    try {
        while ($true) {
            Start-Sleep -Seconds 1
            if (-not (Get-Process -Id $backendPid -ErrorAction SilentlyContinue)) {
                Write-Log "ERROR" "Backend process died unexpectedly"
                break
            }
            if (-not (Get-Process -Id $frontendPid -ErrorAction SilentlyContinue)) {
                Write-Log "ERROR" "Frontend process died unexpectedly"
                break
            }
        }
    } finally {
        Stop-AllProcesses
    }
}

# Main execution
switch ($Command) {
    "start"   { Start-App }
    "stop"    { Stop-AllProcesses }
    "restart" { Stop-AllProcesses; Start-Sleep -Seconds 2; Start-App }
    default   {
        Write-Host "Usage: .\start_app.ps1 [start|stop|restart]"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  start   - Start backend and frontend services"
        Write-Host "  stop    - Stop all running services"
        Write-Host "  restart - Restart all services"
    }
}