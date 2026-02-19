import {
  AlertCircle,
  Award,
  Badge,
  Bell,
  Bitcoin,
  Book,
  Briefcase,
  Building,
  CalendarCheck,
  Captions,
  CheckCircle,
  Code,
  Coffee,
  File as DocumentIcon,
  Euro,
  Eye,
  File,
  FileQuestion,
  FileText,
  Flag,
  Ghost,
  Gift,
  Grid,
  Heart,
  HelpCircle,
  Kanban,
  Key,
  Layout,
  LayoutGrid,
  LifeBuoy,
  MessageSquare,
  Monitor,
  Network,
  Users as PeopleIcon,
  Plug,
  Share2,
  ShieldOff,
  SquareMousePointer,
  Star,
  ThumbsUp,
  TrendingUp,
  UserCheck,
  Users,
  Briefcase as WorkIcon,
  Zap,
} from 'lucide-react';
import { type MenuConfig } from './types';

export const MENU_MEGA_MOBILE: MenuConfig = [
  { title: 'Home', path: '#' },
  {
    title: 'Profiles',
    children: [
      {
        title: 'Profiles',
        children: [
          {
            title: 'Default',
            icon: Badge,
            path: '#',
          },
          {
            title: 'Creator',
            icon: Coffee,
            path: '#',
          },
          {
            title: 'Company',
            icon: Building,
            path: '#',
          },
          { title: 'NFT', icon: Bitcoin, path: '#' },
          {
            title: 'Blogger',
            icon: MessageSquare,
            path: '#',
          },
          { title: 'CRM', icon: Monitor, path: '#' },
          {
            title: 'Gamer',
            icon: Ghost,
            path: '#',
          },
          {
            title: 'Feeds',
            icon: Book,
            path: '#',
          },
          {
            title: 'Plain',
            icon: File,
            path: '#',
          },
          {
            title: 'Modal',
            icon: SquareMousePointer,
            path: '#',
          },
          { title: 'Freelancer', icon: Briefcase, path: '#', disabled: true },
          { title: 'Developer', icon: Code, path: '#', disabled: true },
          { title: 'Team', icon: Users, path: '#', disabled: true },
          { title: 'Events', icon: CalendarCheck, path: '#', disabled: true },
        ],
      },
      {
        title: 'Other Pages',
        children: [
          {
            title: 'Projects - 3 Cols',
            icon: Layout,
            path: '#',
          },
          {
            title: 'Projects - 2 Cols',
            icon: Grid,
            path: '#',
          },
          { title: 'Works', icon: WorkIcon, path: '#' },
          { title: 'Teams', icon: PeopleIcon, path: '#' },
          { title: 'Network', icon: Network, path: '#' },
          {
            title: 'Activity',
            icon: TrendingUp,
            path: '#',
          },
          {
            title: 'Campaigns - Card',
            icon: LayoutGrid,
            path: '#',
          },
          {
            title: 'Campaigns - List',
            icon: Kanban,
            path: '#',
          },
          { title: 'Empty', icon: FileText, path: '#' },
          { title: 'Documents', icon: DocumentIcon, path: '#', disabled: true },
          { title: 'Badges', icon: Award, path: '#', disabled: true },
          { title: 'Awards', icon: Gift, path: '#', disabled: true },
        ],
      },
    ],
  },
  {
    title: 'My Account',
    children: [
      {
        title: 'General Pages',
        children: [
          { title: 'Integrations', icon: Plug, path: '#' },
          {
            title: 'Notifications',
            icon: Bell,
            path: '#',
          },
          { title: 'API Keys', icon: Key, path: '#' },
          { title: 'Appearance', icon: Eye, path: '#' },
          {
            title: 'Invite a Friend',
            icon: UserCheck,
            path: '#',
          },
          { title: 'Activity', icon: LifeBuoy, path: '#' },
          { title: 'Brand', icon: CheckCircle, disabled: true },
          { title: 'Get Paid', icon: Euro, disabled: true },
        ],
      },
      {
        title: 'Other pages',
        children: [
          {
            title: 'Account Home',
            children: [
              { title: 'Get Started', path: '#' },
              { title: 'User Profile', path: '#' },
              {
                title: 'Company Profile',
                path: '#',
              },
              { title: 'With Sidebar', path: '#' },
              {
                title: 'Enterprise',
                path: '#',
              },
              { title: 'Plain', path: '#' },
              { title: 'Modal', path: '#' },
            ],
          },
          {
            title: 'Billing',
            children: [
              { title: 'Basic Billing', path: '#' },
              { title: 'Enterprise', path: '#' },
              { title: 'Plans', path: '#' },
              { title: 'Billing History', path: '#' },
              { title: 'Tax Info', disabled: true },
              { title: 'Invoices', disabled: true },
              { title: 'Gateaways', disabled: true },
            ],
          },
          {
            title: 'Security',
            children: [
              { title: 'Get Started', path: '#' },
              {
                title: 'Security Overview',
                path: '#',
              },
              {
                title: 'IP Addresses',
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
              {
                title: 'Import Members',
                path: '#',
              },
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
          {
            title: 'Other Pages',
            children: [
              { title: 'Integrations', path: '#' },
              { title: 'Notifications', path: '#' },
              { title: 'API Keys', path: '#' },
              { title: 'Appearance', path: '#' },
              { title: 'Invite a Friend', path: '#' },
              { title: 'Activity', path: '#' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Network',
    children: [
      {
        title: 'General Pages',
        children: [
          { title: 'Get Started', icon: Flag, path: '#' },
          { title: 'Colleagues', icon: Users, path: '#', disabled: true },
          { title: 'Donators', icon: Heart, path: '#', disabled: true },
          { title: 'Leads', icon: Zap, path: '#', disabled: true },
        ],
      },
      {
        title: 'Other pages',
        children: [
          {
            title: 'User Cards',
            children: [
              { title: 'Mini Cards', path: '#' },
              { title: 'Team Members', path: '#' },
              { title: 'Authors', path: '#' },
              { title: 'NFT Users', path: '#' },
              { title: 'Social Users', path: '#' },
              { title: 'Gamers', path: '#', disabled: true },
            ],
          },
          {
            title: 'User Base',
            badge: 'Datatables',
            children: [
              { title: 'Team Crew', path: '#' },
              { title: 'App Roster', path: '#' },
              {
                title: 'Market Authors',
                path: '#',
              },
              { title: 'SaaS Users', path: '#' },
              {
                title: 'Store Clients',
                path: '#',
              },
              { title: 'Visitors', path: '#' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Store - Client',
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
    children: [
      {
        title: 'General pages',
        children: [
          {
            title: 'Classic Layout',
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
                    title: 'Password is Changed',
                    path: '#',
                  },
                ],
              },
            ],
          },
          {
            title: 'Branded Layout',
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
                    title: 'Password is Changed',
                    path: '#',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Other Pages',
        children: [
          {
            title: 'Welcome Message',
            icon: ThumbsUp,
            path: '#',
          },
          {
            title: 'Account Deactivated',
            icon: ShieldOff,
            path: '#',
          },
          { title: 'Error 404', icon: HelpCircle, path: '#' },
          { title: 'Error 500', icon: AlertCircle, path: '#' },
        ],
      },
    ],
  },
  {
    title: 'Help',
    children: [
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
      {
        title: 'Contact Us',
        icon: Share2,
        path: 'https://keenthemes.com/contact',
      },
    ],
  },
];

export const MENU_MEGA: MenuConfig = [
  { title: 'Home', path: '#' },
  {
    title: 'Profiles',
    children: [
      {
        title: 'Profiles',
        children: [
          {
            children: [
              {
                title: 'Default',
                icon: Badge,
                path: '#',
              },
              {
                title: 'Creator',
                icon: Coffee,
                path: '#',
              },
              {
                title: 'Company',
                icon: Building,
                path: '#',
              },
              {
                title: 'NFT',
                icon: Bitcoin,
                path: '#',
              },
              {
                title: 'Blogger',
                icon: MessageSquare,
                path: '#',
              },
              {
                title: 'CRM',
                icon: Monitor,
                path: '#',
              },
              {
                title: 'Gamer',
                icon: Ghost,
                path: '#',
              },
            ],
          },
          {
            children: [
              {
                title: 'Feeds',
                icon: Book,
                path: '#',
              },
              {
                title: 'Plain',
                icon: File,
                path: '#',
              },
              {
                title: 'Modal',
                icon: SquareMousePointer,
                path: '#',
              },
              {
                title: 'Freelancer',
                icon: Briefcase,
                path: '#',
                disabled: true,
              },
              { title: 'Developer', icon: Code, path: '#', disabled: true },
              { title: 'Team', icon: Users, path: '#', disabled: true },
              {
                title: 'Events',
                icon: CalendarCheck,
                path: '#',
                disabled: true,
              },
            ],
          },
        ],
      },
      {
        title: 'Other Pages',
        children: [
          {
            children: [
              {
                title: 'Projects - 3 Cols',
                icon: Layout,
                path: '#',
              },
              {
                title: 'Projects - 2 Cols',
                icon: Grid,
                path: '#',
              },
              { title: 'Works', icon: WorkIcon, path: '#' },
              {
                title: 'Teams',
                icon: PeopleIcon,
                path: '#',
              },
              {
                title: 'Network',
                icon: Network,
                path: '#',
              },
              {
                title: 'Activity',
                icon: TrendingUp,
                path: '#',
              },
              {
                title: 'Campaigns - Card',
                icon: LayoutGrid,
                path: '#',
              },
            ],
          },
          {
            children: [
              {
                title: 'Campaigns - List',
                icon: Kanban,
                path: '#',
              },
              { title: 'Empty', icon: FileText, path: '#' },
              {
                title: 'Documents',
                icon: DocumentIcon,
                path: '#',
                disabled: true,
              },
              { title: 'Badges', icon: Award, path: '#', disabled: true },
              { title: 'Awards', icon: Gift, path: '#', disabled: true },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'My Account',
    children: [
      {
        title: 'General Pages',
        children: [
          { title: 'Integrations', icon: Plug, path: '#' },
          {
            title: 'Notifications',
            icon: Bell,
            path: '#',
          },
          { title: 'API Keys', icon: Key, path: '#' },
          { title: 'Appearance', icon: Eye, path: '#' },
          {
            title: 'Invite a Friend',
            icon: UserCheck,
            path: '#',
          },
          { title: 'Activity', icon: LifeBuoy, path: '#' },
          { title: 'Brand', icon: CheckCircle, disabled: true },
          { title: 'Get Paid', icon: Euro, disabled: true },
        ],
      },
      {
        title: 'Other pages',
        children: [
          {
            title: 'Account Home',
            children: [
              { title: 'Get Started', path: '#' },
              { title: 'User Profile', path: '#' },
              {
                title: 'Company Profile',
                path: '#',
              },
              { title: 'With Sidebar', path: '#' },
              {
                title: 'Enterprise',
                path: '#',
              },
              { title: 'Plain', path: '#' },
              { title: 'Modal', path: '#' },
            ],
          },
          {
            title: 'Billing',
            children: [
              { title: 'Basic Billing', path: '#' },
              { title: 'Enterprise', path: '#' },
              { title: 'Plans', path: '#' },
              { title: 'Billing History', path: '#' },
              { title: 'Tax Info', disabled: true },
              { title: 'Invoices', disabled: true },
              { title: 'Gateaways', disabled: true },
            ],
          },
          {
            title: 'Security',
            children: [
              { title: 'Get Started', path: '#' },
              {
                title: 'Security Overview',
                path: '#',
              },
              {
                title: 'IP Addresses',
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
              {
                title: 'Import Members',
                path: '#',
              },
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
          {
            title: 'Other Pages',
            children: [
              { title: 'Integrations', path: '#' },
              { title: 'Notifications', path: '#' },
              { title: 'API Keys', path: '#' },
              { title: 'Appearance', path: '#' },
              { title: 'Invite a Friend', path: '#' },
              { title: 'Activity', path: '#' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Network',
    children: [
      {
        title: 'General Pages',
        children: [
          { title: 'Get Started', icon: Flag, path: '#' },
          { title: 'Colleagues', icon: Users, path: '#', disabled: true },
          { title: 'Donators', icon: Heart, path: '#', disabled: true },
          { title: 'Leads', icon: Zap, path: '#', disabled: true },
        ],
      },
      {
        title: 'Other pages',
        children: [
          {
            title: 'User Cards',
            children: [
              { title: 'Mini Cards', path: '#' },
              { title: 'Team Members', path: '#' },
              { title: 'Authors', path: '#' },
              { title: 'NFT Users', path: '#' },
              { title: 'Social Users', path: '#' },
              { title: 'Gamers', path: '#', disabled: true },
            ],
          },
          {
            title: 'User Base',
            badge: 'Datatables',
            children: [
              { title: 'Team Crew', path: '#' },
              { title: 'App Roster', path: '#' },
              {
                title: 'Market Authors',
                path: '#',
              },
              { title: 'SaaS Users', path: '#' },
              {
                title: 'Store Clients',
                path: '#',
              },
              { title: 'Visitors', path: '#' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Authentication',
    children: [
      {
        title: 'General pages',
        children: [
          {
            title: 'Classic Layout',
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
                    title: 'Password is Changed',
                    path: '#',
                  },
                ],
              },
            ],
          },
          {
            title: 'Branded Layout',
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
                    title: 'Password is Changed',
                    path: '#',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Other Pages',
        children: [
          {
            title: 'Welcome Message',
            icon: ThumbsUp,
            path: '#',
          },
          {
            title: 'Account Deactivated',
            icon: ShieldOff,
            path: '#',
          },
          { title: 'Error 404', icon: HelpCircle, path: '#' },
          { title: 'Error 500', icon: AlertCircle, path: '#' },
        ],
      },
    ],
  },
  {
    title: 'Store ',
    children: [
      {
        title: 'Store - Client',
        children: [
          {
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
              {
                title: 'Product Details',
                path: '#',
              },
              { title: 'Wishlist', path: '#' },
              { title: 'My Orders', path: '#' },
            ],
          },
          {
            children: [
              {
                title: 'Checkout - Order Summary',
                path: '#',
              },
              {
                title: 'Checkout - Shipping Info',
                path: '#',
              },
              {
                title: 'Checkout - Payment Method',
                path: '#',
              },
              {
                title: 'Checkout - Order Placed',
                path: '#',
              },
              { title: 'Order Receipt', path: '#' },
            ],
          },
        ],
      },
    ],
  },
];
