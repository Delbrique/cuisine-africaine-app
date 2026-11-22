// src/services/planningService.js
// Plannings hebdomadaires de la famille du compte connecté.
import { db } from '../firebase/firebase';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { currentFamilleId } from './familleService';

const planningCollectionRef = collection(db, 'planningRepas');

const strip = (data) => {
  const copy = { ...data };
  delete copy.familleId;
  delete copy.id;
  return copy;
};

const createPlanning = async (planningData) => {
  const docRef = await addDoc(planningCollectionRef, {
    ...strip(planningData),
    familleId: currentFamilleId(),
    dateCreation: serverTimestamp(),
  });
  return docRef.id;
};

/** Plannings de la famille, du plus récent au plus ancien (tri local : pas d'index composite requis). */
const getPlannings = async () => {
  const q = query(planningCollectionRef, where('familleId', '==', currentFamilleId()));
  const data = await getDocs(q);
  return data.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .sort((a, b) => String(b.semaineDebut || '').localeCompare(String(a.semaineDebut || '')));
};

const getPlanningById = async (id) => {
  try {
    const snap = await getDoc(doc(db, 'planningRepas', id));
    if (!snap.exists() || snap.data().familleId !== currentFamilleId()) return null;
    return { ...snap.data(), id: snap.id };
  } catch (e) {
    if (e.code === 'permission-denied') return null;
    throw e;
  }
};

const updatePlanning = async (id, updatedData) => {
  await updateDoc(doc(db, 'planningRepas', id), strip(updatedData));
};

const deletePlanning = async (id) => {
  await deleteDoc(doc(db, 'planningRepas', id));
};

/** Planning le plus récent de la famille, ou null. */
const getMostRecentPlanning = async () => (await getPlannings())[0] || null;

export {
  createPlanning,
  getPlannings,
  getPlanningById,
  updatePlanning,
  deletePlanning,
  getMostRecentPlanning,
};
