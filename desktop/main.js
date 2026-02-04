const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const fsPromises = require('fs').promises;
const { autoUpdater } = require('electron-updater');

const isDev = process.env.NODE_ENV === 'development' || (app && !app.isPackaged);

let mainWindow;

// Mime types map for static server
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

function createWindow(startUrl) {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // Don't show until ready-to-show to prevent focus flickers
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            spellcheck: false,
        },
        autoHideMenuBar: false,
    });

    mainWindow.loadURL(startUrl);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    // Set standard application menu for keyboard shortcuts (Copy, Paste, etc.)
    const template = [
        {
            label: 'Düzen',
            submenu: [
                { label: 'Geri Al', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: 'İleri Al', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                { type: 'separator' },
                { label: 'Kes', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: 'Kopyala', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: 'Yapıştır', accelerator: 'CmdOrCtrl+V', role: 'paste' },
                { label: 'Tümünü Seç', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
            ]
        },
        {
            label: 'Görünüm',
            submenu: [
                { label: 'Yeniden Yükle', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                { label: 'Tam Ekran', accelerator: 'F11', role: 'togglefullscreen' },
                { type: 'separator' },
                { label: 'Geliştirici Araçları', accelerator: 'F12', role: 'toggleDevTools' }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    // Explicitly set for the window on Windows
    if (mainWindow) mainWindow.setMenu(menu);

    if (isDev) {
        createWindow('http://localhost:3000');
    } else {
        // Production: Serve 'out' directory via internal HTTP server
        const serveDir = path.join(__dirname, '../out');
        const server = http.createServer((req, res) => {
            let safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
            if (safePath.includes('?')) safePath = safePath.split('?')[0];

            let fullPath = path.join(serveDir, safePath);
            let stat = null;
            let foundPath = null;

            // Strategy:
            // 1. If URL doesn't end in slash, try .html file FIRST (Next.js Clean URLs)
            // 2. Try exact path (File or Directory)
            // 3. Fallback to index.html (SPA)

            // Check 1: Try .html extension (PRIORITY for /members -> members.html)
            if (!safePath.endsWith('/') && !safePath.endsWith('\\')) {
                try {
                    const htmlPath = fullPath + '.html';
                    const s = fs.statSync(htmlPath);
                    if (s.isFile()) {
                        stat = s;
                        foundPath = htmlPath;
                    }
                } catch (e) { /* Not a .html file */ }
            }

            // Check 2: Try exact path if not found yet
            if (!foundPath) {
                try {
                    const s = fs.statSync(fullPath);
                    if (s.isFile()) {
                        stat = s;
                        foundPath = fullPath;
                    } else if (s.isDirectory()) {
                        // If directory, look for index.html
                        const indexPath = path.join(fullPath, 'index.html');
                        try {
                            const indexStat = fs.statSync(indexPath);
                            if (indexStat.isFile()) {
                                stat = indexStat;
                                foundPath = indexPath;
                            }
                        } catch (e) { /* Directory exists but no index.html */ }
                    }
                } catch (e) { /* Path doesn't exist */ }
            }

            // Check 3: SPA Fallback (index.html) if still nothing found
            if (!foundPath) {
                const rootIndex = path.join(serveDir, 'index.html');
                try {
                    stat = fs.statSync(rootIndex);
                    foundPath = rootIndex;
                } catch (e) {
                    res.statusCode = 404;
                    res.end('404 Not Found (and root index.html missing)');
                    return;
                }
            }

            // Serve the found file
            const ext = path.extname(foundPath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(foundPath).pipe(res);
        });

        // Listen on random available port
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            createWindow(`http://127.0.0.1:${port}`);
        });
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            // Re-creation logic ignored
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- Debugging ---
process.on('uncaughtException', (error) => {
    console.error('CRITICAL: Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

if (isDev) {
    app.commandLine.appendSwitch('enable-logging');
    app.commandLine.appendSwitch('v', '1');
}

// --- IPC Handlers for File Storage ---

// Ensure data directory exists
const DATA_DIR = isDev
    ? path.join(__dirname, '../data')
    : path.join(app.getPath('userData'), 'data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

ipcMain.handle('read-data', async (event, key) => {
    try {
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, "");
        const filePath = path.join(DATA_DIR, `${sanitizedKey}.json`);

        try {
            await fsPromises.access(filePath);
        } catch {
            return null;
        }

        const data = await fsPromises.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('IPC read-data error:', error);
        return null;
    }
});

ipcMain.handle('save-data', async (event, { key, data }) => {
    try {
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, "");
        const filePath = path.join(DATA_DIR, `${sanitizedKey}.json`);

        await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('IPC save-data error:', error);
        return { error: error.message };
    }
});

// --- Auto-Updater Logic ---

// Configure autoUpdater
autoUpdater.autoDownload = false; // We want manual control from the UI
autoUpdater.autoInstallOnAppQuit = true;

// Logging for updates (visible in terminal/dev-tools if needed)
autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update-status', 'checking');
});

autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-status', 'available', info);
});

autoUpdater.on('update-not-available', (info) => {
    mainWindow?.webContents.send('update-status', 'not-available', info);
});

autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update-status', 'error', err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('update-progress', progressObj.percent);
});

autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-status', 'ready', info);
});

// Update IPC Handlers
ipcMain.handle('check-for-update', async () => {
    if (isDev) {
        // Mock checking for dev environment
        return { success: true, message: "Dev mode: Update check skipped" };
    }
    try {
        const result = await autoUpdater.checkForUpdates();
        return result;
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('start-download', async () => {
    try {
        await autoUpdater.downloadUpdate();
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall();
});
