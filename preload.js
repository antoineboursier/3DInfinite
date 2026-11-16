// Pont sécurisé entre la page (app/index.html) et le processus principal.
const { contextBridge, ipcRenderer } = require('electron');
const on = (ch, fn) => { const h = (_e, ...a) => fn(...a); ipcRenderer.on(ch, h); return () => ipcRenderer.removeListener(ch, h); };
contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  info: () => ipcRenderer.invoke('app:info'),
  /* fichiers : data = Uint8Array */
  saveFile: (opts) => ipcRenderer.invoke('file:save', opts),     // {path?, name, data, kind:'project'|'stl'|'3mf'} -> {path,name}|null
  openFile: () => ipcRenderer.invoke('file:open'),               // -> {path,name,data}|null
  /* état du document */
  setDoc: (st) => ipcRenderer.send('doc:state', st),             // {dirty, path}
  confirmDiscard: (name) => ipcRenderer.invoke('doc:confirm', name), // 'save'|'discard'|'cancel'
  closeNow: () => ipcRenderer.send('app:close-now'),
  ready: () => ipcRenderer.send('app:ready'),
  /* contact : {name, email, message, attachments:[{name, data(base64)}]} -> {ok, error} */
  sendContact: (o) => ipcRenderer.invoke('contact:send', o),
  /* événements venant du menu / du système */
  onMenu: (fn) => on('menu', fn),            // 'new'|'open'|'save'|'saveAs'|'close-request'|'contact'
  onEdit: (fn) => on('edit', fn),            // 'copy'|'paste'|'selectAll' (menu Édition macOS)
  onOpenFile: (fn) => on('open-file', fn),   // {path,name,data}  (double-clic sur un .3di)
});
