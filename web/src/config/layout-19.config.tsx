import { MenuConfig } from "@/config/types";
import {
  ChartLine,
  Cog,
  GlobeLock,
  Gauge,
  LockKeyholeOpen,
  Mailbox,
  OctagonAlert,
  Settings,
  Users,
  Download,
  FileChartLine,
  SquareActivity,
} from "lucide-react";

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
        path: '/layout-19',
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

export const MENU_HEADER: MenuConfig = [
  {
    title: 'Dashboards',
    path: '/layout-19'
  },
  {
    title: 'Public Profile',
    path: '#'
  },
  {
    title: 'Account Settings',
    path: '#'
  },
  {
    title: 'Network',
    path: '#'
  },
  {
    title: 'Authentication',
    path: '#'
  },
];
