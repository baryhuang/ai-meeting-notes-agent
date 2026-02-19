import {
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  CircleEllipsis,
  GalleryVerticalEnd,
  Home,
  Users,
} from 'lucide-react';

import { type LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  title?: string;
  icon?: LucideIcon;
  path?: string;
  badge?: string;
  pinnable?: boolean;
  pinned?: boolean;
  soon?: boolean;
  new?: {
    tooltip: string;
    path: string;
  };
  more?: true;
  dropdown?: true;
}

export type NavConfig = NavItem[];

export const MAIN_NAV: NavConfig = [
  {
    title: 'Dashboard',
    icon: Home,
    path: '/layout-15',
    id: 'dashboard',
  },
  {
    icon: CheckSquare,
    title: 'Tasks',
    path: '#',
    pinnable: true,
    pinned: true,
    badge: '3',
    id: 'tasks',
    more: true,
    new: {
      tooltip: 'New Task',
      path: '#',
    },
  },
  {
    icon: GalleryVerticalEnd,
    title: 'Notes',
    path: '#',
    pinnable: true,
    pinned: true,
    id: 'notes',
    new: {
      tooltip: 'New Notes',
      path: '#',
    },
  },
  {
    icon: Users,
    title: 'Contacts',
    path: '#',
    pinnable: true,
    pinned: true,
    id: 'contacts',
    new: {
      tooltip: 'New Contact',
      path: '#',
    },
  },
  {
    icon: Building2,
    title: 'Companies',
    path: '#',
    pinnable: true,
    pinned: true,
    id: 'companies',
    new: {
      tooltip: 'New Company',
      path: '#',
    },
  },

  {
    icon: BriefcaseBusiness,
    title: 'Company',
    path: '#',
    pinnable: true,
    pinned: true,
    id: 'company'
  },

  {
    icon: CircleEllipsis,
    title: 'More',
    id: 'more',
    dropdown: true,
  },
];
