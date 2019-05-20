import React from 'react'
import PropTypes from 'prop-types'

import withAuth from './withAuth'

const useAuth = process.env.ENABLE_NETLIFY_AUTH === 'true'

const wrapRootElement = ({ element }) => {
  const RootElement = () => <React.Fragment>{element}</React.Fragment>

  if (!useAuth) {
    return <RootElement />
  }

  const ElementWithAuth = withAuth(RootElement)
  return <ElementWithAuth />
}

wrapRootElement.propTypes = {
  element: PropTypes.node.isRequired,
}

export default wrapRootElement
