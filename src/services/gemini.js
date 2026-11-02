// Accès centralisé à Gemini, avec bascule automatique si un modèle est saturé ou retiré.
import { GoogleGenerativeAI } from '@google/generative-ai';

export const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

const MODELS = [
  ...new Set([process.env.REACT_APP_GEMINI_MODEL || 'gemini-2.5-flash', 'gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-2.5-flash-lite']),
];

// Erreurs pour lesquelles on essaie le modèle suivant (saturation, modèle introuvable, erreur serveur).
const retryable = (err) => /\b(503|500|404|429)\b|overloaded|unavailable|not found|not supported/i.test(err?.message || '');

let client = null;

/** Génère une réponse texte. Lève l'erreur du dernier modèle si tous échouent. */
export async function generateText(prompt) {
  if (!GEMINI_API_KEY) throw new Error('API key manquante');
  client = client || new GoogleGenerativeAI(GEMINI_API_KEY);
  let lastError;
  for (const name of MODELS) {
    try {
      const result = await client.getGenerativeModel({ model: name }).generateContent(prompt);
      return (await result.response).text();
    } catch (err) {
      lastError = err;
      if (!retryable(err)) break;
      console.warn(`Gemini ${name} indisponible, essai du modèle suivant…`, err.message);
    }
  }
  throw lastError;
}
