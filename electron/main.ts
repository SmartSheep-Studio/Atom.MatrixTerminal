import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "node:path";
import { installApp, MatrixApp, MatrixRelease, tasks } from "./library/installer";
import { launchApp } from "./library/launcher";

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, "../dist");
process.env.PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

function createWindow() {
  win = new BrowserWindow({
    title: "MatrixTerminal",
    autoHideMenuBar: true,
    icon: path.join(process.env.PUBLIC, "icon.png"),
    minWidth: 820,
    minHeight: 480,
    width: 1120,
    height: 640,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  ipcMain.handle("utils:select-folder", async (_event, title: string) => {
    return dialog.showOpenDialogSync(win as BrowserWindow, {
      title: title,
      properties: ["openDirectory", "createDirectory", "promptToCreate"],
    });
  });

  ipcMain.handle("tasks:list", (_event) => {
    return JSON.parse(JSON.stringify(tasks));
  });

  ipcMain.on(
    "tasks:install-app",
    (_event, workdir: string, app: MatrixApp, option: MatrixRelease) => {
      installApp(workdir, win as BrowserWindow, app, option);
    }
  );

  ipcMain.on("tasks:launch-app", (_event, option: any, run: any) => {
    launchApp(option, run);
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
}

app.on("window-all-closed", () => {
  win = null;
});

app.whenReady().then(createWindow);
