/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Grid } from 'theme-ui'

const CardList = ({ location, ...props }) => {
  return (
    <>
      {location === '/' && (
        <Grid gap={3} rows={'auto'}>
          {props.children}
        </Grid>
      )}
      {location !== '/' && (
        <Grid
          gap={3}
          rows={'auto'}
          columns={['1fr', '1fr 1fr', '1fr 1fr 1fr']}
          sx={{ mb: 4 }}
        >
          {props.children}
        </Grid>
      )}
    </>
  )
}

export default CardList
