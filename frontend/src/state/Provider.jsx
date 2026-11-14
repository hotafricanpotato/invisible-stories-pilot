import questions from "../content/initialQuiz.json";
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
  const initialScore = state.quiz.completed
    ? questions.reduce(
        (score, q, i) => score + Number(state.quiz.answers[i] === q.correct),
        0,
      )
    : null;
  return (
    <Context.Provider
      value={{ state, dispatch, storageAvailable, initialScore }}
    >
      {children}
    </Context.Provider>
  );
}
export const useExhibition = () => useContext(Context);
