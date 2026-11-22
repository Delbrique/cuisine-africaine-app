import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { ensureFamily, setSession } from '../services/familleService';
import { migrateLegacyShoppingList } from '../services/shoppingList';
import SplashScreen from '../components/SplashScreen';

const AuthContext = createContext({
  user: null, profile: null, familleId: null, loading: true, error: '', refreshProfile: () => {},
});

/** Charge (ou crée au premier passage) la fiche et la famille du compte, puis ouvre la session famille. */
const loadProfile = async (user) => {
  if (!user) {
    setSession(null);
    return { profile: null, error: '' };
  }
  try {
    const profile = await ensureFamily(user);
    setSession({ uid: user.uid, familleId: profile?.familleId });
    migrateLegacyShoppingList();
    return { profile, error: '' };
  } catch (err) {
    console.error('Impossible de charger la famille :', err);
    setSession(null);
    return { profile: null, error: 'Impossible de charger votre famille. Vérifiez votre connexion puis réessayez.' };
  }
};

/** Un seul abonnement Firebase Auth pour toute l'application. */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, profile: null, loading: true, error: '' });

  useEffect(() => {
    // Retour d'une connexion Google par redirection (mobile / app installée) : on garde l'erreur éventuelle
    // pour l'afficher sur la page de connexion.
    getRedirectResult(auth).catch((err) => {
      console.error('Connexion Google (redirection) :', err);
      sessionStorage.setItem('authRedirectError', err.code || 'auth/unknown');
    });
    return onAuthStateChanged(auth, async (user) => {
      // Le compte change : plus aucune donnée de l'ancienne famille n'est accessible.
      setState((s) => ({ ...s, user, profile: s.user?.uid === user?.uid ? s.profile : null }));
      const { profile, error } = await loadProfile(user);
      setState({ user, profile, loading: false, error });
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    const { profile, error } = await loadProfile(auth.currentUser);
    setState((s) => ({ ...s, profile, error }));
    return profile;
  }, []);

  const value = { ...state, familleId: state.profile?.familleId || null, refreshProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Route réservée aux utilisateurs connectés, dont la famille est chargée. */
export function RequireAuth({ children }) {
  const { user, profile, loading, error, refreshProfile } = useAuth();
  const location = useLocation();
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  // Sans famille chargée, aucune page privée ne s'affiche : jamais de données mélangées.
  if (!profile?.familleId) {
    if (!error) return <SplashScreen />;
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <p style={{ fontSize: 17, marginBottom: 16 }}>{error}</p>
          <button
            type="button" onClick={refreshProfile}
            style={{ padding: '10px 18px', borderRadius: 12, border: 0, background: '#C2461A', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }
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
