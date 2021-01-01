import React from 'react';
import { useStaticQuery, graphql } from "gatsby";
import Img from 'gatsby-image';
import { chunk, sum } from 'lodash';
import { Box } from 'theme-ui';

const Gallery = ({
  title,
  itemsPerRow: itemsPerRowByBreakpoints,
}) => {

    const { allContentfulPage } = useStaticQuery(graphql`
    query MdxImages {
        allContentfulPage {
          edges {
            node {
              id
              images {
                id
                title
                images {
                  fluid {
                    aspectRatio
                    src
                  }
                  title
                }
              }
            }
          }
        }
    }     
    `);
    const images = allContentfulPage.edges.find(
        edge => edge.node.==images.title === {title}
    );


  const aspectRatios = images.map(image => image.fluid.aspectRatio)
  const rowAspectRatioSumsByBreakpoints = itemsPerRowByBreakpoints.map(
    itemsPerRow =>
      chunk(aspectRatios, itemsPerRow).map(rowAspectRatios =>
        sum(rowAspectRatios)
      )
  )



  return (
    <>
      {images.map((image, i) => (
        <a key={image.src} >
          <Box
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
        </a>
      ))}
     </>
  )
}
export default Gallery