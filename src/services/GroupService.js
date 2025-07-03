import { db, auth, storage } from '../firebase/firebase'; 
import {
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
  query, where, onSnapshot, collectionGroup, serverTimestamp, orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const groupsCol = collection(db, 'groups');
const groupMembersCol = groupId => collection(db, `groups/${groupId}/members`);
const groupMessagesCol = groupId => collection(db, `groups/${groupId}/messages`);

const uploadToCloudinary = async (file) => {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'monapp_unsigned'); // remplace par ton upload_preset
  const res = await fetch('https://api.cloudinary.com/v1_1/dnegiuc7h/raw/upload', {
    method: 'POST',
    body: data
  });
  const result = await res.json();
  return result.secure_url;
};

export const GroupService = {
  createGroup: async (name, desc, photoFile, memberUids = []) => {
    let photoURL = '';
    if (photoFile) {
      try {
        photoURL = await uploadToCloudinary(photoFile);
      } catch (err) {
        const photoRef = ref(storage, `groupPhotos/${Date.now()}_${photoFile.name}`);
        await uploadBytes(photoRef, photoFile);
        photoURL = await getDownloadURL(photoRef);
      }
    }

    const grpRef = await addDoc(groupsCol, {
      name,
      description: desc || '',
      photoURL,
      creator: auth.currentUser.uid,
      creatorEmail: auth.currentUser.email,
      createdAt: serverTimestamp(),
    });

    const allUids = [...new Set([auth.currentUser.uid, ...memberUids])];
    allUids.forEach(uid => addDoc(groupMembersCol(grpRef.id), {
      uid,
      addedAt: serverTimestamp()
    }));

    return grpRef.id;
  },

  listMyGroups: cb => {
    const q = query(groupsCol, where('creator', '==', auth.currentUser.uid));
    return onSnapshot(q, cb);
  },

  listGroupsParticipant: cb => {
    const q = query(collectionGroup(db, 'members'), where('uid', '==', auth.currentUser.uid));
    return onSnapshot(q, async snap => {
      const grpIds = snap.docs.map(d => d.ref.parent.parent.id);
      if (grpIds.length === 0) return cb([]);
      const q2 = query(groupsCol, where('__name__', 'in', grpIds));
      const res = await getDocs(q2);
      cb(res.docs);
    });
  },

  getMembers: (gid, cb) => onSnapshot(groupMembersCol(gid), cb),

  addMember: (gid, uid, role = 'member') =>
    addDoc(groupMembersCol(gid), { uid, role, addedAt: serverTimestamp() }),

  updateMemberRole: (gid, memberDocId, role) =>
    updateDoc(doc(groupMembersCol(gid), memberDocId), { role }),

  removeMember: (groupId, memberDocId) =>
    deleteDoc(doc(groupMembersCol(groupId), memberDocId)),

  postMessage: async (groupId, text, fileList = []) => {
    const fileUrls = [];

    for (const file of fileList) {
      try {
        const url = await uploadToCloudinary(file);
        fileUrls.push(url);
      } catch (err) {
        const fileRef = ref(storage, `groupMessages/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const fallbackUrl = await getDownloadURL(fileRef);
        fileUrls.push(fallbackUrl);
      }
    }

    const messageData = {
      createdAt: serverTimestamp()
    };

    if (text !== undefined) messageData.text = text;
    if (fileUrls.length > 0) messageData.fileUrls = fileUrls;
    if (auth.currentUser?.uid) messageData.senderId = auth.currentUser.uid;
    if (auth.currentUser?.email) messageData.senderEmail = auth.currentUser.email;

    await addDoc(groupMessagesCol(groupId), messageData);
  },

  listenMessages: (groupId, cb) => {
    const q = query(groupMessagesCol(groupId), orderBy('createdAt'));
    return onSnapshot(q, cb);
  },

  deleteMessage: (groupId, msgId) =>
    deleteDoc(doc(groupMessagesCol(groupId), msgId)),

  updateMessage: async (groupId, msgId, text, fileList = []) => {
    const fileUrls = [];

    for (const file of fileList) {
      try {
        const url = await uploadToCloudinary(file);
        fileUrls.push(url);
      } catch (err) {
        const fileRef = ref(storage, `groupMessages/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const fallbackUrl = await getDownloadURL(fileRef);
        fileUrls.push(fallbackUrl);
      }
    }

    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (fileUrls.length > 0) updateData.fileUrls = fileUrls;

    await updateDoc(doc(groupMessagesCol(groupId), msgId), updateData);
  },

  updateGroup: async (groupId, updates) => {
    if (updates.photoFile) {
      try {
        updates.photoURL = await uploadToCloudinary(updates.photoFile);
      } catch (err) {
        const photoRef = ref(storage, `groupPhotos/${Date.now()}_${updates.photoFile.name}`);
        await uploadBytes(photoRef, updates.photoFile);
        updates.photoURL = await getDownloadURL(photoRef);
      }
      delete updates.photoFile;
    }

    await updateDoc(doc(groupsCol, groupId), updates);
  },

  deleteGroup: async groupId => {
    const memSnap = await getDocs(groupMembersCol(groupId));
    memSnap.forEach(m => deleteDoc(m.ref));
    const msgSnap = await getDocs(groupMessagesCol(groupId));
    msgSnap.forEach(m => deleteDoc(m.ref));
    await deleteDoc(doc(groupsCol, groupId));
  }
};
