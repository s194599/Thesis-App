import React from 'react';
import { Form } from 'react-bootstrap';
import { useQuizContext } from '../context/QuizContext';
import FileUploader from './FileUploader';

const QuizInputSection = () => {
  const { formData, updateFormData } = useQuizContext();

  // Render different input sections based on the selected input type
  const renderInputSection = () => {
    switch (formData.inputType) {
      case 'topic':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Enter Topic</Form.Label>
            <Form.Control
              type="text"
              placeholder="E.g., Photosynthesis, World War II, Linear Algebra..."
              value={formData.topic}
              onChange={(e) => updateFormData('topic', e.target.value)}
            />
            <Form.Text className="text-muted">
              Enter a specific topic to generate quiz questions about.
            </Form.Text>
          </Form.Group>
        );
      
      case 'text':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Enter Text</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              placeholder="Paste or type text content here..."
              value={formData.text}
              onChange={(e) => updateFormData('text', e.target.value)}
            />
            <Form.Text className="text-muted">
              Enter text content from which quiz questions will be generated.
            </Form.Text>
          </Form.Group>
        );
      
      case 'webpage':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Enter URL</Form.Label>
            <Form.Control
              type="url"
              placeholder="https://example.com/article"
              value={formData.url}
              onChange={(e) => updateFormData('url', e.target.value)}
            />
            <Form.Text className="text-muted">
              Enter a webpage URL to extract content for quiz generation.
            </Form.Text>
          </Form.Group>
        );
      
      case 'document':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Upload Document</Form.Label>
            <FileUploader />
            <Form.Text className="text-muted">
              Upload a document (PDF, DOC, DOCX, TXT) to generate quiz questions.
            </Form.Text>
          </Form.Group>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="mb-4">
      <h5>Quiz Input</h5>
      {renderInputSection()}
    </div>
  );
};

export default QuizInputSection;
