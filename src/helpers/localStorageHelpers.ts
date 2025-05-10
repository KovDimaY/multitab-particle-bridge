import type { WindowDimensions, LocalStorageWindowsStore } from "../types";

import { COLORS } from "../constants";

export const WINDOWS = "windows";
export const COUNTER = "counter";

const onErrorFallbackEmptyStore = (): LocalStorageWindowsStore => {
  localStorage.setItem(WINDOWS, JSON.stringify({}));
  return {};
};

const getAllWindows = (): LocalStorageWindowsStore => {
  const stringWindows = localStorage.getItem(WINDOWS);

  return getAllWindowsFromString(stringWindows);
};

export const getAllWindowsFromString = (localStorageValue: string | null): LocalStorageWindowsStore => {
  if (!localStorageValue) {
    return {};
  }

  try {
    const parsedWindows: LocalStorageWindowsStore = JSON.parse(localStorageValue);
    return parsedWindows;
  } catch (error) {
    console.error("Error parsing localstorage key", WINDOWS, error);
    return onErrorFallbackEmptyStore();
  }
};

export const addNewWindow = (id: string): LocalStorageWindowsStore => {
  const shapePositions: WindowDimensions = {
    x: window.screenLeft,
    y: window.screenTop,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const stringWindows = localStorage.getItem(WINDOWS);
  const stringCounter = localStorage.getItem(COUNTER);
  const numberCounter = Number(stringCounter);
  const newCounter = isNaN(numberCounter) ? 1 : numberCounter + 1;
  localStorage.setItem(COUNTER, JSON.stringify(newCounter));

  const onErrorFallback = () => {
    const createdWindows: LocalStorageWindowsStore = { [id]: { ...shapePositions, color: COLORS[0] } };
    localStorage.setItem(WINDOWS, JSON.stringify(createdWindows));
    return createdWindows;
  };

  if (!stringWindows) {
    return onErrorFallback();
  }

  try {
    const parsedWindows: LocalStorageWindowsStore = JSON.parse(stringWindows);
    parsedWindows[id] = { ...shapePositions, color: COLORS[Number(stringCounter) % COLORS.length] };
    localStorage.setItem(WINDOWS, JSON.stringify(parsedWindows));
    return parsedWindows;
  } catch (error) {
    console.error("Error parsing localstorage key:", { key: WINDOWS, failedString: stringWindows }, error);
    return onErrorFallback();
  }
};

export const deleteCurrentWindow = (id: string): LocalStorageWindowsStore => {
  const stringWindows = localStorage.getItem(WINDOWS);

  if (!stringWindows) {
    return onErrorFallbackEmptyStore();
  }

  try {
    const parsedWindows: LocalStorageWindowsStore = JSON.parse(stringWindows);
    delete parsedWindows[id];
    localStorage.setItem(WINDOWS, JSON.stringify(parsedWindows));
    return parsedWindows;
  } catch (error) {
    console.error("Error parsing localstorage key:", { key: WINDOWS, failedString: stringWindows }, error);
    return onErrorFallbackEmptyStore();
  }
};

export const updateCurrentWindowPositions = (id: string, newDimensions: WindowDimensions): LocalStorageWindowsStore => {
  const stringWindows = localStorage.getItem(WINDOWS);

  if (!stringWindows) {
    return onErrorFallbackEmptyStore();
  }

  try {
    const parsedWindows: LocalStorageWindowsStore = JSON.parse(stringWindows);
    parsedWindows[id] = { ...parsedWindows[id], ...newDimensions };
    localStorage.setItem(WINDOWS, JSON.stringify(parsedWindows));
    return parsedWindows;
  } catch (error) {
    console.error("Error parsing localstorage key:", { key: WINDOWS, failedString: stringWindows }, error);
    return onErrorFallbackEmptyStore();
  }
};

export const cleanupDeadWindows = (aliveIds: Set<string>): LocalStorageWindowsStore => {
  const allWindows = getAllWindows();

  for (const id in allWindows) {
    if (!aliveIds.has(id)) {
      delete allWindows[id];
    }
  }

  localStorage.setItem(WINDOWS, JSON.stringify(allWindows));
  return allWindows;
};
