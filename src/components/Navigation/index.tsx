// NavigationMenu
// Language: typescript

// A navigation menu component that renders a response from the page query.

import Image from 'next/image';
import Link from 'next/link';

import Box from '@/components/Box';
import Text from '@/components/Text';
import ClientOnly from '@/utils/clientOnly';
import Timestamp from '@/utils/timestamp';

import Icon from '../../../public/images/navBarIcon.png';
import { navigationRecipe } from './Navigation.css';
import NavigationMenu from './NavigationMenu';

export const Navigation = () => {
  return (
    <Box as="nav" className={navigationRecipe({ nav: `mainWrapper` })}>
      <Box as="nav" className={navigationRecipe({ nav: `main` })}>
        <Link href="/" passHref={true}>
          <a>
            <Box className={navigationRecipe({ nav: `brand` })}>
              <Image src={Icon} width={24} height={24} alt="" />
              <Box className={navigationRecipe({ nav: `title` })}>
                <Text as="h1" kind="h6">
                  I AM MATTHIAS
                </Text>
              </Box>
            </Box>
          </a>
        </Link>

        <NavigationMenu />
        <Text kind="p">
          <Text as="small" kind="small">
            <ClientOnly>
              <Timestamp />
            </ClientOnly>
          </Text>
        </Text>
      </Box>
    </Box>
  );
};

export default Navigation;
