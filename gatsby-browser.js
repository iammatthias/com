import React from 'react'
import Layout from './src/components/general/Layout'

export const wrapPageElement = ({ element, props }) => {
  return (
    <Layout location={props.location} {...props}>
      {element}
    </Layout>
  )
}

export const onClientEntry = async () => {
  if (typeof IntersectionObserver === `undefined`) {
    await import(`intersection-observer`)
  }
}
