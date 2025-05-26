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
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [flashcardResponse, setFlashcardResponse] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const data = await getQuiz(quizId);

        // Set quiz start time when quiz is first loaded
        setQuizStartTime(new Date().toISOString());

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
          // Check if this is a flashcard quiz
          if (data.type === "flashcard") {
            return {
              questionIndex: question.originalIndex,
              options: [], // Empty array for flashcards
              isFlashcard: true
            };
          }
          
          // For multiple choice questions, shuffle the options
          const options = question.options ? [...question.options] : [];
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
    // Add a separate useEffect to handle saving quiz results when quiz is completed
    const saveQuizResult = async () => {
      if (quizCompleted && quiz && randomizedQuestions.length > 0) {
        try {
          console.log("Saving quiz result for student...");
          
          // Process answers and calculate final score for both flashcards and multiple choice questions
          const processedAnswers = answers.map((answer, index) => {
            const question = quiz.questions[index];
            
            // Handle flashcards differently based on quiz type
            if (quiz.type === "flashcard") {
              // Check if this flashcard was answered (some might be skipped)
              if (!answer || typeof answer !== 'object') {
                return {
                  question_id: question.id,
                  question: question.question,
                  answer: "Flashcard not assessed",
                  correct: false,
                  is_flashcard: true,
                  viewed: false
                };
              }
              
              // Return flashcard with student's self-assessment
              return {
                question_id: question.id,
                question: question.question,
                answer: answer.flashcardResponse ? "Knew it" : "Didn't know it",
                correct: answer.flashcardResponse === true,
                is_flashcard: true,
                viewed: answer.viewed === true
              };
            }
            // Regular multiple choice question
            return {
              question_id: question.id,
              question: question.question,
              answer: answer,
              correct: answer === question.correctAnswer,
            };
          });
          
          const quizResult = {
            quiz_id: quizId,
            quiz_title: quiz.title,
            score: score,
            total_questions: randomizedQuestions.length,
            start_timestamp: quizStartTime,
            answers: processedAnswers,
          };

          const response = await fetch("/api/student/save-quiz-result", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(quizResult),
          });

          if (response.ok) {
            console.log("Quiz result saved successfully");
          } else {
            console.error("Failed to save quiz result");
          }
        } catch (error) {
          console.error("Error saving quiz result:", error);
        }
      }
    };

    saveQuizResult();
  }, [quizCompleted, quiz, quizId, score, answers, randomizedQuestions, quizStartTime]);

  useEffect(() => {
    // Mark activity as completed when quiz is finished
    const markActivityCompleted = async () => {
      if (quizCompleted && moduleId && !alreadyMarkedComplete && quiz) {
        try {
          console.log(
            `Marking quiz ${quizId} as completed for module ${moduleId} with activityId ${
              activityId || "N/A"
            }`
          );

          const requestData = {
            moduleId: moduleId,
            quizScore: Math.round((score / randomizedQuestions.length) * 100),
            quizId: quizId, // Always include quizId for better identification
          };

          // Include activityId if available
          if (activityId) {
            requestData.activityId = activityId;
          }

          const response = await fetch("/api/complete-activity", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
          });

          const responseData = await response.json();

          if (response.ok) {
            console.log("Quiz marked as completed successfully:", responseData);
            setAlreadyMarkedComplete(true);
          } else {
            console.error(
              "Failed to mark quiz as completed:",
              responseData.message
            );
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
    quizId,
    alreadyMarkedComplete,
    score,
    randomizedQuestions,
    quiz,
  ]);

  // Effect to trigger confetti when the quiz is completed
  useEffect(() => {
    if (quizCompleted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [quizCompleted]);

  // Add a useEffect for keyboard event listeners
  useEffect(() => {
    // Only add keyboard navigation for flashcards and when not completed
    if (quiz && !quizCompleted && randomizedQuestions.length > 0) {
      const currentQuestion = randomizedQuestions[currentQuestionIndex];
      
      // Only proceed if this is a flashcard
      if (currentQuestion?.type === "flashcard") {
        const handleKeyDown = (e) => {
          // Space key to flip card
          if (e.code === 'Space') {
            e.preventDefault(); // Prevent page scrolling
            setShowAnswer(!showAnswer);
          }
          
          // Only process left/right arrows when the card is flipped (showing answer)
          if (showAnswer) {
            // Left arrow Det vidste jeg ikke
            if (e.code === 'ArrowLeft') {
              // Record that the student didn't know the answer
              const newAnswers = [...answers];
              newAnswers[currentQuestion.originalIndex] = {
                flashcardResponse: false,
                viewed: true
              };
              setAnswers(newAnswers);
              setFlashcardResponse(false);
              
              // Move to next card or finish quiz
              if (currentQuestionIndex < randomizedQuestions.length - 1) {
                setShowAnswer(false);
                setFlashcardResponse(null);
                setCurrentQuestionIndex(currentQuestionIndex + 1);
              } else {
                setQuizCompleted(true);
              }
            }
            
            // Right arrow Det vidste jeg godt
            if (e.code === 'ArrowRight') {
              // Record that the student knew the answer and increment score
              const newAnswers = [...answers];
              newAnswers[currentQuestion.originalIndex] = {
                flashcardResponse: true,
                viewed: true
              };
              setAnswers(newAnswers);
              setScore(prevScore => prevScore + 1);
              setFlashcardResponse(true);
              
              // Move to next card or finish quiz
              if (currentQuestionIndex < randomizedQuestions.length - 1) {
                setShowAnswer(false);
                setFlashcardResponse(null);
                setCurrentQuestionIndex(currentQuestionIndex + 1);
              } else {
                setQuizCompleted(true);
              }
            }
          }
        };
        
        // Add event listener
        window.addEventListener('keydown', handleKeyDown);
        
        // Cleanup
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }
    }
  }, [quiz, quizCompleted, randomizedQuestions, currentQuestionIndex, showAnswer, answers, setAnswers, setShowAnswer, setScore, setFlashcardResponse, setCurrentQuestionIndex, setQuizCompleted]);

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

  const handleNextQuestion = async () => {
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
      // Quiz results are now saved in the dedicated useEffect hook
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
    if (!quiz || randomizedQuestions.length === 0) return null;

    const currentQuestion = randomizedQuestions[currentQuestionIndex];
    
    // Handle flashcards differently based on quiz type
    if (quiz.type === "flashcard") {
      return (
        <Card className="quiz-card mb-4">
          <Card.Body>
            <div className="mb-4">
              <h4>Flashcard {currentQuestionIndex + 1} af {randomizedQuestions.length}</h4>
            </div>
            
            <div className="flashcard-container">
              <div 
                className={`flashcard ${showAnswer ? "flipped" : ""}`}
                onClick={() => setShowAnswer(!showAnswer)}
              >
                <div className="flashcard-front">
                  <p>{currentQuestion.question}</p>
                </div>
                <div className="flashcard-back">
                  <p>{currentQuestion.correctAnswer}</p>
                </div>
              </div>
            </div>
            
            <div className="flashcard-flip-hint">
              {showAnswer ? "Klik for at se spørgsmålet" : "Klik for at se svaret"}
            </div>
            
            {/* Keyboard shortcuts instructions */}
            <div className="text-center text-muted mb-3 small">
              {!showAnswer ? (
                <p className="mb-1"><kbd>Mellemrum</kbd> for at vende kort</p>
              ) : (
                <p className="mb-0">
                  Det vidste jeg ikke <kbd>←</kbd> eller <kbd>→</kbd> Det vidste jeg godt
                </p>
              )}
            </div>
            
            {/* Navigation and assessment buttons */}
            <div className="mt-4">
              {/* Top row with navigation buttons */}
              <div className="d-flex justify-content-center mb-3">
                {!showAnswer ? (
                  // When card is not flipped, show the flip button
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setShowAnswer(true)}
                  >
                    Vis svar
                  </Button>
                ) : null}
              </div>
              
              {/* Self-assessment buttons in centered container when card is flipped */}
              {showAnswer && (
                <div className="d-flex justify-content-center gap-3 mt-4">
                  <Button
                    variant="danger"
                    size="lg"
                    className="px-4"
                    onClick={() => {
                      // Record that the student didn't know the answer
                      const newAnswers = [...answers];
                      newAnswers[currentQuestion.originalIndex] = {
                        flashcardResponse: false,
                        viewed: true
                      };
                      setAnswers(newAnswers);
                      setFlashcardResponse(false);
                      
                      // Move to next card or finish quiz
                      if (currentQuestionIndex < randomizedQuestions.length - 1) {
                        setShowAnswer(false);
                        setFlashcardResponse(null);
                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                      } else {
                        setQuizCompleted(true);
                      }
                    }}
                  >
                    Det vidste jeg ikke
                  </Button>
                  <Button
                    variant="success"
                    size="lg"
                    className="px-4"
                    onClick={() => {
                      // Record that the student knew the answer and increment score
                      const newAnswers = [...answers];
                      newAnswers[currentQuestion.originalIndex] = {
                        flashcardResponse: true,
                        viewed: true
                      };
                      setAnswers(newAnswers);
                      setScore(prevScore => prevScore + 1);
                      setFlashcardResponse(true);
                      
                      // Move to next card or finish quiz
                      if (currentQuestionIndex < randomizedQuestions.length - 1) {
                        setShowAnswer(false);
                        setFlashcardResponse(null);
                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                      } else {
                        setQuizCompleted(true);
                      }
                    }}
                  >
                    Det vidste jeg godt
                  </Button>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      );
    }

    // Handle multiple choice questions (original code)
    // Get the randomized options for the current question
    const currentOptions = randomizedOptions[currentQuestionIndex]?.options || currentQuestion.options;
    
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
                className="text-start p-3 d-flex align-items-center"
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
    // Check if it's a flashcard quiz
    if (quiz.type === "flashcard") {
      // Calculate 'Knew' and 'Still learning' counts
      let knewCount = 0;
      let stillLearningCount = 0;

      randomizedQuestions.forEach((question) => {
        const originalIndex = question.originalIndex;
        const answer = answers[originalIndex];

        // If the flashcard was assessed
        if (answer && typeof answer === 'object' && answer.viewed) {
          if (answer.flashcardResponse === true) {
            knewCount++;
          } else if (answer.flashcardResponse === false) {
            stillLearningCount++;
          }
        } else {
           // If the flashcard was not viewed or not assessed after viewing, count as still learning
           stillLearningCount++;
        }
      });

      // Determine the result message based on performance
      const totalQuestions = randomizedQuestions.length;
      let resultMessage = "";

      if (totalQuestions === 0) {
        resultMessage = "Ingen kort at sortere.";
      } else if (knewCount === totalQuestions) {
        resultMessage = "Fantastisk! Du vidste alt!";
      } else if (knewCount / totalQuestions >= 0.8) {
        resultMessage = "Fremragende! Du har godt styr på kortene.";
      } else if (knewCount / totalQuestions >= 0.6) {
        resultMessage = "Godt arbejde! Du kender de fleste kort.";
      } else {
        resultMessage = "Bliv ved med at øve! Repeter kortene for at forbedre dig.";
      }

      return (
        <div className="text-center mb-4">
          <h1 className="mb-3 text-center">{resultMessage}</h1>

          <div className="d-flex justify-content-center gap-4 mb-5">
            {/* Knew count */}
            <Card className="flex-fill" style={{ maxWidth: '200px' }}>
              <Card.Body>
                <Card.Title className="text-success">Vidste jeg</Card.Title>
                <Card.Text className="display-4">{knewCount}</Card.Text>
              </Card.Body>
            </Card>

            {/* Still learning count */}
            <Card className="flex-fill" style={{ maxWidth: '200px' }}>
              <Card.Body>
                <Card.Title className="text-danger">Skal øve mere</Card.Title>
                <Card.Text className="display-4">{stillLearningCount}</Card.Text>
              </Card.Body>
            </Card>
          </div>

          <div className="d-flex justify-content-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/platform")}
            >
              <BsArrowLeft className="me-2" />
              Tilbage til læringsplatform
            </Button>

            <Button
              variant="outline-primary"
              size="md"
              onClick={() => {
                // Reset all state variables to start a new attempt
                setCurrentQuestionIndex(0);
                setSelectedAnswer(null);
                setShowAnswer(false);
                setQuizCompleted(false);
                setScore(0);
                setAnswers(new Array(randomizedQuestions.length).fill(null));
                // Reset alreadyMarkedComplete so activity will be marked as completed again
                setAlreadyMarkedComplete(false);
              }}
            >
              Prøv igen
            </Button>
          </div>
        </div>
      );
    }

    // Existing code for multiple choice results
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
          <h4 className="mb-0">Quiz resultat</h4>
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
            className="mb-2"
            style={{ height: "2rem" }}
          />
          <div className="text-center mb-4">
            <span className={`text-${resultVariant} fw-bold`}>{percentage}%</span>
          </div>

          <Alert variant={resultVariant} className="mb-4 py-2">
            <h5 className="mb-0">{resultMessage}</h5>
          </Alert>

          <div className="d-flex justify-content-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/platform")}
            >
              <BsArrowLeft className="me-2" />
              Tilbage til læringsplatform
            </Button>

            <Button
              variant="outline-primary"
              size="md"
              onClick={() => {
                // Reset all state variables to start a new attempt
                setCurrentQuestionIndex(0);
                setSelectedAnswer(null);
                setShowAnswer(false);
                setQuizCompleted(false);
                setScore(0);
                setAnswers(new Array(randomizedQuestions.length).fill(null));
                // Reset alreadyMarkedComplete so activity will be marked as completed again
                setAlreadyMarkedComplete(false);
              }}
            >
              Prøv igen
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
        {/* {quiz.description && <p className="text-muted">{quiz.description}</p>} */}

        {!quizCompleted && (
          <>
            <ProgressBar
              variant="primary"
              now={(currentQuestionIndex / randomizedQuestions.length) * 100}
              className="mb-2"
            />
            <div className="text-center text-muted small mb-4">
              <span className="fw-bold">{Math.round((currentQuestionIndex / randomizedQuestions.length) * 100)}%</span>
            </div>
            
            {/* Previous button moved to header section */}
            {randomizedQuestions.length > 0 && 
             randomizedQuestions[currentQuestionIndex]?.type === "flashcard" && (
              <div className="d-flex mb-3">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => {
                    setShowAnswer(false);
                    setFlashcardResponse(null);
                    setCurrentQuestionIndex(currentQuestionIndex - 1);
                  }}
                >
                  <BsArrowLeft className="me-1" /> Forrige
                </Button>
              </div>
            )}
          </>
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
