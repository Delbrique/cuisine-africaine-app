# Refonte UI/UX — Cuisine Africaine

## 1. Identité & fondations
- [x] Logo dédié (SVG) + déclinaisons : favicon, icônes PWA 192/512, icône maskable, apple-touch-icon
- [x] Palette « terre d'Afrique » (terracotta, ocre, vert palmier, crème, cacao) + mode sombre
- [x] Typographies : Fraunces (titres) + Plus Jakarta Sans (texte), embarquées hors-ligne
- [x] Thème MUI complet (boutons, cartes, champs, dialogues, chips, tableaux…)
- [x] Composants partagés : PageHeader, EmptyState, ConfirmDialog, ChipSelect, PhotoPicker, StatCard, Logo
- [x] Notifications toast (notistack) à la place des bandeaux Alert
- [x] Remplacer tous les `window.confirm` / `window.prompt` par de vrais dialogues

## 2. Coquille de l'application
- [x] Nouvelle navigation desktop : sidebar groupée (Famille / Cuisine / Organisation / Communauté) + carte utilisateur
- [x] Navigation mobile : barre du haut + barre d'onglets en bas (style app native)
- [x] Bascule clair / sombre (menu du compte + bouton soleil/lune + barre d'état PWA synchronisée)
- [x] Routes : redirection auto si connecté, chat protégé et intégré au tableau de bord
- [x] Chargement paresseux des pages (lazy) + écran de chargement de marque

## 3. PWA
- [x] manifest.json complet (nom, couleurs, icônes, raccourcis, orientation)
- [x] index.html : meta iOS/Android, theme-color, langue fr, description
- [x] Service worker Workbox (pré-cache + cache runtime, fonctionne hors-ligne)
- [x] Bouton « Installer l'application »
- [x] Safe areas (encoche iPhone), affichage standalone soigné
- [x] Script `npm run serve:pwa` pour tester la PWA en local

## 4. Écrans
- [x] Connexion (split-screen avec vidéo, messages d'erreur lisibles, mot de passe visible)
- [x] Inscription (formulaire en étapes)
- [x] Configuration de la famille
- [x] Accueil (nouveau) : repas du jour, chiffres clés, alertes stock, actions rapides
- [x] Membres : cartes compactes + fiche détaillée
- [x] Ajout / modification de membre (formulaire en sections, puces)
- [x] Plats : galerie photo, filtres, fiche recette, éditeur
- [x] Ingrédients : grille + recherche + filtres
- [x] Stock : indicateurs, filtres par statut, tableau desktop / cartes mobile, ajustement rapide
- [x] Planning : tableau de la semaine visuel, sélecteur de plat avec photos, PDF
- [x] Liste de marché : progression, total, regroupement, actions
- [x] Recherche & Assistant IA : recherche + chat modernisé
- [x] Découverte : cartes magazine, squelettes de chargement, image de repli locale
- [x] Messagerie : liste des groupes + conversation, dialogues de groupe

## 5. Corrections relevées pendant l'audit
- [x] Cartes de plats : affichaient les ingrédients du formulaire au lieu de ceux du plat
- [x] Chat accessible sans connexion (route hors garde)
- [x] Clé API Gemini affichée dans la console
- [x] Images de repli `via.placeholder.com` (service mort)
- [x] E-mail liste de marché : `membre.nom` inexistant → `nomComplet`
- [x] Double upload des pièces jointes du chat
- [x] Doublon du formulaire membre (dialogue dans la liste + page dédiée)
- [x] PDF de la liste de marché qui plantait (`doc.output('blob')` n'est pas une promesse)
- [x] Photos stockées en base64 non compressées (risque de dépasser 1 Mo par document Firestore)

## 6. Vérification
- [x] `npm run build` sans erreur
- [x] Test visuel desktop + mobile en localhost
- [x] Service worker et manifest générés par le build (vérifié)
- [ ] Test PWA réel : installation + hors-ligne dans un navigateur (`npm run serve:pwa`)

## Reste à faire (hors périmètre ou à décider)
- [ ] Tester l'installation PWA sur un vrai téléphone (Android + iPhone)
- [ ] Mettre à jour le modèle Gemini gemini-1.5-flash (ancien) dans Recherche et Découverte
- [ ] Supprimer les fichiers morts src/pages/FamilleDashboardPage.js et src/pages/MembreFamillePage.js (plus importés nulle part)
- [ ] Rafraîchir la liste des groupes après modification d'un groupe (le service n'écoute que les membres)
