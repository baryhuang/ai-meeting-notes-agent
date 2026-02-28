import {
  AlertCircle,
  Bolt,
  Captions,
  Codepen,
  Coffee,
  FileQuestion,
  HelpCircle,
  LayoutGrid,
  ScrollText,
  Settings,
  Share2,
  ShieldUser,
  Star,
  Theater,
  UserCircle,
  Users,
} from 'lucide-react';
import { type MenuConfig } from './types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Dashboards',
    icon: LayoutGrid,
    children: [
      { title: 'Light Sidebar', path: '/layout-8' },
      { title: 'Dark Sidebar', path: '/layout-8/dark-sidebar' },
      { title: 'Empty Page', path: '#' },
    ],
  },
  { heading: 'User' },
  {
    title: 'Public Profile',
    icon: UserCircle,
    children: [
      {
        title: 'Profiles',
        children: [
          { title: 'Default', path: '#' },
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
  {
    title: 'My Account',
    icon: Settings,
    children: [
      {
        title: 'Account',
        children: [
          { title: 'Get Started', path: '#' },
          { title: 'User Profile', path: '#' },
          { title: 'Company Profile', path: '#' },
          {
            title: 'Settings - With Sidebar',
            path: '#',
          },
          {
            title: 'Settings - Enterprise',
            path: '#',
          },
          { title: 'Settings - Plain', path: '#' },
          { title: 'Settings - Modal', path: '#' },
        ],
      },
      {
        title: 'Billing',
        children: [
          { title: 'Billing - Basic', path: '#' },
          {
            title: 'Billing - Enterprise',
            path: '#',
          },
          { title: 'Plans', path: '#' },
          { title: 'Billing History', path: '#' },
        ],
      },
      {
        title: 'Security',
        children: [
          { title: 'Get Started', path: '#' },
          { title: 'Security Overview', path: '#' },
          {
            title: 'Allowed IP Addresses',
            path: '#',
          },
          {
            title: 'Privacy Settings',
            path: '#',
          },
          {
            title: 'Device Management',
            path: '#',
          },
          {
            title: 'Backup & Recovery',
            path: '#',
          },
          {
            title: 'Current Sessions',
            path: '#',
          },
          { title: 'Security Log', path: '#' },
        ],
      },
      {
        title: 'Members & Roles',
        children: [
          { title: 'Teams Starter', path: '#' },
          { title: 'Teams', path: '#' },
          { title: 'Team Info', path: '#' },
          {
            title: 'Members Starter',
            path: '#',
          },
          { title: 'Team Members', path: '#' },
          { title: 'Import Members', path: '#' },
          { title: 'Roles', path: '#' },
          {
            title: 'Permissions - Toggler',
            path: '#',
          },
          {
            title: 'Permissions - Check',
            path: '#',
          },
        ],
      },
      { title: 'Integrations', path: '#' },
      { title: 'Notifications', path: '#' },
      { title: 'API Keys', path: '#' },
      {
        title: 'More',
        collapse: true,
        collapseTitle: 'Show less',
        expandTitle: 'Show 3 more',
        children: [
          { title: 'Appearance', path: '#' },
          { title: 'Invite a Friend', path: '#' },
          { title: 'Activity', path: '#' },
        ],
      },
    ],
  },
  {
    title: 'Network',
    icon: Users,
    children: [
      { title: 'Get Started', path: '#' },
      {
        title: 'User Cards',
        children: [
          { title: 'Mini Cards', path: '#' },
          { title: 'Team Crew', path: '#' },
          { title: 'Author', path: '#' },
          { title: 'NFT', path: '#' },
          { title: 'Social', path: '#' },
        ],
      },
      {
        title: 'User Table',
        children: [
          { title: 'Team Crew', path: '#' },
          { title: 'App Roster', path: '#' },
          {
            title: 'Market Authors',
            path: '#',
          },
          { title: 'SaaS Users', path: '#' },
          { title: 'Store Clients', path: '#' },
          { title: 'Visitors', path: '#' },
        ],
      },
      { title: 'Cooperations', path: '#', disabled: true },
      { title: 'Leads', path: '#', disabled: true },
      { title: 'Donators', path: '#', disabled: true },
    ],
  },
  {
    title: 'Authentication',
    icon: ShieldUser,
    children: [
      {
        title: 'Classic',
        children: [
          { title: 'Sign In', path: '#' },
          { title: 'Sign Up', path: '#' },
          { title: '2FA', path: '#' },
          { title: 'Check Email', path: '#' },
          {
            title: 'Reset Password',
            children: [
              {
                title: 'Enter Email',
                path: '#',
              },
              {
                title: 'Check Email',
                path: '#',
              },
              {
                title: 'Password Changed',
                path: '#',
              },
            ],
          },
        ],
      },
      {
        title: 'Branded',
        children: [
          { title: 'Sign In', path: '#' },
          { title: 'Sign Up', path: '#' },
          { title: '2FA', path: '#' },
          { title: 'Check Email', path: '#' },
          {
            title: 'Reset Password',
            children: [
              {
                title: 'Enter Email',
                path: '#',
              },
              {
                title: 'Check Email',
                path: '#',
              },
              {
                title: 'Password Changed',
                path: '#',
              },
            ],
          },
        ],
      },
      { title: 'Welcome Message', path: '#' },
      { title: 'Account Deactivated', path: '#' },
      { title: 'Error 404', path: '#' },
      { title: 'Error 500', path: '#' },
    ],
  },
  { heading: 'Apps' },
  {
    title: 'Store - Client',
    icon: Users,
    children: [
      { title: 'Home', path: '#' },
      {
        title: 'Search Results - Grid',
        path: '#',
      },
      {
        title: 'Search Results - List',
        path: '#',
      },
      { title: 'Product Details', path: '#' },
      { title: 'Wishlist', path: '#' },
      {
        title: 'Checkout',
        children: [
          {
            title: 'Order Summary',
            path: '#',
          },
          {
            title: 'Shipping Info',
            path: '#',
          },
          {
            title: 'Payment Method',
            path: '#',
          },
          {
            title: 'Order Placed',
            path: '#',
          },
        ],
      },
      { title: 'My Orders', path: '#' },
      { title: 'Order Receipt', path: '#' },
    ],
  },
  {
    title: 'CRM',
    icon: Users,
    path: '#',
    children: [
      {
        title: 'Dashboard',
        path: '#',
      },
      {
        title: 'Tasks',
        path: '#',
      },
      {
        title: 'Notes',
        path: '#',
      },
      {
        title: 'Contacts',
        path: '#',
      },
      {
        title: 'Companies',
        path: '#',
      },
      {
        title: 'Deals',
        path: '#',
      },
      {
        title: 'Timesheets',
        path: '#',
      }
    ],
  },
  {
    title: 'Store - Admin',
    icon: Bolt,
    disabled: true,
    children: [
      { title: 'Dashboard', path: '#' },
      {
        title: 'Inventory',
        children: [
          {
            title: 'All Products',
            path: '#',
          },
          {
            title: 'Current Stock',
            path: '#',
          },
          {
            title: 'Inbound Stock',
            path: '#',
          },
          {
            title: 'Outbound Stock',
            path: '#',
          },
          {
            title: 'Stock Planner',
            path: '#',
          },
          { title: 'Track Shipping', path: '#' },
          { title: 'Create Shipping Label', path: '#' },
        ],
      },
    ],
  },
  { title: 'Store - Services', icon: Codepen, disabled: true },
  { title: 'AI Promt', icon: Theater, disabled: true },
  { title: 'Invoice Generator', icon: ScrollText, disabled: true },
];

export const MENU_HELP: MenuConfig = [
  {
    title: 'Getting Started',
    icon: Coffee,
    path: 'https://keenthemes.com/metronic/tailwind/docs/getting-started/installation',
  },
  {
    title: 'Support Forum',
    icon: AlertCircle,
    children: [
      {
        title: 'All Questions',
        icon: FileQuestion,
        path: 'https://devs.keenthemes.com',
      },
      {
        title: 'Popular Questions',
        icon: Star,
        path: 'https://devs.keenthemes.com/popular',
      },
      {
        title: 'Ask Question',
        icon: HelpCircle,
        path: 'https://devs.keenthemes.com/question/create',
      },
    ],
  },
  {
    title: 'Licenses & FAQ',
    icon: Captions,
    path: 'https://keenthemes.com/metronic/tailwind/docs/getting-started/license',
  },
  {
    title: 'Documentation',
    icon: FileQuestion,
    path: 'https://keenthemes.com/metronic/tailwind/docs',
  },
  { separator: true },
  { title: 'Contact Us', icon: Share2, path: 'https://keenthemes.com/contact' },
];
