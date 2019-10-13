import React, { useState } from 'react'
import Img from 'gatsby-image'
import { chunk, sum } from 'lodash'
import { Box } from 'rebass'
import FsLightbox from 'fslightbox-react'
import styled from 'styled-components'

const GalleryContent = styled.div``

const Gallery = ({ title, images, itemsPerRow: itemsPerRowByBreakpoints }) => {
  const aspectRatios = images.map(image => image.fluid.aspectRatio)
  const lightboxImages = images.map(image => image.fluid.src)
  const rowAspectRatioSumsByBreakpoints = itemsPerRowByBreakpoints.map(
    itemsPerRow =>
      chunk(aspectRatios, itemsPerRow).map(rowAspectRatios =>
        sum(rowAspectRatios)
      )
  )
  const [toggler, setToggler] = useState(false)
  return (
    <GalleryContent>
      <h3 key={title}>{title}</h3>
      {images.map((image, i) => (
        <Box
          onClick={() => setToggler(!toggler)}
          as={Img}
          key={image.id}
          fluid={image.thumbnail}
          title={image.title}
          width={rowAspectRatioSumsByBreakpoints.map(
            (rowAspectRatioSums, j) => {
              const rowIndex = Math.floor(i / itemsPerRowByBreakpoints[j])
              const rowAspectRatioSum = rowAspectRatioSums[rowIndex]
              return `${(image.fluid.aspectRatio / rowAspectRatioSum) * 100}%`
            }
          )}
          css={`
            display: inline-block;
            vertical-align: middle;
            width: auto;
          `}
        />
      ))}
      <FsLightbox toggler={toggler} sources={lightboxImages} />
    </GalleryContent>
  )
}
export default Gallery
