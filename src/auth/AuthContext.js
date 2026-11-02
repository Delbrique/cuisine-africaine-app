import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { getMembreById } from '../services/membreService';
import SplashScreen from '../components/SplashScreen';

const AuthContext = createContext({ user: null, profile: null, loading: true, refreshProfile: () => {} });

const loadProfile = async (user) => {
  if (!user) return null;
  try {
    // Fiche créée à l'inscription (id = uid) ou ajoutée par un proche (id = email).
    return (await getMembreById(user.uid)) || (user.email ? await getMembreById(user.email) : null);
  } catch {
    return null;
  }
};

/** Un seul abonnement Firebase Auth pour toute l'application. */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, profile: null, loading: true });

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        setState({ user, profile: await loadProfile(user), loading: false });
      }),
    []
  );

  const refreshProfile = useCallback(async () => {
    const profile = await loadProfile(auth.currentUser);
    setState((s) => ({ ...s, profile }));
  }, []);

  return <AuthContext.Provider value={{ ...state, refreshProfile }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Route réservée aux utilisateurs connectés. */
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

/**
 * Route réservée aux visiteurs. Redirige seulement si l'utilisateur était déjà connecté
 * en arrivant : une connexion faite depuis la page (inscription en cours) n'interrompt pas son flux.
 */
export function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  const decided = useRef(null);
  if (loading) return <SplashScreen />;
  if (decided.current === null) decided.current = Boolean(user);
  if (decided.current) return <Navigate to="/famille-dashboard" replace />;
  return children;
}
