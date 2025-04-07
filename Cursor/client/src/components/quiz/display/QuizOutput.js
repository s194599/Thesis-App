import React, { useState } from "react";
import { Card, Button, Form, Spinner, Modal } from "react-bootstrap";
import { useQuizContext } from "../../../context/QuizContext";
import { BsPencilSquare, BsCheckCircle, BsTypeH1, BsPlus } from "react-icons/bs";
import { QuizEditor } from "../management";
import { useNavigate } from "react-router-dom";

const QuizOutput = () => {
  const navigate = useNavigate();
  const {
    generatedQuiz,
    resetForm,
    isEditing,
    startEditing,
    saveQuizToBackend,
    isSaving,
    saveSuccess,
    setGeneratedQuiz,
  } = useQuizContext();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isAddingToModule, setIsAddingToModule] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // If in editing mode, show the QuizEditor component
  if (isEditing) {
    return <QuizEditor />;
  }

  if (!generatedQuiz) return null;

  const handleTitleClick = () => {
    setEditedTitle(generatedQuiz.title || "");
    setIsEditingTitle(true);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (editedTitle.trim()) {
      setGeneratedQuiz({
        ...generatedQuiz,
        title: editedTitle.trim(),
      });
    }
  };

  const handleTitleChange = (e) => {
    setEditedTitle(e.target.value);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      setIsEditingTitle(false);
      if (editedTitle.trim()) {
        setGeneratedQuiz({
          ...generatedQuiz,
          title: editedTitle.trim(),
        });
      }
    }
  };

  const renderQuizQuestions = () => {
    return generatedQuiz.questions.map((question, questionIndex) => (
      <div
        className="bg-white rounded shadow-sm mb-4 overflow-hidden"
        key={question.id || questionIndex}
      >
        {/* Question header with number */}
        <div className="d-flex align-items-center py-2 px-3 bg-light border-bottom">
          <div
            className="bg-secondary rounded-circle d-flex justify-content-center align-items-center me-3"
            style={{ width: "32px", height: "32px", minWidth: "32px" }}
          >
            <span className="text-white fw-bold">{questionIndex + 1}</span>
          </div>
          <div className="fw-normal">{question.question}</div>
        </div>

        {/* Options with letters */}
        <div className="p-3">
          {question.options.map((option, optionIndex) => {
            const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
            const letter =
              optionIndex < letters.length
                ? letters[optionIndex]
                : `Option ${optionIndex + 1}`;
            const isCorrect = option === question.correctAnswer;

            return (
              <div
                key={optionIndex}
                className={`d-flex align-items-center mb-2 py-2 px-3 rounded ${
                  isCorrect ? "bg-light" : ""
                }`}
              >
                <div
                  className={`rounded-circle d-flex justify-content-center align-items-center me-3 ${
                    isCorrect ? "bg-success" : "bg-light border"
                  }`}
                  style={{ width: "28px", height: "28px", minWidth: "28px" }}
                >
                  <span
                    className={isCorrect ? "text-white" : "text-secondary"}
                    style={{ fontSize: "14px" }}
                  >
                    {letter}
                  </span>
                </div>
                <div>{option}</div>
              </div>
            );
          })}
        </div>

        {/* Explanation section */}
        {question.explanation && (
          <div className="bg-light p-3 border-top">
            <p className="mb-0">
              <strong>Explanation</strong>
            </p>
            <p className="mb-0 text-secondary">{question.explanation}</p>
          </div>
        )}
      </div>
    ));
  };

  // Handle the save quiz action
  const handleSaveQuiz = async () => {
    await saveQuizToBackend();
  };

  // Handle the save and add to module action
  const handleSaveAndAddToModule = async () => {
    setIsAddingToModule(true);
    try {
      // Check if the quiz is already saved
      const isSavedQuiz = !!generatedQuiz.quizId || !!generatedQuiz.id;
      let savedQuiz = null;
      
      if (!isSavedQuiz) {
        // Save the quiz first if not already saved
        savedQuiz = await saveQuizToBackend();
        if (!savedQuiz) {
          throw new Error('Failed to save quiz');
        }
      } else {
        // Quiz is already saved
        savedQuiz = {
          quizId: generatedQuiz.quizId || generatedQuiz.id
        };
      }
      
      const quizDocuments = localStorage.getItem('quizDocuments');
      if (quizDocuments) {
        const { moduleId } = JSON.parse(quizDocuments);
        
        // Create a new activity for the module
        const response = await fetch('/api/store-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            moduleId: moduleId,
            title: generatedQuiz.title,
            type: 'quiz',
            quizId: savedQuiz.quizId,
            completed: false
          }),
        });
        
        if (response.ok) {
          // Clear the stored documents
          localStorage.removeItem('quizDocuments');
          // Navigate back to the module
          navigate('/platform');
        } else {
          throw new Error('Failed to add quiz to module');
        }
      } else {
        // If no module ID found, just redirect to platform
        navigate('/platform');
      }
    } catch (error) {
      console.error('Error adding quiz to module:', error);
      // You may want to show an error message to the user here
    } finally {
      setIsAddingToModule(false);
    }
  };

  // Handle deleting a quiz
  const handleDeleteQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${generatedQuiz.quizId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Navigate back to platform after successful deletion
        navigate('/platform');
      } else {
        console.error('Error deleting quiz:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  // Update buttons based on quiz already being saved
  const isSavedQuiz = !!generatedQuiz.quizId || !!generatedQuiz.id;
  
  // Check if we're coming from a module (for adding to module)
  const isFromModule = !!localStorage.getItem('quizDocuments');

  return (
    <div className="mt-4 p-4 bg-light">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div className="flex-grow-1 me-3">
          {isEditingTitle ? (
            <input
              type="text"
              className="form-control form-control-lg"
              value={editedTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              placeholder="Enter quiz title"
              style={{ width: "100%" }}
            />
          ) : (
            <h2
              className="mb-0 editable-title quiz-output-title"
              onClick={handleTitleClick}
            >
              {generatedQuiz.title || "Click to add title"}
              <span className="editable-title-hint">Click to edit</span>
            </h2>
          )}

          {generatedQuiz.description && (
            <p className="text-muted mt-2 mb-0">{generatedQuiz.description}</p>
          )}
        </div>

        <div className="d-flex flex-column flex-md-row">
          <Button
            variant="outline-primary"
            size="sm"
            className="me-md-2 mb-2 mb-md-0"
            onClick={startEditing}
          >
            <BsPencilSquare className="me-1" /> Edit Quiz
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={resetForm}>
            Create New Quiz
          </Button>
        </div>
      </div>

      <div className="quiz-questions">{renderQuizQuestions()}</div>

      <div className="mt-4 d-flex justify-content-end gap-2">
        {/* Check if quiz is being viewed from a saved state (has quizId) */}
        {isSavedQuiz && (
          <Button 
            variant="outline-danger" 
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Quiz
          </Button>
        )}
        
        <Button variant="outline-secondary">Download as PDF</Button>
        
        {/* Streamlined save buttons logic */}
        {isFromModule ? (
          // When coming from a module, just show a single button
          <Button
            variant="primary"
            onClick={isSavedQuiz ? handleSaveAndAddToModule : handleSaveQuiz}
            disabled={isSaving || isAddingToModule}
          >
            {isSaving ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Saving...
              </>
            ) : isAddingToModule ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Adding to Module...
              </>
            ) : saveSuccess && !isSavedQuiz ? (
              // Show Add to Module after saving
              <>
                <BsPlus className="me-2" />
                Add to Module
              </>
            ) : (
              // Initial state or when adding a new quiz
              <>
                {isSavedQuiz ? (
                  <>
                    <BsPlus className="me-2" />
                    Add to Module
                  </>
                ) : (
                  "Save Quiz"
                )}
              </>
            )}
          </Button>
        ) : (
          // When not coming from a module, just show Save Quiz
          <Button
            variant="primary"
            onClick={handleSaveQuiz}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <BsCheckCircle className="me-2" />
                Saved
              </>
            ) : (
              "Save Quiz"
            )}
          </Button>
        )}
      </div>
      
      {/* Delete confirmation modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Quiz</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this quiz? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteQuiz}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default QuizOutput;
