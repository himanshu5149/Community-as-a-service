import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ParticleBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const count = 20000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const sprite = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/disc.png');

    const material = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      map: sprite,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // --- API Mock for Particle Logic ---
    const target = new THREE.Vector3();
    const color = new THREE.Color();
    
    // Controls (simulated for the prompt's logic)
    const controls: Record<string, number> = {
      expansion: 1.0,
      complexity: 0.5,
      hueOffset: 0.0,
    };

    // --- Particle Logic (Based on the prompt) ---
    // This is the "emotion connection" swarm
    const updateParticle = (i: number, time: number) => {
      const p = i / count;
      
      // Heart Shape Logic
      const theta = p * Math.PI * 2 * 100 + time * 0.1;
      const phi = Math.acos(2 * (i / count) - 1);
      
      // Base heart parametric equation (modified for 3D swarm)
      const t = p * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      
      const wave = Math.sin(time * 2 + p * 10) * 2;
      const radius = 25 + wave;
      
      // Add complexity with some Lorenz-like chaos
      const freq = 0.5 + Math.sin(time * 0.2) * 0.2;
      const xOffset = Math.sin(phi * 10 + time) * 10;
      const yOffset = Math.cos(theta * 2 + time) * 10;
      const zOffset = Math.sin(p * 50 + time) * 30;

      // Final positioning inspired by a "breathing connection"
      const scale = 25 * (1 + 0.1 * Math.sin(time * 1.5));
      target.set(
        x * scale + xOffset,
        y * scale + yOffset,
        zOffset + (Math.sin(time + p * 20) * 50)
      );

      // Emotional Color Palette (Pinks, Purples, Blues)
      const hue = (0.8 + Math.sin(time * 0.1 + p * 5) * 0.2) % 1;
      const sat = 0.8;
      const light = 0.6 + Math.sin(time + p * 10) * 0.2;
      color.setHSL(hue, sat, light);

      positions[i * 3] = target.x;
      positions[i * 3 + 1] = target.y;
      positions[i * 3 + 2] = target.z;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    };

    // --- Animation ---
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      for (let i = 0; i < count; i++) {
        updateParticle(i, time);
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      particles.rotation.y += 0.002;
      particles.rotation.z += 0.001;

      renderer.render(scene, camera);
    };

    animate();

    // --- Resize ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      id="caas-particle-background"
      className="fixed inset-0 -z-10 bg-[#050505] overflow-hidden pointer-events-none"
    />
  );
};
