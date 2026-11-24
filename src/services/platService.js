// src/services/platService.js
// Deux sortes de plats :
//  - les plats de la famille (privés) : `familleId` = famille du compte ;
//  - le catalogue de l'application (`public: true`) : visible par tous, chaque famille peut
//    en ajouter une copie à ses plats.
import { db, auth } from '../firebase/firebase';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { currentFamilleId } from './familleService';
import { getIngredients, createIngredient } from './ingredientService';
import { cleProduit } from './prixService';

const platsCollectionRef = collection(db, 'plats');

const PROTECTED = ['familleId', 'public', 'createdBy', 'createdAt', 'catalogueId', 'id'];
const withoutProtected = (data) => {
  const copy = { ...data };
  PROTECTED.forEach((k) => delete copy[k]);
  return copy;
};

/** Crée un plat privé dans la famille du compte connecté. */
const createPlat = async (platData) => {
  const docRef = await addDoc(platsCollectionRef, {
    ...withoutProtected(platData),
    familleId: currentFamilleId(),
    public: false,
    createdBy: auth.currentUser?.uid || null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/** Plats de la famille du compte connecté. */
const getPlats = async () => {
  const q = query(platsCollectionRef, where('familleId', '==', currentFamilleId()));
  const data = await getDocs(q);
  return data.docs.map((d) => ({ ...d.data(), id: d.id }));
};

/** Catalogue de l'application (accessible à tous). */
const getCatalogue = async () => {
  const q = query(platsCollectionRef, where('public', '==', true));
  const data = await getDocs(q);
  return data.docs.map((d) => ({ ...d.data(), id: d.id }));
};

const getPlatById = async (id) => {
  try {
    const snap = await getDoc(doc(db, 'plats', id));
    if (!snap.exists()) return null;
    const p = snap.data();
    if (!p.public && p.familleId !== currentFamilleId()) return null;
    return { ...p, id: snap.id };
  } catch (e) {
    if (e.code === 'permission-denied') return null;
    throw e;
  }
};

const updatePlat = async (id, updatedData) => {
  await updateDoc(doc(db, 'plats', id), withoutProtected(updatedData));
};

const deletePlat = async (id) => {
  await deleteDoc(doc(db, 'plats', id));
};

/**
 * Ajoute un plat du catalogue aux plats de la famille. Les ingrédients sont rattachés au stock
 * de la famille (par nom, au singulier) ; ceux qui manquent sont créés avec un stock à 0.
 *
 * Les ajouts passent dans une FILE : si l'on ajoute plusieurs plats très vite, chacun voit les
 * ingrédients créés par le précédent (sinon « Cube » était créé une fois par plat : doublons).
 */
let file = Promise.resolve();
const addFromCatalogue = (plat) => {
  const tache = file.then(() => ajouterDepuisCatalogue(plat));
  file = tache.catch(() => {}); // une erreur n'empêche pas les ajouts suivants
  return tache;
};

const ajouterDepuisCatalogue = async (plat) => {
  const familleIngredients = await getIngredients();
  const byName = new Map(familleIngredients.map((i) => [cleProduit(i.nom || ''), i]));
  const ingredientsNecessaires = [];
  for (const ing of plat.ingredientsNecessaires || []) {
    const key = cleProduit(ing.nom || '');
    if (!key) continue;
    let local = byName.get(key);
    if (!local) {
      const id = await createIngredient({ nom: ing.nom, uniteMesure: ing.uniteMesure || '', categorie: ing.categorie || '' });
      local = { id, nom: ing.nom, uniteMesure: ing.uniteMesure || '' };
      byName.set(key, local);
    }
    ingredientsNecessaires.push({ ...ing, ingredientId: local.id });
  }
  const { id: catalogueId, ...rest } = plat;
  const newId = await createPlat({ ...rest, ingredientsNecessaires });
  await updateDoc(doc(db, 'plats', newId), { catalogueId });
  return newId;
};

export { createPlat, getPlats, getCatalogue, getPlatById, updatePlat, deletePlat, addFromCatalogue };
