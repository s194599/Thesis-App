import React, { useState, useEffect } from "react";
import { Container, Form, Button, Card, InputGroup, Modal, Nav } from "react-bootstrap";
import { BsArrowLeft, BsTrash, BsPencil, BsPlus } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { useQuizContext } from "../../../context/QuizContext";

const ManualQuizCreation = () => {
  const navigate = useNavigate();
  const { saveQuizToBackend, setGeneratedQuiz } = useQuizContext();
  
  // State for quiz type (multiple_choice or flashcards)
  const [quizType, setQuizType] = useState("multiple_choice");
  
  // Load quiz type from localStorage on component mount
  useEffect(() => {
    const savedType = localStorage.getItem("manualQuizType");
    if (savedType === "flashcards" || savedType === "multiple_choice") {
      setQuizType(savedType);
    }
  }, []);
  
  // State for quiz data
  const [quizTitle, setQuizTitle] = useState(quizType === "flashcards" ? "Unavngivne Flashcards" : "Unavngiven Quiz");
  
  // For multiple choice questions
  const [questions, setQuestions] = useState([
    {
      id: 1,
      question: "New Question",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: "Option 1"
    }
  ]);
  
  // For flashcards
  const [flashcards, setFlashcards] = useState([
    {
      id: 1,
      front: "Forside (Spørgsmål)",
      back: "Bagside (Svar)"
    }
  ]);
  
  // Update title when quiz type changes
  useEffect(() => {
    setQuizTitle(quizType === "flashcards" ? "Unavngivne Flashcards" : "Unavngiven Quiz");
  }, [quizType]);
  
  // State for editing a specific question or flashcard
  const [currentIndex, setCurrentIndex] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  
  const [editingQuestion, setEditingQuestion] = useState({
    question: "",
    options: [],
    correctAnswer: ""
  });
  
  const [editingFlashcard, setEditingFlashcard] = useState({
    front: "",
    back: ""
  });
  
  // Open modal for editing a question
  const handleEditQuestion = (index) => {
    setCurrentIndex(index);
    setEditingQuestion({...questions[index]});
    setShowQuestionModal(true);
  };
  
  // Open modal for editing a flashcard
  const handleEditFlashcard = (index) => {
    setCurrentIndex(index);
    setEditingFlashcard({...flashcards[index]});
    setShowFlashcardModal(true);
  };
  
  // Add a new question
  const handleAddQuestion = () => {
    const newQuestion = {
      id: Date.now(), // Unique ID
      question: "New Question",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: "Option 1"
    };
    
    setQuestions([...questions, newQuestion]);
  };
  
  // Add a new flashcard
  const handleAddFlashcard = () => {
    const newFlashcard = {
      id: Date.now(), // Unique ID
      front: "Forside (Spørgsmål)",
      back: "Bagside (Svar)"
    };
    
    setFlashcards([...flashcards, newFlashcard]);
  };
  
  // Delete a question
  const handleDeleteQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };
  
  // Delete a flashcard
  const handleDeleteFlashcard = (index) => {
    const newFlashcards = [...flashcards];
    newFlashcards.splice(index, 1);
    setFlashcards(newFlashcards);
  };
  
  // Update option text
  const handleOptionChange = (optionIndex, value) => {
    const updatedOptions = [...editingQuestion.options];
    updatedOptions[optionIndex] = value;
    
    // If changing the correct answer, update it too
    let updatedCorrectAnswer = editingQuestion.correctAnswer;
    if (updatedCorrectAnswer === editingQuestion.options[optionIndex]) {
      updatedCorrectAnswer = value;
    }
    
    setEditingQuestion({
      ...editingQuestion,
      options: updatedOptions,
      correctAnswer: updatedCorrectAnswer
    });
  };
  
  // Add an option to the current editing question
  const handleAddOption = () => {
    const updatedOptions = [...editingQuestion.options, `Option ${editingQuestion.options.length + 1}`];
    setEditingQuestion({
      ...editingQuestion,
      options: updatedOptions
    });
  };
  
  // Remove an option from the current editing question
  const handleRemoveOption = (optionIndex) => {
    if (editingQuestion.options.length <= 2) return; // Keep at least 2 options
    
    const updatedOptions = editingQuestion.options.filter((_, index) => index !== optionIndex);
    
    // If we're removing the correct answer, set the first option as correct
    let updatedCorrectAnswer = editingQuestion.correctAnswer;
    if (updatedCorrectAnswer === editingQuestion.options[optionIndex]) {
      updatedCorrectAnswer = updatedOptions[0];
    }
    
    setEditingQuestion({
      ...editingQuestion,
      options: updatedOptions,
      correctAnswer: updatedCorrectAnswer
    });
  };
  
  // Save current editing question
  const handleSaveQuestion = () => {
    const newQuestions = [...questions];
    newQuestions[currentIndex] = editingQuestion;
    setQuestions(newQuestions);
    setShowQuestionModal(false);
  };
  
  // Save current editing flashcard
  const handleSaveFlashcard = () => {
    const newFlashcards = [...flashcards];
    newFlashcards[currentIndex] = editingFlashcard;
    setFlashcards(newFlashcards);
    setShowFlashcardModal(false);
  };
  
  // Save the entire quiz
  const handleSaveQuiz = async () => {
    let quiz;
    
    if (quizType === "flashcards") {
      // Create a properly formatted flashcards object
      quiz = {
        title: quizTitle,
        type: "flashcards",
        questions: flashcards.map((card, index) => ({
          id: card.id || `f${index + 1}`,
          question: card.front,
          answer: card.back
        }))
      };
    } else {
      // Create a properly formatted multiple choice quiz object
      quiz = {
        title: quizTitle,
        type: "multiple_choice",
        questions: questions.map((q, index) => ({
          id: q.id || `q${index + 1}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || ""
        }))
      };
    }
    
    try {
      // First set the quiz in the context
      setGeneratedQuiz(quiz);
      
      // Then save it using the context's save method
      // Need setTimeout to ensure state update has happened
      setTimeout(async () => {
        const result = await saveQuizToBackend();
        if (result) {
          navigate(`/quiz/preview/${result.quizId}`);
        }
      }, 0);
    } catch (error) {
      console.error("Error saving quiz:", error);
      // You might want to show an error message to the user
    }
  };

  // Render appropriate content based on quiz type
  const renderContent = () => {
    if (quizType === "flashcards") {
      return (
        <>
          {/* Flashcards */}
          {flashcards.map((flashcard, index) => (
            <Card key={flashcard.id} className="mb-3 border-start border-primary border-5">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Flashcard {index + 1}</h5>
                  <div>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2"
                      onClick={() => handleEditFlashcard(index)}
                    >
                      <BsPencil /> Rediger
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteFlashcard(index)}
                    >
                      <BsTrash />
                    </Button>
                  </div>
                </div>
                
                <Card className="mb-2 bg-light">
                  <Card.Header className="bg-primary text-white">Forside (spørgsmål)</Card.Header>
                  <Card.Body>{flashcard.front}</Card.Body>
                </Card>
                
                <Card>
                  <Card.Header className="bg-success text-white">Bagside (svar)</Card.Header>
                  <Card.Body>{flashcard.back}</Card.Body>
                </Card>
              </Card.Body>
            </Card>
          ))}
          
          {/* Add Flashcard Button */}
          <div className="d-grid">
            <Button 
              variant="primary" 
              className="mt-3"
              onClick={handleAddFlashcard}
            >
              <BsPlus className="me-2" /> Tilføj Flashcard
            </Button>
          </div>
          
          {/* Flashcard Editing Modal */}
          <Modal 
            show={showFlashcardModal} 
            onHide={() => setShowFlashcardModal(false)}
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>Rediger Flashcard</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Forside (spørgsmål)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={editingFlashcard.front}
                    onChange={(e) => setEditingFlashcard({...editingFlashcard, front: e.target.value})}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Bagside (svar)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={editingFlashcard.back}
                    onChange={(e) => setEditingFlashcard({...editingFlashcard, back: e.target.value})}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowFlashcardModal(false)}>
                Annuller
              </Button>
              <Button variant="primary" onClick={handleSaveFlashcard}>
                Gem ændringer
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      );
    } else {
      return (
        <>
          {/* Multiple Choice Questions */}
          {questions.map((question, index) => (
            <Card key={question.id} className="mb-3 border-start border-primary border-5">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Spørgsmål {index + 1}</h5>
                  <div>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2"
                      onClick={() => handleEditQuestion(index)}
                    >
                      <BsPencil /> Rediger
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteQuestion(index)}
                    >
                      <BsTrash />
                    </Button>
                  </div>
                </div>
                
                <div className="mb-3">{question.question}</div>
                
                <div className="d-grid gap-2">
                  {question.options.map((option, optionIndex) => (
                    <Button
                      key={optionIndex}
                      variant={option === question.correctAnswer ? "success" : "outline-secondary"}
                      className="text-start"
                      disabled
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          ))}
          
          {/* Add Question Button */}
          <div className="d-grid">
            <Button 
              variant="primary" 
              className="mt-3"
              onClick={handleAddQuestion}
            >
              <BsPlus className="me-2" /> Tilføj Spørgsmål
            </Button>
          </div>
          
          {/* Question Editing Modal */}
          <Modal 
            show={showQuestionModal} 
            onHide={() => setShowQuestionModal(false)}
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>Rediger Spørgsmål</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Spørgsmålstekst</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={editingQuestion.question}
                    onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Svarmuligheder</Form.Label>
                  {editingQuestion.options?.map((option, index) => (
                    <div key={index} className="d-flex align-items-center mb-2">
                      <Form.Check
                        type="radio"
                        name="correctAnswer"
                        id={`option-${index}`}
                        checked={editingQuestion.correctAnswer === option}
                        onChange={() => setEditingQuestion({...editingQuestion, correctAnswer: option})}
                      />
                      <Form.Control
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="mx-2"
                      />
                      {editingQuestion.options.length > 2 && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <BsTrash />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="mt-2"
                    onClick={handleAddOption}
                  >
                    <BsPlus /> Tilføj svarmulighed
                  </Button>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowQuestionModal(false)}>
                Annuller
              </Button>
              <Button variant="primary" onClick={handleSaveQuestion}>
                Gem ændringer
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      );
    }
  };

  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/platform" className="text-decoration-none">
          <BsArrowLeft className="me-2" /> Tilbage til modul
        </Link>
        <Button variant="success" onClick={handleSaveQuiz}>
          Gem
        </Button>
      </div>
      
      {/* Quiz Title */}
      <div className="mb-4">
        <Form.Control
          type="text"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          className="form-control-lg border-0 bg-transparent"
          style={{ fontSize: "2.5rem", fontWeight: "bold" }}
        />
        <div className="text-muted mb-4">
          {quizType === "flashcards" ? "Flashcards" : "Multiple Choice Quiz"}
        </div>
      </div>
      
      {/* Render questions or flashcards based on type */}
      {renderContent()}
    </Container>
  );
};

export default ManualQuizCreation; 