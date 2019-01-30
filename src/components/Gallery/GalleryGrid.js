import React from 'react'
import Img from 'gatsby-image'
import { chunk, sum } from 'lodash'
import { Box, Link, Heading } from 'rebass'

const Gallery = ({
  title,
  slug,
  images,
  itemsPerRow: itemsPerRowByBreakpoints,
}) => {
  const aspectRatios = images.map(image => image.fluid.aspectRatio)
  const rowAspectRatioSumsByBreakpoints = itemsPerRowByBreakpoints.map(
    itemsPerRow =>
      chunk(aspectRatios, itemsPerRow).map(rowAspectRatios =>
        sum(rowAspectRatios)
      )
  )

  return (
    <>
      <Box key={slug} p={[4, 5]}>
        <Heading key={title}>{title}</Heading>
        {images.map((image, i) => (
          <Link key={image.id} href={image.originalImg}>
            <Box
              as={Img}
              key={image}
              fluid={image.fluid}
              title={image.title}
              width={rowAspectRatioSumsByBreakpoints.map(
                (rowAspectRatioSums, j) => {
                  const rowIndex = Math.floor(i / itemsPerRowByBreakpoints[j])
                  const rowAspectRatioSum = rowAspectRatioSums[rowIndex]

                  return `${(image.fluid.aspectRatio / rowAspectRatioSum) *
                    100}%`
                }
              )}
              css={`
            display: inline-block;
            vertical-align: middle;
            objectFit: 'cover !important',
            height: '100%',
          `}
            />
          </Link>
        ))}
      </Box>
    </>
  )
}

export default Gallery
