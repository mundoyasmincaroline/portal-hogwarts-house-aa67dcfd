import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

const HOUSE_COLORS: Record<string, { primary: string; emissive: string }> = {
  gryffindor: { primary: "#b91c1c", emissive: "#facc15" },
  slytherin:  { primary: "#15803d", emissive: "#94a3b8" },
  ravenclaw:  { primary: "#1e3a8a", emissive: "#c9a84c" },
  hufflepuff: { primary: "#ca8a04", emissive: "#451a03" },
};

function Crest({ imgUrl, house }: { imgUrl: string; house: string }) {
  const ref = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, imgUrl);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  const colors = HOUSE_COLORS[house] || HOUSE_COLORS.gryffindor;
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.8}>
      <group ref={ref}>
        {/* Escudo base */}
        <mesh>
          <cylinderGeometry args={[1.1, 1.1, 0.08, 32]} />
          <meshStandardMaterial color={colors.primary} metalness={0.9} roughness={0.25} emissive={colors.emissive} emissiveIntensity={0.25} />
        </mesh>
        {/* Borda dourada */}
        <mesh>
          <torusGeometry args={[1.1, 0.05, 16, 64]} />
          <meshStandardMaterial color="#c9a84c" metalness={1} roughness={0.15} emissive="#7a5a18" emissiveIntensity={0.6} />
        </mesh>
        {/* Imagem do brasão na frente */}
        <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.6, 1.6]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
        {/* Imagem espelhada atrás */}
        <mesh position={[0, 0, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.6, 1.6]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
      </group>
    </Float>
  );
}

export default function HouseCrest3D({ house, className = "" }: { house: string; className?: string }) {
  const imgUrl = `/houses/${house}.png`;
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.6, 3.2], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 4, 4]} intensity={1.4} color="#fde68a" />
        <pointLight position={[-4, -2, 2]} intensity={0.6} color="#8b5cf6" />
        <Suspense fallback={null}>
          <Crest imgUrl={imgUrl} house={house} />
        </Suspense>
      </Canvas>
    </div>
  );
}