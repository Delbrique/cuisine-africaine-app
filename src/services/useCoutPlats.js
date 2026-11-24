// Hook : coût estimé des plats (prix de la famille + prix relevés à Yaoundé).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getIngredients } from './ingredientService';
import { coutPlat, statsPrix } from './prixService';

export default function useCoutPlats(plats) {
  const [stock, setStock] = useState([]);
  const [stats, setStats] = useState(null);

  // Tous les ingrédients utilisés par les plats affichés.
  const noms = useMemo(
    () => [...new Set((plats || []).flatMap((p) => (p.ingredientsNecessaires || []).map((i) => i.nom)).filter(Boolean))].sort().join('|'),
    [plats]
  );

  const recharger = useCallback(() => {
    getIngredients().then(setStock).catch(() => setStock([]));
    if (noms) statsPrix(noms.split('|')).then(setStats).catch(() => setStats(new Map()));
    else setStats(new Map());
  }, [noms]);

  useEffect(() => { recharger(); }, [recharger]);

  const cout = useCallback((plat) => (plat ? coutPlat(plat, { stock, stats }) : null), [stock, stats]);
  return { cout, recharger, pret: stats !== null };
}
