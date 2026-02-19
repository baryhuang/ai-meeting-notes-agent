import { LayoutGrid, Settings } from 'lucide-react';
import { MenuConfig } from '@/config/types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/',
  },
  {
    title: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

export const MENU_MEGA: MenuConfig = [
  { title: 'Dashboard', path: '/' },
  { title: 'Settings', path: '/settings' },
];

export const MENU_MEGA_MOBILE: MenuConfig = [
  { title: 'Dashboard', path: '/' },
  { title: 'Settings', path: '/settings' },
];
