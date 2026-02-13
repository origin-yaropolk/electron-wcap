import { app, BrowserWindow } from "electron";

import { join as pathJoin } from 'path';
import { createApiProvider } from "electron-wcap/main";
import { ThemeSwitcherApi } from "./public/theme-switcher-api";
import { MenuItem } from "electron/main";

function makeAwaiter(): [Promise<void>, (value: void | PromiseLike<void>) => void, (reason?: any) => void] {
	var resolver: ((value: void | PromiseLike<void>) => void) | null = null;
	var rejecter: ((reason?: any) => void) | null = null;

	const awaiter = new Promise<void>((resolve, reject) => {
		resolver = resolve;
		rejecter = reject;
	});

	if (resolver !== null && rejecter !== null) {
		return [awaiter, resolver, rejecter]
	}

	throw Error('should not be executed');
}

function onThemeSwitchedCb(oldTheme: 'dark' | 'light', newTheme: 'dark' | 'light'): void {
	console.log(`Theme switched - was ${oldTheme}, now ${newTheme}`)
}

async function startApp(): Promise<void> {
	const window = await createWindow('http://localhost:8080/');

	const apiProvider = createApiProvider<ThemeSwitcherApi>(window.webContents, 'ThemeSwitcher');

	apiProvider.onThemeSwitched(onThemeSwitchedCb);

	app.applicationMenu?.items[2].submenu?.append(new MenuItem({
		label: 'Switch theme',
		click: () => {
			apiProvider.currentTheme().then(currentTheme => {
				if (currentTheme === 'light') {
					apiProvider.switchTheme('dark');
				} else {
					apiProvider.switchTheme('light');
				}
			})
		}
	}))
}

async function createWindow(url: string): Promise<BrowserWindow> {
	const preloadPath = pathJoin(app.getAppPath(), 'preload.js');

	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			sandbox: false,
			preload: preloadPath,
			devTools: true,
		},
	});

	const [domReady, domReadyResolver] = makeAwaiter()

	mainWindow.webContents.on('dom-ready', () => {
		domReadyResolver();
	});

	await mainWindow.loadURL(url);

	await domReady;

	return mainWindow;
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
})

app.on('ready', () => {
	setTimeout(async () => {
		startApp();
	}, 1000);
})
