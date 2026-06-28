"use client";

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

function RotatingBox(props: any) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh {...props} ref={meshRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color={'#FF9C2A'} emissive={'#FF9C2A'} emissiveIntensity={0.5} roughness={0.3} metalness={0.8} />
    </mesh>
  );
}

function RotatingTorus(props: any) {
    const meshRef = useRef<THREE.Mesh>(null!);
    useFrame((state, delta) => {
      if (meshRef.current) {
        meshRef.current.rotation.x += delta * 0.1;
        meshRef.current.rotation.y -= delta * 0.4;
      }
    });
  
    return (
      <mesh {...props} ref={meshRef}>
        <torusGeometry args={[2.5, 0.1, 16, 100]} />
        <meshStandardMaterial color={'#3BA8FF'} emissive={'#3BA8FF'} emissiveIntensity={0.4} roughness={0.5} metalness={0.5} />
      </mesh>
    );
  }

export function BusinessGrowthScene() {
  return (
    <div className="h-[400px] w-full rounded-2xl bg-black/30">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={100} />
        <pointLight position={[-10, -10, -10]} intensity={50} color="#3BA8FF" />
        
        <RotatingBox position={[-2, 0, 0]} />
        <RotatingTorus position={[0, 0, -2]} />
        <RotatingBox position={[2, 0, 0]} rotation={[0.5, 0.5, 0.5]} />

        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
    </div>
  );
}
