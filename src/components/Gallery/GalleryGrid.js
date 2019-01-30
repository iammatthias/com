import React, { useState } from 'react'
import Img from 'gatsby-image'
import { chunk, sum } from 'lodash'
import { Box, Link, Heading } from 'rebass'
import Carousel, { Modal, ModalGateway } from 'react-images'

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

  const [modalIsOpen, setModalIsOpen] = () => useState(false)
  const modalCurrentIndex = () => useState(0)

  const closeModal = () => setModalIsOpen(false)
  const openModal = () => {
    useState(state => ({ setModalIsOpen: !state.modalIsOpen }))
  }

  return (
    <>
      <Box key={slug} p={[4, 5]}>
        <Heading key={title}>{title}</Heading>
        {images.map((image, i) => (
          <Link
            key={image.id}
            href={image.originalImg}
            onClick={e => openModal(i)}
          >
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
        {ModalGateway && (
          <ModalGateway>
            {modalIsOpen && (
              <Modal onClose={closeModal}>
                <Carousel
                  views={images.map(({ originalImg, caption }) => ({
                    source: originalImg,
                    caption,
                  }))}
                  currentIndex={modalCurrentIndex}
                  components={{ FooterCount: () => null }}
                />
              </Modal>
            )}
          </ModalGateway>
        )}
      </Box>
    </>
  )
}

export default Gallery
