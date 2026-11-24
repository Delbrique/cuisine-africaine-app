// Tests du moteur de menu : `npm test -- menuIntelligent` (aucun accès réseau ni base de données).
import { allergenesFamille, composerSemaine, conseilsSante } from './menuIntelligent';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const ing = (...noms) => noms.map((nom) => ({ nom, quantite: 1, uniteMesure: 'pièce' }));
const plat = (id, nom, categoriePlat, ...ingredients) => ({ id, nom, categoriePlat, ingredientsNecessaires: ing(...ingredients) });

// 18 plats de repas (dont 4 très salés) + 4 fruits : le moteur a le choix, comme dans la vraie app.
const PLATS = [
  plat('salade', 'Salade de crudités', 'Crudité', 'Tomate', 'Concombre', 'Carotte'),
  plat('braise', 'Poisson braisé', 'Poisson', 'Poisson frais', 'Citron', 'Oignon'),
  plat('poulet', 'Poulet braisé', 'Volaille', 'Poulet', 'Oignon', 'Piment'),
  plat('igname', 'Igname et légumes', 'Végétarien', 'Igname', 'Épinards', 'Tomate'),
  plat('ndole', 'Ndolé', 'Légumes', 'Feuilles de ndolé', 'Arachides crues', 'Écrevisses séchées', 'Cube', 'Poisson fumé'),
  plat('arachide', 'Sauce d’arachide', 'Sauce', 'Pâte d’arachide grillée', 'Poulet', 'Cube'),
  plat('eru', 'Eru', 'Légumes', 'Feuilles d’Eru', 'Écrevisses séchées', 'Poisson fumé', 'Cube'),
  plat('gombo', 'Sauce Gombo', 'Sauce', 'Gombo', 'Poisson fumé', 'Cube'),
  plat('dg', 'Poulet DG', 'Volaille', 'Poulet', 'Plantain mûr', 'Carotte'),
  plat('haricot', 'Haricot sauté', 'Autre', 'Haricots rouges secs', 'Plantain mûr', 'Cube'),
  plat('mbongo', 'Mbongo tchobi', 'Poisson', 'Épices mbongo', 'Poisson frais', 'Cube'),
  plat('ndomba', 'Ndomba de poisson', 'Poisson', 'Poisson frais', 'Tomate'),
  plat('emince', 'Émincé de viandes', 'Viande', 'Viande', 'Poivron', 'Cube'),
  plat('legumes', 'Légumes sautés', 'Végétarien', 'Carotte', 'Chou', 'Poivron'),
  plat('folong', 'Folong sauté', 'Végétarien', 'Feuilles de folong', 'Tomate'),
  plat('riz', 'Riz sauté', 'Autre', 'Riz', 'Carotte', 'Viande'),
  plat('nkui', 'Nkui', 'Sauce', 'Écorces de nkui', 'Sel gemme (kanwa)', 'Poisson fumé', 'Cube'),
  plat('bouillon', 'Bouillon de queue de bœuf', 'Viande', 'Queue de bœuf', 'Pomme de terre', 'Sel', 'Cube'),
  plat('mangue', 'Mangue', 'Fruit', 'Mangue'),
  plat('papaye', 'Papaye', 'Fruit', 'Papaye'),
  plat('ananas', 'Ananas', 'Fruit', 'Ananas'),
  plat('orange', 'Orange', 'Fruit', 'Orange'),
];
const graine = (s) => () => ((s = (s * 9301 + 49297) % 233280) / 233280);
const ids = (r) => JOURS.flatMap((d) => ['petitDejeuner', 'dejeuner', 'diner'].map((m) => r.semaine[d][m])).filter(Boolean);
const midiSoir = (r) => JOURS.flatMap((d) => [r.semaine[d].dejeuner, r.semaine[d].diner]);

