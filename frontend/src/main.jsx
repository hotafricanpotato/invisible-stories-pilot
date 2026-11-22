import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import { Provider, useExhibition } from "./state/Provider";
import { allowedPath } from "./state/model";
import { storyRegistry } from "./content/storyRegistry.js";
import {
  Home,
  Quiz,
  Transition,
  Selection,
  StatisticsPage,
  Completion,
} from "./pages/Exhibition";
import StoryPage from "./pages/StoryPage";
import "./styles.css";
function App() {
  const { state, dispatch, storageAvailable } = useExhibition();
  const location = useLocation();
  const nav = useNavigate();
  const main = useRef();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const cancel = useRef();
  const resetTrigger = useRef();
  const path = allowedPath(location.pathname, state);
  const storyRoute = location.pathname.match(/^\/stories\/([^/]+)\/([^/]+)$/);
  const activeStory = storyRoute && Object.hasOwn(storyRegistry, storyRoute[1])
    ? storyRegistry[storyRoute[1]] : null;
  const activeStep = activeStory?.steps.find(step => step.id === storyRoute[2]);
  // The ending and statistics keep their existing presentation.
  const storyTheme = path === location.pathname && activeStep && activeStep.kind !== "conclusion"
    ? activeStory.presentation.theme ?? activeStory.id : undefined;
  useEffect(() => {
    if (path !== location.pathname) return;
    if (location.pathname !== "/")
      dispatch({ type: "CURSOR", path: location.pathname });
    window.scrollTo(0, 0);
    main.current?.focus();
  }, [location.pathname, path, dispatch]);
  useEffect(() => {
    if (resetPending && location.pathname === "/") {
      dispatch({ type: "RESET" });
      setResetPending(false);
    }
  }, [resetPending, location.pathname, dispatch]);
  useEffect(() => {
    if (resetOpen) cancel.current?.focus();
  }, [resetOpen]);
  return (
    <div className={storyTheme ? "app-shell story-shell" : "app-shell"} data-story-theme={storyTheme}>
      <a className="skip-link" href="#main">
        К содержанию
      </a>
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark">◌</span>
          <span>
            НЕВИДИМЫЕ
            <br />
            ИСТОРИИ
          </span>
        </Link>
        <span className="edition">
          ЦИФРОВАЯ ВЫСТАВКА <span>/</span> ПИЛОТ 2026
        </span>
        <button
          className="restart"
          ref={resetTrigger}
          onClick={() => setResetOpen(true)}
        >
          Начать заново
        </button>
      </header>
      {resetOpen && (
        <div className="reset-panel" role="region" aria-label="Сброс прогресса">
          <p>
            Начать выставку заново? Ответы и прогресс в текущей вкладке будут
            удалены.
          </p>
          <div>
            <button
              ref={cancel}
              onClick={() => {
                setResetOpen(false);
                resetTrigger.current?.focus();
              }}
            >
              Отмена
            </button>
            <button
              className="primary"
              onClick={() => {
                setResetPending(true);
                setResetOpen(false);
                nav("/");
              }}
            >
              Удалить прогресс и начать
            </button>
          </div>
        </div>
      )}
      <div className="route-strip" aria-label="Маршрут выставки">
        <span
          className={location.pathname.startsWith("/quiz") ? "current" : ""}
        >
          01 · ВОСПРИЯТИЕ
        </span>
        <span
          className={location.pathname.startsWith("/stories") ? "current" : ""}
        >
          02 · ИСТОРИЯ
        </span>
        <span
          className={
            location.pathname.startsWith("/statistics") ? "current" : ""
          }
        >
          03 · КОНТЕКСТ
        </span>
      </div>
      <main
        id="main"
        ref={main}
        tabIndex="-1"
        className={storyTheme ? "story-main" : location.pathname === "/" ? "home-main" : "page-main"}
      >
        {!storageAvailable && (
          <p role="status" className="note">
            Хранилище браузера недоступно. Прогресс сохранится только до
            перезагрузки страницы.
          </p>
        )}
        {path !== location.pathname ? (
          <Navigate to={path} replace />
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quiz/complete" element={<Transition />} />
            <Route path="/quiz/:questionId" element={<Quiz />} />
            <Route path="/stories" element={<Selection />} />
            <Route path="/stories/:storyId/:stepId" element={<StoryPage />} />
            <Route path="/statistics/:screenId" element={<StatisticsPage />} />
            <Route path="/complete" element={<Completion />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      <footer>
        <span>Пилотная версия · Художественные реконструкции</span>
        <span>История Никиты и статистика · 2026</span>
      </footer>
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider>
        <App />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
);

import "./story-design.css";
