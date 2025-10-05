const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");
const os = require("os");

// Keep a global reference of the window object, if you don't, the window will
// be closed automa`tically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    nodeIntegration: true,
    webPreferences: {
      nodeIntegration: true, // to allow require
      contextIsolation: true, // 보안을 위해 활성화
      preload: path.join(__dirname, "preload.js"),
    },
    frame: false,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  // Open the DevTools. (주석 처리)
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  app.quit();
});

app.on("activate", function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC 핸들러 - 이미지 저장
ipcMain.handle("save-image", async (event, imageData) => {
  try {
    // 바탕화면 경로 가져오기
    const desktopPath = app.getPath("desktop");
    //맥북인 경우 path.join(os.homedir(), "Desktop");

    // 파일명 생성 (현재 시간 기반)
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `4cut-photo-${timestamp}.png`;
    const filePath = path.join(desktopPath, fileName);

    // Base64 데이터를 Buffer로 변환
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // 파일 저장
    await fs.promises.writeFile(filePath, imageBuffer);

    return { success: true, filePath };
  } catch (error) {
    console.error("이미지 저장 실패:", error);
    return { success: false, error: error.message };
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
