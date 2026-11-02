import { useEffect, useState } from 'react';

// L'événement peut arriver avant le montage de React : on le capture au chargement du module.
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

/** Gère l'installation de la PWA (Android/desktop via l'invite native, iOS via instructions). */
export default function usePwaInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);

  const installed = isStandalone();
  return {
    installed,
    canInstall: !installed && Boolean(deferredPrompt),
    iosHint: !installed && isIos(),
    install: async () => {
      if (!deferredPrompt) return false;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      notify();
      return outcome === 'accepted';
    },
  };
}
