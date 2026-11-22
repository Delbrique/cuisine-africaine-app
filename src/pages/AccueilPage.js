// src/pages/AccueilPage.js
// Page d'accueil publique (vitrine) : c'est la page que Google indexe et que
// voient les visiteurs non connectés. Tout le texte est lisible par les moteurs
// de recherche, avec les mots que les gens tapent dans Google.
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Container, Typography,
} from '@mui/material';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ShoppingBasketRoundedIcon from '@mui/icons-material/ShoppingBasketRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Logo, ThemeToggle, patternBg } from '../components/ui';

const display = '"Fraunces Variable", "Fraunces", Georgia, serif';

const FEATURES = [
  { icon: CalendarMonthRoundedIcon, title: 'Planning des repas de la semaine', text: 'Petit-déjeuner, déjeuner et dîner pour toute la semaine, en quelques gestes. Fini « on mange quoi ce soir ? ».' },
  { icon: ShoppingBasketRoundedIcon, title: 'Liste de marché automatique', text: 'La liste des courses se remplit à partir de votre planning, avec les bonnes quantités pour toute la famille.' },
  { icon: Inventory2RoundedIcon, title: 'Stock toujours à jour', text: 'Suivez ce qu’il reste dans la cuisine et soyez alerté avant qu’un ingrédient ne manque ou ne se périme.' },
  { icon: AutoAwesomeRoundedIcon, title: 'Assistant IA de cuisine africaine', text: 'Recettes, astuces, idées de plats : posez vos questions à un assistant expert de la cuisine africaine.' },
  { icon: GroupsRoundedIcon, title: 'Pensé pour toute la famille', text: 'Chaque membre avec ses goûts, ses allergies et ses besoins, pour des menus adaptés à tous.' },
  { icon: ForumRoundedIcon, title: 'Messagerie familiale', text: 'Discutez des menus et des courses avec votre famille, directement dans l’application.' },
];

const PLATS = [
  'Ndolé', 'Poulet DG', 'Eru', 'Mafé', 'Thiéboudienne', 'Jollof rice', 'Attiéké poisson',
  'Koki', 'Okok', 'Sauce gombo', 'Yassa', 'Foufou sauce arachide', 'Achu', 'Alloco',
];

const STEPS = [
  ['1', 'Créez votre compte', 'Inscription gratuite en moins d’une minute.'],
  ['2', 'Configurez votre famille', 'Ajoutez les membres, leurs goûts et leurs besoins.'],
  ['3', 'Planifiez, faites le marché', 'Choisissez vos plats : la liste de courses et le stock suivent.'],
];

const FAQ = [
  ['Cuisine Africaine est-elle gratuite ?', 'Oui, la création de compte et l’utilisation de l’application sont gratuites.'],
  ['Faut-il installer quelque chose ?', 'Non. L’application fonctionne dans le navigateur, sur téléphone, tablette et ordinateur. Vous pouvez aussi l’installer sur l’écran d’accueil de votre téléphone, comme une vraie application.'],
  ['Quels plats puis-je planifier ?', 'Tous ceux que vous voulez : vos recettes de famille, les classiques de la cuisine camerounaise, sénégalaise, ivoirienne ou nigériane, et des plats du monde entier.'],
  ['Comment fonctionne la liste de marché ?', 'Quand vous planifiez vos repas, l’application additionne les ingrédients de chaque plat, retire ce que vous avez déjà en stock et prépare la liste des courses.'],
];

