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
  Rocket,
  CreditCard,
  Blocks,
  Bell,
  Key
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
        path: '/layout-18',
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
    path: '#'
  },
  {
    title: 'My Account',
    path: '/layout-18'
  },
  {
    title: 'Public Profile',
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

export const MENU_NAVBAR: MenuConfig = [
  {
    title: 'Account Starter',
    path: '#',
    icon: Rocket
  },
  {
    title: 'Billing',
    path: '/layout-18',
    icon: CreditCard
  },
  {
    title: 'Security',
    path: '#',
    icon: LockKeyholeOpen
  },
  {
    title: 'Members & Roles',
    path: '#',
    icon: Users
  },
  {
    title: 'Integrations',
    path: '#',
    icon: Blocks
  },
  {
    title: 'Notifications',
    path: '#',
    icon: Bell
  },
  {
    title: 'API Keys',
    path: '#',
    icon: Key
  },
];
