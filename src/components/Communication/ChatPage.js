// 📁 src/components/Communication/ChatPage.js 
import React, { useEffect, useState, useRef } from 'react';
import { auth, db } from '../../firebase/firebase';
import { GroupService } from '../../services/GroupService';
import { v4 as uuidv4 } from 'uuid';
import useSound from 'use-sound';
import EmojiPicker from 'emoji-picker-react';
import sendSound from '../../assets/sounds/send.mp3';
import receiveSound from '../../assets/sounds/receive.mp3';
import {
  Container, Box, TextField, Typography, Paper,
  List, ListItem, Avatar, IconButton, Button,
  LinearProgress, Popover, Fade, Menu, MenuItem
} from '@mui/material';
import {
  Send as SendIcon, AttachFile as AttachFileIcon,
  Edit as EditIcon, Delete as DeleteIcon,
  InsertEmoticon as InsertEmoticonIcon,
  MoreVert as MoreVertIcon, ArrowBack as ArrowBackIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import kitchenVideo from '../../assets/videos/kitchen.mp4';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CreateGroupModal from '../CreateGroupModal';
import ListGroupsModal from '../ListGroupsModal';
import ManageMembersModal from '../ManageMembersModal';

// compresse l'image sélectionnée
const compressImage = file =>
  new Promise(resolve => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => img.src = e.target.result;
    img.onload = () => {
      const MAX = 1024;
      const scale = MAX / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = MAX;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        const comp = new File([blob], file.name, { type: file.type });
        resolve(comp);
      }, file.type, 0.7);
    };
    reader.readAsDataURL(file);
  });

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const groupId = searchParams.get('groupId');

  const [currentGroup, setCurrentGroup] = useState(null);
  const [anchorGroupMeta, setAnchorGroupMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [editId, setEditId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [anchorEmoji, setAnchorEmoji] = useState(null);

  const [playSend] = useSound(sendSound);
  const [playReceive] = useSound(receiveSound);

  const messagesEndRef = useRef(null);
  const chatBoxRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);
  const [openList, setOpenList] = useState(false);
  const [openManage, setOpenManage] = useState(false);

  // écoute les messages + info du groupe
  useEffect(() => {
    if (!groupId) {
      setCurrentGroup(null);
      setMessages([]);
      return;
    }
    const unsubMsg = GroupService.listenMessages(groupId, snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(arr);
      const last = arr[arr.length - 1];
      if (last && last.senderId !== auth.currentUser.uid) {
        playReceive();
        navigator.vibrate?.(100);
      }
    });

    const unsubGrp = GroupService.listGroupsParticipant(snap => {
      const doc = snap.find(g => g.id === groupId);
      if (doc) {
        setCurrentGroup({ id: doc.id, ...doc.data() });
      }
    });

    return () => {
      unsubMsg();
      unsubGrp();
    };
  }, [groupId, playReceive]);

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = chatBoxRef.current;
    if (!el) return;
    setAutoScroll(el.scrollTop + el.clientHeight >= el.scrollHeight - 50);
  };

  const handleFileChange = async e => {
    const chosen = Array.from(e.target.files);
    const prs = [];
    const ufs = [];
    for (const f of chosen) {
      const id = uuidv4();
      if (f.type.startsWith('image/')) {
        const comp = await compressImage(f);
        prs.push({ id, url: URL.createObjectURL(comp), type: 'image', name: f.name, file: comp });
        ufs.push({ id, file: comp });
      } else {
        prs.push({ id, url: '', type: 'file', name: f.name, file: f });
        ufs.push({ id, file: f });
      }
    }
    setPreviewUrls(prev => [...prev, ...prs]);
    setFiles(prev => [...prev, ...ufs]);
  };

  const removeFile = id => {
    setPreviewUrls(prev => prev.filter(p => p.id !== id));
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // upload vers Cloudinary
  const uploadToCloudinary = async f => {
    const fd = new FormData();
    fd.append('file', f);
    fd.append('upload_preset', 'monapp_unsigned');
    const res = await fetch('https://api.cloudinary.com/v1_1/dnegiuc7h/auto/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message);
    return data.secure_url;
  };

  const sendMessage = async () => {
    if ((!input.trim() && files.length === 0) || !groupId) return;
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      setUploadProgress((i / files.length) * 100);
      const u = await uploadToCloudinary(files[i].file);
      urls.push(u);
    }
    setUploadProgress(100);

    if (editId) {
      await GroupService.updateMessage(groupId, editId, input, urls);
      setEditId(null);
    } else {
      await GroupService.postMessage(groupId, input, urls);
    }

    setInput('');
    setFiles([]);
    setPreviewUrls([]);
    setUploadProgress(0);
    playSend();
  };

  const initiateEdit = msg => {
    setInput(msg.text);
    setEditId(msg.id);
    scrollToBottom();
  };

  const deleteMessage = async id => {
    if (window.confirm('Supprimer ce message ?')) {
      await GroupService.deleteMessage(groupId, id);
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji);
    setAnchorEmoji(null);
  };

  const formatTs = ts => ts?.toDate()?.toLocaleString() || '';

  const openGroupMeta = e => setAnchorGroupMeta(e.currentTarget);
  const closeGroupMeta = () => setAnchorGroupMeta(null);

  const handleEditGroup = async () => {
  const newName = window.prompt('Nouveau nom ?', currentGroup.name) || currentGroup.name;
  const newDesc = window.prompt('Nouvelle description ?', currentGroup.description) || currentGroup.description;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';

  fileInput.onchange = async () => {
    const photoFile = fileInput.files[0];

    const updates = {
      name: newName,
      description: newDesc
    };

    if (photoFile) {
      updates.photoFile = photoFile;
    }

    await GroupService.updateGroup(currentGroup.id, updates);
    closeGroupMeta();
  };

  fileInput.click();
};


  const handleDeleteGroup = async () => {
    if (window.confirm('Supprimer ce groupe et tout son contenu ?')) {
      await GroupService.deleteGroup(currentGroup.id);
      setSearchParams({});
    }
    closeGroupMeta();
  };

  return (
    <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <video
        autoPlay muted loop src={kitchenVideo}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', zIndex: -1
        }}
      />

      <Container maxWidth="md" sx={{ pt: 2, pb: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Button
          variant="contained" color="secondary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/famille-dashboard')}
          sx={{ mb: 2 }}
        >
          Retour
        </Button>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Button onClick={() => setOpenCreate(true)}>Créer groupe</Button>
            <Button onClick={() => setOpenList(true)}>Mes groupes</Button>
            {groupId && <Button onClick={() => setOpenManage(true)}>Membres</Button>}
          </Box>

          {currentGroup && (
            <Box display="flex" alignItems="center">
              <Avatar src={currentGroup.photoURL} sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ color: '#fff' }}>{currentGroup.name}</Typography>
              <IconButton onClick={openGroupMeta} sx={{ color: '#fff' }}><MoreVertIcon /></IconButton>
              <Menu anchorEl={anchorGroupMeta} open={Boolean(anchorGroupMeta)} onClose={closeGroupMeta}>
                <MenuItem onClick={handleEditGroup}>Modifier infos</MenuItem>
                <MenuItem onClick={handleDeleteGroup}>Supprimer groupe</MenuItem>
              </Menu>
            </Box>
          )}
        </Box>

        {currentGroup && (
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', p: 1, borderRadius: 1, mb: 2 }}>
            <Typography>
              <strong>Créé par :</strong> {currentGroup.creatorEmail}<br />
              <strong>Le :</strong> {new Date(currentGroup.createdAt?.toDate()).toLocaleString()}<br />
              <strong>Description :</strong> {currentGroup.description}
            </Typography>
          </Box>
        )}

        <Paper
          ref={chatBoxRef}
          onScroll={handleScroll}
          sx={{
            flexGrow: 1, overflowY: 'auto', p: 2, mb: 2,
            borderRadius: 2, bgcolor: 'rgba(255,255,255,0.9)'
          }}
        >
          <List>
            {messages.map(msg => {
              const mine = msg.senderId === auth.currentUser.uid;
              return (
                <Fade in key={msg.id}>
                  <ListItem sx={{
                    flexDirection: 'column',
                    alignItems: mine ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center',
                      bgcolor: mine ? '#d7f0ff' : '#f9f9f9',
                      borderRadius: 2, px: 2, py: 1,
                      maxWidth: '75%'
                    }}>
                      <Avatar sx={{ mr: 1 }}>{msg.senderEmail.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="caption">
                          {msg.senderEmail} — {formatTs(msg.createdAt)}
                        </Typography>
                        {msg.text && <Typography variant="body2">{msg.text}</Typography>}
                        {msg.fileUrls?.map((url, i) =>
                          /\.(jpe?g|png|gif|webp)$/i.test(url) ? (
                            <Box key={i} mt={1}>
                              <img src={url} alt="preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
                            </Box>
                          ) : (
                            <Typography mt={1} key={i}>
                              📎 <a href={url} target="_blank" rel="noreferrer">Fichier {i + 1}</a>
                            </Typography>
                          )
                        )}
                        {mine && (
                          <Box display="flex" justifyContent="flex-end" mt={1}>
                            <IconButton size="small" onClick={() => initiateEdit(msg)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => deleteMessage(msg.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                </Fade>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        </Paper>

        {previewUrls.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2">Aperçu :</Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {previewUrls.map(p => (
                <Box key={p.id} position="relative">
                  {p.type === 'image' ? (
                    <img src={p.url} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <Typography fontSize="0.8rem">📄 {p.name}</Typography>
                  )}
                  <IconButton size="small" sx={{ position: 'absolute', top: -5, right: -5, bgcolor: '#fff' }} onClick={() => removeFile(p.id)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Box display="flex" alignItems="center" gap={1} bgcolor="white" p={1} borderRadius={2}>
          <TextField
            fullWidth
            label={editId ? 'Modifier message' : 'Votre message'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <input type="file" id="file-upload" hidden multiple onChange={handleFileChange} />
          <label htmlFor="file-upload">
            <IconButton component="span"><AttachFileIcon /></IconButton>
          </label>
          <IconButton onClick={e => setAnchorEmoji(e.currentTarget)}>
            <InsertEmoticonIcon />
          </IconButton>
          <IconButton color="primary" onClick={sendMessage}><SendIcon /></IconButton>
        </Box>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <Box mt={2}><LinearProgress variant="determinate" value={uploadProgress} /></Box>
        )}

        <Popover
          open={Boolean(anchorEmoji)}
          anchorEl={anchorEmoji}
          onClose={() => setAnchorEmoji(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </Popover>

        <CreateGroupModal open={openCreate} onClose={() => setOpenCreate(false)} onCreated={id => setSearchParams({ groupId: id })} />
        <ListGroupsModal open={openList} onClose={() => setOpenList(false)} onSelect={id => { setSearchParams({ groupId: id }); setOpenList(false); }} />
        <ManageMembersModal open={openManage} onClose={() => setOpenManage(false)} groupId={groupId} />

      </Container>
    </Box>
  );
}