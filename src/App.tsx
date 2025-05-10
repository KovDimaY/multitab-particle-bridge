import { Canvas } from "@react-three/fiber";

import { useCallback, useEffect, useState } from "react";

import type { LocalStorageWindowsStore } from "./types";

import GlowingEffect from "./components/GlowingEffect";
import PixelCamera from "./components/PixelCamera";
import ParticlesSphere from "./components/ParticlesSphere";
import ParticlesBridge from "./components/ParticlesBridge";

import { tryToInitialize } from "./helpers/sceneInitHelpers";
import { getAllBridgesBetweenSpheres, getSphereModelsFromWindows } from "./helpers/utils";
import { OUTER_SPHERE_RADIUS } from "./constants";

const App = () => {
  const [isCameraReady, setIsCameraReady] = useState(false);

  const [windowId] = useState(crypto.randomUUID());
  const [windows, setWindows] = useState<LocalStorageWindowsStore | null>(null);

  useEffect(() => {
    const cleanupFunctions: Function[] = [];

    tryToInitialize(windowId, setWindows, cleanupFunctions);

    const handleVisibilityChange = () => {
      tryToInitialize(windowId, setWindows, cleanupFunctions);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [windowId]);

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  if (!windows || !windows[windowId]) {
    return <></>;
  }

  const spheres = getSphereModelsFromWindows(windows, windowId);
  const bridges = getAllBridgesBetweenSpheres(spheres);

  return (
    <Canvas
      gl={{ pixelRatio: window.devicePixelRatio }}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 100 } }}
    >
      <PixelCamera onCameraReady={handleCameraReady} />
      <GlowingEffect />

      {isCameraReady && (
        <>
          {spheres.map(({ id, center, color }) => (
            <ParticlesSphere key={id} radius={OUTER_SPHERE_RADIUS} center={center} color={color} />
          ))}
          {bridges.map(({ id, from, to, color }) => (
            <ParticlesBridge key={id} from={from} to={to} color={color} />
          ))}
        </>
      )}
    </Canvas>
  );
};

export default App;
