import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./styles/PlatformOverview.css";
import { Header } from "./components/layout";
import { SavedQuizzes } from "./components/quiz/management";
import { TakeQuiz } from "./components/quiz/taking";
import { QuizForm } from "./components/quiz/creation";
import { PlatformOverview } from "./components/learning-platform";
import { useQuizContext } from "./context/QuizContext";

function App() {
  const { generatedQuiz } = useQuizContext();

  return (
    <div className="App d-flex flex-column min-vh-100">
      <Routes>
        {/* Redirect root to platform */}
        <Route path="/" element={<Navigate to="/platform" replace />} />

        {/* Platform Overview - Main Learning Platform */}
        <Route path="/platform" element={<PlatformOverview />} />

        {/* Quiz Routes */}
        <Route
          path="/quiz/create"
          element={
            <>
              <Header />
              <div className="flex-grow-1">
                <QuizForm />
              </div>
            </>
          }
        />

        {/* Alias for backwards compatibility */}
        <Route
          path="/create-quiz"
          element={<Navigate to="/quiz/create" replace />}
        />

        <Route
          path="/saved-quizzes"
          element={
            <>
              <Header />
              <div className="flex-grow-1">
                <SavedQuizzes />
              </div>
            </>
          }
        />

        <Route
          path="/quiz/take/:quizId"
          element={
            <>
              <Header />
              <div className="flex-grow-1">
                <TakeQuiz />
              </div>
            </>
          }
        />

        {/* Alias for backwards compatibility */}
        <Route
          path="/take-quiz/:quizId"
          element={<Navigate to={location => `/quiz/take/${location.pathname.split('/').pop()}`} replace />}
        />
      </Routes>
    </div>
  );
}

export default App;
