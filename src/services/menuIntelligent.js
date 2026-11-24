// src/services/menuIntelligent.js
// Composition du menu de la semaine pour UNE famille, sans réseau (fonctions pures, testables) :
//  1. ALLERGIES  : un plat contenant un allergène d'un membre est exclu (règle stricte) ;
//  2. SANTÉ      : hypertension → moins de plats très salés ; diabète → moins de plats très sucrés,
//                  avec des conseils d'adaptation (conseils généraux, pas un avis médical) ;
//  3. GOÛTS      : bonus pour les plats préférés des membres ;
//  4. ANTI-GASPI : bonus pour les plats qui utilisent un produit du stock qui se périme bientôt,
//                  placés en début de semaine ; petit bonus pour ce qui est déjà en stock ;
//  5. VARIÉTÉ    : pas deux fois le même plat, catégories qui alternent ;
//  6. BUDGET     : si le total dépasse le budget, les repas les plus chers sont remplacés.
import { toDate } from '../utils';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const REPAS = ['petitDejeuner', 'dejeuner', 'diner'];
const MATIN = ['Petit-déjeuner', 'Fruit'];

const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const premier = (nom = '') => nom.split(/\s+/)[0];

// ---------- Allergies ----------
const ALLERGENES = {
  arachides: /arachide|cacahu/,
  gluten: /\bble\b|farine de ble|\bpain\b|pates|spaghetti|macaroni|semoule de ble|biscuit|gateau/,
  'fruits de mer': /crevette|ecrevisse|crabe|moule|huitre|calmar|homard|langouste|njanga/,
};
const AUCUNE = /^(ras|aucune?)$/i;

/** Allergènes de la famille : [{ cle, regex, membres: [prénoms] }]. « Autre: lait » → /lait/. */
export const allergenesFamille = (membres = []) => {
  const out = new Map();
  membres.forEach((m) => {
    (m.allergiesConnues || []).forEach((a) => {
      if (typeof a !== 'string' || AUCUNE.test(a.trim())) return;
      const autre = a.startsWith('Autre:') ? norm(a.slice(6).trim()) : null;
      const cle = autre || norm(a);
      if (!cle) return;
      const regex = ALLERGENES[cle] || new RegExp(cle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (!out.has(cle)) out.set(cle, { cle, label: autre ? a.slice(6).trim() : a, regex, membres: [] });
      out.get(cle).membres.push(premier(m.nomComplet || m.email || 'un membre'));
    });
  });
  return [...out.values()];
};

const textePlat = (p) => norm([p.nom, ...(p.ingredientsNecessaires || []).map((i) => i.nom)].join(' | '));

// ---------- Santé ----------
const SALE = /\bsel\b|cube|bouillon|kanwa|sel gemme|fume|sale|morue|stockfish|seche/;
const SUCRE = /sucre|plantain mur|banane douce|miel|confiture|tapioca|jus|soda|chocolat|\bbeignet/;

const conditionsFamille = (membres = []) => {
  const c = { hypertension: [], diabete: [] };
  membres.forEach((m) => {
    const ant = (m.antecedentsMedicaux || []).map((x) => norm(String(x)));
    const nom = premier(m.nomComplet || m.email || 'un membre');
    if (ant.some((x) => x.includes('hypertension') || x.includes('tension'))) c.hypertension.push(nom);
    if (ant.some((x) => x.includes('diabete'))) c.diabete.push(nom);
  });
  return c;
};

const compte = (plat, regex) => (plat.ingredientsNecessaires || []).filter((i) => regex.test(norm(i.nom))).length;

/** Conseils d'adaptation d'un plat pour la famille (vide si rien à signaler). */
export const conseilsSante = (plat, conditions) => {
  const out = [];
  if (conditions.hypertension.length && compte(plat, SALE) >= 2) {
    out.push(`Tension (${conditions.hypertension.join(', ')}) : un seul cube, pas de sel ajouté, rincer le poisson fumé.`);
  }
  if (conditions.diabete.length && compte(plat, SUCRE) >= 1) {
    out.push(`Diabète (${conditions.diabete.join(', ')}) : petite portion de plantain mûr ou de sucré, plus de légumes.`);
  }
  return out;
};

// ---------- Stock ----------
const JOUR_MS = 86400000;
const stockInfos = (stock = [], maintenant = new Date()) => {
  const auj = new Date(maintenant); auj.setHours(0, 0, 0, 0);
  return stock
    .filter((i) => (parseFloat(i.stockQuantity) || 0) > 0)
    .map((i) => {
      const exp = toDate(i.datePeremption);
      const jours = exp ? Math.round((exp - auj) / JOUR_MS) : null;
      return { id: i.id, nom: i.nom, cle: cleNom(i.nom), jours, bientot: jours !== null && jours >= 0 && jours <= 5 };
    });
};
// Même règle que cleProduit() : « Tomates » et « tomate » sont le même produit.
const cleNom = (s = '') => norm(s).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean)
  .map((w) => (w.length > 3 ? w.replace(/(s|x)$/, '') : w)).join(' ');
