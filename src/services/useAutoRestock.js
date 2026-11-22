// Réapprovisionnement automatique du stock, actif tant que l'application est ouverte.
//
// À chaque changement d'un ingrédient (temps réel Firestore) :
//  1. « Recharge automatique » activée sur l'ingrédient → son stock remonte directement
//     à la quantité de recharge dès qu'il est épuisé ou sous son seuil ;
//  2. sinon, l'ingrédient épuisé ou sous son seuil est ajouté à la liste de marché
//     avec la quantité manquante (il sera rechargé quand on le cochera au marché).
import { useEffect, useRef } from 'react';
import { enqueueSnackbar } from 'notistack';
import { INGREDIENT_STATUS, listenIngredients, updateIngredient } from './ingredientService';
import { computeStatus } from './stockStatus';
import { addToShoppingList, readDismissed, readShoppingList, writeDismissed } from './shoppingList';
import { formatNumber } from '../utils';

const num = (v) => parseFloat(v) || 0;

/** Faut-il racheter cet ingrédient ? (épuisé ou sous le seuil ; un produit jamais acheté ne compte pas) */
export const needsRestock = (ing) => {
  const { status, qty } = computeStatus(ing);
  if (ing.status === INGREDIENT_STATUS.NOT_USED && qty <= 0) return false;
  return status === INGREDIENT_STATUS.EXHAUSTED || status === INGREDIENT_STATUS.LOW_STOCK;
};

/** Niveau visé après recharge : la quantité de recharge, à défaut le seuil minimum. */
export const restockTarget = (ing) => num(ing.quantiteRecharge) || num(ing.seuilMinimum);

/** Quantité à acheter pour revenir au niveau visé (au moins 1 unité). */
export const missingQuantity = (ing) => {
  const missing = restockTarget(ing) - num(ing.stockQuantity);
  return missing > 0 ? Math.round(missing * 100) / 100 : 1;
};

export default function useAutoRestock(enabled = true) {
  const pending = useRef(new Set()); // recharges en cours d'écriture (évite les doublons)

  useEffect(() => {
    if (!enabled) return undefined;
    return listenIngredients((ingredients) => {
      const list = readShoppingList();
      const inList = new Set(list.map((i) => i.ingredientId));
      const dismissed = readDismissed();
      const toAdd = [];

      ingredients.forEach((ing) => {
        if (!needsRestock(ing)) {
          dismissed.delete(ing.id); // stock revenu à la normale : l'ajout auto redevient possible
          return;
        }
        // 1. Recharge directe.
        if (ing.rechargeAuto && num(ing.quantiteRecharge) > 0) {
          if (pending.current.has(ing.id)) return;
          pending.current.add(ing.id);
          updateIngredient(ing.id, { stockQuantity: num(ing.quantiteRecharge), status: INGREDIENT_STATUS.IN_USE })
            .then(() => enqueueSnackbar(`Stock de « ${ing.nom} » rechargé automatiquement (${formatNumber(num(ing.quantiteRecharge))} ${ing.uniteMesure || ''}).`, { variant: 'info' }))
            .catch((err) => console.error(`Recharge automatique de ${ing.nom} :`, err))
            .finally(() => pending.current.delete(ing.id));
          return;
        }
        // 2. Ajout à la liste de marché.
        if (inList.has(ing.id) || dismissed.has(ing.id)) return;
        toAdd.push({
          ingredientId: ing.id, nom: ing.nom, quantite: missingQuantity(ing), uniteMesure: ing.uniteMesure,
          prixUnitaire: num(ing.prix), checked: false, auto: true,
        });
      });

      writeDismissed(dismissed);
      if (toAdd.length) {
        addToShoppingList(toAdd);
        enqueueSnackbar(
          toAdd.length === 1
            ? `« ${toAdd[0].nom} » est presque épuisé : ajouté à la liste de marché.`
            : `${toAdd.length} produits presque épuisés ajoutés à la liste de marché.`,
          { variant: 'info' }
        );
      }
    });
  }, [enabled]);
}
