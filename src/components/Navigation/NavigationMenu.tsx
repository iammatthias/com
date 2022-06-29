import React from 'react';
import { navigationRecipe } from './Navigation.css';
import { HomeIcon, MixIcon } from '@radix-ui/react-icons';

import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import Box from '@/components/Box';

export const _NavigationMenu = () => {
  return (
    <NavigationMenu.Root className={navigationRecipe({ nav: `menu` })}>
      <NavigationMenu.List className={navigationRecipe({ nav: `menuList` })}>
        <NavigationMenu.Item>
          <Box className={navigationRecipe({ nav: `menuTrigger` })}>
            <HomeIcon className={navigationRecipe({ nav: `menuIcon` })} />
          </Box>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger
            className={navigationRecipe({ nav: `menuTrigger` })}
          >
            <MixIcon className={navigationRecipe({ nav: `menuIcon` })} />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content
            className={navigationRecipe({ nav: `menuContent` })}
          >
            <Box className={navigationRecipe({ nav: `menuItem` })}>
              ⦿ Item two content
            </Box>
            <Box className={navigationRecipe({ nav: `menuItem` })}>
              ⦿ Item two content
            </Box>
            <Box className={navigationRecipe({ nav: `menuItem` })}>
              ⦿ Item two content
            </Box>
            <Box className={navigationRecipe({ nav: `menuItem` })}>
              ⦿ Item two content
            </Box>
            <Box className={navigationRecipe({ nav: `menuItem` })}>
              ⦿ Item two content
            </Box>
            <Box className={navigationRecipe({ nav: `menuItem` })}>
              ⦿ Item two content
            </Box>
            <Box className={navigationRecipe({ nav: `menuItem` })}>
              ⦿ Item two content
            </Box>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      {/* NavigationMenu.Content will be rendered here when active */}
      <Box className={navigationRecipe({ nav: `menuViewportPosition` })}>
        <NavigationMenu.Viewport
          className={navigationRecipe({ nav: `menuViewport` })}
        />
      </Box>
    </NavigationMenu.Root>
  );
};

export default _NavigationMenu;
