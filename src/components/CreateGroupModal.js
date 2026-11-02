import React, { useEffect, useState } from 'react';
import { Avatar, Box, Button, Checkbox, InputAdornment, List, ListItemAvatar, ListItemButton, ListItemText, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { getDocs, collection } from 'firebase/firestore';
import { enqueueSnackbar } from 'notistack';
import { db, auth } from '../firebase/firebase';
import { GroupService } from '../services/GroupService';
import { PhotoPicker, ResponsiveDialog } from './ui';
import { initials, normalize } from '../utils';

const dataUrlToFile = async (dataUrl, name) => {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: blob.type });
};

/**
 * Création (sans `group`) ou modification (avec `group`) d'un groupe de discussion.
 */
export default function CreateGroupModal({ open, onClose, onCreated, group }) {
  const editing = Boolean(group);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState('');
  const [members, setMembers] = useState([]);
  const [picked, setPicked] = useState([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(group?.name || '');
    setDesc(group?.description || '');
    setPhoto(group?.photoURL || '');
    setPicked([]);
    setSearch('');
    setBusy(false);
    if (!editing) {
      getDocs(collection(db, 'membresFamille')).then((snap) =>
        setMembers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })).filter((m) => m.uid !== auth.currentUser?.uid))
      );
    }
  }, [open, group, editing]);

  const toggle = (uid) => setPicked((p) => (p.includes(uid) ? p.filter((u) => u !== uid) : [...p, uid]));

  const submit = async () => {
    setBusy(true);
    try {
      const photoFile = photo && photo.startsWith('data:') ? await dataUrlToFile(photo, 'groupe.jpg') : null;
      if (editing) {
        const updates = { name, description: desc };
        if (photoFile) updates.photoFile = photoFile;
        await GroupService.updateGroup(group.id, updates);
        enqueueSnackbar('Groupe mis à jour.', { variant: 'success' });
      } else {
        const id = await GroupService.createGroup(name, desc, photoFile, picked);
        enqueueSnackbar('Groupe créé !', { variant: 'success' });
        onCreated?.(id);
      }
      onClose();
    } catch (err) {
      enqueueSnackbar(`Erreur : ${err.message}`, { variant: 'error' });
      setBusy(false);
    }
  };

  const filtered = members.filter((m) => normalize(`${m.nomComplet || ''} ${m.email || ''}`).includes(normalize(search)));

  return (
    <ResponsiveDialog
      open={open} onClose={onClose} onSubmit={submit} title={editing ? 'Modifier le groupe' : 'Nouveau groupe'}
      actions={<><Button color="inherit" onClick={onClose}>Annuler</Button><Button type="submit" variant="contained" disabled={!name.trim() || busy}>{busy ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer le groupe'}</Button></>}
    >
      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
        <PhotoPicker round size={96} value={photo} onChange={setPhoto} label="Photo" sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }} />
        <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Nom du groupe" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ex : Famille Mbarga" />
          <TextField label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} multiline minRows={2} />
        </Box>
      </Box>
      {!editing && (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase' }}>
            Participants {picked.length > 0 && `· ${picked.length}`}
          </Typography>
          <TextField size="small" fullWidth placeholder="Rechercher un membre…" value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} />
          <List dense sx={{ maxHeight: 280, overflowY: 'auto', mt: 1 }}>
            {filtered.map((m) => (
              <ListItemButton key={m.uid} onClick={() => toggle(m.uid)} sx={{ borderRadius: 3 }}>
                <ListItemAvatar><Avatar src={m.photoProfil || undefined} sx={{ bgcolor: 'primary.main' }}>{initials(m.nomComplet || m.email)}</Avatar></ListItemAvatar>
                <ListItemText primary={m.nomComplet || m.email || m.uid} secondary={m.nomComplet ? m.email : null} />
                <Checkbox edge="end" checked={picked.includes(m.uid)} tabIndex={-1} disableRipple />
              </ListItemButton>
            ))}
          </List>
        </>
      )}
    </ResponsiveDialog>
  );
}
