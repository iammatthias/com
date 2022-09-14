// import Link from 'next/link';
import Link from '@/components/link';

import Box from '@/components/box';
import Text from '@/components/text';
import dateFormat from '@/utils/dateFormat';
import PageQuery from '@/utils/pageQuery';

import {
  menuPageList,
  menuItem,
  menuItemSingle,
  menuItemWrapper,
  menuPageListSingle,
} from './pageList.css';

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

  const etcData = [
    {
      title: `Thoughts`,
      href: `/thoughts`,
    },
    {
      title: `The Guestbook`,
      href: `/guestbook`,
    },
    {
      title: `Eeethers`,
      href: `https://eeethers.xyz`,
    },
    {
      title: `Tokens`,
      href: `/tokens`,
    },
  ];

  if (pageType === `Etc`) {
    return (
      <Box className={menuPageList}>
        {etcData.map((page: any, index: number) => (
          <Box key={index} className={`${menuItemWrapper}`}>
            <Squiggle />
            <Link href={page.href} className={`${menuItemSingle}`}>
              <Text as="h3" kind="h3" center={true}>
                {page.title}
              </Text>
            </Link>
          </Box>
        ))}
      </Box>
    );
  } else
    return (
      <Box className={listStyle === `list` ? menuPageList : menuPageListSingle}>
        {ListData &&
          ListData.map((page: any, index: number) => (
            <Box key={index} className={`${menuItemWrapper}`}>
              <Squiggle />
              <Link href={`/${page.slug}`} className={`${menuItem}`}>
                <>
                  <Text as="h3" kind="h3">
                    {page.title}
                  </Text>
                  <Text as="h6" kind="h6">
                    Published: {dateFormat(page.publishDate)}
                  </Text>
                </>
              </Link>
            </Box>
          ))}
        {showMore && (
          <Box className={`${menuItemWrapper}`}>
            <Squiggle />
            <Link
              href={`/${pageType === `Gallery` ? `work` : `blog`}`}
              className={`${menuItemSingle}`}
            >
              <Text as="h3" kind="h3" center={true}>
                More ➳
              </Text>
            </Link>
          </Box>
        )}
      </Box>
    );
};

export default PageList;
