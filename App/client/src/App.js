import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./styles/PlatformOverview.css";
import { Header, CourseSelection, TopBar } from "./components/layout";
import { SavedQuizzes } from "./components/quiz/management";
import { TakeQuiz, QuizIntro } from "./components/quiz/taking";
import { QuizForm, QuizCreationChoice, ManualQuizCreation } from "./components/quiz/creation";
import { PlatformOverview } from "./components/learning-platform";
import { useQuizContext } from "./context/QuizContext";
import { QuizOutput } from "./components/quiz/display";
import { Container, Alert, Button, Spinner } from "react-bootstrap";
import { getQuiz } from "./services/api";
import QuizResults from './components/quiz/results/QuizResults';
import ModuleOverview from './components/learning-platform/ModuleOverview';

function App() {
  const { generatedQuiz } = useQuizContext();

  return (
    <div className="App d-flex flex-column min-vh-100">
      <Routes>
        {/* Change root to course selection */}
        <Route path="/" element={<CourseSelection />} />

        {/* Platform Overview - Main Learning Platform */}
        <Route path="/platform" element={
          <>
            <TopBar />
            <PlatformOverview />
          </>
        } />

        {/* Module Overview Route */}
        <Route path="/module/:moduleId/overview" element={
          <>
            <TopBar />
            <div className="flex-grow-1">
              <ModuleOverview />
            </div>
          </>
        } />

        {/* Quiz Routes */}
        <Route
          path="/quiz/choice"
          element={
            <>
              <TopBar />
              <div className="flex-grow-1">
                <QuizCreationChoice />
              </div>
            </>
          }
        />

        <Route
          path="/quiz/create"
          element={
            <>
              <TopBar />
              <div className="flex-grow-1">
                <QuizForm />
              </div>
            </>
          }
        />

        <Route
          path="/quiz/manual-create"
          element={
            <>
              <TopBar />
              <div className="flex-grow-1">
                <ManualQuizCreation />
              </div>
            </>
          }
        />

        {/* Alias for backwards compatibility */}
        <Route
          path="/create-quiz"
          element={<Navigate to="/quiz/choice" replace />}
        />

        <Route
          path="/saved-quizzes"
          element={
            <>
              <TopBar />
              <div className="flex-grow-1">
                <SavedQuizzes />
              </div>
            </>
          }
        />

        <Route
          path="/quiz/intro/:quizId"
          element={
            <>
              <TopBar />
              <div className="flex-grow-1">
                <QuizIntro />
              </div>
            </>
          }
        />

        <Route
          path="/quiz/take/:quizId"
          element={
            <>
              <TopBar />
              <div className="flex-grow-1">
                <TakeQuiz />
              </div>
            </>
          }
        />

        {/* Route for quiz preview */}
        <Route
          path="/quiz/preview/:quizId"
          element={
            <>
              <TopBar />
              <div className="flex-grow-1">
                <QuizPreviewComponent />
              </div>
            </>
          }
        />

        {/* Alias for backwards compatibility */}
        <Route
          path="/take-quiz/:quizId"
          element={<Navigate to={location => `/quiz/intro/${location.pathname.split('/').pop()}${location.search}`} replace />}
        />

        <Route path="/quiz/:quizId/results" element={
          <>
            <TopBar />
            <div className="flex-grow-1">
              <QuizResults />
            </div>
          </>
        } />
      </Routes>
    </div>
  );
}

// Quiz Preview component to display and manage quizzes for teachers
const QuizPreviewComponent = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);
  const { setGeneratedQuiz } = useQuizContext();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const data = await getQuiz(quizId);
        // Ensure the quiz has a title if it's undefined or empty
        if (!data.title || data.title.trim() === '') {
          data.title = "Flashcard Quiz"; // Default title if none exists
        }
        setQuiz(data);
        setGeneratedQuiz(data); // Set the quiz in context for the QuizOutput component
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError("Failed to load quiz. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, setGeneratedQuiz]);

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p>Loading quiz...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-primary" onClick={() => navigate("/platform")}>
            Back to Platform
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <Alert.Heading>Quiz Not Found</Alert.Heading>
          <p>The quiz you're looking for does not exist or has been deleted.</p>
          <Button variant="outline-primary" onClick={() => navigate("/platform")}>
            Back to Platform
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quiz Preview</h2>
        <Button variant="outline-primary" onClick={() => navigate("/platform")}>
          Back to Platform
        </Button>
      </div>
      <QuizOutput />
    </Container>
  );
};

export default App;
