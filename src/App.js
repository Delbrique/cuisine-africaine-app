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
                  <Route path="/" element={<Navigate to="/famille-dashboard" replace />} />
                  <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
                  <Route path="/inscription" element={<PublicOnly><InscriptionPage /></PublicOnly>} />
                  <Route path="/configurer-famille" element={<RequireAuth><ConfigurerFamillePage /></RequireAuth>} />
                  <Route path="/famille-dashboard/*" element={<RequireAuth><FamilleDashboardLayout /></RequireAuth>} />
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
