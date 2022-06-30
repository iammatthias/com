import { HomeIcon, MixIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

import Box from '@/components/Box';
import Text from '@/components/Text';
import PageQuery from '@/utils/gql/pageQuery';

import { navigationRecipe } from './Navigation.css';

type Props = {
  pageType: string;
};

export const PageList = (pageType: Props) => {
  const ListData = PageQuery({ type: pageType.pageType });

  return (
    <Box className={navigationRecipe({ nav: `menuPageList` })}>
      {ListData &&
        ListData.map((page: any, index: number) => (
          <Box key={index}>
            <Link href={`/${page.slug}`} passHref={true}>
              <a className={navigationRecipe({ nav: `menuItem` })}>
                <Text kind="p">{page.title}</Text>
                <Text kind="p">
                  <Text as="small" kind="small">
                    Published:{` `}
                    {new Date(
                      page.publishDate.replace(/-/g, `/`).replace(/T.+/, ``),
                    ).toLocaleDateString(`en-us`)}
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
