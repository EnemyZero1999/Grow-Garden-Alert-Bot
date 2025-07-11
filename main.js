// main.js
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { runBot, stopBot } from './bot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 750,
    webPreferences: {
      nodeIntegration: true,  // Needed for require() in renderer
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 🧠 Config Load Handler
ipcMain.handle('get-config', async () => {
  try {
    const data = fs.readFileSync('./config.json', 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error("❌ Failed to read config:", e.message);
    return {};
  }
});

// 💾 Save Config
ipcMain.on('save-config', (event, updatedConfig) => {
  try {
    fs.writeFileSync('./config.json', JSON.stringify(updatedConfig, null, 2), 'utf-8');
    console.log("✅ Config saved.");
  } catch (e) {
    console.error("❌ Failed to write config:", e.message);
  }
});

// 🚀 Start Bot
ipcMain.on('start-bot', () => {
  runBot();
});

// ⛔ Stop Bot
ipcMain.on('stop-bot', () => {
  stopBot();
});
