import React, { useState, useEffect } from "react";
import { Container, Button, Form, Alert, Spinner } from "react-bootstrap";
import { BsArrowLeft, BsPlus, BsX, BsCheck, BsPencil } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { getQuiz, updateQuiz } from "../../services/quizService";
import QuizQuestion from "./QuizQuestion";

const QuizEditor = ({ quizId }) => {
  const [quiz, setQuiz] = useState({
    title: "",
    // description: "",
    questions: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  // const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState("");
  // const [description, setDescription] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const data = await getQuiz(quizId);
        setQuiz(data);
        setTitle(data.title);
        // setDescription(data.description || "");
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError("Kunne ikke indlæse quizzen. Prøv venligst igen senere.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // const saveDescription = () => {
  //   updateQuiz(quizId, { description });
  //   setIsEditingDescription(false);
  // };

  const saveTitle = () => {
    updateQuiz(quizId, { title });
    setIsEditingTitle(false);
  };

  const handleAddQuestion = () => {
    // Determine if this is a flashcard quiz by checking the first question
    // or by checking the quiz type directly
    let isFlashcardQuiz = false;
    
    // Check quiz type if available
    if (quiz.type === "flashcard" || quiz.type === "flashcards") {
      isFlashcardQuiz = true;
    }
    // As a fallback, check the first question
    else if (quiz.questions && quiz.questions.length > 0) {
      isFlashcardQuiz = quiz.questions[0].type === "flashcard";
    }
    
    let newQuestion;
    
    if (isFlashcardQuiz) {
      // Create a flashcard-type question
      newQuestion = {
        id: `q${Date.now()}`,
        question: "Forside (Spørgsmål)",
        correctAnswer: "Bagside (Svar)",
        type: "flashcard",
        options: [] // Empty options array for flashcards
      };
    } else {
      // Create a standard multiple-choice question
      newQuestion = {
        id: `q${Date.now()}`,
        question: "New Question",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswer: "Option 1",
        explanation: "Add explanation here",
      };
    }
    
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const handleDeleteQuestion = (index) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateQuiz(quizId, quiz);
      navigate(`/quiz/preview/${quizId}`);
    } catch (err) {
      console.error("Error saving quiz:", err);
      setError("Failed to save quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        </div>

        {isEditingTitle ? (
          <div className="mb-3">
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control-lg"
            />
            <div className="mt-2 d-flex justify-content-end">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={() => {
                  setTitle(quiz.title);
                  setIsEditingTitle(false);
                }}
              >
                <BsX /> Annuller
              </Button>
              <Button variant="outline-primary" size="sm" onClick={saveTitle}>
                <BsCheck /> Gem
              </Button>
            </div>
          </div>
        ) : (
          <div className="d-flex align-items-center">
            <h1 className="mb-0 me-3">{title}</h1>
            <Button
              variant="link"
              size="sm"
              className="p-0"
              onClick={() => setIsEditingTitle(true)}
            >
              <BsPencil />
            </Button>
          </div>
        )}

        {/* Description section commented out
        {isEditingDescription ? (
          <div className="mt-3">
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your quiz"
            />
            <div className="mt-2 d-flex justify-content-end">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={() => {
                  setDescription(quiz.description || "");
                  setIsEditingDescription(false);
                }}
              >
                <BsX /> Annuller
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={saveDescription}
              >
                <BsCheck /> Gem
              </Button>
            </div>
          </div>
        ) : (
          <div className="d-flex align-items-center mt-3">
            <p className="mb-0 me-3 text-muted">
              {description || "Ingen beskrivelse tilføjet"}
            </p>
            <Button
              variant="link"
              size="sm"
              className="p-0"
              onClick={() => setIsEditingDescription(true)}
            >
              <BsPencil />
            </Button>
          </div>
        )}
        */}
      </div>

      {/* Questions Section */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Spørgsmål</h3>
          <Button
            variant="primary"
            onClick={handleAddQuestion}
            disabled={loading}
          >
            <BsPlus className="me-2" />
            Tilføj Spørgsmål
          </Button>
        </div>

        {quiz.questions.map((question, index) => (
          <QuizQuestion
            key={question.id}
            question={question}
            index={index}
            onDelete={() => handleDeleteQuestion(index)}
          />
        ))}

        {quiz.questions.length === 0 && !loading && (
          <Alert variant="info">
            Ingen spørgsmål tilføjet endnu. Klik på "Tilføj Spørgsmål" for at
            begynde.
          </Alert>
        )}
      </div>

      {/* Save Button */}
      <div className="d-grid gap-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={loading || quiz.questions.length === 0}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Gemmer...
            </>
          ) : (
            "Gem Quiz"
          )}
        </Button>
      </div>
    </Container>
  );
};

export default QuizEditor;