const ingredientsDuPlat = (plat, infos) =>
  infos.filter((s) => (plat.ingredientsNecessaires || []).some((i) => i.ingredientId === s.id || cleNom(i.nom) === s.cle));

// ---------- Fiche d'un plat ----------
/**
 * Ce que la famille doit savoir avant de cuisiner ce plat :
 * allergies concernées (prénoms) et conseils santé. Conseils généraux, pas un avis médical.
 */
export const alertesPlat = (plat, membres = []) => {
  if (!plat) return { allergies: [], conseils: [] };
  const t = textePlat(plat);
  return {
    allergies: allergenesFamille(membres).filter((a) => a.regex.test(t)).map(({ label, membres: m }) => ({ label, membres: m })),
    conseils: conseilsSante(plat, conditionsFamille(membres)),
  };
};

// ---------- Anti-gaspillage (accueil) ----------
/**
 * Produits du stock qui se périment dans les `jours` prochains jours, et les plats de la famille
 * qui en utilisent le plus (plats dangereux pour un allergique exclus).
 * @returns {{ produits: [{ id, nom, jours }], plats: [{ plat, utilise: [noms] }] }}
 */
export const platsAntiGaspi = ({ plats = [], stock = [], membres = [], maintenant = new Date(), max = 3 }) => {
  const produits = stockInfos(stock, maintenant).filter((s) => s.bientot).sort((a, b) => a.jours - b.jours);
  if (!produits.length) return { produits: [], plats: [] };
  const allergenes = allergenesFamille(membres);
  const choix = plats
    .filter((p) => !allergenes.some((a) => a.regex.test(textePlat(p))))
    .map((p) => {
      const utilise = ingredientsDuPlat(p, produits);
      // Le plus urgent compte davantage : un produit à J-0 pèse plus qu'un produit à J-5.
      const urgence = utilise.reduce((s, u) => s + (6 - u.jours), 0);
      return { plat: p, utilise: utilise.map((u) => u.nom), urgence };
    })
    .filter((x) => x.utilise.length)
    .sort((a, b) => b.utilise.length - a.utilise.length || b.urgence - a.urgence)
    .slice(0, max)
    .map(({ plat, utilise }) => ({ plat, utilise }));
  return { produits: produits.map(({ id, nom, jours }) => ({ id, nom, jours })), plats: choix };
};

// ---------- Composition ----------
/**
 * @param {object} ctx { plats, membres, stock, budget,
 *   cout: (plat) => { total, connus } (coût estimé, ex. coutPlat de prixService),
 *   aleatoire: () => nombre 0-1 (variété), maintenant: Date }
 * @returns {{ semaine, total, inconnus, budget, depassement, antiGaspi, exclus, conseils, vide }}
 */
