import React, { useState, useEffect } from 'react';
import { Card, Form, Button, InputGroup, Badge } from 'react-bootstrap';
import { BsPencil, BsTrash, BsCheck, BsX } from 'react-icons/bs';
import { useQuizContext } from '../context/QuizContext';

const QuizQuestion = ({ question, index }) => {
  const { 
    updateQuestion, 
    updateOption, 
    toggleCorrectAnswer, 
    deleteQuestion 
  } = useQuizContext();

  // Local editing states
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [isEditingOptions, setIsEditingOptions] = useState(false);
  const [isEditingExplanation, setIsEditingExplanation] = useState(false);
  
  // Local values for controlled inputs
  const [questionText, setQuestionText] = useState(question.question);
  const [options, setOptions] = useState([...question.options]);
  
  // Support both legacy correctAnswer and new correctAnswers format
  const [correctAnswers, setCorrectAnswers] = useState(
    question.correctAnswers || (question.correctAnswer ? [question.correctAnswer] : [])
  );
  
  const [explanation, setExplanation] = useState(question.explanation || '');

  // Update local state when question changes
  useEffect(() => {
    setQuestionText(question.question);
    setOptions([...question.options]);
    setCorrectAnswers(
      question.correctAnswers || (question.correctAnswer ? [question.correctAnswer] : [])
    );
    setExplanation(question.explanation || '');
  }, [question]);

  // Save question text
  const saveQuestionText = () => {
    updateQuestion(question.id, 'question', questionText);
    setIsEditingQuestion(false);
  };

  // Save options and correct answers
  const saveOptions = () => {
    // Update each option
    options.forEach((option, idx) => {
      updateOption(question.id, idx, option);
    });
    
    // Make sure all correctAnswers are in the options
    const validCorrectAnswers = correctAnswers.filter(answer => 
      options.includes(answer)
    );
    
    // Ensure there's at least one correct answer
    if (validCorrectAnswers.length === 0 && options.length > 0) {
      validCorrectAnswers.push(options[0]);
    }
    
    // Update correctAnswers in the question
    updateQuestion(question.id, 'correctAnswers', validCorrectAnswers);
    setCorrectAnswers(validCorrectAnswers);
    
    setIsEditingOptions(false);
  };

  // Save explanation
  const saveExplanation = () => {
    updateQuestion(question.id, 'explanation', explanation);
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
    const newOptions = [...options, `Option ${options.length + 1}`];
    setOptions(newOptions);
  };

  // Handle removing an option
  const removeOption = (index) => {
    if (options.length <= 2) return; // Maintain at least 2 options
    
    const newOptions = options.filter((_, idx) => idx !== index);
    setOptions(newOptions);
    
    // Remove the option from correctAnswers if it was correct
    if (correctAnswers.includes(options[index])) {
      const newCorrectAnswers = correctAnswers.filter(answer => 
        answer !== options[index]
      );
      setCorrectAnswers(newCorrectAnswers.length > 0 ? newCorrectAnswers : [newOptions[0]]);
    }
  };

  // Handle toggling an option as correct/incorrect
  const handleToggleCorrectAnswer = (option) => {
    // Check if removing this option would leave no correct answers
    if (correctAnswers.includes(option) && correctAnswers.length === 1) {
      return; // Don't allow removing the last correct answer
    }
    
    // Call the context function to update the quiz data
    toggleCorrectAnswer(question.id, option);
    
    // Update local state to match what will be in the context
    // This gives immediate UI feedback without waiting for the next render
    if (correctAnswers.includes(option)) {
      setCorrectAnswers(prev => prev.filter(a => a !== option));
    } else {
      setCorrectAnswers(prev => [...prev, option]);
    }
  };

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Question {index + 1}</strong>
          {!isEditingOptions && correctAnswers.length > 1 && (
            <Badge bg="info" className="ms-2">Multiple Answers</Badge>
          )}
        </div>
        <Button 
          variant="outline-danger" 
          size="sm"
          onClick={() => deleteQuestion(question.id)}
        >
          <BsTrash /> Delete
        </Button>
      </Card.Header>
      
      <Card.Body>
        {/* Question Text */}
        {isEditingQuestion ? (
          <div className="mb-3">
            <Form.Control 
              as="textarea" 
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              autoFocus
            />
            <div className="mt-2 d-flex justify-content-end">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="me-2"
                onClick={() => {
                  setQuestionText(question.question);
                  setIsEditingQuestion(false);
                }}
              >
                <BsX /> Cancel
              </Button>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={saveQuestionText}
              >
                <BsCheck /> Save
              </Button>
            </div>
          </div>
        ) : (
          <Card.Title 
            className="d-flex justify-content-between align-items-start"
            onClick={() => setIsEditingQuestion(true)}
            style={{ cursor: 'pointer' }}
          >
            <div>{question.question}</div>
            <Button 
              variant="link" 
              size="sm" 
              className="text-muted p-0 ms-2"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingQuestion(true);
              }}
            >
              <BsPencil />
            </Button>
          </Card.Title>
        )}
        
        {/* Answer Options */}
        <div className="mt-4">
          <div className="d-flex justify-content-between mb-2">
            <h6>Answer Options</h6>
            {!isEditingOptions && (
              <Button 
                variant="link" 
                size="sm" 
                className="p-0"
                onClick={() => setIsEditingOptions(true)}
              >
                <BsPencil /> Edit Options
              </Button>
            )}
          </div>
          
          {isEditingOptions ? (
            <div>
              <div className="alert alert-info small">
                <strong>Note:</strong> Check multiple options to allow multiple correct answers.
              </div>
              
              {options.map((option, optionIndex) => (
                <InputGroup className="mb-2" key={optionIndex}>
                  <Form.Control 
                    value={option}
                    onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                  />
                  <InputGroup.Text className="bg-white">
                    <Form.Check
                      type="checkbox"
                      checked={correctAnswers.includes(option)}
                      onChange={() => handleToggleCorrectAnswer(option)}
                      label="Correct"
                    />
                  </InputGroup.Text>
                  <Button 
                    variant="outline-danger"
                    onClick={() => removeOption(optionIndex)}
                    disabled={options.length <= 2}
                  >
                    <BsTrash />
                  </Button>
                </InputGroup>
              ))}
              
              <div className="mt-2 d-flex justify-content-between">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={addOption}
                >
                  + Add Option
                </Button>
                
                <div>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="me-2"
                    onClick={() => {
                      setOptions([...question.options]);
                      setCorrectAnswers(
                        question.correctAnswers || 
                        (question.correctAnswer ? [question.correctAnswer] : [])
                      );
                      setIsEditingOptions(false);
                    }}
                  >
                    <BsX /> Cancel
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={saveOptions}
                  >
                    <BsCheck /> Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {question.options.map((option, optionIndex) => {
                // Support both correctAnswer and correctAnswers formats
                const isCorrect = question.correctAnswers 
                  ? question.correctAnswers.includes(option)
                  : option === question.correctAnswer;
                  
                return (
                  <div 
                    key={optionIndex} 
                    className={`mb-2 p-2 border rounded ${
                      isCorrect ? 'border-success bg-light' : ''
                    }`}
                  >
                    <Form.Check
                      type={question.correctAnswers && question.correctAnswers.length > 1 ? "checkbox" : "radio"}
                      id={`q${index}-opt${optionIndex}`}
                      name={`question-${index}`}
                      label={option}
                      checked={isCorrect}
                      readOnly
                    />
                    {isCorrect && (
                      <Badge bg="success" className="ms-2">Correct Answer</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Explanation */}
        <div className="mt-4">
          <div className="d-flex justify-content-between">
            <h6>Explanation</h6>
            {!isEditingExplanation && (
              <Button 
                variant="link" 
                size="sm" 
                className="p-0"
                onClick={() => setIsEditingExplanation(true)}
              >
                <BsPencil /> Edit
              </Button>
            )}
          </div>
          
          {isEditingExplanation ? (
            <div>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
              <div className="mt-2 d-flex justify-content-end">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="me-2"
                  onClick={() => {
                    setExplanation(question.explanation || '');
                    setIsEditingExplanation(false);
                  }}
                >
                  <BsX /> Cancel
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={saveExplanation}
                >
                  <BsCheck /> Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted mb-0">
              {question.explanation || 'No explanation provided.'}
            </p>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default QuizQuestion; 