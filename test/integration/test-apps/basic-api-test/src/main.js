const path = require('path');

const { app, BrowserWindow } = require('electron');
const { createApiProvider } = require('electron-wcap/main');
const { createTestClient } = require('../../../client.js');

app.on('ready', async() => {
  const mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  await mainWindow.loadFile(path.join(__dirname, 'index.html'));

  const apiProvider = createApiProvider(mainWindow.webContents, 'TestApi');

  const testClient = createTestClient(8081);

  await testClient.post(await apiProvider.add(4, 5));
});
