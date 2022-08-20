// PageList
// Language: typescript

// Returns a list of pages of the correct type.

import Link from 'next/link';

import Box from '@/components/Box';
import Text from '@/components/text';
import dateFormat from '@/utils/dateFormat';
import PageQuery from '@/utils/pageQuery';

import { menuPageList, menuItem, menuPageListSingle } from './pageList.css';

import { DoubleArrowRightIcon } from '@radix-ui/react-icons';
import { navArrow } from '../header/header.css';
import Squiggle from '../squiggle';

type Props = {
  pageType?: string;
  limit?: number;
  featured?: boolean;
  showMore?: boolean;
  listStyle?: string;
};

export const PageList = ({
  pageType,
  showMore = false,
  featured = false,
  limit = 1000,
  listStyle,
}: Props) => {
  const ListData = PageQuery({
    type: pageType,
    featured,
    limit: limit,
    listStyle,
  });

  return (
    <Box className={listStyle === `list` ? menuPageList : menuPageListSingle}>
      {ListData &&
        ListData.map((page: any, index: number) => (
          <Box key={index}>
            <Link href={`/${page.slug}`} passHref={true}>
              <a className={menuItem}>
                <Squiggle height={8} squiggleWidth={8} />
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
      {showMore && (
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
