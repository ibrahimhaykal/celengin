// Creates a "Celengin" shortcut on the Windows desktop that opens the app directly
// (no terminal, no browser). Run once, and again after the icon changes: npm run app:shortcut
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const electron = require('electron');

const root = path.resolve(__dirname, '..');
const q = (s) => s.replace(/'/g, "''"); // PowerShell single-quote escaping

// Windows caches shortcut icons by file path, so a changed icon.ico at the same path keeps showing the old
// picture. Point the shortcut at a copy named after the icon's content instead, and drop older copies.
const source = path.join(__dirname, 'icon.ico');
const hash = crypto.createHash('sha1').update(fs.readFileSync(source)).digest('hex').slice(0, 8);
const icon = path.join(__dirname, `shortcut-${hash}.ico`);
for (const f of fs.readdirSync(__dirname)) {
  if (/^shortcut-[0-9a-f]{8}\.ico$/.test(f) && f !== path.basename(icon)) fs.rmSync(path.join(__dirname, f));
}
fs.copyFileSync(source, icon);

const ps = `
$desktop = [Environment]::GetFolderPath('Desktop')
# The app used to be called Financial Command Center; drop that old shortcut.
Remove-Item -LiteralPath (Join-Path $desktop 'Financial Command Center.lnk') -ErrorAction SilentlyContinue
$lnk = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $desktop 'Celengin.lnk'))
$lnk.TargetPath = '${q(electron)}'
$lnk.Arguments = '"${q(root)}"'
$lnk.WorkingDirectory = '${q(root)}'
$lnk.IconLocation = '${q(icon)},0'
$lnk.Description = 'Celengin - celengin dikit-dikit, lama-lama jadi bukit'
$lnk.Save()
# Ask Explorer to refresh its icon cache so the new picture shows right away.
Start-Process -FilePath "$env:SystemRoot\\System32\\ie4uinit.exe" -ArgumentList '-show' -WindowStyle Hidden -ErrorAction SilentlyContinue
Write-Output ('Shortcut dibuat: ' + $lnk.FullName)
`;
console.log(execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' }).trim());
