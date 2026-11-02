import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

/** Évite l'écran blanc : affiche un message et propose de recharger si un écran plante. */
export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erreur dans un écran :', error, info);
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Box sx={{ textAlign: 'center', py: 10, px: 3 }}>
        <Box component="img" src={`${process.env.PUBLIC_URL}/logo.svg`} alt="" sx={{ width: 72, mb: 2, filter: 'grayscale(.4)' }} />
        <Typography variant="h5" sx={{ mb: 1 }}>Oups, quelque chose a brûlé en cuisine</Typography>
        <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 420, mx: 'auto' }}>
          Cet écran a rencontré une erreur inattendue. Rechargez la page pour réessayer.
        </Typography>
        <Button variant="contained" startIcon={<RefreshRoundedIcon />} onClick={() => window.location.reload()}>Recharger</Button>
      </Box>
    );
  }
}
