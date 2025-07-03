// src/App.js
import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, Button, CircularProgress } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase/firebase';
import ChatPage from './components/Communication/ChatPage';

// Importez les composants de thème de Material-UI
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'; // Pour réinitialiser les styles CSS du navigateur

// Importez votre thème personnalisé
import theme from './theme/theme'; // Assurez-vous que le chemin est correct

import InscriptionPage from './components/InscriptionPage';
import LoginPage from './components/LoginPage';
import ConfigurerFamillePage from './pages/ConfigurerFamillePage';
import FamilleDashboardLayout from './pages/Dashboard/FamilleDashboardLayout';
// StockPage is already imported within FamilleDashboardLayout, no need to import here directly unless it's a standalone route.

// Component for the logout button in the AppBar
const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erreur de déconnexion :', error);
    }
  };

  return (
    <Button color="inherit" onClick={handleLogout}>
      Déconnexion
    </Button>
  );
};

// Composant pour les routes protégées
const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        navigate('/login'); // Rediriger vers la page de connexion si non authentifié
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Nettoyage de l'abonnement
  }, [navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Vérification de l'authentification...</Typography>
      </Box>
    );
  }

  return isAuthenticated ? children : null; // Rendre les enfants si authentifié, sinon null (redirection gérée par navigate)
};

function App() {
  const [user, setUser] = useState(null); // État pour l'utilisateur connecté

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    // Enveloppez toute l'application avec ThemeProvider
    <ThemeProvider theme={theme}>
      {/* CssBaseline est utilisé pour fournir une base CSS cohérente et réinitialiser les styles du navigateur */}
      <CssBaseline />
      <Router>
        {/* Modifiez le style de cette Box principale pour qu'elle occupe toute la largeur */}
        <Box sx={{ flexGrow: 1, width: '100vw' }}> {/* Ajout de width: '100vw' */}
          <AppBar position="static" elevation={0}> {/* elevation={0} pour supprimer l'ombre (contour visuel) */}
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Typography
                variant="h4"
                component="div"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: 'inherit',
                  flexGrow: 1,
                  textAlign: 'center',
                }}
              >
                Cuisine Africaine App
              </Typography>
              {user && <LogoutButton />}
            </Toolbar>
          </AppBar>
          {/* Supprimez le padding de cette Box si vous voulez qu'elle soit aussi pleine */}
          <Box sx={{ p: 0 }}> {/* p: 0 ici signifie pas de padding */}
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/inscription" element={<InscriptionPage />} />

              <Route path="/configurer-famille" element={
                <PrivateRoute>
                  <ConfigurerFamillePage />
                </PrivateRoute>
              } />
              <Route path="/famille-dashboard/*" element={
                <PrivateRoute>
                  <FamilleDashboardLayout />
                </PrivateRoute>
              } />
              <Route path="/famille-dashboard/messages" element={<ChatPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;