// 📁 src/components/Communication/ChatPage.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import useSound from 'use-sound';
import EmojiPicker from 'emoji-picker-react';
import { useColorScheme } from '@mui/material/styles';
import {
  Avatar, Box, Button, IconButton, InputBase, LinearProgress, ListItemIcon, Menu, MenuItem, Popover, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import InsertEmoticonRoundedIcon from '@mui/icons-material/InsertEmoticonRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import { enqueueSnackbar } from 'notistack';

import { auth, db } from '../../firebase/firebase';
import { GroupService } from '../../services/GroupService';
import sendSound from '../../assets/sounds/send.mp3';
import receiveSound from '../../assets/sounds/receive.mp3';
import CreateGroupModal from '../CreateGroupModal';
import GroupList from '../ListGroupsModal';
import ManageMembersModal from '../ManageMembersModal';
import { EmptyState, patternBg, useConfirm } from '../ui';
import { initials, toDate } from '../../utils';
import { tint } from '../../theme/theme';

// Compresse l'image sélectionnée (largeur max 1024 px).
const compressImage = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    img.onload = () => {
      const scale = Math.min(1, 1024 / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: file.type })), file.type, 0.7);
    };
    reader.readAsDataURL(file);
  });

const uploadToCloudinary = async (f) => {
  const fd = new FormData();
  fd.append('file', f);
  fd.append('upload_preset', 'monapp_unsigned');
  const res = await fetch('https://api.cloudinary.com/v1_1/dnegiuc7h/auto/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message);
  return data.secure_url;
};

const isImage = (url) => /\.(jpe?g|png|gif|webp)$/i.test(url.split('?')[0]);
const dayLabel = (d) => {
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yest.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function ChatPage() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const { colorScheme } = useColorScheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const confirm = useConfirm();

  const [groups, setGroups] = useState(null);
  const [people, setPeople] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [editId, setEditId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [anchorEmoji, setAnchorEmoji] = useState(null);
  const [anchorMeta, setAnchorMeta] = useState(null);
  const [dialog, setDialog] = useState(''); // 'create' | 'edit' | 'members'
  const [sending, setSending] = useState(false);

  const [playSend] = useSound(sendSound);
  const [playReceive] = useSound(receiveSound);
  const endRef = useRef(null);
  const boxRef = useRef(null);
  const autoScroll = useRef(true);
  const uid = auth.currentUser?.uid;

  const currentGroup = groups?.find((g) => g.id === groupId) || null;

  useEffect(() => {
    getDocs(collection(db, 'membresFamille')).then((s) => setPeople(s.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(() => {});
    if (!auth.currentUser) {
      setGroups([]);
      return undefined;
    }
    return GroupService.listGroupsParticipant((docs) => setGroups(docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    setMessages([]);
    setEditId(null);
    setInput('');
    if (!groupId) return undefined;
    let first = true;
    return GroupService.listenMessages(groupId, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(arr);
      const last = arr[arr.length - 1];
      if (!first && last && last.senderId !== auth.currentUser?.uid) {
        playReceive();
        navigator.vibrate?.(100);
      }
      first = false;
    });
  }, [groupId, playReceive]);

  useEffect(() => {
    if (autoScroll.current) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const personOf = (msg) => people.find((p) => p.id === msg.senderId || (msg.senderEmail && p.email === msg.senderEmail)) || {};

  const handleFileChange = async (e) => {
    const chosen = Array.from(e.target.files || []);
    e.target.value = '';
    const prepared = await Promise.all(
      chosen.map(async (f) => {
        const id = uuidv4();
        if (f.type.startsWith('image/')) {
          const comp = await compressImage(f);
          return { id, file: comp, url: URL.createObjectURL(comp), type: 'image', name: f.name };
        }
        return { id, file: f, url: '', type: 'file', name: f.name };
      })
    );
    setFiles((prev) => [...prev, ...prepared]);
  };

  const sendMessage = async () => {
    if ((!input.trim() && files.length === 0) || !groupId || sending) return;
    setSending(true);
    try {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(((i + 0.5) / files.length) * 100);
        urls.push(await uploadToCloudinary(files[i].file));
      }
      if (editId) {
        await GroupService.updateMessage(groupId, editId, input, urls);
        setEditId(null);
      } else {
        await GroupService.postMessage(groupId, input, urls);
      }
      setInput('');
      setFiles([]);
      autoScroll.current = true;
      playSend();
    } catch (err) {
      enqueueSnackbar(`Envoi impossible : ${err.message}`, { variant: 'error' });
    } finally {
      setUploadProgress(0);
      setSending(false);
    }
  };

  const deleteMessage = async (id) => {
    if (await confirm({ title: 'Supprimer ce message ?', confirmLabel: 'Supprimer' })) await GroupService.deleteMessage(groupId, id);
  };

  const deleteGroup = async () => {
    setAnchorMeta(null);
    if (!(await confirm({ title: `Supprimer « ${currentGroup.name} » ?`, message: 'Tous les messages du groupe seront supprimés.', confirmLabel: 'Supprimer' }))) return;
    await GroupService.deleteGroup(currentGroup.id);
    setSearchParams({});
  };

  // Regroupe les messages par jour.
  const timeline = useMemo(() => {
    const out = [];
    let lastDay = '';
    messages.forEach((m, i) => {
      const d = toDate(m.createdAt) || new Date();
      const key = d.toDateString();
      if (key !== lastDay) {
        out.push({ type: 'day', key: `d-${key}`, label: dayLabel(d) });
        lastDay = key;
      }
      const prev = messages[i - 1];
      out.push({ type: 'msg', key: m.id, msg: m, date: d, grouped: prev && prev.senderId === m.senderId && toDate(prev.createdAt)?.toDateString() === key });
    });
    return out;
  }, [messages]);

  const height = desktop
    ? '100dvh'
    : 'calc(100dvh - 60px - env(safe-area-inset-top) - 70px - env(safe-area-inset-bottom))';
  const showList = desktop || !groupId;
  const showConv = desktop || Boolean(groupId);

  return (
    <Box sx={{ display: 'flex', height, bgcolor: 'background.paper' }}>
      {showList && (
        <Box sx={{ width: { xs: '100%', md: 340 }, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: { md: '1px solid' }, borderColor: { md: 'divider' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2.5, pt: { xs: 2, md: 4 }, pb: 2 }}>
            <Typography variant="h5" sx={{ flex: 1 }}>Messages</Typography>
            <Tooltip title="Nouveau groupe">
              <IconButton onClick={() => setDialog('create')} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}><AddRoundedIcon /></IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: 1.25, pb: 2 }}>
            {groups === null ? (
              <Typography color="text.secondary" sx={{ p: 2 }}>Chargement…</Typography>
            ) : groups.length === 0 ? (
              <Box sx={{ p: 1.5 }}>
                <EmptyState icon={<ForumRoundedIcon />} title="Aucun groupe" description="Créez un groupe pour discuter des repas en famille."
                  action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog('create')}>Créer un groupe</Button>} />
              </Box>
            ) : (
              <GroupList groups={groups} selectedId={groupId} onSelect={(id) => setSearchParams({ groupId: id })} />
            )}
          </Box>
        </Box>
      )}

      {showConv && (
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {!currentGroup ? (
            <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 4, bgcolor: 'sand.main', backgroundImage: patternBg('#C2461A', 0.06) }}>
              <Box sx={{ textAlign: 'center', maxWidth: 360 }}>
                <Box component="img" src={`${process.env.PUBLIC_URL}/logo.svg`} alt="" sx={{ width: 80, mb: 2, opacity: 0.9 }} />
                <Typography variant="h5" sx={{ mb: 1 }}>{groupId ? 'Chargement du groupe…' : 'La table familiale'}</Typography>
                <Typography color="text.secondary">Choisissez un groupe pour discuter des menus, partager une photo de plat ou organiser le marché.</Typography>
              </Box>
            </Box>
          ) : (
            <>
              {/* En-tête de conversation */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: { xs: 1, md: 2.5 }, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                {!desktop && <IconButton onClick={() => setSearchParams({})} aria-label="Retour"><ArrowBackRoundedIcon /></IconButton>}
                <Avatar src={currentGroup.photoURL || undefined} sx={{ bgcolor: 'primary.main' }}>{initials(currentGroup.name)}</Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 750 }} noWrap>{currentGroup.name}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap component="div">
                    {currentGroup.description || `Créé par ${currentGroup.creatorEmail}`}
                  </Typography>
                </Box>
                <Tooltip title="Participants"><IconButton onClick={() => setDialog('members')}><GroupRoundedIcon /></IconButton></Tooltip>
                <IconButton onClick={(e) => setAnchorMeta(e.currentTarget)}><MoreVertRoundedIcon /></IconButton>
                <Menu anchorEl={anchorMeta} open={Boolean(anchorMeta)} onClose={() => setAnchorMeta(null)}>
                  <MenuItem onClick={() => { setAnchorMeta(null); setDialog('edit'); }}><ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>Modifier le groupe</MenuItem>
                  <MenuItem onClick={deleteGroup} sx={{ color: 'error.main' }}><ListItemIcon><DeleteOutlineRoundedIcon fontSize="small" color="error" /></ListItemIcon>Supprimer le groupe</MenuItem>
                </Menu>
              </Box>

              {/* Messages */}
              <Box
                ref={boxRef}
                onScroll={() => {
                  const el = boxRef.current;
                  autoScroll.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
                }}
                sx={{ flex: 1, overflowY: 'auto', px: { xs: 1.5, md: 4 }, py: 2, bgcolor: 'sand.main', backgroundImage: patternBg('#C2461A', 0.05) }}
              >
                {messages.length === 0 && (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 6 }}>Aucun message. Lancez la conversation 👋🏾</Typography>
                )}
                {timeline.map((item) => {
                  if (item.type === 'day') {
                    return (
                      <Box key={item.key} sx={{ textAlign: 'center', my: 2 }}>
                        <Typography component="span" variant="caption" sx={{ px: 1.5, py: 0.5, borderRadius: 99, bgcolor: 'background.paper', fontWeight: 700, color: 'text.secondary', textTransform: 'capitalize' }}>
                          {item.label}
                        </Typography>
                      </Box>
                    );
                  }
                  const { msg, date, grouped } = item;
                  const mine = msg.senderId === uid;
                  const person = personOf(msg);
                  const name = person.nomComplet || msg.senderEmail || '';
                  return (
                    <Box key={item.key} sx={{ display: 'flex', gap: 1, justifyContent: mine ? 'flex-end' : 'flex-start', mt: grouped ? 0.5 : 1.5, '&:hover .msg-tools': { opacity: 1 } }}>
                      {!mine && (
                        <Avatar src={person.photoProfil || undefined} sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'secondary.main', visibility: grouped ? 'hidden' : 'visible' }}>{initials(name)}</Avatar>
                      )}
                      {mine && (
                        <Box className="msg-tools" sx={{ display: 'flex', alignItems: 'center', opacity: { xs: 1, md: 0 }, transition: 'opacity .15s' }}>
                          <IconButton size="small" onClick={() => { setInput(msg.text || ''); setEditId(msg.id); }}><EditRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
                          <IconButton size="small" onClick={() => deleteMessage(msg.id)}><DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
                        </Box>
                      )}
                      <Box
                        sx={{
                          maxWidth: { xs: '80%', md: '65%' }, px: 1.75, py: 1, borderRadius: 4,
                          borderTopRightRadius: mine && !grouped ? 6 : undefined, borderTopLeftRadius: !mine && !grouped ? 6 : undefined,
                          bgcolor: mine ? 'primary.main' : 'background.paper', color: mine ? 'primary.contrastText' : 'text.primary',
                          boxShadow: '0 2px 6px rgba(31,20,16,.06)',
                        }}
                      >
                        {!mine && !grouped && <Typography variant="caption" sx={{ fontWeight: 800, color: 'secondary.main', display: 'block' }}>{name}</Typography>}
                        {msg.fileUrls?.map((url, i) =>
                          isImage(url) ? (
                            <Box key={i} component="a" href={url} target="_blank" rel="noreferrer" sx={{ display: 'block', my: 0.5 }}>
                              <Box component="img" src={url} alt="" sx={{ maxWidth: '100%', maxHeight: 320, borderRadius: 3, display: 'block' }} />
                            </Box>
                          ) : (
                            <Box key={i} component="a" href={url} target="_blank" rel="noreferrer"
                              sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5, p: 1, borderRadius: 2, color: 'inherit', textDecoration: 'none', bgcolor: mine ? 'rgba(255,255,255,.15)' : 'sand.main' }}>
                              <InsertDriveFileRoundedIcon fontSize="small" /> <Typography variant="body2" sx={{ fontWeight: 650 }}>Fichier {i + 1}</Typography>
                            </Box>
                          )
                        )}
                        {msg.text && <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 15 }}>{msg.text}</Typography>}
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.65, fontSize: 11 }}>
                          {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
                <div ref={endRef} />
              </Box>

              {/* Saisie */}
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1.25 }}>
                {uploadProgress > 0 && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 1, height: 4 }} />}
                {editId && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, mb: 1, borderRadius: 3, bgcolor: tint('primary', 0.08) }}>
                    <EditRoundedIcon fontSize="small" color="primary" />
                    <Typography variant="body2" sx={{ flex: 1, fontWeight: 650 }}>Modification du message</Typography>
                    <IconButton size="small" onClick={() => { setEditId(null); setInput(''); }}><CloseRoundedIcon fontSize="small" /></IconButton>
                  </Box>
                )}
                {files.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {files.map((p) => (
                      <Box key={p.id} sx={{ position: 'relative' }}>
                        {p.type === 'image' ? (
                          <Box component="img" src={p.url} alt="" sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 2.5, display: 'block' }} />
                        ) : (
                          <Box sx={{ width: 64, height: 64, borderRadius: 2.5, bgcolor: 'sand.main', display: 'grid', placeItems: 'center', p: 0.5 }}>
                            <Typography variant="caption" sx={{ fontSize: 10, wordBreak: 'break-all', lineHeight: 1.1 }}>{p.name}</Typography>
                          </Box>
                        )}
                        <IconButton size="small" onClick={() => setFiles((f) => f.filter((x) => x.id !== p.id))}
                          sx={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: 'background.paper' } }}>
                          <CloseRoundedIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
                <Box component="form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }} sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75 }}>
                  <input type="file" id="chat-file-upload" hidden multiple onChange={handleFileChange} />
                  <Tooltip title="Joindre un fichier"><IconButton component="label" htmlFor="chat-file-upload"><AttachFileRoundedIcon /></IconButton></Tooltip>
                  <IconButton onClick={(e) => setAnchorEmoji(e.currentTarget)} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}><InsertEmoticonRoundedIcon /></IconButton>
                  <InputBase
                    multiline maxRows={4} fullWidth value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={editId ? 'Modifier le message…' : 'Écrire un message…'}
                    sx={{ px: 2, py: 1.1, borderRadius: 4, bgcolor: 'sand.main', fontSize: 15 }}
                  />
                  <IconButton type="submit" disabled={sending || (!input.trim() && !files.length)}
                    sx={{ width: 44, height: 44, bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'divider' } }}>
                    <SendRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </>
          )}
        </Box>
      )}

      <Popover open={Boolean(anchorEmoji)} anchorEl={anchorEmoji} onClose={() => setAnchorEmoji(null)} anchorOrigin={{ vertical: 'top', horizontal: 'left' }} transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <EmojiPicker theme={colorScheme === 'dark' ? 'dark' : 'light'} onEmojiClick={(d) => { setInput((p) => p + d.emoji); setAnchorEmoji(null); }} />
      </Popover>

      <CreateGroupModal open={dialog === 'create'} onClose={() => setDialog('')} onCreated={(id) => setSearchParams({ groupId: id })} />
      <CreateGroupModal open={dialog === 'edit'} group={currentGroup} onClose={() => setDialog('')} />
      <ManageMembersModal open={dialog === 'members'} onClose={() => setDialog('')} groupId={groupId} />
    </Box>
  );
}
