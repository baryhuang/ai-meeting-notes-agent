import {
  Settings,
  Shield,
  ShoppingCart,
  UserCircle,
  Users,
} from 'lucide-react';
import { type MenuConfig } from './types';

export const MENU_HEADER: MenuConfig = [
  {
    title: 'Public Profile',
    icon: UserCircle,
    children: [
      {
        title: 'Profiles',
        children: [
          { title: 'Dashboard', path: '/layout-2' },
          { title: 'Empty Page', path: '#' },
          { title: 'Creator', path: '#' },
          { title: 'Company', path: '#' },
          { title: 'NFT', path: '#' },
          { title: 'Blogger', path: '#' },
          { title: 'CRM', path: '#' },
          {
            title: 'More',
            collapse: true,
            collapseTitle: 'Show less',
            expandTitle: 'Show 4 more',
            children: [
              { title: 'Gamer', path: '#' },
              { title: 'Feeds', path: '#' },
              { title: 'Plain', path: '#' },
              { title: 'Modal', path: '#' },
            ],
          },
        ],
      },
      {
        title: 'Projects',
        children: [
          { title: '3 Columns', path: '#' },
          { title: '2 Columns', path: '#' },
        ],
      },
      { title: 'Works', path: '#' },
      { title: 'Teams', path: '#' },
      { title: 'Network', path: '#' },
      { title: 'Activity', path: '#' },
      {
        title: 'More',
        collapse: true,
        collapseTitle: 'Show less',
        expandTitle: 'Show 3 more',
        children: [
          { title: 'Campaigns - Card', path: '#' },
          { title: 'Campaigns - List', path: '#' },
          { title: 'Empty', path: '#' },
        ],
      },
    ],
  },
];

export const MENU_ROOT: MenuConfig = [
  {
    title: 'Public Profile',
    icon: UserCircle,
    rootPath: '#',
    path: '#',
    childrenIndex: 2,
  },
  {
    title: 'Account',
    icon: Settings,
    rootPath: '#',
    path: '#',
    childrenIndex: 3,
  },
  {
    title: 'Network',
    icon: Users,
    rootPath: '#',
    path: '#',
    childrenIndex: 4,
  },
  {
    title: 'Store - Client',
    icon: ShoppingCart,
    rootPath: '#',
    path: '#',
    childrenIndex: 4,
  },
  {
    title: 'Authentication',
    icon: Shield,
    rootPath: '#',
    path: '#',
    childrenIndex: 5,
  },
];
