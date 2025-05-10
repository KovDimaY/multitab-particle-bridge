export type WindowItemInfo = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

export type LocalStorageWindowsStore = Record<string, WindowItemInfo>;

export type WindowDimensions = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Position = [number, number, number];

export type BridgeObjectModel = {
  color: string;
  from: Position;
  id: string;
  to: Position;
};

export type SphereObjectModel = {
  center: Position;
  color: string;
  id: string;
};
