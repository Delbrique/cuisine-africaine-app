// src/services/ingredientService.js
import { db } from '../firebase/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';

const ingredientsCollectionRef = collection(db, 'ingredients');

// Define ingredient status constants
export const INGREDIENT_STATUS = {
  NOT_USED: 'non_utilise',
  IN_USE: 'en_cours_utilisation',
  EXHAUSTED: 'epuise',
  EXPIRED: 'expire',
  LOW_STOCK: 'faible_stock',
};

/**
 * Crée un nouvel ingrédient dans Firestore.
 * @param {object} ingredientData - Les données de l'ingrédient (nom, uniteMesure, photoURL, categorie).
 * @returns {Promise<string>} L'ID du document créé.
 */
const createIngredient = async (ingredientData) => {
  try {
    // Set default stock-related values if not provided
    const dataToSave = {
      ...ingredientData,
      stockQuantity: ingredientData.stockQuantity !== undefined ? parseFloat(ingredientData.stockQuantity) : 0,
      datePeremption: ingredientData.datePeremption || null, // Firebase Timestamp or null
      seuilMinimum: ingredientData.seuilMinimum !== undefined ? parseFloat(ingredientData.seuilMinimum) : 0,
      status: ingredientData.status || INGREDIENT_STATUS.NOT_USED, // Default status for new ingredient
      totalConsumedQuantity: ingredientData.totalConsumedQuantity !== undefined ? parseFloat(ingredientData.totalConsumedQuantity) : 0,
    };
    const docRef = await addDoc(ingredientsCollectionRef, dataToSave);
    console.log('Document ingrédient créé avec l\'ID : ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Erreur lors de la création de l\'ingrédient : ', e);
    throw e;
  }
};

/**
 * Récupère tous les ingrédients depuis Firestore.
 * @returns {Promise<Array<object>>} Une liste d'objets ingrédient avec leurs IDs.
 */
const getIngredients = async () => {
  try {
    const data = await getDocs(ingredientsCollectionRef);
    return data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  } catch (e) {
    console.error('Erreur lors de la récupération des ingrédients : ', e);
    throw e;
  }
};

/**
 * Écoute les ingrédients en temps réel : `onData` est rappelé à chaque modification.
 * @returns {function} Fonction à appeler pour arrêter l'écoute.
 */
const listenIngredients = (onData, onError) =>
  onSnapshot(
    ingredientsCollectionRef,
    (snap) => onData(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
    (e) => {
      console.error("Erreur lors de l'écoute des ingrédients : ", e);
      onError?.(e);
    }
  );

/**
 * Récupère un ingrédient spécifique par son ID.
 * @param {string} id - L'ID de l'ingrédient.
 * @returns {Promise<object|null>} L'objet ingrédient ou null si non trouvé.
 */
const getIngredientById = async (id) => {
  try {
    const docRef = doc(db, 'ingredients', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id };
    } else {
      console.log("Aucun document ingrédient trouvé pour cet ID !");
      return null;
    }
  } catch (e) {
    console.error('Erreur lors de la récupération de l\'ingrédient par ID : ', e);
    throw e;
  }
};

/**
 * Met à jour un ingrédient existant dans Firestore.
 * @param {string} id - L'ID de l'ingrédient à mettre à jour.
 * @param {object} updatedData - Les données à mettre à jour.
 * @returns {Promise<void>}
 */
const updateIngredient = async (id, updatedData) => {
  try {
    const ingredientDoc = doc(db, 'ingredients', id);
    await updateDoc(ingredientDoc, updatedData);
    console.log('Ingrédient mis à jour avec succès : ', id);
  } catch (e) {
    console.error('Erreur lors de la mise à jour de l\'ingrédient : ', e);
    throw e;
  }
};

/**
 * Met à jour la quantité en stock d'un ingrédient et son statut.
 * @param {string} ingredientId - L'ID de l'ingrédient.
 * @param {number} quantityChange - La quantité à ajouter (positif) ou à soustraire (négatif).
 * @param {string} [initialStatus] - Statut initial de l'ingrédient avant la mise à jour (optionnel, pour affiner la logique de statut).
 * @returns {Promise<void>}
 */
const updateIngredientStock = async (ingredientId, quantityChange, initialStatus = null) => {
  try {
    const ingredientRef = doc(db, 'ingredients', ingredientId);
    const docSnap = await getDoc(ingredientRef);

    if (!docSnap.exists()) {
      throw new Error("Ingrédient non trouvé.");
    }

    const currentData = docSnap.data();
    const currentStock = currentData.stockQuantity || 0;
    const newStock = currentStock + quantityChange;
    const seuilMinimum = currentData.seuilMinimum || 0;
    const currentTotalConsumed = currentData.totalConsumedQuantity || 0;

    let newStatus = currentData.status;

    // Logic for status update
    if (newStock <= 0) {
      newStatus = INGREDIENT_STATUS.EXHAUSTED;
    } else if (newStock < seuilMinimum) {
      newStatus = INGREDIENT_STATUS.LOW_STOCK;
    } else if (initialStatus === INGREDIENT_STATUS.NOT_USED && newStock > 0) {
      // If it was 'not used' and now has stock (e.g., first purchase/addition), set to 'in use'
      newStatus = INGREDIENT_STATUS.IN_USE;
    } else if (initialStatus === INGREDIENT_STATUS.EXHAUSTED && newStock > 0) {
      // If it was exhausted and now has stock, set to 'in use'
      newStatus = INGREDIENT_STATUS.IN_USE;
    } else if (newStock > 0 && newStatus === INGREDIENT_STATUS.EXPIRED) {
      // If new stock is added to an expired item, and it's no longer expired
      // (implies new batch, requires datePeremption update too for proper flow)
      // For now, if stock is added, and it's not truly expired by date, move to IN_USE.
      const expirationDate = currentData.datePeremption ? new Date(currentData.datePeremption.seconds * 1000) : null;
      if (!expirationDate || expirationDate > new Date()) {
        newStatus = INGREDIENT_STATUS.IN_USE;
      }
    } else if (newStock > 0 && newStatus === INGREDIENT_STATUS.NOT_USED && quantityChange > 0) {
        newStatus = INGREDIENT_STATUS.IN_USE;
    }


    const updateData = {
      stockQuantity: newStock,
      status: newStatus,
    };

    if (quantityChange < 0) {
        updateData.totalConsumedQuantity = currentTotalConsumed + Math.abs(quantityChange);
    }


    await updateDoc(ingredientRef, updateData);
    console.log(`Stock et statut de l'ingrédient ${ingredientId} mis à jour.`);
  } catch (e) {
    console.error('Erreur lors de la mise à jour du stock de l\'ingrédient : ', e);
    throw e;
  }
};

/**
 * Supprime un ingrédient de Firestore.
 * @param {string} id - L'ID de l'ingrédient à supprimer.
 * @returns {Promise<void>}
 */
const deleteIngredient = async (id) => {
  try {
    const ingredientDoc = doc(db, 'ingredients', id);
    await deleteDoc(ingredientDoc);
    console.log('Ingrédient supprimé avec succès : ', id);
  } catch (e) {
    console.error('Erreur lors de la suppression de l\'ingrédient : ', e);
    throw e;
  }
};

export {
  createIngredient,
  getIngredients,
  listenIngredients,
  getIngredientById,
  updateIngredient,
  deleteIngredient,
  updateIngredientStock,
};