describe('allergies', () => {
  test('les plats contenant un allergène sont exclus, avec le prénom du membre', () => {
    const r = composerSemaine({ plats: PLATS, aleatoire: graine(1), membres: [
      { nomComplet: 'Darel B', allergiesConnues: ['Arachides'] },
      { nomComplet: 'Niels B', allergiesConnues: ['Fruits de mer'] },
    ] });
    expect(ids(r)).not.toEqual(expect.arrayContaining(['ndole']));
    ['ndole', 'arachide', 'eru'].forEach((id) => expect(ids(r)).not.toContain(id));
    expect(r.exclus.map((e) => e.plat)).toEqual(expect.arrayContaining(['Ndolé', 'Sauce d’arachide', 'Eru']));
    expect(r.exclus.find((e) => e.plat === 'Ndolé').raison).toMatch(/Darel|Niels/);
  });

  test('« RAS » ne compte pas comme une allergie, « Autre: lait » oui', () => {
    expect(allergenesFamille([{ nomComplet: 'A', allergiesConnues: ['RAS'] }])).toHaveLength(0);
    const [lait] = allergenesFamille([{ nomComplet: 'Awa K', allergiesConnues: ['Autre: Lait'] }]);
    expect(lait.regex.test('lait concentre')).toBe(true);
  });
});

describe('variété', () => {
  test('14 repas midi/soir sans doublon, des fruits le matin', () => {
    const r = composerSemaine({ plats: PLATS, aleatoire: graine(2), membres: [] });
    expect(new Set(midiSoir(r)).size).toBe(14);
    JOURS.forEach((d) => expect(['mangue', 'papaye', 'ananas', 'orange']).toContain(r.semaine[d].petitDejeuner));
  });
});

describe('santé', () => {
  test('moins de plats très salés avec une personne hypertendue', () => {
    const tresSale = ['ndole', 'eru', 'nkui', 'bouillon'];
    let sans = 0; let avec = 0;
    for (let s = 1; s <= 15; s++) {
      sans += midiSoir(composerSemaine({ plats: PLATS, aleatoire: graine(s), membres: [] })).filter((id) => tresSale.includes(id)).length;
      avec += midiSoir(composerSemaine({ plats: PLATS, aleatoire: graine(s), membres: [{ nomComplet: 'Maman B', antecedentsMedicaux: ['Hypertension'] }] })).filter((id) => tresSale.includes(id)).length;
    }
    expect(avec).toBeLessThan(sans);
  });

  test('conseils d’adaptation nominatifs pour la tension et le diabète', () => {
    const conditions = { hypertension: ['Maman'], diabete: ['Papa'] };
    expect(conseilsSante(PLATS.find((p) => p.id === 'nkui'), conditions)[0]).toMatch(/Tension \(Maman\)/);
    expect(conseilsSante(PLATS.find((p) => p.id === 'dg'), conditions).join(' ')).toMatch(/Diabète \(Papa\)/);
  });
});

describe('anti-gaspillage', () => {
  test('un produit qui se périme dans 2 jours est cuisiné en début de semaine', () => {
    const r = composerSemaine({
      plats: PLATS, aleatoire: graine(3), membres: [],
      stock: [{ id: 'g1', nom: 'Gombo', stockQuantity: 1, datePeremption: new Date(Date.now() + 2 * 864e5) }],
    });
    const jour = JOURS.findIndex((d) => [r.semaine[d].dejeuner, r.semaine[d].diner].includes('gombo'));
    expect(jour).toBeGreaterThanOrEqual(0);
    expect(jour).toBeLessThanOrEqual(2);
    expect(r.antiGaspi.map((a) => a.nom)).toContain('Gombo');
  });
});

describe('goûts et budget', () => {
  test('le plat préféré est au menu', () => {
    for (let s = 1; s <= 5; s++) {
      const r = composerSemaine({ plats: PLATS, aleatoire: graine(s), membres: [{ nomComplet: 'Valentin B', platsPreferes: ['dg'] }] });
      expect(ids(r)).toContain('dg');
    }
  });

  test('un budget serré fait baisser le coût, et un dépassement restant est annoncé', () => {
    const cout = (p) => ({ total: p.ingredientsNecessaires.length * 1000, connus: 1 });
    const libre = composerSemaine({ plats: PLATS, aleatoire: graine(4), membres: [], cout });
    const serre = composerSemaine({ plats: PLATS, aleatoire: graine(4), membres: [], cout, budget: 30000 });
    expect(serre.total).toBeLessThanOrEqual(libre.total);
    expect(serre.depassement).toBe(Math.max(0, serre.total - 30000));
  });
});
