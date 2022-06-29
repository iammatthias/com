import Image from 'next/image';
import { navigationRecipe } from './Navigation.css';
import Box from '@/components/Box';
import Text from '@/components/Text';
import Icon from '../../../public/images/navBarIcon.png';
import NavigationMenu from './NavigationMenu';
import Timestamp from '@/utils/timestamp';

export const Navigation = () => {
  // const timeStamp = new Date().toLocaleTimeString([], {
  //   hour: `2-digit`,
  //   minute: `2-digit`,
  // });
  return (
    <>
      <Box as="section" className={navigationRecipe({ nav: `main` })}>
        <Image src={Icon} width={15} height={15} />

        <Text kind="nav">
          <Timestamp />
        </Text>
      </Box>
      <NavigationMenu />
    </>
  );
};

export default Navigation;
