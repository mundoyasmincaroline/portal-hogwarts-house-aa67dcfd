import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import type * as THREE from "three";

function Wand() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.9;
  });
  return (
    <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.6}>
      <group ref={ref} rotation={[0.2, 0, 0.4]}>
        {/* Cabo */}
        <mesh position={[0, -0.8, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.07, 0.7, 16]} />
          <meshStandardMaterial color="#3a2418" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Anel dourado */}
        <mesh position={[0, -0.4, 0]}>
          <torusGeometry args={[0.085, 0.025, 12, 24]} />
          <meshStandardMaterial color="#c9a84c" metalness={1} roughness={0.2} emissive="#7a5a18" emissiveIntensity={0.5} />
        </mesh>
        {/* Haste */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.07, 1.6, 16]} />
          <meshStandardMaterial color="#6b4423" roughness={0.6} metalness={0.1} />
        </mesh>
        {/* Ponta brilhante */}
        <mesh position={[0, 1.25, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={2.5} />
        </mesh>
        <pointLight position={[0, 1.25, 0]} intensity={1.5} distance={3} color="#fde68a" />
      </group>
    </Float>
  );
}

export default function Wand3D({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 3.5], fov: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 4, 2]} intensity={1.1} color="#fde68a" />
        <directionalLight position={[-3, -2, -2]} intensity={0.5} color="#6366f1" />
        <Suspense fallback={null}>
          <Wand />
          <Sparkles count={30} scale={3} size={2} speed={0.5} color="#fde68a" />
        </Suspense>
      </Canvas>
    </div>
  );
}