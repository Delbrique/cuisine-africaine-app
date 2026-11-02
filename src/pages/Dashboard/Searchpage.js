import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Alert, Avatar, Box, ButtonBase, Card, IconButton, InputAdornment, InputBase, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';

import { getPlats } from '../../services/platService';
import { GEMINI_API_KEY, generateText } from '../../services/gemini';
import { DishImage, PageHeader, patternBg } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { initials, normalize } from '../../utils';
import PlatDetail from './PlatsEtIngredients/PlatDetail';


const WELCOME = {
  id: 1,
  type: 'bot',
  message:
    "Bonjour ! Je suis votre **assistant culinaire**, spécialisé dans la cuisine camerounaise et africaine. Je peux vous aider avec :\n\n" +
    '- 🍽️ des recettes traditionnelles et modernes\n- 🛒 les prix des ingrédients au Cameroun\n- 🥘 des conseils nutritionnels\n- 🌶️ des techniques de cuisine\n- 📍 les spécialités régionales\n\nQue puis-je faire pour vous aujourd\'hui ?',
  timestamp: new Date(),
};

const SUGGESTIONS = [
  'Comment préparer un Ndolé traditionnel ?',
  'Recette de Poulet DG camerounais',
  'Quels sont les prix des épices au marché de Yaoundé ?',
  'Substituts locaux aux ingrédients importés',
  'Prix du poisson au Cameroun cette saison',
  'Conseils nutritionnels pour enfants',
];

const createContextualPrompt = (userMessage, plats) => {
  const ctx = plats.length
    ? `\n\nContexte des recettes disponibles dans l'application:\n${plats
        .slice(0, 10)
        .map((p) => `- ${p.nom} (${p.categoriePlat || 'Non catégorisé'}): ${p.description || 'Pas de description'}`)
        .join('\n')}`
    : '';
  return `Tu es un assistant culinaire expert spécialisé dans la cuisine camerounaise, africaine et internationale. Tu dois répondre uniquement aux questions liées à :
- La cuisine et les recettes (traditionnelles camerounaises, africaines, internationales)
- L'alimentation et la nutrition
- Les prix des ingrédients au Cameroun et en Afrique Centrale
- Les techniques culinaires
- Les spécialités régionales du Cameroun
- Les conseils nutritionnels adaptés au contexte africain
- L'histoire culinaire camerounaise et africaine

IMPORTANT:
- Si la question n'est PAS liée à la cuisine, l'alimentation ou la gastronomie, réponds poliment que tu ne peux aider que pour les questions culinaires.
- Donne des informations pratiques avec des prix approximatifs en FCFA quand pertinent
- Mentionne les alternatives locales camerounaises quand possible
- Sois précis sur les quantités, temps de cuisson, et techniques
${ctx}

Question de l'utilisateur: ${userMessage}

Réponds en français de manière claire et utile:`;
};

