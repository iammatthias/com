import { featured, content } from './featured.css';
import Box from '../Box';
import Text from '../text';
import PageList from '../pageList';

export default function Featured() {
  return (
    <Box className={`${featured}`}>
      <Box className={`${content}`}>
        <Text as="h1" kind="h1" font="heading">
          Featured
        </Text>
        <PageList featured={true} />
      </Box>
    </Box>
  );
}
