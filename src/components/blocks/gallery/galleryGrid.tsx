// gallery

import { Children } from 'react';
import { Box } from '@/components/primitives/box';
import Masonry from 'react-masonry-css';
import useMeasure from 'react-use-measure';

export default function GalleryGrid({ children }: any) {
  // container width
  const [ref, bounds] = useMeasure({ options: { offset: false } } as any);

  const count = Children.toArray(children).length;

  const columnLimit = bounds.width > 735 ? 4 : bounds.width > 413 ? 2 : 1;
  const _columns = count >= columnLimit ? columnLimit : count;

  return (
    <Box ref={ref}>
      <Masonry
        breakpointCols={_columns}
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