function Bubble({ msg, userName, userPhoto }) {
  const mine = msg.type === 'user';
  return (
    <Box sx={{ display: 'flex', gap: 1.25, flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', animation: 'fadeUp .3s ease both' }}>
      {mine ? (
        <Avatar src={userPhoto} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>{initials(userName)}</Avatar>
      ) : (
        <Avatar src={`${process.env.PUBLIC_URL}/logo.svg`} sx={{ width: 32, height: 32 }} />
      )}
      <Box
        sx={{
          maxWidth: { xs: '84%', md: '76%' }, px: 2, py: 1.25, borderRadius: 4,
          borderBottomRightRadius: mine ? 6 : undefined, borderBottomLeftRadius: mine ? undefined : 6,
          bgcolor: mine ? 'primary.main' : 'background.paper', color: mine ? 'primary.contrastText' : 'text.primary',
          border: mine ? 'none' : '1px solid', borderColor: 'divider',
          '& p': { m: 0, lineHeight: 1.6 }, '& p + p, & ul, & ol': { mt: 1 }, '& ul, & ol': { pl: 2.5, mb: 0 },
          '& li': { mb: 0.4 }, '& h1, & h2, & h3': { fontSize: 16, mt: 1.5, mb: 0.5 }, '& strong': { fontWeight: 750 },
        }}
      >
        {mine ? <Typography sx={{ whiteSpace: 'pre-line' }}>{msg.message}</Typography> : <ReactMarkdown>{msg.message}</ReactMarkdown>}
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.6, mt: 0.5 }}>
          {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
    </Box>
  );
}

function Assistant({ plats, height }) {
  const { profile, user } = useAuth();
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);
  const model = Boolean(GEMINI_API_KEY);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, thinking]);

  const answer = async (text) => {
    try {
      const out = await generateText(createContextualPrompt(text, plats));
      return out?.trim() || "Désolé, je n'ai pas pu générer de réponse. Pouvez-vous reformuler votre question ?";
    } catch (error) {
      console.error('Erreur Gemini AI :', error);
      if (error.message?.includes('SAFETY')) return 'Je ne peux pas répondre à cette question. Posez-moi plutôt une question sur la cuisine !';
      if (error.message?.includes('quota') || error.message?.includes('limit')) return 'Le service IA a atteint ses limites. Réessayez dans quelques instants.';
      if (error.message?.includes('API key')) return 'Clé API invalide. Vérifiez REACT_APP_GEMINI_API_KEY dans le fichier .env.';
      return 'Erreur lors de la génération de la réponse. Vérifiez votre connexion internet ou réessayez plus tard.';
    }
  };

  const send = async (raw = input) => {
    const text = raw.trim();
    if (!text || thinking || !model) return;
    setMessages((m) => [...m, { id: Date.now(), type: 'user', message: text, timestamp: new Date() }]);
    setInput('');
    setThinking(true);
    const reply = await answer(text);
    setMessages((m) => [...m, { id: Date.now() + 1, type: 'bot', message: reply, timestamp: new Date() }]);
    setThinking(false);
  };

  const userName = profile?.nomComplet || user?.email || '';

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.75, color: '#FFF3E0', background: `${patternBg('#FFF3E0', 0.1)}, linear-gradient(135deg, #E8622C, #A9370F)` }}>
        <Avatar src={`${process.env.PUBLIC_URL}/logo.svg`} sx={{ width: 40, height: 40, bgcolor: 'rgba(255,243,224,.2)' }} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 750 }}>Chef IA</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>{model ? (thinking ? 'Écrit…' : 'En ligne · Gemini') : 'Hors service'}</Typography>
        </Box>
        <Tooltip title="Nouvelle conversation">
          <IconButton onClick={() => setMessages([{ ...WELCOME, id: Date.now(), message: 'Conversation réinitialisée ! Quelle est votre question culinaire ?', timestamp: new Date() }])} sx={{ color: 'inherit' }}>
            <RestartAltRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'sand.main', backgroundImage: patternBg('#C2461A', 0.05) }}>
        {!model && (
          <Alert severity="warning">L'assistant n'est pas configuré : ajoutez REACT_APP_GEMINI_API_KEY dans le fichier .env puis relancez l'application.</Alert>
        )}
        {messages.map((m) => <Bubble key={m.id} msg={m} userName={userName} userPhoto={profile?.photoProfil || undefined} />)}
        {thinking && (
          <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
            <Avatar src={`${process.env.PUBLIC_URL}/logo.svg`} sx={{ width: 32, height: 32 }} />
            <Box sx={{ display: 'flex', gap: 0.6, px: 2, py: 1.5, borderRadius: 4, bgcolor: 'background.paper', '@keyframes dot': { '0%,80%,100%': { opacity: 0.3, transform: 'translateY(0)' }, '40%': { opacity: 1, transform: 'translateY(-3px)' } } }}>
              {[0, 1, 2].map((i) => <Box key={i} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main', animation: `dot 1.2s ${i * 0.15}s infinite` }} />)}
            </Box>
          </Box>
        )}
        {messages.length === 1 && model && (
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mt: 'auto' }}>
            {SUGGESTIONS.map((s) => (
              <ButtonBase key={s} onClick={() => send(s)} sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 1.5, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', fontSize: 13.5, fontWeight: 600, '&:hover': { borderColor: 'primary.main' } }}>
                {s}
              </ButtonBase>
            ))}
          </Box>
        )}
        <div ref={endRef} />
      </Box>

      <Box component="form" onSubmit={(e) => { e.preventDefault(); send(); }} sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <InputBase
          multiline maxRows={4} fullWidth value={input} onChange={(e) => setInput(e.target.value)} disabled={!model}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Posez votre question sur la cuisine, les prix au marché…"
          sx={{ px: 2, py: 1.25, borderRadius: 4, bgcolor: 'sand.main', fontSize: 15 }}
        />
        <IconButton type="submit" disabled={!input.trim() || thinking || !model}
          sx={{ width: 46, height: 46, bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'divider' } }}>
          <SendRoundedIcon />
        </IconButton>
      </Box>
    </Card>
  );
}