export default function AccueilPage() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh' }}>
      {/* ---------- Bandeau principal ---------- */}
      <Box
        component="header"
        sx={{
          position: 'relative', overflow: 'hidden', color: '#FFF3E0',
          background: `${patternBg('#F2A93B', 0.12)}, linear-gradient(160deg, #A9370F 0%, #6B230A 45%, #1F1410 100%)`,
          pt: 'calc(env(safe-area-inset-top) + 16px)', pb: { xs: 7, md: 11 },
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: { xs: 5, md: 9 } }}>
            <Logo size={44} color="#FFF3E0" subtitle="Le carnet de la famille" />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ThemeToggle sx={{ color: '#FFF3E0', bgcolor: 'rgba(255,243,224,.12)' }} />
              <Button component={RouterLink} to="/login" sx={{ color: '#FFF3E0', display: { xs: 'none', sm: 'inline-flex' } }}>
                Se connecter
              </Button>
            </Box>
          </Box>

          <Box sx={{ maxWidth: 760 }}>
            <Typography
              component="h1"
              sx={{ fontFamily: display, fontWeight: 650, fontSize: { xs: 36, sm: 48, md: 60 }, lineHeight: 1.05, letterSpacing: '-0.02em', mb: 2.5 }}
            >
              Planifiez les repas africains{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: '#F2A93B' }}>de toute la famille.</Box>
            </Typography>
            <Typography sx={{ fontSize: { xs: 17, md: 20 }, lineHeight: 1.55, opacity: 0.92, mb: 4, maxWidth: 620 }}>
              Menus de la semaine, liste de marché automatique, stock et recettes : Cuisine Africaine
              organise la cuisine de la maison pour que vous mangiez mieux, gaspilliez moins et gagniez du temps.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
              <Button
                component={RouterLink} to="/inscription" size="large"
                sx={{ bgcolor: '#F2A93B', color: '#2A1A12', '&:hover': { bgcolor: '#F5BC63' } }}
              >
                Créer mon compte gratuit
              </Button>
              <Button
                component={RouterLink} to="/login" size="large" variant="outlined"
                sx={{ color: '#FFF3E0', borderColor: 'rgba(255,243,224,.5)', '&:hover': { borderColor: '#FFF3E0', bgcolor: 'rgba(255,243,224,.08)' } }}
              >
                J’ai déjà un compte
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box component="main">
        {/* ---------- Fonctionnalités ---------- */}
        <Container component="section" maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
          <Typography component="h2" variant="h3" sx={{ fontSize: { xs: 30, md: 40 }, textAlign: 'center', mb: { xs: 4, md: 6 } }}>
            Tout pour organiser la cuisine de la maison
          </Typography>
          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' } }}>
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <Box key={title} sx={{ p: 3, borderRadius: 5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ width: 46, height: 46, borderRadius: '14px', display: 'grid', placeItems: 'center', mb: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  <Icon />
                </Box>
                <Typography component="h3" variant="h6" sx={{ mb: 0.75 }}>{title}</Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>{text}</Typography>
              </Box>
            ))}
          </Box>
        </Container>

        {/* ---------- Plats ---------- */}
        <Box component="section" sx={{ bgcolor: 'sand.main', py: { xs: 7, md: 10 } }}>
          <Container maxWidth="md" sx={{ textAlign: 'center' }}>
            <Typography component="h2" variant="h3" sx={{ fontSize: { xs: 30, md: 40 }, mb: 2 }}>
              Les grands plats de la cuisine africaine
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, fontSize: 17, lineHeight: 1.6 }}>
              Du Cameroun au Sénégal, en passant par la Côte d’Ivoire et le Nigeria : planifiez les plats
              que votre famille aime, et découvrez-en de nouveaux.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {PLATS.map((p) => (
                <Chip key={p} label={p} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', fontSize: 15, height: 36 }} />
              ))}
            </Box>
          </Container>
        </Box>

        {/* ---------- Comment ça marche ---------- */}
        <Container component="section" maxWidth="md" sx={{ py: { xs: 7, md: 10 } }}>
          <Typography component="h2" variant="h3" sx={{ fontSize: { xs: 30, md: 40 }, textAlign: 'center', mb: { xs: 4, md: 6 } }}>
            Comment ça marche ?
          </Typography>
          <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            {STEPS.map(([n, title, text]) => (
              <Box key={n} sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 52, height: 52, mx: 'auto', mb: 1.5, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'secondary.main', color: 'secondary.contrastText', fontFamily: display, fontWeight: 700, fontSize: 22 }}>
                  {n}
                </Box>
                <Typography component="h3" variant="h6">{title}</Typography>
                <Typography color="text.secondary">{text}</Typography>
              </Box>
            ))}
          </Box>
        </Container>

        {/* ---------- Questions fréquentes ---------- */}
        <Container component="section" maxWidth="md" sx={{ pb: { xs: 7, md: 10 } }}>
          <Typography component="h2" variant="h3" sx={{ fontSize: { xs: 30, md: 40 }, textAlign: 'center', mb: 4 }}>
            Questions fréquentes
          </Typography>
          {FAQ.map(([q, r]) => (
            <Accordion key={q} disableGutters sx={{ mb: 1.25, borderRadius: '16px !important', border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography component="h3" sx={{ fontWeight: 650 }}>{q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>{r}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
          <Box sx={{ textAlign: 'center', mt: 5 }}>
            <Button component={RouterLink} to="/inscription" variant="contained" size="large">
              Créer mon compte gratuit
            </Button>
          </Box>
        </Container>
      </Box>

      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', py: 3, px: 2, textAlign: 'center', pb: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Cuisine Africaine – Planning des repas africains en famille
        </Typography>
      </Box>
    </Box>
  );
}
