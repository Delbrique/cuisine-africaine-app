// Conversion entre le document Firestore d'un membre et l'état du formulaire.
// Le format stocké est inchangé : listes avec « RAS » exclusif et entrées « Autre: … ».

export const emptyMember = () => ({
  email: '',
  nomComplet: '',
  age: '',
  sexe: 'homme',
  antecedentsMedicaux: [],
  autreAntecedent: '',
  roleFamille: [],
  autreRoleFamille: '',
  photoProfil: '',
  platsPreferes: [],
  taille: '',
  poids: '',
  groupeSanguin: '',
  telephone: '',
  allergiesConnues: [],
  autreAllergie: '',
  profession: '',
  niveauEtude: '',
  autreProfession: '',
  situationMatrimoniale: '',
  dateNaissance: '',
  lieuNaissance: '',
  languesParlees: '',
  nationalite: '',
  nomCompletContactUrgence: '',
  relationContactUrgence: '',
  telephoneContactUrgence: '',
  couleurPreferee: '',
  filmSeriePrefere: '',
  loisirsHobbies: [],
  animauxCompagnie: '',
});

const AUTRE = 'Autre: ';

// Sépare une liste stockée en (choix, texte « Autre »). 'Autre' est ajouté aux choix s'il y a un texte.
const splitOther = (list = []) => {
  const other = list.find((x) => typeof x === 'string' && x.startsWith(AUTRE));
  const choices = list.filter((x) => !(typeof x === 'string' && x.startsWith(AUTRE)));
  return other ? [[...choices, 'Autre'], other.slice(AUTRE.length)] : [choices, ''];
};

// Recompose la liste stockée. `ras` : renvoie ['RAS'] si rien n'est coché.
const joinOther = (choices = [], otherText = '', ras = false) => {
  let out = choices.filter((x) => x !== 'Autre');
  if (choices.includes('Autre') && otherText.trim()) {
    out = out.filter((x) => x !== 'RAS');
    out.push(`${AUTRE}${otherText.trim()}`);
  }
  if (ras && out.length === 0) out = ['RAS'];
  return out;
};

/** Gère l'exclusivité de « RAS » dans une sélection à puces. */
export const withRas = (prev = [], next = []) => {
  const added = next.find((x) => !prev.includes(x));
  if (added === 'RAS') return ['RAS'];
  if (added) return next.filter((x) => x !== 'RAS');
  return next;
};

export const fromMembre = (m = {}) => {
  const [antecedentsMedicaux, autreAntecedent] = splitOther(m.antecedentsMedicaux);
  const [roleFamille, autreRoleFamille] = splitOther(m.roleFamille);
  const [allergiesConnues, autreAllergie] = splitOther(m.allergiesConnues);

  let profession = m.profession || '';
  let niveauEtude = '';
  let autreProfession = '';
  if (profession.startsWith(AUTRE)) {
    autreProfession = profession.slice(AUTRE.length);
    profession = 'Autre';
  } else if (profession.startsWith('Étudiant (Niveau: ')) {
    niveauEtude = profession.replace('Étudiant (Niveau: ', '').slice(0, -1);
    profession = 'Étudiant';
  }

  const base = emptyMember();
  const merged = Object.fromEntries(Object.keys(base).map((k) => [k, m[k] ?? base[k]]));
  return {
    ...merged,
    antecedentsMedicaux,
    autreAntecedent,
    roleFamille,
    autreRoleFamille,
    allergiesConnues,
    autreAllergie,
    profession,
    niveauEtude,
    autreProfession,
    loisirsHobbies: Array.isArray(m.loisirsHobbies) ? m.loisirsHobbies : m.loisirsHobbies ? [m.loisirsHobbies] : [],
    platsPreferes: m.platsPreferes || [],
  };
};

/** Données à enregistrer. `basic` : uniquement les champs du formulaire d'inscription. */
export const toMembre = (f, { basic = false } = {}) => {
  const core = {
    email: f.email,
    nomComplet: f.nomComplet.trim(),
    age: parseInt(f.age, 10) || 0,
    sexe: f.sexe,
    antecedentsMedicaux: joinOther(f.antecedentsMedicaux, f.autreAntecedent, true),
    roleFamille: joinOther(f.roleFamille, f.autreRoleFamille),
    photoProfil: f.photoProfil,
    platsPreferes: f.platsPreferes || [],
  };
  if (basic) return core;

  let profession = f.profession;
  if (f.profession === 'Étudiant' && f.niveauEtude.trim()) profession = `Étudiant (Niveau: ${f.niveauEtude.trim()})`;
  else if (f.profession === 'Autre' && f.autreProfession.trim()) profession = `${AUTRE}${f.autreProfession.trim()}`;

  return {
    ...core,
    allergiesConnues: joinOther(f.allergiesConnues, f.autreAllergie, true),
    profession,
    taille: f.taille,
    poids: f.poids,
    groupeSanguin: f.groupeSanguin,
    telephone: f.telephone,
    situationMatrimoniale: f.situationMatrimoniale,
    dateNaissance: f.dateNaissance,
    lieuNaissance: f.lieuNaissance,
    languesParlees: f.languesParlees,
    nationalite: f.nationalite,
    nomCompletContactUrgence: f.nomCompletContactUrgence,
    relationContactUrgence: f.relationContactUrgence,
    telephoneContactUrgence: f.telephoneContactUrgence,
    couleurPreferee: f.couleurPreferee,
    filmSeriePrefere: f.filmSeriePrefere,
    loisirsHobbies: (f.loisirsHobbies || []).filter(Boolean),
    animauxCompagnie: f.animauxCompagnie,
  };
};

/** Libellé lisible d'une entrée de liste (« Autre: X » → « X »). */
export const label = (x = '') => (x.startsWith(AUTRE) ? x.slice(AUTRE.length) : x);
