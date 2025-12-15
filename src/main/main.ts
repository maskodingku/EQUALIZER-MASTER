import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { generateAPOConfig } from './configGenerator';
import fs from 'node:fs/promises';

// The built directory structure
//
// ├─┬─ dist
// │ └── index.html
// │
// ├─┬─ dist-electron
// │ ├── main.js
// │ └── preload.js
//
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
let tray: Tray | null = null
let isQuitting = false

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (win) {
            if (win.isMinimized()) win.restore()
            win.show()
            win.focus()
        }
    })
}

function createTray() {
    const iconPath = path.join(process.env.VITE_PUBLIC || '', 'icon.png') // Use icon.png
    // In production, use a proper .ico file for Windows
    const icon = nativeImage.createFromPath(iconPath)

    tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Equalizer Master',
            click: () => win?.show()
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true
                app.quit()
            }
        }
    ])

    tray.setToolTip('Equalizer Master')
    tray.setContextMenu(contextMenu)

    tray.on('double-click', () => {
        win?.show()
    })
}

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        width: 1200,
        height: 800,
        title: "Equalizer Master",
        // Hide menu bar by default for cleaner look
        autoHideMenuBar: true
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    // Handle Close to Tray
    win.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault()
            win?.hide()
            return false
        }
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // Use loadURL with file protocol to avoid "Not allowed to load local resource" issues with absolute paths
        // When packaged with "files": ["dist", "dist-electron"], structure is:
        // resources/app/dist/index.html
        // resources/app/dist-electron/main.js
        const indexPath = path.join(__dirname, '../dist/index.html')
        win.loadURL(pathToFileURL(indexPath).toString())
    }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    // Do nothing, keep app running in tray
    if (process.platform === 'darwin') {
        // app.quit() is default behavior we want to avoid for Tray app
    }
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.on('before-quit', () => {
    isQuitting = true
})

app.whenReady().then(() => {
    createWindow()
    createTray()

    // IPC Handlers for Presets
    const userDataPath = app.getPath('userData');
    const presetsFile = path.join(userDataPath, 'presets.json');

    ipcMain.handle('get-presets', async () => {
        try {
            const data = await fs.readFile(presetsFile, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // Return empty array if file doesn't exist
            return [];
        }
    });

    // --- Desktop Capturer Handler for System Audio ---
    ipcMain.handle('get-desktop-sources', async () => {
        const { desktopCapturer } = require('electron');
        try {
            // Get sources (screens/windows). We favor 'screen' to capture system audio.
            const sources = await desktopCapturer.getSources({ types: ['screen'] });
            return sources.map((source: Electron.DesktopCapturerSource) => ({
                id: source.id,
                name: source.name
            }));
        } catch (e) {
            console.error('Failed to get desktop sources:', e);
            return [];
        }
    });

    ipcMain.handle('save-preset', async (_, preset) => {
        try {
            let presets = [];
            try {
                const data = await fs.readFile(presetsFile, 'utf-8');
                presets = JSON.parse(data);
            } catch (e) {
                // File doesn't exist yet, start fresh
            }

            // Update if name exists, otherwise push
            // If ID matches, update; else if Name matches, update. Otherwise push.
            // Simplified: Filter by name for now
            const index = presets.findIndex((p: any) => p.name === preset.name);
            if (index >= 0) {
                presets[index] = preset;
            } else {
                presets.push(preset);
            }

            await fs.writeFile(presetsFile, JSON.stringify(presets, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Failed to save preset:', error);
            return { success: false, error };
        }
    });

    ipcMain.handle('delete-preset', async (_, presetName) => {
        try {
            const data = await fs.readFile(presetsFile, 'utf-8');
            let presets = JSON.parse(data);

            const initialLength = presets.length;
            presets = presets.filter((p: any) => p.name !== presetName);

            if (presets.length !== initialLength) {
                await fs.writeFile(presetsFile, JSON.stringify(presets, null, 2));
                return { success: true };
            }
            return { success: false, error: 'Preset not found' };
        } catch (error) {
            console.error('Failed to delete preset:', error);
            return { success: false, error };
        }
    });

    // Persistence: Last State
    const lastStateFile = path.join(userDataPath, 'last-state.json');

    ipcMain.handle('get-last-state', async () => {
        try {
            const data = await fs.readFile(lastStateFile, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    });

    ipcMain.handle('save-last-state', async (_, state) => {
        try {
            // Write asynchronously, don't block
            await fs.writeFile(lastStateFile, JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('Failed to save last state:', error);
        }
    });

    // --- Settings & Config Path Management ---
    // --- Settings & Config Path Management ---
    const settingsFile = path.join(userDataPath, 'settings.json');
    let currentConfigPath = ''; // Default empty

    // Load settings on startup (Async IIFE)
    (async () => {
        try {
            const settingsData = await fs.readFile(settingsFile, 'utf-8');
            const settings = JSON.parse(settingsData);
            if (settings.configPath) {
                currentConfigPath = settings.configPath;
            }
        } catch (e) {
            // No settings file yet
        }
    })();

    ipcMain.handle('select-config-file', async () => {
        if (!win) return null;

        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
            title: 'Select Equalizer Config File',
            properties: ['openFile', 'promptToCreate'], // promptToCreate doesnt really create in showOpenDialog, but useful hint
            filters: [
                { name: 'Text Files', extensions: ['txt'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!canceled && filePaths.length > 0) {
            currentConfigPath = filePaths[0];
            // Save to settings
            try {
                await fs.writeFile(settingsFile, JSON.stringify({ configPath: currentConfigPath }, null, 2));
            } catch (err) {
                console.error('Failed to save settings:', err);
            }
            return currentConfigPath;
        }
        return null;
    });

    ipcMain.handle('get-config-path', () => currentConfigPath);


    // --- Live EQ Update Handler ---

    let isWriting = false;
    let pendingData: any = null;

    ipcMain.on('update-live-eq', async (event, data) => {
        // If no config path selected, we cannot write.
        // Notify renderer that setup is needed? Renderer should check configPath state first.
        if (!currentConfigPath) {
            if (win && !win.isDestroyed()) {
                win.webContents.send('eq-sync-status', { status: 'error', error: 'No config file selected' });
            }
            return;
        }

        // Throttling Logic: If writing, save data as pending and write later
        if (isWriting) {
            pendingData = data;
            return;
        }

        const writeConfig = async (audioData: any, targetPath: string) => {
            isWriting = true;
            // Notify Renderer: Saving...
            if (win && !win.isDestroyed()) {
                win.webContents.send('eq-sync-status', { status: 'saving', filepath: targetPath });
            }

            try {
                const configString = generateAPOConfig(audioData);
                await fs.writeFile(targetPath, configString, 'utf-8');

                // Notify Renderer: Success
                if (win && !win.isDestroyed()) {
                    win.webContents.send('eq-sync-status', { status: 'synced', timestamp: Date.now(), filepath: targetPath });
                }
            } catch (err) {
                console.error('Failed to write EQ config:', err);
                // Notify Renderer: Error
                if (win && !win.isDestroyed()) {
                    win.webContents.send('eq-sync-status', { status: 'error', error: String(err) });
                }
            } finally {
                isWriting = false;
                // If there's pending data that came while we were writing, write it now
                if (pendingData) {
                    const nextData = pendingData;
                    pendingData = null;
                    // Check path again just in case changed mid-flight (edge case)
                    const nextPath = currentConfigPath;
                    if (nextPath) {
                        setImmediate(() => writeConfig(nextData, nextPath));
                    }
                }
            }
        };

        writeConfig(data, currentConfigPath);
    });
})
