// src/services/prixService.js
// Prix réels en FCFA, relevés par les familles.
//
//   prix/{id}      PUBLIC entre utilisateurs connectés, ANONYME : produit, prix par unité, lieu, date.
//                  Aucune information sur la famille n'y est enregistrée (seul l'uid de l'auteur,
//                  pour qu'il puisse corriger ou supprimer son relevé ; jamais affiché).
//   depenses/{id}  PRIVÉ à la famille : ce qu'elle a réellement dépensé (budget de la semaine).
//   familles/{id}  champ `budgetHebdo` : plafond de la semaine en FCFA.
import {
  addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, Timestamp, deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { currentFamilleId } from './familleService';
import { VILLE } from './lieuxService';

// ---------- Produits et unités ----------
/** Clé de regroupement d'un produit : « Tomates fraîches » et « tomate fraiche » → « tomate fraiche ». */
export const cleProduit = (nom = '') =>
  nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean)
    .map((w) => (w.length > 3 ? w.replace(/(s|x)$/, '') : w))
    .join(' ').slice(0, 80);

// Unités converties vers une unité de référence ; les autres (tas, botte, pièce…) restent telles quelles.
const CONVERSIONS = {
  kg: ['kg', 1], kilo: ['kg', 1], kilos: ['kg', 1], kilogramme: ['kg', 1], kilogrammes: ['kg', 1],
  g: ['kg', 0.001], gr: ['kg', 0.001], gramme: ['kg', 0.001], grammes: ['kg', 0.001],
  l: ['l', 1], litre: ['l', 1], litres: ['l', 1], cl: ['l', 0.01], ml: ['l', 0.001],
};
const SINGULIER = { tas: 'tas', bottes: 'botte', pieces: 'piece', pièces: 'piece', pièce: 'piece', sacs: 'sac', paquets: 'paquet', boites: 'boite', boîtes: 'boite', boîte: 'boite', regimes: 'regime', régimes: 'regime', régime: 'regime', seaux: 'seau', unites: 'unite', unités: 'unite', unité: 'unite' };

/** Unité de référence et facteur : « 500 g » → { unite: 'kg', facteur: 0.001 }. */
export const uniteReference = (unite = '') => {
  const u = unite.trim().toLowerCase();
  if (CONVERSIONS[u]) return { unite: CONVERSIONS[u][0], facteur: CONVERSIONS[u][1] };
  // Unité saisie avec un nombre : « 1 kg », « 400g », « 1,5 l », « 2 pièces ».
  const m = u.match(/^(\d+(?:[.,]\d+)?)\s*([a-zà-ÿ]+)\.?$/);
  if (m) {
    const n = parseFloat(m[1].replace(',', '.'));
    const inner = uniteReference(m[2]);
    if (n > 0) return { unite: inner.unite, facteur: inner.facteur * n };
  }
  const s = SINGULIER[u] || u.normalize('NFD').replace(/[̀-ͯ]/g, '') || 'unite';
  return { unite: s, facteur: 1 };
};

export const UNITES_COURANTES = ['kg', 'g', 'l', 'tas', 'botte', 'pièce', 'sac', 'paquet', 'boîte', 'régime', 'seau'];

