import { useEffect, useRef, useLayoutEffect } from "react";

import * as THREE from "three";
import { OrthographicCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

const NEAR = 0.1;
const FAR = 1000;
const CAMERA_POSITION = [0, 0, 1000] as const;

type PixelCameraProps = {
  onCameraReady: Function;
};

const resizeCamera = (camera: THREE.OrthographicCamera, width: number, height: number) => {
  camera.left = 0;
  camera.right = width;
  camera.top = height;
  camera.bottom = 0;
  camera.updateProjectionMatrix();
};

const PixelCamera = ({ onCameraReady }: PixelCameraProps) => {
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

  const { size, set } = useThree();

  // Only on mount: set up camera as default
  useLayoutEffect(() => {
    if (!cameraRef.current) return;

    set({ camera: cameraRef.current });
    onCameraReady();
  }, [onCameraReady, set]);

  // Update projection matrix on every resize
  useEffect(() => {
    if (cameraRef.current) {
      resizeCamera(cameraRef.current, size.width, size.height);
    }
  }, [size.width, size.height]);

  return (
    <OrthographicCamera
      ref={cameraRef}
      name="PixelCamera"
      makeDefault
      manual
      near={NEAR}
      far={FAR}
      position={CAMERA_POSITION}
    />
  );
};

export default PixelCamera;
