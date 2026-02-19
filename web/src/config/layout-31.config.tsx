import { MenuConfig } from "@/config/types";
import {
  BarChart3,
  FolderCode,
  House,
  Mail,
  ScrollText,
  Settings,
  ShieldUser,
  Users,
} from 'lucide-react';

export const MENU_SIDEBAR_MAIN: MenuConfig = [
  {
    icon: House,
    title: 'Home',
    path: '#',
  },
  {
    icon: Mail,
    title: 'Mail',
    path: '/layout-30',
  },
  {
    icon: Settings,
    title: 'Settings',
    path: '#',
  },
  {
    icon: BarChart3,
    title: 'Dashboard',
    path: '#',
  },
  {
    icon: Users,
    title: 'Network',
    path: '#',
    separator: true
  },
  {
    icon: ScrollText,
    title: 'Files',
    path: '#',
  },
  {
    icon: FolderCode,
    title: 'Security Logs',
    path: '#',
  },
  {
    icon: ShieldUser,
    title: 'Authentication',
    path: '#',
  },
];
