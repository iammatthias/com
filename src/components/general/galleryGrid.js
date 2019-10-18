import React, { useState } from 'react'
import Img from 'gatsby-image'
import { chunk, sum } from 'lodash'
import { Box } from 'rebass'
import FsLightbox from 'fslightbox-react'
import styled from 'styled-components'

const GalleryContent = styled.div``

const Gallery = ({
  title,
  parent,
  images,
  itemsPerRow: itemsPerRowByBreakpoints,
}) => {
  const aspectRatios = images.map(image => image.fluid.aspectRatio)
  const lightboxImages = images.map(image => image.fluid.src)
  const eventImageTitle = images.map(image => image.title)
  const eventImageSrc = images.map(image => image.thumbnail.src)
  const rowAspectRatioSumsByBreakpoints = itemsPerRowByBreakpoints.map(
    itemsPerRow =>
      chunk(aspectRatios, itemsPerRow).map(rowAspectRatios =>
        sum(rowAspectRatios)
      )
  )

  const [toggler, setToggler] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)

  const openLightbox = imageIndex => {
    setImageIndex(imageIndex + 1)
    setToggler(!toggler)

    window.analytics.track('Image Viewed', {
      image: eventImageTitle[imageIndex],
      src: eventImageSrc[imageIndex],
      gallery: parent + ' — ' + title,
    })
  }

  return (
    <GalleryContent>
      <h3 key={title}>{title}</h3>
      {images.map((image, i) => (
        <Box
          onClick={() => openLightbox(i)}
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
      <FsLightbox
        toggler={toggler}
        sources={lightboxImages}
        slide={imageIndex}
      />
    </GalleryContent>
  )
}
export default Gallery
