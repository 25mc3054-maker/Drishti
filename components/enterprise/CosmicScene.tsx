"use client"

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function CosmicScene() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let onPointerMove: ((event: PointerEvent) => void) | null = null;
    let starGeometry: THREE.BufferGeometry | null = null;
    let root: THREE.Group | null = null;

    try {
      const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0.25, 7.6);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);

      root = new THREE.Group();
      scene.add(root);

      const beamGroup = new THREE.Group();
      const beamColors = [0xff8a1f, 0xffd24a, 0x49adff, 0x85ffd7, 0xffffff];
      for (let index = 0; index < 12; index += 1) {
        const width = index % 3 === 0 ? 0.18 : 0.09;
        const height = 6.5 + Math.random() * 2.8;
        const beam = new THREE.Mesh(
          new THREE.PlaneGeometry(width, height),
          new THREE.MeshBasicMaterial({
            color: beamColors[index % beamColors.length],
            transparent: true,
            opacity: 0.12 + Math.random() * 0.16,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
          }),
        );
        beam.position.set(-3.6 + index * 0.6, -0.95 + Math.random() * 0.35, -0.35 - Math.random() * 0.3);
        beam.rotation.z = (-0.05 + Math.random() * 0.1);
        beam.userData = { phase: Math.random() * Math.PI * 2, speed: 0.35 + Math.random() * 0.35 };
        beamGroup.add(beam);
      }
      root.add(beamGroup);

      const starCount = 350;
      const starPositions = new Float32Array(starCount * 3);
      const starColors = new Float32Array(starCount * 3);
      const color = new THREE.Color();
      for (let index = 0; index < starCount; index += 1) {
        starPositions[index * 3] = (Math.random() - 0.5) * 15;
        starPositions[index * 3 + 1] = Math.random() * 8 - 1.4;
        starPositions[index * 3 + 2] = -Math.random() * 8 - 0.8;
        color.setHSL(0.58 + Math.random() * 0.12, 0.4, 0.72 + Math.random() * 0.2);
        starColors[index * 3] = color.r;
        starColors[index * 3 + 1] = color.g;
        starColors[index * 3 + 2] = color.b;
      }

      starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
      const stars = new THREE.Points(
        starGeometry,
        new THREE.PointsMaterial({
          size: 0.018,
          transparent: true,
          opacity: 0.8,
          vertexColors: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      root.add(stars);

      const networkGroup = new THREE.Group();
      const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.84 });
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x6aa6ff, transparent: true, opacity: 0.3 });
      const nodes = [
        new THREE.Vector3(-1.15, 0.7, 0.2),
        new THREE.Vector3(-0.55, 1.05, 0.15),
        new THREE.Vector3(0.1, 0.58, 0.18),
        new THREE.Vector3(0.65, 1.0, 0.16),
        new THREE.Vector3(1.18, 0.5, 0.18),
        new THREE.Vector3(0.42, 0.08, 0.2),
        new THREE.Vector3(-0.72, -0.04, 0.2),
      ];
      nodes.forEach((node, index) => {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(index % 3 === 0 ? 0.085 : 0.055, 16, 16), nodeMaterial.clone());
        dot.position.copy(node);
        dot.userData = { phase: index * 0.8 };
        networkGroup.add(dot);
      });
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(nodes);
      networkGroup.add(new THREE.Line(lineGeometry, lineMaterial));
      networkGroup.position.set(2.08, 0.58, -0.35);
      networkGroup.rotation.z = -0.08;
      root.add(networkGroup);

      const pointer = { x: 0, y: 0 };
      onPointerMove = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        }
      };
      host.addEventListener('pointermove', onPointerMove, { passive: true });

      const resize = () => {
        if (!renderer) return;
        const width = Math.max(host.clientWidth, 1);
        const height = Math.max(host.clientHeight, 1);
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      const clock = new THREE.Clock();
      const animate = () => {
        if (!renderer) return;
        const elapsed = clock.getElapsedTime();

        if (!prefersReducedMotion && root) {
          root.rotation.y += ((pointer.x * 0.035) - root.rotation.y) * 0.025;
          root.rotation.x += ((-pointer.y * 0.018) - root.rotation.x) * 0.025;
          stars.rotation.y = elapsed * 0.012;
          beamGroup.children.forEach((beam) => {
            const material = (beam as THREE.Mesh).material as THREE.MeshBasicMaterial;
            material.opacity = 0.1 + Math.sin(elapsed * beam.userData.speed + beam.userData.phase) * 0.06 + 0.09;
          });
          networkGroup.children.forEach((child) => {
            if (child instanceof THREE.Mesh) {
              const material = child.material as THREE.MeshBasicMaterial;
              material.opacity = 0.62 + Math.sin(elapsed * 1.3 + child.userData.phase) * 0.28;
              child.scale.setScalar(1 + Math.sin(elapsed * 1.2 + child.userData.phase) * 0.12);
            }
          });
        }

        renderer.render(scene, camera);
        frame = window.requestAnimationFrame(animate);
      };

      animate();
    } catch (e) {
      console.warn('WebGL / CosmicScene initialization skipped or failed safely:', e);
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (resizeObserver) resizeObserver.disconnect();
      if (onPointerMove) host.removeEventListener('pointermove', onPointerMove);
      if (renderer && renderer.domElement && host.contains(renderer.domElement)) {
        host.removeChild(renderer.domElement);
      }
      if (starGeometry) starGeometry.dispose();
      if (root) {
        root.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
      if (renderer) renderer.dispose();
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0 pointer-events-none" aria-hidden />;
}
