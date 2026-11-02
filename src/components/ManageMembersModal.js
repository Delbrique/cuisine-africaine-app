import React, { useEffect, useState } from 'react';
import {
  Avatar, Box, Button, Checkbox, IconButton, InputAdornment, List, ListItem, ListItemAvatar, ListItemButton, ListItemText,
  MenuItem, Select, TextField, Tooltip, Typography,
} from '@mui/material';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { collection, getDocs } from 'firebase/firestore';
import { enqueueSnackbar } from 'notistack';
import { db } from '../firebase/firebase';
import { GroupService } from '../services/GroupService';
import { ResponsiveDialog, useConfirm } from './ui';
import { initials, normalize } from '../utils';

export default function ManageMembersModal({ open, onClose, groupId }) {
  const [current, setCurrent] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [toAdd, setToAdd] = useState({});
  const confirm = useConfirm();

  useEffect(() => {
    if (!open || !groupId) return undefined;
    setToAdd({});
    setSearch('');
    const unsub = GroupService.getMembers(groupId, (snap) => setCurrent(snap.docs.map((d) => ({ docId: d.id, ...d.data() }))));
    getDocs(collection(db, 'membresFamille')).then((snap) => setCandidates(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))));
    return unsub;
  }, [open, groupId]);

  const profile = (uid) => candidates.find((c) => c.uid === uid) || {};
  const nameOf = (uid) => profile(uid).nomComplet || profile(uid).email || uid;

  const toggleAdd = (uid) =>
    setToAdd((prev) => {
      const next = { ...prev };
      if (next[uid]) delete next[uid];
      else next[uid] = 'member';
      return next;
    });

  const remove = async (m) => {
    if (!(await confirm({ title: `Retirer ${nameOf(m.uid)} ?`, message: 'Cette personne ne verra plus les messages du groupe.', confirmLabel: 'Retirer' }))) return;
    await GroupService.removeMember(groupId, m.docId);
  };

  const handleAddSubmit = async () => {
    await Promise.all(Object.entries(toAdd).map(([uid, role]) => GroupService.addMember(groupId, uid, role)));
    enqueueSnackbar(`${Object.keys(toAdd).length} participant(s) ajouté(s).`, { variant: 'success' });
    setToAdd({});
  };

  const available = candidates.filter(
    (c) => !current.find((m) => m.uid === c.uid) && normalize(`${c.nomComplet || ''} ${c.email || ''}`).includes(normalize(search))
  );

  return (
    <ResponsiveDialog
      open={open} onClose={onClose} title="Participants"
      actions={<><Button color="inherit" onClick={onClose}>Fermer</Button><Button variant="contained" onClick={handleAddSubmit} disabled={!Object.keys(toAdd).length}>Ajouter {Object.keys(toAdd).length || ''}</Button></>}
    >
      <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase' }}>Dans le groupe · {current.length}</Typography>
      <List dense sx={{ mb: 2 }}>
        {current.map((m) => (
          <ListItem key={m.docId} sx={{ px: 0 }}
            secondaryAction={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Select size="small" value={m.role || 'member'} onChange={(e) => GroupService.updateMemberRole(groupId, m.docId, e.target.value)} sx={{ minWidth: 112, '& .MuiSelect-select': { py: 0.75 } }}>
                  <MenuItem value="member">Membre</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
                <Tooltip title="Retirer"><IconButton onClick={() => remove(m)}><PersonRemoveRoundedIcon fontSize="small" /></IconButton></Tooltip>
              </Box>
            }>
            <ListItemAvatar><Avatar src={profile(m.uid).photoProfil || undefined} sx={{ bgcolor: 'primary.main' }}>{initials(nameOf(m.uid))}</Avatar></ListItemAvatar>
            <ListItemText primary={nameOf(m.uid)} primaryTypographyProps={{ noWrap: true, fontWeight: 650, pr: 20 }} />
          </ListItem>
        ))}
      </List>

      <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1 }}>Ajouter des participants</Typography>
      <TextField size="small" fullWidth placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} />
      <List dense sx={{ maxHeight: 260, overflowY: 'auto', mt: 1 }}>
        {available.map((c) => (
          <ListItemButton key={c.uid} onClick={() => toggleAdd(c.uid)} sx={{ borderRadius: 3 }}>
            <ListItemAvatar><Avatar src={c.photoProfil || undefined} sx={{ bgcolor: 'secondary.main' }}>{initials(c.nomComplet || c.email)}</Avatar></ListItemAvatar>
            <ListItemText primary={c.nomComplet || c.email || c.uid} secondary={c.nomComplet ? c.email : null} />
            {toAdd[c.uid] && (
              <Select size="small" value={toAdd[c.uid]} onClick={(e) => e.stopPropagation()} onChange={(e) => setToAdd((p) => ({ ...p, [c.uid]: e.target.value }))} sx={{ mr: 1, '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="member">Membre</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            )}
            <Checkbox edge="end" checked={Boolean(toAdd[c.uid])} tabIndex={-1} disableRipple />
          </ListItemButton>
        ))}
        {available.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>Personne d'autre à ajouter.</Typography>}
      </List>
    </ResponsiveDialog>
  );
}
