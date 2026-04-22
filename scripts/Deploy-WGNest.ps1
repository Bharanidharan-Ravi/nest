[CmdletBinding()]
param (
    # Added "both" as an option, and made it the default behavior!
    [ValidateSet("api", "ui", "both")]
    [string]$Target = "both"
)

Import-Module WebAdministration
$ErrorActionPreference = "Stop"

# ---------------------------------------------------------
# The Core Deployment Logic (Runs once per target)
# ---------------------------------------------------------
function Invoke-Deployment {
    param ([string]$Type)

    # 1. Set paths dynamically based on the current type
    switch ($Type) {
        "api" {
            $siteName       = "TimesheetAPI"                    
            $appPoolName    = "TimesheetAPI"                    
            $liveFolder     = "D:\Deployment files\wgnest\API" 
            $newBuildFolder = "D:\Deployment files\Backup\New\api"   
            $backupFolder   = "D:\Deployment files\Backup\Old\api"       
        }
        "ui" {
            $siteName       = "TimesheeUI"                     
            $appPoolName    = "TimesheeUI"                     
            $liveFolder     = "D:\Deployment files\wgnest\UI"  
            $newBuildFolder = "D:\Deployment files\Backup\New\ui"    
            $backupFolder   = "D:\Deployment files\Backup\Old\ui"        
        }
    }

   Write-Host "`n=======================================================" -ForegroundColor Magenta
    Write-Host "STARTING DEPLOYMENT FOR: $($Type.ToUpper())" -ForegroundColor Magenta
    Write-Host "=======================================================" -ForegroundColor Magenta

    try {
        # 2. Stop IIS
        Write-Host "Stopping $($Type) IIS Site and App Pool..." -ForegroundColor Yellow
        Stop-WebSite -Name $siteName -ErrorAction SilentlyContinue
        Stop-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2

        # 3. Create Backup of the Old Build
        if (!(Test-Path -Path $backupFolder)) { New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null }
        
        $timestamp = Get-Date -Format "ddMMyyyy_HHmm"
        $backupZip = Join-Path $backupFolder "$Type`_build_$timestamp.zip"

        if (Test-Path "$liveFolder\*") {
            Write-Host "Backing up current $($Type) live files..." -ForegroundColor Cyan
            Compress-Archive -Path "$liveFolder\*" -DestinationPath $backupZip -Force
        } else {
            Write-Host "Live folder is empty. Skipping backup." -ForegroundColor Yellow
        }

        # 4. Clean up old backups (Keep only latest 5)
        $oldBackups = Get-ChildItem -Path $backupFolder -Filter "*.zip" | Sort-Object CreationTime -Descending
        if ($oldBackups.Count -gt 5) {
            $backupsToDelete = $oldBackups | Select-Object -Skip 5
            foreach ($file in $backupsToDelete) {
                Remove-Item $file.FullName -Force
                Write-Host "Deleted old $($Type) backup: $($file.Name)" -ForegroundColor DarkGray
            }
        }

        # ---------------------------------------------------------
        # 5. Replace with the New Build (Safe Method)
        # ---------------------------------------------------------
        
        # A. Create a temporary folder to hold precious files
        $tempPreserveFolder = Join-Path $env:TEMP "WGNest_$Type_Preserve"
        if (Test-Path $tempPreserveFolder) { Remove-Item $tempPreserveFolder -Recurse -Force }
        New-Item -ItemType Directory -Path $tempPreserveFolder -Force | Out-Null

        Write-Host "Securing live config and logs..." -ForegroundColor Cyan
        
        # B. Define what you want to save dynamically based on UI or API
        if ($Type -eq "api") {
            $itemsToKeep = @("appsettings.json", "appsettings.Production.json", "web.config", "logs", "Uploads")
        } else {
            $itemsToKeep = @("web.config", "config.json")
        }
        
        foreach ($item in $itemsToKeep) {
            $liveItemPath = Join-Path $liveFolder $item
            if (Test-Path $liveItemPath) {
                Copy-Item -Path $liveItemPath -Destination $tempPreserveFolder -Recurse -Force
            }
        }

        # C. Wipe the live folder clean
        Write-Host "Deleting old files from live folder..." -ForegroundColor Cyan
        Remove-Item -Path "$liveFolder\*" -Recurse -Force -ErrorAction SilentlyContinue

        # D. Copy the new build in
        Write-Host "Copying new $($Type) build into live folder..." -ForegroundColor Green
        Copy-Item -Path "$newBuildFolder\*" -Destination $liveFolder -Recurse -Force

        # E. Restore the live configs and logs, overwriting the new build's configs
        Write-Host "Restoring live config and logs..." -ForegroundColor Cyan
        Copy-Item -Path "$tempPreserveFolder\*" -Destination $liveFolder -Recurse -Force

        # F. Clean up the temp folder
        Remove-Item $tempPreserveFolder -Recurse -Force

    }
    catch {
        Write-Host "An ERROR occurred deploying $($Type): $_" -ForegroundColor Red
        Write-Host "Restarting IIS to minimize downtime..." -ForegroundColor Yellow
    }
    finally {
        # 6. Start IIS Back Up
        Write-Host "Starting $($Type) IIS Site and App Pool..." -ForegroundColor Yellow
        Start-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
        Start-WebSite -Name $siteName -ErrorAction SilentlyContinue

        Write-Host "$($Type.ToUpper()) Deployment Complete!" -ForegroundColor Green
    }
}

# ---------------------------------------------------------
# Execution Block: Decide what to run
# ---------------------------------------------------------
if ($Target -eq "both") {
    Invoke-Deployment -Type "api"
    Invoke-Deployment -Type "ui"
} else {
    Invoke-Deployment -Type $Target
}

Write-Host "`nALL REQUESTED DEPLOYMENTS FINISHED SUCCESSFULLY!" -ForegroundColor Green