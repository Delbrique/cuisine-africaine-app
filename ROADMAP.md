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
- [ ] Saisie des prix payés : produit, prix, unité (tas, kilo, botte…), marché, date. **(M)**
- [ ] Base de prix par ville et par marché, alimentée par les familles (moyenne, plus bas, évolution). **(M)**
- [ ] Coût de chaque plat et de chaque portion. **(S)**
- [ ] Budget de la semaine : plafond, dépensé, reste, alerte de dépassement. **(M)**

### Marché et supermarché le plus proche
- [ ] Demander la position de l'utilisateur (avec son accord). **(S)**
- [ ] Répertoire des marchés et supermarchés : liste vérifiée pour Yaoundé (marché Nsam, Santa Lucia Ahala, Mokolo, Mfoundi, Mvog-Mbi, Essos…) avec coordonnées GPS, horaires, jours d'affluence et spécialités ; complétée par OpenStreetMap puis par les familles (avec validation). **(M)**
- [ ] Les 3 lieux les plus proches, le plus connu mis en avant, avec la distance (ex. depuis la Barrière : marché Nsam, Santa Lucia Ahala). **(S)**
- [ ] Carte dans l'application (Leaflet + OpenStreetMap, sans clé payante). **(M)**
- [ ] Itinéraire réel tracé sur la carte : distance et durée à pied, en voiture, à moto (OpenRouteService ou OSRM). **(M)**
- [ ] Bouton « Y aller » : ouvre Google Maps, Waze ou Yango pour le guidage vocal. **(S)**

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
