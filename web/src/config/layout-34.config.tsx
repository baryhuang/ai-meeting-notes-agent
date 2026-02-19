import { MenuConfig } from "@/config/types";

export const MENU_HEADER: MenuConfig = [
  {
    title: 'Metronic 9',
    path: '/layout-34',
    img: 'tailwindcss.svg'
  },
  {
    title: 'Metronic 8',
    path: '#',
    img: 'bootstrap.svg'
  },
  {
    title: 'Docs',
    path: '#'
  },
  {
    title: 'Pricing',
    path: '#'
  },
  {
    title: 'Changelog',
    path: '#'
  },
  {
    title: 'Support',
    path: '#'
  },
  {
    title: 'More',
    path: '#',
    children: [
      {
        title: 'Resources',
        desc: 'Explore our comprehensive collection of guides, templates, and learning materials.',
        path: '#'
      },
      {
        title: 'Community',
        desc: 'Join thousands of developers sharing knowledge and building amazing projects.',
        path: '#'
      },
      {
        title: 'Blog',
        desc: 'Stay updated with the latest news, tutorials, and best practices from our team.',
        path: '#'
      },
      {
        title: 'API Reference',
        desc: 'Complete API documentation with examples and integration guides for developers.',
        path: '#'
      },
      {
        title: 'About Us',
        desc: 'Learn more about our mission, team, and the story behind our products.',
        path: '#'
      }
    ]
  },
];
