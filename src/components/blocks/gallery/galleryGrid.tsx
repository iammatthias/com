// gallery

import { Children } from 'react';
import client from '@/lib/apolloClient';
import { Box } from '@/components/primitives/box';
import Masonry from 'react-masonry-css';
import { useRouter } from 'next/router';
import useMeasure from 'react-use-measure';

export default function GalleryGrid({ children }: any) {
  // container width
  const [ref, bounds] = useMeasure({ options: { offset: false } } as any);

  const count = Children.toArray(children).length;

  console.log(bounds.width);

  const columnLimit = bounds.width > 700 ? 4 : bounds.width > 512 ? 2 : 2;
  const columns = count >= columnLimit ? columnLimit : count;

  return (
    <Box ref={ref}>
      <Masonry
        breakpointCols={columns}
        className="my-masonry-grid"
        columnClassName="column"
      >
        {Children.map(children, (child) => {
          return (
            <Box
              className="column"
              css={{
                position: `relative`,
                width: `100%`,
                marginBottom: `24px`,
              }}
            >
              {child}
            </Box>
          );
        })}
      </Masonry>
    </Box>
  );
}
