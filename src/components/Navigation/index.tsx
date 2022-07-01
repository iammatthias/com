// NavigationMenu
// Language: typescript

// A navigation menu component that renders a response from the page query.

import Image from 'next/image';

import Box from '@/components/Box';
import Text from '@/components/Text';
import Timestamp from '@/utils/timestamp';

import Icon from '../../../public/images/navBarIcon.png';
import { navigationRecipe } from './Navigation.css';
import NavigationMenu from './NavigationMenu';

export const Navigation = () => {
  return (
    <Box as="nav" className={navigationRecipe({ nav: `mainWrapper` })}>
      <Box as="nav" className={navigationRecipe({ nav: `main` })}>
        <Box className={navigationRecipe({ nav: `brand` })}>
          <Image src={Icon} width={24} height={24} alt="" />

          <Text kind="p">
            <Text as="small" kind="small">
              <Text as="strong" kind="strong">
                I AM MATTHIAS
              </Text>
            </Text>
          </Text>
        </Box>

        <NavigationMenu />
        <Text kind="p">
          <Text as="small" kind="small">
            <Timestamp />
          </Text>
        </Text>
      </Box>
    </Box>
  );
};

export default Navigation;
