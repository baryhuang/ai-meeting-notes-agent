import { LayoutGrid, Plug } from 'lucide-react';
import { MenuConfig } from '@/config/types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/',
  },
  {
    title: 'Integrations',
    icon: Plug,
    path: '/integrations',
  },
];

export const MENU_MEGA: MenuConfig = [
  { title: 'Dashboard', path: '/' },
  { title: 'Integrations', path: '/integrations' },
];

export const MENU_MEGA_MOBILE: MenuConfig = [
  { title: 'Dashboard', path: '/' },
  { title: 'Integrations', path: '/integrations' },
];
