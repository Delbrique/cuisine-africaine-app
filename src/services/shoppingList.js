// Liste de marché (stockée sur l'appareil) : lecture, écriture et notification des écrans ouverts.
// Une liste par famille : sur un appareil partagé, deux comptes ne voient jamais la liste de l'autre.
import { getSession } from './familleService';

const scoped = (base) => `${base}:${getSession().familleId || 'anonyme'}`;
const KEY_BASE = 'shoppingList';
const DISMISSED_BASE = 'shoppingAutoDismissed';
export const SHOPPING_EVENT = 'shopping-list-change';

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

export const readShoppingList = () =>
  read(scoped(KEY_BASE), []).map((i) => ({ ...i, quantite: parseFloat(i.quantite) || 0, prixUnitaire: parseFloat(i.prixUnitaire) || 0 }));

export const writeShoppingList = (list) => {
  localStorage.setItem(scoped(KEY_BASE), JSON.stringify(list));
  window.dispatchEvent(new Event(SHOPPING_EVENT));
};

/** Ajoute des articles ; si l'ingrédient est déjà dans la liste, les quantités s'additionnent. */
export const addToShoppingList = (items) => {
  const list = readShoppingList();
  items.forEach((item) => {
    const i = list.findIndex((x) => x.ingredientId === item.ingredientId);
    if (i > -1) list[i] = { ...list[i], quantite: (parseFloat(list[i].quantite) || 0) + (parseFloat(item.quantite) || 0) };
    else list.push({ checked: false, ...item });
  });
  writeShoppingList(list);
  return list;
};

// Articles ajoutés automatiquement puis retirés à la main : on ne les rajoute pas
// tant que le stock de l'ingrédient n'est pas revenu à la normale.
export const readDismissed = () => new Set(read(scoped(DISMISSED_BASE), []));
export const writeDismissed = (set) => localStorage.setItem(scoped(DISMISSED_BASE), JSON.stringify([...set]));

/** Récupère une seule fois l'ancienne liste (commune à l'appareil) pour la famille connectée. */
export const migrateLegacyShoppingList = () => {
  try {
    const legacy = localStorage.getItem(KEY_BASE);
    if (legacy && !localStorage.getItem(scoped(KEY_BASE))) localStorage.setItem(scoped(KEY_BASE), legacy);
    localStorage.removeItem(KEY_BASE);
    localStorage.removeItem(DISMISSED_BASE);
  } catch {
    /* stockage indisponible : rien à migrer */
  }
};
export const dismissAuto = (ingredientId) => {
  const s = readDismissed();
  s.add(ingredientId);
  writeDismissed(s);
};
