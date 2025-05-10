import { useMemo, useRef, useState } from "react";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import ParticlesSphere from "./ParticlesSphere";
import {
  BRIDGE_GROW_DURATION,
  BRIDGE_PARTICLES_COUNT,
  BRIDGE_PARTICLES_SPEED,
  BRIDGE_WIDTH,
  EASING_MULTIPPLIER,
  INNER_SPHERE_PARTICLES_COUNT,
  INNER_SPHERE_RADIUS,
  MAX_PARTICLE_SIZE,
  MIN_BRIDGE_LENGTH,
  MIN_PARTICLE_SIZE,
} from "../constants";

type ParticleBridgeProps = {
  color?: string;
  from?: [number, number, number];
  to?: [number, number, number];
};

const WIDTH_START = 1.5;
const WIDTH_MIDDLE = 0.5;
const WIDTH_END = 0.3;

const initialSceneSetup = (count = BRIDGE_PARTICLES_COUNT) => {
  const alphas = new Float32Array(count);
  const offsets = new Float32Array(count);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const offsetsVecs = [];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    alphas[i] = 0;
    offsetsVecs.push(new THREE.Vector3((Math.random() - 0.5) * BRIDGE_WIDTH, (Math.random() - 0.5) * BRIDGE_WIDTH, 0));
    offsets[i] = Math.random();
    positions[i3] = 0;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = 0;
    sizes[i] = MIN_PARTICLE_SIZE + Math.random() * MAX_PARTICLE_SIZE;
  }
  return { alphas, offsets, offsetsVecs, positions, sizes };
};

const ParticleBridge = ({ color = "white", from = [0, 0, 0], to = [0, 0, 0] }: ParticleBridgeProps) => {
  const pointsRef = useRef<THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);

  const smoothFrom = useRef(new THREE.Vector3(...from));
  const smoothTo = useRef(new THREE.Vector3(...to));

  const spawnStartRef = useRef<number | null>(null);
  const [isInvisible, setIsInvisible] = useState(true);

  const bridgeLength = Math.hypot(from[0] - to[0], from[1] - to[1]);

  const { alphas, offsets, offsetsVecs, positions, sizes } = useMemo(() => initialSceneSetup(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("alpha", new THREE.BufferAttribute(new Float32Array(alphas), 1));
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute("size", new THREE.BufferAttribute(new Float32Array(sizes), 1));
    return geo;
  }, [positions, sizes, alphas]);

  useFrame(({ clock }) => {
    const mesh = pointsRef.current;
    if (!mesh) return;

    if (spawnStartRef.current === null) {
      spawnStartRef.current = clock.getElapsedTime();
    }

    const pixelDensityScale = window.devicePixelRatio || 1;

    const alpha = mesh.geometry.attributes.alpha.array;
    const pos = mesh.geometry.attributes.position.array;
    const newSizes = mesh.geometry.attributes.size.array;

    const time = clock.getElapsedTime();
    const growFactor = Math.min(1, (time - spawnStartRef.current) / BRIDGE_GROW_DURATION);

    smoothFrom.current.lerp(new THREE.Vector3(...from), EASING_MULTIPPLIER);
    smoothTo.current.lerp(new THREE.Vector3(...to), EASING_MULTIPPLIER);

    const dir = new THREE.Vector3().subVectors(smoothTo.current, smoothFrom.current);
    const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();

    if (isInvisible && time - spawnStartRef.current > BRIDGE_GROW_DURATION) {
      setIsInvisible(false);
    }

    for (let i = 0; i < BRIDGE_PARTICLES_COUNT; i++) {
      const i3 = i * 3;
      const rawT = (time * BRIDGE_PARTICLES_SPEED + offsets[i]) % 1;
      if (rawT > growFactor) continue;
      const t = rawT;

      const base = smoothFrom.current.clone().addScaledVector(dir, t);

      const jitter = Math.sin(time * 2 + i) * 2.0;
      const offsetVec = offsetsVecs[i].clone();

      // Fade in and out alpha based on t
      let localAlpha = 1.0;
      if (t < 0.1) localAlpha = t / 0.1;
      else if (t > 0.9) localAlpha = (1.0 - t) / 0.1;
      alpha[i] = bridgeLength > MIN_BRIDGE_LENGTH ? localAlpha : 0;

      // Interpolate width with middle pinch
      let taperFactor;
      if (t < 0.5) {
        taperFactor = WIDTH_START + (WIDTH_MIDDLE - WIDTH_START) * (t / 0.5);
      } else {
        taperFactor = WIDTH_MIDDLE + (WIDTH_END - WIDTH_MIDDLE) * ((t - 0.5) / 0.5);
      }

      const wideOffset = perp
        .clone()
        .multiplyScalar(offsetVec.x * taperFactor)
        .add(new THREE.Vector3(0, 0, offsetVec.y * taperFactor));

      pos[i3 + 0] = base.x + wideOffset.x + jitter;
      pos[i3 + 1] = base.y + wideOffset.y + jitter * 0.5;
      pos[i3 + 2] = base.z + wideOffset.z;

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
        transparent: true,
        uniforms: { color: { value: new THREE.Color(color) } },
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
                float d = distance(gl_PointCoord, vec2(0.5));
                float a = (1.0 - smoothstep(0.0, 0.5, d)) * vAlpha;
                if (a < 0.05) discard;
                gl_FragColor = vec4(color, a);
            }
        `,
      }),
    [color]
  );

  return (
    <>
      <points ref={pointsRef} geometry={geometry} material={material} />;
      <ParticlesSphere
        center={to}
        color={color}
        count={INNER_SPHERE_PARTICLES_COUNT}
        invisible={isInvisible}
        radius={INNER_SPHERE_RADIUS}
      />
    </>
  );
};

export default ParticleBridge;
