// Enregistre le service worker en production uniquement (en développement il gênerait le rechargement à chaud).
export function register({ onUpdate } = {}) {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

  const start = () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .then((registration) => {
        registration.onupdatefound = () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.onstatechange = () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              onUpdate?.(registration);
            }
          };
        };
      })
      .catch((err) => console.error("Échec de l'enregistrement du service worker :", err));
  };

  // L'événement « load » peut être déjà passé quand ce code s'exécute.
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

/** Active immédiatement la nouvelle version puis recharge la page. */
export function applyUpdate(registration) {
  const waiting = registration?.waiting;
  if (!waiting) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
  waiting.postMessage({ type: 'SKIP_WAITING' });
}
