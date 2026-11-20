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
  /* page d'accueil : projets récents, site, mise à jour */
  recent: () => ipcRenderer.invoke('recent:list'),                // -> [{path,name,dir,time}]
  openRecent: (p) => ipcRenderer.invoke('recent:open', p),        // -> {path,name,data}|null
  forgetRecent: (p) => ipcRenderer.invoke('recent:forget', p),
  openSite: () => ipcRenderer.send('link:site'),
  getUpdate: () => ipcRenderer.invoke('update:get'),              // -> {version,current,url,notes,native,state,percent,error}|null
  downloadUpdate: () => ipcRenderer.send('update:download'),     // Windows : télécharge la mise à jour sur place ; ailleurs : ouvre la page
  installUpdate: () => ipcRenderer.send('update:install'),       // redémarre l'appli et installe (quand state === 'ready')
  onUpdate: (fn) => on('update', fn),                             // {version,current,url,notes,native,state,percent,error}
  /* événements venant du menu / du système */
  onMenu: (fn) => on('menu', fn),            // 'new'|'open'|'save'|'saveAs'|'close-request'|'contact'
  onEdit: (fn) => on('edit', fn),            // 'copy'|'paste'|'selectAll' (menu Édition macOS)
  onOpenFile: (fn) => on('open-file', fn),   // {path,name,data}  (double-clic sur un .3di)
});
