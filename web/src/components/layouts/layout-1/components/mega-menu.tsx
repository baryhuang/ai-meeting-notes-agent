import { Link, useLocation } from 'react-router-dom';
import { MENU_MEGA } from '@/config/layout-1.config';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';

export function MegaMenu() {
  const { pathname } = useLocation();
  const { isActive } = useMenu(pathname);

  const linkClass = `
    text-sm text-secondary-foreground font-medium
    hover:text-primary hover:bg-transparent
    focus:text-primary focus:bg-transparent
    data-[active=true]:text-primary data-[active=true]:bg-transparent
  `;

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-0">
        {MENU_MEGA.map((item, index) => (
          <NavigationMenuItem key={index}>
            <NavigationMenuLink asChild>
              <Link
                to={item.path || '/'}
                className={cn(linkClass)}
                data-active={isActive(item.path) || undefined}
              >
                {item.title}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
