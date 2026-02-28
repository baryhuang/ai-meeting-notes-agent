import { MenuConfig } from "@/config/types";
import {
  BarChart3,
  Bolt,
  Download,
  FileChartLine,
  FolderCode,
  GlobeLock,
  House,
  LockKeyholeOpen,
  Mailbox,
  OctagonAlert,
  ScrollText,
  Settings,
  ShieldUser,
  SquareActivity,
  Users,
} from 'lucide-react';

export const MENU_SIDEBAR_MAIN: MenuConfig = [
  {
    icon: House,
    title: 'Home',
    path: '#',
  },
  {
    icon: Settings,
    title: 'Settings',
    path: '/layout-30',
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

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Configuration',
    children: [
      {
        title: 'Team Settings',
        path: '#',
        icon: Users
      },
      {
        title: 'API’s',
        path: '/layout-30',
        icon: Bolt
      },
      
      {
        title: 'Integrations',
        path: '#',
        icon: Mailbox
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
        title: 'Usage Stats',
        path: '#',
        icon: Download
      },
      {
        title: 'Custom Reports',
        path: '#',
        icon: FileChartLine
      },
      {
        title: 'Real-Time Monitoring',
        path: '#',
        icon: SquareActivity
      },
    ],
  }
];
