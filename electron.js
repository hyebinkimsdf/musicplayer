const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
  });

  win.loadURL("http://localhost:3000");
}

app.whenReady().then(createWindow);
