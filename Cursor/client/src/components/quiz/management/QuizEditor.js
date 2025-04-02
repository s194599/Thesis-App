import React, { useState, useEffect } from "react";
import {
  Container,
  Button,
  Form,
  Spinner,
  Dropdown,
  Alert,
} from "react-bootstrap";
import { BsArrowLeft, BsPlusCircle, BsTextLeft, BsRobot } from "react-icons/bs";
import { useQuizContext } from "../../../context/QuizContext";
import { QuizQuestion } from "../display";

const QuizEditor = () => {
  const {
    editingQuiz,
    isEditing,
    startEditing,
    saveQuiz,
    cancelEditing,
    addQuestionManually,
    generateQuestion,
    generatingQuestion,
    error,
    generatedQuiz,
    loadSampleQuiz,
  } = useQuizContext();

  // Local states for quiz title and description
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);

  // If there's no quiz data and not editing, load the sample quiz
  useEffect(() => {
    if (!generatedQuiz && !isEditing) {
      loadSampleQuiz();
    }
  }, [generatedQuiz, isEditing, loadSampleQuiz]);

  // Start editing if not already
  useEffect(() => {
    if (!isEditing && generatedQuiz) {
      startEditing();
    }
  }, [isEditing, generatedQuiz, startEditing]);

  // Update local state when editingQuiz changes
  useEffect(() => {
    if (editingQuiz) {
      setTitle(editingQuiz.title || "");
      setDescription(editingQuiz.description || "");
    }
  }, [editingQuiz]);

  // Save title changes
  const saveTitle = () => {
    if (editingQuiz) {
      editingQuiz.title = title;
      setIsTitleEditing(false);
    }
  };

  // Save description changes
  const saveDescription = () => {
    if (editingQuiz) {
      editingQuiz.description = description;
      setIsDescriptionEditing(false);
    }
  };

  // If not editing yet, show loading
  if (!isEditing || !editingQuiz) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading quiz for editing...</p>
      </div>
    );
  }

  return (
    <Container className="my-4">
      {/* Header with back and save buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button
          variant="light"
          className="d-flex align-items-center"
          onClick={cancelEditing}
        >
          <BsArrowLeft className="me-1" /> Back
        </Button>
        <Button variant="success" onClick={saveQuiz}>
          Save
        </Button>
      </div>

      {/* Error message if any */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Quiz Title */}
      <div className="mb-4">
        {isTitleEditing ? (
          <div>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
              className="form-control-lg"
              autoFocus
            />
            <div className="mt-2 d-flex justify-content-end">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={() => {
                  setTitle(editingQuiz.title || "");
                  setIsTitleEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button variant="outline-primary" size="sm" onClick={saveTitle}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <h1
            className="display-6 mb-0"
            onClick={() => setIsTitleEditing(true)}
            style={{ cursor: "pointer" }}
          >
            {title || "Untitled Quiz"}
            <Button
              variant="link"
              className="text-muted p-0 ms-2 align-baseline"
              style={{ fontSize: "1rem" }}
              onClick={(e) => {
                e.stopPropagation();
                setIsTitleEditing(true);
              }}
            >
              <BsTextLeft />
            </Button>
          </h1>
        )}
      </div>

      {/* Quiz Description */}
      <div className="mb-4">
        {isDescriptionEditing ? (
          <div>
            <Form.Control
              as="textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quiz description (optional)"
            />
            <div className="mt-2 d-flex justify-content-end">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={() => {
                  setDescription(editingQuiz.description || "");
                  setIsDescriptionEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={saveDescription}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p
            className="text-muted"
            onClick={() => setIsDescriptionEditing(true)}
            style={{ cursor: "pointer" }}
          >
            {description || "Add a description for this quiz"}
            <Button
              variant="link"
              className="text-muted p-0 ms-2 align-baseline"
              style={{ fontSize: "0.875rem" }}
              onClick={(e) => {
                e.stopPropagation();
                setIsDescriptionEditing(true);
              }}
            >
              <BsTextLeft />
            </Button>
          </p>
        )}
      </div>

      {/* Questions */}
      <div className="quiz-questions mb-4">
        <h5 className="mb-3">Questions</h5>
        {editingQuiz.questions.map((question, index) => (
          <QuizQuestion key={question.id} question={question} index={index} />
        ))}
      </div>

      {/* Add Question Button */}
      <div className="mt-4 mb-5">
        <Dropdown>
          <Dropdown.Toggle
            variant="primary"
            id="add-question-dropdown"
            className="d-flex align-items-center"
          >
            <BsPlusCircle className="me-2" /> Add Question
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item onClick={addQuestionManually}>
              <BsTextLeft className="me-2" /> Add Manually
            </Dropdown.Item>
            <Dropdown.Item
              onClick={generateQuestion}
              disabled={generatingQuestion}
            >
              <BsRobot className="me-2" />
              {generatingQuestion ? "Generating..." : "Generate with AI"}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {generatingQuestion && (
          <div className="mt-3 d-flex align-items-center text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Generating new question with AI...
          </div>
        )}
      </div>
    </Container>
  );
};

export default QuizEditor;
