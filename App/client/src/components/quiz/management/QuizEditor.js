import React, { useState, useEffect } from "react";
import {
  Container,
  Button,
  Form,
  Spinner,
  Dropdown,
  Alert,
} from "react-bootstrap";
import {
  BsArrowLeft,
  BsPlusCircle,
  BsTextLeft,
  BsRobot,
  BsCheckCircle,
} from "react-icons/bs";
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
    isSaving,
    saveSuccess,
  } = useQuizContext();

  // Local states for quiz title and description
  const [title, setTitle] = useState("");
  // const [description, setDescription] = useState("");
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  // const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);

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
  // useEffect(() => {
  //   if (editingQuiz) {
  //     setTitle(editingQuiz.title || "");
  //     setDescription(editingQuiz.description || "");
  //   }
  // }, [editingQuiz]);

  // Save title changes
  const saveTitle = () => {
    if (editingQuiz) {
      editingQuiz.title = title;
      setIsTitleEditing(false);
    }
  };

  // // Save description changes
  // const saveDescription = () => {
  //   if (editingQuiz) {
  //     editingQuiz.description = description;
  //     setIsDescriptionEditing(false);
  //   }
  // };

  // Handle save button click
  const handleSaveClick = async () => {
    if (editingQuiz) {
      await saveQuiz();
    }
  };

  // If not editing yet, show loading
  if (!isEditing || !editingQuiz) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Indlæser...</span>
        </Spinner>
        <p className="mt-2">Indlæser quiz til redigering...</p>
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
          disabled={isSaving}
        >
          <BsArrowLeft className="me-1" /> Tilbage
        </Button>
        <Button variant="success" onClick={handleSaveClick} disabled={isSaving}>
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
            "Save"
          )}
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
              placeholder="Indtast quiz titel"
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
                Annuller
              </Button>
              <Button variant="outline-primary" size="sm" onClick={saveTitle}>
                Gem
              </Button>
            </div>
          </div>
        ) : (
          <h1
            className="display-6 mb-0"
            onClick={() => setIsTitleEditing(true)}
            style={{ cursor: "pointer" }}
          >
            {title || "Unavngiven Quiz"}
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

      {/* Quiz Description
      <div className="mb-4">
        {isDescriptionEditing ? (
          <div>
            <Form.Control
              as="textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Indtast quiz beskrivelse (valgfrit)"
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
                Annuller
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={saveDescription}
              >
                Gem
              </Button>
            </div>
          </div>
        ) : (
          <p
            className="text-muted"
            onClick={() => setIsDescriptionEditing(true)}
            style={{ cursor: "pointer" }}
          >
            {description || "Tilføj en beskrivelse til denne quiz"}
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
      </div> */}

      {/* Questions */}
      <div className="quiz-questions mb-4">
        {/* <h5 className="mb-3">Spørgsmål</h5> */}
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
            disabled={isSaving}
          >
            <BsPlusCircle className="me-2" /> Tilføj Spørgsmål
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item onClick={addQuestionManually}>
              <BsTextLeft className="me-2" /> Tilføj Manuelt
            </Dropdown.Item>
            <Dropdown.Item
              onClick={generateQuestion}
              disabled={generatingQuestion}
            >
              <BsRobot className="me-2" />
              {generatingQuestion ? "Genererer..." : "Generer med AI"}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {generatingQuestion && (
          <div className="mt-3 d-flex align-items-center text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Genererer nyt spørgsmål med AI...
          </div>
        )}
      </div>
    </Container>
  );
};

export default QuizEditor;
