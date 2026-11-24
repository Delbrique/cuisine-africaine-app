# Feuille de route — Cuisine Africaine

Objectif : l'application qui organise la cuisine des familles africaines — menus, marché et
budget en FCFA, adaptés à la santé de chacun.

Taille : **S** = quelques heures · **M** = 1 à 2 jours · **L** = plusieurs jours.
Cochez les cases au fur et à mesure (`[x]`).

---

## Phase 0 — Bases à sécuriser (obligatoire)

- [ ] **App Check « Fraud Defense » (reCAPTCHA Enterprise)** — avant le **21 janvier 2027**, date à laquelle Google applique App Check automatiquement à Firebase AI Logic (Découverte, Chef IA). **(M)**
  - [x] Clé reCAPTCHA Enterprise créée et application web enregistrée dans App Check (22/11/2026).
  - [x] IA passée par Firebase AI Logic : plus aucune clé Gemini dans le code du site.
  - [x] Jetons App Check obtenus sur le site en ligne.
  - [ ] Après 2-3 jours : vérifier dans la console (App Check > API) que les requêtes sont « vérifiées », puis **appliquer** pour Firebase AI Logic, puis pour Cloud Firestore.
  - [ ] Supprimer les anciennes clés Gemini dans Google Cloud (projet « Automatisation n8n ») une fois tous les téléphones à jour.
- [ ] Fiabiliser la connexion Google sur iPhone quand l'application est installée sur l'écran d'accueil. **(S)**
- [ ] Demander l'indexation de la page d'accueil dans Google Search Console. **(S)**
- [x] Nom de marque : **Libiyo — Le carnet de cuisine de la famille** (app renommée le 22/11/2026).
- [x] Adresse **https://libiyo.web.app** ; l'ancienne `cuisineafricaineapp.web.app` redirige (301) page par page.
- [ ] Search Console : ajouter la propriété `https://libiyo.web.app/` (fichier de validation déjà en ligne) et y envoyer `sitemap.xml`. **(S)**
- [ ] Acheter `libiyo.com` (libre au 22/11/2026), le brancher sur Firebase Hosting et rediriger `cuisineafricaineapp.web.app`. **(S)**
- [ ] Réserver @libiyo sur Instagram, Facebook, TikTok ; plus tard, déposer la marque à l'OAPI. **(S)**

## Phase 1 — Le marché et le budget (cœur de la différence)

### Prix réels en FCFA
- [x] Saisie des prix payés (« J'ai payé… ») : produit, prix, quantité, unité (kg, tas, botte…), lieu du répertoire.
- [x] Base de prix partagée et anonyme : médiane, plus bas, plus haut, par marché, sur 90 jours glissants ; conversion d'unités (g/kg, ml/l).
- [x] Prix de chaque article de la liste : prix de la famille, sinon prix relevés à Yaoundé (avec le nombre de relevés).
- [x] Budget de la semaine : plafond, dépensé (privé à la famille), reste, alerte si la liste dépasse.
- [x] Coût de chaque plat (carte et fiche), par ingrédient et par personne à table ; unités avec nombre comprises (« 400g », « 1 kg »).
- [x] Catalogue : ingrédients des 27 plats complétés et harmonisés pour 4 personnes (24/11/2026) ; 38 nouveaux ingrédients ajoutés au stock à 0.
- [ ] Stock de la famille BIYONG : harmoniser les unités ambiguës des anciens ingrédients (« 1 à 2 pièces », « 2 à 4 gousses »…) pour que leurs prix servent au coût des plats. **(S)**
- [ ] Historique et évolution des prix d'un produit (graphique), comparaison entre marchés. **(M)**

### Marché et supermarché le plus proche
- [x] Demander la position de l'utilisateur (avec son accord), ou la placer à la main sur la carte.
- [x] Répertoire de Yaoundé : 103 marchés et supermarchés issus d'OpenStreetMap, triés (doublons, lieux non alimentaires), « connus » marqués d'une étoile (`src/data/lieuxYaounde.json`).
- [ ] Compléter le répertoire : jours d'affluence, spécialités, horaires manquants ; signalement de lieux par les familles (avec validation). **(M)**
- [x] Recommandations : marché connu le plus proche et supermarché le plus proche (ex. près d'Ahala : marché Nsam, Santa Lucia Ahala) + liste triée par distance.
- [x] Carte dans l'application (Leaflet + OpenStreetMap, sans clé payante).
- [x] Itinéraire réel tracé sur la carte : distance et durée en voiture/moto ou à pied (OSRM, routing.openstreetmap.de).
- [x] Boutons « Y aller » : Google Maps, Waze. Yango : copie de la destination (pas de lien public sans identifiant de partenaire).
- [ ] Yango : s'inscrire au programme partenaires (yango.com/en_int/partner-program) pour obtenir un lien qui ouvre l'app avec la destination. **(S)**

### Planifier la sortie au marché
- [ ] Répartir la liste de marché par lieu (marché pour le frais, supermarché pour l'emballé). **(M)**
- [ ] Programmer la sortie : jour, heure, qui y va, rappel. **(S)**
- [ ] Liste utilisable sans réseau, partageable sur WhatsApp. **(M)**

## Phase 2 — L'intelligence au service de la famille

- [ ] Menu de la semaine généré en un clic : allergies, maladies, goûts, budget, stock en priorité. **(L)**
- [ ] Anti-gaspillage : plats proposés pour les produits qui se périment bientôt. **(M)**
- [ ] Santé à table : alertes et adaptations (hypertension, diabète…) — conseils, pas un avis médical. **(M)**
- [ ] Photo du frigo ou d'un ticket de caisse → mise à jour du stock par l'IA. **(L)**

## Phase 3 — La vie de famille

- [ ] Tâches : qui cuisine, qui va au marché, rappels et notifications. **(M)**
- [ ] Carnet de recettes de famille : vocal ou vidéo de la grand-mère, photos, anecdotes. **(L)**
- [ ] Invitation par lien pour rejoindre sa famille. **(M)**

## Phase 4 — Visibilité et croissance

- [ ] Pages recettes publiques (`/recettes/ndole`…) avec le balisage « Recette » de Google. **(M)**
- [ ] Catalogue : de 27 à plus de 150 plats d'Afrique centrale, de l'Ouest et de l'Est. **(L, en continu)**
- [ ] Version anglaise (Cameroun anglophone, Nigeria). **(M)**
- [ ] Mode diaspora : prix en euros, où trouver les ingrédients en Europe, substituts. **(M)**

## Phase 5 — Plus tard

- [ ] Paiement Mobile Money (MTN, Orange) pour une offre premium. **(L)**
- [ ] Commande ou livraison avec des marchés ou supermarchés partenaires. **(L)**
- [ ] Publication sur le Play Store à partir de la PWA. **(M)**

---

## Déjà fait

- [x] Familles privées et règles de sécurité Firestore (novembre 2026).
- [x] Catalogue de plats commun, ajout aux recettes de la famille.
- [x] Connexion Google : création automatique de la famille.
- [x] SEO : page d'accueil publique, sitemap, robots.txt, Search Console.
- [x] Chef IA : mémoire de la conversation et export PDF ; Découverte accélérée.
