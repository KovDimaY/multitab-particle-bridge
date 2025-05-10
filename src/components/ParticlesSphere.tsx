import { useMemo, useRef } from "react";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import {
  EASING_MULTIPPLIER,
  MIN_PARTICLE_SIZE,
  MAX_PARTICLE_SIZE,
  OUTER_SPHERE_PARTICLES_COUNT,
  OUTER_SPHERE_RADIUS,
} from "../constants";

type ParticlesSphereProps = {
  center?: [number, number, number];
  color?: string;
  count?: number;
  invisible?: boolean;
  radius?: number;
};

const FADE_SPEED = 0.25;

const initialSceneSetup = (count: number, radius: number) => {
  const alphas = new Float32Array(count);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    const r = radius * (1 - Math.random() / 6);
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    alphas[i] = 1;

    positions[i3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    velocities[i3 + 0] = (Math.random() - 0.5) * 0.5;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.5;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;

    sizes[i] = MIN_PARTICLE_SIZE + Math.random() * MAX_PARTICLE_SIZE;
  }

  return { positions, velocities, sizes, alphas };
};

const ParticlesSphere = ({
  center = [0, 0, 0],
  color = "white",
  count = OUTER_SPHERE_PARTICLES_COUNT,
  invisible = false,
  radius = OUTER_SPHERE_RADIUS,
}: ParticlesSphereProps) => {
  const pointsRef = useRef<THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);

  const smoothedCenter = useRef(new THREE.Vector3(...center));
  const fadeAlphaRef = useRef(invisible ? 0 : 1);

  const { alphas, positions, sizes, velocities } = useMemo(() => initialSceneSetup(count, radius), [count, radius]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("alpha", new THREE.BufferAttribute(new Float32Array(alphas), 1));
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute("size", new THREE.BufferAttribute(new Float32Array(sizes), 1));
    return geo;
  }, [alphas, positions, sizes]);

  useFrame((_, delta) => {
    const mesh = pointsRef.current;
    if (!mesh) return;

    const pixelDensityScale = window.devicePixelRatio || 1;

    // Smooth fade logic
    const fade = fadeAlphaRef.current;
    const target = invisible ? 0 : 1;
    fadeAlphaRef.current += (target - fade) * delta * FADE_SPEED;
    fadeAlphaRef.current = Math.max(0, Math.min(1, fadeAlphaRef.current));

    // Smooth center logic
    smoothedCenter.current.lerp(new THREE.Vector3(...center), EASING_MULTIPPLIER);
    mesh.position.set(...smoothedCenter.current.toArray());

    const alpha = mesh.geometry.attributes.alpha.array;
    const pos = mesh.geometry.attributes.position.array;
    const newSizes = mesh.geometry.attributes.size.array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      pos[i3 + 0] += velocities[i3 + 0];
      pos[i3 + 1] += velocities[i3 + 1];
      pos[i3 + 2] += velocities[i3 + 2];

      const dx = pos[i3 + 0];
      const dy = pos[i3 + 1];
      const dz = pos[i3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > radius) {
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;
        const vDotN = velocities[i3 + 0] * nx + velocities[i3 + 1] * ny + velocities[i3 + 2] * nz;

        velocities[i3 + 0] -= 2 * vDotN * nx;
        velocities[i3 + 1] -= 2 * vDotN * ny;
        velocities[i3 + 2] -= 2 * vDotN * nz;

        pos[i3 + 0] = nx * radius * 0.999;
        pos[i3 + 1] = ny * radius * 0.999;
        pos[i3 + 2] = nz * radius * 0.999;
      }

      alpha[i] = fadeAlphaRef.current;
      newSizes[i] = sizes[i] * pixelDensityScale;
    }

    mesh.geometry.attributes.alpha.needsUpdate = true;
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.attributes.size.needsUpdate = true;
  });

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        transparent: true,
        uniforms: {
          color: { value: new THREE.Color(color) },
        },
        vertexShader: `
        attribute float size;
        attribute float alpha;
        varying float vAlpha;
  
        void main() {
            vAlpha = alpha;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size;
            gl_Position = projectionMatrix * mvPosition;
        }
      `,
        fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;

        void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vAlpha;
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(color, alpha);
        }
      `,
      }),
    [color]
  );

  return <points ref={pointsRef} geometry={geometry} material={material} position={center} />;
};

export default ParticlesSphere;
