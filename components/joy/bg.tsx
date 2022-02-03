/* eslint-disable */
import * as THREE from 'three'
import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { styled } from '@/lib/stitches.config'

export default function Background() {
  const Box = styled('div', {
    position: 'fixed',
    top: '0',
    left: '0',
    height: '100vh',
    width: '100vw',
    zIndex: '-11',
  })

  function Gradient(props: JSX.IntrinsicElements['mesh']) {
    // This reference will give us direct access to the THREE.Mesh object
    const ref = useRef<THREE.Mesh>(null!)

    // Rotate mesh every frame, this is outside of React without overhead
    //   useFrame((state, delta) => (ref.current.rotation.x += 0.01))

    return (
      <mesh {...props} ref={ref} scale={1}>
        <boxGeometry args={[50, 50, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    )
  }
  return (
    <Box>
      <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Gradient position={[0, 0, 0]} />
      </Canvas>
    </Box>
  )
}
