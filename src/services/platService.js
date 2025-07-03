// src/services/platService.js
import { db } from '../firebase/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';

const platsCollectionRef = collection(db, 'plats');

/**
 * Crée un nouveau plat dans Firestore.
 * @param {object} platData - Les données du plat (nom, description, photoURL, tempsPreparation, tempsCuisson, difficulte, instructions, ingredientsNecessaires).
 * @returns {Promise<string>} L'ID du document créé.
 */
const createPlat = async (platData) => {
  try {
    const docRef = await addDoc(platsCollectionRef, platData);
    console.log('Document plat créé avec l\'ID : ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Erreur lors de la création du plat : ', e);
    throw e;
  }
};

/**
 * Récupère tous les plats depuis Firestore.
 * @returns {Promise<Array<object>>} Une liste d'objets plat avec leurs IDs.
 */
const getPlats = async () => {
  try {
    const data = await getDocs(platsCollectionRef);
    return data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  } catch (e) {
    console.error('Erreur lors de la récupération des plats : ', e);
    throw e;
  }
};

/**
 * Récupère un plat spécifique par son ID.
 * @param {string} id - L'ID du plat.
 * @returns {Promise<object|null>} L'objet plat ou null si non trouvé.
 */
const getPlatById = async (id) => {
  try {
    const docRef = doc(db, 'plats', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id };
    } else {
      console.log("Aucun document plat trouvé pour cet ID !");
      return null;
    }
  } catch (e) {
    console.error('Erreur lors de la récupération du plat par ID : ', e);
    throw e;
  }
};

/**
 * Met à jour un plat existant dans Firestore.
 * @param {string} id - L'ID du plat à mettre à jour.
 * @param {object} updatedData - Les données à mettre à jour.
 * @returns {Promise<void>}
 */
const updatePlat = async (id, updatedData) => {
  try {
    const platDoc = doc(db, 'plats', id);
    await updateDoc(platDoc, updatedData);
    console.log('Plat mis à jour avec succès : ', id);
  } catch (e) {
    console.error('Erreur lors de la mise à jour du plat : ', e);
    throw e;
  }
};

/**
 * Supprime un plat de Firestore.
 * @param {string} id - L'ID du plat à supprimer.
 * @returns {Promise<void>}
 */
const deletePlat = async (id) => {
  try {
    const platDoc = doc(db, 'plats', id);
    await deleteDoc(platDoc);
    console.log('Plat supprimé avec succès : ', id);
  } catch (e) {
    console.error('Erreur lors de la suppression du plat : ', e);
    throw e;
  }
};

export {
  createPlat,
  getPlats,
  getPlatById,
  updatePlat,
  deletePlat
};