import fs from 'fs';
import archiver from 'archiver';
import path from 'path';
import { execSync, exec } from 'child_process';

// ==========================================
// 1. CONFIGURATION (Update these for each app)
// ==========================================
const PROJECT_NAME    = 'WGNest'; 
const UI_DIR          = 'D:/live work/WGNestPack/WG-Nest-pack'; 
const API_DIR = 'D:/live work/Github/API/WGNestAPIGateway/WGNestAPIGateway';
const BASE_BACKUP_DIR = 'D:/live work/WGNestPack/backup';
const RELEASE_DIR     = 'D:/live work/WGNestPack/backup/releases';

// Get bump type from arguments: `node pipeline.js major` or default to minor
const bumpType = process.argv[2] === 'major' ? 'major' : 'minor';

// Generate Timestamp for zips (DDMMYYYY_HHMM)
const today = new Date();
const dateString = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}_${String(today.getHours()).padStart(2, '0')}${String(today.getMinutes()).padStart(2, '0')}`;

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================
function executeCommand(command, workingDir) {
    console.log(`\n⏳ Running: ${command} in ${workingDir}`);
    execSync(command, { cwd: workingDir, stdio: 'inherit' });
}

function bumpVersion(currentVersion, type) {
    // Handles versions like "1.12" or "1.12.0"
    let parts = currentVersion.split('.').map(Number);
    let major = parts[0] || 1;
    let minor = parts[1] || 0;
    
    if (type === 'major') { 
        major++; 
        minor = 0; 
    } else { 
        minor++; 
    }
    return `${major}.${minor}`;
}

async function createZip(sourcePath, outputPath, ignorePatterns, isDirectory = true) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve(outputPath));
        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        if (isDirectory) {
            // Zipping source code
            archive.glob('**/*', { cwd: sourcePath, ignore: ignorePatterns });
        } else {
            // Zipping specific build output folders into one release
            const uiDistPath = path.join(UI_DIR, 'dist');
            const apiDistPath = path.join(API_DIR, 'bin/Release/net8.0/publish');
            
            if (fs.existsSync(uiDistPath)) {
                archive.directory(uiDistPath, 'ui-build');
            } else {
                console.log(`⚠️ UI Dist folder not found at ${uiDistPath}`);
            }

            if (fs.existsSync(apiDistPath)) {
                archive.directory(apiDistPath, 'api-build'); 
            } else {
                console.log(`⚠️ API Publish folder not found at ${apiDistPath}`);
            }
        }

        archive.finalize();
    });
}

function cleanOldZips(directory, prefix) {
    if (!fs.existsSync(directory)) return;
    const files = fs.readdirSync(directory)
        .filter(file => file.startsWith(prefix) && file.endsWith('.zip'))
        .map(file => ({
            name: file,
            path: path.join(directory, file),
            time: fs.statSync(path.join(directory, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

    // Keep only the newest 10 files
    if (files.length > 10) {
        files.slice(10).forEach(file => {
            fs.unlinkSync(file.path);
            console.log(`🗑️ Deleted old backup (>10 limit reached): ${file.name}`);
        });
    }
}

// ==========================================
// 3. PIPELINE STAGES
// ==========================================
async function runPipeline() {
    try {
        console.log(`🚀 Starting ${PROJECT_NAME} CI/CD Pipeline...`);
        
        // --- STAGE 1: VERSION BUMPING ---
        console.log(`\n📦 [STAGE 1] Bumping ${bumpType} version...`);
        
        // UI Version (package.json)
        const uiPkgPath = path.join(UI_DIR, 'package.json');
        let newUiVersion = "1.0";
        if (fs.existsSync(uiPkgPath)) {
            const uiPkg = JSON.parse(fs.readFileSync(uiPkgPath, 'utf8'));
            newUiVersion = bumpVersion(uiPkg.version || "1.0", bumpType);
            uiPkg.version = newUiVersion;
            fs.writeFileSync(uiPkgPath, JSON.stringify(uiPkg, null, 2));
            console.log(`✅ UI version updated to: ${newUiVersion}`);
        } else {
            console.log(`⚠️ UI package.json not found at ${uiPkgPath}`);
        }

        // API Version (.csproj dynamically found)
        const apiFiles = fs.readdirSync(API_DIR).filter(fn => fn.endsWith('.csproj'));
        if (apiFiles.length > 0) {
            const apiProjPath = path.join(API_DIR, apiFiles[0]); // Grabs the first .csproj it finds
            let apiProjContent = fs.readFileSync(apiProjPath, 'utf8');
            const versionRegex = /<Version>(.*?)<\/Version>/;
            const match = apiProjContent.match(versionRegex);
            
            if (match) {
                let newApiVersion = bumpVersion(match[1], bumpType);
                apiProjContent = apiProjContent.replace(versionRegex, `<Version>${newApiVersion}</Version>`);
                fs.writeFileSync(apiProjPath, apiProjContent);
                console.log(`✅ API version updated to: ${newApiVersion} in ${apiFiles[0]}`);
            } else {
                console.log(`⚠️ No <Version> tag found in ${apiFiles[0]}. Please add it inside <PropertyGroup>.`);
            }
        } else {
            console.log(`⚠️ No .csproj file found in ${API_DIR}`);
        }

        // --- STAGE 2: SOURCE BACKUP ---
        console.log(`\n💾 [STAGE 2] Backing up original source files (Max 10)...`);
        [BASE_BACKUP_DIR, path.join(BASE_BACKUP_DIR, 'ui'), path.join(BASE_BACKUP_DIR, 'api')].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        console.log(`⏳ Zipping UI source...`);
        await createZip(UI_DIR, path.join(BASE_BACKUP_DIR, 'ui', `${PROJECT_NAME}-ui-src-${dateString}.zip`), ['**/node_modules/**', '**/dist/**', '**/.git/**']);
        cleanOldZips(path.join(BASE_BACKUP_DIR, 'ui'), `${PROJECT_NAME}-ui-src-`);

        console.log(`⏳ Zipping API source...`);
        await createZip(API_DIR, path.join(BASE_BACKUP_DIR, 'api', `${PROJECT_NAME}-api-src-${dateString}.zip`), ['**/bin/**', '**/obj/**', '**/.git/**']);
        cleanOldZips(path.join(BASE_BACKUP_DIR, 'api'), `${PROJECT_NAME}-api-src-`);
        
        console.log(`✅ Source code backed up successfully.`);

        // --- STAGE 3: BUILD ---
        console.log(`\n🔨 [STAGE 3] Building UI and API...`);
        executeCommand('pnpm run build', UI_DIR);
        executeCommand('dotnet publish -c Release', API_DIR);

        // --- STAGE 4: PACKAGE RELEASES ---
        console.log(`\n📦 [STAGE 4] Zipping build outputs...`);
        if (!fs.existsSync(RELEASE_DIR)) fs.mkdirSync(RELEASE_DIR, { recursive: true });
        
        const releaseZipName = `${PROJECT_NAME}-Release-v${newUiVersion}-${dateString}.zip`;
        const releaseZipPath = path.join(RELEASE_DIR, releaseZipName);
        
        await createZip(null, releaseZipPath, [], false);
        console.log(`✅ Release built and zipped: ${releaseZipName}`);

        // Clean up old release files as well (Keep max 10 releases)
        cleanOldZips(RELEASE_DIR, `${PROJECT_NAME}-Release-`);

        // --- STAGE 5: OPEN FOLDER ---
        console.log(`\n🎉 Pipeline Complete! Opening release folder...`);
        // Windows command to open file explorer
        exec(`explorer "${path.win32.normalize(RELEASE_DIR)}"`);

    } catch (error) {
        console.error(`\n❌ Pipeline Failed:`, error);
    }
}

runPipeline();