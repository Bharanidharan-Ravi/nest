import fs from 'fs';
import archiver from 'archiver';
import path from 'path';

// 1. Determine what to pack (defaults to 'both')
// Usage: `node pack.js`, `node pack.js api`, or `node pack.js ui`
const target = process.argv[2]?.toLowerCase() || 'both';

const backupDir = 'D:/live work/WGNestPack/backup/codemanual';

// 2. Configuration for paths and ignores
const config = {
    ui: {
        source: 'D:/live work/WGNestPack/WG-Nest-pack/src',
        ignore: ['**/node_modules/**', '**/bin/**', '**/obj/**', '**/.git/**']
    },
    api: {
        source: 'D:/live work/Github/API/WGNestAPIGateway',
        ignore: ['**/bin/**', '**/obj/**', '**/.git/**']
    }
};

// 3. Function to keep only the 5 most recent backups for the specific type
function cleanOldBackups(filePrefix) {
    const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith(`${filePrefix}-`) && file.endsWith('.zip'))
        .map(file => ({
            name: file,
            path: path.join(backupDir, file),
            time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

    if (files.length > 5) {
        files.slice(5).forEach(file => {
            fs.unlinkSync(file.path);
            console.log(`🗑️  Deleted old backup: ${file.name}`);
        });
    }
}

// 4. Create the single combined Archive
function createBackup() {
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const today = new Date();
    const dateString = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}`;
    
    // Name the file based on the target (e.g., wgnest-both-13042026.zip)
    const filePrefix = `wgnest`;
    const zipFileName = `${filePrefix}-${dateString}.zip`;
    const outputPath = path.join(backupDir, zipFileName);

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    console.log(`⏳ Zipping '${target.toUpperCase()}' started...`);

    output.on('close', () => {
        console.log(`✅ Backup complete! File saved as: ${zipFileName}`);
        console.log(`📦 Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        cleanOldBackups(filePrefix);
    });

    archive.on('error', (err) => { throw err; });
    archive.pipe(output);

    // If 'api' or 'both', add the API folder to the zip under the '/api' prefix
    if (target === 'api' || target === 'both') {
        console.log(` ├── Adding API files...`);
        archive.glob('**/*', {
            cwd: config.api.source,
            ignore: config.api.ignore
        }, { prefix: 'api' }); // Puts files inside an 'api/' folder in the zip
    }

    // If 'ui' or 'both', add the UI folder to the zip under the '/ui' prefix
    if (target === 'ui' || target === 'both') {
        console.log(` ├── Adding UI files...`);
        archive.glob('**/*', {
            cwd: config.ui.source,
            ignore: config.ui.ignore
        }, { prefix: 'ui' }); // Puts files inside a 'ui/' folder in the zip
    }

    archive.finalize();
}

// Run the script
createBackup();