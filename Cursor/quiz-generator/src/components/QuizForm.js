import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useQuizContext } from '../context/QuizContext';
import InputTypeSelector from './InputTypeSelector';
import QuizInputSection from './QuizInputSection';
import QuestionTypeSelector from './QuestionTypeSelector';
import StudentLevelSelector from './StudentLevelSelector';
import LanguageSelector from './LanguageSelector';
import LoadingSpinner from './LoadingSpinner';
import QuizOutput from './QuizOutput';
import { generateQuiz, uploadFile, fetchUrlContent } from '../services/api';

const QuizForm = () => {
  const { 
    formData, 
    loading, 
    setLoading, 
    setGeneratedQuiz,
    error,
    setError,
    generatedQuiz,
    updateFormData,
    loadSampleQuiz
  } = useQuizContext();
  
  // Local state for form validation
  const [validated, setValidated] = useState(false);
  
  // Check if form is valid for submission
  const isFormValid = () => {
    switch (formData.inputType) {
      case 'topic':
        return formData.topic.trim() !== '';
      case 'text':
        return formData.text.trim() !== '';
      case 'webpage':
        return formData.url.trim() !== '';
      case 'document':
        return formData.files && formData.files.length > 0;
      default:
        return false;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark form as validated to show validation errors
    setValidated(true);
    
    if (!isFormValid()) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Send to backend for quiz generation
      const response = await generateQuiz(formData);
      
      if (response.success) {
        setGeneratedQuiz(response.quiz);
      } else {
        setError(response.error || 'Failed to generate quiz. Please try again.');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError('Failed to generate quiz. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {/* Show quiz output if generated, otherwise show form */}
      {generatedQuiz ? (
        <QuizOutput />
      ) : (
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          
          {/* Display error message if any */}
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}
          
          {/* Input type selection */}
          <InputTypeSelector />
          
          {/* Quiz input section (changes based on selected input type) */}
          <QuizInputSection />
          
          {/* Question type selection */}
          <QuestionTypeSelector />
          
          <hr className="my-4" />
          
          <div className="row">
            <div className="col-md-6">
              {/* Student level selection */}
              <StudentLevelSelector />
            </div>
            <div className="col-md-6">
              {/* Language selection */}
              <LanguageSelector />
            </div>
          </div>
          
          {/* Additional instructions */}
          <div className="mb-4">
            <Form.Group>
              <Form.Label className="fw-bold">Additional Instructions (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter any special instructions for quiz generation (e.g., 'Focus on comprehension', 'Include application-based questions')"
                value={formData.additionalInstructions}
                onChange={(e) => updateFormData('additionalInstructions', e.target.value)}
              />
            </Form.Group>
          </div>
          
          {/* Submit button */}
          <div className="d-grid gap-2 mt-4">
            <Button 
              variant="primary" 
              size="lg" 
              type="submit"
              disabled={loading || !isFormValid()}
            >
              Generate Quiz
            </Button>
          </div>
          
          {/* Loading spinner */}
          <LoadingSpinner loading={loading} />
          
        </Form>
      )}
    </div>
  );
};

export default QuizForm;
