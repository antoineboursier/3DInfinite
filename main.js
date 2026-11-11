// 3DInfinite — processus principal Electron : fenêtre, menus, fichiers .3di, vérification de mise à jour.
const { app, BrowserWindow, Menu, dialog, ipcMain, shell, net } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const cfg = require('./config');

const isMac = process.platform === 'darwin';
let win = null, rendererReady = false, pendingFile = null, dirty = false, forceClose = false, lastDir = null;
const fr = () => (app.getLocale() || 'fr').toLowerCase().startsWith('fr');
const t = (f, e) => (fr() ? f : e);
const isProject = (p) => /\.3di$/i.test(p || '');

app.setAppUserModelId('fr.antoineboursier.3dinfinite');

/* ---------- une seule fenêtre ; un double-clic sur un .3di l'ouvre dans l'appli déjà lancée ---------- */
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', (_e, argv) => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
    const f = argv.find(isProject); if (f) queueOpen(f);
  });
}
app.on('open-file', (e, p) => { e.preventDefault(); queueOpen(p); });   // macOS

async function queueOpen(p) {
  if (!rendererReady || !win) { pendingFile = p; return; }
  try {
    const data = await fs.readFile(p);
    app.addRecentDocument(p);
    win.webContents.send('open-file', { path: p, name: path.basename(p), data: new Uint8Array(data) });
  } catch (e) { dialog.showErrorBox('3DInfinite', t('Impossible de lire ce fichier.', 'Could not read this file.')); }
}

