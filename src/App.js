// src/App.js
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Button } from '@mui/material';
import { ThemeProvider, useColorScheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider, closeSnackbar, enqueueSnackbar } from 'notistack';

import theme from './theme/theme';
import { AuthProvider, PublicOnly, RequireAuth } from './auth/AuthContext';
import { ConfirmProvider } from './components/ui';
import SplashScreen from './components/SplashScreen';
import { applyUpdate } from './serviceWorkerRegistration';
import Seo from './components/Seo';

const DESC_ACCUEIL = 'Planifiez les repas africains de votre famille : menus de la semaine, liste de marché automatique, stock, recettes (ndolé, poulet DG, eru, mafé…) et assistant IA. Gratuit.';

const AccueilPage = lazy(() => import('./pages/AccueilPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const InscriptionPage = lazy(() => import('./components/InscriptionPage'));
const ConfigurerFamillePage = lazy(() => import('./pages/ConfigurerFamillePage'));
const FamilleDashboardLayout = lazy(() => import('./pages/Dashboard/FamilleDashboardLayout'));

/** Propose de recharger quand une nouvelle version de la PWA est disponible. */
function UpdateNotifier() {
  useEffect(() => {
    const onUpdate = (e) =>
      enqueueSnackbar('Une nouvelle version est disponible.', {
        variant: 'info',
        persist: true,
        action: (key) => (
          <Button color="inherit" size="small" onClick={() => { closeSnackbar(key); applyUpdate(e.detail); }}>
            Mettre à jour
          </Button>
        ),
      });
    window.addEventListener('sw-update', onUpdate);
    return () => window.removeEventListener('sw-update', onUpdate);
  }, []);
  return null;
}

/** Aligne la couleur de la barre d'état (PWA) sur le thème choisi. */
function ThemeColorSync() {
  const { colorScheme } = useColorScheme();
  useEffect(() => {
    if (!colorScheme) return;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute('content', colorScheme === 'dark' ? '#1A120D' : '#C2461A');
      m.removeAttribute('media');
    });
  }, [colorScheme]);
  return null;
}

function App() {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <ThemeColorSync />
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={3500}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        style={{ borderRadius: 14, fontWeight: 600, fontFamily: 'inherit' }}
      >
        <ConfirmProvider>
          <AuthProvider>
            <UpdateNotifier />
            <Router>
              <Suspense fallback={<SplashScreen />}>
                <Routes>
                  {/* Vitrine publique (indexée par Google) ; un utilisateur connecté va directement au tableau de bord. */}
                  <Route path="/" element={<PublicOnly><Seo title="Planning des repas africains en famille" description={DESC_ACCUEIL} path="/" /><AccueilPage /></PublicOnly>} />
                  <Route path="/login" element={<PublicOnly><Seo title="Connexion" description="Connectez-vous à Cuisine Africaine pour retrouver le planning des repas, la liste de marché et le stock de votre famille." path="/login" /><LoginPage /></PublicOnly>} />
                  <Route path="/inscription" element={<PublicOnly><Seo title="Créer un compte gratuit" description="Inscrivez-vous gratuitement à Cuisine Africaine et organisez les repas africains de toute votre famille : menus, liste de marché, stock." path="/inscription" /><InscriptionPage /></PublicOnly>} />
                  <Route path="/configurer-famille" element={<RequireAuth><Seo title="Configurer ma famille" path="/configurer-famille" noindex /><ConfigurerFamillePage /></RequireAuth>} />
                  <Route path="/famille-dashboard/*" element={<RequireAuth><Seo title="Mon espace famille" path="/famille-dashboard" noindex /><FamilleDashboardLayout /></RequireAuth>} />
                  <Route path="*" element={<Navigate to="/famille-dashboard" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </AuthProvider>
        </ConfirmProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
