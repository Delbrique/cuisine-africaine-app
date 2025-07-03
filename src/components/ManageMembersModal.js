import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, IconButton, Checkbox, TextField, FormControlLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { GroupService } from '../services/GroupService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function ManageMembersModal({ open, onClose, groupId }) {
  const [current, setCurrent] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [toAdd, setToAdd] = useState({});

  useEffect(() => {
    if (!open || !groupId) return;
    const unsub = GroupService.getMembers(groupId, snap => {
      const arr = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
      setCurrent(arr);
    });
    getDocs(collection(db, 'membresFamille')).then(snap => {
      setCandidates(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });
    return unsub;
  }, [open, groupId]);

  const toggleAdd = uid => {
    setToAdd(prev =>
      prev[uid]
        ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== uid))
        : { ...prev, [uid]: 'member' }
    );
  };

  const changeRoleCurrent = async (docId, role) => {
    await GroupService.updateMemberRole(groupId, docId, role);
  };

  const deleteMember = async docId => {
    await GroupService.removeMember(groupId, docId);
  };

  const handleAddSubmit = () => {
    Object.entries(toAdd).forEach(([uid, role]) => {
      GroupService.addMember(groupId, uid, role);
    });
    setToAdd({});
  };

  const filteredCandidates = candidates.filter(c =>
    !current.find(m => m.uid === c.uid) &&
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Gérer les membres</DialogTitle>
      <DialogContent>
        <List dense>
          {current.map(m => (
            <ListItem key={m.docId}>
              <ListItemAvatar>
                <Avatar>{m.email?.charAt(0).toUpperCase() || 'U'}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={m.email || m.uid}
                secondary={`Rôle : ${m.role}`}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={m.role === 'admin'}
                    onChange={e => changeRoleCurrent(m.docId, e.target.checked ? 'admin' : 'member')}
                  />
                }
                label="Admin"
              />
              <IconButton edge="end" onClick={() => deleteMember(m.docId)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>

        <DialogTitle>Ajouter des membres</DialogTitle>
        <TextField
          fullWidth label="Rechercher un email"
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2 }}
        />
        <List dense>
          {filteredCandidates.map(c => (
            <ListItem key={c.uid}>
              <ListItemAvatar>
                <Avatar>{c.email?.charAt(0).toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={c.email || c.uid} />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!toAdd[c.uid]}
                    onChange={() => toggleAdd(c.uid)}
                  />
                }
                label="Ajouter"
              />
              {toAdd[c.uid] && (
                <TextField
                  select
                  value={toAdd[c.uid]}
                  onChange={e => setToAdd(prev => ({ ...prev, [c.uid]: e.target.value }))}
                  SelectProps={{ native: true }}
                  size="small" sx={{ ml: 1 }}
                >
                  <option value="member">Membre</option>
                  <option value="admin">Admin</option>
                </TextField>
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
        <Button
          variant="contained"
          onClick={handleAddSubmit}
          disabled={!Object.keys(toAdd).length}
        >
          Ajouter
        </Button>
      </DialogActions>
    </Dialog>
  );
}