/* ---------- fenêtre ---------- */
function createWindow() {
  rendererReady = false;
  win = new BrowserWindow({
    width: 1480, height: 920, minWidth: 1100, minHeight: 680, show: false, title: '3DInfinite',
    backgroundColor: '#0c0a22', autoHideMenuBar: true, icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.once('ready-to-show', () => { win.show(); setTimeout(() => checkForUpdates(false), 4000); });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); if (/^https:\/\//.test(url)) shell.openExternal(url); } });
  win.on('close', (e) => {
    if (forceClose || !dirty) return;
    e.preventDefault();
    win.webContents.send('menu', 'close-request');     // la page propose d'enregistrer, puis demande la fermeture
  });
  win.on('closed', () => { win = null; rendererReady = false; forceClose = false; dirty = false; });
}

/* ---------- menus ---------- */
function buildMenu() {
  const send = (cmd) => () => win && win.webContents.send('menu', cmd);
  const file = [
    { label: t('Nouveau projet', 'New project'), accelerator: 'CmdOrCtrl+N', click: send('new') },
    { label: t('Ouvrir…', 'Open…'), accelerator: 'CmdOrCtrl+O', click: send('open') },
    { type: 'separator' },
    { label: t('Enregistrer', 'Save'), accelerator: 'CmdOrCtrl+S', click: send('save') },
    { label: t('Enregistrer sous…', 'Save as…'), accelerator: 'CmdOrCtrl+Shift+S', click: send('saveAs') },
    ...(isMac ? [] : [{ type: 'separator' }, { role: 'quit', label: t('Quitter', 'Quit') }]),
  ];
  // Édition (macOS seulement : sans elle, copier/coller ne marchent pas dans les champs de texte).
  // Dans un champ → action native ; sinon → la page copie/colle les objets de la scène.
  const edit = (label, accelerator, cmd, fn) => ({
    label, accelerator, click: async () => {
      if (!win) return; const wc = win.webContents;
      const editing = await wc.executeJavaScript("(()=>{const a=document.activeElement;return !!a&&(/^(INPUT|TEXTAREA)$/.test(a.tagName)||a.isContentEditable)})()");
      if (editing) wc[fn](); else if (cmd) wc.send('edit', cmd);
    },
  });
  const help = { label: t('Aide', 'Help'), submenu: [
    { label: t('Rechercher des mises à jour…', 'Check for updates…'), click: () => checkForUpdates(true) },
    { label: t('Page du projet', 'Project page'), click: () => shell.openExternal(`https://github.com/${cfg.github.owner}/${cfg.github.repo}`) },
    ...(isMac ? [] : [{ type: 'separator' }, { label: t('À propos de 3DInfinite', 'About 3DInfinite'), click: () =>
      dialog.showMessageBox(win, { type: 'info', title: '3DInfinite', message: '3DInfinite', detail: t('Version ', 'Version ') + app.getVersion(), icon: path.join(__dirname, 'build', 'icon.png') }) }]),
  ] };
  const view = { label: t('Affichage', 'View'), submenu: [{ role: 'togglefullscreen', label: t('Plein écran', 'Full screen') },
    ...(app.isPackaged ? [] : [{ role: 'toggleDevTools' }, { role: 'reload' }])] };
  const tpl = isMac
    ? [{ role: 'appMenu' }, { label: t('Fichier', 'File'), submenu: file },
       { label: t('Édition', 'Edit'), submenu: [edit(t('Couper', 'Cut'), 'Cmd+X', null, 'cut'), edit(t('Copier', 'Copy'), 'Cmd+C', 'copy', 'copy'),
         edit(t('Coller', 'Paste'), 'Cmd+V', 'paste', 'paste'), edit(t('Tout sélectionner', 'Select all'), 'Cmd+A', 'selectAll', 'selectAll')] },
       view, { role: 'windowMenu' }, help]
    : [{ label: t('Fichier', 'File'), submenu: file }, view, help];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

/* ---------- fichiers ---------- */
const FILTERS = {
  project: [{ name: t('Projet 3DInfinite', '3DInfinite project'), extensions: ['3di'] }],
  stl: [{ name: 'STL', extensions: ['stl'] }],
  '3mf': [{ name: '3MF', extensions: ['3mf'] }],
};
ipcMain.handle('app:info', () => ({ version: app.getVersion(), platform: process.platform }));
ipcMain.handle('file:save', async (_e, o) => {
  try {
    let p = o.path;
    if (!p) {
      const r = await dialog.showSaveDialog(win, { defaultPath: path.join(lastDir || app.getPath('documents'), o.name), filters: FILTERS[o.kind] || FILTERS.project });
      if (r.canceled || !r.filePath) return null;
      p = r.filePath;
      const ext = '.' + (FILTERS[o.kind] || FILTERS.project)[0].extensions[0];
      if (!path.extname(p)) p += ext;
    }
    await fs.writeFile(p, Buffer.from(o.data));
    lastDir = path.dirname(p);
    if (o.kind === 'project') app.addRecentDocument(p);
    return { path: p, name: path.basename(p) };
  } catch (e) {
    dialog.showErrorBox('3DInfinite', t("L'enregistrement a échoué : ", 'Saving failed: ') + (e.message || e));
    return null;
  }
});
ipcMain.handle('file:open', async () => {
  const r = await dialog.showOpenDialog(win, { defaultPath: lastDir || app.getPath('documents'), properties: ['openFile'],
    filters: [{ name: t('Projet 3DInfinite', '3DInfinite project'), extensions: ['3di', 'json'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  try {
    const p = r.filePaths[0]; lastDir = path.dirname(p); app.addRecentDocument(p);
    return { path: p, name: path.basename(p), data: new Uint8Array(await fs.readFile(p)) };
  } catch (e) { dialog.showErrorBox('3DInfinite', t('Impossible de lire ce fichier.', 'Could not read this file.')); return null; }
});
ipcMain.on('doc:state', (_e, st) => {
  dirty = !!st.dirty;
  if (win && isMac) { win.setDocumentEdited(dirty); win.setRepresentedFilename(st.path || ''); }
});
ipcMain.handle('doc:confirm', async (_e, name) => {
  const r = await dialog.showMessageBox(win, { type: 'question', defaultId: 0, cancelId: 2, noLink: true,
    buttons: [t('Enregistrer', 'Save'), t('Ne pas enregistrer', "Don't save"), t('Annuler', 'Cancel')],
    message: t(`Enregistrer les modifications de « ${name} » ?`, `Save changes to “${name}”?`),
    detail: t('Sans enregistrement, elles seront perdues.', 'Your changes will be lost if you don’t save.') });
  return ['save', 'discard', 'cancel'][r.response];
});
ipcMain.on('app:close-now', () => { forceClose = true; if (win) win.close(); });
ipcMain.on('app:ready', () => {
  rendererReady = true;
  const f = pendingFile || process.argv.find(isProject); pendingFile = null;
  if (f) queueOpen(f);
});

/* ---------- mise à jour : « Version X disponible : télécharger ? » ---------- */
const parseVer = (v) => String(v).replace(/^v/i, '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
function newer(a, b) { const x = parseVer(a), y = parseVer(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; }
function pickAsset(assets) {
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  const ok = process.platform === 'win32' ? (a) => /\.exe$/i.test(a.name)
    : isMac ? (a) => /\.dmg$/i.test(a.name) && a.name.includes(arch)
    : (a) => /\.AppImage$/i.test(a.name);
  return assets.find(ok);
}
let checking = false;
async function checkForUpdates(manual) {
  if (checking || !win) return;
  if (!manual && !app.isPackaged && !process.env.DI_CHECK_UPDATE) return;
  checking = true;
  try {
    const { owner, repo } = cfg.github;
    const res = await net.fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': '3DInfinite' } });
    if (!res.ok) throw new Error('GitHub ' + res.status);
    const rel = await res.json();
    const latest = String(rel.tag_name || '').replace(/^v/i, '');
    if (latest && newer(latest, app.getVersion())) {
      const asset = pickAsset(rel.assets || []);
      const url = cfg.downloadPage || (asset && asset.browser_download_url) || rel.html_url;
      const r = await dialog.showMessageBox(win, { type: 'info', defaultId: 0, cancelId: 1, noLink: true, title: '3DInfinite',
        buttons: [t('Télécharger', 'Download'), t('Plus tard', 'Later')],
        message: t(`Mise à jour disponible : 3DInfinite ${latest}`, `Update available: 3DInfinite ${latest}`),
        detail: t(`Vous utilisez la version ${app.getVersion()}. Télécharger la nouvelle version ?`, `You are using version ${app.getVersion()}. Download the new version?`) });
      if (r.response === 0) shell.openExternal(url);
    } else if (manual) {
      dialog.showMessageBox(win, { type: 'info', title: '3DInfinite', message: t('Vous utilisez la dernière version.', 'You are up to date.'), detail: 'v' + app.getVersion() });
    }
  } catch (e) {
    if (manual) dialog.showMessageBox(win, { type: 'warning', title: '3DInfinite', message: t('Impossible de vérifier les mises à jour.', 'Could not check for updates.'), detail: t('Vérifiez votre connexion internet.', 'Check your internet connection.') });
  } finally { checking = false; }
}

app.whenReady().then(() => {
  app.setAboutPanelOptions({ applicationName: '3DInfinite', applicationVersion: app.getVersion() });
  buildMenu(); createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (!isMac) app.quit(); });
