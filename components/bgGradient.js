/** @jsxImportSource theme-ui */

// gradient

import { useRef, useEffect } from 'react'

export default function Background({ props }) {
  const refContainer = useRef()
  const refCanvas = useRef()
  const refAnimationFrame = useRef()

  useEffect(() => {
    const colors = [0x00aeef, 0x1b5cff, 0x7d2e61, 0xed3d24, 0xffd600, 0xed0f69]

    const NUM_CIRCLES = colors.length

    const canvas = refCanvas.current
    const ctx = canvas.getContext('2d')
    let w = canvas.offsetWidth
    let h = canvas.offsetHeight
    let velocity = 3.82

    const circles = Array.from(new Array(NUM_CIRCLES), (_, i) => {
      const MIN_RADIUS = h * 0.618
      const MAX_RADIUS = h * 6.18
      const rad = Math.random() * MIN_RADIUS + MAX_RADIUS
      const x = Math.random() * w
      const y = Math.random() * h
      const vx = Math.random() * -1 + 1
      const vy = Math.random() * -1 + 1
      const c = colors[i % colors.length]
      const color = `${(c >> 16) & 0xff}, ${(c >> 8) & 0xff},${c & 0xff}`
      return { rad, x, y, vx, vy, color }
    })

    const render = _ => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      circles.forEach((c, i) => {
        if (c.x > w) c.vx = -c.vx
        if (c.x < 0) c.vx = -c.vx
        if (c.y > h) c.vy = -c.vy
        if (c.y < 0) c.vy = -c.vy
        c.x += c.vx * velocity
        c.y += c.vy * velocity
        ctx.beginPath()
        const g = ctx.createRadialGradient(
          c.x,
          c.y,
          c.rad * 0.01,
          c.x,
          c.y,
          c.rad,
        )
        g.addColorStop(0, `rgb( ${c.color} , .5)`)
        g.addColorStop(1, `rgb( ${c.color} ,  0)`)
        ctx.fillStyle = g
        ctx.arc(c.x, c.y, c.rad, 0, Math.PI * 2, false)
        ctx.fill()
      })

      refAnimationFrame.current = window.requestAnimationFrame(render)
    }

    const resize = _ => {
      //Resize canvas
      refCanvas.current.width = refContainer.current.offsetWidth
      refCanvas.current.height = refContainer.current.offsetHeight
      w = refContainer.current.offsetWidth
      h = refContainer.current.offsetHeight
    }
    window.addEventListener('resize', resize)

    // Start it
    resize()
    render()
  }, [refContainer, refCanvas])

  return (
    <div
      ref={refContainer}
      className="gradient"
      sx={{
        position: 'fixed',
        top: '0',
        left: '0',
        height: '100vh',
        width: '100vw',
        opacity: '0.382',
        zIndex: '-10',
      }}
    >
      <canvas ref={refCanvas} />
    </div>
  )
}
