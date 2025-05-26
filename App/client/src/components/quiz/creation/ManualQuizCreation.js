import React, { useState } from "react";
import { Container, Form, Button, Card, InputGroup, Modal } from "react-bootstrap";
import { BsArrowLeft, BsTrash, BsPencil, BsPlus } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { useQuizContext } from "../../../context/QuizContext";

const ManualQuizCreation = () => {
  const navigate = useNavigate();
  const { saveQuizToBackend, setGeneratedQuiz } = useQuizContext();
  
  // State for quiz data
  const [quizTitle, setQuizTitle] = useState("Unavngiven Quiz");
  const [questions, setQuestions] = useState([
    {
      id: 1,
      question: "New Question",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: "Option 1"
    }
  ]);
  
  // State for editing a specific question
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState({
    question: "",
    options: [],
    correctAnswer: ""
  });
  
  // Open modal for editing a question
  const handleEditQuestion = (index) => {
    setCurrentQuestionIndex(index);
    setEditingQuestion({...questions[index]});
    setShowQuestionModal(true);
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
  
  // Delete a question
  const handleDeleteQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
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
    newQuestions[currentQuestionIndex] = editingQuestion;
    setQuestions(newQuestions);
    setShowQuestionModal(false);
  };
  
  // Save the entire quiz
  const handleSaveQuiz = async () => {
    // Create a properly formatted quiz object
    const quiz = {
      title: quizTitle,
      type: "multiple_choice", // Add type at quiz level
      questions: questions.map((q, index) => ({
        id: q.id || `q${index + 1}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ""
      }))
    };
    
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

  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/platform" className="text-decoration-none">
          <BsArrowLeft className="me-2" /> Tilbage til modul
        </Link>
        <Button variant="success" onClick={handleSaveQuiz}>
          Save
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
      </div>
      
      {/* Questions */}
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
                    className="me-2"
                  />
                  <Form.Control
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="me-2"
                  />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <BsTrash />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleAddOption}
                className="mt-2"
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
            Gem Spørgsmål
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManualQuizCreation; 