// src/services/membreService.js

import { db } from '../firebase/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

const membresCollectionRef = collection(db, 'membresFamille');

/**
 * Crée un nouveau membre de la famille dans Firestore.
 * @param {object} membreData - Les données du membre (nom, age, etc.).
 * @returns {Promise<void>}
 */
const createMembre = async (membreData) => {
  try {
    const membreDocRef = doc(membresCollectionRef, membreData.uid || membreData.email);
    await setDoc(membreDocRef, membreData);
    console.log(`Document membre créé avec l'ID : ${membreData.uid || membreData.email}`);
  } catch (e) {
    console.error('Erreur lors de la création du membre : ', e);
    throw e;
  }
};

/**
 * Récupère tous les membres de la famille depuis Firestore.
 * @returns {Promise<Array<object>>} Une liste d'objets membre avec leurs IDs.
 */
const getMembres = async () => {
  try {
    const data = await getDocs(membresCollectionRef);
    return data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  } catch (e) {
    console.error('Erreur lors de la récupération des membres : ', e);
    throw e;
  }
};


/**
 * Récupère un membre de la famille spécifique par son ID.
 * @param {string} id - L'ID du membre.
 * @returns {Promise<object|null>} L'objet membre ou null si non trouvé.
 */
const getMembreById = async (id) => {
  try {
    const docRef = doc(db, 'membresFamille', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id };
    } else {
      console.log("Aucun document trouvé pour cet ID !");
      return null;
    }
  } catch (e) {
    console.error('Erreur lors de la récupération du membre : ', e);
    throw e;
  }
};

/**
 * Met à jour un membre de la famille existant dans Firestore.
 * @param {string} id - L'ID du membre à mettre à jour.
 * @param {object} updatedData - Les données à mettre à jour.
 * @returns {Promise<void>}
 */
const updateMembre = async (id, updatedData) => {
  try {
    const membreDoc = doc(db, 'membresFamille', id);
    await updateDoc(membreDoc, updatedData);
    console.log('Membre mis à jour avec succès : ', id);
  } catch (e) {
    console.error('Erreur lors de la mise à jour du membre : ', e);
    throw e;
  }
};

/**
 * Supprime un membre de la famille de Firestore.
 * @param {string} id - L'ID du membre à supprimer.
 * @returns {Promise<void>}
 */
const deleteMembre = async (id) => {
  try {
    const membreDoc = doc(db, 'membresFamille', id);
    await deleteDoc(membreDoc);
    console.log('Membre supprimé avec succès : ', id);
  } catch (e) {
    console.error('Erreur lors de la suppression du membre : ', e);
    throw e;
  }
};

export {
  createMembre,
  getMembres, // <-- Assurez-vous que getMembres est bien exporté ici
  getMembreById,
  updateMembre,
  deleteMembre
};