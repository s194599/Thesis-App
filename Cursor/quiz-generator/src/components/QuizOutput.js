import React from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import { useQuizContext } from '../context/QuizContext';
import { BsPencilSquare } from 'react-icons/bs';
import QuizEditor from './QuizEditor';

const QuizOutput = () => {
  const { generatedQuiz, resetForm, isEditing, startEditing } = useQuizContext();

  // If in editing mode, show the QuizEditor component
  if (isEditing) {
    return <QuizEditor />;
  }

  if (!generatedQuiz) return null;

  const renderQuizQuestions = () => {
    return generatedQuiz.questions.map((question, questionIndex) => (
      <Card className="mb-3" key={question.id || questionIndex}>
        <Card.Header>
          <strong>Question {questionIndex + 1}</strong>
        </Card.Header>
        <Card.Body>
          <Card.Title>{question.question}</Card.Title>
          <div className="mt-3">
            {question.options.map((option, optionIndex) => (
              <Form.Check
                type="radio"
                id={`q${questionIndex}-opt${optionIndex}`}
                name={`question-${questionIndex}`}
                label={option}
                key={optionIndex}
                className={`mb-2 ${
                  option === question.correctAnswer ? 'border-start border-success border-3 ps-2' : ''
                }`}
                disabled
                checked={option === question.correctAnswer}
              />
            ))}
          </div>
          
          {question.explanation && (
            <div className="mt-3 pt-2 border-top">
              <p className="text-muted mb-0">
                <small><strong>Explanation:</strong> {question.explanation}</small>
              </p>
            </div>
          )}
        </Card.Body>
      </Card>
    ));
  };

  return (
    <div className="mt-4 p-4 border rounded bg-light">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">{generatedQuiz.title || 'Generated Quiz'}</h4>
        <div>
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="me-2"
            onClick={startEditing}
          >
            <BsPencilSquare className="me-1" /> Edit Quiz
          </Button>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={resetForm}
          >
            Create New Quiz
          </Button>
        </div>
      </div>
      
      {generatedQuiz.description && (
        <p className="text-muted mb-4">{generatedQuiz.description}</p>
      )}
      
      <div className="quiz-questions">
        {renderQuizQuestions()}
      </div>
      
      <div className="mt-4 d-flex justify-content-end gap-2">
        <Button variant="outline-secondary">
          Download as PDF
        </Button>
        <Button variant="outline-success">
          Save Quiz
        </Button>
      </div>
    </div>
  );
};

export default QuizOutput;
