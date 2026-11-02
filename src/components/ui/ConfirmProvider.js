import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { tint } from '../../theme/theme';

const ConfirmContext = createContext(() => Promise.resolve(false));

/**
 * Remplace window.confirm par un vrai dialogue.
 * Usage : const confirm = useConfirm(); if (await confirm({ title, message })) …
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setState({ confirmLabel: 'Confirmer', danger: true, ...opts });
      }),
    []
  );

  const close = (value) => {
    resolver.current?.(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={Boolean(state)} onClose={() => close(false)} maxWidth="xs" fullWidth>
        {state && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 42, height: 42, borderRadius: '14px', display: 'grid', placeItems: 'center', flexShrink: 0,
                  color: state.danger ? 'error.main' : 'primary.main',
                  bgcolor: tint(state.danger ? 'error' : 'primary', 0.12),
                }}
              >
                <WarningAmberRoundedIcon />
              </Box>
              {state.title}
            </DialogTitle>
            {state.message && (
              <DialogContent>
                <Typography color="text.secondary">{state.message}</Typography>
              </DialogContent>
            )}
            <DialogActions>
              <Button onClick={() => close(false)} color="inherit">Annuler</Button>
              <Button
                onClick={() => close(true)}
                variant="contained"
                color={state.danger ? 'error' : 'primary'}
                autoFocus
              >
                {state.confirmLabel}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
