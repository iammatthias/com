import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./shaders";

// Seeded random number generator
class SeededRNG {
  seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

// Generate procedural starfield texture
function generateStarTexture(seed: number, size: number = 1024): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const rng = new SeededRNG(seed);

  // Fill with dark background
  for (let i = 0; i < size * size * 4; i += 4) {
    data[i] = 2;
    data[i + 1] = 2;
    data[i + 2] = 5;
    data[i + 3] = 255;
  }

  // Add stars - scale count based on texture size
  const starCount = Math.floor((size / 1024) * (size / 1024) * 4000);
  for (let i = 0; i < starCount; i++) {
    const x = Math.floor(rng.next() * size);
    const y = Math.floor(rng.next() * size);
    const idx = (y * size + x) * 4;

    const bright = 200 + Math.floor(rng.next() * 55);
    const tint = rng.next();

    if (tint > 0.95) {
      // Blue stars
      data[idx] = bright * 0.8;
      data[idx + 1] = bright * 0.9;
      data[idx + 2] = bright;
    } else if (tint > 0.9) {
      // Orange stars
      data[idx] = bright;
      data[idx + 1] = bright * 0.8;
      data[idx + 2] = bright * 0.6;
    } else {
      // White stars
      data[idx] = bright;
      data[idx + 1] = bright;
      data[idx + 2] = bright;
    }
    data[idx + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}

function BlackHoleShader({ seed, iterations }: { seed: number; iterations: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, size } = useThree();

  // Reuse geometry across renders
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(1, 1);
  }, []);

  const material = useMemo(() => {
    // Scale texture size based on iterations for memory optimization
    const textureSize = Math.min(1024, Math.max(256, Math.floor(iterations * 4)));
    const texture = generateStarTexture(seed, textureSize);

    // Enable mipmaps for better memory usage
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uSpaceTexture: { value: texture },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        uTime: { value: 0 },
        uMaxIterations: { value: iterations },
      },
    });
  }, [seed, iterations]);

  useEffect(() => {
    const handleResize = () => {
      if (material.uniforms.uResolution) {
        material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [material]);

  useEffect(() => {
    return () => {
      material.uniforms.uSpaceTexture.value?.dispose();
      material.dispose();
      geometry.dispose();
    };
  }, [material, geometry]);

  useFrame((state) => {
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} scale={[viewport.width, viewport.height, 1]}>
      <primitive object={geometry} attach='geometry' />
      <primitive object={material} attach='material' />
    </mesh>
  );
}

export default function BlackHole({ seed = 404 }: { seed?: number }) {
  // Derive iterations from seed (50-250 range)
  const iterations = useMemo(() => {
    const normalized = (seed % 200) + 50; // Maps to 50-250 range
    return normalized;
  }, [seed]);

  // Scale down DPR for high iteration counts to save memory/performance
  const dpr = useMemo((): [number, number] => {
    if (iterations > 200) return [0.5, 0.75];
    if (iterations > 150) return [0.75, 1];
    return [1, 1.25];
  }, [iterations]);

  return (
    <div
      style={{
        position: "fixed",
        top: 54,
        left: 17,
        right: 17,
        bottom: 54,
        zIndex: -1,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 1], fov: 60 }}
        dpr={dpr}
        style={{ width: "100%", height: "100%", display: "block" }}
        resize={{ scroll: false }}
      >
        <BlackHoleShader seed={seed} iterations={iterations} />
      </Canvas>
    </div>
  );
}
