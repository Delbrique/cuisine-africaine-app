import React from 'react';
import { Routes, Route, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Toolbar, Container, Divider,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import InventoryIcon from '@mui/icons-material/Inventory'; // Importer l'icône Inventory pour le stock

import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';

import MembresList from './MembresList';
import AddEditMembre from './AddEditMembre';
import IngredientsPage from './PlatsEtIngredients/IngredientsPage';
import PlatsPage from './PlatsEtIngredients/PlatsPage';
import PlanningPage from './PlanningPage';
import ListeMarchePage from './ListeMarchePage';
import SearchPage from './Searchpage';
import DecouvertePage from './DecouvertePage';
import StockPage from './StockPage'; // Importer la nouvelle StockPage

const drawerWidth = 240;
const appBarHeight = 64;

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  '& .MuiListItemIcon-root': {
    color: theme.palette.primary.contrastText,
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.contrastText,
    },
  },
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.contrastText,
    },
  },
}));

function FamilleDashboardLayout() {
  const theme = useTheme();
  const location = useLocation();

  const menuItems = [
    { text: "Gérer les Membres", icon: <PeopleIcon />, path: "/famille-dashboard/membres" },
    { text: "Ajouter un Membre", icon: <AddCircleOutlineIcon />, path: "/famille-dashboard/add-membre" },
    { text: "Gérer les Plats", icon: <RestaurantMenuIcon />, path: "/famille-dashboard/plats" },
    { text: "Gérer les Ingrédients", icon: <FastfoodIcon />, path: "/famille-dashboard/ingredients" },
    { text: "Gérer le Stock", icon: <InventoryIcon />, path: "/famille-dashboard/stock" },
    { text: "Planning des Repas", icon: <CalendarMonthIcon />, path: "/famille-dashboard/planning-repas" },
    { text: "Liste de Marché", icon: <ShoppingCartIcon />, path: "/famille-dashboard/liste-marche" },
    { text: "Recherches", icon: <SearchIcon />, path: "/famille-dashboard/search" },
    { text: "Decouvertes", icon: <SearchIcon />, path: "/famille-dashboard/DecouvertePage" },
    { text: "Groupe de Messages", icon: <PeopleIcon />, path: "/famille-dashboard/messages" },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.contrastText,
            },
            borderRight: 'none',
            boxShadow: 'none',
            height: `100vh`,
            marginTop: 0,
          },
        }}
        anchor="left"
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Dashboard Famille
          </Typography>
        </Toolbar>
        <Divider sx={{ backgroundColor: theme.palette.primary.light }} />
        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
          <List>
            {menuItems.map((item) => {
              const isSelected =
                location.pathname === item.path ||
                (item.path === "/famille-dashboard/membres" &&
                  location.pathname.startsWith("/famille-dashboard/edit-membre"));

              return (
                <ListItem
                  key={item.text}
                  disablePadding
                  component={RouterLink}
                  to={item.path}
                  selected={isSelected}
                >
                  <StyledListItemButton selected={isSelected}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </StyledListItemButton>
                </ListItem>
              );
            })}

            {location.pathname.startsWith("/famille-dashboard/edit-membre") && (
              <ListItem disablePadding selected>
                <StyledListItemButton selected>
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Modifier Membre" />
                </StyledListItemButton>
              </ListItem>
            )}
          </List>
        </Box>

        <Divider sx={{ backgroundColor: theme.palette.primary.light }} />
        <List>
          <ListItem disablePadding>
            <StyledListItemButton
              component={RouterLink}
              to="/configurer-famille"
              selected={location.pathname === "/configurer-famille"}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Configuration Famille" />
            </StyledListItemButton>
          </ListItem>
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${drawerWidth}px)`,
          marginTop: `${appBarHeight}px`,
          minHeight: `calc(100vh - ${appBarHeight}px)`,
          boxSizing: 'border-box',
        }}
      >
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Routes>
            <Route index element={<MembresList />} />
            <Route path="membres" element={<MembresList />} />
            <Route path="add-membre" element={<AddEditMembre />} />
            <Route path="edit-membre/:id" element={<AddEditMembre />} />
            <Route path="plats" element={<PlatsPage />} />
            <Route path="ingredients" element={<IngredientsPage />} />
            <Route path="stock" element={<StockPage />} /> {/* Nouvelle route pour StockPage */}
            <Route path="planning-repas" element={<PlanningPage />} />
            <Route path="liste-marche" element={<ListeMarchePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="DecouvertePage" element={<DecouvertePage />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

export default FamilleDashboardLayout;