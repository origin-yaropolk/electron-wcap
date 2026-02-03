throw new Error(`electron-wcap uses different code for the main and renderer processes:

In the Electron main process you should import 'electron-wcap/main'
In the Electron preload you should import 'electron-wcap/preload'

`);

export {};
