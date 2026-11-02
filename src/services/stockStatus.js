import { INGREDIENT_STATUS } from './ingredientService';
import { toDate } from '../utils';

export const EXPIRATION_WARNING_DAYS = 7;

export const STATUS_META = {
  [INGREDIENT_STATUS.EXPIRED]: { label: 'Expiré', color: 'error' },
  [INGREDIENT_STATUS.EXHAUSTED]: { label: 'Épuisé', color: 'error' },
  [INGREDIENT_STATUS.LOW_STOCK]: { label: 'Stock faible', color: 'warning' },
  [INGREDIENT_STATUS.IN_USE]: { label: 'En stock', color: 'success' },
  [INGREDIENT_STATUS.NOT_USED]: { label: 'Non utilisé', color: 'info' },
};

/** Statut calculé d'un ingrédient (même règles que l'ancienne page Stock). */
export const computeStatus = (ing) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = toDate(ing.datePeremption);
  const qty = parseFloat(ing.stockQuantity) || 0;
  const min = parseFloat(ing.seuilMinimum) || 0;
  let status = ing.status;

  if (exp && exp < now) status = INGREDIENT_STATUS.EXPIRED;
  else if (qty <= 0) status = INGREDIENT_STATUS.EXHAUSTED;
  else if (qty < min) status = INGREDIENT_STATUS.LOW_STOCK;
  else if (status === INGREDIENT_STATUS.NOT_USED || status === INGREDIENT_STATUS.EXHAUSTED) status = INGREDIENT_STATUS.IN_USE;

  const expiringSoon = Boolean(exp && exp >= now && exp - now < EXPIRATION_WARNING_DAYS * 86400000);
  return { status, expiringSoon, qty };
};

/** Un ingrédient demande-t-il une action (racheter, jeter, surveiller) ? */
export const needsAttention = (ing) => {
  const { status, expiringSoon, qty } = computeStatus(ing);
  // Un ingrédient jamais acheté (créé à 0) n'est pas une alerte.
  if (ing.status === INGREDIENT_STATUS.NOT_USED && qty <= 0 && !toDate(ing.datePeremption)) return false;
  return (
    expiringSoon ||
    status === INGREDIENT_STATUS.EXPIRED ||
    status === INGREDIENT_STATUS.EXHAUSTED ||
    status === INGREDIENT_STATUS.LOW_STOCK
  );
};
