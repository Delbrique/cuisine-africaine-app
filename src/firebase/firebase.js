// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
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