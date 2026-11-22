// src/services/familleService.js
// Gestion des familles : chaque compte appartient à UNE famille privée.
//
//   familles/{familleId}          → { nom, ownerUid, createdAt }
//   membresFamille/{uid}          → fiche d'un compte (familleId = sa famille)
//   membresFamille/{familleId}__{email} → membre ajouté par la famille (sans compte, ou invité)
//
// Toutes les données privées (membres, planning, stock, plats perso, groupes) portent un
// champ `familleId`. Les services filtrent automatiquement sur la famille de la session,
// et les règles Firestore (firestore.rules) l'imposent côté serveur.
import {
  collection, deleteDoc, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

// ---------- Session : famille du compte connecté ----------
let session = { uid: null, familleId: null };

export const setSession = (s) => { session = { uid: s?.uid || null, familleId: s?.familleId || null }; };
export const getSession = () => session;

/** Famille du compte connecté. Lève une erreur claire si elle n'est pas encore connue. */
export const currentFamilleId = () => {
  if (!session.familleId) throw new Error('Famille non chargée : reconnectez-vous.');
  return session.familleId;
};

// ---------- Identifiants ----------
export const normalizeEmail = (email) => (email || '').trim().toLowerCase();

/** Identifiant du document d'un membre ajouté par une famille (unique par famille). */
export const invitedMemberId = (familleId, email) =>
  `${familleId}__${normalizeEmail(email).replace(/[^a-z0-9@._-]/g, '_') || Date.now()}`;

// ---------- Création / rattachement de la famille au premier passage ----------
const pending = new Map();

const displayNameOf = (user) => user.displayName || (user.email ? user.email.split('@')[0] : 'Moi');

/** Cherche une invitation (membre ajouté avec cet e-mail) — uniquement si l'e-mail est vérifié. */
const findInvitation = async (user) => {
  if (!user.email || !user.emailVerified) return null;
  try {
    const snap = await getDocs(query(collection(db, 'membresFamille'), where('email', '==', normalizeEmail(user.email)), limit(5)));
    const invite = snap.docs.find((d) => d.id !== user.uid && d.data().familleId && !d.data().compteUid);
    return invite ? { id: invite.id, ...invite.data() } : null;
  } catch (err) {
    console.warn('Recherche d’invitation impossible :', err.message);
    return null;
  }
};

const createOwnFamily = async (user, profileData = {}) => {
  const familleId = user.uid;
  const nom = displayNameOf(user);
  await setDoc(doc(db, 'familles', familleId), {
    nom: `Famille ${profileData.nomComplet || nom}`,
    ownerUid: user.uid,
    createdAt: serverTimestamp(),
  });
  const profile = {
    nomComplet: nom,
    photoProfil: user.photoURL || '',
    ...profileData,
    email: normalizeEmail(user.email),
    uid: user.uid,
    compteUid: user.uid,
    familleId,
    admin: true,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'membresFamille', user.uid), profile);
  return { ...profile, id: user.uid };
};

const joinInvitedFamily = async (user, invite) => {
  const { id: inviteId, ...data } = invite;
  const profile = {
    ...data,
    nomComplet: data.nomComplet || displayNameOf(user),
    photoProfil: data.photoProfil || user.photoURL || '',
    email: normalizeEmail(user.email),
    uid: user.uid,
    compteUid: user.uid,
    familleId: data.familleId,
    inviteId,
    admin: false,
    joinedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'membresFamille', user.uid), profile);
  // La fiche d'invitation est remplacée par la fiche du compte.
  await deleteDoc(doc(db, 'membresFamille', inviteId)).catch(() => {});
  return { ...profile, id: user.uid };
};

/**
 * Garantit que le compte a une fiche et une famille. Idempotent (plusieurs appels simultanés = un seul traitement).
 * - fiche existante → on la renvoie (et on complète `familleId` pour les anciens comptes) ;
 * - sinon, invitation trouvée (e-mail vérifié, ex. Google) → le compte rejoint cette famille ;
 * - sinon → une nouvelle famille privée est créée.
 * `profileData` : informations saisies à l'inscription.
 */
export const ensureFamily = (user, profileData) => {
  if (!user) return Promise.resolve(null);
  if (pending.has(user.uid)) return pending.get(user.uid);
  const task = (async () => {
    const ref = doc(db, 'membresFamille', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.familleId) return { ...data, id: snap.id };
      // Ancien compte sans famille : il devient propriétaire de sa propre famille.
      await setDoc(doc(db, 'familles', user.uid), { nom: `Famille ${data.nomComplet || displayNameOf(user)}`, ownerUid: user.uid, createdAt: serverTimestamp() });
      await updateDoc(ref, { familleId: user.uid, compteUid: user.uid, admin: true });
      return { ...data, familleId: user.uid, compteUid: user.uid, admin: true, id: snap.id };
    }
    const invite = await findInvitation(user);
    if (invite) return joinInvitedFamily(user, invite);
    return createOwnFamily(user, profileData);
  })().finally(() => pending.delete(user.uid));
  pending.set(user.uid, task);
  return task;
};

export const getFamille = async (familleId = currentFamilleId()) => {
  const snap = await getDoc(doc(db, 'familles', familleId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const renameFamille = (nom, familleId = currentFamilleId()) =>
  updateDoc(doc(db, 'familles', familleId), { nom });
