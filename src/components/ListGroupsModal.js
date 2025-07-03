import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, Avatar, Typography } from '@mui/material';
import { GroupService } from '../services/GroupService';

export default function ListGroupsModal({ open, onClose, onSelect }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!open) return;
    const unsub = GroupService.listGroupsParticipant(snap => {
      setGroups(snap.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Mes groupes</DialogTitle>
      <DialogContent>
        <List>
          {groups.map(g => (
            <ListItemButton key={g.id} onClick={() => { onSelect(g.id); onClose(); }}>
              <Avatar src={g.photoURL} sx={{ mr:1 }} />
              <ListItemText
                primary={g.name}
                secondary={
                  <>
                    <Typography component="span" variant="body2">
                      {g.description?.slice(0, 50)}...
                    </Typography><br/>
                    <Typography variant="caption">
                      Créé par {g.creatorEmail} le {g.createdAt?.toDate().toLocaleDateString()}
                    </Typography>
                  </>
                }
              />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
