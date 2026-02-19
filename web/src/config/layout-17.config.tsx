import { MenuConfig } from "@/config/types";
import {
  BarChart3,
  FolderCode,
  ScrollText,
  Settings,
  ShieldUser,
  UserCircle,
  Users,
} from 'lucide-react';

export const MENU_SIDEBAR_MAIN: MenuConfig = [
  {
    icon: UserCircle,
    title: 'Profile',
    path: '#',
  },
  {
    icon: BarChart3,
    title: 'Dashboard',
    path: '#',
  },
  {
    icon: Settings,
    title: 'Settings',
    path: '/layout-17',
  },
  {
    icon: Users,
    title: 'Network',
    path: '#',
  },
  {
    icon: ShieldUser,
    title: 'Authentication',
    path: '#',
  },
  {
    icon: FolderCode,
    title: 'Security Logs',
    path: '#',
  },
  {
    icon: ScrollText,
    title: 'Files',
    path: '#',
  },
];
