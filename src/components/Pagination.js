/** @jsx jsx */

import React from 'react' //eslint-disable-line

import { jsx } from 'theme-ui'

import { Link } from 'gatsby'

class Pagination extends React.Component {
  render() {
    const { numPages, currentPage, slug } = this.props.context
    const isFirst = currentPage === 1
    const isLast = currentPage === numPages
    const isNotPaginated = isFirst & isLast

    const prevPageNum = currentPage - 1 === 1 ? `` : currentPage - 1
    const nextPageNum = currentPage + 1

    const pathPrefix = typeof slug === 'string' ? `/tag/${slug}` : ''
    const prevPageLink = isFirst ? null : `${pathPrefix}/${prevPageNum}/`
    const nextPageLink = isLast ? null : `${pathPrefix}/${nextPageNum}/`

    return (
      <p>
        {!isFirst && (
          <Link
            sx={{
              variant: 'styles.a',
            }}
            className="button"
            to={'blog/' + prevPageLink}
          >
            &#8592; Previous Page
          </Link>
        )}
        {!isNotPaginated && (
          <span sx={{ variant: 'styles.h3', px: 4 }}>
            {currentPage}/{numPages}
          </span>
        )}
        {!isLast && (
          <Link
            sx={{
              variant: 'styles.a',
            }}
            className="button"
            to={'blog/' + nextPageLink}
          >
            Next Page &#8594;
          </Link>
        )}
      </p>
    )
  }
}

export default Pagination
