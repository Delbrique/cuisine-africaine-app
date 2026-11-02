// Utilitaires partagés.

/**
 * Lit une image et la redimensionne (JPEG) pour éviter de stocker des photos
 * de plusieurs Mo en base64 dans Firestore (limite de 1 Mo par document).
 */
export const readImageAsDataUrl = (file, maxSize = 900, quality = 0.82) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result);
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const AUTH_ERRORS = {
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/user-not-found': 'Aucun compte ne correspond à cet email.',
  'auth/invalid-email': "L'adresse email n'est pas valide.",
  'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
  'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
  'auth/network-request-failed': 'Pas de connexion internet. Vérifiez votre réseau.',
  'auth/popup-closed-by-user': 'La fenêtre Google a été fermée avant la fin.',
  'auth/cancelled-popup-request': 'La fenêtre Google a été fermée avant la fin.',
};

/** Message lisible pour une erreur Firebase. */
export const friendlyError = (err, fallback = 'Une erreur est survenue. Réessayez.') =>
  AUTH_ERRORS[err?.code] || err?.message || fallback;

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

// Intl utilise une espace fine (U+202F) que certaines polices n'affichent pas : on la remplace.
const fr = (n, digits) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(Number(n) || 0).replace(/ /g, ' ');

export const formatFcfa = (n) => `${fr(n, 0)} FCFA`;

export const formatNumber = (n, digits = 2) => fr(n, digits);

/** Convertit un Timestamp Firestore, une Date ou une chaîne en Date (ou null). */
export const toDate = (v) => {
  if (!v) return null;
  if (v.toDate) return v.toDate();
  if (v.seconds) return new Date(v.seconds * 1000);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (v, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  const d = toDate(v);
  return d ? d.toLocaleDateString('fr-FR', opts) : '—';
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

/** Jour de la semaine courant au format des clés du planning ('lundi'…). */
export const todayKey = () =>
  ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][new Date().getDay()];

/** Texte affichable quel que soit le format stocké (chaîne, liste, nombre, vide). */
export const asText = (v) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : v == null ? '' : String(v)).trim();

export const normalize = (s = '') =>
  s.toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
