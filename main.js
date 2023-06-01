const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const url = require('url');
const { readFileSync } = require("fs");
const electron = require("electron");




const isMac = process.platform === 'darwin';

let mainWindow;
let progressInterval

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    minHeight: 600,
    minWidth: 700,
    show: false,
    icon: path.join(__dirname, '/assets/images/icon.png'),
    transparency: true,
    backgroundColor: "#00000000", // transparent hexadecimal or anything with transparency,
    vibrancy: "under-window", // in my case...
    visualEffectState: "followWindow",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      nativeWindowOpen: false
    }
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/src/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('ready-to-show', function () {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.openDevTools();

  /*** MENU ***/
  var menu = Menu.buildFromTemplate([
    {
      label: 'Main',
      submenu: [
        {
          label: 'StackBlitz',
          click: () => {
            shell.openExternal('https://stackblitz.com');
          },
          accelerator: 'CmdOrCtrl+Shift+C'
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    {
      label: 'Info',
      click: () => {

      }
    },
  ]);

  Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();

  }
});

app.on('before-quit', () => {
  clearInterval(progressInterval)
})

ipcMain.on("open-folder-triggered", (event) => {
  dialog
      .showOpenDialog(mainWindow, {
        properties: ["openDirectory"],
      })
      .then((result) => {
        const folderPath = result.filePaths[0];
        event.reply("folder-selected", folderPath);
      })
      .catch((err) => {
        console.error(err);
      });
});
