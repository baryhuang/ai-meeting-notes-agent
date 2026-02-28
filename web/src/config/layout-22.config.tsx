import { MenuConfig } from "@/config/types";
import { Rocket, CreditCard, LockKeyholeOpen, Users, Blocks, Bell, Key } from "lucide-react";

export const MENU_HEADER: MenuConfig = [
  {
    title: 'Feedback',
    path: '/layout-22'
  },
  {
    title: 'Resources',
    path: '#'
  },
  {
    title: 'Support',
    path: '#'
  },
  {
    title: 'Webhooks',
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
    path: '/layout-22',
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
