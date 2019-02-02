// @flow

import React, { useState } from 'react'
import Img from 'gatsby-image'
import { chunk, sum } from 'lodash'
import { Box, Link, Heading } from 'rebass'
import Carousel, { Modal, ModalGateway } from 'react-images'

type Props = {
  images: {
    id: string,
    src: string,
    srcSet: string,
    fluid: string,
    title: string,
  }[],
  itemsPerRow?: number[],
  title: string,
  slug: string,
}

const Gallery = ({
  title,
  images,
  itemsPerRow: itemsPerRowByBreakpoints,
}: Props) => {
  const aspectRatios = images.map(image => image.fluid.aspectRatio)
  const rowAspectRatioSumsByBreakpoints = itemsPerRowByBreakpoints.map(
    itemsPerRow =>
      chunk(aspectRatios, itemsPerRow).map(rowAspectRatios =>
        sum(rowAspectRatios)
      )
  )

  const [modalIsOpen, setModalIsOpen] = useState(false)
  const [modalCurrentIndex, setModalCurrentIndex] = useState(0)

  const closeModal = () => setModalIsOpen(false)
  const openModal = (imageIndex: number) => {
    setModalCurrentIndex(imageIndex)
    setModalIsOpen(true)
  }

  return (
    <Box p={[4, 5]}>
      <Heading key={title}>{title}</Heading>
      {images.map((image, i) => (
        <Link key={image.src} onClick={() => openModal(i)}>
          <Box
            as={Img}
            key={image.id}
            fluid={image.fluid}
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
            `}
          />
        </Link>
      ))}
      {ModalGateway && (
        <ModalGateway>
          {modalIsOpen && (
            <Modal
              onClose={closeModal}
              styles={{
                blanket: base => ({
                  ...base,
                  backgroundColor: 'rgba(255,255,255,0.85)',
                }),
                dialog: base => ({ ...base, maxWidth: 640 }),
              }}
            >
              <Carousel
                views={images.map(({ fluid }) => ({
                  source: fluid.src,
                }))}
                frameProps={{ autoSize: 'height' }}
                currentIndex={modalCurrentIndex}
                components={{ FooterCount: () => null }}
                styles={{
                  footer: base => ({
                    ...base,
                    background: 'none !important',
                    color: '#666',
                    padding: 0,
                    paddingTop: 20,
                    position: 'static',
                    '& a': { color: 'black' },
                  }),
                  header: base => ({
                    ...base,
                    background: 'none !important',
                    padding: 0,
                    paddingBottom: 10,
                    position: 'static',
                  }),
                  headerClose: base => ({
                    ...base,
                    color: '#666',
                    ':hover': { color: '#DE350B' },
                  }),
                  view: base => ({
                    ...base,
                    maxHeight: 480,
                    overflow: 'hidden',
                  }),
                }}
              />
            </Modal>
          )}
        </ModalGateway>
      )}
    </Box>
  )
}
export default Gallery
