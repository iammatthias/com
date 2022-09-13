import { useRouter } from 'next/router';
import {
  header,
  headerStart,
  headerCenter,
  headerEnd,
  headerGrid,
} from './header.css';
import Box from '@/components/box';
import Text from '@/components/text';
import Time from './time';

export default function Header() {
  const router = useRouter();
  const { pathname } = router;
  return (
    <Box className={`${header} ${headerStart}`}>
      <Box className={`${headerGrid}`}>
        <Box>
          <Text as="p" kind="small" navBar={true}>
            Home | Galleries | Writing | Etc
          </Text>
        </Box>
        <Box className={`${headerCenter}`}>
          <Text as="p" kind="small" navBar={true}>
            {pathname}
          </Text>
        </Box>
        <Box className={`${headerEnd}`}>
          <Text as="p" kind="small" navBar={true}>
            <Time />
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
