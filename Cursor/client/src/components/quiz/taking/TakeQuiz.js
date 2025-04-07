import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Button,
  ProgressBar,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import {
  BsArrowLeft,
  BsArrowRight,
  BsCheckCircleFill,
  BsXCircleFill,
  BsTrophyFill,
  BsHouseDoor,
} from "react-icons/bs";
import { getQuiz } from "../../../services/api";
import confetti from "canvas-confetti";

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [activityId, setActivityId] = useState(null);
  const [moduleId, setModuleId] = useState(null);
  const [alreadyMarkedComplete, setAlreadyMarkedComplete] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const data = await getQuiz(quizId);
        setQuiz(data);
        // Initialize answers array with nulls for each question
        setAnswers(new Array(data.questions.length).fill(null));
        
        // Get activity and module info from URL search params to mark as completed later
        const urlParams = new URLSearchParams(window.location.search);
        const actId = urlParams.get('activityId');
        const modId = urlParams.get('moduleId');
        
        if (actId) setActivityId(actId);
        if (modId) setModuleId(modId);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError("Failed to load quiz. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    // Mark activity as completed when quiz is finished
    const markActivityCompleted = async () => {
      if (quizCompleted && activityId && moduleId && !alreadyMarkedComplete) {
        try {
          const response = await fetch('/api/complete-activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              activityId: activityId,
              moduleId: moduleId,
              quizScore: Math.round((score / quiz.questions.length) * 100)
            }),
          });
          
          if (response.ok) {
            setAlreadyMarkedComplete(true);
          }
        } catch (error) {
          console.error('Error marking quiz as completed:', error);
        }
      }
    };
    
    markActivityCompleted();
  }, [quizCompleted, activityId, moduleId, alreadyMarkedComplete, score, quiz]);

  const handleAnswerSelect = (answer) => {
    if (showAnswer) return; // Prevent changing answer after submission
    setSelectedAnswer(answer);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return; // Require an answer to be selected

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    // Update answers array with current selection
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);

    // Update score if answer is correct
    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < quiz.questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      setQuizCompleted(true);
      // Trigger confetti for successful quiz completion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const getAnswerButtonVariant = (option) => {
    if (!showAnswer) {
      return selectedAnswer === option ? "primary" : "outline-secondary";
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];

    if (option === currentQuestion.correctAnswer) {
      return "success";
    }

    if (option === selectedAnswer && option !== currentQuestion.correctAnswer) {
      return "danger";
    }

    return "outline-secondary";
  };

  const renderQuestion = () => {
    const question = quiz.questions[currentQuestionIndex];

    return (
      <Card className="shadow quiz-question-card">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </h5>
            <Badge bg="light" text="dark">
              Score: {score}/{currentQuestionIndex + (showAnswer ? 1 : 0)}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <Card.Title className="mb-4">{question.question}</Card.Title>

          <div className="d-grid gap-2 mb-4">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant={getAnswerButtonVariant(option)}
                className="text-start py-3 position-relative"
                onClick={() => handleAnswerSelect(option)}
                disabled={showAnswer}
              >
                {showAnswer && option === question.correctAnswer && (
                  <BsCheckCircleFill
                    className="position-absolute top-50 end-0 translate-middle-y me-3 text-success"
                    size={20}
                  />
                )}
                {showAnswer &&
                  option === selectedAnswer &&
                  option !== question.correctAnswer && (
                    <BsXCircleFill
                      className="position-absolute top-50 end-0 translate-middle-y me-3 text-danger"
                      size={20}
                    />
                  )}
                {option}
              </Button>
            ))}
          </div>

          {!showAnswer ? (
            <Button
              variant="primary"
              size="lg"
              className="w-100"
              onClick={handleCheckAnswer}
              disabled={!selectedAnswer}
            >
              Check Answer
            </Button>
          ) : (
            <div>
              {question.explanation && (
                <Alert variant="info" className="mb-3">
                  <strong>Explanation:</strong> {question.explanation}
                </Alert>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-100"
                onClick={handleNextQuestion}
              >
                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <>
                    Next Question <BsArrowRight className="ms-2" />
                  </>
                ) : (
                  <>
                    Finish Quiz <BsTrophyFill className="ms-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  const renderResults = () => {
    const percentage = Math.round((score / quiz.questions.length) * 100);

    let resultMessage = "Try again!";
    let resultVariant = "danger";

    if (percentage >= 80) {
      resultMessage = "Excellent job!";
      resultVariant = "success";
    } else if (percentage >= 60) {
      resultMessage = "Good work!";
      resultVariant = "primary";
    } else if (percentage >= 40) {
      resultMessage = "Nice effort!";
      resultVariant = "info";
    } else if (percentage >= 20) {
      resultMessage = "Keep practicing!";
      resultVariant = "warning";
    }

    return (
      <Card className="shadow quiz-results-card">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Quiz Results</h4>
        </Card.Header>
        <Card.Body className="text-center">
          <div className="display-1 mb-3">
            <BsTrophyFill className="text-warning" />
          </div>

          <h2 className="mb-3">
            You scored {score} out of {quiz.questions.length}
          </h2>

          <ProgressBar
            variant={resultVariant}
            now={percentage}
            label={`${percentage}%`}
            className="mb-4"
            style={{ height: "2rem" }}
          />

          <Alert variant={resultVariant} className="mb-4">
            <h4>{resultMessage}</h4>
          </Alert>

          <div className="d-grid gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setCurrentQuestionIndex(0);
                setSelectedAnswer(null);
                setShowAnswer(false);
                setQuizCompleted(false);
                setScore(0);
                setAnswers(new Array(quiz.questions.length).fill(null));
              }}
            >
              Try Again
            </Button>

            <Button
              variant="outline-secondary"
              size="lg"
              onClick={() => navigate("/platform")}
            >
              <BsArrowLeft className="me-2" />
              Back to Learning Platform
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h5>Loading quiz...</h5>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-danger"
              onClick={() => navigate("/platform")}
            >
              Back to Learning Platform
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <Alert.Heading>Quiz Not Found</Alert.Heading>
          <p>The quiz you're looking for could not be found.</p>
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-warning"
              onClick={() => navigate("/platform")}
            >
              Back to Learning Platform
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      {/* Quiz Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button 
            variant="link" 
            className="text-decoration-none ps-0"
            onClick={() => navigate("/platform")}
          >
            <BsArrowLeft className="me-2" /> Back to Learning Platform
          </Button>
          {!quizCompleted && (
            <Badge bg="primary" className="fs-6 px-3 py-2">
              {currentQuestionIndex + 1} / {quiz.questions.length}
            </Badge>
          )}
        </div>

        <h1 className="mb-2">{quiz.title || "Untitled Quiz"}</h1>
        {quiz.description && <p className="text-muted">{quiz.description}</p>}

        {!quizCompleted && (
          <ProgressBar
            variant="primary"
            now={(currentQuestionIndex / quiz.questions.length) * 100}
            className="mb-4"
          />
        )}
      </div>

      {/* Quiz Content */}
      <div className="quiz-content">
        {quizCompleted ? renderResults() : renderQuestion()}
      </div>
    </Container>
  );
};

export default TakeQuiz;
