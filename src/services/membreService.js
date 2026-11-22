// src/services/membreService.js
// Membres de la famille du compte connecté. Une famille ne voit jamais les membres d'une autre.
import { db, auth } from '../firebase/firebase';
import {
  collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { currentFamilleId, invitedMemberId, normalizeEmail } from './familleService';

const membresCollectionRef = collection(db, 'membresFamille');

// Champs qu'aucun formulaire ne doit pouvoir modifier.
const PROTECTED = ['familleId', 'compteUid', 'admin', 'inviteId', 'createdAt', 'joinedAt'];
const withoutProtected = (data) => {
  const copy = { ...data };
  PROTECTED.forEach((k) => delete copy[k]);
  return copy;
};

/**
 * Ajoute un membre à la famille du compte connecté.
 * - sa propre fiche (uid du compte) → document `membresFamille/{uid}` ;
 * - un proche → document `membresFamille/{familleId}__{email}`. S'il se connecte plus tard avec
 *   Google sous cet e-mail, il rejoint automatiquement cette famille.
 */
const createMembre = async (membreData) => {
  const familleId = currentFamilleId();
  const isOwnProfile = membreData.uid && membreData.uid === auth.currentUser?.uid;
  const email = normalizeEmail(membreData.email);
  const id = isOwnProfile ? membreData.uid : invitedMemberId(familleId, email);
  if (!isOwnProfile) {
    const existing = await getDoc(doc(db, 'membresFamille', id));
    if (existing.exists()) throw new Error('Un membre avec cet e-mail existe déjà dans votre famille.');
  }
  await setDoc(doc(membresCollectionRef, id), {
    ...withoutProtected(membreData),
    email,
    uid: id,
    familleId,
    createdAt: serverTimestamp(),
  });
  return id;
};

/** Membres de la famille du compte connecté. */
const getMembres = async () => {
  const q = query(membresCollectionRef, where('familleId', '==', currentFamilleId()));
  const data = await getDocs(q);
  return data.docs.map((d) => ({ ...d.data(), id: d.id }));
};

/** Un membre de la famille (null s'il n'existe pas ou n'appartient pas à la famille). */
const getMembreById = async (id) => {
  try {
    const snap = await getDoc(doc(db, 'membresFamille', id));
    if (!snap.exists() || snap.data().familleId !== currentFamilleId()) return null;
    return { ...snap.data(), id: snap.id };
  } catch (e) {
    if (e.code === 'permission-denied') return null;
    throw e;
  }
};

const updateMembre = async (id, updatedData) => {
  const data = withoutProtected(updatedData);
  if (data.email !== undefined) data.email = normalizeEmail(data.email);
  await updateDoc(doc(db, 'membresFamille', id), data);
};

const deleteMembre = async (id) => {
  if (id === auth.currentUser?.uid) throw new Error('Vous ne pouvez pas supprimer votre propre fiche.');
  await deleteDoc(doc(db, 'membresFamille', id));
};

export { createMembre, getMembres, getMembreById, updateMembre, deleteMembre };
