import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from "react";
import { reducer } from "./model";
import { loadProgress, saveProgress, resetProgress, RESET_KEY } from "./persistence";
const Context = createContext(null);
const hydrate = (s, a) => a.type === "PERSISTENCE_RESTORE" ? a.state : reducer(s, a);
export function Provider({ children }) {
  const [bootstrap] = useState(() => loadProgress());
  const [state, rawDispatch] = useReducer(hydrate, bootstrap.state);
  const epoch = useRef(bootstrap.epoch);
  const [storageAvailable, setStorageAvailable] = useState(bootstrap.available);
  const dispatch = useCallback(action => {
    if (action.type === "RESET") {
      const fresh = resetProgress();
      epoch.current = fresh.epoch;
      setStorageAvailable(fresh.available);
      rawDispatch({ type: "PERSISTENCE_RESTORE", state: fresh.state });
    } else rawDispatch(action);
  }, []);
  useEffect(() => {
    const result = saveProgress(state, epoch.current);
    setStorageAvailable(result.available);
    if (result.conflict) {
      epoch.current = result.epoch;
      rawDispatch({ type: "PERSISTENCE_RESTORE", state: result.state });
    }
  }, [state]);
  useEffect(() => {
    const onStorage = event => {
      if (event.key !== RESET_KEY) return;
      const fresh = loadProgress();
      epoch.current = fresh.epoch;
      setStorageAvailable(fresh.available);
      rawDispatch({ type: "PERSISTENCE_RESTORE", state: fresh.state });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return <Context.Provider value={{ state, dispatch, storageAvailable }}>{children}</Context.Provider>;
}
export const useExhibition = () => useContext(Context);
