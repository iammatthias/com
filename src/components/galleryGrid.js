/** @jsx jsx */

import React, { useState } from 'react' //eslint-disable-line

import { jsx, Box } from 'theme-ui'

import { Link } from '@theme-ui/components'

import Img from 'gatsby-image'
import { chunk, sum } from 'lodash'
import FsLightbox from 'fslightbox-react'

const GalleryGrid = ({
  title,
  parent,
  images,
  aspectRatio,
  itemsPerRow: itemsPerRowByBreakpoints,
}) => {
  const lightboxImages = images.map(image => image.fluid.src)
  const aspectRatios = images.map(image => image.fluid.aspectRatio)
  const rowAspectRatioSumsByBreakpoints = itemsPerRowByBreakpoints.map(
    itemsPerRow =>
      chunk(aspectRatios, itemsPerRow).map(rowAspectRatios =>
        sum(rowAspectRatios)
      )
  )

  const [toggler, setToggler] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)

  function openLightbox(imageIndex, e) {
    e.preventDefault()
    setImageIndex(imageIndex + 1)
    setToggler(!toggler)
  }

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

      {images.map((image, i) => (
        <Link key={image.id} onClick={() => openLightbox(i, event)}>
          <Box
            as={Img}
            fluid={image.thumbnail}
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
            }}
            css={{
              display: 'inline-block',
              verticalAlign: 'middle',
            }}
          />
        </Link>
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
    </>
  )
}
export default GalleryGrid
