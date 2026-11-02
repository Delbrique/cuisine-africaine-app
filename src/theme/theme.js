import { createTheme } from '@mui/material/styles';

const display = '"Fraunces Variable", "Fraunces", Georgia, serif';
const body = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';

// Palette « terre d'Afrique » : terracotta, ocre, vert palmier, crème et cacao.
const light = {
  palette: {
    primary: { main: '#C2461A', light: '#E8743F', dark: '#8F2F0E', contrastText: '#FFFFFF' },
    secondary: { main: '#2F8F5B', light: '#4FB67E', dark: '#1F6B42', contrastText: '#FFFFFF' },
    warning: { main: '#D98E04', contrastText: '#FFFFFF' },
    error: { main: '#C62828' },
    success: { main: '#2F8F5B' },
    info: { main: '#2C6E8F' },
    gold: { main: '#F2A93B', contrastText: '#2A1A12' },
    sand: { main: '#F4E9DA', dark: '#EADBC6', contrastText: '#2A1A12' },
    ink: { main: '#1F1410', light: '#2E211A', contrastText: '#FBF5EC' },
    background: { default: '#FBF5EC', paper: '#FFFFFF' },
    text: { primary: '#2A1A12', secondary: '#7A6457' },
    divider: 'rgba(42, 26, 18, 0.09)',
  },
};

const dark = {
  palette: {
    primary: { main: '#F07A45', light: '#F59A6E', dark: '#C2461A', contrastText: '#1A120D' },
    secondary: { main: '#5BC48B', light: '#7FD3A5', dark: '#2F8F5B', contrastText: '#0F1A13' },
    warning: { main: '#F2B33D', contrastText: '#1A120D' },
    error: { main: '#EF6C6C' },
    success: { main: '#5BC48B' },
    info: { main: '#6BB3D6' },
    gold: { main: '#F2B33D', contrastText: '#1A120D' },
    sand: { main: '#2A211A', dark: '#352A21', contrastText: '#F6EDE3' },
    ink: { main: '#120C09', light: '#1E1712', contrastText: '#F6EDE3' },
    background: { default: '#15100C', paper: '#1E1712' },
    text: { primary: '#F6EDE3', secondary: '#B8A595' },
    divider: 'rgba(255, 240, 225, 0.09)',
  },
};

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-color-scheme' },
  colorSchemes: { light, dark },
  // Base 4 px : dans `sx`, borderRadius: 3 = 12 px, 4 = 16 px, 6 = 24 px.
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: body,
    h1: { fontFamily: display, fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontFamily: display, fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontFamily: display, fontWeight: 650, letterSpacing: '-0.015em' },
    h4: { fontFamily: display, fontWeight: 650, letterSpacing: '-0.01em', fontSize: '2rem' },
    h5: { fontFamily: display, fontWeight: 600, fontSize: '1.45rem' },
    h6: { fontFamily: body, fontWeight: 700, fontSize: '1.05rem' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.04em' },
    overline: { fontWeight: 700, letterSpacing: '0.12em' },
    button: { textTransform: 'none', fontWeight: 650, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (t) => ({
        'html, body, #root': { minHeight: '100%' },
        body: {
          WebkitFontSmoothing: 'antialiased',
          WebkitTapHighlightColor: 'transparent',
          overscrollBehaviorY: 'none',
        },
        '::selection': { background: t.vars.palette.primary.main, color: '#fff' },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-thumb': {
          background: t.vars.palette.divider,
          borderRadius: 10,
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
        },
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }),
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12, paddingInline: 18, minHeight: 42 },
        sizeSmall: { minHeight: 34, paddingInline: 12, borderRadius: 10 },
        sizeLarge: { minHeight: 52, paddingInline: 24, fontSize: '1rem' },
        outlined: ({ theme: t }) => ({ borderColor: t.vars.palette.divider, borderWidth: 1.5 }),
      },
    },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' }, rounded: { borderRadius: 20 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme: t }) => ({ borderRadius: 20, border: `1px solid ${t.vars.palette.divider}` }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 10 },
        sizeSmall: { borderRadius: 8 },
      },
    },
    MuiTextField: { defaultProps: { variant: 'outlined' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 12,
          backgroundColor: t.vars.palette.background.paper,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: t.vars.palette.divider, borderWidth: 1.5 },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: t.vars.palette.text.secondary },
        }),
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme: t }) => ({
          borderRadius: 24,
          border: `1px solid ${t.vars.palette.divider}`,
          boxShadow: '0 30px 80px rgba(31, 20, 16, 0.25)',
        }),
        paperFullScreen: { borderRadius: 0, border: 'none' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontFamily: display, fontWeight: 650, fontSize: '1.4rem', paddingTop: 22 } },
    },
    MuiDialogActions: { styleOverrides: { root: { padding: '14px 24px 20px', gap: 8 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 14, alignItems: 'center' } } },
    MuiTooltip: {
      styleOverrides: { tooltip: { borderRadius: 8, fontSize: '0.78rem', fontWeight: 500 } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme: t }) => ({ borderColor: t.vars.palette.divider }),
        head: ({ theme: t }) => ({
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: t.vars.palette.text.secondary,
          backgroundColor: t.vars.palette.sand.main,
        }),
      },
    },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 650, minHeight: 44 } } },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 99, height: 8 }, bar: { borderRadius: 99 } } },
    MuiAvatar: { styleOverrides: { root: { fontWeight: 700 } } },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme: t }) => ({
          borderRadius: 14,
          border: `1px solid ${t.vars.palette.divider}`,
          boxShadow: '0 16px 40px rgba(31, 20, 16, 0.14)',
        }),
      },
    },
    MuiSkeleton: { styleOverrides: { rounded: { borderRadius: 16 } } },
  },
});

/** Couleur d'une palette avec transparence, compatible variables CSS (clair/sombre). */
export const tint = (color, opacity) => (t) => {
  const [group, key = 'main'] = color.split('.');
  return `rgba(${t.vars.palette[group][`${key}Channel`]} / ${opacity})`;
};

export default theme;
