import React, { useState } from 'react';
import { Card, Form, Button, InputGroup, Badge } from 'react-bootstrap';
import { BsPencil, BsTrash, BsCheck, BsX } from 'react-icons/bs';
import { useQuizContext } from '../context/QuizContext';

const QuizQuestion = ({ question, index }) => {
  const { 
    updateQuestion, 
    updateOption, 
    updateCorrectAnswer, 
    deleteQuestion 
  } = useQuizContext();

  // Local editing states
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [isEditingOptions, setIsEditingOptions] = useState(false);
  const [isEditingExplanation, setIsEditingExplanation] = useState(false);
  
  // Local values for controlled inputs
  const [questionText, setQuestionText] = useState(question.question);
  const [options, setOptions] = useState([...question.options]);
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer);
  const [explanation, setExplanation] = useState(question.explanation || '');

  // Save question text
  const saveQuestionText = () => {
    updateQuestion(question.id, 'question', questionText);
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
    
    // If removing the correct answer, set first option as correct
    if (options[index] === correctAnswer) {
      setCorrectAnswer(newOptions[0]);
    }
  };

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Question {index + 1}</strong>
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
              {options.map((option, optionIndex) => (
                <InputGroup className="mb-2" key={optionIndex}>
                  <Form.Control 
                    value={option}
                    onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                  />
                  <InputGroup.Text className="bg-white">
                    <Form.Check
                      type="radio"
                      name={`correct-answer-${question.id}`}
                      checked={option === correctAnswer}
                      onChange={() => setCorrectAnswer(option)}
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
                      setCorrectAnswer(question.correctAnswer);
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
              {question.options.map((option, optionIndex) => (
                <div 
                  key={optionIndex} 
                  className={`mb-2 p-2 border rounded ${
                    option === question.correctAnswer ? 'border-success bg-light' : ''
                  }`}
                >
                  <Form.Check
                    type="radio"
                    id={`q${index}-opt${optionIndex}`}
                    name={`question-${index}`}
                    label={option}
                    checked={option === question.correctAnswer}
                    readOnly
                  />
                  {option === question.correctAnswer && (
                    <Badge bg="success" className="ms-2">Correct Answer</Badge>
                  )}
                </div>
              ))}
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