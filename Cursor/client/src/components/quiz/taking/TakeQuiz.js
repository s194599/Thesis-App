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

// Helper function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

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
  const [randomizedQuestions, setRandomizedQuestions] = useState([]);
  const [randomizedOptions, setRandomizedOptions] = useState([]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const data = await getQuiz(quizId);

        // Create a deep copy of questions to avoid mutating the original data
        const questionsWithIndex = data.questions.map((q, index) => ({
          ...q,
          originalIndex: index, // Store original index for tracking correct answers
        }));

        // Randomize questions
        const shuffledQuestions = shuffleArray(questionsWithIndex);
        setRandomizedQuestions(shuffledQuestions);

        // Randomize options for each question and store in state
        const shuffledOptions = shuffledQuestions.map((question) => {
          const options = [...question.options];
          return {
            questionIndex: question.originalIndex,
            options: shuffleArray(options),
          };
        });
        setRandomizedOptions(shuffledOptions);

        setQuiz(data);
        // Initialize answers array with nulls for each question
        setAnswers(new Array(data.questions.length).fill(null));

        // Get activity and module info from URL search params to mark as completed later
        const urlParams = new URLSearchParams(window.location.search);
        const actId = urlParams.get("activityId");
        const modId = urlParams.get("moduleId");

        if (actId) setActivityId(actId);
        if (modId) setModuleId(modId);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError("Kunne ikke indlæse quizzen. Prøv venligst igen senere.");
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
          const response = await fetch("/api/complete-activity", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              activityId: activityId,
              moduleId: moduleId,
              quizScore: Math.round((score / randomizedQuestions.length) * 100),
            }),
          });

          if (response.ok) {
            setAlreadyMarkedComplete(true);
          }
        } catch (error) {
          console.error("Error marking quiz as completed:", error);
        }
      }
    };

    markActivityCompleted();
  }, [
    quizCompleted,
    activityId,
    moduleId,
    alreadyMarkedComplete,
    score,
    randomizedQuestions,
  ]);

  const handleAnswerSelect = (answer) => {
    if (showAnswer) return; // Prevent changing answer after submission
    setSelectedAnswer(answer);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return; // Require an answer to be selected

    const currentQuestion = randomizedQuestions[currentQuestionIndex];
    const originalQuestionData = quiz.questions[currentQuestion.originalIndex];
    const isCorrect = selectedAnswer === originalQuestionData.correctAnswer;

    // Update answers array with current selection
    const newAnswers = [...answers];
    newAnswers[currentQuestion.originalIndex] = selectedAnswer;
    setAnswers(newAnswers);

    // Update score if answer is correct
    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < randomizedQuestions.length) {
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

    const currentQuestion = randomizedQuestions[currentQuestionIndex];
    const originalQuestionData = quiz.questions[currentQuestion.originalIndex];

    if (option === originalQuestionData.correctAnswer) {
      return "success";
    }

    if (
      option === selectedAnswer &&
      option !== originalQuestionData.correctAnswer
    ) {
      return "danger";
    }

    return "outline-secondary";
  };

  const renderQuestion = () => {
    if (!randomizedQuestions.length) return null;

    const currentQuestion = randomizedQuestions[currentQuestionIndex];
    const currentOptions = randomizedOptions[currentQuestionIndex].options;

    return (
      <Card className="shadow quiz-question-card">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              Spørgsmål {currentQuestionIndex + 1} af{" "}
              {randomizedQuestions.length}
            </h5>
            <Badge bg="light" text="dark">
              Point: {score}/{currentQuestionIndex + (showAnswer ? 1 : 0)}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <Card.Title className="mb-4">{currentQuestion.question}</Card.Title>

          <div className="d-grid gap-2 mb-4">
            {currentOptions.map((option, index) => (
              <Button
                key={index}
                variant={getAnswerButtonVariant(option)}
                className="text-start py-3 position-relative"
                onClick={() => handleAnswerSelect(option)}
                disabled={showAnswer}
              >
                {showAnswer &&
                  option ===
                    quiz.questions[currentQuestion.originalIndex]
                      .correctAnswer && (
                    <BsCheckCircleFill
                      className="position-absolute top-50 end-0 translate-middle-y me-3 text-success"
                      size={20}
                    />
                  )}
                {showAnswer &&
                  option === selectedAnswer &&
                  option !==
                    quiz.questions[currentQuestion.originalIndex]
                      .correctAnswer && (
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
              Tjek Svar
            </Button>
          ) : (
            <div>
              {currentQuestion.explanation && (
                <Alert variant="info" className="mb-3">
                  <strong>Forklaring:</strong> {currentQuestion.explanation}
                </Alert>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-100"
                onClick={handleNextQuestion}
              >
                {currentQuestionIndex < randomizedQuestions.length - 1 ? (
                  <>
                    Næste Spørgsmål <BsArrowRight className="ms-2" />
                  </>
                ) : (
                  <>
                    Afslut Quiz <BsTrophyFill className="ms-2" />
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
    const percentage = Math.round((score / randomizedQuestions.length) * 100);

    let resultMessage = "Prøv igen!";
    let resultVariant = "danger";

    if (percentage >= 80) {
      resultMessage = "Fremragende!";
      resultVariant = "success";
    } else if (percentage >= 60) {
      resultMessage = "Godt arbejde!";
      resultVariant = "primary";
    } else if (percentage >= 40) {
      resultMessage = "God indsats!";
      resultVariant = "info";
    } else if (percentage >= 20) {
      resultMessage = "Bliv ved med at øve!";
      resultVariant = "warning";
    }

    return (
      <Card className="shadow quiz-results-card">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Quiz Resultat</h4>
        </Card.Header>
        <Card.Body className="text-center">
          <div className="display-1 mb-3">
            <BsTrophyFill className="text-warning" />
          </div>

          <h2 className="mb-3">
            Du scorede {score} ud af {randomizedQuestions.length}
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
                setAnswers(new Array(randomizedQuestions.length).fill(null));
              }}
            >
              Prøv Igen
            </Button>

            <Button
              variant="outline-secondary"
              size="lg"
              onClick={() => navigate("/platform")}
            >
              <BsArrowLeft className="me-2" />
              Tilbage
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
          <h5>Indlæser quiz...</h5>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Fejl</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button
              variant="outline-danger"
              onClick={() => navigate("/platform")}
            >
              Tilbage til Læringsplatform
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
          <Alert.Heading>Quiz Ikke Fundet</Alert.Heading>
          <p>Quizzen, du leder efter, kunne ikke findes.</p>
          <div className="d-flex justify-content-end">
            <Button
              variant="outline-warning"
              onClick={() => navigate("/platform")}
            >
              Tilbage til Læringsplatform
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
            <BsArrowLeft className="me-2" /> Tilbage
          </Button>
          {!quizCompleted && (
            <Badge bg="primary" className="fs-6 px-3 py-2">
              {currentQuestionIndex + 1} / {randomizedQuestions.length}
            </Badge>
          )}
        </div>

        <h1 className="mb-2">{quiz.title || "Untitled Quiz"}</h1>
        {quiz.description && <p className="text-muted">{quiz.description}</p>}

        {!quizCompleted && (
          <ProgressBar
            variant="primary"
            now={(currentQuestionIndex / randomizedQuestions.length) * 100}
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
