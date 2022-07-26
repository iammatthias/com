// GalleryWrapper
// Language: typescript

// Renders gallery images in a grid, but can be resused with inline assets.

import { Children } from 'react';
import Masonry from 'react-masonry-css';
import useMeasure from 'react-use-measure';

import Box from '@/components/Box';

import { wrapper, image } from './gallery.css';

export default function Wrapper({ children, ...props }: any) {
  // container width
  const [ref, bounds] = useMeasure({ options: { offset: false } } as any);

  const count = Children.toArray(children).length;

  const columnLimit =
    bounds.width > 650
      ? 4
      : bounds.width > 600
      ? 3
      : bounds.width > 525
      ? 2
      : bounds.width > 415
      ? 1
      : 1;
  const _columns = count >= columnLimit ? columnLimit : count;

  return (
    <Box ref={ref} className={props.className}>
      <Masonry
        breakpointCols={_columns}
        // className="my-masonry-grid"
        className={wrapper}
      >
        {Children.map(children, (child, index) => {
          return (
            <Box key={index} className={image}>
              {child}
            </Box>
          );
        })}
      </Masonry>
    </Box>
  );
}
