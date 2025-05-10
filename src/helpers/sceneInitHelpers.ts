import {
  WINDOWS as LOCAL_STORAGE_WINDOW_KEY,
  addNewWindow,
  cleanupDeadWindows,
  deleteCurrentWindow,
  getAllWindowsFromString,
  updateCurrentWindowPositions,
} from "./localStorageHelpers";
import { areDifferentDimensions, debounce, getCurrentWindowDimensions } from "./utils";
import { DEBOUNCE_INTERVAL_MS, DELAY_FOR_DEAD_WINDOWS_MS, UPDATE_INTERVAL_MS } from "../constants";

let isInitialized = false;

const createCurrentWindowDimensionsUpdater = (windowId: string, setWindows: Function, cleanupFunctions: Function[]) => {
  let lastDimensions = getCurrentWindowDimensions();

  const handleWindowUpdate = () => {
    const newDimensions = getCurrentWindowDimensions();

    if (areDifferentDimensions(lastDimensions, newDimensions)) {
      const updatedWindows = updateCurrentWindowPositions(windowId, newDimensions);
      setWindows(updatedWindows);
      lastDimensions = newDimensions;
    }
  };

  const interval = setInterval(handleWindowUpdate, UPDATE_INTERVAL_MS);

  cleanupFunctions.push(() => clearInterval(interval));
};

const createLocalStorageUpdater = (setWindows: Function, cleanupFunctions: Function[]) => {
  const handleStorageChange = debounce((event: StorageEvent) => {
    if (event.key === LOCAL_STORAGE_WINDOW_KEY && event.newValue) {
      setWindows(getAllWindowsFromString(event.newValue));
    }
  }, DEBOUNCE_INTERVAL_MS);

  window.addEventListener("storage", handleStorageChange);

  cleanupFunctions.push(() => {
    window.removeEventListener("storage", handleStorageChange);
  });
};

const createDeadWindowsCleaner = (windowId: string, setWindows: Function, cleanupFunctions: Function[]) => {
  const channel = new BroadcastChannel("window-sync");
  const ALIVE_WINDOWS = new Set([windowId]);

  channel.postMessage({ type: "ping", id: windowId });

  channel.onmessage = ({ data: { type, id } }) => {
    if (type === "ping" && id !== windowId) {
      channel.postMessage({ type: "pong", id: windowId });
    } else if (type === "pong") {
      ALIVE_WINDOWS.add(id);
    }
  };

  setTimeout(() => {
    const cleanedWindows = cleanupDeadWindows(ALIVE_WINDOWS);
    setWindows(cleanedWindows);
  }, DELAY_FOR_DEAD_WINDOWS_MS);

  cleanupFunctions.push(() => {
    channel.close();
  });
};

const createBeforeUnloadListener = (windowId: string, cleanupFunctions: Function[]) => {
  const handleBeforeUnload = () => deleteCurrentWindow(windowId);

  window.addEventListener("beforeunload", handleBeforeUnload);

  cleanupFunctions.push(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  });
};

export const tryToInitialize = (windowId: string, setWindows: Function, cleanupFunctions: Function[]): void => {
  if (isInitialized || document.visibilityState !== "visible") return;

  // Add the new window to the local storage and set the initial state
  const allWindows = addNewWindow(windowId);
  setWindows(allWindows);

  // Constantly check the current window dimensions and update it if changes
  createCurrentWindowDimensionsUpdater(windowId, setWindows, cleanupFunctions);

  // Listen to local storage changes and update the state accordingly
  createLocalStorageUpdater(setWindows, cleanupFunctions);

  // Ping all the windows that we have in the local storage to check if they are alive
  // and delete all the windows from local storage that did not respond to the ping
  createDeadWindowsCleaner(windowId, setWindows, cleanupFunctions);

  // Listen to beforeunload event to remove the window from local storage
  createBeforeUnloadListener(windowId, cleanupFunctions);

  isInitialized = true;
};
