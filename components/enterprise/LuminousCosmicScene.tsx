"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function LuminousCosmicScene() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 0);
    host.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    // 1. Vibrant High-Visibility Celestial Torus Knot (Centerpiece 3D Geometry)
    const knotGeometry = new THREE.TorusKnotGeometry(1.6, 0.28, 120, 16, 2, 3);
    const knotMaterial = new THREE.MeshNormalMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const torusKnot = new THREE.Mesh(knotGeometry, knotMaterial);
    torusKnot.position.set(0, 0.3, -1.2);
    root.add(torusKnot);

    // 2. Concentric Orbital Energy Rings
    const ringGroup = new THREE.Group();
    const ringColors = [0x2563eb, 0x7c3aed, 0x0284c7, 0xd97706, 0xdb2777];

    ringColors.forEach((colorHex, idx) => {
      const radius = 2.0 + idx * 0.7;
      const ringGeo = new THREE.TorusGeometry(radius, 0.025, 16, 90);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.45 - idx * 0.06,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2.6 + (idx * 0.15);
      ringMesh.rotation.y = idx * 0.2;
      ringMesh.userData = { speed: 0.2 + idx * 0.1, phase: idx * 0.5 };
      ringGroup.add(ringMesh);
    });
    ringGroup.position.set(0, 0.2, -1.0);
    root.add(ringGroup);

    // 3. Dense High-Contrast Particle Galaxy (Bold & Distinct on White Background)
    const particleCount = 1400;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      // Orbital distribution around center hero text
      const radius = 1.2 + Math.random() * 7.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;

      particlePositions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) + 0.2;
      particlePositions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi) - 1.0;

      // Rich high-contrast colors (Deep Royal Blue, Electric Indigo, Solar Amber, Magenta)
      const colorRand = Math.random();
      if (colorRand < 0.35) {
        color.setHex(0x1d4ed8); // Deep Royal Blue
      } else if (colorRand < 0.6) {
        color.setHex(0x6d28d9); // Electric Purple
      } else if (colorRand < 0.8) {
        color.setHex(0x0284c7); // Vivid Cyan
      } else {
        color.setHex(0xd97706); // Warm Amber
      }

      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        size: 0.038,
        transparent: true,
        opacity: 0.9,
        vertexColors: true,
        depthWrite: false,
      })
    );
    root.add(particles);

    // 4. Interstellar Beacon Beams (Sweeping Vertical Light Columns)
    const beamGroup = new THREE.Group();
    const beamPalette = [0x3b82f6, 0x8b5cf6, 0x06b6d4, 0xf59e0b];

    for (let i = 0; i < 18; i++) {
      const width = i % 2 === 0 ? 0.35 : 0.18;
      const height = 8.5 + Math.random() * 3.0;
      const beamMat = new THREE.MeshBasicMaterial({
        color: beamPalette[i % beamPalette.length],
        transparent: true,
        opacity: 0.18 + Math.random() * 0.15,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const beam = new THREE.Mesh(new THREE.PlaneGeometry(width, height), beamMat);
      beam.position.set(-4.5 + i * 0.52, -0.5, -1.5);
      beam.rotation.z = -0.12 + Math.random() * 0.24;
      beam.userData = { phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 0.5 };
      beamGroup.add(beam);
    }
    root.add(beamGroup);

    // Mouse Parallax Effect
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    host.addEventListener('pointermove', onPointerMove);

    let frame = 0;
    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        root.rotation.y += (pointer.x * 0.06 - root.rotation.y) * 0.03;
        root.rotation.x += (-pointer.y * 0.04 - root.rotation.x) * 0.03;

        // Torus knot rotation
        torusKnot.rotation.x = elapsed * 0.25;
        torusKnot.rotation.y = elapsed * 0.35;

        // Particle galaxy spin
        particles.rotation.y = elapsed * 0.025;
        particles.rotation.z = Math.sin(elapsed * 0.1) * 0.05;

        // Energy rings rotation
        ringGroup.children.forEach((ringMesh, idx) => {
          ringMesh.rotation.z = elapsed * (0.05 + idx * 0.02) * (idx % 2 === 0 ? 1 : -1);
          const mat = (ringMesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = 0.25 + Math.sin(elapsed * 1.5 + idx) * 0.15;
        });

        // Beacon beams pulse
        beamGroup.children.forEach((beam) => {
          const mat = (beam as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = 0.12 + Math.sin(elapsed * beam.userData.speed + beam.userData.phase) * 0.1 + 0.08;
        });
      }

      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      if (host.contains(renderer.domElement)) {
        host.removeChild(renderer.domElement);
      }
      knotGeometry.dispose();
      knotMaterial.dispose();
      particleGeometry.dispose();
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0 pointer-events-none" aria-hidden />;
}
