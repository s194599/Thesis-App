import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./styles/PlatformOverview.css";
import { Header, Footer, LandingPage } from "./components/layout";
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
        {/* Platform Overview - New Learning Platform */}
        <Route path="/platform" element={<PlatformOverview />} />

        {/* Original Quiz Generator Routes */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <div className="flex-grow-1">
                <LandingPage />
              </div>
              <Footer />
            </>
          }
        />

        <Route
          path="/saved-quizzes"
          element={
            <>
              <Header />
              <div className="flex-grow-1">
                <SavedQuizzes />
              </div>
              <Footer />
            </>
          }
        />

        <Route
          path="/take-quiz/:quizId"
          element={
            <>
              <Header />
              <div className="flex-grow-1">
                <TakeQuiz />
              </div>
              <Footer />
            </>
          }
        />

        <Route
          path="/create-quiz"
          element={
            <>
              <Header />
              <div className="flex-grow-1">
                <div className="container mt-4">
                  <div className="row justify-content-center">
                    <div className="col-lg-8">
                      <div className="card shadow">
                        <div className="card-body">
                          {!generatedQuiz && (
                            <h1 className="text-center mb-4 editable-title">
                              Create Quiz
                            </h1>
                          )}
                          <QuizForm />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Footer />
            </>
          }
        />

        {/* Redirect any unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
