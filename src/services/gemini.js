// Accès centralisé à Gemini, avec bascule automatique si un modèle est saturé ou retiré.
//
// Les appels passent par Firebase AI Logic (Gemini Developer API, offre gratuite) : aucune clé
// Gemini n'est présente dans le code envoyé au navigateur, et les requêtes sont protégées par
// App Check (seule NOTRE application peut consommer le quota de l'IA).
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { firebaseApp } from '../firebase/firebase';

/** L'IA est disponible dès que Firebase AI Logic est activé sur le projet (aucune clé à configurer). */
export const AI_READY = true;

// Modèles rapides en premier : les gros modèles dépassent la minute sur la Découverte,
// et Safari (iPhone) coupe les requêtes trop longues.
const MODELS = [
  ...new Set([process.env.REACT_APP_GEMINI_MODEL || 'gemini-3.5-flash-lite', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite', 'gemini-3.5-flash']),
];

// Erreurs pour lesquelles on essaie le modèle suivant (saturation, modèle introuvable, erreur serveur).
const retryable = (err) => /\b(503|500|404|429)\b|overloaded|unavailable|not found|not supported/i.test(err?.message || '');

let ai = null;

/**
 * Génère une réponse texte. Lève l'erreur du dernier modèle si tous échouent.
 * `json: true` force le modèle à répondre en JSON valide (plus fiable à analyser).
 */
export async function generateText(prompt, { json = false } = {}) {
  ai = ai || getAI(firebaseApp, { backend: new GoogleAIBackend() });
  const generationConfig = json ? { responseMimeType: 'application/json' } : undefined;
  let lastError;
  for (const name of MODELS) {
    try {
      const result = await getGenerativeModel(ai, { model: name, generationConfig }).generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastError = err;
      if (!retryable(err)) break;
      console.warn(`Gemini ${name} indisponible, essai du modèle suivant…`, err.message);
    }
  }
  throw lastError;
}
