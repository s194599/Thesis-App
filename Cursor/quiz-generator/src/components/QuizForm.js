import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useQuizContext } from '../context/QuizContext';
import InputTypeSelector from './InputTypeSelector';
import QuizInputSection from './QuizInputSection';
import QuestionTypeSelector from './QuestionTypeSelector';
import StudentLevelSelector from './StudentLevelSelector';
import LanguageSelector from './LanguageSelector';
import LoadingSpinner from './LoadingSpinner';
import QuizOutput from './QuizOutput';
import { generateQuiz, uploadFile, fetchUrlContent, checkStatus } from '../services/api';

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
  
  // Local state for API status
  const [apiStatus, setApiStatus] = useState({
    checking: true,
    online: false,
    ollama_available: false,
    message: 'Checking API status...'
  });
  
  // Check API status when component mounts
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const status = await checkStatus();
        setApiStatus({
          checking: false,
          online: status.status === 'online',
          ollama_available: status.ollama_available,
          message: status.message
        });
      } catch (err) {
        setApiStatus({
          checking: false,
          online: false,
          ollama_available: false,
          message: 'Could not connect to API server'
        });
      }
    };
    
    checkApiStatus();
  }, []);
  
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
    
    // First check if Ollama is available
    if (!apiStatus.ollama_available) {
      setError('Ollama LLM is not available. Please start it with "ollama serve" and refresh the page.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // This is the real implementation that connects to the backend
      let contentToProcess = '';
      
      // Process different input types
      switch (formData.inputType) {
        case 'topic':
          // For topic-based quizzes, we'll send the topic directly
          contentToProcess = formData.topic;
          break;
          
        case 'text':
          // For text-based quizzes, we'll send the text directly
          contentToProcess = formData.text;
          break;
          
        case 'webpage':
          // Fetch webpage content from the backend
          const urlData = await fetchUrlContent(formData.url);
          contentToProcess = urlData.content;
          break;
          
        case 'document':
          // For document-based quizzes, we need to upload each file
          // and combine their content
          const fileContents = [];
          
          // Upload each file one by one
          for (const file of formData.files) {
            try {
              const fileData = await uploadFile(file);
              fileContents.push(fileData.content);
            } catch (fileError) {
              console.error(`Error uploading file ${file.name}:`, fileError);
              setError(`Failed to upload file ${file.name}. Please try again.`);
              setLoading(false);
              return;
            }
          }
          
          // Combine the content from all files
          contentToProcess = fileContents.join('\n\n');
          break;
          
        default:
          throw new Error('Invalid input type');
      }
      
      // Prepare data for quiz generation
      const quizRequestData = {
        content: contentToProcess,
        inputType: formData.inputType,
        questionType: formData.questionType,
        studentLevel: formData.studentLevel,
        additionalInstructions: formData.additionalInstructions,
        language: formData.language,
        num_questions: 5 // Default to 5 questions
      };
      
      // Send to backend for quiz generation
      const generatedQuizData = await generateQuiz(quizRequestData);
      
      // Update the state with the generated quiz
      setGeneratedQuiz(generatedQuizData);
      
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError(`Failed to generate quiz: ${err.message || 'Please try again later.'}`);
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
          
          {/* Display API status warning if needed */}
          {!apiStatus.checking && !apiStatus.ollama_available && (
            <Alert variant="warning" className="mb-4">
              <Alert.Heading>LLM Service Not Available</Alert.Heading>
              <p>{apiStatus.message}</p>
              <p className="mb-0">
                Please make sure Ollama is installed and running with the command: <code>ollama serve</code>
              </p>
              <hr />
              <p className="mb-0">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={async () => {
                    setApiStatus({...apiStatus, checking: true, message: 'Rechecking status...'});
                    const status = await checkStatus();
                    setApiStatus({
                      checking: false,
                      online: status.status === 'online',
                      ollama_available: status.ollama_available,
                      message: status.message
                    });
                  }}
                >
                  Check Again
                </Button>
              </p>
            </Alert>
          )}
          
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
              disabled={loading || !isFormValid() || !apiStatus.ollama_available}
            >
              Generate Quiz
            </Button>
            {!apiStatus.ollama_available && (
              <div className="text-center text-muted small">
                <em>Quiz generation requires the Ollama LLM service to be running</em>
              </div>
            )}
          </div>
          
          {/* Loading spinner */}
          <LoadingSpinner loading={loading} />
          
        </Form>
      )}
    </div>
  );
};

export default QuizForm;