function RecipeSearch({ plats, height, onOpen }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const n = normalize(q);
    return (plats || []).filter((p) =>
      normalize(`${p.nom} ${p.categoriePlat} ${p.description} ${(p.ingredientsNecessaires || []).map((i) => i.nom).join(' ')}`).includes(n)
    );
  }, [plats, q]);

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height, overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth placeholder="Nom, catégorie, ingrédient…" value={q} onChange={(e) => setQ(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
          {plats ? `${results.length} recette(s)` : 'Chargement…'}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {plats && results.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <RestaurantMenuRoundedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
            <Typography>Aucune recette trouvée. Demandez au Chef IA !</Typography>
          </Box>
        )}
        {results.map((p) => (
          <ButtonBase key={p.id} onClick={() => onOpen(p)} sx={{ display: 'flex', gap: 1.5, p: 1, borderRadius: 3, justifyContent: 'flex-start', textAlign: 'left', '&:hover': { bgcolor: 'sand.main' } }}>
            <DishImage src={p.photoURL} name={p.nom} height={64} radius={3} sx={{ width: 64 }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 700 }} noWrap>{p.nom}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>{p.description || p.categoriePlat}</Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25, color: 'text.secondary' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>{p.categoriePlat || 'Autre'}</Typography>
                {p.tempsCuisson ? (
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}><TimerRoundedIcon sx={{ fontSize: 14 }} /> {p.tempsCuisson} min</Typography>
                ) : null}
              </Box>
            </Box>
          </ButtonBase>
        ))}
      </Box>
    </Card>
  );
}

function SearchPage() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [plats, setPlats] = useState(null);
  const [tab, setTab] = useState(0);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    getPlats().then(setPlats).catch((err) => { console.error('Erreur plats :', err); setPlats([]); });
  }, []);

  const height = { xs: 'calc(100dvh - 300px - env(safe-area-inset-bottom))', md: 'calc(100dvh - 250px)' };

  return (
    <Box>
      <PageHeader eyebrow="Assistant" title="Recherche & Chef IA" subtitle="Retrouvez une recette de la famille ou posez n'importe quelle question culinaire." />
      {desktop ? (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: '1.5fr 1fr' }}>
          <Assistant plats={plats || []} height={height.md} />
          <RecipeSearch plats={plats} height={height.md} onOpen={setViewing} />
        </Box>
      ) : (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, minHeight: 44, '& .MuiTabs-indicator': { height: 3, borderRadius: 3 } }}>
            <Tab icon={<AutoAwesomeRoundedIcon fontSize="small" />} iconPosition="start" label="Chef IA" />
            <Tab icon={<SearchRoundedIcon fontSize="small" />} iconPosition="start" label="Recettes" />
          </Tabs>
          <Box sx={{ minHeight: 420 }}>
            {tab === 0 ? <Assistant plats={plats || []} height={{ xs: 'max(420px, calc(100dvh - 330px - env(safe-area-inset-bottom)))', md: 600 }} />
              : <RecipeSearch plats={plats} height={{ xs: 'max(420px, calc(100dvh - 330px - env(safe-area-inset-bottom)))', md: 600 }} onOpen={setViewing} />}
          </Box>
        </>
      )}
      <PlatDetail plat={viewing} onClose={() => setViewing(null)} />
    </Box>
  );
}

export default SearchPage;
