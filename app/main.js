const electron = require('electron')

let
  mainWindow = null

const
  app = electron.app,
  BrowserWindow = electron.BrowserWindow,
  debuggingEnabled = false

const createWindow = () => {
  if (mainWindow === null) {
    // Creates a new window
    mainWindow = new BrowserWindow({
      width: 1080,
      height: 600
    })

    // Loads the the app
    mainWindow.loadURL(`file://${__dirname}/index.html`)

    // Opens the DevTools, when debugging is enabled
    if (debuggingEnabled) {
      mainWindow.webContents.openDevTools()
    }

    // Emitts when the window is closed.
    mainWindow.on('closed', function() {
      mainWindow = null
    })
  }
}

const quitApp = () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}

app.on('ready', createWindow)
app.on('activate', createWindow)
app.on('window-all-closed', quitApp)