export const composerSemaine = ({
  plats = [], membres = [], stock = [], budget = 0, cout = () => ({ total: 0, connus: 0 }), aleatoire = Math.random, maintenant = new Date(),
}) => {
  const allergenes = allergenesFamille(membres);
  const conditions = conditionsFamille(membres);
  const infos = stockInfos(stock, maintenant);
  const preferes = new Map();
  membres.forEach((m) => (m.platsPreferes || []).forEach((id) => {
    if (!preferes.has(id)) preferes.set(id, []);
    preferes.get(id).push(premier(m.nomComplet || 'un membre'));
  }));

  // 1. Allergies : exclusion stricte.
  const exclus = [];
  const sains = plats.filter((p) => {
    const t = textePlat(p);
    const a = allergenes.find((x) => x.regex.test(t));
    if (a) exclus.push({ plat: p.nom, raison: `${a.label} (${a.membres.join(', ')})` });
    return !a;
  });

  const fiche = new Map(sains.map((p) => {
    const c = cout(p);
    const stockP = ingredientsDuPlat(p, infos);
    return [p.id, {
      plat: p,
      cout: c.connus ? c.total : null,
      bientot: stockP.filter((s) => s.bientot),
      enStock: stockP,
      sale: compte(p, SALE),
      sucre: compte(p, SUCRE),
    }];
  }));

  const estMatin = (p) => MATIN.includes(p.categoriePlat);
  const candidats = {
    petitDejeuner: sains.filter(estMatin),
    repas: sains.filter((p) => !estMatin(p)),
  };

  const score = (f, jourIdx, dejaPris, categorieVoisine) => {
    let s = aleatoire() * 1.5; // un peu de hasard : « Générer » propose une autre semaine à chaque fois
    s += (preferes.get(f.plat.id)?.length || 0) * 3;
    s += f.bientot.length * (4 - jourIdx * 0.5); // produits qui se périment : plutôt en début de semaine
    s += Math.min(f.enStock.length, 4) * 0.5;
    if (conditions.hypertension.length) s -= Math.max(0, f.sale - 1) * 1.2;
    if (conditions.diabete.length) s -= f.sucre * 1.5;
    if (dejaPris.has(f.plat.id)) s -= 50; // pas deux fois le même plat
    if (categorieVoisine && f.plat.categoriePlat && f.plat.categoriePlat === categorieVoisine) s -= 1.5;
    return s;
  };

  // 2. Choix glouton, jour par jour.
  const semaine = {};
  const pris = new Set();
  JOURS.forEach((jour, j) => {
    semaine[jour] = {};
    let voisine = null;
    REPAS.forEach((repas) => {
      const liste = repas === 'petitDejeuner' ? candidats.petitDejeuner : candidats.repas;
      if (!liste.length) { semaine[jour][repas] = null; return; }
      let meilleur = null;
      let best = -Infinity;
      liste.forEach((p) => {
        const s = score(fiche.get(p.id), j, pris, repas === 'petitDejeuner' ? null : voisine);
        if (s > best) { best = s; meilleur = p; }
      });
      if (pris.has(meilleur.id) && liste.length > pris.size) { /* tous déjà pris : on accepte une répétition */ }
      pris.add(meilleur.id);
      if (repas !== 'petitDejeuner') voisine = meilleur.categoriePlat;
      semaine[jour][repas] = meilleur.id;
    });
  });

  // 3. Budget : on remplace les repas les plus chers tant que le total dépasse.
  const total = () => {
    let t = 0;
    JOURS.forEach((d) => REPAS.forEach((m) => { const id = semaine[d][m]; const c = id && fiche.get(id).cout; if (c) t += c; }));
    return t;
  };
  if (budget > 0) {
    for (let essai = 0; essai < 40 && total() > budget; essai++) {
      let pire = null;
      JOURS.forEach((d) => ['dejeuner', 'diner'].forEach((m) => {
        const id = semaine[d][m];
        const c = id && fiche.get(id).cout;
        if (c && (!pire || c > pire.c)) pire = { d, m, id, c };
      }));
      if (!pire) break;
      const utilises = new Set(JOURS.flatMap((d) => REPAS.map((m) => semaine[d][m])).filter(Boolean));
      const moinsCher = candidats.repas
        .map((p) => fiche.get(p.id))
        .filter((f) => f.cout !== null && f.cout < pire.c * 0.85 && !utilises.has(f.plat.id))
        .sort((a, b) => a.cout - b.cout)[0];
      if (!moinsCher) break;
      semaine[pire.d][pire.m] = moinsCher.plat.id;
    }
  }

  // 4. Résumé.
  const antiGaspi = new Map();
  const conseils = new Map();
  let inconnus = 0;
  JOURS.forEach((d) => REPAS.forEach((m) => {
    const id = semaine[d][m];
    if (!id) return;
    const f = fiche.get(id);
    if (f.cout === null) inconnus += 1;
    f.bientot.forEach((s) => antiGaspi.set(s.nom, s.jours));
    conseilsSante(f.plat, conditions).forEach((c) => conseils.set(c, (conseils.get(c) || 0) + 1));
  }));
  const t = total();
  return {
    semaine,
    total: t,
    inconnus,
    budget,
    depassement: budget > 0 && t > budget ? t - budget : 0,
    antiGaspi: [...antiGaspi.entries()].map(([nom, jours]) => ({ nom, jours })),
    exclus,
    conseils: [...conseils.keys()],
    vide: !sains.length,
  };
};
