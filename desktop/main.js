const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || (app && !app.isPackaged);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true, // Optional: Hide the menu bar for a cleaner look
    });

    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../out/index.html')}`;

    mainWindow.loadURL(startUrl);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // Handle static file protocol for production build if needed
    // In Next.js static export 'out' folder, next converts /image.png to file:///.../out/image.png
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

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

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('IPC read-data error:', error);
        return null; // Return null on error
    }
});

ipcMain.handle('save-data', async (event, { key, data }) => {
    try {
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, "");
        const filePath = path.join(DATA_DIR, `${sanitizedKey}.json`);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('IPC save-data error:', error);
        return { error: error.message };
    }
});
