import React, { Suspense, lazy, useState } from 'react';
import { Link as RouterLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, ButtonBase, Drawer, Paper, SwipeableDrawer, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import InstallMobileRoundedIcon from '@mui/icons-material/InstallMobileRounded';

import { Logo, ThemeToggle, patternBg } from '../../components/ui';
import SplashScreen from '../../components/SplashScreen';
import ErrorBoundary from '../../components/ErrorBoundary';
import usePwaInstall from '../../pwa/usePwaInstall';
import UserMenu from './UserMenu';
import { ALL_ITEMS, BOTTOM_TABS, NAV_SECTIONS, isActive } from './navigation';
import { tint } from '../../theme/theme';

const AccueilPage = lazy(() => import('./AccueilPage'));
const MembresList = lazy(() => import('./MembresList'));
const AddEditMembre = lazy(() => import('./AddEditMembre'));
const PlatsPage = lazy(() => import('./PlatsEtIngredients/PlatsPage'));
const IngredientsPage = lazy(() => import('./PlatsEtIngredients/IngredientsPage'));
const StockPage = lazy(() => import('./StockPage'));
const PlanningPage = lazy(() => import('./PlanningPage'));
const ListeMarchePage = lazy(() => import('./ListeMarchePage'));
const SearchPage = lazy(() => import('./Searchpage'));
const DecouvertePage = lazy(() => import('./DecouvertePage'));
const ChatPage = lazy(() => import('../../components/Communication/ChatPage'));

const SIDEBAR = 272;
const cream = '#FFF3E0';

function SidebarLink({ item, active }) {
  const Icon = item.icon;
  return (
    <ButtonBase
      component={RouterLink}
      to={item.path}
      sx={{
        width: '100%', justifyContent: 'flex-start', gap: 1.5, px: 1.5, py: 1.1, borderRadius: 3,
        color: active ? '#fff' : 'rgba(255,243,224,0.7)',
        fontWeight: active ? 700 : 550, fontSize: 14.5,
        background: active ? 'linear-gradient(135deg, #E8622C, #B83A14)' : 'transparent',
        boxShadow: active ? '0 8px 20px rgba(194,70,26,0.35)' : 'none',
        transition: 'all .18s',
        '&:hover': { bgcolor: active ? undefined : 'rgba(255,243,224,0.07)', color: '#fff' },
      }}
    >
      <Icon sx={{ fontSize: 21, opacity: active ? 1 : 0.85 }} />
      {item.label}
    </ButtonBase>
  );
}

function Sidebar({ pathname }) {
  const { canInstall, install } = usePwaInstall();
  return (
    <Box
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'ink.main', color: cream,
        backgroundImage: `linear-gradient(180deg, rgba(31,20,16,0) 55%, rgba(31,20,16,1) 100%), ${patternBg('#F2A93B', 0.07)}`,
      }}
    >
      <Box sx={{ px: 2.5, pt: 3, pb: 2.5 }}>
        <Logo size={44} color={cream} subtitle="Le carnet de la famille" />
      </Box>
      <Box component="nav" sx={{ flex: 1, overflowY: 'auto', px: 1.75, pb: 2 }}>
        {NAV_SECTIONS.map((section, i) => (
          <Box key={i} sx={{ mb: 1.5 }}>
            {section.title && (
              <Typography sx={{ px: 1.5, py: 1, fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,243,224,0.38)' }}>
                {section.title}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
              {section.items.map((item) => (
                <SidebarLink key={item.path} item={item} active={isActive(item, pathname)} />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 1.75, borderTop: '1px solid rgba(255,243,224,0.08)' }}>
        {canInstall && (
          <ButtonBase
            onClick={install}
            sx={{ width: '100%', mb: 1.25, p: 1.25, borderRadius: 3, gap: 1, justifyContent: 'flex-start', color: '#1F1410', fontWeight: 700, fontSize: 13.5, bgcolor: '#F2A93B' }}
          >
            <InstallMobileRoundedIcon fontSize="small" /> Installer l'application
          </ButtonBase>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}><UserMenu variant="card" /></Box>
          <ThemeToggle sx={{ color: cream, bgcolor: 'rgba(255,243,224,0.06)', '&:hover': { bgcolor: 'rgba(255,243,224,0.11)' } }} />
        </Box>
      </Box>
    </Box>
  );
}

function MobileTopBar({ pathname }) {
  const current = ALL_ITEMS.find((i) => isActive(i, pathname));
  return (
    <Box
      component="header"
      sx={{
        position: 'sticky', top: 0, zIndex: 1100,
        pt: 'env(safe-area-inset-top)',
        bgcolor: tint('background.default', 0.82),
        backdropFilter: 'saturate(180%) blur(16px)',
        borderBottom: '1px solid', borderColor: 'divider',
      }}
    >
      <Box sx={{ height: 60, px: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box component="img" src={`${process.env.PUBLIC_URL}/logo.svg`} alt="" sx={{ width: 34, height: 34 }} />
        <Typography sx={{ flex: 1, fontFamily: '"Fraunces Variable", serif', fontWeight: 700, fontSize: 19 }} noWrap>
          {current?.label || 'Cuisine Africaine'}
        </Typography>
        <ThemeToggle />
        <UserMenu variant="avatar" />
      </Box>
    </Box>
  );
}

function BottomBar({ pathname, onMore }) {
  const tabs = BOTTOM_TABS.map((p) => ALL_ITEMS.find((i) => i.path === p));
  const inMore = !tabs.some((t) => isActive(t, pathname));
  const Tab = ({ active, icon: Icon, label, ...props }) => (
    <ButtonBase
      {...props}
      sx={{ flex: 1, flexDirection: 'column', gap: 0.4, py: 0.9, color: active ? 'primary.main' : 'text.secondary', fontSize: 11, fontWeight: active ? 800 : 600 }}
    >
      <Box sx={{ px: 2, py: 0.4, borderRadius: 99, bgcolor: active ? tint('primary', 0.13) : 'transparent', display: 'grid', placeItems: 'center', transition: 'all .2s' }}>
        <Icon sx={{ fontSize: 23 }} />
      </Box>
      {label}
    </ButtonBase>
  );
  return (
    <Paper
      component="nav"
      square
      sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100, display: 'flex',
        pb: 'env(safe-area-inset-bottom)', borderTop: '1px solid', borderColor: 'divider',
        bgcolor: tint('background.paper', 0.9), backdropFilter: 'saturate(180%) blur(16px)', borderRadius: 0,
      }}
    >
      {tabs.map((t) => (
        <Tab key={t.path} component={RouterLink} to={t.path} active={isActive(t, pathname)} icon={t.icon} label={t.label} />
      ))}
      <Tab onClick={onMore} active={inMore} icon={MoreHorizRoundedIcon} label="Plus" />
    </Paper>
  );
}

function MoreSheet({ open, onClose, onOpen, pathname }) {
  const navigate = useNavigate();
  const others = ALL_ITEMS.filter((i) => !BOTTOM_TABS.includes(i.path));
  return (
    <SwipeableDrawer
      anchor="bottom" open={open} onClose={onClose} onOpen={onOpen} disableSwipeToOpen
      PaperProps={{ sx: { borderRadius: '28px 28px 0 0', pb: 'calc(env(safe-area-inset-bottom) + 16px)' } }}
    >
      <Box sx={{ width: 42, height: 5, borderRadius: 9, bgcolor: 'divider', mx: 'auto', mt: 1.25, mb: 2 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25, px: 2 }}>
        {others.map((item) => {
          const Icon = item.icon;
          const active = isActive(item, pathname);
          return (
            <ButtonBase
              key={item.path}
              onClick={() => { onClose(); navigate(item.path); }}
              sx={{
                flexDirection: 'column', gap: 1, py: 2, borderRadius: 4, fontWeight: 650, fontSize: 13,
                bgcolor: active ? tint('primary', 0.12) : 'sand.main', color: active ? 'primary.main' : 'text.primary',
              }}
            >
              <Icon sx={{ color: 'primary.main' }} />
              {item.label}
            </ButtonBase>
          );
        })}
      </Box>
    </SwipeableDrawer>
  );
}

function FamilleDashboardLayout() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const { pathname } = useLocation();
  const [more, setMore] = useState(false);
  const isChat = pathname.startsWith('/famille-dashboard/messages');

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      {desktop && (
        <Drawer variant="permanent" sx={{ width: SIDEBAR, flexShrink: 0, '& .MuiDrawer-paper': { width: SIDEBAR, border: 'none' } }}>
          <Sidebar pathname={pathname} />
        </Drawer>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {!desktop && <MobileTopBar pathname={pathname} />}
        <Box
          component="main"
          key={pathname}
          sx={{
            flex: 1, width: '100%', maxWidth: isChat ? 'none' : 1320, mx: 'auto',
            px: isChat ? 0 : { xs: 2, sm: 3, md: 5 },
            pt: isChat ? 0 : { xs: 2.5, md: 5 },
            pb: isChat ? 0 : { xs: 'calc(96px + env(safe-area-inset-bottom))', md: 6 },
            animation: 'fadeUp .35s ease both',
          }}
        >
          <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<SplashScreen inline />}>
            <Routes>
              <Route index element={<AccueilPage />} />
              <Route path="membres" element={<MembresList />} />
              <Route path="add-membre" element={<AddEditMembre />} />
              <Route path="edit-membre/:id" element={<AddEditMembre />} />
              <Route path="plats" element={<PlatsPage />} />
              <Route path="ingredients" element={<IngredientsPage />} />
              <Route path="stock" element={<StockPage />} />
              <Route path="planning-repas" element={<PlanningPage />} />
              <Route path="liste-marche" element={<ListeMarchePage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="decouverte" element={<DecouvertePage />} />
              <Route path="DecouvertePage" element={<Navigate to="/famille-dashboard/decouverte" replace />} />
              <Route path="messages" element={<ChatPage />} />
              <Route path="*" element={<Navigate to="/famille-dashboard" replace />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </Box>
      </Box>

      {!desktop && (
        <>
          <BottomBar pathname={pathname} onMore={() => setMore(true)} />
          <MoreSheet open={more} onOpen={() => setMore(true)} onClose={() => setMore(false)} pathname={pathname} />
        </>
      )}
    </Box>
  );
}

export default FamilleDashboardLayout;
