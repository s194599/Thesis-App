import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import { BsArrowLeft, BsPlay } from "react-icons/bs";
import { getQuiz } from "../../../services/api";

const QuizIntro = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activityId = queryParams.get("activityId");
  const moduleId = queryParams.get("moduleId");

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizResults, setQuizResults] = useState(null);

  useEffect(() => {
    const fetchQuizAndResults = async () => {
      try {
        setLoading(true);
        // Fetch quiz data
        const quizData = await getQuiz(quizId);
        
        // Process questions to ensure compatibility with flashcards
        if (quizData && quizData.questions) {
          // Make sure all questions have the necessary properties
          quizData.questions = quizData.questions.map(question => {
            // For flashcard type questions, ensure they have an empty options array
            if (question.type === "flashcard" && !question.options) {
              return {
                ...question,
                options: [] // Add an empty options array to prevent errors
              };
            }
            return question;
          });
        }
        
        setQuiz(quizData);

        // Fetch student's previous attempts (if any)
        try {
          const studentId = "1"; // Assuming Christian Wu is the logged-in student
          const resultsResponse = await fetch(`/api/student/${studentId}/quiz/${quizId}/latest`);
          if (resultsResponse.ok) {
            const resultsData = await resultsResponse.json();
            setQuizResults(resultsData);
          }
        } catch (resultsError) {
          console.error("Error fetching quiz results:", resultsError);
          // Continue even if we can't fetch results
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError("Kunne ikke indlæse quizzen. Prøv venligst igen senere.");
        setLoading(false);
      }
    };

    fetchQuizAndResults();
  }, [quizId]);

  const handleStartQuiz = () => {
    // Navigate to the actual quiz page with the same query parameters
    navigate(`/quiz/take/${quizId}${location.search}`);
  };

  const handleBack = () => {
    // Always navigate back to the platform
    navigate("/platform");
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Indlæser quiz...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline-primary" onClick={handleBack}>
          Tilbage
        </Button>
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">
          Quizzen blev ikke fundet. Den kan være blevet slettet.
        </Alert>
        <Button variant="outline-primary" onClick={handleBack}>
          Tilbage
        </Button>
      </Container>
    );
  }

  // Format percentage for display
  const formatScore = (score, total) => {
    if (!score || !total) return "0%";
    return `${Math.round((score / total) * 100)}%`;
  };

  return (
    <Container className="py-5">
      <Button
        variant="outline-secondary"
        className="mb-4 d-flex align-items-center"
        onClick={handleBack}
      >
        <BsArrowLeft className="me-2" /> Tilbage
      </Button>

      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white py-3">
          <h3 className="mb-0">{quiz.title}</h3>
        </Card.Header>
        <Card.Body className="p-4">
          {quiz.description && (
            <div className="mb-4">
              <h5>Beskrivelse</h5>
              <p>{quiz.description}</p>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-start flex-wrap mb-4">
            <div className="mb-3 mb-md-0">
              <h5>Quiz information</h5>
              <p className="mb-2">
                <span className="fw-bold">Antal spørgsmål:</span>{" "}
                {quiz.questions ? quiz.questions.length : 0}
              </p>
              
              <p className="mb-2">
                <span className="fw-bold">Dine forsøg:</span>{" "}
                {quizResults ? `${quizResults.attempts || 1}` : "0"} / Ubegrænset
              </p>
              
              {quizResults ? (
                <p className="mb-0">
                  <span className="fw-bold">Din seneste score:</span>{" "}
                  <Badge bg="info" className="fs-6 px-2 py-1">
                    {formatScore(quizResults.score, quizResults.total_questions)}
                  </Badge>
                  <span className="ms-2 text-muted">
                    ({quizResults.score || 0} af {quizResults.total_questions || 0} korrekte)
                  </span>
                </p>
              ) : (
                <p className="mb-0">
                  <span className="fw-bold">Din seneste score:</span>{" "}
                  <Badge bg="secondary" className="fs-6 px-2 py-1">
                    Ingen tidligere forsøg
                  </Badge>
                </p>
              )}
            </div>
          </div>

          <div className="text-center mt-4">
            <Button 
              variant="success" 
              size="lg" 
              className="px-5 py-3 d-flex align-items-center mx-auto"
              onClick={handleStartQuiz}
            >
              <BsPlay size={24} className="me-2" /> Start quiz
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QuizIntro; 