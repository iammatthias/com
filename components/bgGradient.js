/** @jsxImportSource theme-ui */

// gradient

import { Gradient } from '../lib/utils/gradient'

export default function Background({ props }) {
  const gradient = new Gradient()
  gradient.initGradient('#gradient-canvas')
  return (
    <div
      sx={{
        zIndex: '0',
        position: 'fixed',
        top: '0',
        left: '0',
        '#gradient-canvas': {
          zIndex: '-10',
          width: '100vw',
          height: '100vh',
          '--gradient-color-1': theme => `${theme.colors.gradient1}`,
          '--gradient-color-2': theme => `${theme.colors.gradient2}`,
          '--gradient-color-3': theme => `${theme.colors.gradient3}`,
          '--gradient-color-4': theme => `${theme.colors.gradient4}`,
        },
      }}
    >
      <canvas id="gradient-canvas" {...props} />
    </div>
  )
}
