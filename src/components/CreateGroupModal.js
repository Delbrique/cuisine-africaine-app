import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Button,
  Checkbox, List, ListItem, FormControlLabel, Avatar
} from '@mui/material';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { GroupService } from '../services/GroupService';

export default function CreateGroupModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [members, setMembers] = useState([]);
  const [picked, setPicked] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    getDocs(collection(db, 'membresFamille')).then(snap =>
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
    );
  }, [open]);

  const handleToggle = uid =>
    setPicked(p => p.includes(uid) ? p.filter(u => u !== uid) : [...p, uid]);

  const submit = async () => {
    const groupId = await GroupService.createGroup(name, desc, photoFile, picked);
    setName(''); setDesc(''); setPhotoFile(null); setPicked([]);
    onCreated(groupId); onClose();
  };

  const filteredMembers = members.filter(m =>
    (m.nom || m.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Créer un groupe</DialogTitle>
      <DialogContent>
        <TextField fullWidth label="Nom du groupe" value={name} onChange={e => setName(e.target.value)} sx={{ mb: 1 }} />
        <TextField fullWidth label="Description" value={desc} onChange={e => setDesc(e.target.value)} sx={{ mb: 1 }} multiline rows={2} />
        <Button variant="outlined" component="label" sx={{ mb: 1 }}>
          Photo de groupe
          <input hidden type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
        </Button>
        {photoFile && <Avatar src={URL.createObjectURL(photoFile)} sx={{ width: 56, height: 56, mb: 1 }} />}
        <TextField fullWidth label="Rechercher un membre" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 1 }} />
        <List dense>
          {filteredMembers.map(m => (
            <ListItem key={m.uid}>
              <FormControlLabel
                control={<Checkbox checked={picked.includes(m.uid)} onChange={() => handleToggle(m.uid)} />}
                label={m.email || m.nom || m.uid}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={submit} disabled={!name}>Créer</Button>
      </DialogActions>
    </Dialog>
  );
}
