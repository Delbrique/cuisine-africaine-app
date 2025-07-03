import { createTheme } from '@mui/material/styles';
import { lightBlue, deepOrange, grey } from '@mui/material/colors';

// Définissez votre thème personnalisé
const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50', // Un vert comme dans le bouton "Sauvegarder"
      light: '#81c784',
      dark: '#388e3c',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF8A65', // Un orange léger pour les actions secondaires (comme générer)
      light: '#ffb995',
      dark: '#c75b39',
      contrastText: '#fff',
    },
    error: {
      main: deepOrange[500],
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: lightBlue[500],
    },
    success: {
      main: '#4CAF50', // Le même vert que primary pour le succès
    },
    // Vous pouvez également définir des couleurs de fond et de texte par défaut
    background: {
      default: grey[50], // Couleur de fond par défaut (très clair)
      paper: '#fff', // Couleur de fond des Paper (cartes, formulaires)
    },
    text: {
      primary: '#212121', // Couleur de texte principale (gris foncé)
      secondary: '#757575', // Couleur de texte secondaire (gris moyen)
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600, // Rend les titres plus audacieux
      color: '#333',
    },
    h6: {
      fontWeight: 500,
      color: '#444',
    }
  },
  components: { // <-- Cette section était manquante ou incomplète
    // Vous pouvez personnaliser des composants spécifiques ici
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Bords légèrement arrondis pour les boutons
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Bords plus arrondis pour les cartes et Paper
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', // Ombre douce
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#E0E0E0', // Couleur de fond pour l'en-tête du tableau
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#333333',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#616161', // Couleur des labels d'input
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset': {
            borderColor: '#BDBDBD', // Couleur de la bordure des inputs
          },
          '&:hover fieldset': {
            borderColor: '#757575', // Couleur de la bordure au survol
          },
          '&.Mui-focused fieldset': {
            borderColor: '#4CAF50', // Couleur de la bordure quand le champ est focus
          },
        },
      },
    },
  },
}); // <-- L'accolade de fermeture de l'objet du thème et de la fonction createTheme()

export default theme;