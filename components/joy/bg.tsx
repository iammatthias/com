// gradient

import { useRef, useEffect } from 'react'
import { styled } from '@/lib/stitches.config'

export default function Background({ props }: any) {
  const refContainer = useRef()
  const refCanvas = useRef()
  const refAnimationFrame = useRef()

  useEffect(() => {
    const colors = [
      0xea9280, 0xea9091, 0xe58fb1, 0xe38ec2, 0xbd93e4, 0xaa99eb, 0x8ca4ee,
      0x68dcfd, 0x5db0ef, 0x3db8cf, 0x52b9ab, 0x70e0c8, 0x5ab98b, 0x99d429,
      0xfa934e, 0xf4d909, 0xffb123,
    ]

    const NUM_CIRCLES = colors.length

    const canvas = refCanvas.current // @ts-ignore
    const ctx = canvas.getContext('2d') // @ts-ignore
    let w = canvas.offsetWidth // @ts-ignore
    let h = canvas.offsetHeight
    let velocity = Math.random() * (1.618 - 1.382) + 6.18

    const circles = Array.from(new Array(NUM_CIRCLES), (_, i) => {
      const MIN_RADIUS = h * 0.618
      const MAX_RADIUS = h * 3.82
      const rad = Math.random() * (MAX_RADIUS + MIN_RADIUS) + MAX_RADIUS
      const x = Math.random() * w
      const y = Math.random() * h
      const vx = Math.random() * -1 + 1
      const vy = Math.random() * -1 + 1
      const c = colors[i % colors.length]
      const color = `${(c >> 16) & 0xff}, ${(c >> 8) & 0xff},${c & 0xff}`
      return { rad, x, y, vx, vy, color }
    })

    const render = () => {
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
        g.addColorStop(0, `rgb( ${c.color} , 1)`)
        g.addColorStop(1, `rgb( ${c.color} ,  0)`)
        ctx.fillStyle = g
        ctx.arc(c.x, c.y, c.rad, 0, Math.PI * 3.82, false)
        ctx.fill()
      })

      refAnimationFrame.current = window.requestAnimationFrame(render) as any
    }

    const resize = () => {
      //Resize canvas
      // @ts-ignore
      refCanvas.current.width = refContainer.current.offsetWidth // @ts-ignore
      refCanvas.current.height = refContainer.current.offsetHeight // @ts-ignore
      w = refContainer.current.offsetWidth // @ts-ignore
      h = refContainer.current.offsetHeight
    }
    window.addEventListener('resize', resize)

    // Start it
    resize()
    render()
  }, [refContainer, refCanvas])

  const Box = styled('div', {
    position: 'fixed',
    top: '0',
    left: '0',
    height: '100vh',
    width: '100vw',
    zIndex: '-11',
    opacity: '0.382',
    '::before': {
      content: '""',
      position: 'fixed',
      top: '0',
      left: '0',
      display: 'block',
      width: '100vw',
      height: '100vh',
      backgroundImage:
        'url("data:image/png;base64,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")',
      backgroundRepeat: 'repeat',
      backgroundSize: '50px',
    },
  })

  return (
    // @ts-ignore
    <Box ref={refContainer} className="gradient">
      {/* @ts-ignore */}
      <canvas ref={refCanvas} />
    </Box>
  )
}
