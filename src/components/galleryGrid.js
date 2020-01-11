/** @jsx jsx */

import React, { useState } from 'react' //eslint-disable-line

import { jsx, Box } from 'theme-ui'
import Img from 'gatsby-image'
import { chunk, sum } from 'lodash'

import FsLightbox from 'fslightbox-react'
import styled from 'styled-components'

const GalleryContent = styled.div``

const GalleryGrid = ({
  title,
  parent,
  images,
  aspectRatio,
  itemsPerRow: itemsPerRowByBreakpoints,
}) => {
  const aspectRatios = images.map(image => image.fluid.aspectRatio)
  const lightboxImages = images.map(image => image.fluid.src)
  // const eventImageTitle = images.map(image => image.title)
  // const eventImageSrc = images.map(image => image.thumbnail.src)

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
  }

  return (
    <GalleryContent>
      <h3 key={title}>{title}</h3>
      {images.map((image, i) => (
        <Img
          onClick={() => openLightbox(i)}
          key={image.id}
          fluid={image.thumbnail}
          title={image.title}
          css={{
            display: 'inline-block',
            verticalAlign: 'middle',
            width: rowAspectRatioSumsByBreakpoints.map(
              (rowAspectRatioSums, j) => {
                const rowIndex = Math.floor(i / itemsPerRowByBreakpoints[j])
                const rowAspectRatioSum = rowAspectRatioSums[rowIndex]
                return `${(image.thumbnail.aspectRatio / rowAspectRatioSum) *
                  100}%`
              }
            ),
          }}
        />
      ))}
      <FsLightbox
        toggler={toggler}
        sources={lightboxImages}
        slide={imageIndex}
        onClick={() => {
          console.log(imageIndex)
        }}
        // onOpen={() => {
        //   window.analytics.track('Image Viewed', {
        //     image: eventImageTitle[imageIndex],
        //     src: eventImageSrc[imageIndex],
        //     gallery: parent + ' — ' + title,
        //   })
        // }}
      />
    </GalleryContent>
  )
}
export default GalleryGrid
