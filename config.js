// Réglages de l'appli de bureau — à modifier ici uniquement.
module.exports = {
  // Dépôt GitHub qui publie les installeurs (Releases)
  github: { owner: 'antoineboursier', repo: '3DInfinite' },
  // Site officiel
  site: 'https://3dinfinite.vercel.app/',
  // Où envoie le bouton « Télécharger » de la fenêtre de mise à jour, par système :
  //   'installer' = télécharge directement l'installeur depuis GitHub ; 'site' = ouvre la page de téléchargement du site.
  updateTarget: { win32: 'installer', darwin: 'site', linux: 'installer' },
};
