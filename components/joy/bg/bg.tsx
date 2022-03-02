import { useEffect, useRef } from 'react'
import { Gradient } from './gradient.js'

export default function Background({ ...props }) {
  const gradient: any = new Gradient()
  const ref = useRef()

  useEffect(() => {
    if (ref.current) {
      // console.log(ref)
      gradient.initGradient('#gradient-canvas')
    }
  })
  //@ts-ignore
  return <canvas ref={ref} id="gradient-canvas" data-transition-in {...props} />
}
