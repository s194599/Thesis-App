import React, { useState } from 'react';
import './QuizCreator.css';

const QuizCreator = () => {
  const [activeInputType, setActiveInputType] = useState('topic');
  const [formData, setFormData] = useState({
    topic: '',
    text: '',
    webpage: '',
    document: null,
    questionType: 'multiple-choice',
    studentLevel: '',
    additionalInstructions: '',
    outputLanguage: 'danish'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      document: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      const response = await fetch('http://localhost:5000/generate-quiz', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();
      console.log('Quiz generated:', data);
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="quiz-creator">
      <h1>Create Quiz</h1>
      
      <div className="input-type-selector">
        <button 
          className={`input-type-btn ${activeInputType === 'topic' ? 'active' : ''}`}
          onClick={() => setActiveInputType('topic')}
        >
          <i className="icon-topic"></i> Topic
        </button>
        <button 
          className={`input-type-btn ${activeInputType === 'text' ? 'active' : ''}`}
          onClick={() => setActiveInputType('text')}
        >
          <i className="icon-text"></i> Text
        </button>
        <button 
          className={`input-type-btn ${activeInputType === 'webpage' ? 'active' : ''}`}
          onClick={() => setActiveInputType('webpage')}
        >
          <i className="icon-webpage"></i> Webpage
        </button>
        <button 
          className={`input-type-btn ${activeInputType === 'document' ? 'active' : ''}`}
          onClick={() => setActiveInputType('document')}
        >
          <i className="icon-document"></i> Document
        </button>
      </div>

      <form onSubmit={handleSubmit} className="quiz-form">
        <div className="input-section">
          {activeInputType === 'topic' && (
            <div className="form-group">
              <label>Your topic</label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                placeholder="e.g., Photosynthesis"
              />
            </div>
          )}

          {activeInputType === 'text' && (
            <div className="form-group">
              <label>Enter your text</label>
              <textarea
                name="text"
                value={formData.text}
                onChange={handleInputChange}
                placeholder="Paste or type your text here"
              />
            </div>
          )}

          {activeInputType === 'webpage' && (
            <div className="form-group">
              <label>Webpage URL</label>
              <input
                type="url"
                name="webpage"
                value={formData.webpage}
                onChange={handleInputChange}
                placeholder="https://example.com"
              />
            </div>
          )}

          {activeInputType === 'document' && (
            <div className="form-group">
              <label>Upload Document</label>
              <input
                type="file"
                name="document"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Question type</label>
            <select
              name="questionType"
              value={formData.questionType}
              onChange={handleInputChange}
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True/False</option>
              <option value="short-answer">Short Answer</option>
            </select>
          </div>

          <div className="form-group">
            <label>Student level (optional)</label>
            <select
              name="studentLevel"
              value={formData.studentLevel}
              onChange={handleInputChange}
            >
              <option value="">Select level</option>
              <option value="6th">6th Grade</option>
              <option value="7th">7th Grade</option>
              <option value="8th">8th Grade</option>
              <option value="9th">9th Grade</option>
              <option value="high-school">High School</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Additional instructions (optional)</label>
          <textarea
            name="additionalInstructions"
            value={formData.additionalInstructions}
            onChange={handleInputChange}
            placeholder="Include application-based questions to challenge students. Add hints or scaffolding for below-grade-level questions."
          />
        </div>

        <div className="form-group">
          <label>Output language</label>
          <select
            name="outputLanguage"
            value={formData.outputLanguage}
            onChange={handleInputChange}
          >
            <option value="danish">Danish</option>
            <option value="english">English</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="generate-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading-spinner">Generating...</span>
          ) : (
            'Generate quiz'
          )}
        </button>
      </form>
    </div>
  );
};

export default QuizCreator; 