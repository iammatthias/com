/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Image, Box } from 'theme-ui'
import { Link } from '@theme-ui/components'
// import Img from 'gatsby-image'
import { chunk, sum } from 'lodash'

const GalleryGrid = ({
  title,
  parent,
  images,
  aspectRatio,
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
      <p
        sx={{
          variant: 'styles.h2',
        }}
        key={title}
      >
        {title}
      </p>
      <center>
        {images.map((image, i) => (
          <Link key={image.id}>
            <Box
              as={Image}
              src={image.thumbnail.src}
              title={image.title}
              sx={{
                width: rowAspectRatioSumsByBreakpoints.map(
                  (rowAspectRatioSums, j) => {
                    const rowIndex = Math.floor(i / itemsPerRowByBreakpoints[j])
                    const rowAspectRatioSum = rowAspectRatioSums[rowIndex]
                    return `${(image.fluid.aspectRatio / rowAspectRatioSum) *
                      100}%`
                  }
                ),
                maxWidth: '65%',
                p: 2,
              }}
              css={{
                display: 'inline-block',
                verticalAlign: 'middle',
              }}
            />
          </Link>
        ))}
      </center>
    </>
  )
}
export default GalleryGrid
