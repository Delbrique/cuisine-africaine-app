// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions'; // Importe le module Functions
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDb4J3ey6rieKTF7bXV3bec24Du-caEmQc",
    authDomain: "cuisineafricaineapp.firebaseapp.com",
    projectId: "cuisineafricaineapp",
    storageBucket: "cuisineafricaineapp.firebasestorage.app", // Ce champ sera toujours là, mais on n'initialise pas getStorage
    messagingSenderId: "760302547314",
    appId: "1:760302547314:web:8e5dfc6b01c1a06091edeb"
};

// Initialise Firebase
const firebaseApp = initializeApp(firebaseConfig);

// App Check (reCAPTCHA Enterprise / « Fraud Defense ») : prouve que chaque requête vient bien
// de NOTRE application, et non d'un script qui aurait copié la configuration ci-dessus.
// Protège Firestore et l'IA (Firebase AI Logic). Invisible pour l'utilisateur.
// La clé de site est publique ; elle n'est valable que sur nos domaines.
const RECAPTCHA_ENTERPRISE_SITE_KEY = '6LcVAywuAAAAAEpPEMSsXd5Dst7tUDPMd4kA3izR';
if (typeof window !== 'undefined') {
  // En développement (localhost), un jeton de débogage s'affiche dans la console du navigateur :
  // l'enregistrer dans la console Firebase > App Check > Applications > Gérer les jetons de débogage.
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-restricted-globals
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.REACT_APP_APPCHECK_DEBUG_TOKEN || true;
  }
  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_ENTERPRISE_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

// Initialise Firestore
const db = getFirestore(firebaseApp);

// Initialise l'authentification
const auth = getAuth(firebaseApp);

// Initialise Functions
const functions = getFunctions(firebaseApp);

const storage = getStorage(firebaseApp);

// Exportez tous les services et l'instance de l'application que vous utiliserez
// 'storage' n'est plus exporté ni initialisé
export { firebaseApp, db, auth, functions, storage };