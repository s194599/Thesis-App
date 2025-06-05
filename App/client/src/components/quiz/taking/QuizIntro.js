import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  BsArrowLeft,
  BsPlay,
  BsVolumeUp,
  BsVolumeMute,
  BsMusicNote,
  BsMusicNoteBeamed,
  BsLightningChargeFill
} from "react-icons/bs";
import { getQuiz } from "../../../services/api";
import useSoundEffects from "../../../hooks/useSoundEffects";
import "./Quiz.css";

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
  
  // Local state to track user interaction for UI purposes
  const [localUserInteracted, setLocalUserInteracted] = useState(() => {
    const savedInteraction = localStorage.getItem('quizUserInteracted');
    return savedInteraction === 'true';
  });

  // Sound effects hook
  const { 
    toggleMute, 
    muted, 
    musicMuted, 
    toggleMusicMute,
    markQuizNotStarted
  } = useSoundEffects();

  useEffect(() => {
    // Mark the quiz as not started when on the intro page
    markQuizNotStarted();
    
    // Enable user interaction when any interaction happens
    const enableAudio = () => {
      setLocalUserInteracted(true);
      localStorage.setItem('quizUserInteracted', 'true');
      
      // Remove the listeners after first interaction
      ['click', 'touchstart', 'keydown'].forEach(event => {
        document.removeEventListener(event, enableAudio);
      });
    };
    
    // Add listeners for user interaction
    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, enableAudio);
    });
    
    return () => {
      // Cleanup listeners
      ['click', 'touchstart', 'keydown'].forEach(event => {
        document.removeEventListener(event, enableAudio);
      });
    };
  }, [markQuizNotStarted]);

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
    // Set a flag in localStorage to indicate user interaction has occurred
    // This will enable audio to play immediately when the quiz starts
    localStorage.setItem('quizUserInteracted', 'true');
    setLocalUserInteracted(true);
    
    // Mark that the quiz is starting to enable background music
    localStorage.setItem('quizStarted', 'true');
    
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
    <Container className="py-5 quiz-intro-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button
          variant="outline-secondary"
          className="d-flex align-items-center"
          onClick={handleBack}
        >
          <BsArrowLeft className="me-2" /> Tilbage
        </Button>

        <div className="d-flex align-items-center">
          {/* Sound toggle button */}
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>{!localUserInteracted ? "Klik for at aktivere lyd" : muted ? "Slå lyd til" : "Slå lyd fra"}</Tooltip>}
          >
            <Button 
              variant="light" 
              size="sm" 
              className={`me-2 rounded-circle sound-control-btn ${!localUserInteracted ? 'needs-interaction' : ''}`}
              onClick={toggleMute}
            >
              {muted ? <BsVolumeMute className="muted" /> : <BsVolumeUp />}
            </Button>
          </OverlayTrigger>
          
          {/* Music toggle button */}
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>{!localUserInteracted ? "Klik for at aktivere musik" : musicMuted ? "Slå musik til" : "Slå musik fra"}</Tooltip>}
          >
            <Button 
              variant="light" 
              size="sm" 
              className={`me-2 rounded-circle sound-control-btn ${!localUserInteracted ? 'needs-interaction' : ''}`}
              onClick={toggleMusicMute}
            >
              {musicMuted ? <BsMusicNote className="muted" /> : <BsMusicNoteBeamed />}
            </Button>
          </OverlayTrigger>
        </div>
      </div>

      <Card className="shadow quiz-intro-card">
        <Card.Body className="p-5 text-center">
          <h5 className="text-muted mb-3">Velkommen til</h5>
          <h1 className="display-4 fw-bold mb-4">{quiz.title}</h1>

          <div className="quiz-details mb-5">
            <div className="py-3">
              <p className="fs-5 mb-0 text-center">
                <span className="text-muted">Antal spørgsmål:</span>{" "}
                <span className="fw-bold">{quiz.questions ? quiz.questions.length : 0}</span>
              </p>
              
              {quizResults && (
                <div className="mt-3 d-flex justify-content-center align-items-center">
                  <span className="text-muted me-2">Din seneste score:</span>
                  <Badge bg="primary" className="score-badge px-3 py-2">
                    {formatScore(quizResults.score, quizResults.total_questions)}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <Button 
              variant="primary" 
              size="lg" 
              className="start-quiz-btn px-5 py-3 d-flex align-items-center mx-auto"
              onClick={handleStartQuiz}
            >
              <BsLightningChargeFill size={20} className="me-2" /> Start Quizzen
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QuizIntro; 