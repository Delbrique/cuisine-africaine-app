import React from 'react';
import { Box, Typography } from '@mui/material';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ShoppingBasketRoundedIcon from '@mui/icons-material/ShoppingBasketRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { Logo, ThemeToggle, patternBg } from '../ui';
import kitchenVideo from '../../assets/videos/kitchen.mp4';

const FEATURES = [
  { icon: CalendarMonthRoundedIcon, text: 'Le planning des repas de la semaine en un geste' },
  { icon: ShoppingBasketRoundedIcon, text: 'La liste de marché et le stock toujours à jour' },
  { icon: AutoAwesomeRoundedIcon, text: 'Un assistant IA expert de la cuisine africaine' },
];

/** Mise en page des écrans de connexion / inscription : visuel à gauche, formulaire à droite. */
export default function AuthLayout({ children, wide = false }) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', bgcolor: 'background.default' }}>
      {/* Panneau visuel (desktop) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' }, position: 'relative', overflow: 'hidden',
          width: { md: '44%', lg: '48%' }, flexDirection: 'column', justifyContent: 'space-between',
          p: 6, color: '#FFF3E0', bgcolor: '#1F1410',
        }}
      >
        <Box component="video" autoPlay muted loop playsInline src={kitchenVideo}
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
        <Box sx={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(160deg, rgba(194,70,26,.85) 0%, rgba(31,20,16,.55) 45%, rgba(31,20,16,.95) 100%), ${patternBg('#F2A93B', 0.12)}`,
        }} />
        <Box sx={{ position: 'relative' }}>
          <Logo size={52} color="#FFF3E0" />
        </Box>
        <Box sx={{ position: 'relative', maxWidth: 520 }}>
          <Typography sx={{ fontFamily: '"Fraunces Variable", serif', fontWeight: 650, fontSize: { md: 40, lg: 50 }, lineHeight: 1.05, letterSpacing: '-0.02em', mb: 3 }}>
            Toute la cuisine de la famille,{' '}
            <Box component="span" sx={{ fontStyle: 'italic', color: '#F2A93B' }}>au même endroit.</Box>
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,243,224,.12)', backdropFilter: 'blur(6px)' }}>
                  <Icon sx={{ fontSize: 20, color: '#F2A93B' }} />
                </Box>
                <Typography sx={{ fontWeight: 550, opacity: 0.92 }}>{text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Typography variant="caption" sx={{ position: 'relative', opacity: 0.55 }}>
          Ndolé, poulet DG, eru, mafé… on s'occupe du reste.
        </Typography>
      </Box>

      {/* Formulaire */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        <ThemeToggle
          sx={{
            position: 'absolute', zIndex: 2, right: 12, top: 'calc(env(safe-area-inset-top) + 12px)',
            color: { xs: '#FFF3E0', md: 'text.primary' }, bgcolor: { xs: 'rgba(255,243,224,.15)', md: 'transparent' },
          }}
        />
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' }, alignItems: 'center', justifyContent: 'center',
            pt: 'calc(env(safe-area-inset-top) + 28px)', pb: 5, mb: -3,
            background: `${patternBg('#FFF3E0', 0.14)}, linear-gradient(135deg, #E8622C, #A9370F)`,
          }}
        >
          <Logo size={46} color="#FFF3E0" />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'center', px: { xs: 2, sm: 4 }, pb: 'calc(env(safe-area-inset-bottom) + 32px)' }}>
          <Box
            sx={{
              width: '100%', maxWidth: wide ? 620 : 440, bgcolor: 'background.paper',
              borderRadius: 6, p: { xs: 3, sm: 4.5 }, mt: { xs: 0, md: 4 },
              border: '1px solid', borderColor: 'divider',
              boxShadow: { xs: '0 20px 50px rgba(31,20,16,.12)', md: 'none' },
              animation: 'fadeUp .45s ease both',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
