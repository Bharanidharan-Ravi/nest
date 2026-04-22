import fs from 'fs';
import archiver from 'archiver';
import path from 'path';

// 1. Check if we are running 'api' or defaulting to 'ui'
// Usage: `node pack.js` (for UI) OR `node pack.js api` (for API)
const target = process.argv[2] === 'api' ? 'api' : 'ui';

// 2. Define the source folder based on the target
const sourceFolder = target === 'api' 
    ? 'D:/live work/Github/API/WGNestAPIGateway' // <-- Update this to your actual API folder path
    : 'D:/live work/WGNestPack/WG-Nest-pack/src';

const baseBackupDir = 'D:/live work/WGNestPack/backup';
const backupDir = path.join(baseBackupDir, target);

// 3. Generate Date String in DDMMYYYY format
const today = new Date();
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0');
const yyyy = today.getFullYear();
const dateString = `${dd}${mm}${yyyy}`; // e.g., 13042026

const zipFileName = `${target}-${dateString}.zip`; 
const outputPath = path.join(backupDir, zipFileName);

// 4. Function to keep only the 5 most recent backups
function cleanOldBackups() {
    // Read all files in the backup directory
    const files = fs.readdirSync(backupDir)
        // Filter only zip files that match the current target (ui or api)
        .filter(file => file.startsWith(`${target}-`) && file.endsWith('.zip'))
        .map(file => ({
            name: file,
            path: path.join(backupDir, file),
            // Get the creation/modification time to sort them
            time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
        }))
        // Sort from newest to oldest
        .sort((a, b) => b.time - a.time);

    // If there are more than 5, delete the older ones
    if (files.length > 5) {
        const filesToDelete = files.slice(5); // Get everything after the 5th file
        filesToDelete.forEach(file => {
            fs.unlinkSync(file.path);
            console.log(`🗑️ Deleted old backup: ${file.name}`);
        });
    }
}

// 5. Create the Archive
function createBackup() {
    // Ensure the backup folder exists
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.log(`✅ Backup complete! File saved as: ${zipFileName}`);
        console.log(`📦 Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        
        // Clean up old files AFTER the new one is successfully created
        cleanOldBackups();
    });

    archive.on('error', (err) => { throw err; });

    archive.pipe(output);

    // Set ignore patterns based on whether it's UI (node_modules) or API (.NET bin/obj)
    const ignorePatterns = target === 'api' 
        ? ['**/bin/**', '**/obj/**', '**/.git/**'] 
        : ['**/node_modules/**', '**/bin/**', '**/obj/**', '**/.git/**']; 

    archive.glob('**/*', {
        cwd: sourceFolder,
        ignore: ignorePatterns
    });

    archive.finalize();
    console.log(`⏳ Zipping ${target.toUpperCase()} started...`);
}

// Run the script
createBackup();