const mediane = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Clé de la semaine (lundi) : « 2026-11-16 ». */
export const cleSemaine = (d = new Date()) => {
  const x = new Date(d);
  const jour = (x.getDay() + 6) % 7; // lundi = 0
  x.setDate(x.getDate() - jour);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

// ---------- Relevés ----------
/**
 * Enregistre un achat : relevé de prix anonyme (communauté) + dépense privée (famille).
 * @param {{ nom, montant, quantite, unite, lieu?: {id, nom} }} achat
 */
export const noterAchat = async ({ nom, montant, quantite, unite, lieu }) => {
  const m = Math.round(Number(montant));
  const q = Number(quantite);
  if (!nom || !(m > 0) || !(q > 0)) throw new Error('Indiquez le produit, le prix payé et la quantité.');
  const ref = uniteReference(unite);
  const prixUnitaire = m / (q * ref.facteur); // FCFA par unité de référence
  const commun = {
    cle: cleProduit(nom),
    nom: nom.trim(),
    prixUnitaire: Math.round(prixUnitaire * 100) / 100,
    unite: ref.unite,
    ville: VILLE,
    lieuId: lieu?.id || null,
    lieuNom: lieu?.nom || null,
    date: serverTimestamp(),
  };
  const releve = await addDoc(collection(db, 'prix'), { ...commun, auteurUid: auth.currentUser?.uid || null });
  await addDoc(collection(db, 'depenses'), {
    ...commun,
    familleId: currentFamilleId(),
    montant: m,
    quantite: q,
    uniteSaisie: unite || '',
    semaine: cleSemaine(),
    releveId: releve.id,
  });
  return releve.id;
};

/**
 * Statistiques des prix récents (90 jours) pour une liste de produits.
 * Renvoie Map(cle → Map(unite → { mediane, min, max, n, parLieu: [{lieuNom, mediane, n}] })).
 */
export const statsPrix = async (noms) => {
  const cles = [...new Set(noms.map(cleProduit).filter(Boolean))];
  const depuis = Date.now() - 90 * 24 * 3600 * 1000;
  const lignes = [];
  for (let i = 0; i < cles.length; i += 30) {
    const snap = await getDocs(query(collection(db, 'prix'), where('cle', 'in', cles.slice(i, i + 30))));
    snap.forEach((d) => {
      const r = d.data();
      const t = r.date?.toMillis ? r.date.toMillis() : Date.now();
      if (t >= depuis && r.prixUnitaire > 0) lignes.push(r);
    });
  }
  const out = new Map();
  for (const r of lignes) {
    if (!out.has(r.cle)) out.set(r.cle, new Map());
    const parUnite = out.get(r.cle);
    if (!parUnite.has(r.unite)) parUnite.set(r.unite, []);
    parUnite.get(r.unite).push(r);
  }
  for (const parUnite of out.values()) {
    for (const [unite, rs] of parUnite) {
      const xs = rs.map((r) => r.prixUnitaire);
      const lieux = {};
      rs.forEach((r) => { if (r.lieuNom) (lieux[r.lieuNom] = lieux[r.lieuNom] || []).push(r.prixUnitaire); });
      parUnite.set(unite, {
        mediane: mediane(xs), min: Math.min(...xs), max: Math.max(...xs), n: xs.length,
        parLieu: Object.entries(lieux).map(([lieuNom, v]) => ({ lieuNom, mediane: mediane(v), n: v.length })).sort((a, b) => a.mediane - b.mediane),
      });
    }
  }
  return out;
};

/**
 * Prix communautaire d'un article exprimé dans SON unité (ex. liste en « g », relevés en « kg »).
 * Renvoie { prix, n, min, max, parLieu } ou null.
 */
export const prixCommunautaire = (stats, nom, unite) => {
  const parUnite = stats?.get(cleProduit(nom));
  if (!parUnite) return null;
  const ref = uniteReference(unite);
  const s = parUnite.get(ref.unite);
  if (!s) return null;
  const f = ref.facteur; // prix par unité de l'article = prix par unité de référence × facteur
  return { prix: s.mediane * f, min: s.min * f, max: s.max * f, n: s.n, parLieu: s.parLieu.map((l) => ({ ...l, mediane: l.mediane * f })) };
};

// ---------- Historique d'un produit ----------
const semaineDe = (ms) => cleSemaine(new Date(ms));

/**
 * Historique d'un produit sur `jours` jours, dans l'unité la plus relevée (ou `unite`).
 * Renvoie { unite, unites, releves, semaines: [{ semaine, mediane, n }], mediane, min, max,
 *           evolution (part de variation entre la 1re et la dernière semaine, ou null),
 *           parLieu: [{ lieuNom, mediane, n }] trié du moins cher au plus cher }.
 */
export const historiqueProduit = async (nom, { jours = 90, unite } = {}) => {
  const snap = await getDocs(query(collection(db, 'prix'), where('cle', '==', cleProduit(nom))));
  const depuis = Date.now() - jours * 24 * 3600 * 1000;
  const tous = snap.docs
    .map((d) => ({ ...d.data(), id: d.id, t: d.data().date?.toMillis?.() || Date.now() }))
    .filter((r) => r.prixUnitaire > 0 && r.t >= depuis);
  const compte = {};
  tous.forEach((r) => { compte[r.unite] = (compte[r.unite] || 0) + 1; });
  const unites = Object.keys(compte).sort((a, b) => compte[b] - compte[a]);
  const u = unite && compte[unite] ? unite : unites[0];
  const releves = tous.filter((r) => r.unite === u).sort((a, b) => a.t - b.t);
  if (!releves.length) return { unite: u || null, unites, releves: [], semaines: [], parLieu: [] };

  const parSemaine = {};
  releves.forEach((r) => { (parSemaine[semaineDe(r.t)] = parSemaine[semaineDe(r.t)] || []).push(r.prixUnitaire); });
  const semaines = Object.entries(parSemaine).sort(([a], [b]) => a.localeCompare(b))
    .map(([semaine, xs]) => ({ semaine, mediane: mediane(xs), n: xs.length }));
  const lieux = {};
  releves.forEach((r) => { if (r.lieuNom) (lieux[r.lieuNom] = lieux[r.lieuNom] || []).push(r.prixUnitaire); });
  const xs = releves.map((r) => r.prixUnitaire);
  const premier = semaines[0].mediane;
  const dernier = semaines[semaines.length - 1].mediane;
  return {
    unite: u,
    unites,
    releves,
    semaines,
    mediane: mediane(xs),
    min: Math.min(...xs),
    max: Math.max(...xs),
    evolution: semaines.length > 1 && premier > 0 ? (dernier - premier) / premier : null,
    parLieu: Object.entries(lieux).map(([lieuNom, v]) => ({ lieuNom, mediane: mediane(v), n: v.length })).sort((a, b) => a.mediane - b.mediane),
  };
};

// ---------- Coût d'un plat ----------
/**
 * Coût d'une quantité donnée d'un ingrédient, en FCFA, ou null si aucun prix n'est connu.
 * Priorité : prix de la famille (catalogue d'ingrédients) puis prix relevés à Yaoundé.
 */
export const coutIngredient = (ing, { stock = [], stats } = {}) => {
  const q = parseFloat(ing.quantite) || 0;
  if (!q) return { cout: null, source: null };
  const unite = ing.uniteMesure || '';
  const fam = stock.find((s) => s.id === ing.ingredientId) || stock.find((s) => cleProduit(s.nom) === cleProduit(ing.nom));
  const prixFam = parseFloat(fam?.prix);
  if (prixFam > 0) {
    const a = uniteReference(unite);
    const b = uniteReference(fam.uniteMesure || '');
    if (a.unite === b.unite) return { cout: q * (a.facteur / b.facteur) * prixFam, source: 'famille' };
  }
  const com = prixCommunautaire(stats, ing.nom, unite);
  if (com) return { cout: q * com.prix, source: 'communaute', n: com.n };
  return { cout: null, source: null };
};

/** Coût estimé d'un plat : { total, connus, nb, details: [{ nom, cout, source }] }. */
export const coutPlat = (plat, ctx) => {
  const details = (plat?.ingredientsNecessaires || []).map((ing) => ({ nom: ing.nom, ...coutIngredient(ing, ctx) }));
  const connus = details.filter((d) => d.cout !== null);
  return {
    total: connus.reduce((s, d) => s + d.cout, 0),
    connus: connus.length,
    nb: details.length,
    details,
  };
};

// ---------- Budget de la famille ----------
export const getBudget = async () => {
  const snap = await getDoc(doc(db, 'familles', currentFamilleId()));
  return Number(snap.data()?.budgetHebdo) || 0;
};

export const setBudget = (montant) =>
  updateDoc(doc(db, 'familles', currentFamilleId()), { budgetHebdo: Math.max(0, Math.round(Number(montant) || 0)) });

/** Dépenses de la famille pour une semaine (lundi → dimanche). */
export const depensesSemaine = async (semaine = cleSemaine()) => {
  const snap = await getDocs(query(collection(db, 'depenses'), where('familleId', '==', currentFamilleId())));
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .filter((d) => d.semaine === semaine)
    .sort((a, b) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
};

/** Annule un achat : supprime la dépense et le relevé de prix associé. */
export const annulerAchat = async (depense) => {
  await deleteDoc(doc(db, 'depenses', depense.id));
  if (depense.releveId) await deleteDoc(doc(db, 'prix', depense.releveId)).catch(() => {});
};

export const ilYa = (ts) => {
  const d = ts?.toDate ? ts.toDate() : ts instanceof Timestamp ? ts.toDate() : null;
  return d ? d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
};
