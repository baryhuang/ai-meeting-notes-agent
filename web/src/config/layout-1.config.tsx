import { LayoutGrid } from 'lucide-react';
import { MenuConfig } from '@/config/types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/',
  },
];

export const MENU_MEGA: MenuConfig = [
  { title: 'Dashboard', path: '/' },
];

export const MENU_MEGA_MOBILE: MenuConfig = [
  { title: 'Dashboard', path: '/' },
];
