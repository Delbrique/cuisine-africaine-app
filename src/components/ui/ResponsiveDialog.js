import React from 'react';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

/** Dialogue plein écran sur mobile, centré sur desktop. */
export default function ResponsiveDialog({ open, onClose, title, children, actions, maxWidth = 'sm', onSubmit, contentSx }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formProps = onSubmit
    ? { component: 'form', onSubmit: (e) => { e.preventDefault(); onSubmit(e); } }
    : {};

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth} fullScreen={mobile} PaperProps={formProps} scroll="paper">
      <DialogTitle sx={{ pr: 7, pt: mobile ? 'calc(env(safe-area-inset-top) + 18px)' : undefined }}>
        {title}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 14, top: mobile ? 'calc(env(safe-area-inset-top) + 14px)' : 16 }} aria-label="Fermer">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'divider', ...contentSx }}>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </DialogContent>
      {actions && (
        <DialogActions sx={{ pb: mobile ? 'calc(env(safe-area-inset-bottom) + 16px)' : undefined }}>{actions}</DialogActions>
      )}
    </Dialog>
  );
}
