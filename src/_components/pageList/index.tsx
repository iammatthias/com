// PageList
// Language: typescript

// Returns a list of pages of the correct type.

import Link from 'next/link';

import Box from '@/_components/Box';
import Text from '@/_components/text';
import dateFormat from '@/utils/dateFormat';
import PageQuery from '@/utils/pageQuery';

import { menuPageList, menuItem } from './pageList.css';

import { DoubleArrowRightIcon } from '@radix-ui/react-icons';
import { navArrow } from '../header/header.css';

import { useRouter } from 'next/router';

type Props = {
  pageType: string;
  limit: number;
};

export const PageList = ({ pageType, limit = 1000 }: Props) => {
  const router = useRouter();
  const pathname = router.asPath;
  const ListData = PageQuery({ type: pageType, limit: limit });

  const isBlogList = pathname === `/blog`;
  const isGalleryList = pathname === `/gallery`;

  const isListView = isBlogList || isGalleryList;

  return (
    <Box className={menuPageList}>
      {ListData &&
        ListData.map((page: any, index: number) => (
          <Box key={index}>
            <Link href={`/${page.slug}`} passHref={true}>
              <a className={menuItem}>
                <Text as="h5" kind="h5" bold={true}>
                  {page.title}
                </Text>
                <Text as="p" kind="h6">
                  Published: {dateFormat(page.publishDate)}
                </Text>
              </a>
            </Link>
          </Box>
        ))}
      {isListView && (
        <Box>
          <Link
            href={`/${pageType === `Gallery` ? `work` : `blog`}`}
            passHref={true}
          >
            <a className={menuItem}>
              <Text as="h5" kind="h5" bold={true}>
                More <DoubleArrowRightIcon className={navArrow} />
              </Text>
            </a>
          </Link>
        </Box>
      )}
    </Box>
  );
};

export default PageList;
