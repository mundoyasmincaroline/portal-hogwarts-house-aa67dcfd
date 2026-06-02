import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles, Environment } from "@react-three/drei";
import type * as THREE from "three";

function Orb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.25;
      ref.current.rotation.x += dt * 0.08;
    }
  });
  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={ref} castShadow>
        <icosahedronGeometry args={[1.25, 6]} />
        <MeshDistortMaterial
          color="#c9a84c"
          emissive="#7a5a18"
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.85}
          distort={0.35}
          speed={1.6}
        />
      </mesh>
    </Float>
  );
}

interface MagicalOrbProps {
  className?: string;
}

/**
 * Esfera mágica 3D (Three.js) — usada como acento em hero/login.
 * Carregada sob demanda. Em mobile/sem WebGL cai silenciosamente.
 */
export default function MagicalOrb({ className = "" }: MagicalOrbProps) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#fde68a" />
        <pointLight position={[-4, -2, -3]} intensity={0.8} color="#6366f1" />
        <Suspense fallback={null}>
          <Orb />
          <Sparkles count={60} scale={5} size={2.5} speed={0.4} color="#fde68a" />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}