import { MenuConfig } from "@/config/types";
import {
  BarChart3,
  ChartLine,
  Cog,
  Download,
  FileChartLine,
  FolderCode,
  Gauge,
  GlobeLock,
  LockKeyholeOpen,
  Mailbox,
  OctagonAlert,
  Plus,
  ScrollText,
  Settings,
  ShieldUser,
  SquareActivity,
  UserCircle,
  Users,
} from 'lucide-react';

export const MENU_SIDEBAR_MAIN: MenuConfig = [
  {
    icon: Plus,
    title: 'Create',
    path: '/layout-27',
  },
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
    path: '#',
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

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Configuration',
    children: [
      {
        title: 'API Setup',
        path: '#',
        icon: Settings
      },
      {
        title: 'Team Settings',
        path: '/layout-27',
        icon: Users
      },
      {
        title: 'Authentication',
        path: '#',
        icon: Mailbox
      },
      {
        title: 'Endpoints Configs',
        path: '#',
        icon: Cog
      },
      {
        title: 'Rate Limiting',
        path: '#',
        icon: ChartLine
      },
    ],
  },
  {
    title: 'Security',
    children: [
      {
        title: 'Data Encryption',
        path: '#',
        icon: GlobeLock
      },
      {
        title: 'Rate Limiting',
        path: '#',
        icon: Gauge
      },
      {
        title: 'Access Control',
        path: '#',
        icon: LockKeyholeOpen
      },
      {
        title: 'Incident Response',
        path: '#',
        icon: OctagonAlert
      },
    ],
  },
  {
    title: 'Analytics',
    children: [
      {
        title: 'Fetching Data',
        path: '#',
        icon: Download
      },
      {
        title: 'Custom Reports',
        path: '#',
        icon: FileChartLine
      },
      {
        title: 'Real Time Analytics',
        path: '#',
        icon: SquareActivity
      },
    ],
  }
];
