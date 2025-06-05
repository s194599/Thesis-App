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
  OverlayTrigger,
  Tooltip,
  Modal,
} from "react-bootstrap";
import {
  BsArrowLeft,
  BsArrowRight,
  BsCheckCircleFill,
  BsXCircleFill,
  BsTrophyFill,
  BsHouseDoor,
  BsStarFill,
  BsVolumeUp,
  BsVolumeMute,
  BsLightningChargeFill,
} from "react-icons/bs";
import { getQuiz } from "../../../services/api";
import confetti from "canvas-confetti";
import useSoundEffects from "../../../hooks/useSoundEffects";
import "./Quiz.css";

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

  // Sound effects hook
  const { playSound, toggleMute, muted, loaded: soundsLoaded } = useSoundEffects();

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Add streak counter state
  const [streak, setStreak] = useState(0);
  const [streakMessage, setStreakMessage] = useState("");
  const [showStreakMessage, setShowStreakMessage] = useState(false);
  
  // Badge related state
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

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

          // Calculate quiz score percentage
          const scorePercent = Math.round((score / randomizedQuestions.length) * 100);

          // First, record activity completion as before
          const activityRequestData = {
            moduleId: moduleId,
            quizScore: scorePercent,
            quizId: quizId,
          };

          // Include activityId if available
          if (activityId) {
            activityRequestData.activityId = activityId;
          }

          const activityResponse = await fetch("/api/complete-activity", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(activityRequestData),
          });

          const activityResponseData = await activityResponse.json();

          if (activityResponse.ok) {
            console.log("Quiz marked as completed successfully:", activityResponseData);
            setAlreadyMarkedComplete(true);
            
            // Now record the quiz completion for the badge system
            const badgeRequestData = {
              student_id: "1", // Hardcoded for Christian Wu
              quiz_id: quizId,
              module_id: moduleId,
              score: score,
              total_questions: randomizedQuestions.length
            };
            
            const badgeResponse = await fetch("/api/record-quiz-completion", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(badgeRequestData),
            });
            
            const badgeResponseData = await badgeResponse.json();
            
            if (badgeResponse.ok && badgeResponseData.newly_earned_badges && 
                badgeResponseData.newly_earned_badges.length > 0) {
              // Store newly earned badges and show the badge modal
              setEarnedBadges(badgeResponseData.newly_earned_badges);
              setShowBadgeModal(true);
              
              // Launch extra confetti for badge earned
              setTimeout(() => {
                confetti({
                  particleCount: 150,
                  spread: 90,
                  origin: { y: 0.3 },
                  colors: ['#FFD700', '#FFA500', '#FF6347'] // Gold, orange, red
                });
              }, 500);
            }
          } else {
            console.error(
              "Failed to mark quiz as completed:",
              activityResponseData.message
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
      
      // Reset streak when quiz is completed
      setStreak(0);
      setShowStreakMessage(false);
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
          if (isTransitioning) return; // Prevent interactions during transitions
          
          // Space key to flip card
          if (e.code === 'Space') {
            e.preventDefault(); // Prevent page scrolling
            setShowAnswer(!showAnswer);
          }
          
          // Only process left/right arrows when the card is flipped (showing answer)
          if (showAnswer) {
            // Left arrow Det vidste jeg ikke
            if (e.code === 'ArrowLeft') {
              // Play wrong sound
              playSound('wrong');
              
              // Record that the student didn't know the answer
              const newAnswers = [...answers];
              newAnswers[currentQuestion.originalIndex] = {
                flashcardResponse: false,
                viewed: true
              };
              setAnswers(newAnswers);
              setFlashcardResponse(false);
              
              // Only show streak reset message if streak is 2 or higher
              if (streak >= 2) {
                setStreakMessage("Streak nulstillet!");
                setShowStreakMessage(true);
                // Hide message after a delay
                setTimeout(() => {
                  setShowStreakMessage(false);
                }, 2000);
              }
              
              // Reset streak counter
              setStreak(0);
              
              // Move to next card or finish quiz with proper transition
              if (currentQuestionIndex < randomizedQuestions.length - 1) {
                setIsTransitioning(true);
                
                // First, reset to front side
                setShowAnswer(false);
                
                // Give time for the flip animation to complete before changing card
                setTimeout(() => {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setFlashcardResponse(null);
                  setIsTransitioning(false);
                }, 300); // Half of the flip animation time (0.6s)
              } else {
                setQuizCompleted(true);
              }
            }
            
            // Right arrow Det vidste jeg godt
            if (e.code === 'ArrowRight') {
              // Play correct sound
              playSound('correct');
              
              // Record that the student knew the answer and increment score
              const newAnswers = [...answers];
              newAnswers[currentQuestion.originalIndex] = {
                flashcardResponse: true,
                viewed: true
              };
              setAnswers(newAnswers);
              setScore(prevScore => prevScore + 1);
              setFlashcardResponse(true);
              
              // Increase streak counter
              const newStreak = streak + 1;
              setStreak(newStreak);
              
              // Show streak message for impressive streaks
              const message = getStreakMessage(newStreak);
              if (message) {
                setStreakMessage(message);
                setShowStreakMessage(true);
                // Hide message after a delay
                setTimeout(() => {
                  setShowStreakMessage(false);
                }, 2000);
              }
              
              // Move to next card or finish quiz with proper transition
              if (currentQuestionIndex < randomizedQuestions.length - 1) {
                setIsTransitioning(true);
                
                // First, reset to front side
                setShowAnswer(false);
                
                // Give time for the flip animation to complete before changing card
                setTimeout(() => {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setFlashcardResponse(null);
                  setIsTransitioning(false);
                }, 300); // Half of the flip animation time (0.6s)
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
  }, [quiz, quizCompleted, randomizedQuestions, currentQuestionIndex, showAnswer, answers, setAnswers, setShowAnswer, setScore, setFlashcardResponse, setCurrentQuestionIndex, setQuizCompleted, playSound, isTransitioning, streak]);

  const handleAnswerSelect = (answer) => {
    if (showAnswer) return; // Prevent changing answer after submission
    setSelectedAnswer(answer);
  };

  // Function to get streak message based on streak count
  const getStreakMessage = (streakCount) => {
    if (streakCount === 0) {
      return ""; // Empty message for streak 0
    } else if (streakCount === 3) {
      return "🔥 3 korrekte i streg!";
    } else if (streakCount === 5) {
      return "🔥 5 korrekte i streg!";
    } else if (streakCount === 7) {
      return "🔥 Fantastisk stime!";
    } else if (streakCount === 10) {
      return "💯 Du er i topform!";
    } else if (streakCount >= 15) {
      return "🏆 Ustoppelig!";
    } else if (streakCount > 1) {
      return `🔥 ${streakCount} korrekte i streg!`;
    }
    return "";
  };

  // Update handleCheckAnswer for multiple choice quizzes
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
      // Play correct sound
      playSound('correct');
      
      // Increase streak counter
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // Show streak message for impressive streaks
      const message = getStreakMessage(newStreak);
      if (message) {
        setStreakMessage(message);
        setShowStreakMessage(true);
        // Hide message after a delay
        setTimeout(() => {
          setShowStreakMessage(false);
        }, 2000);
      }
    } else {
      // Play wrong sound
      playSound('wrong');
      
      // Only show streak reset message if streak is 2 or higher
      if (streak >= 2) {
        setStreakMessage("Streak nulstillet!");
        setShowStreakMessage(true);
        // Hide message after a delay
        setTimeout(() => {
          setShowStreakMessage(false);
        }, 2000);
      }
      
      // Reset streak counter
      setStreak(0);
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

  // Add this to handle flashcard interactions with sound
  const handleFlashcardFlip = () => {
    if (isTransitioning) return; // Prevent flipping during transitions
    setShowAnswer(!showAnswer);
  };

  // Update handleFlashcardResponse for flashcards
  const handleFlashcardResponse = (knew) => {
    if (isTransitioning) return; // Prevent responses during transitions
    
    // Record that the student knew/didn't know the answer
    const currentQuestion = randomizedQuestions[currentQuestionIndex];
    const newAnswers = [...answers];
    newAnswers[currentQuestion.originalIndex] = {
      flashcardResponse: knew,
      viewed: true
    };
    setAnswers(newAnswers);
    
    // Play appropriate sound and update streak
    if (knew) {
      playSound('correct');
      setScore(prevScore => prevScore + 1);
      
      // Increase streak counter
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // Show streak message for impressive streaks
      const message = getStreakMessage(newStreak);
      if (message) {
        setStreakMessage(message);
        setShowStreakMessage(true);
        // Hide message after a delay
        setTimeout(() => {
          setShowStreakMessage(false);
        }, 2000);
      }
    } else {
      playSound('wrong');
      
      // Only show streak reset message if streak is 2 or higher
      if (streak >= 2) {
        setStreakMessage("Streak nulstillet!");
        setShowStreakMessage(true);
        // Hide message after a delay
        setTimeout(() => {
          setShowStreakMessage(false);
        }, 2000);
      }
      
      // Reset streak counter
      setStreak(0);
    }
    
    setFlashcardResponse(knew);
    
    // Move to next card or finish quiz with proper transition
    if (currentQuestionIndex < randomizedQuestions.length - 1) {
      setIsTransitioning(true);
      
      // First, reset to front side if we're showing the back
      if (showAnswer) {
        setShowAnswer(false);
        
        // Give time for the flip animation to complete before changing card
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setFlashcardResponse(null);
          setIsTransitioning(false);
        }, 300); // Half of the flip animation time (0.6s)
      } else {
        // If already on front side, we can move directly
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setFlashcardResponse(null);
        setIsTransitioning(false);
      }
    } else {
      setQuizCompleted(true);
    }
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
            
            <div className={`flashcard-container mb-4 ${isTransitioning ? 'transitioning' : ''}`}>
              <div 
                className={`flashcard ${showAnswer ? "flipped" : ""}`}
                onClick={handleFlashcardFlip}
              >
                <div className="flashcard-front">
                  <p>{currentQuestion.question}</p>
                </div>
                <div className="flashcard-back">
                  <p>{currentQuestion.correctAnswer}</p>
                </div>
              </div>
            </div>
            
            <div className="flashcard-flip-hint text-center mb-3">
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
                    onClick={handleFlashcardFlip}
                    disabled={isTransitioning}
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
                    onClick={() => handleFlashcardResponse(false)}
                    disabled={isTransitioning}
                  >
                    Det vidste jeg ikke
                  </Button>
                  <Button
                    variant="success"
                    size="lg"
                    className="px-4"
                    onClick={() => handleFlashcardResponse(true)}
                    disabled={isTransitioning}
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

  // Badge modal component
  const renderBadgeModal = () => {
    return (
      <Modal
        show={showBadgeModal}
        onHide={() => setShowBadgeModal(false)}
        centered
        className="badge-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Nyt badge optjent!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {earnedBadges.map((badge, index) => (
            <div key={index} className="badge-earned mb-3">
              <div className="badge-icon mb-2" style={{ fontSize: '3rem' }}>
                {badge.badge_icon}
              </div>
              <h3>{badge.badge_name}</h3>
              <p>{badge.badge_description}</p>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowBadgeModal(false)}>
            Luk
          </Button>
        </Modal.Footer>
      </Modal>
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
      const percentageKnown = totalQuestions === 0 ? 0 : Math.round((knewCount / totalQuestions) * 100);
      let resultMessage = "";
      let starRating = 0;

      if (totalQuestions === 0) {
        resultMessage = "Ingen kort at sortere.";
        starRating = 0;
      } else if (knewCount === totalQuestions) {
        resultMessage = "Fantastisk! Du vidste alt!";
        starRating = 5; // 5 stars for 100%
      } else if (percentageKnown >= 80) {
        resultMessage = "Fremragende! Du har godt styr på kortene.";
        starRating = 4; // 4 stars for 80-99%
      } else if (percentageKnown >= 60) {
        resultMessage = "Godt arbejde! Du kender de fleste kort.";
        starRating = 3; // 3 stars for 60-79%
      } else if (percentageKnown >= 40) {
        resultMessage = "God indsats! Bliv ved med at øve.";
        starRating = 2; // 2 stars for 40-59%
      } else if (percentageKnown >= 20) {
        resultMessage = "Bliv ved med at øve! Repeter kortene for at forbedre dig.";
        starRating = 1; // 1 star for 20-39%
      } else {
        resultMessage = "Bliv ved med at øve! Repeter kortene for at forbedre dig.";
        starRating = 0; // 0 stars for < 20%
      }

      return (
        <div className="text-center mb-4">
          <h1 className="mb-3 text-center">
            {knewCount === totalQuestions && totalQuestions > 0 && <BsTrophyFill className="me-3 text-warning trophy-celebrate" />}
            {resultMessage}
          </h1>

          {totalQuestions > 0 && (
            <div className="mb-4">
              {[...Array(5)].map((_, i) => (
                <BsStarFill
                  key={i}
                  className={`me-1 ${i < starRating ? 'text-warning' : 'text-muted'}`}
                  size={24}
                />
              ))}
            </div>
          )}

          <div className="mt-5 mb-4">
            <h3>Hvordan det gik</h3>
          </div>

          <div className="d-flex justify-content-center gap-4 mb-5">
            {/* Knew count */}
            <Card className="flex-fill bg-success text-white" style={{ maxWidth: '200px' }}>
              <Card.Body>
                <Card.Title className="text-white">Vidste jeg</Card.Title>
                <Card.Text className="display-4 text-white">{knewCount}</Card.Text>
              </Card.Body>
            </Card>

            {/* Still learning count */}
            <Card className="flex-fill bg-danger text-white" style={{ maxWidth: '200px' }}>
              <Card.Body>
                <Card.Title className="text-white">Skal øve mere</Card.Title>
                <Card.Text className="display-4 text-white">{stillLearningCount}</Card.Text>
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
                // Add streak reset here
                setStreak(0);
                setShowStreakMessage(false);
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
    const totalQuestions = randomizedQuestions.length;

    let resultMessage = "Bliv ved med at øve!";
    let messageVariant = "danger";

    if (percentage === 100) {
      resultMessage = "Fantastisk! Du har fuldstændig styr på det!";
      messageVariant = "success";
    } else if (percentage >= 80) {
      resultMessage = "Fremragende! Du har godt styr på emnet.";
      messageVariant = "success";
    } else if (percentage >= 60) {
      resultMessage = "Godt arbejde! Du er godt på vej.";
      messageVariant = "warning";
    } else if (percentage >= 40) {
      resultMessage = "God indsats! Bliv ved med at øve dig.";
      messageVariant = "warning";
    } else if (percentage >= 20) {
      resultMessage = "Bliv ved med at øve! Du er på rette spor.";
      messageVariant = "warning";
    } else {
      resultMessage = "Bliv ved med at øve!";
      messageVariant = "danger";
    }

    return (
      <Card className="shadow quiz-results-card">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Quiz resultat</h4>
        </Card.Header>
        <Card.Body className="text-center">
          {/* Dynamic Message */}
          <h2 className={`mb-4 text-${messageVariant}`}>
            {percentage === 100 && <BsTrophyFill className="me-3 text-warning trophy-celebrate" />}
            {resultMessage}
          </h2>

          {/* Score and Percentage */}
          <div className="mb-4">
            <div className="display-4 fw-bold mb-1">{percentage}%</div>
            <div className="text-muted">{score} ud af {totalQuestions} spørgsmål besvaret korrekt</div>
          </div>

          {/* Progress Bar */}
          <ProgressBar
            variant={messageVariant}
            now={percentage}
            className="mb-4"
            style={{ height: "2rem" }}
          />

          {/* Buttons */}
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
                // Add streak reset here
                setStreak(0);
                setShowStreakMessage(false);
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
          
          <div className="d-flex align-items-center">
            {/* Streak counter */}
            {!quizCompleted && streak > 0 && (
              <div className="me-3 d-flex align-items-center">
                <Badge bg="warning" className="streak-badge px-2 py-1">
                  <BsLightningChargeFill className="me-1" />
                  <span>{streak}</span>
                </Badge>
              </div>
            )}
            
            {/* Sound toggle button */}
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>{muted ? "Slå lyd til" : "Slå lyd fra"}</Tooltip>}
            >
              <Button 
                variant="light" 
                size="sm" 
                className="me-2 rounded-circle sound-control-btn" 
                onClick={toggleMute}
              >
                {muted ? <BsVolumeMute className="muted" /> : <BsVolumeUp />}
              </Button>
            </OverlayTrigger>
            
            {!quizCompleted && (
              <Badge bg="primary" className="fs-6 px-3 py-2">
                {currentQuestionIndex + 1} / {randomizedQuestions.length}
              </Badge>
            )}
          </div>
        </div>

        <h1 className="mb-2">{quiz?.title || "Untitled Quiz"}</h1>
        {/* {quiz?.description && <p className="text-muted">{quiz.description}</p>} */}

        {/* Streak message */}
        {showStreakMessage && (
          <div className={`streak-message text-center mb-3 ${streak === 0 ? 'streak-reset' : 'streak-active'}`}>
            <span>{streakMessage}</span>
          </div>
        )}

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
      {renderBadgeModal()}
    </Container>
  );
};

export default TakeQuiz;
