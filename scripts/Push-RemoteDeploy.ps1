[CmdletBinding()]
param (
    [Parameter(Mandatory=$true)][string]$ServerIP,
    [Parameter(Mandatory=$true)][string]$Username,
    [Parameter(Mandatory=$true)][string]$Password,
    [ValidateSet("api", "ui", "both")]
    [string]$Target = "both"
)

# 1. Define Local Paths 
$LocalApiBuildPath = "D:\live work\WGNestPack\releases\api-build\*"
$LocalUiBuildPath  = "D:\live work\WGNestPack\releases\ui-build\*"
$LocalDeployScript = "D:\live work\WGNestPack\scripts\Deploy-WGNest.ps1"

# 2. Define Remote Paths 
$RemoteApiFolder = "G:\testpush\api2"
$RemoteUiFolder  = "G:\testpush\ui2"
$RemoteScriptDir = "C:\NESTAPP\backup"

Write-Host "`nInitiating Remote Deployment to $ServerIP..." -ForegroundColor Cyan

# 3. Create Secure Credentials
$SecurePassword = ConvertTo-SecureString $Password -AsPlainText -Force
$Creds = New-Object System.Management.Automation.PSCredential ($Username, $SecurePassword)

# 4. Handle Port splitting (if you pass IP:Port)
$TargetHost = $ServerIP
$WinRmPort = 5985 # Default WinRM HTTP Port

if ($ServerIP -match ":") {
    $parts = $ServerIP.Split(":")
    $TargetHost = $parts[0]
    $WinRmPort = $parts[1]
}

try {
    # 5. Establish a background connection to the server
    Write-Host "Connecting to $TargetHost on port $WinRmPort via WinRM..." -ForegroundColor Yellow
    $Session = New-PSSession -ComputerName $TargetHost -Port $WinRmPort -Credential $Creds -ErrorAction Stop

    # 6. Create remote directories if they don't exist
    Invoke-Command -Session $Session -ScriptBlock {
        param($apiDir, $uiDir, $scriptDir)
        if (!(Test-Path $apiDir)) { New-Item -ItemType Directory -Path $apiDir -Force | Out-Null }
        if (!(Test-Path $uiDir)) { New-Item -ItemType Directory -Path $uiDir -Force | Out-Null }
        if (!(Test-Path $scriptDir)) { New-Item -ItemType Directory -Path $scriptDir -Force | Out-Null }
    } -ArgumentList $RemoteApiFolder, $RemoteUiFolder, $RemoteScriptDir

    # 7. Transfer the Build Files and the Deployment Script
    Write-Host "Pushing files to server (This may take a minute)..." -ForegroundColor Yellow
    
    Copy-Item -Path $LocalDeployScript -Destination $RemoteScriptDir -ToSession $Session -Force
    
    if ($Target -in @("api", "both")) {
        Write-Host "   -> Transferring API files..."
        Copy-Item -Path $LocalApiBuildPath -Destination $RemoteApiFolder -ToSession $Session -Recurse -Force
    }
    if ($Target -in @("ui", "both")) {
        Write-Host "   -> Transferring UI files..."
        Copy-Item -Path $LocalUiBuildPath -Destination $RemoteUiFolder -ToSession $Session -Recurse -Force
    }

    Write-Host "Files successfully transferred to $TargetHost!" -ForegroundColor Green

} catch {
    Write-Host "Failed to connect or deploy to $TargetHost. Error: $_" -ForegroundColor Red
} finally {
    # 8. Clean up the session
    if ($Session) { Remove-PSSession -Session $Session }
}