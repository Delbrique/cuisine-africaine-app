// src/services/planningService.js
import { db } from '../firebase/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  orderBy,
  serverTimestamp, // Pour les dates de création automatiques
  getDoc
} from 'firebase/firestore';

const planningCollectionRef = collection(db, 'planningRepas');

/**
 * Crée un nouveau document de planning hebdomadaire.
 * @param {object} planningData - Les données du planning.
 * @returns {Promise<string>} L'ID du document créé.
 */
const createPlanning = async (planningData) => {
  try {
    const docRef = await addDoc(planningCollectionRef, {
      ...planningData,
      dateCreation: serverTimestamp() // Ajoute un timestamp du serveur
    });
    console.log('Document planning créé avec l\'ID : ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Erreur lors de la création du planning : ', e);
    throw e;
  }
};

/**
 * Récupère tous les plannings hebdomadaires.
 * Pourrait être filtré par utilisateur ou par période plus tard.
 * @returns {Promise<Array<object>>} Une liste de plannings.
 */
const getPlannings = async () => {
  try {
    // Ordonner par date de création ou de début de semaine si vous voulez le plus récent
    const q = query(planningCollectionRef, orderBy('semaineDebut', 'desc'));
    const data = await getDocs(q);
    return data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  } catch (e) {
    console.error('Erreur lors de la récupération des plannings : ', e);
    throw e;
  }
};

/**
 * Récupère un planning spécifique par son ID.
 * @param {string} id - L'ID du planning.
 * @returns {Promise<object|null>} L'objet planning ou null.
 */
const getPlanningById = async (id) => {
  try {
    const docRef = doc(db, 'planningRepas', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id };
    } else {
      console.log("Aucun document planning trouvé pour cet ID !");
      return null;
    }
  } catch (e) {
    console.error('Erreur lors de la récupération du planning par ID : ', e);
    throw e;
  }
};

/**
 * Met à jour un planning existant.
 * @param {string} id - L'ID du planning à mettre à jour.
 * @param {object} updatedData - Les données à mettre à jour.
 * @returns {Promise<void>}
 */
const updatePlanning = async (id, updatedData) => {
  try {
    const planningDoc = doc(db, 'planningRepas', id);
    await updateDoc(planningDoc, updatedData);
    console.log('Planning mis à jour avec succès : ', id);
  } catch (e) {
    console.error('Erreur lors de la mise à jour du planning : ', e);
    throw e;
  }
};

/**
 * Supprime un planning de Firestore.
 * @param {string} id - L'ID du planning à supprimer.
 * @returns {Promise<void>}
 */
const deletePlanning = async (id) => {
  try {
    const planningDoc = doc(db, 'planningRepas', id);
    await deleteDoc(planningDoc);
    console.log('Planning supprimé avec succès : ', id);
  } catch (e) {
    console.error('Erreur lors de la suppression du planning : ', e);
    throw e;
  }
};

/**
 * Récupère le planning le plus récent. Utile pour afficher le planning actuel.
 * @returns {Promise<object|null>} Le planning le plus récent ou null.
 */
const getMostRecentPlanning = async () => {
  try {
    // Récupère le planning avec la date de début de semaine la plus récente
    const q = query(planningCollectionRef, orderBy('semaineDebut', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { ...doc.data(), id: doc.id };
    } else {
      return null;
    }
  } catch (e) {
    console.error('Erreur lors de la récupération du planning le plus récent : ', e);
    throw e;
  }
};

export {
  createPlanning,
  getPlannings,
  getPlanningById,
  updatePlanning,
  deletePlanning,
  getMostRecentPlanning
};