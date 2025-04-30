import React, { useState, useEffect } from "react";
import { Card, Form, Button, InputGroup, Badge } from "react-bootstrap";
import { BsPencil, BsTrash, BsCheck, BsX, BsPlus } from "react-icons/bs";
import { useQuizContext } from "../../../context/QuizContext";

const QuizQuestion = ({ question, index, onDelete }) => {
  const { updateQuestion, updateOption, updateCorrectAnswer, deleteQuestion } =
    useQuizContext();

  // Local editing states
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [isEditingOptions, setIsEditingOptions] = useState(false);
  const [isEditingExplanation, setIsEditingExplanation] = useState(false);

  // Local values for controlled inputs
  const [questionText, setQuestionText] = useState(question.question);
  const [options, setOptions] = useState(question.options || []);
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer);
  const [explanation, setExplanation] = useState(question.explanation || "");

  useEffect(() => {
    setQuestionText(question.question);
    setOptions(question.options || []);
    setCorrectAnswer(question.correctAnswer);
  }, [question]);

  // Get letter representation for options
  const getLetterForIndex = (optionIndex) => {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    return optionIndex < letters.length
      ? letters[optionIndex]
      : `Mulighed ${optionIndex + 1}`;
  };

  // Save question text
  const saveQuestionText = () => {
    updateQuestion(question.id, "question", questionText);
    setIsEditingQuestion(false);
  };

  // Save options
  const saveOptions = () => {
    // Update each option
    options.forEach((option, idx) => {
      updateOption(question.id, idx, option);
    });

    // Ensure correctAnswer is still in the options
    if (!options.includes(correctAnswer) && options.length > 0) {
      updateCorrectAnswer(question.id, options[0]);
      setCorrectAnswer(options[0]);
    } else {
      updateCorrectAnswer(question.id, correctAnswer);
    }

    setIsEditingOptions(false);
  };

  // Save explanation
  const saveExplanation = () => {
    updateQuestion(question.id, "explanation", explanation);
    setIsEditingExplanation(false);
  };

  // Handle option change
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Handle adding an option
  const addOption = () => {
    const newOptions = [...options, `Mulighed ${options.length + 1}`];
    setOptions(newOptions);
  };

  // Handle removing an option
  const removeOption = (index) => {
    if (options.length <= 2) return; // Maintain at least 2 options

    const newOptions = options.filter((_, idx) => idx !== index);
    setOptions(newOptions);

    // If removing the correct answer, set first option as correct
    if (options[index] === correctAnswer) {
      setCorrectAnswer(newOptions[0]);
    }
  };

  const handleSave = () => {
    updateQuestion(question.id, {
      question: questionText,
      options: options,
      correctAnswer: correctAnswer,
    });
    setIsEditingQuestion(false);
  };

  const handleCancel = () => {
    setQuestionText(question.question);
    setOptions(question.options || []);
    setCorrectAnswer(question.correctAnswer);
    setIsEditingQuestion(false);
  };

  // Special handling for flashcard type questions
  if (question.type === "flashcard") {
    return (
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h5 className="mb-0">Flashcard {index + 1}</h5>
            <div>
              {!isEditingQuestion ? (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={() => setIsEditingQuestion(true)}
                >
                  Rediger
                </Button>
              ) : (
                <div>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2"
                    onClick={handleCancel}
                  >
                    <BsX /> Annuller
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      console.log("Saving flashcard with values:", {
                        id: question.id,
                        question: questionText,
                        correctAnswer: correctAnswer,
                        type: "flashcard"
                      });
                      
                      // Pass the object directly as the second parameter
                      updateQuestion(question.id, {
                        question: questionText,
                        correctAnswer: correctAnswer,
                        type: "flashcard"
                      });
                      
                      setIsEditingQuestion(false);
                    }}
                  >
                    <BsCheck /> Gem
                  </Button>
                </div>
              )}
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => deleteQuestion(question.id)}
              >
                <BsTrash />
              </Button>
            </div>
          </div>

          {isEditingQuestion ? (
            <div>
              <Form.Group className="mb-3">
                <Form.Label>Front (Question)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Back (Answer)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                />
              </Form.Group>
            </div>
          ) : (
            <div>
              <p className="mb-3">
                <strong>Front:</strong> {questionText}
              </p>
              <p className="mb-0">
                <strong>Back:</strong> {correctAnswer}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h5 className="mb-0">Spørgsmål {index + 1}</h5>
          <div>
            {!isEditingQuestion ? (
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={() => setIsEditingQuestion(true)}
              >
                Rediger
              </Button>
            ) : (
              <div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-2"
                  onClick={handleCancel}
                >
                  <BsX /> Annuller
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleSave}
                >
                  <BsCheck /> Gem
                </Button>
              </div>
            )}
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => deleteQuestion(question.id)}
            >
              <BsTrash />
            </Button>
          </div>
        </div>

        {isEditingQuestion ? (
          <div>
            <Form.Group className="mb-3">
              <Form.Label>Spørgsmålstekst</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Svar muligheder</Form.Label>
              {options.map((option, index) => (
                <div key={index} className="d-flex align-items-center mb-2">
                  <Form.Check
                    type="radio"
                    name="correctAnswer"
                    id={`option-${index}`}
                    checked={correctAnswer === option}
                    onChange={() => setCorrectAnswer(option)}
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
                    onClick={() => removeOption(index)}
                  >
                    <BsX />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={addOption}
                className="mt-2"
              >
                <BsPlus /> Tilføj mulighed
              </Button>
            </Form.Group>
          </div>
        ) : (
          <div>
            <p className="mb-3">{questionText}</p>
            <div className="d-grid gap-2">
              {options.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    correctAnswer === option ? "success" : "outline-secondary"
                  }
                  className="text-start"
                  disabled
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default QuizQuestion;
