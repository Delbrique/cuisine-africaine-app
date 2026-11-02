import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import EggAltRoundedIcon from '@mui/icons-material/EggAltRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ShoppingBasketRoundedIcon from '@mui/icons-material/ShoppingBasketRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';

const base = '/famille-dashboard';

export const NAV_SECTIONS = [
  {
    title: null,
    items: [{ label: 'Accueil', icon: HomeRoundedIcon, path: base, exact: true }],
  },
  {
    title: 'Famille',
    items: [
      { label: 'Membres', icon: GroupsRoundedIcon, path: `${base}/membres`, match: ['/membres', '/add-membre', '/edit-membre'] },
      { label: 'Messages', icon: ForumRoundedIcon, path: `${base}/messages` },
    ],
  },
  {
    title: 'Cuisine',
    items: [
      { label: 'Plats', icon: RestaurantMenuRoundedIcon, path: `${base}/plats` },
      { label: 'Ingrédients', icon: EggAltRoundedIcon, path: `${base}/ingredients` },
      { label: 'Découverte', icon: ExploreRoundedIcon, path: `${base}/decouverte` },
    ],
  },
  {
    title: 'Organisation',
    items: [
      { label: 'Planning', icon: CalendarMonthRoundedIcon, path: `${base}/planning-repas` },
      { label: 'Marché', icon: ShoppingBasketRoundedIcon, path: `${base}/liste-marche` },
      { label: 'Stock', icon: Inventory2RoundedIcon, path: `${base}/stock` },
    ],
  },
  {
    title: 'Assistant',
    items: [{ label: 'Recherche & IA', icon: AutoAwesomeRoundedIcon, path: `${base}/search` }],
  },
];

export const ALL_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

// Onglets de la barre du bas sur mobile (le reste est dans « Plus »).
export const BOTTOM_TABS = [`${base}`, `${base}/plats`, `${base}/planning-repas`, `${base}/liste-marche`];

export const isActive = (item, pathname) => {
  if (item.exact) return pathname === item.path || pathname === `${item.path}/`;
  if (item.match) return item.match.some((m) => pathname.startsWith(`${base}${m}`));
  return pathname.startsWith(item.path);
};
