// PageList
// Language: typescript

// Returns a list of pages of the correct type.

import Link from 'next/link';

import Box from '@/components/Box';
import Text from '@/components/Text';
import dateFormat from '@/utils/dateFormat';
import PageQuery from '@/utils/gql/pageQuery';

import { navigationRecipe } from './Navigation.css';

type Props = {
  pageType: string;
  limit: number;
};

export const PageList = ({ pageType, limit = 1000 }: Props) => {
  const ListData = PageQuery({ type: pageType, limit: limit });

  return (
    <Box className={navigationRecipe({ nav: `menuPageList` })}>
      {ListData &&
        ListData.map((page: any, index: number) => (
          <Box key={index}>
            <Link href={`/${page.slug}`} passHref={true}>
              <a className={navigationRecipe({ nav: `menuItem` })}>
                <Text kind="p">
                  <Text as="small" kind="small">
                    <Text as="strong" kind="strong">
                      {page.title}
                    </Text>
                  </Text>
                </Text>
                <Text kind="p">
                  <Text as="small" kind="small">
                    Published: {dateFormat(page.publishDate)}
                  </Text>
                </Text>
              </a>
            </Link>
          </Box>
        ))}
    </Box>
  );
};

export default PageList;
