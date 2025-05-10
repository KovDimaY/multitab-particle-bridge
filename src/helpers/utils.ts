import type {
  BridgeObjectModel,
  LocalStorageWindowsStore,
  Position,
  SphereObjectModel,
  WindowDimensions,
} from "../types";

export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export const getCurrentWindowDimensions = (): WindowDimensions => ({
  x: window.screenLeft,
  y: window.screenTop,
  width: window.innerWidth,
  height: window.innerHeight,
});

export const areDifferentDimensions = (a: WindowDimensions, b: WindowDimensions): boolean =>
  a.x !== b.x || a.y !== b.y || a.width !== b.width || a.height !== b.height;

export const getSphereModelsFromWindows = (
  windows: LocalStorageWindowsStore,
  currentWindowId: string
): SphereObjectModel[] => {
  const currentWindowShape = windows[currentWindowId];

  return Object.entries(windows).map(([id, { x, y, width, height, color }]) => {
    const centerX = -currentWindowShape.x + x + width / 2;
    const centerY = currentWindowShape.y - y + currentWindowShape.height - height + height / 2;
    const center: Position = [centerX, centerY, 0];

    return { center, color, id };
  });
};

export const getAllBridgesBetweenSpheres = (spheres: SphereObjectModel[]): BridgeObjectModel[] => {
  const bridges: BridgeObjectModel[] = [];

  for (let i = 0; i < spheres.length; i++) {
    for (let j = 0; j < spheres.length; j++) {
      const sphereA = spheres[i];
      const sphereB = spheres[j];

      if (i !== j) {
        bridges.push({
          id: `${sphereA.id}-${sphereB.id}`,
          color: sphereA.color,
          from: sphereA.center,
          to: sphereB.center,
        });
      }
    }
  }

  return bridges;
};
