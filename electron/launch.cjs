// Starts the desktop app. Terminals opened from VS Code inherit ELECTRON_RUN_AS_NODE=1, which makes
// Electron behave like plain Node (no window), so it is removed before launching.
const { spawn } = require('node:child_process');
const path = require('node:path');
const electron = require('electron'); // from Node this resolves to the path of electron.exe

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electron, [path.resolve(__dirname, '..'), ...process.argv.slice(2)], { env, stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
