// Listes de référence partagées par les écrans.

export const PLAT_CATEGORIES = [
  'Petit-déjeuner', 'Viande', 'Poisson', 'Volaille', 'Végétarien',
  'Légumes', 'Crudité', 'Fruit', 'Sauce', 'Autre',
];

// Couleur associée à chaque catégorie (clé de palette MUI).
export const CATEGORY_COLORS = {
  'Petit-déjeuner': 'gold',
  Viande: 'primary',
  Poisson: 'info',
  Volaille: 'warning',
  Végétarien: 'secondary',
  Légumes: 'secondary',
  Crudité: 'success',
  Fruit: 'gold',
  Sauce: 'primary',
  Dessert: 'gold',
  Boisson: 'info',
  Apéritif: 'warning',
  Dîner: 'primary',
  'Repas du soir': 'primary',
};

export const DIFFICULTES = ['Facile', 'Moyenne', 'Difficile'];

export const INGREDIENT_CATEGORIES = [
  'Légumes', 'Viandes', 'Poissons', 'Crustacés', 'Épices', 'Produits laitiers',
  'Céréales', 'Assaisonnement', 'Fruits', 'Condiment', 'Autres',
];

export const DECOUVERTE_CATEGORIES = ['Petit-déjeuner', 'Dîner', 'Repas du soir', 'Dessert', 'Apéritif', 'Boisson'];

export const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
export const REPAS = [
  { key: 'petitDejeuner', label: 'Petit-déjeuner', short: 'Matin' },
  { key: 'dejeuner', label: 'Déjeuner', short: 'Midi' },
  { key: 'diner', label: 'Dîner', short: 'Soir' },
];

export const SEXES = [
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
];
export const ROLES = ['Mère', 'Père', 'Enfant', 'Grand-parent'];
export const ANTECEDENTS = ['Diabète', 'Hypertension', 'Allergie alimentaire'];
export const ALLERGIES = ['Arachides', 'Gluten', 'Fruits de mer'];
export const PROFESSIONS = ['Salarié', 'Entrepreneur', 'Étudiant', 'Retraité', 'Sans emploi', 'Autre'];
export const SITUATIONS = ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Union Libre'];
export const GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const SUGGESTIONS = {
  langues: [
    'Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Arabe', 'Chinois', 'Russe',
    'Portugais', 'Japonais', 'Coréen', 'Hindi', 'Bambara', 'Swahili', 'Peul', 'Wolof',
    'Lingala', 'Tigrigna', 'Malgache', 'Ewondo', 'Fang', 'Bassa', 'Duala',
  ],
  couleurs: [
    'Bleu', 'Vert', 'Rouge', 'Jaune', 'Noir', 'Blanc', 'Rose', 'Violet', 'Orange', 'Gris',
    'Turquoise', 'Bordeaux', 'Beige', 'Cyan', 'Indigo', 'Marron', 'Or', 'Argent',
    'Corail', 'Lavande', 'Sable', 'Émeraude', 'Menthe', 'Caramel',
  ],
  films: [
    'Action', 'Aventure', 'Animation', 'Biopic', 'Comédie', 'Comédie romantique',
    'Drame', 'Documentaire', 'Espionnage', 'Fantastique', 'Guerre', 'Historique',
    'Horreur', 'Musical', 'Mystère', 'Policier', 'Romance', 'Science-fiction',
    'Sport', 'Super-héros', 'Suspense', 'Thriller', 'Western', 'Zombie', 'Satire',
  ],
  loisirs: [
    'Lecture', 'Écriture', 'Peinture', 'Dessin', 'Musique', 'Chant', 'Danse', 'Théâtre',
    'Photographie', 'Vidéos', 'Cuisine', 'Pâtisserie', 'Jardinage', 'Randonnée', 'Vélo',
    'Fitness', 'Yoga', 'Jeux vidéo', 'Jeux de société', 'Voyages', 'Plongée', 'Bricolage',
    'Modélisme', 'Astronomie', 'Pêche', 'Camping', 'Méditation', 'Blogging', 'Sport',
  ],
  animaux: [
    'Chien', 'Chat', 'Poisson', 'Tortue', 'Oiseau', 'Lapin', 'Hamster', 'Cochon d’Inde',
    'Furet', 'Cheval', 'Poney', 'Serpent', 'Lézard', 'Perroquet', 'Chinchilla',
    'Araignée', 'Souris', 'Rat', 'Canari', 'Cacatoès',
  ],
};
