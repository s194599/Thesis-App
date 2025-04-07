import React, { useState } from "react";
import { Card, Button, Form, Spinner } from "react-bootstrap";
import { useQuizContext } from "../../../context/QuizContext";
import {
  BsPencilSquare,
  BsCheckCircle,
  BsTypeH1,
  BsPlus,
} from "react-icons/bs";
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
              <strong>Forklaring</strong>
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
      // Save the quiz first
      const savedQuiz = await saveQuizToBackend();

      if (savedQuiz) {
        const quizDocuments = localStorage.getItem("quizDocuments");
        if (quizDocuments) {
          const { moduleId } = JSON.parse(quizDocuments);

          // Create a new activity for the module
          const response = await fetch("/api/store-activity", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              moduleId: moduleId,
              title: generatedQuiz.title,
              type: "quiz",
              quizId: savedQuiz.quizId,
              completed: false,
            }),
          });

          if (response.ok) {
            // Clear the stored documents
            localStorage.removeItem("quizDocuments");
            // Navigate back to the module
            navigate("/platform");
          } else {
            throw new Error("Failed to add quiz to module");
          }
        } else {
          // If no module ID found, just redirect to platform
          navigate("/platform");
        }
      }
    } catch (error) {
      console.error("Error adding quiz to module:", error);
      // You may want to show an error message to the user here
    } finally {
      setIsAddingToModule(false);
    }
  };

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
              placeholder="Indtast quiz titel"
              style={{ width: "100%" }}
            />
          ) : (
            <h2
              className="mb-0 editable-title quiz-output-title"
              onClick={handleTitleClick}
            >
              {generatedQuiz.title || "Klik for at tilføje titel"}
              <span className="editable-title-hint">Klik for at redigere</span>
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
            <BsPencilSquare className="me-1" /> Rediger Quiz
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={resetForm}>
            Opret Ny Quiz
          </Button>
        </div>
      </div>

      <div className="quiz-questions">{renderQuizQuestions()}</div>

      <div className="mt-4 d-flex justify-content-end gap-2">
        <Button variant="outline-secondary">Download som PDF</Button>
        <Button
          variant="outline-success"
          onClick={handleSaveQuiz}
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
              Gemmer...
            </>
          ) : saveSuccess ? (
            <>
              <BsCheckCircle className="me-1" /> Gemt
            </>
          ) : (
            "Gem Quiz"
          )}
        </Button>
        <Button
          variant="primary"
          onClick={handleSaveAndAddToModule}
          disabled={isSaving || isAddingToModule}
        >
          {isAddingToModule ? (
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
          ) : (
            <>
              <BsPlus className="me-2" />
              Save & Add to Module
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuizOutput;
