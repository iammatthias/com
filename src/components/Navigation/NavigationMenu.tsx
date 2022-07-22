// NavigationMenu
// Language: typescript

// Uses https://www.radix-ui.com/docs/primitives/components/navigation-menu

import { ArrowRightIcon, HomeIcon, MixIcon } from '@radix-ui/react-icons';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Box from '@/components/Box';
import Text from '@/components/Text';
import PageQuery from '@/utils/gql/pageQuery';

import { navigationRecipe } from './Navigation.css';
import PageList from './PageList';

export const _NavigationMenu = () => {
  const [value, setValue] = useState(``);
  const { asPath } = useRouter();

  useEffect(() => {
    setValue(``);
  }, [asPath]);

  return (
    <NavigationMenu.Root
      className={navigationRecipe({ nav: `menu` })}
      value={value}
      onValueChange={setValue}
    >
      <NavigationMenu.List className={navigationRecipe({ nav: `menuList` })}>
        <NavigationMenu.Item>
          <Link href="/" passHref={true}>
            <a>
              <HomeIcon className={navigationRecipe({ nav: `menuIcon` })} />
            </a>
          </Link>
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
            <Text kind="h4">Work</Text>
            <>
              <PageList pageType="Gallery" limit={6} />
              <Box className={navigationRecipe({ nav: `menuPageList` })}>
                <Box className={navigationRecipe({ nav: `menuItem` })}>
                  <Link href="/work" passHref={true}>
                    <a>
                      <ArrowRightIcon />
                    </a>
                  </Link>
                </Box>
              </Box>
            </>

            <Text kind="h4">Writing</Text>
            <>
              <PageList pageType="Blog" limit={6} />
              <Box className={navigationRecipe({ nav: `menuPageList` })}>
                <Box className={navigationRecipe({ nav: `menuItem` })}>
                  <Link href="/blog" passHref={true}>
                    <a>
                      <ArrowRightIcon />
                    </a>
                  </Link>
                </Box>
              </Box>
            </>

            <Text kind="h4">Etc</Text>
            <Box className={navigationRecipe({ nav: `menuPageList` })}>
              <Box className={navigationRecipe({ nav: `menuItem` })}>
                <Link href="/thoughts" passHref={true}>
                  <a>
                    <Text as="p" kind="p">
                      <Text as="small" kind="small">
                        Thoughts
                      </Text>
                    </Text>
                  </a>
                </Link>
              </Box>
              <Box className={navigationRecipe({ nav: `menuItem` })}>
                <Link href="/guestbook" passHref={true}>
                  <a>
                    <Text as="p" kind="p">
                      <Text as="small" kind="small">
                        The Guestbook
                      </Text>
                    </Text>
                  </a>
                </Link>
              </Box>
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
