import { useRouter } from 'next/router';
import Link from 'next/link';
import { header, headerStart, headerEnd, headerGrid } from './header.css';
import Box from '@/components/box';
import Text from '@/components/text';
import Time from './time';
import useIsClient from '@/utils/useIsClient';

export default function Header() {
  const isClient = useIsClient();
  return (
    <Box className={`${header} ${headerStart}`}>
      <Box className={`${headerGrid}`}>
        <Box>
          <Text as="p" kind="small" navBar={true}>
            <Link href="/" passHref={true}>
              <a>Home</a>
            </Link>
          </Text>
        </Box>

        <Box className={`${headerEnd}`}>
          <Text as="p" kind="small" navBar={true}>
            {isClient && <Time />}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
