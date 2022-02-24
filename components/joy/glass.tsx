// gallery

import Image, { ImageLoaderProps } from 'next/image'
import useSWR from 'swr'
import Box from '../primitives/box'
import Masonry from 'react-masonry-css'
import useMeasure from 'react-use-measure'
// import Lightbox from '@/components/blocks/galleryLightbox'

export default function Gallery(props: any) {
  // container width
  // @ts-ignore
  const [ref, bounds] = useMeasure({ options: { offset: false } })

  // data
  const fetcher = (url: any) => fetch(url).then(res => res.json())
  function useGlass() {
    const { data, error } = useSWR(`/api/glass`, fetcher)

    return {
      data: data,
      isLoading: !error && !data,
      isError: error,
    }
  }

  // data result - images
  const data = useGlass()
  const glassPosts = data.data ? data.data.data : []

  const imageSetLength = glassPosts.length
  const columnLimit =
    bounds.width > 1536
      ? 7
      : bounds.width > 1024
      ? 5
      : bounds.width > 768
      ? 3
      : bounds.width > 512
      ? 2
      : 2
  const columnWidth =
    bounds.width /
    (imageSetLength >= columnLimit ? columnLimit : imageSetLength)
  const columns = imageSetLength >= columnLimit ? columnLimit : imageSetLength

  function glassLoader({ src }: ImageLoaderProps): string {
    return `${src}`
  }

  return (
    <Box ref={ref} className="gallery" css={{ marginBottom: '2rem' }}>
      {/* <Lightbox> */}
      <Masonry
        breakpointCols={columns}
        className="my-masonry-grid"
        columnClassName="column"
      >
        {glassPosts.map((post: any) => (
          <Box
            className="column"
            key={post.id}
            css={{
              position: 'relative',
              width: '100%',
              marginBottom: '24px',
              height: props.ratio
                ? eval(props.ratio) * columnWidth
                : (post.height / post.width) * columnWidth,
            }}
          >
            <a href={post.share_url}>
              <Image
                src={post.image828x0}
                alt={post.id}
                layout="fill"
                placeholder="blur"
                blurDataURL={post.image0x240}
                objectFit="cover"
                className="gallery"
                loader={glassLoader}
                unoptimized={true}
              />
            </a>
          </Box>
        ))}
      </Masonry>
      {/* </Lightbox> */}
    </Box>
  )
}
