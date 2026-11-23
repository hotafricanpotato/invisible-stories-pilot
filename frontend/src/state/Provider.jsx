import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { initialState, reducer, restore, STORAGE_KEY } from "./model";
const Context = createContext(null);
export function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    try {
      return restore(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      return initialState();
    }
  });
  const [storageAvailable, setStorageAvailable] = useState(true);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStorageAvailable(false);
    }
  }, [state]);
  return (
    <Context.Provider
      value={{ state, dispatch, storageAvailable }}
    >
      {children}
    </Context.Provider>
  );
}
export const useExhibition = () => useContext(Context);
