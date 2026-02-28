import {
  LayoutGrid,
  Settings,
  Shield,
  ShoppingCart,
  UserCircle,
  Users,
} from 'lucide-react';
import { type MenuConfig } from './types';

export const MENU_SIDEBAR_COMPACT: MenuConfig = [
  {
    title: 'Dashboards',
    icon: LayoutGrid,
    path: '/layout-6',
  },
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
    title: 'Store - Client',
    icon: ShoppingCart,
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
    title: 'Authentication',
    icon: Shield,
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
